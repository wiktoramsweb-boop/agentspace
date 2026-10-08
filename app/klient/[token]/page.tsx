import Link from "next/link";
import { notFound } from "next/navigation";
import { dostepPoTokenie, nieruchomosciKlienta, ofertyKupujacego } from "@/lib/data-portal";
import { formatMoney } from "@/lib/invoice";
import { ReakcjaOferty } from "./reakcja";

export const dynamic = "force-dynamic";

function Opis({ n }: { n: { area_m2: number | null; rooms: number | null; city: string | null } }) {
  const czesci = [
    n.rooms ? `${n.rooms} ${n.rooms === 1 ? "pokój" : "pokoje"}` : null,
    n.area_m2 ? `${n.area_m2} m²` : null,
    n.city,
  ].filter(Boolean);
  return <p className="portal-meta">{czesci.join(" · ") || "-"}</p>;
}

function Foto({ url, alt }: { url: string | null; alt: string }) {
  return (
    <div className="portal-foto">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} loading="lazy" />
      ) : (
        <div className="portal-foto-pusta">Brak zdjęcia</div>
      )}
    </div>
  );
}

export default async function PortalStart({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dostep = await dostepPoTokenie(token);
  if (!dostep) notFound();

  /* ── Kupujący: oferty dobrane przez agenta ── */
  if (dostep.rodzaj === "kupujacy") {
    const oferty = await ofertyKupujacego(dostep);
    return (
      <>
        <div className="portal-top">
          <h1>Oferty dla Ciebie</h1>
        </div>
        <p className="portal-sub" style={{ marginBottom: 22 }}>
          {oferty.length > 0
            ? "Zaznacz, które Ci się podobają. Agent zobaczy to od razu."
            : "Gdy agent podeśle pierwszą ofertę, pojawi się tutaj."}
        </p>

        {oferty.length === 0 ? (
          <div className="portal-pusto">
            Jeszcze nic tu nie ma.
            <br />
            Dostaniesz powiadomienie, gdy pojawi się pierwsza propozycja.
          </div>
        ) : (
          oferty.map((o) => (
            <div key={o.id} className="portal-karta">
              <Foto url={o.zdjecie} alt={o.title} />
              <h2>{o.title}</h2>
              <Opis n={o} />
              {o.price_pln != null && <p className="portal-cena">{formatMoney(o.price_pln)} zł</p>}
              <ReakcjaOferty token={token} propertyId={o.id} reakcja={o.reakcja} />
            </div>
          ))
        )}
      </>
    );
  }

  /* ── Sprzedający: jego nieruchomości ── */
  const lista = await nieruchomosciKlienta(dostep);
  return (
    <>
      <div className="portal-top">
        <h1>{lista.length === 1 ? "Twoja nieruchomość" : "Twoje nieruchomości"}</h1>
      </div>
      <p className="portal-sub" style={{ marginBottom: 22 }}>
        Tu zobaczysz, co dzieje się w sprawie sprzedaży.
      </p>

      {lista.length === 0 ? (
        <div className="portal-pusto">
          Nie ma jeszcze przypisanej nieruchomości.
          <br />
          Odezwij się do swojego agenta.
        </div>
      ) : (
        lista.map((n) => (
          <Link key={n.id} href={`/klient/${token}/n/${n.id}`} className="portal-karta">
            <Foto url={n.zdjecie} alt={n.title} />
            <h2>{n.title}</h2>
            <Opis n={n} />
            {n.price_pln != null && <p className="portal-cena">{formatMoney(n.price_pln)} zł</p>}
          </Link>
        ))
      )}
    </>
  );
}
