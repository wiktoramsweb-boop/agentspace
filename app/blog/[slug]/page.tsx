import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPostSlugs, getPostBySlug, getAllPostsMeta, formatDate } from "@/lib/blog";
import { SiteNav } from "../../components/site-nav";
import { SiteFooter } from "../../components/site-footer";
import { ReadingProgress } from "../../components/reading-progress";
import { BlogVisual } from "../../components/blog-visual";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Nie znaleziono — AgentSpace" };

  return {
    title: `${post.title} | AgentSpace`,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: `https://agentspace.pl/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://agentspace.pl/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      locale: "pl_PL",
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // Pozostałe artykuły do sekcji "Czytaj dalej"
  const allPosts = getAllPostsMeta();
  const relatedPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 2);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "AgentSpace",
      url: "https://agentspace.pl",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://agentspace.pl/blog/${slug}`,
    },
    inLanguage: "pl-PL",
    keywords: post.keywords.join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <SiteNav />
      <ReadingProgress />

      <main className="bg-zinc-950 text-white">
        {/* Hero z visual */}
        <section className="relative overflow-hidden border-b border-zinc-900 pt-32 md:pt-40">
          {/* Visual cover na pełną szerokość */}
          <div className="absolute inset-x-0 top-0 h-[440px] md:h-[520px]">
            <BlogVisual category={post.category} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/60 to-zinc-950" />
          </div>

          <div className="relative z-10 mx-auto max-w-3xl px-6 pb-12 pt-20 md:pt-24">
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-emerald-400"
            >
              <span>←</span> Wszystkie artykuły
            </Link>

            <p className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-emerald-300">
              {post.category}
            </p>

            <h1 className="mb-6 text-3xl font-semibold leading-[1.15] tracking-tight md:text-5xl">
              {post.title}
            </h1>

            <p className="mb-8 text-lg leading-relaxed text-zinc-300 md:text-xl">
              {post.description}
            </p>

            <div className="flex items-center gap-3 border-t border-zinc-800 pt-6 text-sm text-zinc-400">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-xs font-bold text-zinc-950">
                {post.author.charAt(0)}
              </div>
              <span className="text-zinc-200">{post.author}</span>
              <span className="text-zinc-700">·</span>
              <span>{formatDate(post.date)}</span>
              <span className="text-zinc-700">·</span>
              <span>{post.readingTime}</span>
            </div>
          </div>
        </section>

        {/* Article body */}
        <section className="border-b border-zinc-900 px-6 py-20 md:py-24">
          <article
            className="prose-blog mx-auto max-w-3xl"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </section>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="border-b border-zinc-900 px-6 py-20">
            <div className="mx-auto max-w-5xl">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                Czytaj dalej
              </p>
              <h2 className="mb-12 text-3xl font-semibold tracking-tight md:text-4xl">
                Inne artykuły
              </h2>

              <div className="grid gap-6 md:grid-cols-2">
                {relatedPosts.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/30 transition-all hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-zinc-900/50"
                  >
                    <BlogVisual category={p.category} />
                    <div className="flex flex-1 flex-col p-6">
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-emerald-400">
                        {p.category}
                      </p>
                      <h3 className="mb-2 text-lg font-semibold text-white transition group-hover:text-emerald-50">
                        {p.title}
                      </h3>
                      <p className="flex-1 text-sm text-zinc-400">{p.description}</p>
                      <p className="mt-4 text-xs text-zinc-500">
                        {formatDate(p.date)} · {p.readingTime}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-zinc-900/50 p-8 md:p-12">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              AgentSpace
            </p>
            <h2 className="mb-4 text-2xl font-semibold md:text-3xl">
              Zbuduj systematyczny trening agentów w swoim biurze
            </h2>
            <p className="mb-6 text-zinc-400">
              AI Coach + dashboard agenta + ranking zespołu. Premiera Q1 2026. Pierwsze 10 biur:
              3 miesiące za darmo + 30% rabatu na pierwszy rok.
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
