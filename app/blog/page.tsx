import type { Metadata } from "next";
import Link from "next/link";
import { getAllPostsMeta, formatDate } from "@/lib/blog";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { PageHero } from "../components/page-hero";
import { BlogVisual } from "../components/blog-visual";
import { StaggerContainer, StaggerItem } from "../components/fade-in";

export const metadata: Metadata = {
  title: "Blog — Szkolenie agentów nieruchomości | AgentSpace",
  description:
    "Praktyczne artykuły o szkoleniu agentów RE, technikach sprzedaży, AI w nieruchomościach. Dla właścicieli biur i agentów w Polsce.",
  alternates: {
    canonical: "https://agentspace.pl/blog",
  },
};

export default function BlogIndex() {
  const posts = getAllPostsMeta();

  return (
    <>
      <SiteNav />
      <main className="bg-zinc-950 text-white">
        <PageHero
          eyebrow="Blog AgentSpace"
          title="Szkolenie, sprzedaż, AI — dla biur nieruchomości"
          description="Praktyczne artykuły dla właścicieli biur i agentów. Konkretne techniki, prawdziwe liczby, polski rynek."
          compact
        />

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
                    href={`/blog/${post.slug}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/30 transition-all hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-zinc-900/50 hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.3)]"
                  >
                    {/* Visual cover */}
                    <BlogVisual category={post.category} />

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-6 md:p-8">
                      <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-emerald-400">
                        {post.category}
                      </p>

                      <h2 className="mb-3 text-xl font-semibold leading-tight text-white transition group-hover:text-emerald-50 md:text-2xl">
                        {post.title}
                      </h2>

                      <p className="mb-6 flex-1 text-sm leading-relaxed text-zinc-400 md:text-base">
                        {post.description}
                      </p>

                      {/* Meta footer */}
                      <div className="flex items-center justify-between border-t border-zinc-900 pt-4 text-xs text-zinc-500">
                        <span>{formatDate(post.date)}</span>
                        <span className="flex items-center gap-1.5">
                          <span>{post.readingTime}</span>
                          <span className="text-zinc-700">·</span>
                          <span className="font-medium text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-400">
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
              <p className="text-center text-zinc-500">Wkrótce pierwsze artykuły.</p>
            )}
          </div>
        </section>

        {/* CTA na końcu */}
        <section className="border-t border-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-zinc-900/50 p-8 text-center md:p-12">
            <h2 className="mb-4 text-2xl font-semibold tracking-tight md:text-3xl">
              Buduj wiedzę. Buduj zespół.
            </h2>
            <p className="mb-6 text-zinc-400">
              AgentSpace startuje w Q1 2026. Pierwsze 10 biur dostaje 3 miesiące za darmo + 30% rabatu.
            </p>
            <Link
              href="/#waitlist"
              className="inline-flex items-center rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              Dołącz do listy oczekujących →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
