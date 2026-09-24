import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PageHero } from "@/app/components/page-hero";
import { FrameRule } from "@/app/components/mk/frame";
import { Card, Button, Section, SectionHead } from "@/app/components/mk/ui";
import { listIntegrations, statusLabel } from "@/lib/marketing/integrations";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.integracje.meta;
  return pageMetadata(locale, "/integracje", t.title, t.description);
}

const STATUS_COLOR: Record<string, string> = {
  live: "text-emerald-400",
  "in-progress": "text-[var(--color-mk-accent)]",
  planned: "text-[var(--color-mk-muted)]",
};

export default async function IntegracjePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.integracje;
  const href = (path: string) => localeHref(locale, path);
  const integrations = listIntegrations(locale);

  return (
    <div className="mk relative min-h-screen">
      <SiteNav lang={locale} />

      <PageHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        description={t.hero.description}
      />

      <FrameRule />

      <Section>
        <SectionHead
          eyebrow={t.listEyebrow}
          title={t.listTitle}
          lead={t.listLead}
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {integrations.map((integration) => (
            <Link
              key={integration.slug}
              href={href(`/integracje/${integration.slug}`)}
              className="group block"
            >
              <Card className="h-full p-8">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h4>{integration.name}</h4>
                  <span
                    className={`text-xs font-medium ${
                      STATUS_COLOR[integration.status]
                    }`}
                  >
                    {statusLabel(integration.status, locale)}
                  </span>
                </div>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {integration.about}
                </p>
                <p className="mt-6 inline-flex items-center gap-2 text-[0.9375rem] text-[var(--color-mk-accent)]">
                  {t.seeDetails}
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M3 10h13m0 0-5-5m5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="pb-32">
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[22ch]">{t.otherSystemTitle}</h2>
          <p className="mt-5 max-w-[50ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
            {t.otherSystemLead}
          </p>
          <div className="mt-10">
            <Button href={href("/kontakt")}>{t.otherSystemCta}</Button>
          </div>
        </div>
      </Section>

      <SiteFooter lang={locale} />
    </div>
  );
}
