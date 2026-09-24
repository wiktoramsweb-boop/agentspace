import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PageHero } from "@/app/components/page-hero";
import { FrameRule } from "@/app/components/mk/frame";
import { Card, Button, Section, SectionHead } from "@/app/components/mk/ui";
import { MODULES, getModule, listModules } from "@/lib/marketing/modules";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";

export function generateStaticParams() {
  return MODULES.map((m) => ({ slug: m.slug }));
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

      <FrameRule />

      {/* Problem */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHead align="left" eyebrow={t.problemEyebrow} title={t.problemTitle} />
          <p className="mt-8 text-lg leading-relaxed text-[var(--color-mk-muted)]">
            {mod.problem}
          </p>
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

      {/* Pozostałe moduły */}
      <Section>
        <SectionHead
          eyebrow={t.restEyebrow}
          title={t.restTitle}
          lead={t.restLead}
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {others.map((other) => (
            <Link key={other.slug} href={href(`/produkt/${other.slug}`)}>
              <Card className="h-full p-6">
                <p className="mb-2 text-[1.0625rem] font-medium text-[var(--color-mk-text)]">
                  {other.name}
                </p>
                <p className="text-sm leading-snug text-[var(--color-mk-muted)]">
                  {other.headline}
                </p>
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
