import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPostSlugs, getPostBySlug, formatDate } from "@/lib/blog";
import { SiteNav } from "../../components/site-nav";
import { SiteFooter } from "../../components/site-footer";

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

  // Article JSON-LD schema dla Google rich snippets
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
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
      <main className="bg-zinc-950 text-white">
        {/* Header */}
        <section className="border-b border-zinc-900 px-6 pt-32 pb-12">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-emerald-400"
            >
              ← Wszystkie artykuły
            </Link>

            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
              {post.category}
            </p>

            <h1 className="mb-6 text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              {post.title}
            </h1>

            <p className="mb-8 text-lg leading-relaxed text-zinc-400 md:text-xl">
              {post.description}
            </p>

            <div className="flex items-center gap-3 border-t border-zinc-900 pt-6 text-sm text-zinc-500">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-xs font-bold text-zinc-950">
                {post.author.charAt(0)}
              </div>
              <span className="text-zinc-300">{post.author}</span>
              <span>·</span>
              <span>{formatDate(post.date)}</span>
              <span>·</span>
              <span>{post.readingTime}</span>
            </div>
          </div>
        </section>

        {/* Article body */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <article
            className="prose-blog mx-auto max-w-3xl"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </section>

        {/* CTA bottom */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-zinc-900/50 p-8 md:p-12">
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
