import type { Metadata } from "next";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { Card, Button, Section, SectionHead } from "@/app/components/mk/ui";
import { PLANS } from "@/lib/marketing/plans";
import { CennikPlany } from "@/app/components/ld/cennik-plany";
import { PdHero, PdRozwinOkno, PdPas } from "@/app/components/ld/podstrona";
import { zdjecie } from "@/lib/marketing/zdjecia-podstron";
import { CENNIK_KREDYTOW, KREDYTY_NA_AGENTA, NAZWY_OPERACJI, KREDYTY_ZA_MINUTE_GLOSU } from "@/lib/kredyty-cennik";
import { kategorieZModulami } from "@/lib/marketing/modules";
import { nowaStrona } from "@/lib/marketing/nowa-strona";
import { DNI_PROBNE, PAKIETY_KREDYTOW } from "@/lib/abonament-cennik";
import Link from "next/link";
import { SITE_ADDON } from "@/lib/site/addon";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.cennik.meta;
  return pageMetadata(locale, "/cennik", t.title, t.description);
}

export default async function CennikPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const dict = getDict(locale);
  const t = dict.pages.cennik;
  const pl = locale === "pl";
  const ns = nowaStrona(locale, DNI_PROBNE);
  // Wiersze porównania biorą się z list funkcji planów: bez osobnej tabeli, która mogłaby się rozjechać.
  const wiersze = PLANS.flatMap((p, i) =>
    p.features.filter((f) => !/^(Do \d+ agentów|Wszystko z|\d+ osób w cenie)/.test(f)).map((cecha) => ({ cecha, od: i })),
  );
  const operacje = (Object.entries(CENNIK_KREDYTOW) as [keyof typeof CENNIK_KREDYTOW, number][]).filter(([op]) => op !== "parsowanie_dokumentu" && op !== "klauzula");
  const moduly = kategorieZModulami(locale).flatMap((k) => k.moduly.map((m) => m.name));
  const href = (path: string) => localeHref(locale, path);
  // W tekstach cennika ceny wstawiamy przez znaczniki, żeby słownik nie
  // musiał wiedzieć, ile dziś kosztuje dodatek.
  const fill = (text: string) =>
    text
      .replace("{monthly}", String(SITE_ADDON.monthly))
      .replace("{yearly}", String(SITE_ADDON.yearly))
      .replace("{setup}", String(SITE_ADDON.setup));

  return (
    <div className="mk relative min-h-screen">
      <SiteNav lang={locale} />

      <PdHero
        wariant="okno"
        tlo={zdjecie("naglowek-cennik")}
        alt=""
        eyebrow={t.eyebrow}
        tytul={t.title}
        opis={t.lead}
      />

      {/* Plany z przełącznikiem okresu: ten sam klocek co na stronie głównej, więc kwoty się nie rozjadą. */}
      <div className="ld">
        <section className="ld-cennik ld-jasna" id="plany">
          <CennikPlany
            plany={PLANS.map((plan) => {
              const opis = dict.pricingWidget.plans.find((x) => x.id === plan.id) ?? dict.pricingWidget.plans[0];
              return { id: plan.id, price: plan.price, priceFrom: plan.priceFrom, name: opis.name, tagline: opis.tagline, features: opis.features };
            })}
            en={!pl}
            polecany={ns.cennik.polecany}
            wybierz={ns.cennik.wybierz}
            miesiac={ns.cennik.miesiac}
            od={ns.cennik.od}
          />
        </section>
      </div>

      {pl && (
        <>
          <section className="pd-sekcja">
            <div className="pd-ramka">
              <div className="pd-glowa">
                <p className="mk-eyebrow" data-pd="gora">Porównanie</p>
                <h2 data-pd="gora">Co dokładnie jest w każdym planie</h2>
                <p data-pd="gora">Każdy wyższy plan zawiera wszystko z niższego. Liczby kredytów AI są na osobę, a pula jest wspólna dla całego biura.</p>
              </div>
              <div className="pc-tabela" data-pd="gora">
                <table>
                  <thead>
                    <tr>
                      <th />
                      {PLANS.map((p) => (
                        <th key={p.id}>
                          {p.name}
                          <small>{p.priceFrom ? "od " : ""}{p.price} zł netto / mc</small>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Osoby w cenie</td>
                      {PLANS.map((p) => (
                        <td key={p.id}>{p.includedAgents ? `${p.includedAgents}, kolejna +${p.extraAgentPrice} zł` : `do ${p.maxAgents}`}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Kredyty AI na osobę miesięcznie</td>
                      {PLANS.map((p) => (
                        <td key={p.id}>{KREDYTY_NA_AGENTA[p.id] ?? "-"}</td>
                      ))}
                    </tr>
                    {wiersze.map((w) => (
                      <tr key={w.cecha}>
                        <td>{w.cecha}</td>
                        {PLANS.map((p, i) => (
                          <td key={p.id} className={i >= w.od ? "tak" : "nie"}>
                            {i >= w.od ? "✓" : "–"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="pd-sekcja pd-sekcja--ciasna">
            <div className="pd-ramka">
              <div className="pd-glowa pd-glowa--srodek">
                <p className="mk-eyebrow" data-pd="gora">Jeden program</p>
                <h2 data-pd="gora">CRM, oferty, umowy, prowizje i trening w jednym abonamencie</h2>
                <p data-pd="gora">Zamiast osobnego CRM, arkusza prowizji, generatora umów i szkoleń sprzedażowych: jedno logowanie i jedna baza danych biura.</p>
              </div>
            </div>
            <PdPas hasla={moduly.slice(0, Math.ceil(moduly.length / 2))} />
            <PdPas hasla={moduly.slice(Math.ceil(moduly.length / 2))} odwrotnie />
          </section>

          <section className="pd-sekcja">
            <div className="pd-ramka pc-ai">
              <div>
                <div className="pd-glowa">
                  <p className="mk-eyebrow" data-pd="gora">Kredyty AI</p>
                  <h2 data-pd="gora">Płacisz za AI tyle, ile zespół go używa</h2>
                  <p data-pd="gora">
                    Każdy plan ma miesięczną pulę kredytów. Zwykła sesja treningowa na piśmie to około 10 kredytów, minuta rozmowy głosowej {KREDYTY_ZA_MINUTE_GLOSU}. Gdy pula się skończy, dokupujesz pakiet albo czekasz do nowego miesiąca. Nic nie dolicza się samo.
                  </p>
                </div>
                <div className="pc-pakiety">
                  {PAKIETY_KREDYTOW.map((k, i) => (
                    <div key={k.id} className="pc-pakiet" data-pd="gora" style={{ "--d": `${i * 0.08}s` } as React.CSSProperties}>
                      <b>{k.kredyty.toLocaleString("pl-PL")} kredytów</b>
                      <span>{k.cena} zł netto</span>
                      <p>{k.opis}</p>
                    </div>
                  ))}
                </div>
              </div>
              <ul className="pc-operacje" data-pd="prawo">
                {operacje.map(([op, k]) => (
                  <li key={op}>
                    <span>{NAZWY_OPERACJI[op]}</span>
                    <b>
                      {k} {op === "coach_glos" ? "/ min" : ""}
                    </b>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <PdRozwinOkno
            src={zdjecie("rozwin-cennik")}
            alt="Kraków o zmierzchu"
            eyebrow="Bez niespodzianek"
            tytul={`${DNI_PROBNE} dni za darmo, potem decydujesz`}
            tekst="Pełny dostęp bez karty przy rejestracji. Przeniesienie bazy klientów z Excela albo poprzedniego systemu robimy razem z Tobą w ramach wdrożenia."
          />
        </>
      )}

      {!pl && (
        <Section className="pt-4">
          <p className="text-center text-[var(--color-mk-muted)]">{t.lead}</p>
        </Section>
      )}

      <Section>
        <SectionHead
          eyebrow={t.addon.eyebrow}
          title={t.addon.title}
          lead={t.addon.lead}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-4 sm:grid-cols-2">
            {t.addon.includes.map((item) => (
              <Card key={item.title} className="h-full p-6">
                <h4 className="mb-2 text-lg text-[var(--color-mk-text)]">{item.title}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">{item.body}</p>
              </Card>
            ))}
          </div>

          <Card className="h-full p-8">
            <p className="text-[0.9375rem] text-[var(--color-mk-muted)]">{t.addon.subscription}</p>
            <p className="mt-2 text-4xl font-medium text-[var(--color-mk-text)]">
              {SITE_ADDON.monthly} zł
              <span className="text-base font-normal text-[var(--color-mk-muted)]"> {t.addon.perMonth}</span>
            </p>
            <p className="mt-3 text-[0.9375rem] text-[var(--color-mk-muted)]">
              {fill(t.addon.yearNote)}
            </p>
            <p className="mt-6 border-t border-[var(--color-mk-line)] pt-6 text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
              {fill(t.addon.setupNote)}
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button href={href("/wzory")}>{t.addon.ctaTemplates}</Button>
              <Link
                href={`${href("/kontakt")}?temat=strona-www`}
                className="rounded-xl border border-[var(--color-mk-line)] px-5 py-3 text-center text-[0.9375rem] font-medium text-[var(--color-mk-text)] transition hover:border-[var(--color-mk-line-lit)]"
              >
                {t.addon.ctaPreview}
              </Link>
            </div>
          </Card>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHead eyebrow={t.faq.eyebrow} title={t.faq.title} />

          <div className="mt-12">
            {t.faq.items.map((item, i) => (
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
                    {fill(item.a)}
                  </p>
                </details>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section className="pb-32">
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[20ch]">{t.cta.title}</h2>
          <p className="mt-5 max-w-[46ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
            {t.cta.lead}
          </p>
          <div className="mt-10">
            <Button href={href("/kontakt")}>{t.cta.button}</Button>
          </div>
        </div>
      </Section>

      <SiteFooter lang={locale} />
    </div>
  );
}
