import type { Metadata } from "next";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { FrameRule } from "@/app/components/mk/frame";
import { Card, Button, Section, SectionHead } from "@/app/components/mk/ui";
import { Pricing } from "@/app/components/mk/pricing";
import Link from "next/link";
import { SITE_ADDON } from "@/lib/site/addon";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";
import { FadeIn } from "@/app/components/fade-in";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.cennik.meta;
  return pageMetadata(locale, "/cennik", t.title, t.description);
}

export default async function CennikPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.cennik;
  const href = (path: string) => localeHref(locale, path);
  // W tekstach cennika ceny wstawiamy przez znaczniki, żeby słownik nie
  // musiał wiedzieć, ile dziś kosztuje dodatek.
  const fill = (text: string) =>
    text
      .replace("{monthly}", String(SITE_ADDON.monthly))
      .replace("{yearly}", String(SITE_ADDON.yearly))
      .replace("{setup}", String(SITE_ADDON.setup));

  return (
    <div className="mk relative min-h-screen">
      <SiteNav lang={locale} />

      <section className="px-6 pt-[136px] pb-16 md:pt-[168px]">
        <div className="mx-auto flex max-w-[1080px] flex-col items-center text-center">
          <FadeIn>
            <p className="mk-eyebrow mb-6">{t.eyebrow}</p>
          </FadeIn>
          <FadeIn delay={0.06}>
            <h1 className="max-w-[20ch]">{t.title}</h1>
          </FadeIn>
          <FadeIn delay={0.12}>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-[var(--color-mk-muted)]">
              {t.lead}
            </p>
          </FadeIn>
        </div>
      </section>

      <Section className="pt-4">
        <Pricing lang={locale} />
      </Section>

      <FrameRule />

      <Section>
        <SectionHead
          eyebrow={t.addon.eyebrow}
          title={t.addon.title}
          lead={t.addon.lead}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-4 sm:grid-cols-2">
            {t.addon.includes.map((item) => (
              <Card key={item.title} className="h-full p-6">
                <h4 className="mb-2 text-lg text-[var(--color-mk-text)]">{item.title}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">{item.body}</p>
              </Card>
            ))}
          </div>

          <Card className="h-full p-8">
            <p className="text-[0.9375rem] text-[var(--color-mk-muted)]">{t.addon.subscription}</p>
            <p className="mt-2 text-4xl font-medium text-[var(--color-mk-text)]">
              {SITE_ADDON.monthly} zł
              <span className="text-base font-normal text-[var(--color-mk-muted)]"> {t.addon.perMonth}</span>
            </p>
            <p className="mt-3 text-[0.9375rem] text-[var(--color-mk-muted)]">
              {fill(t.addon.yearNote)}
            </p>
            <p className="mt-6 border-t border-[var(--color-mk-line)] pt-6 text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
              {fill(t.addon.setupNote)}
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button href="/wzory">{t.addon.ctaTemplates}</Button>
              <Link
                href={`${href("/kontakt")}?temat=strona-www`}
                className="rounded-xl border border-[var(--color-mk-line)] px-5 py-3 text-center text-[0.9375rem] font-medium text-[var(--color-mk-text)] transition hover:border-[var(--color-mk-line-lit)]"
              >
                {t.addon.ctaPreview}
              </Link>
            </div>
          </Card>
        </div>
      </Section>

      <FrameRule />

      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHead eyebrow={t.faq.eyebrow} title={t.faq.title} />

          <div className="mt-12">
            {t.faq.items.map((item, i) => (
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
                    {fill(item.a)}
                  </p>
                </details>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section className="pb-32">
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[20ch]">{t.cta.title}</h2>
          <p className="mt-5 max-w-[46ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
            {t.cta.lead}
          </p>
          <div className="mt-10">
            <Button href={href("/kontakt")}>{t.cta.button}</Button>
          </div>
        </div>
      </Section>

      <SiteFooter lang={locale} />
    </div>
  );
}
