import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PdHero, PdPas } from "@/app/components/ld/podstrona";
import { zdjecie } from "@/lib/marketing/zdjecia-podstron";
import { UKLADY } from "./uklady";
import { CoachLive } from "@/app/components/mk/coach-live";
import { TECHNIKI } from "@/lib/techniki/techniki";
import { SKRYPTY } from "@/lib/techniki/skrypty";
import { Card, Button, Section, SectionHead } from "@/app/components/mk/ui";
import { MODULES, getModule, kategoriaModulu } from "@/lib/marketing/modules";
import { ShotFor } from "@/app/components/mk/shot-for";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";

export function generateStaticParams() {
  // strona-www ma wlasna trase z przekierowaniem na /wzory.
  return MODULES.filter((m) => m.slug !== "strona-www").map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = toLocale(lang);
  const mod = getModule(slug, locale);
  if (!mod) return {};

  return pageMetadata(locale, `/produkt/${slug}`, mod.seoTitle, mod.seoDescription);
}

export default async function ProduktPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = toLocale(lang);
  const mod = getModule(slug, locale);
  if (!mod) notFound();

  const d = getDict(locale);
  const t = d.pages.produkt;
  const href = (path: string) => localeHref(locale, path);
  const grupa = kategoriaModulu(slug, locale);
  // Pokazujemy moduły z tej samej grupy, a nie wszystkie pozostałe. Piętnaście
  // kafelków na końcu każdej podstrony to była druga strona główna, nie podpowiedź.
  const others = grupa?.sasiedzi ?? [];
  // Strona internetowa biura ma własną, bogatszą stronę z ośmioma wzorami,
  // więc kafelek prowadzi tam, a nie na uboższy opis modułu.
  const innyHref = (s: string) => (s === "strona-www" ? "/wzory" : `/produkt/${s}`);

  const okruszki = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: t.home, url: `https://agentspace.pl${localeHref(locale, "/")}` },
      { name: t.modules, url: `https://agentspace.pl${localeHref(locale, "/produkt")}` },
      { name: mod.name, url: `https://agentspace.pl${localeHref(locale, `/produkt/${slug}`)}` },
    ].map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };

  // Każdy moduł ma swój nagłówek i układ treści, dobierane po kolejności w katalogu.
  const nr = Math.max(0, MODULES.findIndex((m) => m.slug === slug));
  const wariant = (["pelny", "pas", "okno"] as const)[nr % 3];
  const Uklad = UKLADY[nr % UKLADY.length];
  const pl = locale === "pl";

  return (
    <div className="mk relative min-h-screen">
      <SiteNav lang={locale} />

      <script
        type="application/ld+json"
        // JSON-LD wymaga dangerouslySetInnerHTML. Treść składamy sami z katalogu
        // modułów, więc nie ma tu danych od użytkownika.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(okruszki) }}
      />

      <PdHero
        wariant={wariant}
        tlo={zdjecie(`naglowek-${slug}`)}
        alt={mod.name}
        eyebrow={`${t.moduleLabel} · ${mod.name}`}
        tytul={mod.headline}
        opis={mod.lead}
        dol={
          <div className="flex flex-col gap-4">
            <nav aria-label={t.modules} className="pm-okruszki">
              <Link href={href("/")}>{t.home}</Link>
              <span aria-hidden="true">/</span>
              <Link href={href("/produkt")}>{t.modules}</Link>
              <span aria-hidden="true">/</span>
              <span className="text-white">{mod.name}</span>
            </nav>
            <p className="pm-fakty">
              <span>
                <b>{mod.capabilities.length}</b> {t.capabilitiesLabel}
              </span>
              <span>
                {t.inGroup}: <b>{grupa?.label ?? "-"}</b>
              </span>
              <span>
                {t.faqEyebrow}: <b>{mod.faq.length}</b>
              </span>
            </p>
          </div>
        }
      >
        <Button href="/signup">{getDict(locale).nav.cta}</Button>
        <Button href={href("/kontakt")} variant="ghost">{t.cta}</Button>
      </PdHero>

      <Uklad mod={mod} lang={locale} scena={zdjecie(`scena-${slug}`)} t={t} />

      {slug === "ai-coach" && pl && (
        <>
          <section className="pd-sekcja">
            <div className="pd-ramka">
              <div className="pd-glowa pd-glowa--srodek">
                <p className="mk-eyebrow" data-pd="gora">Na żywo</p>
                <h2 data-pd="gora">Tak wygląda rozmowa z klientem AI</h2>
                <p data-pd="gora">Klient odpowiada jak prawdziwy właściciel albo kupujący: przerywa, wątpi, rzuca obiekcję. Po rozmowie dostajesz ocenę i konkretne poprawki.</p>
              </div>
              <div data-pd="skala">
                <CoachLive t={getDict(locale).coach} />
              </div>
            </div>
          </section>
          <section className="pd-sekcja">
            <div className="pd-ramka">
              <div className="pd-glowa">
                <p className="mk-eyebrow" data-pd="gora">Biblioteka technik</p>
                <h2 data-pd="gora">{TECHNIKI.length} technik i {SKRYPTY.length} skryptów, każdy z treningiem</h2>
                <p data-pd="gora">SPIN, kotwiczenie, izolacja obiekcji, pytania kalibrowane Vossa, reguły Cialdiniego. Każda technika ma dialogi z rynku nieruchomości i przycisk „trenuj teraz”.</p>
              </div>
            </div>
            <PdPas hasla={TECHNIKI.slice(0, 18).map((x) => x.nazwa)} />
            <PdPas hasla={TECHNIKI.slice(18).map((x) => x.nazwa)} odwrotnie />
            <div className="pd-ramka mt-10 flex justify-center">
              <Button href={href("/produkt/biblioteka-technik")} variant="ghost">Zobacz bibliotekę technik</Button>
            </div>
          </section>
        </>
      )}

      {/* Pytania o ten moduł */}
      {mod.faq.length > 0 && (
        <Section>
          <SectionHead eyebrow={t.faqEyebrow} title={t.faqTitle} lead={t.faqLead} />
          <div className="mx-auto mt-12 max-w-3xl">
            {mod.faq.map((item, i) => (
              <Card key={item.q} className={i > 0 ? "border-t-0" : ""}>
                <details className="group px-6 py-5 md:px-8">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[1.0625rem] font-medium text-[var(--color-mk-text)]">
                    {item.q}
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5 flex-shrink-0 text-[var(--color-mk-muted)] transition-transform duration-200 group-open:rotate-180"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M5 7.5 10 12.5 15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </summary>
                  <p className="mt-4 max-w-[62ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                    {item.a}
                  </p>
                </details>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Pozostałe moduły */}
      <Section>
        <SectionHead
          eyebrow={t.restEyebrow}
          title={grupa?.label ?? t.restTitle}
          lead={grupa?.opis ?? t.restLead}
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {others.map((other) => (
            <Link key={other.slug} href={href(innyHref(other.slug))} className="group/kafel">
              <Card className="h-full overflow-hidden p-0">
                <div className="h-40 overflow-hidden border-b border-[var(--mk-hairline)] bg-slate-100">
                  <div className="origin-top-left scale-[0.62] [width:161%]">
                    <ShotFor shot={other.shot} lang={locale} />
                  </div>
                </div>
                <div className="p-6">
                  <p className="mb-2 text-[1.1875rem] font-semibold tracking-tight text-[var(--color-mk-text)]">
                    {other.name}
                  </p>
                  <p className="text-[0.9375rem] leading-snug text-[var(--color-mk-text)] opacity-80">
                    {other.headline}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href={href("/produkt")}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--mk-hairline-strong)] px-5 py-2.5 text-sm font-medium text-[var(--color-mk-text)] transition-colors hover:bg-[var(--mk-surface-3)]"
          >
            {d.nav.allModules}
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
              <path d="M3 10h13m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </Section>

      <Section className="pb-32">
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[22ch]">{t.ctaTitle}</h2>
          <p className="mt-5 max-w-[50ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
            {t.ctaLead.replace("{name}", mod.name.toLowerCase())}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button href="/signup">{getDict(locale).nav.cta}</Button>
            <Button href={href("/kontakt")} variant="ghost">{t.cta}</Button>
          </div>
        </div>
      </Section>

      <SiteFooter lang={locale} />
    </div>
  );
}
