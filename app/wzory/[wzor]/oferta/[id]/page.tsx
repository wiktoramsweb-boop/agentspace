import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWzor, WZORY } from "@/lib/wzory/themes";
import {
  DEAL_LABELS,
  DEMO_OFFERS,
  KIND_LABELS,
  getAgent,
  getOffer,
  priceLabel,
  pricePerM2,
} from "@/lib/wzory/data";
import { OfferGallery } from "../../../../components/wzory/gallery";
import { OfferCard } from "../../../../components/wzory/offer-card";
import { LeadForm } from "../../../../components/wzory/lead-form";
import { WzMap } from "../../../../components/wzory/map";
import { FavButton } from "../../../../components/wzory/favorites";

export async function generateMetadata({ params }: { params: Promise<{ wzor: string; id: string }> }): Promise<Metadata> {
  const { wzor, id } = await params;
  const w = getWzor(wzor);
  const o = getOffer(id);
  return {
    title: `${o?.title ?? "Oferta"} | ${w?.office ?? "Wzór"} | wzór AgentSpace`,
    description: o?.lead,
    robots: { index: false, follow: true },
  };
}

export function generateStaticParams() {
  return WZORY.flatMap((w) => DEMO_OFFERS.map((o) => ({ wzor: w.slug, id: o.id })));
}

export default async function OfertaPage({ params }: { params: Promise<{ wzor: string; id: string }> }) {
  const { wzor, id } = await params;
  const w = getWzor(wzor);
  const offer = getOffer(id);
  if (!w || !offer) notFound();

  const base = `/wzory/${w.slug}`;
  const agent = getAgent(offer.agentId);
  const similar = DEMO_OFFERS.filter((o) => o.id !== offer.id && (o.district === offer.district || o.kind === offer.kind)).slice(0, 3);

  const rows: [string, string][] = [
    ["Numer oferty", offer.no],
    ["Rodzaj", KIND_LABELS[offer.kind]],
    ["Transakcja", DEAL_LABELS[offer.deal]],
    ["Powierzchnia", `${offer.area} m²`],
    ["Liczba pokoi", offer.rooms ? String(offer.rooms) : "nie dotyczy"],
    ["Piętro", offer.floor ?? "nie dotyczy"],
    ["Rok budowy", offer.year ? String(offer.year) : "brak danych"],
    ["Cena za metr", pricePerM2(offer)],
    ["Klasa energetyczna", offer.energy ?? "w przygotowaniu"],
    ["Lokalizacja", `${offer.city}, ${offer.district}, ${offer.street}`],
  ];

  return (
    <>
      <section className="wz-sec wz-sec--tight" style={{ paddingBottom: 0 }}>
        <div className="wz-wrap">
          <p className="wz-muted" style={{ fontSize: 14, marginBottom: 16 }}>
            <Link href={`/wzory/${w.slug}`}>Strona główna</Link> · <Link href={`/wzory/${w.slug}/oferty`}>Oferty</Link> ·{" "}
            {offer.district}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 18, marginBottom: 24 }}>
            <div>
              <p className="wz-kick" style={{ marginBottom: 10 }}>
                {DEAL_LABELS[offer.deal]} · {offer.no}
              </p>
              <h1 className="wz-h2" style={{ marginBottom: 10 }}>
                {offer.title}
              </h1>
              <p className="wz-lead">
                {offer.city}, {offer.district}, {offer.street}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "var(--d-display)", fontSize: "clamp(28px, 3.4vw, 42px)", lineHeight: 1 }}>
                {priceLabel(offer)}
              </p>
              <p className="wz-muted" style={{ fontSize: 14, marginTop: 6 }}>
                {pricePerM2(offer)}
              </p>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <OfferGallery photos={offer.photos} title={offer.title} />
          </div>
        </div>
      </section>

      <section className="wz-sec">
        <div className="wz-wrap" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)", gap: "clamp(24px, 4vw, 56px)", alignItems: "start" }}>
          <div>
            <h2 className="wz-h3" style={{ marginBottom: 14 }}>
              Opis nieruchomości
            </h2>
            <div style={{ display: "grid", gap: 14, fontSize: 16.5, color: "var(--d-muted-strong)" }}>
              {offer.description.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <h2 className="wz-h3" style={{ margin: "36px 0 14px" }}>
              Dane techniczne
            </h2>
            <table className="wzt">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 className="wz-h3" style={{ margin: "36px 0 14px" }}>
              W tej ofercie
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {offer.features.map((f) => (
                <span
                  key={f}
                  style={{
                    padding: "9px 14px",
                    border: "1px solid var(--d-line-strong)",
                    borderRadius: "var(--d-radius)",
                    fontSize: 14.5,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>

            <h2 className="wz-h3" style={{ margin: "36px 0 14px" }}>
              Lokalizacja
            </h2>
            <div style={{ height: 380, borderRadius: "var(--d-radius-lg)", overflow: "hidden", border: "1px solid var(--d-line)" }}>
              <WzMap offers={[offer]} base={base} dark={w.dark} />
            </div>
          </div>

          <aside style={{ display: "grid", gap: 18, position: "sticky", top: 92 }}>
            <div className="wza">
              <div className="wza__ph">
                <Image src={agent.photo} alt={agent.name} width={76} height={76} />
              </div>
              <div>
                <p className="wza__name">{agent.name}</p>
                <p className="wza__role">{agent.role}</p>
                <div className="wza__links">
                  <a href={`tel:${agent.phone.replace(/\s/g, "")}`} className="wz-btn wz-btn--sm">
                    {agent.phone}
                  </a>
                  <a href={`mailto:${agent.email}`} className="wz-btn wz-btn--sm wz-btn--ghost">
                    Napisz
                  </a>
                </div>
              </div>
            </div>

            <div style={{ border: "1px solid var(--d-line)", borderRadius: "var(--d-radius-lg)", padding: "clamp(18px, 2.4vw, 26px)", background: "var(--d-card)" }}>
              <h2 className="wz-h3" style={{ marginBottom: 6 }}>
                Zapytaj o tę ofertę
              </h2>
              <p className="wz-muted" style={{ fontSize: 14, marginBottom: 16 }}>
                Odpowiadamy w godzinach pracy biura, zwykle tego samego dnia.
              </p>
              <LeadForm kind="oferta" offerNo={offer.no} />
            </div>

            <div style={{ position: "relative", border: "1px solid var(--d-line)", borderRadius: "var(--d-radius-lg)", padding: 18, background: "var(--d-card)" }}>
              <p style={{ fontSize: 14.5, paddingRight: 44 }}>
                Zapisz ofertę na później, a przy kontakcie agent zobaczy, co Cię interesowało.
              </p>
              <FavButton base={base} id={offer.id} label={offer.title} />
            </div>
          </aside>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="wz-sec wz-sec--tight">
          <div className="wz-wrap">
            <p className="wz-kick">Podobne</p>
            <h2 className="wz-h2" style={{ marginBottom: 30 }}>
              Zobacz też
            </h2>
            <div className="wz-grid" data-revs>
              {similar.map((o) => (
                <OfferCard key={o.id} offer={o} base={base} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
