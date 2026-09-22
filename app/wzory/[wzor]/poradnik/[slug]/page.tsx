import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWzor, WZORY } from "@/lib/wzory/themes";
import { DEMO_ARTICLES } from "@/lib/wzory/data";
import { ArticlePage } from "../../../../components/wzory/pages/common";

export function generateStaticParams() {
  return WZORY.flatMap((w) => DEMO_ARTICLES.map((a) => ({ wzor: w.slug, slug: a.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ wzor: string; slug: string }>;
}): Promise<Metadata> {
  const { wzor, slug } = await params;
  const w = getWzor(wzor);
  const a = DEMO_ARTICLES.find((x) => x.slug === slug);
  return {
    title: `${a?.title ?? "Poradnik"} | ${w?.office ?? "Wzór"} | wzór AgentSpace`,
    description: a?.lead,
    robots: { index: false, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ wzor: string; slug: string }> }) {
  const { wzor, slug } = await params;
  const w = getWzor(wzor);
  const a = DEMO_ARTICLES.find((x) => x.slug === slug);
  if (!w || !a) notFound();

  return <ArticlePage wzor={w} a={a} />;
}
