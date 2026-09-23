import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/site/config";
import { siteOffer, siteOffers, siteTeam } from "@/lib/site/data";
import { getWzor } from "@/lib/wzory/themes";
import { DEAL_LABELS, KIND_LABELS, priceLabel, pricePerM2 } from "@/lib/wzory/data";
import { OfferGallery } from "../../../../components/wzory/gallery";
import { OfferCard } from "../../../../components/wzory/offer-card";
import { SiteLeadForm } from "../../../../components/wzory/site-lead-form";
import { WzMap } from "../../../../components/wzory/map";
import { FavButton } from "../../../../components/wzory/favorites";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const site = await getSiteBySlug(slug);
  const offer = site ? await siteOffer(site.agencyId, id) : null;
  return {
    title: `${offer?.title ?? "Oferta"} | ${site?.brand.officeName ?? "Biuro"}`,
    description: offer?.lead,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const site = await getSiteBySlug(slug);
  if (!site || !site.published) notFound();

  const offer = await siteOffer(site.agencyId, id);
  if (!offer) notFound();

  const base = `/strona/${site.slug}`;
  const theme = getWzor(site.template);
  const [team, all] = await Promise.all([siteTeam(site.agencyId), siteOffers(site.agencyId)]);
  const agent = team.find((a) => a.id === offer.agentId) ?? team[0];
  const similar = all.filter((o) => o.id !== offer.id).slice(0, 3);

  const rows: [string, string][] = [
    ["Numer oferty", offer.no],
    ["Rodzaj", KIND_LABELS[offer.kind]],
    ["Transakcja", DEAL_LABELS[offer.deal]],
    ["Powierzchnia", `${offer.area} m²`],
    ["Liczba pokoi", offer.rooms ? String(offer.rooms) : "nie dotyczy"],
    ["Piętro", offer.floor ?? "nie dotyczy"],
    ["Rok budowy", offer.year ? String(offer.year) : "brak danych"],
    ["Cena za metr", pricePerM2(offer)],
    ["Lokalizacja", [offer.city, offer.street].filter(Boolean).join(", ")],
  ];

  // Dane strukturalne oferty: Google pokazuje wtedy cenę i metraż w wynikach.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: offer.title,
    description: offer.lead || offer.description[0],
    image: offer.photos.slice(0, 5),
    sku: offer.no,
    offers: {
      "@type": "Offer",
      price: offer.price,
      priceCurrency: "PLN",
      availability: "https://schema.org/InStock",
      url: site.domain ? `https://${site.domain}/oferta/${offer.id}` : `https://agentspace.pl${base}/oferta/${offer.id}`,
      seller: { "@type": "RealEstateAgent", name: site.brand.officeName },
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Powierzchnia", value: `${offer.area} m2` },
      offer.rooms ? { "@type": "PropertyValue", name: "Pokoje", value: String(offer.rooms) } : null,
      offer.floor ? { "@type": "PropertyValue", name: "Piętro", value: offer.floor } : null,
    ].filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="wz-sec wz-sec--tight" style={{ paddingBottom: 0 }}>
        <div className="wz-wrap">
          <p className="wz-muted" style={{ fontSize: 14, marginBottom: 16 }}>
            <Link href={base}>Strona główna</Link> · <Link href={`${base}/oferty`}>Oferty</Link> · {offer.city}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 18, marginBottom: 24 }}>
            <div>
              <p className="wz-kick" style={{ marginBottom: 10 }}>
                {DEAL_LABELS[offer.deal]} · {offer.no}
              </p>
              <h1 className="wz-h2" style={{ marginBottom: 10 }}>
                {offer.title}
              </h1>
              <p className="wz-lead">{[offer.city, offer.street].filter(Boolean).join(", ")}</p>
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
          <OfferGallery photos={offer.photos} title={offer.title} />
        </div>
      </section>

      <section className="wz-sec">
        <div className="wz-wrap wz-split">
          <div>
            {offer.description.length > 0 && (
              <>
                <h2 className="wz-h3" style={{ marginBottom: 14 }}>
                  Opis nieruchomości
                </h2>
                <div style={{ display: "grid", gap: 14, fontSize: 16.5, color: "var(--d-muted-strong)" }}>
                  {offer.description.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </>
            )}

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

            {offer.features.length > 0 && (
              <>
                <h2 className="wz-h3" style={{ margin: "36px 0 14px" }}>
                  W tej ofercie
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {offer.features.map((f) => (
                    <span key={f} style={{ padding: "9px 14px", border: "1px solid var(--d-line-strong)", borderRadius: "var(--d-radius)", fontSize: 14.5 }}>
                      {f}
                    </span>
                  ))}
                </div>
              </>
            )}

            <h2 className="wz-h3" style={{ margin: "36px 0 14px" }}>
              Lokalizacja
            </h2>
            <div style={{ height: 380, borderRadius: "var(--d-radius-lg)", overflow: "hidden", border: "1px solid var(--d-line)" }}>
              <WzMap offers={[offer]} base={base} dark={theme?.dark} />
            </div>
          </div>

          <aside style={{ display: "grid", gap: 18 }} className="wz-sticky">
            {agent && (
              <div className="wza">
                <div className="wza__ph">
                  <Image src={agent.photo} alt={agent.name} width={76} height={76} />
                </div>
                <div>
                  <p className="wza__name">{agent.name}</p>
                  <p className="wza__role">{agent.role}</p>
                  <div className="wza__links">
                    {agent.phone && (
                      <a href={`tel:${agent.phone.replace(/\s/g, "")}`} className="wz-btn wz-btn--sm">
                        {agent.phone}
                      </a>
                    )}
                    {agent.email && (
                      <a href={`mailto:${agent.email}`} className="wz-btn wz-btn--sm wz-btn--ghost">
                        Napisz
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="wz-box">
              <h2 className="wz-h3" style={{ marginBottom: 6 }}>
                Zapytaj o tę ofertę
              </h2>
              <p className="wz-muted" style={{ fontSize: 14, marginBottom: 16 }}>
                Odpowiadamy w godzinach pracy biura.
              </p>
              <SiteLeadForm agencyId={site.agencyId} base={base} kind="oferta" offerNo={offer.no} />
            </div>

            <div className="wz-box" style={{ position: "relative" }}>
              <p style={{ fontSize: 14.5, paddingRight: 44 }}>
                Zapisz ofertę na później. Przy kontakcie dołączymy listę do wiadomości.
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
