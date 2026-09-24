import { FadeIn, StaggerContainer, StaggerItem } from "@/app/components/fade-in";
import Link from "next/link";
import { SiteNav } from "@/app/components/site-nav";
import { BrowserShot, MkMarquee, PhotoTile, ShotTabs, TemplateTile } from "@/app/components/mk/showcase";
import { Beams, RevealWords, SpotlightCard, StickySteps, Ticker, TiltPhoto } from "@/app/components/mk/motion-bits";
import {
  ShotCele,
  ShotDokumenty,
  ShotKalendarz,
  ShotKlient,
  ShotOferty,
  ShotPanel,
  ShotProwizje,
  ShotPulpit,
} from "@/app/components/mockups/light-shots";
import { CoachLive } from "@/app/components/mk/coach-live";
import { WZORY } from "@/lib/wzory/themes";
import { SITE_ADDON } from "@/lib/site/addon";
import { SiteFooter } from "@/app/components/site-footer";
import { AuroraBackground } from "@/app/components/aurora-background";
import { Spotlight } from "@/app/components/effects/spotlight";
import { Magnetic } from "@/app/components/effects/magnetic-button";
import { GlowCard } from "@/app/components/effects/glow-card";
import { Button, Card, Section, SectionHead, Tick } from "@/app/components/mk/ui";
import { Pricing } from "@/app/components/mk/pricing";
import { Compare } from "@/app/components/mk/compare";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";
import type { Metadata } from "next";

/* ── Strona ────────────────────────────────────────────────── */

/** Zdjęcia kroków - nie tłumaczą się, więc zostają poza słownikiem. */
const STEP_PHOTOS = ["/wzory/dziedziniec.jpg", "/wzory/schody.jpg", "/wzory/miasto-noc.jpg"];

/** Makiety ekranów - podpięte po kluczu zakładki ze słownika. */
const FIELD_PHOTOS = ["/wzory/kamienica.jpg", "/wzory/salon.jpg", "/wzory/schody.jpg"];

