import Link from "next/link";
import { notFound } from "next/navigation";
import { dostepPoTokenie, ofertyKupujacego } from "@/lib/data-portal";
import { formatMoney } from "@/lib/invoice";
import { Foto, opisNieruchomosci } from "../wspolne";

export const dynamic = "force-dynamic";

/** Oferty, które kupujący oznaczył jako „podoba mi się". */
export default async function UlubioneKupujacego({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const dostep = await dostepPoTokenie(token);
  if (!dostep || dostep.rodzaj !== "kupujacy") notFound();

  const lubiane = (await ofertyKupujacego(dostep)).filter((o) => o.reakcja === "lubi");

  return (
    <>
      <div className="portal-top">
        <h1>Ulubione</h1>
      </div>
      <p className="portal-sub">
        {lubiane.length > 0
          ? "Te oferty Ci się spodobały. Agent umówi oglądanie, gdy dasz znać."
          : "Oznacz ofertę jako podobającą się, a wyląduje tutaj."}
      </p>

      {lubiane.length === 0 ? (
        <div className="portal-pusto">Jeszcze nic tu nie ma.</div>
      ) : (
        lubiane.map((o) => (
          <Link key={o.id} href={`/klient/${token}/o/${o.id}`} className="portal-karta">
            <Foto url={o.zdjecie} alt={o.title} />
            <h2>{o.title}</h2>
            <p className="portal-meta">{opisNieruchomosci(o)}</p>
            {o.price_pln != null && <p className="portal-cena">{formatMoney(o.price_pln)} zł</p>}
          </Link>
        ))
      )}

      {lubiane.length > 0 && (
        <Link href={`/klient/${token}/terminy`} className="portal-przycisk" style={{ marginTop: 8 }}>
          Zaznacz, kiedy możesz oglądać
        </Link>
      )}
    </>
  );
}
