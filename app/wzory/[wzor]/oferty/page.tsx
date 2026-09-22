import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWzor } from "@/lib/wzory/themes";
import { OffersBrowser, type OffersQuery } from "../../../components/wzory/offers-browser";
import { DEMO_OFFERS } from "@/lib/wzory/data";

export async function generateMetadata({ params }: { params: Promise<{ wzor: string }> }): Promise<Metadata> {
  const { wzor } = await params;
  const w = getWzor(wzor);
  return { title: `Oferty | ${w?.office ?? "Wzór"} | wzór AgentSpace`, robots: { index: false, follow: true } };
}

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : (v ?? "")).trim();
}

export default async function OfertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ wzor: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { wzor } = await params;
  const sp = await searchParams;
  const w = getWzor(wzor);
  if (!w) notFound();

  const initial: OffersQuery = {
    deal: one(sp.transakcja),
    kind: one(sp.typ),
    district: one(sp.dzielnica),
    min: one(sp.min),
    max: one(sp.max),
    rooms: one(sp.pokoje),
    q: one(sp.szukaj),
    sort: one(sp.sort) || "nowe",
    favOnly: one(sp.ulubione) === "1",
  };

  return (
    <section className="wz-sec wz-sec--tight">
      <div className="wz-wrap">
        <p className="wz-kick">Baza ofert</p>
        <h1 className="wz-h2" style={{ marginBottom: 14 }}>
          {initial.deal === "wynajem" ? "Nieruchomości na wynajem" : initial.deal === "sprzedaz" ? "Nieruchomości na sprzedaż" : "Wszystkie oferty biura"}
        </h1>
        <p className="wz-lead">
          Filtry zapisują się w adresie strony, więc wynik wyszukiwania możesz wysłać komuś linkiem albo zapisać w
          zakładkach.
        </p>

        <div style={{ marginTop: 26 }}>
          <OffersBrowser base={`/wzory/${w.slug}`} initial={initial} offers={DEMO_OFFERS} dark={w.dark} />
        </div>
      </div>
    </section>
  );
}
