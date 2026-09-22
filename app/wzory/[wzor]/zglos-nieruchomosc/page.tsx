import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWzor } from "@/lib/wzory/themes";
import { FormPage } from "../../../components/wzory/pages/common";
import { FAQ_SPRZEDAZ } from "@/lib/wzory/data";

export async function generateMetadata({ params }: { params: Promise<{ wzor: string }> }): Promise<Metadata> {
  const { wzor } = await params;
  const w = getWzor(wzor);
  return { title: `Zgłoś nieruchomość | ${w?.office ?? "Wzór"} | wzór AgentSpace`, robots: { index: false, follow: true } };
}

export default async function Page({ params }: { params: Promise<{ wzor: string }> }) {
  const { wzor } = await params;
  const w = getWzor(wzor);
  if (!w) notFound();

  return (
    <FormPage
      wzor={w}
      kind="zglos"
      kick="Zgłoszenie nieruchomości"
      title="Powiedz nam, co chcesz sprzedać albo wynająć"
      lead="Wystarczy adres i metraż. Resztę ustalimy w rozmowie, a wycenę przygotujemy na podstawie cen transakcyjnych z Twojej okolicy."
      bullets={[
        "Wycena bezpłatna i bez zobowiązania do podpisania umowy",
        "Odpowiadamy w dwie godziny robocze",
        "Oglądamy nieruchomość w terminie, który Ci pasuje, także wieczorem",
        "Jeśli sprzedaż nie ma teraz sensu, powiemy to wprost",
      ]}
      photo="/wzory/kamienica.jpg"
      faq={FAQ_SPRZEDAZ}
    />
  );
}
