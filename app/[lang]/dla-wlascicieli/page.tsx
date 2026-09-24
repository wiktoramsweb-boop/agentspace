import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PageHero } from "@/app/components/page-hero";
import { FadeIn, StaggerContainer, StaggerItem } from "@/app/components/fade-in";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.wlasciciele.meta;
  return pageMetadata(locale, "/dla-wlascicieli", t.title, t.description);
}

export default async function DlaWlascicieli({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.wlasciciele;

  return (
    <>
      <SiteNav lang={locale} />
      <main className="mk relative min-h-screen">
        <PageHero
          eyebrow={t.hero.eyebrow}
          title={t.hero.title}
          description={t.hero.description}
          photo={{ src: "/wzory/wieza.jpg", alt: t.hero.photoAlt, caption: t.hero.photoCaption }}
        />

        {/* Problemy z liczbami */}
        <section className="border-b border-[var(--mk-hairline)] px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <FadeIn>
              <h2 className="mb-12 text-3xl font-semibold tracking-tight md:text-4xl">
                {t.problemsTitle}
              </h2>
            </FadeIn>

            <StaggerContainer className="grid gap-6 md:grid-cols-3" staggerDelay={0.1}>
              {t.problems.map((problem) => (
                <StaggerItem key={problem.title}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] p-8 transition-all hover:-translate-y-1 hover:border-red-500/30 hover:bg-[var(--mk-card-bg)]">
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-red-500/5 blur-2xl transition-all duration-500 group-hover:bg-red-500/15" />
                    <div className="relative">
                      <p className="mb-4 bg-gradient-to-br from-red-400 to-amber-400 bg-clip-text text-5xl font-semibold text-transparent md:text-6xl">
                        {problem.stat}
                      </p>
                      <h3 className="mb-3 text-lg font-semibold text-[var(--color-mk-text)]">{problem.title}</h3>
                      <p className="text-[var(--color-mk-muted)]">{problem.body}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Benefits */}
        <section className="border-b border-[var(--mk-hairline)] px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <h2 className="mb-12 text-3xl font-semibold tracking-tight md:text-4xl">
                {t.benefitsTitle}
              </h2>
            </FadeIn>

            <StaggerContainer className="grid gap-6 md:grid-cols-2" staggerDelay={0.1}>
              {t.benefits.map((benefit) => (
                <StaggerItem key={benefit.title}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] p-8 transition-all hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-[var(--mk-card-bg)]">
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl transition-all duration-500 group-hover:bg-emerald-500/15" />
                    <div className="relative">
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-emerald-400">
                        {benefit.eyebrow}
                      </p>
                      <h3 className="mb-3 text-xl font-semibold text-[var(--color-mk-text)]">{benefit.title}</h3>
                      <p className="leading-relaxed text-[var(--color-mk-muted)]">{benefit.body}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ROI math */}
        <section className="border-b border-[var(--mk-hairline)] px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl">
            <FadeIn>
              <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight md:text-4xl">
                {t.roiTitle}
              </h2>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="relative overflow-hidden rounded-3xl border border-[var(--mk-hairline)] bg-gradient-to-br from-[var(--mk-card-bg)] to-[var(--mk-card-bg)] p-8 backdrop-blur-xl md:p-10">
                <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

                <dl className="relative space-y-6">
                  {t.roi.map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col justify-between gap-2 border-b border-[var(--mk-hairline)] pb-6 last:border-0 last:pb-0 md:flex-row md:items-center"
                    >
                      <dt className="text-[var(--color-mk-muted)]">{item.label}</dt>
                      <dd
                        className={`text-2xl font-semibold ${
                          item.accent ? "text-emerald-400" : "text-[var(--color-mk-text)]"
                        }`}
                      >
                        {item.value}
                        {item.suffix && <span className="text-base text-[var(--color-mk-muted)]"> {item.suffix}</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </FadeIn>
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
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href={localeHref(locale, "/kontakt")}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-8 py-4 font-semibold text-[var(--mk-on-accent)] transition hover:bg-emerald-400"
                >
                  {t.cta.primary}
                </Link>
                <Link
                  href={localeHref(locale, "/kontakt")}
                  className="inline-flex items-center justify-center rounded-xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] px-8 py-4 font-medium text-[var(--color-mk-text)] transition hover:border-zinc-700 hover:bg-[var(--mk-card-bg)]"
                >
                  {t.cta.secondary}
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>
      <SiteFooter lang={locale} />
    </>
  );
}
