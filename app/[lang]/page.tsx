import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { FadeIn } from "@/app/components/fade-in";
import { BrowserShot, ShotTabs } from "@/app/components/mk/showcase";
import {
  ShotCele, ShotDokumenty, ShotKalendarz, ShotKlient, ShotOferty, ShotPanel, ShotProwizje, ShotPulpit,
} from "@/app/components/mockups/light-shots";
import { CoachLive } from "@/app/components/mk/coach-live";
import { ModulesExplorer } from "@/app/components/mk/modules-explorer";
import { Pricing } from "@/app/components/mk/pricing";
import { Tick } from "@/app/components/mk/ui";
import { SlotZdjecia } from "@/app/components/mk/slot-zdjecia";
import { kategorieZModulami } from "@/lib/marketing/modules";
import { trescStronyGlownej } from "@/lib/marketing/strona-glowna";
import { OPINIE } from "@/lib/marketing/opinie";
import { DNI_PROBNE } from "@/lib/abonament-cennik";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  const t = trescStronyGlownej(locale, DNI_PROBNE).meta;
  return pageMetadata(locale, "/", t.title, t.description);
}

/**
 * Formularz próbny: zwykły formularz GET do /signup z adresem e-mail.
 * Działa bez JavaScriptu, a rejestracja przejmuje adres z linku.
 */
function FormularzProby({ pole, przycisk, id }: { pole: string; przycisk: string; id: string }) {
  return (
    <form action="/signup" method="get" className="flex w-full max-w-[34rem] flex-col gap-2 sm:flex-row">
      <label htmlFor={id} className="sr-only">{pole}</label>
      <input
        id={id}
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder={pole}
        className="h-12 w-full min-w-0 rounded-xl sm:w-auto sm:flex-1 border border-[var(--mk-hairline-strong)] bg-[var(--mk-card-bg)] px-4 text-[1rem] text-[var(--color-mk-text)] placeholder:text-[var(--color-mk-muted)] focus:border-[var(--color-mk-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mk-accent-soft)]"
      />
      <button
        type="submit"
        className="h-12 flex-shrink-0 rounded-xl bg-[var(--color-mk-accent)] px-6 text-[1rem] font-semibold text-[var(--mk-on-accent)] transition-colors hover:bg-[var(--mk-accent-text)]"
      >
        {przycisk}
      </button>
    </form>
  );
}

