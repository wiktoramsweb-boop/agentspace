import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PageHero } from "@/app/components/page-hero";
import { Button, Section } from "@/app/components/mk/ui";
import { kategorieZModulami } from "@/lib/marketing/modules";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";

const META = {
  pl: {
    title: "Moduły systemu dla biura nieruchomości | AgentSpace",
    description:
      "Szesnaście modułów w jednym systemie: CRM, leady, oferty, prowizje, faktury, umowy, cele, raporty i strona internetowa biura. Zobacz, co dokładnie robi każdy z nich.",
  },
  en: {
    title: "Modules of the real estate agency system | AgentSpace",
    description:
      "Sixteen modules in one system: CRM, leads, listings, commissions, invoices, contracts, goals, reports and the agency website. See exactly what each one does.",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  const m = META[locale];
  return pageMetadata(locale, "/produkt", m.title, m.description);
}

export default async function ProduktIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = toLocale((await params).lang);
  const d = getDict(locale);
  const href = (path: string) => localeHref(locale, path);
  const kategorie = kategorieZModulami(locale);
  const pl = locale === "pl";
  const adres = (slug: string) => href(slug === "strona-www" ? "/wzory" : `/produkt/${slug}`);

  return (
    <div className="mk relative min-h-screen">
      <SiteNav lang={locale} />

      <PageHero
        eyebrow={pl ? "Moduły" : "Modules"}
        title={
          pl ? (
            <>
              Szesnaście narzędzi biura, <span className="grad">jeden system</span>
            </>
          ) : (
            <>
              Sixteen agency tools, <span className="grad">one system</span>
            </>
          )
        }
        description={
          pl
            ? "Każdy moduł ma własną stronę z opisem, możliwościami i odpowiedziami na pytania, które padają najczęściej. Nie musisz wdrażać wszystkiego naraz."
            : "Every module has its own page with the details, the features and the questions people actually ask. You do not have to roll out everything at once."
        }
      >
        <Button href={href("/kontakt")}>{d.common.bookCall}</Button>
      </PageHero>

      {kategorie.map((k) => (
        <Section key={k.id}>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--mk-hairline)] pb-5">
            <div>
              <h2 className="text-[clamp(1.5rem,2.6vw,2rem)]">{k.label}</h2>
              <p className="mt-2 max-w-[60ch] text-[0.9375rem] text-[var(--color-mk-muted)]">{k.opis}</p>
            </div>
            <span className="font-mono text-xs tabular-nums text-[var(--color-mk-muted)]">
              {String(k.moduly.length).padStart(2, "0")}
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {k.moduly.map((m) => (
              <Link
                key={m.slug}
                href={adres(m.slug)}
                className="group flex flex-col overflow-hidden rounded-[20px] border border-[var(--mk-hairline)] bg-[var(--mk-surface-2)] transition-colors hover:border-[var(--mk-hairline-strong)]"
              >
                <div className="bg-ilustracja relative h-40 border-b border-[var(--mk-hairline)]">
                  <Image
                    src={m.ilustracja ?? m.photo}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={`transition-transform duration-700 group-hover:scale-105 ${
                      m.ilustracja ? "object-contain p-3" : "object-cover"
                    }`}
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="mb-2 text-lg">{m.name}</h3>
                  <p className="text-[0.875rem] leading-relaxed text-[var(--color-mk-muted)]">{m.lead}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--mk-accent-text)]">
                    {d.common.seeModule}
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path d="M3 10h13m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      ))}

      <SiteFooter lang={locale} />
    </div>
  );
}
