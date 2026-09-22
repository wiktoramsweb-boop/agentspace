import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWzor } from "@/lib/wzory/themes";
import { FormPage } from "../../../components/wzory/pages/common";
import { FAQ_ZAKUP } from "@/lib/wzory/data";

export async function generateMetadata({ params }: { params: Promise<{ wzor: string }> }): Promise<Metadata> {
  const { wzor } = await params;
  const w = getWzor(wzor);
  return { title: `Zleć poszukiwanie | ${w?.office ?? "Wzór"} | wzór AgentSpace`, robots: { index: false, follow: true } };
}

export default async function Page({ params }: { params: Promise<{ wzor: string }> }) {
  const { wzor } = await params;
  const w = getWzor(wzor);
  if (!w) notFound();

  return (
    <FormPage
      wzor={w}
      kind="poszukiwanie"
      kick="Zlecenie poszukiwania"
      title="Nie ma na stronie tego, czego szukasz?"
      lead="Opisz kryteria, a my będziemy szukać także poza publicznymi ogłoszeniami. Około jedna trzecia transakcji zamyka się u nas przed publikacją oferty."
      bullets={[
        "Szukamy w bazie biura, w systemie wymiany ofert i wśród właścicieli",
        "Dzwonimy tylko wtedy, gdy mamy coś realnie pasującego",
        "Sprawdzamy stan prawny, zanim pojedziesz oglądać",
        "Usługa dla kupującego jest bezpłatna",
      ]}
      photo="/wzory/las.jpg"
      faq={FAQ_ZAKUP}
    />
  );
}
