import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWzor } from "@/lib/wzory/themes";
import { BlogListPage } from "../../../components/wzory/pages/common";

export async function generateMetadata({ params }: { params: Promise<{ wzor: string }> }): Promise<Metadata> {
  const { wzor } = await params;
  const w = getWzor(wzor);
  return { title: `Poradnik | ${w?.office ?? "Wzór"} | wzór AgentSpace`, robots: { index: false, follow: true } };
}

export default async function Page({ params }: { params: Promise<{ wzor: string }> }) {
  const { wzor } = await params;
  const w = getWzor(wzor);
  if (!w) notFound();

  return <BlogListPage wzor={w} />;
}
