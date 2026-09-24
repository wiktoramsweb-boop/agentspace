import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PageHero } from "@/app/components/page-hero";
import { FrameRule } from "@/app/components/mk/frame";
import { Card, Button, Section, SectionHead, Tick } from "@/app/components/mk/ui";
import {
  INTEGRATIONS,
  getIntegration,
  listIntegrations,
  statusLabel,
} from "@/lib/marketing/integrations";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";

export function generateStaticParams() {
  return INTEGRATIONS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = toLocale(lang);
  const integration = getIntegration(slug, locale);
  if (!integration) return {};

  const t = getDict(locale).pages.integracje.detail;
  const title = t.metaTitle.replace("{name}", integration.name);
  const description = t.metaDescription
    .replace("{fullName}", integration.fullName)
    .replace("{status}", statusLabel(integration.status, locale).toLowerCase());

  return pageMetadata(locale, `/integracje/${slug}`, title, description);
}

export default async function IntegracjaPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = toLocale(lang);
  const integration = getIntegration(slug, locale);
  if (!integration) notFound();

  const t = getDict(locale).pages.integracje.detail;
  const href = (path: string) => localeHref(locale, path);
  const isLive = integration.status === "live";
  const others = listIntegrations(locale).filter((i) => i.slug !== slug);

  return (
    <div className="mk relative min-h-screen">
      <SiteNav lang={locale} />

      <PageHero
        eyebrow={`${t.label} · ${statusLabel(integration.status, locale)}`}
        title={`AgentSpace + ${integration.name}`}
        description={integration.about}
      />

      {/* Uczciwy komunikat o statusie - nie udajemy gotowej integracji. */}
      {!isLive && (
        <Section className="py-0">
          <Card accent className="p-6 md:p-8">
            <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
              <span className="font-medium text-[var(--color-mk-text)]">
                {t.notLive.replace("{status}", statusLabel(integration.status, locale).toLowerCase())}
              </span>{" "}
              {t.notLiveBody.replace("{name}", integration.name)}
            </p>
          </Card>
        </Section>
      )}

      <FrameRule className="mt-20" />

      <Section>
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <SectionHead
              align="left"
              eyebrow={t.scopeEyebrow}
              title={isLive ? t.scopeTitleLive : t.scopeTitlePlanned}
            />
            <ul className="mt-8 flex flex-col gap-4">
              {integration.syncs.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-[0.9375rem] leading-snug text-[var(--color-mk-muted)]"
                >
                  <Tick />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHead
              align="left"
              eyebrow={t.whyEyebrow}
              title={t.whyTitle}
            />
            <p className="mt-8 text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
              {integration.why}
            </p>
          </div>
        </div>
      </Section>

      <FrameRule />

      <Section>
        <SectionHead
          eyebrow={t.splitEyebrow}
          title={t.splitTitle.replace("{name}", integration.name)}
          lead={t.splitLead}
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <Card className="p-8">
            <h4 className="mb-5">{integration.name}</h4>
            <ul className="flex flex-col gap-3 text-[0.9375rem] text-[var(--color-mk-muted)]">
              {t.theirSide.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>

          <Card accent className="p-8">
            <h4 className="mb-5">AgentSpace</h4>
            <ul className="flex flex-col gap-3 text-[0.9375rem] text-[var(--color-mk-muted)]">
              {t.ourSide.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section>
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[24ch]">
            {t.ctaTitle.replace("{name}", integration.name)}
            <span className="accent">?</span>
          </h2>
          <p className="mt-5 max-w-[50ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
            {t.ctaLead}
          </p>
          <div className="mt-10">
            <Button href={href("/kontakt")}>{t.ctaButton}</Button>
          </div>
        </div>
      </Section>

      <FrameRule />

      <Section className="pb-32">
        <SectionHead eyebrow={t.othersEyebrow} title={t.othersTitle} />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {others.map((other) => (
            <Link key={other.slug} href={href(`/integracje/${other.slug}`)}>
              <Card className="h-full p-6">
                <p className="mb-1 text-[1.0625rem] font-medium text-[var(--color-mk-text)]">
                  {other.name}
                </p>
                <p className="text-sm text-[var(--color-mk-muted)]">
                  {statusLabel(other.status, locale)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <SiteFooter lang={locale} />
    </div>
  );
}
