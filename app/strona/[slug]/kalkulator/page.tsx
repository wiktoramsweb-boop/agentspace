import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/site/config";
import { RateCalculator } from "../../../components/wzory/calculator";
import { SiteLeadForm } from "../../../components/wzory/site-lead-form";
import { Faq, Head } from "../../../components/wzory/bits";
import { FAQ_ZAKUP } from "@/lib/wzory/data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  return { title: `Kalkulator raty | ${site?.brand.officeName ?? "Biuro nieruchomości"}` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site || !site.published) notFound();

  return (
    <>
      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap">
          <p className="wz-kick">Kalkulator</p>
          <h1 className="wz-h2" style={{ marginBottom: 14 }}>
            Policz ratę, zanim zaczniesz oglądać
          </h1>
          <p className="wz-lead" style={{ marginBottom: 34 }}>
            Rata liczona metodą annuitetową, tak samo jak w banku. Wynik jest poglądowy i nie jest ofertą.
          </p>
          <div className="wz-box" data-rev>
            <RateCalculator price={780_000} />
          </div>
        </div>
      </section>

      <section className="wz-sec wz-sec--tight">
        <div className="wz-wrap wz-split">
          <div>
            <Head kick="Pytania" title="Zanim zadzwonisz do banku" />
            <Faq items={FAQ_ZAKUP} />
          </div>
          <div className="wz-box wz-sticky" data-rev>
            <h2 className="wz-h3" style={{ marginBottom: 8 }}>
              Sprawdź zdolność kredytową
            </h2>
            <p className="wz-muted" style={{ fontSize: 14.5, marginBottom: 18 }}>
              Umówimy Cię z doradcą, który porówna oferty banków. Badanie jest bezpłatne.
            </p>
            <SiteLeadForm agencyId={site.agencyId} base={`/strona/${site.slug}`} kind="kontakt" />
          </div>
        </div>
      </section>
    </>
  );
}
