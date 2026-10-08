import Link from "next/link";
import { notFound } from "next/navigation";
import { dostepPoTokenie, ofertaDlaKupujacego } from "@/lib/data-portal";
import { formatMoney } from "@/lib/invoice";
import { PROPERTY_TYPES } from "@/lib/types";
import { Galeria } from "../../galeria";
import { ReakcjaOferty } from "../../reakcja";
import { opisNieruchomosci } from "../../wspolne";

export const dynamic = "force-dynamic";

/** Pełna karta oferty podesłanej kupującemu. */
export default async function KartaOferty({
  params,
}: {
  params: Promise<{ token: string; id: string }>;
}) {
  const { token, id } = await params;
  const dostep = await dostepPoTokenie(token);
  if (!dostep || dostep.rodzaj !== "kupujacy") notFound();

  const o = await ofertaDlaKupujacego(dostep, id);
  if (!o) notFound();

  const typ = PROPERTY_TYPES.find((t) => t.value === o.property_type)?.label;
  const cenaZaMetr =
    o.price_pln != null && o.area_m2 ? Math.round(o.price_pln / o.area_m2) : null;

  const parametry = [
    { label: "Powierzchnia", value: o.area_m2 ? `${o.area_m2} m²` : null },
    { label: "Pokoje", value: o.rooms ? String(o.rooms) : null },
    { label: "Piętro", value: o.floor == null ? null : o.floor === 0 ? "parter" : String(o.floor) },
    { label: "Rok budowy", value: o.year_built ? String(o.year_built) : null },
    { label: "Rodzaj", value: typ ?? null },
    { label: "Cena za m²", value: cenaZaMetr ? `${formatMoney(cenaZaMetr)} zł` : null },
  ].filter((p) => p.value);

  return (
    <>
      <div className="portal-top">
        <Link href={`/klient/${token}`} className="portal-wstecz" aria-label="Wróć">
          ←
        </Link>
        <h1 style={{ fontSize: 19 }}>Oferta</h1>
      </div>

      <Galeria zdjecia={o.zdjecia.length > 0 ? o.zdjecia : o.zdjecie ? [o.zdjecie] : []} alt={o.title} />

      <h2 style={{ fontSize: 20, fontWeight: 650, margin: "14px 0 2px", letterSpacing: "-0.02em" }}>
        {o.title}
      </h2>
      <p className="portal-meta">{opisNieruchomosci(o)}</p>
      {o.price_pln != null && <p className="portal-cena">{formatMoney(o.price_pln)} zł</p>}

      <ReakcjaOferty token={token} propertyId={o.id} reakcja={o.reakcja} />

      {parametry.length > 0 && (
        <dl className="portal-parametry">
          {parametry.map((p) => (
            <div key={p.label}>
              <dt>{p.label}</dt>
              <dd>{p.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {o.description && (
        <section className="portal-sekcja">
          <h3>Opis</h3>
          <p style={{ whiteSpace: "pre-wrap", color: "var(--t2)", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            {o.description}
          </p>
        </section>
      )}

      <section className="portal-sekcja">
        <h3>Chcesz zobaczyć?</h3>
        <p className="portal-sub" style={{ marginBottom: 12 }}>
          Zaznacz, kiedy masz czas, a agent dopasuje termin prezentacji.
        </p>
        <Link href={`/klient/${token}/terminy`} className="portal-przycisk obrys">
          Podaj swoje terminy
        </Link>
      </section>
    </>
  );
}