function Naglowek({ etykieta, tytul, lead, className = "" }: { etykieta: string; tytul: string; lead?: string; className?: string }) {
  return (
    <div className={`max-w-[46rem] ${className}`}>
      <p className="mk-eyebrow mb-3">{etykieta}</p>
      <h2>{tytul}</h2>
      {lead && <p className="mt-4 max-w-[62ch] text-[1.0625rem] leading-relaxed">{lead}</p>}
    </div>
  );
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const locale = toLocale((await params).lang);
  const d = getDict(locale);
  const t = trescStronyGlownej(locale, DNI_PROBNE);
  const href = (path: string) => localeHref(locale, path);

  const ekrany: Record<string, React.ReactNode> = {
    pulpit: <ShotPulpit lang={locale} />,
    nieruchomosci: <ShotOferty lang={locale} />,
    klienci: <ShotKlient lang={locale} />,
    cele: <ShotCele lang={locale} />,
    kalendarz: <ShotKalendarz lang={locale} />,
    prowizje: <ShotProwizje lang={locale} />,
    dokumenty: <ShotDokumenty lang={locale} />,
    zespol: <ShotPanel lang={locale} />,
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.pozycje.map((p) => ({ "@type": "Question", name: p.q, acceptedAnswer: { "@type": "Answer", text: p.a } })),
  };

  return (
    <div className="mk relative min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <SiteNav lang={locale} />

      {/* ── HERO: obietnica, próba za darmo, prawdziwy ekran ── */}
      <section className="px-5 pb-16 pt-[112px] md:px-6 md:pb-24 md:pt-[136px]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
          <div>
            <h1 className="max-w-[16ch]">{t.hero.tytul}</h1>
            <p className="mt-6 max-w-[50ch] text-[1.1875rem] leading-relaxed">{t.hero.lead}</p>
            <div className="mt-8">
              <FormularzProby id="email-hero" pole={t.hero.pole} przycisk={t.hero.przycisk} />
              <p className="mt-3 max-w-[34rem] text-[0.9375rem] leading-relaxed">{t.hero.podPolem}</p>
              <p className="mt-4 text-[0.9375rem]">
                {t.hero.albo}{" "}
                <Link href={href("/kontakt")} className="font-semibold text-[var(--mk-accent-text)] underline decoration-1 underline-offset-4 hover:decoration-2">
                  {t.hero.alboLink}
                </Link>
              </p>
            </div>
          </div>
          <div className="relative">
            <BrowserShot label="agentspace.pl/app">
              <ShotPulpit lang={locale} />
            </BrowserShot>
          </div>
        </div>

        <ul className="mx-auto mt-16 grid max-w-[1200px] gap-6 border-t border-[var(--mk-hairline)] pt-8 md:grid-cols-3 md:gap-10">
          {t.hero.fakty.map((f) => (
            <li key={f.tytul}>
              <p className="font-semibold text-[var(--color-mk-text)]">{f.tytul}</p>
              <p className="mt-1 text-[0.9375rem] leading-relaxed">{f.tekst}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── DZIEŃ AGENTA: cztery momenty, zdjęcie i to, co robi program ── */}
      <section className="border-t border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] px-5 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-[1200px]">
          <Naglowek etykieta={t.dzien.etykieta} tytul={t.dzien.tytul} lead={t.dzien.lead} />
          <ol className="mt-14 space-y-16 md:space-y-24">
            {t.dzien.momenty.map((m, i) => (
              <li key={m.pora} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
                <FadeIn className={i % 2 ? "md:order-2" : ""}>
                  <SlotZdjecia id={m.zdjecie} lang={locale} />
                </FadeIn>
                <div>
                  <p className="font-[family-name:var(--font-sora)] text-sm font-semibold tabular-nums text-[var(--mk-accent-text)]">{m.pora}</p>
                  <h3 className="mt-2">{m.tytul}</h3>
                  <p className="mt-4 max-w-[52ch] leading-relaxed">{m.tekst}</p>
                  <ul className="mt-5 space-y-2">
                    {m.punkty.map((p) => (
                      <li key={p} className="flex gap-2.5 text-[0.9375rem] text-[var(--color-mk-text)]">
                        <Tick />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── W ŚRODKU: prawdziwe ekrany ── */}
      <section id="w-srodku" className="px-5 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-[1200px]">
          <Naglowek etykieta={t.srodek.etykieta} tytul={t.srodek.tytul} lead={t.srodek.lead} />
          <div className="mt-10">
            <ShotTabs tabs={d.home.inside.tabs.map((tab) => ({ ...tab, node: ekrany[tab.key] }))} />
          </div>
        </div>
      </section>

      {/* ── DLA WŁAŚCICIELA ── */}
      <section className="border-y border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] px-5 py-20 md:px-6 md:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <Naglowek etykieta={t.wlasciciel.etykieta} tytul={t.wlasciciel.tytul} lead={t.wlasciciel.lead} />
            <FadeIn className="mt-10">
              <SlotZdjecia id="wlasciciel" lang={locale} />
            </FadeIn>
          </div>
          <ul className="grid content-start gap-x-10 gap-y-8 sm:grid-cols-2 lg:pt-14">
            {t.wlasciciel.punkty.map((p) => (
              <li key={p.tytul} className="border-t border-[var(--mk-hairline-strong)] pt-4">
                <Link href={href(p.href)} className="group block">
                  <p className="font-semibold text-[var(--color-mk-text)] group-hover:text-[var(--mk-accent-text)]">{p.tytul}</p>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed">{p.tekst}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── AI COACH: rozmowa, która odtwarza się sama ── */}
      <section className="px-5 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-[1200px]">
          <CoachLive t={d.coach} />
          <div className="mt-12 rounded-xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] p-6 md:p-8">
            <p className="font-semibold text-[var(--color-mk-text)]">{t.coach.etykieta}: {locale === "en" ? "new in October" : "nowe w październiku"}</p>
            <ul className="mt-4 grid gap-4 md:grid-cols-3">
              {t.coach.nowosci.map((n) => (
                <li key={n} className="flex gap-2.5 text-[0.9375rem] leading-relaxed">
                  <Tick />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── MODUŁY ── */}
      <section id="moduly" className="border-t border-[var(--mk-hairline)] px-5 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-[1200px]">
          <Naglowek etykieta={t.moduly.etykieta} tytul={t.moduly.tytul} lead={t.moduly.lead} className="mb-10" />
          <ModulesExplorer
            kategorie={kategorieZModulami(locale).map((k) => ({
              id: k.id,
              label: k.label,
              opis: k.opis,
              moduly: k.moduly.map((m) => ({ slug: m.slug, name: m.name, lead: m.lead, ilustracja: m.ilustracja, photo: m.photo, ile: m.capabilities.length })),
            }))}
            lang={locale}
            t={{ seeModule: d.common.seeModule, all: d.common.allModules, capabilities: d.common.capabilitiesCount }}
          />
        </div>
      </section>

      {/* ── CO NOWEGO: dowód, że produkt żyje ── */}
      <section className="border-t border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] px-5 py-20 md:px-6 md:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Naglowek etykieta={t.nowosci.etykieta} tytul={t.nowosci.tytul} lead={t.nowosci.lead} />
          <ul className="divide-y divide-[var(--mk-hairline)] border-y border-[var(--mk-hairline)]">
            {t.nowosci.pozycje.map((p) => (
              <li key={p.tytul}>
                <Link href={href(p.href)} className="group flex items-baseline justify-between gap-6 py-4">
                  <span>
                    <span className="block font-semibold text-[var(--color-mk-text)] group-hover:text-[var(--mk-accent-text)]">{p.tytul}</span>
                    <span className="mt-0.5 block text-[0.9375rem] leading-relaxed">{p.tekst}</span>
                  </span>
                  <span aria-hidden="true" className="text-[var(--color-mk-muted)] transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── ZMIANA SYSTEMU ── */}
      <section className="px-5 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-[1200px]">
          <Naglowek etykieta={t.przejscie.etykieta} tytul={t.przejscie.tytul} lead={t.przejscie.lead} />
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {t.przejscie.kroki.map((k, i) => (
              <li key={k.tytul} className="border-l-2 border-[var(--color-mk-accent)] pl-5">
                <p className="font-[family-name:var(--font-sora)] text-sm font-semibold text-[var(--mk-accent-text)]">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-1 font-semibold text-[var(--color-mk-text)]">{k.tytul}</p>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed">{k.tekst}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <SlotZdjecia id="zespol-odprawa" lang={locale} sizes="(min-width: 1200px) 1200px, 100vw" className="max-h-[480px] w-full" />
          </div>
        </div>
      </section>

      {/* ── OPINIE: tylko prawdziwe ── */}
      <section className="border-t border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] px-5 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-[1200px]">
          <Naglowek etykieta={t.opinie.etykieta} tytul={t.opinie.tytul} lead={t.opinie.lead} />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <figure className="rounded-xl border border-[var(--mk-hairline)] p-7 md:p-9">
              <blockquote className="text-[1.1875rem] leading-relaxed text-[var(--color-mk-text)]">„{t.opinie.zalozyciel.cytat}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-4">
                {/* Tu ma stać prawdziwe zdjęcie Wiktora, nie wygenerowane: to podpis
                    pod cytatem, więc twarz musi być jego. Do tego czasu inicjały. */}
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-mk-accent-soft)] font-[family-name:var(--font-sora)] font-semibold text-[var(--mk-accent-text)]">
                  WS
                </span>
                <span>
                  <span className="block font-semibold text-[var(--color-mk-text)]">{t.opinie.zalozyciel.kto}</span>
                  <span className="block text-[0.875rem]">{t.opinie.zalozyciel.rola}</span>
                </span>
              </figcaption>
            </figure>
            {OPINIE.length === 0 ? (
              <div className="flex items-center rounded-xl border border-dashed border-[var(--mk-hairline-strong)] p-7 md:p-9">
                <p className="leading-relaxed">{t.opinie.brak}</p>
              </div>
            ) : (
              OPINIE.map((o) => (
                <figure key={o.imie + o.data} className="rounded-xl border border-[var(--mk-hairline)] p-7 md:p-9">
                  <blockquote className="text-[1.0625rem] leading-relaxed text-[var(--color-mk-text)]">„{o.tresc}”</blockquote>
                  <figcaption className="mt-6">
                    <span className="block font-semibold text-[var(--color-mk-text)]">{o.imie}</span>
                    <span className="block text-[0.875rem]">
                      {o.rola}, {o.biuro}, {o.miasto}
                      {o.miesiecy ? ` · ${o.miesiecy} mies. w AgentSpace` : ""}
                    </span>
                    {o.link && (
                      <a href={o.link} rel="nofollow noopener" target="_blank" className="mt-1 inline-block text-[0.8125rem] underline underline-offset-2">
                        {locale === "en" ? "See the original review" : "Zobacz oryginał opinii"}
                      </a>
                    )}
                  </figcaption>
                </figure>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── CENNIK ── */}
      <section id="cennik" className="px-5 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-[1200px]">
          <Naglowek etykieta={t.cennik.etykieta} tytul={t.cennik.tytul} lead={t.cennik.lead} className="mb-10" />
          <Pricing lang={locale} />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-t border-[var(--mk-hairline)] px-5 py-20 md:px-6 md:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          <Naglowek etykieta={t.faq.etykieta} tytul={t.faq.tytul} />
          <div className="divide-y divide-[var(--mk-hairline)] border-y border-[var(--mk-hairline)]">
            {t.faq.pozycje.map((p) => (
              <details key={p.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-semibold text-[var(--color-mk-text)]">
                  {p.q}
                  <span aria-hidden="true" className="mt-0.5 text-xl leading-none text-[var(--color-mk-muted)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-[64ch] leading-relaxed">{p.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── KONIEC: druga szansa na próbę ── */}
      <section className="px-5 pb-24 md:px-6 md:pb-32">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 overflow-hidden rounded-2xl bg-[#0f2a20] px-6 py-14 text-white md:px-14 md:py-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
          <div>
          <h2 className="max-w-[20ch] !text-white">{t.koniec.tytul}</h2>
          <p className="mt-4 max-w-[52ch] text-[1.0625rem] leading-relaxed text-white/80">{t.koniec.lead}</p>
          <div className="mt-8 [&_input]:border-white/20 [&_input]:bg-white [&_input]:text-[#14171a] [&_button]:bg-[#3ccf96] [&_button]:text-[#07140e] [&_button:hover]:bg-[#5ddcab]">
            <FormularzProby id="email-koniec" pole={t.hero.pole} przycisk={t.hero.przycisk} />
          </div>
          <p className="mt-4 text-[0.9375rem] text-white/70">
            {t.hero.albo}{" "}
            <Link href={href("/kontakt")} className="font-semibold text-white underline underline-offset-4">
              {t.hero.alboLink}
            </Link>
          </p>
          </div>
          <SlotZdjecia id="hero-teren" lang={locale} sizes="(min-width: 1024px) 380px, 100vw" className="hidden lg:block" />
        </div>
      </section>

      <SiteFooter lang={locale} />
    </div>
  );
}
