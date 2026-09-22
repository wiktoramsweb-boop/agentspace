import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWzor } from "@/lib/wzory/themes";
import { HomeKamienica } from "../../components/wzory/homes/kamienica";
import { HomeNokturn } from "../../components/wzory/homes/nokturn";
import { HomeSiatka } from "../../components/wzory/homes/siatka";
import { HomePrzystan } from "../../components/wzory/homes/przystan";

export async function generateMetadata({ params }: { params: Promise<{ wzor: string }> }): Promise<Metadata> {
  const { wzor } = await params;
  const w = getWzor(wzor);
  if (!w) return { robots: { index: false, follow: false } };
  return {
    title: `${w.name} | wzór strony dla biura nieruchomości | AgentSpace`,
    description: w.tagline,
    // Wzory to strony pokazowe z fikcyjnym biurem: nie chcemy ich w wynikach
    // wyszukiwania obok prawdziwych stron klientów.
    robots: { index: false, follow: true },
  };
}

export default async function WzorHome({ params }: { params: Promise<{ wzor: string }> }) {
  const { wzor } = await params;
  const w = getWzor(wzor);
  if (!w) notFound();

  if (w.slug === "kamienica") return <HomeKamienica wzor={w.slug} />;
  if (w.slug === "nokturn") return <HomeNokturn wzor={w.slug} />;
  if (w.slug === "siatka") return <HomeSiatka wzor={w.slug} />;
  return <HomePrzystan wzor={w.slug} />;
}
