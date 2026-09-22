import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/site/config";
import { ASSET_BUCKET, publicAssetUrl } from "@/lib/storage";
import { SiteLeadForm } from "../../../components/wzory/site-lead-form";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  return { title: `Kontakt | ${site?.brand.officeName ?? "Biuro nieruchomości"}` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site || !site.published) notFound();

  const base = `/strona/${site.slug}`;
  const photo = site.brand.heroPath ? publicAssetUrl(ASSET_BUCKET, site.brand.heroPath) : "/wzory/dziedziniec.jpg";

  return (
    <section className="wz-sec wz-sec--tight">
      <div className="wz-wrap wz-split">
        <div>
          <p className="wz-kick">Kontakt</p>
          <h1 className="wz-h2" style={{ marginBottom: 18 }}>
            Napisz albo zadzwoń
          </h1>
          <p className="wz-lead" style={{ marginBottom: 26 }}>
            Każde zgłoszenie z tej strony trafia od razu do systemu i do konkretnego agenta, a nie na wspólną skrzynkę.
          </p>
          <ul className="wz-ticks" data-revs>
            <li>Odpowiadamy tego samego dnia roboczego</li>
            <li>Rozmowa nie zobowiązuje do podpisania umowy</li>
            <li>Wycena nieruchomości jest bezpłatna</li>
            <li>Umawiamy spotkania także po godzinach</li>
          </ul>
          <figure className="wz-img wz-media" style={{ margin: "32px 0 0", aspectRatio: "16 / 9" }} data-rev data-rev-zoom>
            <Image src={photo} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
          </figure>
        </div>

        <div className="wz-box wz-sticky" data-rev>
          <SiteLeadForm agencyId={site.agencyId} base={base} kind="kontakt" />
        </div>
      </div>
    </section>
  );
}