function shots(lang: string): Record<string, React.ReactNode> {
  return {
    pulpit: <ShotPulpit lang={lang} />,
    nieruchomosci: <ShotOferty lang={lang} />,
    klienci: <ShotKlient lang={lang} />,
    cele: <ShotCele lang={lang} />,
    kalendarz: <ShotKalendarz lang={lang} />,
    prowizje: <ShotProwizje lang={lang} />,
    dokumenty: <ShotDokumenty lang={lang} />,
    zespol: <ShotPanel lang={lang} />,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).home.meta;
  return pageMetadata(locale, "/", t.title, t.description);
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const d = getDict(locale);
  const t = d.home;
  const href = (path: string) => localeHref(locale, path);
  const STEPS = t.steps.items.map((step, i) => ({ ...step, photo: STEP_PHOTOS[i] }));
  const SHOTS = shots(locale);

  return (
    <div className="mk relative min-h-screen">
      <SiteNav lang={locale} />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 pt-[120px] pb-14 md:pt-[148px] md:pb-20">
        <AuroraBackground />
        <Spotlight />

        <div className="relative z-10 mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div>
            <FadeIn>
              <p className="mk-eyebrow mb-6">{t.hero.eyebrow}</p>
            </FadeIn>

            <FadeIn delay={0.08}>
              <h1 className="max-w-[15ch] !text-left">
                {t.hero.title.a}<span className="grad">{t.hero.title.b}</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.16}>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-[var(--color-mk-muted)]">
                {t.hero.lead.a}
                <span className="text-[var(--color-mk-text)]">{t.hero.lead.strong}</span>
                {t.hero.lead.b}
              </p>
            </FadeIn>

            <FadeIn delay={0.24}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Magnetic strength={0.24}>
                  <Button href={href("/kontakt")}>{t.hero.ctaPrimary}</Button>
                </Magnetic>
                <Magnetic strength={0.18}>
                  <Button href="#w-srodku" variant="ghost">
                    {t.hero.ctaGhost}
                  </Button>
                </Magnetic>
              </div>
            </FadeIn>

            <FadeIn delay={0.32}>
              <p className="mt-6 text-sm text-[var(--color-mk-muted)]">
                {t.hero.note}
              </p>
            </FadeIn>

            <FadeIn delay={0.4} className="mt-10">
              <div className="grid max-w-lg grid-cols-3 gap-0">
                {t.hero.facts.map((fact, i) => (
                  <div key={fact.label} className={`pr-5 ${i > 0 ? "border-l border-[var(--mk-hairline)] pl-5" : ""}`}>
                    <p className="mb-1 text-3xl font-semibold md:text-4xl">
                      <span className="grad">
                        <Ticker value={fact.value} suffix={fact.suffix} />
                      </span>
                    </p>
                    <p className="text-[0.8125rem] leading-snug text-[var(--color-mk-muted)]">{fact.label}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Podgląd produktu zamiast kolejnego akapitu: w trzy sekundy widać,
              czy to wygląda jak coś, w czym agent chce pracować. */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-10 -z-10 opacity-60"
              style={{ background: "radial-gradient(50% 50% at 60% 40%, rgba(16,185,129,0.22), transparent 70%)" }}
            />
            <BrowserShot label="agentspace.pl/app" tilt>
              <ShotPulpit lang={locale} />
            </BrowserShot>
          </div>
        </div>
      </section>

      <div className="py-6">
        <MkMarquee items={t.marquee} />
      </div>

      {/* ── WARTOŚCI ── */}
      <Section>
        <SectionHead
          eyebrow={t.values.eyebrow}
          title={
            <>
              {t.values.title.a}
              <span className="grad">{t.values.title.b}</span>
            </>
          }
        />

        <StaggerContainer className="mt-12 grid gap-5 md:grid-cols-3">
          {t.values.items.map((value) => (
            <StaggerItem key={value.title}>
              <GlowCard className="mk-card h-full rounded-[20px] p-8">
                <h4 className="mb-3">{value.title}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {value.body}
                </p>
              </GlowCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* ── MODUŁY ── */}
      <Section id="moduly">
        <SectionHead
          eyebrow={t.modules.eyebrow}
          title={
            <>
              {t.modules.title.a}
              <span className="grad">{t.modules.title.b}</span>
            </>
          }
          lead={t.modules.lead}
        />

        <StaggerContainer className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {t.modules.items.map((mod, i) => (
            <StaggerItem key={mod.name} className={i === 0 ? "lg:col-span-2" : ""}>
              <SpotlightCard href={href(`/produkt/${mod.slug}`)} className="p-8">
                <div className="flex h-full flex-col">
                  <h4 className="mb-3">{mod.name}</h4>
                  <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                    {mod.body}
                  </p>
                  <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-mk-accent)]">
                    {d.common.seeModule}
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform duration-300 group-hover/card:translate-x-1"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M3 10h13m0 0-5-5m5 5-5 5"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </p>
                </div>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* ── W ŚRODKU: jasna przerwa z podglądem produktu ── */}
      <section id="w-srodku" className="mk-paper py-24 md:py-32">
        <div className="mx-auto max-w-[1240px] px-6">
          <p className="mk-eyebrow mb-5">{t.inside.eyebrow}</p>
          <h2 className="max-w-[22ch] text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.08] tracking-[-0.03em]">
            {t.inside.title}
          </h2>
          <p className="mt-5 max-w-[62ch] text-[1.0625rem] leading-relaxed mk-soft">
            {t.inside.lead}
          </p>

          <div className="mt-12">
            <ShotTabs
              tabs={t.inside.tabs.map((tab) => ({ ...tab, node: SHOTS[tab.key] }))}
            />
          </div>
        </div>
      </section>

      {/* ── AI COACH: rozmowa, która odtwarza się sama ── */}
      <Section className="relative">
        <Beams />
        <div className="relative">
          <CoachLive t={d.coach} />
        </div>
      </Section>

      {/* ── DZIEŃ W BIURZE: zdjęcia zamiast kolejnych kart z tekstem ── */}
      <Section>
        <SectionHead
          eyebrow={t.field.eyebrow}
          title={
            <>
              {t.field.title.a}
              <span className="grad">{t.field.title.b}</span>
              {t.field.title.c}
            </>
          }
          lead={t.field.lead}
        />

        <StaggerContainer className="mt-12 grid gap-5 md:grid-cols-3">
          {t.field.tiles.map((tile, i) => (
            <StaggerItem key={tile.title}>
              <PhotoTile
                src={FIELD_PHOTOS[i]}
                alt={tile.alt}
                title={tile.title}
                body={tile.body}
                className="aspect-[3/4]"
                priority={i === 0}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* ── JAK TO DZIAŁA ── */}
      <Section id="jak-to-dziala">
        <SectionHead
          eyebrow={t.steps.eyebrow}
          title={
            <>
              {t.steps.title.a}
              <span className="grad">{t.steps.title.b}</span>
            </>
          }
        />

        <div className="mt-12">
          <StickySteps steps={STEPS} />
        </div>
      </Section>

      {/* ── PROBLEMY ── */}
      <Section>
        <SectionHead
          eyebrow={t.problems.eyebrow}
          title={
            <>
              {t.problems.title.a}
              <span className="grad">{t.problems.title.b}</span>
            </>
          }
          lead={t.problems.lead}
        />

        <StaggerContainer className="mt-12 grid gap-5 md:grid-cols-3">
          {t.problems.items.map((problem) => (
            <StaggerItem key={problem.title}>
              <Card className="h-full p-8">
                <span
                  aria-hidden="true"
                  className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/10 ring-1 ring-rose-500/25"
                >
                  <svg className="h-5 w-5 text-rose-400" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 8.5v4.5m0 3.5h.01M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.4h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h4 className="mb-3">{problem.title}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {problem.body}
                </p>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* ── PORÓWNANIE ── */}
      <Section>
        <SectionHead
          eyebrow={t.compare.eyebrow}
          title={
            <>
              {t.compare.title.a}
              <span className="grad">{t.compare.title.b}</span>
            </>
          }
        />
        <div className="mt-12">
          <Compare t={t.compare} />
        </div>
      </Section>

      {/* ── PROGRAM PIERWSZYCH 10 BIUR ── */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <Card accent className="overflow-hidden p-8 md:p-14">
              {/* Poświaty w rogach - karta ma być najjaśniejszym punktem strony */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl"
              />

              <div className="relative flex flex-col items-center text-center">
                <p className="mk-eyebrow mb-7">{t.onboarding.eyebrow}</p>
                <h3 className="max-w-[20ch]">
                  {t.onboarding.title.a}
                  <span className="grad">{t.onboarding.title.b}</span>
                </h3>
                <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {t.onboarding.body}
                </p>

                <ul className="mt-10 flex w-full max-w-md flex-col gap-4 text-left">
                  {t.onboarding.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-[0.9375rem] leading-snug text-[var(--color-mk-muted)]"
                    >
                      <Tick />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-11">
                  <Magnetic strength={0.2}>
                    <Button href={href("/kontakt")}>{t.onboarding.cta}</Button>
                  </Magnetic>
                </div>
              </div>
            </Card>
          </FadeIn>
        </div>
      </Section>

      {/* ── SKĄD TO SIĘ WZIĘŁO ── */}
      {/* ── MANIFEST: zdanie odsłaniane przy przewijaniu + zdjęcia ── */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-16">
          <div>
            <p className="mk-eyebrow mb-7">{t.manifest.eyebrow}</p>
            <RevealWords
              text={t.manifest.text}
              className="text-[clamp(1.5rem,3.1vw,2.5rem)] font-medium leading-[1.25] tracking-[-0.025em] text-[var(--color-mk-text)]"
            />
            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {t.manifest.points.map((point) => (
                <div key={point.title}>
                  <p className="mb-1.5 font-medium text-[var(--color-mk-text)]">{point.title}</p>
                  <p className="text-sm leading-relaxed text-[var(--color-mk-muted)]">{point.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TiltPhoto
              src="/wzory/kuchnia.jpg"
              alt={t.manifest.photos[0].alt}
              caption={t.manifest.photos[0].caption}
              className="aspect-[3/4]"
            />
            <div className="grid gap-4 pt-10">
              <TiltPhoto
                src="/wzory/dom.jpg"
                alt={t.manifest.photos[1].alt}
                caption={t.manifest.photos[1].caption}
                className="aspect-square"
              />
              <TiltPhoto
                src="/wzory/taras.jpg"
                alt={t.manifest.photos[2].alt}
                caption={t.manifest.photos[2].caption}
                className="aspect-square"
              />
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHead eyebrow={t.origin.eyebrow} title={t.origin.title} />

          <FadeIn delay={0.1}>
            <Card className="mt-12 p-8 md:p-12">
              <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start md:gap-10">
                <div className="flex justify-center md:justify-start">
                  <div className="relative">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 opacity-45 blur-xl"
                    />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-2xl font-bold text-[var(--mk-on-accent)]">
                      W
                    </div>
                  </div>
                </div>

                <div>
                  <svg
                    aria-hidden="true"
                    className="mb-4 h-7 w-7 text-emerald-400/45"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>

                  <p className="text-lg leading-relaxed text-[var(--color-mk-text)]">
                    {t.origin.quote.a}
                    <span className="font-medium">{t.origin.quote.company}</span>
                    {t.origin.quote.b}
                    <span className="grad font-medium">{t.origin.quote.accent}</span>
                    {t.origin.quote.c}
                  </p>

                  <div className="mt-8 flex items-center gap-4">
                    <div className="h-px w-10 bg-gradient-to-r from-emerald-400/70 to-transparent" />
                    <div>
                      <p className="text-[0.9375rem] font-medium text-[var(--color-mk-text)]">
                        {t.origin.author}
                      </p>
                      <p className="text-sm text-[var(--color-mk-muted)]">
                        {t.origin.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </FadeIn>
        </div>
      </Section>

      {/* ── STRONY WWW: osobny dodatek, ale wizualnie najmocniejszy argument ── */}
      <Section>
        <SectionHead
          eyebrow={t.sites.eyebrow}
          title={
            <>
              {t.sites.title.a}
              <span className="grad">{t.sites.title.b}</span>
            </>
          }
          lead={t.sites.lead}
        />

        <StaggerContainer className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WZORY.slice(0, 4).map((w) => (
            <StaggerItem key={w.slug}>
              <TemplateTile
                href={`/wzory/${w.slug}`}
                photo={w.preview}
                name={w.name}
                forWhom={w.forWhom}
                swatch={[...w.swatch]}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button href={href("/wzory")}>{t.sites.cta}</Button>
          <Link
            href={href("/cennik")}
            className="text-[0.9375rem] text-[var(--color-mk-muted)] underline-offset-4 hover:underline"
          >
            {t.sites.priceLink}
          </Link>
        </div>
      </Section>

      {/* ── CENNIK ── */}
      <Section id="cennik">
        <SectionHead
          eyebrow={t.pricing.eyebrow}
          title={
            <>
              {t.pricing.title.a}
              <span className="grad">{t.pricing.title.b}</span>
            </>
          }
          lead={t.pricing.lead}
        />
        <div className="mt-12">
          <Pricing lang={locale} />
        </div>
      </Section>

      {/* ── DLA KOGO NIE JEST ── */}
      <Section>
        <SectionHead
          eyebrow={t.notFor.eyebrow}
          title={t.notFor.title}
          lead={t.notFor.lead}
        />

        <StaggerContainer className="mt-12 grid gap-5 md:grid-cols-3">
          {t.notFor.items.map((item) => (
            <StaggerItem key={item.title}>
              <Card className="h-full p-8">
                <span
                  aria-hidden="true"
                  className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--mk-surface-2)] ring-1 ring-white/10"
                >
                  <svg
                    className="h-4.5 w-4.5 text-zinc-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ width: 18, height: 18 }}
                  >
                    <path
                      d="M6 18 18 6M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <h4 className="mb-3">{item.title}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {item.body}
                </p>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq">
        <div className="mx-auto max-w-3xl">
          <SectionHead eyebrow={t.faq.eyebrow} title={t.faq.title} />

          <StaggerContainer className="mt-12 flex flex-col gap-3" staggerDelay={0.05}>
            {t.faq.items.map((item) => (
              <StaggerItem key={item.question}>
                <details className="mk-card group px-6 py-5 md:px-8 [&[open]]:bg-[var(--mk-surface-2)]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[1.0625rem] font-medium text-[var(--color-mk-text)]">
                    {item.question}
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--mk-surface-2)] transition-all duration-300 group-open:rotate-180 group-open:bg-emerald-500/15">
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4 text-[var(--color-mk-muted)] transition-colors group-open:text-emerald-400"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M5 7.5 10 12.5 15 7.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-4 max-w-[62ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                    {item.answer}
                  </p>
                </details>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </Section>

      {/* ── CTA ── */}
      <Section className="pb-32">
        <FadeIn>
          <div className="relative flex flex-col items-center overflow-hidden rounded-[28px] px-6 py-20 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/12 blur-[100px]"
            />

            <div className="relative">
              <h2 className="max-w-[20ch]">
                {t.cta.title.a}
                <span className="grad">{t.cta.title.b}</span>
                {t.cta.title.c}
              </h2>
              <p className="mx-auto mt-6 max-w-[48ch] text-[1.0625rem] leading-relaxed text-[var(--color-mk-muted)]">
                {t.cta.lead}
              </p>
              <div className="mt-11 flex justify-center">
                <Magnetic strength={0.24}>
                  <Button href={href("/kontakt")}>{t.cta.button}</Button>
                </Magnetic>
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      <SiteFooter lang={locale} />
    </div>
  );
}
