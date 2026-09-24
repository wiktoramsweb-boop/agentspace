import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { AiCoachMockup } from "@/app/components/mockups/ai-coach-mockup";
import { AgentDashboardMockup } from "@/app/components/mockups/agent-dashboard-mockup";
import { OwnerPanelMockup } from "@/app/components/mockups/owner-panel-mockup";
import { CoachFlow } from "@/app/components/coach-flow";
import { PageHero } from "@/app/components/page-hero";
import { FadeIn } from "@/app/components/fade-in";
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
  const t = getDict(locale).pages.demo.meta;
  return pageMetadata(locale, "/demo", t.title, t.description);
}

/** Makiety zostają w kodzie, opisy przychodzą ze słownika. */
const DEMO_MOCKUPS = [AiCoachMockup, AgentDashboardMockup, OwnerPanelMockup];

export default async function Demo({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.demo;
  const screens = t.screens.map((screen, i) => ({ ...screen, Mockup: DEMO_MOCKUPS[i] }));

  return (
    <>
      <SiteNav lang={locale} />
      <main className="mk relative min-h-screen">
        <PageHero
          eyebrow={t.hero.eyebrow}
          title={t.hero.title}
          description={t.hero.description}
          photo={{ src: "/wzory/szklo.jpg", alt: t.hero.photoAlt, caption: t.hero.photoCaption }}
        />

        {/* Mockupy */}
        {screens.map((item, index) => (
          <section
            key={item.title}
            className={`px-6 py-20 ${index < screens.length - 1 ? "border-b border-[var(--mk-hairline)]" : ""}`}
          >
            <div className="mx-auto max-w-6xl">
              <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
                <FadeIn className={index % 2 === 1 ? "md:order-2" : ""}>
                  <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                    {item.eyebrow}
                  </p>
                  <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
                    {item.title}
                  </h2>
                  <p className="text-lg leading-relaxed text-[var(--color-mk-muted)]">{item.body}</p>
                </FadeIn>
                <FadeIn delay={0.15} className={index % 2 === 1 ? "md:order-1" : ""}>
                  <TiltCard className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--mk-hairline)] bg-[var(--color-mk-bg)] p-3 shadow-2xl shadow-emerald-500/10">
                    <div className="mb-2 flex items-center gap-1.5 px-2 py-1">
                      <div className="h-2 w-2 rounded-full bg-red-500/60" />
                      <div className="h-2 w-2 rounded-full bg-amber-500/60" />
                      <div className="h-2 w-2 rounded-full bg-emerald-500/60" />
                      <div className="ml-2 flex-1 rounded-md bg-[var(--mk-card-bg)] px-2 py-0.5 font-mono text-[9px] text-[var(--color-mk-muted)]">
                        agentspace.pl/app
                      </div>
                    </div>
                    <item.Mockup />
                  </TiltCard>
                </FadeIn>
              </div>
            </div>
          </section>
        ))}

        {/* Coach flow */}
        <section className="border-b border-t border-[var(--mk-hairline)] px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 max-w-2xl">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                {t.flowEyebrow}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {t.flowTitle}
              </h2>
            </div>
            <CoachFlow lang={locale} />
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
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
        </section>
      </main>
      <SiteFooter lang={locale} />
    </>
  );
}
