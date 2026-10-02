import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PageHero } from "@/app/components/page-hero";
import { FrameRule } from "@/app/components/mk/frame";
import { Card, Button, Section, SectionHead } from "@/app/components/mk/ui";
import { MODULES, getModule, kategoriaModulu } from "@/lib/marketing/modules";
import { BrowserShot } from "@/app/components/mk/showcase";
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

  return (
    <div className="mk relative min-h-screen">
      <SiteNav lang={locale} />

      <script
        type="application/ld+json"
        // JSON-LD wymaga dangerouslySetInnerHTML. Treść składamy sami z katalogu
        // modułów, więc nie ma tu danych od użytkownika.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(okruszki) }}
      />

      <PageHero
        eyebrow={`${t.moduleLabel} · ${mod.name}`}
        title={mod.headline}
        description={mod.lead}
      >
        <Button href={href("/kontakt")}>{t.cta}</Button>
      </PageHero>

      {/* Okruszki. Na podstronie modułu łatwo stracić orientację, gdzie się jest
          w produkcie, a to jedyna nawigacja prowadząca w górę do spisu. */}
      <div className="mx-auto max-w-[1080px] px-6">
        <nav aria-label={t.modules} className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-[var(--color-mk-muted)]">
          <Link href={href("/")} className="transition-colors hover:text-[var(--color-mk-text)]">
            {t.home}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={href("/produkt")} className="transition-colors hover:text-[var(--color-mk-text)]">
            {t.modules}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--color-mk-text)]">{mod.name}</span>
        </nav>
      </div>

      {/* Ekran z aplikacji. Opis modułu bez obrazka nie mówi nic o tym,
          jak to wygląda w pracy, a to pierwsze pytanie właściciela biura. */}
      <Section className="pt-10">
        <div className="mx-auto max-w-4xl">
          <BrowserShot tilt fit>
            <ShotFor shot={mod.shot} lang={locale} />
          </BrowserShot>
        </div>

        {/* Trzy fakty o module. Czytelnik skanuje stronę, zanim ją przeczyta,
            a sama makieta nie mówi, ile ten moduł właściwie potrafi. */}
        <div className="mx-auto mt-10 grid max-w-4xl gap-px overflow-hidden rounded-[18px] border border-[var(--mk-hairline)] bg-[var(--mk-hairline)] sm:grid-cols-3">
          <div className="bg-[var(--color-mk-bg)] px-6 py-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-mk-muted)]">
              {t.capabilitiesEyebrow}
            </p>
            <p className="mt-1.5 text-[1.0625rem] text-[var(--color-mk-text)]">
              {mod.capabilities.length} {t.capabilitiesLabel}
            </p>
          </div>
          <div className="bg-[var(--color-mk-bg)] px-6 py-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-mk-muted)]">
              {t.inGroup}
            </p>
            <p className="mt-1.5 text-[1.0625rem] text-[var(--color-mk-text)]">{grupa?.label ?? "-"}</p>
          </div>
          <div className="bg-[var(--color-mk-bg)] px-6 py-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-mk-muted)]">
              {t.faqEyebrow}
            </p>
            <p className="mt-1.5 text-[1.0625rem] text-[var(--color-mk-text)]">{mod.faq.length}</p>
          </div>
        </div>
      </Section>

      <FrameRule />

      {/* Problem */}
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16">
          <div>
            <SectionHead align="left" eyebrow={t.problemEyebrow} title={t.problemTitle} />
            <p className="mt-8 text-lg leading-relaxed text-[var(--color-mk-text)]">
              {mod.problem}
            </p>
          </div>
          {/* Ilustracje mają prawie czarne kontury, a strona domyślnie jest
              ciemna. Dlatego dostają własny jasny panel w obu motywach -
              inaczej w ciemnym zostają z nich same kolorowe plamy. */}
          <figure
            className={`relative m-0 aspect-[4/3] overflow-hidden rounded-[24px] border border-[var(--mk-hairline)] ${
              mod.ilustracja ? "bg-ilustracja" : ""
            }`}
          >
            <Image
              src={mod.ilustracja ?? mod.photo}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 44vw"
              className={mod.ilustracja ? "object-contain p-4 sm:p-6" : "object-cover"}
            />
          </figure>
        </div>
      </Section>

      {/* Możliwości */}
      <Section>
        <SectionHead
          eyebrow={t.capabilitiesEyebrow}
          title={t.capabilitiesTitle.replace("{name}", mod.name)}
        />

        {/* Numerowana siatka. Pierwsza pozycja jest szersza, żeby sekcja nie
            wyglądała jak tabela - oko ma gdzie zacząć. */}
        <div className="mt-14 grid gap-px overflow-hidden rounded-[22px] border border-[var(--mk-hairline)] bg-[var(--mk-hairline)] md:grid-cols-2">
          {mod.capabilities.map((cap, i) => {
            const ile = mod.capabilities.length;
            // Pierwsza pozycja jest szeroka. Jeśli po niej zostaje nieparzysta
            // liczba kafelków, ostatni też musi być szeroki - inaczej siatka
            // kończy się pustym polem w kolorze obramowania.
            const szeroki = i === 0 || (i === ile - 1 && (ile - 1) % 2 === 1);
            return (
            <div
              key={cap.title}
              className={`group relative bg-[var(--color-mk-bg)] p-8 transition-colors hover:bg-[var(--mk-surface-2)] md:p-10 ${
                szeroki ? "md:col-span-2" : ""
              }`}
            >
              <span className="font-mono text-[11px] tabular-nums text-[var(--color-mk-accent)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h4 className="mb-3 mt-3">{cap.title}</h4>
              <p className="max-w-[60ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                {cap.body}
              </p>
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-px scale-x-0 bg-gradient-to-r from-emerald-400 to-cyan-400 transition-transform duration-500 group-hover:scale-x-100"
              />
            </div>
            );
          })}
        </div>
      </Section>

      {/* Dla kogo */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <Card accent className="p-8 md:p-12">
            <p className="mk-eyebrow mb-5">{t.forWhom}</p>
            <p className="text-lg leading-relaxed text-[var(--color-mk-text)]">
              {mod.forWhom}
            </p>
          </Card>
        </div>
      </Section>

      <FrameRule />

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

      <FrameRule />

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
          <div className="mt-10">
            <Button href={href("/kontakt")}>{t.cta}</Button>
          </div>
        </div>
      </Section>

      <SiteFooter lang={locale} />
    </div>
  );
}
