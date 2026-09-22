import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/site/config";
import { ASSET_BUCKET, publicAssetUrl } from "@/lib/storage";
import { SiteLeadForm } from "../../../components/wzory/site-lead-form";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  return { title: `Zgłoś nieruchomość | ${site?.brand.officeName ?? "Biuro nieruchomości"}` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site || !site.published) notFound();

  const base = `/strona/${site.slug}`;
  const photo = site.brand.heroPath ? publicAssetUrl(ASSET_BUCKET, site.brand.heroPath) : "/wzory/kamienica.jpg";

  return (
    <section className="wz-sec wz-sec--tight">
      <div className="wz-wrap wz-split">
        <div>
          <p className="wz-kick">Zgłoszenie nieruchomości</p>
          <h1 className="wz-h2" style={{ marginBottom: 18 }}>
            Chcesz sprzedać albo wynająć?
          </h1>
          <p className="wz-lead" style={{ marginBottom: 26 }}>
            Wystarczy adres i metraż. Wycenę przygotujemy na podstawie cen transakcyjnych z Twojej okolicy, a nie ofertowych z portali.
          </p>
          <ul className="wz-ticks" data-revs>
            <li>Wycena bezpłatna i bez zobowiązania</li>
            <li>Odpowiadamy w dwie godziny robocze</li>
            <li>Oglądamy nieruchomość w dogodnym terminie</li>
            <li>Jeśli sprzedaż nie ma teraz sensu, powiemy to wprost</li>
          </ul>
          <figure className="wz-img wz-media" style={{ margin: "32px 0 0", aspectRatio: "16 / 9" }} data-rev data-rev-zoom>
            <Image src={photo} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
          </figure>
        </div>

        <div className="wz-box wz-sticky" data-rev>
          <SiteLeadForm agencyId={site.agencyId} base={base} kind="zglos" />
        </div>
      </div>
    </section>
  );
}
