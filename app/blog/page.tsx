import type { Metadata } from "next";
import Link from "next/link";
import { getAllPostsMeta, formatDate } from "@/lib/blog";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";

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
        {/* Header */}
        <section className="border-b border-zinc-900 px-6 pt-32 pb-16">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Blog AgentSpace
            </p>
            <h1 className="mb-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Szkolenie, sprzedaż, AI — dla biur nieruchomości
            </h1>
            <p className="max-w-2xl text-lg text-zinc-400">
              Praktyczne artykuły dla właścicieli biur i agentów. Konkretne techniki,
              prawdziwe liczby, polski rynek.
            </p>
          </div>
        </section>

        {/* Posts grid */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6 transition-all hover:border-emerald-500/30 hover:bg-zinc-900/50 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] md:p-8"
                >
                  {/* Category */}
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-emerald-400">
                    {post.category}
                  </p>

                  {/* Title */}
                  <h2 className="mb-3 text-xl font-semibold leading-tight text-white transition group-hover:text-emerald-50 md:text-2xl">
                    {post.title}
                  </h2>

                  {/* Description */}
                  <p className="mb-6 flex-1 text-sm leading-relaxed text-zinc-400 md:text-base">
                    {post.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{formatDate(post.date)}</span>
                    <span className="flex items-center gap-1.5">
                      <span>{post.readingTime}</span>
                      <span>·</span>
                      <span className="transition group-hover:translate-x-0.5 group-hover:text-emerald-400">
                        Czytaj →
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {posts.length === 0 && (
              <p className="text-center text-zinc-500">Wkrótce pierwsze artykuły.</p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
