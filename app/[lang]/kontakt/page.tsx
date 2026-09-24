import type { Metadata } from "next";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { ContactForm } from "@/app/components/contact-form";
import { PageHero } from "@/app/components/page-hero";
import { FadeIn } from "@/app/components/fade-in";
import { getDict, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.kontakt.meta;
  return pageMetadata(locale, "/kontakt", t.title, t.description);
}

export default async function Kontakt({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.kontakt;

  return (
    <>
      <SiteNav lang={locale} />
      <main className="mk relative min-h-screen">
        <PageHero
          eyebrow={t.hero.eyebrow}
          title={t.hero.title}
          description={t.hero.description}
          compact
          photo={{ src: "/wzory/dziedziniec.jpg", alt: t.hero.photoAlt, caption: t.hero.photoCaption }}
        />

        {/* Quick topics - co możesz napisać */}
        <section className="border-b border-[var(--mk-hairline)] px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-4 md:grid-cols-3">
              {t.topics.map((topic, index) => (
                <FadeIn key={topic.title} delay={index * 0.08}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] p-6 transition-all hover:border-emerald-500/30 hover:bg-[var(--mk-card-bg)]">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/5 blur-xl transition-all duration-500 group-hover:bg-emerald-500/15" />
                    <div className="relative">
                      <h3 className="mb-2 text-lg font-semibold text-[var(--color-mk-text)]">{topic.title}</h3>
                      <p className="mb-4 text-sm text-[var(--color-mk-muted)]">{topic.body}</p>
                      <p className="text-xs text-emerald-400">{topic.cta}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Contact info + form */}
        <section className="border-b border-[var(--mk-hairline)] px-6 py-20 md:py-24">
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1fr_1.3fr]">
            {/* Info column */}
            <FadeIn>
              <div className="sticky top-24 space-y-8">
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-[var(--color-mk-text)]">
                    {t.findUs}
                  </h2>

                  <div className="space-y-5">
                    <ContactInfoRow
                      label={t.labelEmail}
                      value="nieruchomoscispectra@gmail.com"
                      href="mailto:nieruchomoscispectra@gmail.com"
                      icon={<MailIcon />}
                    />
                    <ContactInfoRow
                      label={t.labelAddress}
                      value="ul. Zbożowa 2/1, 30-002 Kraków"
                      icon={<PinIcon />}
                    />
                    <ContactInfoRow
                      label={t.labelResponse}
                      value={t.responseTime}
                      icon={<ClockIcon />}
                    />
                  </div>
                </div>

                {/* Operator card */}
                <div className="relative overflow-hidden rounded-2xl border border-[var(--mk-hairline)] bg-gradient-to-br from-[var(--mk-card-bg)] to-[var(--mk-card-bg)] p-6 backdrop-blur-xl">
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
                  <div className="relative">
                    <h3 className="mb-3 text-base font-semibold text-[var(--color-mk-text)]">
                      {t.operatorTitle}
                    </h3>
                    <div className="space-y-1 text-sm text-[var(--color-mk-muted)]">
                      <p className="text-[var(--color-mk-text)]">Spectra Nieruchomości</p>
                      <p>ul. Zbożowa 2/1, 30-002 Kraków</p>
                      <p className="pt-2 font-mono text-xs text-[var(--color-mk-muted)]">NIP: 6772516327</p>
                      <p className="font-mono text-xs text-[var(--color-mk-muted)]">REGON: 529666353</p>
                      <p className="pt-3 text-[var(--color-mk-muted)]">
                        {t.founderLabel}{" "}
                        <span className="text-[var(--color-mk-text)]">Wiktor Szostek</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Form column */}
            <FadeIn delay={0.15}>
              <div className="rounded-3xl border border-[var(--mk-hairline)] bg-gradient-to-br from-[var(--mk-card-bg)] to-[var(--mk-card-bg)] p-8 backdrop-blur-xl md:p-10">
                <h2 className="mb-6 text-xl font-semibold text-[var(--color-mk-text)]">{t.formTitle}</h2>
                <ContactForm lang={locale} />
              </div>
            </FadeIn>
          </div>
        </section>
      </main>
      <SiteFooter lang={locale} />
    </>
  );
}

function ContactInfoRow({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: string;
  href?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] text-emerald-400">
        {icon}
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-[0.15em] text-[var(--color-mk-muted)]">{label}</p>
        <p className="text-[var(--color-mk-text)]">
          {href ? (
            <a href={href} className="transition hover:text-emerald-400">
              {value}
            </a>
          ) : (
            value
          )}
        </p>
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
