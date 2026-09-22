import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWzor } from "@/lib/wzory/themes";
import { HomeKamienica } from "../../components/wzory/homes/kamienica";
import { HomeNokturn } from "../../components/wzory/homes/nokturn";
import { HomeSiatka } from "../../components/wzory/homes/siatka";
import { HomePrzystan } from "../../components/wzory/homes/przystan";
import { HomeStrategia } from "../../components/wzory/homes/strategia";
import { HomeBeton } from "../../components/wzory/homes/beton";
import { HomeOgrod } from "../../components/wzory/homes/ogrod";
import { HomeHoryzont } from "../../components/wzory/homes/horyzont";

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

  switch (w.slug) {
    case "kamienica":
      return <HomeKamienica wzor={w.slug} />;
    case "nokturn":
      return <HomeNokturn wzor={w.slug} />;
    case "siatka":
      return <HomeSiatka wzor={w.slug} />;
    case "przystan":
      return <HomePrzystan wzor={w.slug} />;
    case "strategia":
      return <HomeStrategia wzor={w.slug} />;
    case "beton":
      return <HomeBeton wzor={w.slug} />;
    case "ogrod":
      return <HomeOgrod wzor={w.slug} />;
    default:
      return <HomeHoryzont wzor={w.slug} />;
  }
}
