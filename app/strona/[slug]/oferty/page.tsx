import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/site/config";
import { siteOffers } from "@/lib/site/data";
import { getWzor } from "@/lib/wzory/themes";
import { OffersBrowser, type OffersQuery } from "../../../components/wzory/offers-browser";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  return { title: `Oferty | ${site?.brand.officeName ?? "Biuro nieruchomości"}` };
}

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : (v ?? "")).trim();
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const site = await getSiteBySlug(slug);
  if (!site || !site.published) notFound();

  const offers = await siteOffers(site.agencyId);
  const theme = getWzor(site.template);

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
          {initial.deal === "wynajem" ? "Nieruchomości na wynajem" : initial.deal === "sprzedaz" ? "Nieruchomości na sprzedaż" : "Wszystkie oferty"}
        </h1>
        <p className="wz-lead">Filtry zapisują się w adresie strony, więc wynik wyszukiwania możesz wysłać linkiem.</p>
        <div style={{ marginTop: 26 }}>
          <OffersBrowser base={`/strona/${site.slug}`} initial={initial} offers={offers} dark={theme?.dark} />
        </div>
      </div>
    </section>
  );
}
