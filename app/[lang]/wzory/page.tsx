import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PageHero } from "@/app/components/page-hero";
import { FrameRule } from "@/app/components/mk/frame";
import { Card, Section, SectionHead } from "@/app/components/mk/ui";
import { WZORY } from "@/lib/wzory/themes";
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
  const t = getDict(locale).pages.wzory.meta;
  return pageMetadata(locale, "/wzory", t.title, t.description);
}

export default async function WzoryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.wzory;
  const href = (path: string) => localeHref(locale, path);

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
          eyebrow={t.gallery.eyebrow}
          title={t.gallery.title}
          lead={t.gallery.lead}
        />

        {/* Wzory to dema polskich biur - anglojęzycznego odwiedzającego
            uprzedzamy, zanim kliknie i zobaczy polską stronę. */}
        {t.demoNotice ? (
          <p className="mt-6 max-w-[70ch] rounded-xl border border-[var(--mk-hairline)] bg-[var(--mk-surface-2)] p-4 text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
            {t.demoNotice}
          </p>
        ) : null}

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {WZORY.map((w) => (
            <Card key={w.slug} className="flex h-full flex-col overflow-hidden !p-0">
              <Link href={`/wzory/${w.slug}`} className="relative block aspect-[16/9] overflow-hidden">
                <Image
                  src={w.preview}
                  alt={`${t.gallery.previewAlt} ${w.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition duration-500 hover:scale-[1.03]"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(180deg, transparent 30%, ${w.swatch[0]}D9 100%)` }}
                />
                <span
                  className="absolute bottom-4 left-5 text-2xl font-medium"
                  style={{ color: w.swatch[1], fontFamily: w.dark ? "Georgia, serif" : undefined }}
                >
                  {w.office}
                </span>
              </Link>

              <div className="flex flex-1 flex-col p-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex gap-1.5" aria-hidden="true">
                  {w.swatch.map((c) => (
                    <span key={c} className="h-6 w-6 rounded-full border border-white/10" style={{ background: c }} />
                  ))}
                </span>
                <span className="text-xs text-[var(--color-mk-muted)]">{w.fonts}</span>
              </div>

              <h3 className="mb-2 text-2xl font-medium text-[var(--color-mk-text)]">{w.name}</h3>
              <p className="mb-4 text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">{w.tagline}</p>

              <p className="mb-5 text-xs uppercase tracking-wider text-[var(--color-mk-muted)]">
                {t.gallery.forWhom} {w.forWhom}
              </p>

              <ul className="mb-7 grid gap-2 text-[0.9375rem] text-[var(--color-mk-muted)]">
                {w.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span className="text-[var(--color-mk-accent)]">·</span>
                    {h}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-wrap gap-3">
                <Link
                  href={`/wzory/${w.slug}`}
                  className="rounded-xl bg-[var(--color-mk-accent)] px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:brightness-110"
                >
                  {t.gallery.see}
                </Link>
                <Link
                  href={`/wzory/${w.slug}/oferty`}
                  className="rounded-xl border border-[var(--color-mk-line)] px-5 py-2.5 text-sm font-medium text-[var(--color-mk-text)] transition hover:border-[var(--color-mk-line-lit)]"
                >
                  {t.gallery.listings}
                </Link>
              </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <FrameRule />

      <Section>
        <div className="rounded-3xl border border-[var(--color-mk-line)] bg-[var(--color-mk-surface)] p-8 md:p-12">
          <p className="mk-eyebrow mb-5">{t.custom.eyebrow}</p>
          <h2 className="mb-5 text-3xl font-medium text-[var(--color-mk-text)] md:text-4xl">
            {t.custom.title}
          </h2>
          <p className="mb-6 max-w-[70ch] text-[var(--color-mk-muted)]">
            {t.custom.body}
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {t.custom.points.map((point) => (
              <div key={point.title}>
                <h4 className="mb-2 text-lg text-[var(--color-mk-text)]">{point.title}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">{point.body}</p>
              </div>
            ))}
          </div>
          <Link
            href={`${href("/kontakt")}?temat=strona-indywidualna`}
            className="mt-8 inline-flex rounded-xl border border-[var(--color-mk-line)] px-6 py-3 font-medium text-[var(--color-mk-text)] transition hover:border-[var(--color-mk-line-lit)]"
          >
            {t.custom.cta}
          </Link>
        </div>
      </Section>

      <FrameRule />

      <Section>
        <SectionHead eyebrow={t.how.eyebrow} title={t.how.title} />
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {t.how.steps.map((step) => (
            <Card key={step.n} className="h-full p-8">
              <p className="mb-4 font-mono text-xs text-[var(--color-mk-accent)]">{step.n}</p>
              <h4 className="mb-3 text-xl text-[var(--color-mk-text)]">{step.title}</h4>
              <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">{step.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <FrameRule />

      <Section>
        <SectionHead
          eyebrow={t.diff.eyebrow}
          title={t.diff.title}
          lead={t.diff.lead}
        />
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {t.diff.items.map((item) => (
            <Card key={item.title} className="h-full p-7">
              <h4 className="mb-3 text-lg text-[var(--color-mk-text)]">{item.title}</h4>
              <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">{item.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <FrameRule />

      <Section>
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="mb-5 text-3xl font-medium text-[var(--color-mk-text)] md:text-4xl">
            {t.cta.title}
          </h2>
          <p className="mb-4 text-[var(--color-mk-muted)]">
            {t.cta.body}
          </p>
          <p className="mb-8 text-[0.9375rem] text-[var(--color-mk-muted)]">
            {t.cta.price
              .replace("{monthly}", String(SITE_ADDON.monthly))
              .replace("{setup}", String(SITE_ADDON.setup))}
          </p>
          <Link
            href={href("/kontakt")}
            className="inline-flex rounded-xl bg-[var(--color-mk-accent)] px-7 py-3.5 font-semibold text-emerald-950 transition hover:brightness-110"
          >
            {t.cta.button}
          </Link>
        </div>
      </Section>

      <SiteFooter lang={locale} />
    </div>
  );
}
