import Link from "next/link";
import { notFound } from "next/navigation";
import {
  dostepPoTokenie,
  nieruchomosciKlienta,
  ofertyKupujacego,
  procesNieruchomosci,
} from "@/lib/data-portal";
import { formatMoney } from "@/lib/invoice";
import { ReakcjaOferty } from "./reakcja";
import { PanelNieruchomosci } from "./nieruchomosc";
import { Foto, opisNieruchomosci } from "./wspolne";

export const dynamic = "force-dynamic";

const FILTRY = [
  { key: "", label: "Wszystkie" },
  { key: "nowe", label: "Nowe" },
  { key: "lubi", label: "Podobają się" },
  { key: "nie", label: "Odrzucone" },
] as const;

export default async function PortalStart({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ f?: string }>;
}) {
  const { token } = await params;
  const { f } = await searchParams;
  const dostep = await dostepPoTokenie(token);
  if (!dostep) notFound();

  /* ── Kupujący: oferty dobrane przez agenta ── */
  if (dostep.rodzaj === "kupujacy") {
    const wszystkie = await ofertyKupujacego(dostep);
    const filtr = FILTRY.some((x) => x.key === f) ? (f ?? "") : "";
    const oferty = wszystkie.filter((o) =>
      filtr === "nowe" ? o.reakcja === null
      : filtr === "lubi" ? o.reakcja === "lubi"
      : filtr === "nie" ? o.reakcja === "nie_lubi"
      : true,
    );

    return (
      <>
        <div className="portal-top">
          <h1>Oferty dla Ciebie</h1>
        </div>
        <p className="portal-sub">
          {wszystkie.length > 0
            ? "Zaznacz, które Ci się podobają. Agent zobaczy to od razu."
            : "Gdy agent podeśle pierwszą ofertę, pojawi się tutaj."}
        </p>

        {wszystkie.length > 0 && (
          <nav className="portal-filtry">
            {FILTRY.map((x) => (
              <Link
                key={x.key}
                href={x.key ? `/klient/${token}?f=${x.key}` : `/klient/${token}`}
                aria-current={filtr === x.key ? "page" : undefined}
              >
                {x.label}
              </Link>
            ))}
          </nav>
        )}

        {oferty.length === 0 ? (
          <div className="portal-pusto">
            {wszystkie.length === 0 ? (
              <>
                Jeszcze nic tu nie ma.
                <br />
                Dostaniesz powiadomienie, gdy pojawi się pierwsza propozycja.
              </>
            ) : (
              "Nic w tej grupie."
            )}
          </div>
        ) : (
          oferty.map((o) => (
            <div key={o.id} className="portal-karta">
              <Link href={`/klient/${token}/o/${o.id}`} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
                <div style={{ position: "relative" }}>
                  <Foto url={o.zdjecie} alt={o.title} />
                  {o.reakcja === "lubi" && <span className="portal-znacznik lubi">Podoba Ci się</span>}
                  {o.reakcja === "nie_lubi" && <span className="portal-znacznik nie-lubi">Odrzucona</span>}
                </div>
                <h2>{o.title}</h2>
                <p className="portal-meta">{opisNieruchomosci(o)}</p>
                {o.price_pln != null && <p className="portal-cena">{formatMoney(o.price_pln)} zł</p>}
              </Link>
              <ReakcjaOferty token={token} propertyId={o.id} reakcja={o.reakcja} />
            </div>
          ))
        )}
      </>
    );
  }

  /* ── Sprzedający: jego nieruchomości ── */
  const lista = await nieruchomosciKlienta(dostep);

  if (lista.length === 0) {
    return (
      <>
        <div className="portal-top">
          <h1>Twoja sprawa</h1>
        </div>
        <div className="portal-pusto">
          Nie ma jeszcze przypisanej nieruchomości.
          <br />
          Odezwij się do swojego agenta.
        </div>
      </>
    );
  }

  // Jedna nieruchomość = pokazujemy ją od razu. Kafelek, w który trzeba kliknąć,
  // żeby zobaczyć jedyną rzecz w aplikacji, jest tylko dodatkowym krokiem.
  if (lista.length === 1) {
    const dane = await procesNieruchomosci(dostep, lista[0].id);
    if (!dane) notFound();
    return (
      <>
        <div className="portal-top">
          <h1>Twoja nieruchomość</h1>
        </div>
        <PanelNieruchomosci token={token} dane={dane} />
      </>
    );
  }

  return (
    <>
      <div className="portal-top">
        <h1>Twoje nieruchomości</h1>
      </div>
      <p className="portal-sub">Tu zobaczysz, co dzieje się w każdej ze spraw.</p>

      {lista.map((n) => (
        <Link key={n.id} href={`/klient/${token}/n/${n.id}`} className="portal-karta">
          <Foto url={n.zdjecie} alt={n.title} />
          <h2>{n.title}</h2>
          <p className="portal-meta">{opisNieruchomosci(n)}</p>
          {n.price_pln != null && <p className="portal-cena">{formatMoney(n.price_pln)} zł</p>}
        </Link>
      ))}
    </>
  );
}
