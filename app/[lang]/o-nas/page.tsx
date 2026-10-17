import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import Image from "next/image";
import { PageHero } from "@/app/components/page-hero";
import { PdHero, PdLiczby, PdRozwinKolo } from "@/app/components/ld/podstrona";
import { zdjecie } from "@/lib/marketing/zdjecia-podstron";
import { MODULES } from "@/lib/marketing/modules";
import { TECHNIKI } from "@/lib/techniki/techniki";
import { SKRYPTY } from "@/lib/techniki/skrypty";
import { Timeline } from "@/app/components/timeline";
import { FadeIn, StaggerContainer, StaggerItem } from "@/app/components/fade-in";
import { TiltCard } from "@/app/components/effects/tilt-card";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.onas.meta;
  return pageMetadata(locale, "/o-nas", t.title, t.description);
}

export default async function ONas({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.onas;

  if (locale !== "pl") return <ONasStara t={t} locale={locale} />;

  const dzialaDzis = [
    { tytul: "CRM, oferty, leady i poszukiwania", tekst: "Jedna baza klientów i nieruchomości biura, leady z formularzy i portali, dopasowanie ofert do kupujących." },
    { tytul: "Umowy, protokoły i świadectwa energetyczne", tekst: "Dokumenty z danych klienta i oferty w PDF, a świadectwo energetyczne zamawiasz prosto z karty nieruchomości." },
    { tytul: "Wycena z aktów notarialnych", tekst: "Ceny transakcyjne z Rejestru Cen Nieruchomości z korektami za piętro, stan i budynek, z raportem PDF dla właściciela." },
    { tytul: "AI Coach i biblioteka technik", tekst: `Trening rozmów z klientem AI głosem albo na piśmie, ${TECHNIKI.length} technik i ${SKRYPTY.length} skryptów rozmów z treningiem jednym kliknięciem.` },
    { tytul: "Dyżur AI", tekst: "Asystentka głosowa odbiera telefony, których agent nie odebrał, i zapisuje lead z notatką z rozmowy." },
    { tytul: "Prowizje, faktury i wynik biura", tekst: "Rozliczenie prowizji agentów, faktury, koszty i wynik miesiąca z paczką dla księgowej." },
  ];

  return (
    <>
      <SiteNav lang={locale} />
      <main className="mk relative min-h-screen">
        <PdHero wariant="pelny" tlo={zdjecie("naglowek-o-nas")} alt={t.hero.photoAlt} eyebrow={t.hero.eyebrow} tytul={t.hero.title} opis={t.hero.description} podpis={t.hero.photoCaption} />

        <section className="pd-sekcja">
          <div className="pd-ramka on-historia">
            <figure className="pd-zdjecie on-historia__foto" data-pd="maska">
              <div data-pd-paralaksa="0.08">
                <Image src={zdjecie("o-nas-poczatek")} alt="Biuro Spectra Nieruchomości w Krakowie" fill sizes="(max-width: 900px) 100vw, 40vw" className="object-cover" />
              </div>
            </figure>
            <div>
              <p className="mk-eyebrow" data-pd="gora">{t.founderLabel} · {t.founderName}</p>
              <h2 data-pd="gora" style={{ "--d": "0.08s" } as React.CSSProperties}>Program napisany w działającym biurze nieruchomości</h2>
              <div className="on-historia__tekst">
                {t.founderParagraphs.map((akapit, i) => (
                  <p key={akapit.slice(0, 24)} data-pd="gora" style={{ "--d": `${0.12 + i * 0.08}s` } as React.CSSProperties}>
                    {akapit}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pd-sekcja pd-sekcja--ciasna">
          <div className="pd-ramka">
            <PdLiczby
              liczby={[
                { wartosc: MODULES.length, opis: "modułów w jednym programie" },
                { wartosc: 24, opis: "scenariusze rozmów w AI Coachu" },
                { wartosc: TECHNIKI.length, opis: "technik rozmowy z przykładami" },
                { wartosc: 8, opis: "wzorów stron www dla biur" },
              ]}
            />
          </div>
        </section>

        <PdRozwinKolo
          src={zdjecie("rozwin-o-nas")}
          alt="Zespół biura nieruchomości przy wspólnym stole"
          lewa="Z biura"
          prawa="dla biur"
          cytat="Każda funkcja najpierw działa u nas, w Spectrze. Dopiero kiedy pomaga agentom w prawdziwej pracy, trafia do Ciebie."
        />

        <section className="pd-sekcja">
          <div className="pd-ramka on-zasady">
            <div className="on-zasady__glowa">
              <p className="mk-eyebrow" data-pd="gora">{t.principles.eyebrow}</p>
              <h2 data-pd="gora">{t.principles.title}</h2>
            </div>
            <ol className="on-karty">
              {t.principles.items.map((z, i) => (
                <li key={z.title} style={{ "--i": i } as React.CSSProperties}>
                  <span className="on-karty__nr">{z.number}</span>
                  <h3>{z.title}</h3>
                  <p>{z.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="pd-sekcja">
          <div className="pd-ramka on-dzis">
            <div>
              <div className="pd-glowa">
                <p className="mk-eyebrow" data-pd="gora">Działa dziś</p>
                <h2 data-pd="gora">Jeden program, w którym biuro ma wszystko w jednym miejscu</h2>
                <p data-pd="gora">Nie zestaw aplikacji połączonych arkuszem, tylko jedna baza, jedno logowanie i jeden abonament.</p>
              </div>
              <ul className="on-dzis__lista">
                {dzialaDzis.map((x, i) => (
                  <li key={x.tytul} data-pd="lewo" style={{ "--d": `${i * 0.06}s` } as React.CSSProperties}>
                    <b>{x.tytul}</b>
                    <span>{x.tekst}</span>
                  </li>
                ))}
              </ul>
            </div>
            <figure className="pd-zdjecie on-dzis__foto" data-pd="skala">
              <div data-pd-paralaksa="0.1">
                <Image src={zdjecie("o-nas-dzis")} alt="Agent pokazuje klientce aplikację" fill sizes="(max-width: 900px) 100vw, 40vw" className="object-cover" />
              </div>
            </figure>
          </div>
        </section>

        <section className="pd-sekcja">
          <div className="pd-ramka" style={{ maxWidth: 900 }}>
            <div className="pd-glowa">
              <p className="mk-eyebrow" data-pd="gora">{t.roadmap.eyebrow}</p>
              <h2 data-pd="gora">Następne w kolejce</h2>
            </div>
            <Timeline items={t.roadmap.items.filter((x) => x.period !== "Działa dziś")} />
          </div>
        </section>

        <section className="pd-sekcja">
          <div className="pd-ramka">
            <div className="pm-dla" data-pd="skala">
              <p className="mk-eyebrow">{t.cta.button.replace(" →", "")}</p>
              <div>
                <p className="pm-dla__tekst">{t.cta.title}. {t.cta.lead}</p>
                <Link href={localeHref(locale, "/kontakt")} className="mk-btn mt-6">
                  {t.cta.button}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter lang={locale} />
    </>
  );
}

/** Wersja angielska zostaje w dotychczasowym układzie: nowa treść jest na razie tylko po polsku. */
function ONasStara({ t, locale }: { t: ReturnType<typeof getDict>["pages"]["onas"]; locale: "pl" | "en" }) {
  return (
    <>
      <SiteNav lang={locale} />
      <main className="mk relative min-h-screen">
        <PageHero
          eyebrow={t.hero.eyebrow}
          title={t.hero.title}
          description={t.hero.description}
          photo={{ src: "/biuro/brama.jpg", alt: t.hero.photoAlt, caption: t.hero.photoCaption }}
        />

        {/* Founder story */}
        <section className="border-b border-[var(--mk-hairline)] px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <TiltCard className="rounded-3xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] p-8 md:p-12">
                <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start md:gap-12">
                  {/* Avatar - duży, animowany glow */}
                  <div className="flex justify-center md:justify-start">
                    <div className="relative">
                      {/* Outer glow rings */}
                      <div className="absolute inset-0 -m-4 animate-pulse rounded-full hidden" />
                      <div className="absolute inset-0 -m-2 rounded-full hidden" />

                      {/* Main avatar */}
                      <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-[var(--color-mk-accent)] text-5xl font-bold text-[var(--mk-on-accent)] shadow-2xl">
                        W
                      </div>

                      {/* Online dot */}
                      <div className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-mk-bg)]">
                        <div className="relative h-3 w-3">
                          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <div className="relative h-3 w-3 rounded-full bg-emerald-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quote */}
                  <div>
                    <p className="mb-2 text-sm font-medium uppercase tracking-[0.15em] text-emerald-400">
                      {t.founderLabel}
                    </p>
                    <h2 className="mb-4 text-2xl font-semibold text-[var(--color-mk-text)] md:text-3xl">
                      {t.founderName}
                    </h2>
                    <div className="space-y-4 leading-relaxed text-[var(--color-mk-text)]">
                      {t.founderParagraphs.map((paragraph) => (
                        <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </TiltCard>
            </FadeIn>
          </div>
        </section>

        {/* Filozofia */}
        <section className="border-b border-[var(--mk-hairline)] px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <div className="mb-12 max-w-2xl">
                <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                  {t.principles.eyebrow}
                </p>
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {t.principles.title}
                </h2>
              </div>
            </FadeIn>

            <StaggerContainer className="grid gap-6 md:grid-cols-2" staggerDelay={0.1}>
              {t.principles.items.map((principle) => (
                <StaggerItem key={principle.title}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] p-8 transition-all hover:border-emerald-500/30 hover:bg-[var(--mk-card-bg)]">
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl transition-all duration-500 group-hover:bg-emerald-500/10" />

                    <div className="relative">
                      <p className="mb-4 text-5xl font-semibold text-[var(--mk-accent-text)]">
                        {principle.number}
                      </p>
                      <h3 className="mb-3 text-xl font-semibold text-[var(--color-mk-text)]">
                        {principle.title}
                      </h3>
                      <p className="leading-relaxed text-[var(--color-mk-muted)]">{principle.body}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Roadmap - animowany timeline */}
        <section className="border-b border-[var(--mk-hairline)] px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl">
            <FadeIn>
              <div className="mb-12 max-w-2xl">
                <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                  {t.roadmap.eyebrow}
                </p>
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {t.roadmap.title}
                </h2>
              </div>
            </FadeIn>

            <Timeline items={t.roadmap.items} />
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
          <FadeIn>
            <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/30 bg-[var(--mk-card-bg)] p-8 text-center md:p-12">
              <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
                {t.cta.title}
              </h2>
              <p className="mb-8 text-[var(--color-mk-muted)]">
                {t.cta.lead}
              </p>
              <Link
                href={localeHref(locale, "/kontakt")}
                className="inline-flex items-center rounded-xl bg-emerald-500 px-8 py-4 font-semibold text-[var(--mk-on-accent)] transition hover:bg-emerald-400"
              >
                {t.cta.button}
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>
      <SiteFooter lang={locale} />
    </>
  );
}
