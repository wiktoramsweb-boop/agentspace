import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/site/config";
import { siteOffers } from "@/lib/site/data";
import { FavoritesList } from "../../../components/wzory/favorites-list";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  return { title: `Ulubione oferty | ${site?.brand.officeName ?? "Biuro nieruchomości"}` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site || !site.published) notFound();

  const offers = await siteOffers(site.agencyId);

  return (
    <section className="wz-sec wz-sec--tight">
      <div className="wz-wrap">
        <p className="wz-kick">Twoja lista</p>
        <h1 className="wz-h2" style={{ marginBottom: 14 }}>
          Ulubione oferty
        </h1>
        <p className="wz-lead" style={{ marginBottom: 34 }}>
          Zapisane oferty zostają w tej przeglądarce. Przy wysłaniu zapytania dołączymy je do wiadomości, żeby agent
          wiedział, co Cię interesuje.
        </p>
        <FavoritesList base={`/strona/${site.slug}`} offers={offers} />
      </div>
    </section>
  );
}
