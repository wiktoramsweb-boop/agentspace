import type { Metadata } from "next";
import Link from "next/link";
import { getAllPostsMeta, formatDate } from "@/lib/blog";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PdHero } from "@/app/components/ld/podstrona";
import { zdjecie } from "@/lib/marketing/zdjecia-podstron";
import { BlogVisual } from "@/app/components/blog-visual";
import { StaggerContainer, StaggerItem } from "@/app/components/fade-in";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.blog.meta;
  return pageMetadata(locale, "/blog", t.title, t.description);
}

export default async function BlogIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDict(locale).pages.blog;
  const posts = getAllPostsMeta();

  return (
    <>
      <SiteNav lang={locale} />
      <main className="mk relative min-h-screen">
        <PdHero
          wariant="pas"
          tlo={zdjecie("naglowek-blog")}
          alt={""}
          eyebrow={t.hero.eyebrow}
          tytul={t.hero.title}
          opis={t.hero.description}
        />

        {/* Artykuły powstają po polsku - mówimy o tym wprost, zamiast zostawiać
            anglojęzycznego czytelnika z niespodzianką po kliknięciu. */}
        {t.languageNotice ? (
          <p className="mx-auto max-w-6xl px-6 pt-10 text-sm text-[var(--color-mk-muted)]">
            {t.languageNotice}
          </p>
        ) : null}

        {/* Posts grid */}
        <section className="px-6 py-20 md:py-24">
          <div className="mx-auto max-w-6xl">
            <StaggerContainer
              className="grid gap-6 md:grid-cols-2 lg:gap-8"
              staggerDelay={0.1}
            >
              {posts.map((post) => (
                <StaggerItem key={post.slug}>
                  <Link
                    href={localeHref(locale, `/blog/${post.slug}`)}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] transition-all hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-[var(--mk-card-bg)]"
                  >
                    {/* Visual cover */}
                    <BlogVisual category={post.category} />

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-6 md:p-8">
                      <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-emerald-400">
                        {post.category}
                      </p>

                      <h2 className="bl-karta mb-3 text-xl font-semibold leading-tight text-[var(--color-mk-text)] transition group-hover:text-emerald-50 md:text-2xl">
                        {post.title}
                      </h2>

                      <p className="mb-6 flex-1 text-sm leading-relaxed text-[var(--color-mk-muted)] md:text-base">
                        {post.description}
                      </p>

                      {/* Meta footer */}
                      <div className="flex items-center justify-between border-t border-[var(--mk-hairline)] pt-4 text-xs text-[var(--color-mk-muted)]">
                        <span>{formatDate(post.date)}</span>
                        <span className="flex items-center gap-1.5">
                          <span>{post.readingTime}</span>
                          <span className="text-zinc-700">·</span>
                          <span className="font-medium text-[var(--color-mk-muted)] transition group-hover:translate-x-0.5 group-hover:text-emerald-400">
                            Czytaj →
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {posts.length === 0 && (
              <p className="text-center text-[var(--color-mk-muted)]">Wkrótce pierwsze artykuły.</p>
            )}
          </div>
        </section>

        {/* CTA na końcu */}
        <section className="border-t border-[var(--mk-hairline)] px-6 py-20">
          <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/30 bg-[var(--mk-card-bg)] p-8 text-center md:p-12">
            <h2 className="mb-4 text-2xl font-semibold tracking-tight md:text-3xl">
              Buduj wiedzę. Buduj zespół.
            </h2>
            <p className="mb-6 text-[var(--color-mk-muted)]">
              AgentSpace działa na produkcji w polskich biurach nieruchomości. Wdrożenie zajmuje jeden dzień roboczy.
            </p>
            <Link
              href="/#waitlist"
              className="inline-flex items-center rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-[var(--mk-on-accent)] transition hover:bg-emerald-400"
            >
              Umów rozmowę →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter lang={locale} />
    </>
  );
}
