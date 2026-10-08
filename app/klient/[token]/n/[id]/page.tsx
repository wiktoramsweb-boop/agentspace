import { notFound } from "next/navigation";
import Link from "next/link";
import { dostepPoTokenie, procesNieruchomosci } from "@/lib/data-portal";
import { formatMoney } from "@/lib/invoice";

export const dynamic = "force-dynamic";

const DNI = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];

/** Data i godzina po polsku, bez roku przy terminach z bieżącego roku. */
function kiedy(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dzien = `${DNI[d.getDay()]} ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  const godz = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return godz === "00:00" ? dzien : `${dzien}, godz. ${godz}`;
}

export default async function WidokNieruchomosci({
  params,
}: {
  params: Promise<{ token: string; id: string }>;
}) {
  const { token, id } = await params;
  const dostep = await dostepPoTokenie(token);
  if (!dostep) notFound();

  const dane = await procesNieruchomosci(dostep, id);
  if (!dane) notFound();

  const { nieruchomosc: n, osCzasu, podsumowanie: p } = dane;

  return (
    <>
      <div className="portal-top">
        <Link href={`/klient/${token}`} style={{ color: "var(--t2)", textDecoration: "none" }}>
          ←
        </Link>
        <h1 style={{ fontSize: 19 }}>{n.title}</h1>
      </div>

      <div className="portal-foto">
        {n.zdjecie ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={n.zdjecie} alt={n.title} />
        ) : (
          <div className="portal-foto-pusta">Brak zdjęcia</div>
        )}
      </div>

      <p className="portal-meta" style={{ marginTop: 12 }}>
        {[n.rooms ? `${n.rooms} pok.` : null, n.area_m2 ? `${n.area_m2} m²` : null, n.city]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {n.price_pln != null && <p className="portal-cena">{formatMoney(n.price_pln)} zł</p>}

      {p.najblizszaPrezentacja && (
        <div className="portal-alert">
          <b>Najbliższa prezentacja</b>
          <span>{kiedy(p.najblizszaPrezentacja)}</span>
        </div>
      )}

      {/* Liczby pokazujemy zawsze, także gdy oś czasu jest pusta: sama
          informacja „14 kontaktów" odpowiada na pytanie, czy coś się dzieje. */}
      <div className="portal-liczby">
        <div className="portal-liczba">
          <b>{p.prezentacje}</b>
          <span>prezentacji</span>
        </div>
        <div className="portal-liczba">
          <b>{p.prezentacjeWTymTygodniu}</b>
          <span>w tym tygodniu</span>
        </div>
        <div className="portal-liczba">
          <b>{p.kontakty}</b>
          <span>kontaktów</span>
        </div>
      </div>

      <section className="portal-sekcja">
        <h3>Co się działo</h3>
        {osCzasu.length === 0 ? (
          <div className="portal-pusto">
            Agent nie udostępnił jeszcze żadnych zdarzeń.
            <br />
            Pojawią się tutaj razem z powiadomieniem.
          </div>
        ) : (
          osCzasu.map((z) => (
            <div key={z.id} className="portal-zdarzenie">
              <span className={`portal-kropka${z.zrobione ? " zrobione" : ""}`} />
              <div>
                <b>{z.tytul}</b>
                {z.opis && <p>{z.opis}</p>}
                <div className="portal-kiedy">{kiedy(z.kiedy)}</div>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
