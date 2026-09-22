import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/site/config";
import { ASSET_BUCKET, publicAssetUrl } from "@/lib/storage";
import { SiteLeadForm } from "../../../components/wzory/site-lead-form";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  return { title: `Zleć poszukiwanie | ${site?.brand.officeName ?? "Biuro nieruchomości"}` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site || !site.published) notFound();

  const base = `/strona/${site.slug}`;
  const photo = site.brand.heroPath ? publicAssetUrl(ASSET_BUCKET, site.brand.heroPath) : "/wzory/las.jpg";

  return (
    <section className="wz-sec wz-sec--tight">
      <div className="wz-wrap wz-split">
        <div>
          <p className="wz-kick">Zlecenie poszukiwania</p>
          <h1 className="wz-h2" style={{ marginBottom: 18 }}>
            Nie ma tego, czego szukasz?
          </h1>
          <p className="wz-lead" style={{ marginBottom: 26 }}>
            Opisz kryteria, a będziemy szukać także poza publicznymi ogłoszeniami. Część transakcji zamyka się, zanim oferta trafi na portale.
          </p>
          <ul className="wz-ticks" data-revs>
            <li>Szukamy w bazie biura i wśród właścicieli</li>
            <li>Dzwonimy tylko z realnie pasującymi ofertami</li>
            <li>Sprawdzamy stan prawny przed oglądaniem</li>
            <li>Dla kupującego usługa jest bezpłatna</li>
          </ul>
          <figure className="wz-img wz-media" style={{ margin: "32px 0 0", aspectRatio: "16 / 9" }} data-rev data-rev-zoom>
            <Image src={photo} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
          </figure>
        </div>

        <div className="wz-box wz-sticky" data-rev>
          <SiteLeadForm agencyId={site.agencyId} base={base} kind="poszukiwanie" />
        </div>
      </div>
    </section>
  );
}
