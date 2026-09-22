import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/site/config";
import { siteOffers } from "@/lib/site/data";
import { ASSET_BUCKET, publicAssetUrl } from "@/lib/storage";
import { Faq, Head, Steps } from "../../../components/wzory/bits";
import { SiteLeadForm } from "../../../components/wzory/site-lead-form";
import { OfferCard } from "../../../components/wzory/offer-card";
import { FAQ_SPRZEDAZ } from "@/lib/wzory/data";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  return { title: `Sprzedaj nieruchomość | ${site?.brand.officeName ?? "Biuro nieruchomości"}` };
}

const STEPS: [string, string][] = [
  ["Rozmowa i wycena", "Oglądamy nieruchomość i przygotowujemy wycenę na piśmie, opartą o ceny transakcyjne z okolicy."],
  ["Przygotowanie", "Home staging, sesja zdjęciowa, rzut i komplet dokumentów. Zwykle kilka dni roboczych."],
  ["Rynek", "Publikacja, prezentacje i regularny raport: wyświetlenia, telefony i uwagi kupujących."],
  ["Finał", "Negocjacje, umowa przedwstępna, akt notarialny i protokół zdawczy."],
];

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site || !site.published) notFound();

  const base = `/strona/${site.slug}`;
  const offers = (await siteOffers(site.agencyId)).filter((o) => o.deal === "sprzedaz").slice(0, 3);
  const photo = site.brand.heroPath ? publicAssetUrl(ASSET_BUCKET, site.brand.heroPath) : "/wzory/salon-widok.jpg";

  return (
    <>
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap wz-split">
          <div>
            <p className="wz-kick">Sprzedaż nieruchomości</p>
            <h1 className="wz-h2" style={{ marginBottom: 18 }}>
              Sprzedamy drożej, niż sprzedałbyś sam
            </h1>
            <p className="wz-lead" style={{ marginBottom: 26 }}>
              {site.content.ctaLead}
            </p>
            <ul className="wz-ticks" data-revs>
              {site.content.reasons.map((r) => (
                <li key={r.title}>{r.title}</li>
              ))}
              <li>Wynagrodzenie dopiero po podpisaniu aktu notarialnego</li>
            </ul>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
              <Link href={`${base}/zglos-nieruchomosc`} className="wz-btn">
                Zamów bezpłatną wycenę
              </Link>
              <Link href={`${base}/kontakt`} className="wz-btn wz-btn--ghost">
                Zadaj pytanie
              </Link>
            </div>
          </div>
          <figure className="wz-img wz-media" style={{ margin: 0, aspectRatio: "4 / 5" }} data-rev data-rev-zoom>
            <Image src={photo} alt="" fill sizes="(max-width: 900px) 100vw, 40vw" priority />
          </figure>
        </div>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <Head kick="Przebieg" title="Jak to wygląda krok po kroku" />
          <Steps items={STEPS} />
        </div>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap wz-split">
          <div>
            <Head kick="Pytania" title="To, o co pytają najczęściej" />
            <Faq items={FAQ_SPRZEDAZ} />
          </div>
          <div className="wz-box wz-sticky" data-rev>
            <h2 className="wz-h3" style={{ marginBottom: 8 }}>
              Zacznij od wyceny
            </h2>
            <p className="wz-muted" style={{ fontSize: 14.5, marginBottom: 18 }}>
              Bezpłatnie i bez zobowiązania do podpisania umowy.
            </p>
            <SiteLeadForm agencyId={site.agencyId} base={base} kind="zglos" />
          </div>
        </div>
      </section>

      {offers.length > 0 && (
        <section className="wz-sec wz-sec--tight">
          <div className="wz-wrap">
            <Head
              kick="Z naszej bazy"
              title="Co teraz sprzedajemy"
              action={
                <Link href={`${base}/oferty`} className="wz-btn wz-btn--ghost">
                  Wszystkie oferty
                </Link>
              }
            />
            <div className="wz-grid" data-revs>
              {offers.map((o) => (
                <OfferCard key={o.id} offer={o} base={base} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
