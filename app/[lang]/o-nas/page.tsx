import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PageHero } from "@/app/components/page-hero";
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

  return (
    <>
      <SiteNav lang={locale} />
      <main className="mk relative min-h-screen">
        <PageHero
          eyebrow={t.hero.eyebrow}
          title={t.hero.title}
          description={t.hero.description}
          photo={{ src: "/wzory/miasto-noc.jpg", alt: t.hero.photoAlt, caption: t.hero.photoCaption }}
        />

        {/* Founder story */}
        <section className="border-b border-[var(--mk-hairline)] px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <TiltCard className="rounded-3xl border border-[var(--mk-hairline)] bg-gradient-to-br from-[var(--mk-card-bg)] to-[var(--mk-card-bg)] p-8 backdrop-blur-xl md:p-12">
                <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start md:gap-12">
                  {/* Avatar - duży, animowany glow */}
                  <div className="flex justify-center md:justify-start">
                    <div className="relative">
                      {/* Outer glow rings */}
                      <div className="absolute inset-0 -m-4 animate-pulse rounded-full bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 blur-2xl" />
                      <div className="absolute inset-0 -m-2 rounded-full bg-gradient-to-br from-emerald-400/40 to-cyan-400/40 blur-lg" />

                      {/* Main avatar */}
                      <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-5xl font-bold text-[var(--mk-on-accent)] shadow-2xl">
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
                      <p className="mb-4 bg-gradient-to-br from-emerald-400 to-cyan-400 bg-clip-text text-5xl font-semibold text-transparent">
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
            <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-[var(--mk-card-bg)] to-[var(--mk-card-bg)] p-8 text-center md:p-12">
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
