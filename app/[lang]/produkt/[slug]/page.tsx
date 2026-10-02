import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PageHero } from "@/app/components/page-hero";
import { FrameRule } from "@/app/components/mk/frame";
import { Card, Button, Section, SectionHead } from "@/app/components/mk/ui";
import { MODULES, getModule, listModules } from "@/lib/marketing/modules";
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

  const t = getDict(locale).pages.produkt;
  const href = (path: string) => localeHref(locale, path);
  const others = listModules(locale).filter((m) => m.slug !== slug);
  // Strona internetowa biura ma własną, bogatszą stronę z ośmioma wzorami,
  // więc kafelek prowadzi tam, a nie na uboższy opis modułu.
  const innyHref = (s: string) => (s === "strona-www" ? "/wzory" : `/produkt/${s}`);

  return (
    <div className="mk relative min-h-screen">
      <SiteNav lang={locale} />

      <PageHero
        eyebrow={`${t.moduleLabel} · ${mod.name}`}
        title={mod.headline}
        description={mod.lead}
      >
        <Button href={href("/kontakt")}>{t.cta}</Button>
      </PageHero>

      {/* Ekran z aplikacji. Opis modułu bez obrazka nie mówi nic o tym,
          jak to wygląda w pracy, a to pierwsze pytanie właściciela biura. */}
      <Section className="pt-0">
        <div className="mx-auto max-w-4xl">
          <BrowserShot tilt>
            <ShotFor shot={mod.shot} lang={locale} />
          </BrowserShot>
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
          <figure
            className={`relative m-0 aspect-[4/3] overflow-hidden ${
              mod.ilustracja ? "" : "rounded-[24px] border border-[var(--mk-hairline)]"
            }`}
          >
            <Image
              src={mod.ilustracja ?? mod.photo}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 44vw"
              className={mod.ilustracja ? "object-contain" : "object-cover"}
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

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {mod.capabilities.map((cap) => (
            <Card key={cap.title} className="h-full p-8">
              <h4 className="mb-3">{cap.title}</h4>
              <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                {cap.body}
              </p>
            </Card>
          ))}
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
          <SectionHead eyebrow={t.faqEyebrow} title={t.faqTitle} />
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
          title={t.restTitle}
          lead={t.restLead}
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
