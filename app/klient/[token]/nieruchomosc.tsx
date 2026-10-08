import { formatMoney } from "@/lib/invoice";
import { PROCESS_STAGES } from "@/lib/types";
import type { procesNieruchomosci } from "@/lib/data-portal";
import { Zdarzenie, kiedy, opisNieruchomosci } from "./wspolne";
import { Galeria } from "./galeria";
import { DecyzjaOCenie } from "./cena";

type Dane = NonNullable<Awaited<ReturnType<typeof procesNieruchomosci>>>;

/**
 * Panel jednej nieruchomości w portalu sprzedającego.
 *
 * Ten sam komponent obsługuje start (gdy klient ma jedną nieruchomość) i widok
 * po wejściu z listy - inaczej klient z jedną ofertą musiałby klikać w kafelek,
 * żeby zobaczyć cokolwiek.
 */
export function PanelNieruchomosci({ token, dane }: { token: string; dane: Dane }) {
  const { nieruchomosc: n, zdjecia, osCzasu, podsumowanie: p, propozycje } = dane;

  const etapIndex = PROCESS_STAGES.findIndex((s) => s.value === n.process_stage);
  const etap = etapIndex >= 0 ? PROCESS_STAGES[etapIndex] : null;
  const oczekujaca = propozycje.find((x) => x.status === "oczekuje");
  const najblizsze = osCzasu.filter((z) => !z.zrobione).reverse();
  const minione = osCzasu.filter((z) => z.zrobione);

  return (
    <>
      <Galeria zdjecia={zdjecia} alt={n.title} />

      <h2 style={{ fontSize: 20, fontWeight: 650, margin: "14px 0 2px", letterSpacing: "-0.02em" }}>
        {n.title}
      </h2>
      <p className="portal-meta">{opisNieruchomosci(n) || "-"}</p>
      {n.price_pln != null && <p className="portal-cena">{formatMoney(n.price_pln)} zł</p>}

      {etap && (
        <>
          <div className="portal-etapy" aria-hidden="true">
            {PROCESS_STAGES.map((s, i) => (
              <span key={s.value} className={i <= etapIndex ? "za-nami" : undefined} />
            ))}
          </div>
          <p className="portal-etap-nazwa">
            Etap sprawy: <strong style={{ color: "var(--t)" }}>{etap.label}</strong>
          </p>
        </>
      )}

      {oczekujaca && (
        <DecyzjaOCenie
          token={token}
          id={oczekujaca.id}
          obecna={oczekujaca.cena_obecna}
          proponowana={oczekujaca.cena_proponowana}
          uzasadnienie={oczekujaca.uzasadnienie}
        />
      )}

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

      {najblizsze.length > 0 && (
        <section className="portal-sekcja">
          <h3>Zaplanowane</h3>
          {najblizsze.map((z) => (
            <Zdarzenie key={z.id} z={z} />
          ))}
        </section>
      )}

      <section className="portal-sekcja">
        <h3>Co się działo</h3>
        {minione.length === 0 ? (
          <div className="portal-pusto">
            Jeszcze nic tu nie ma.
            <br />
            Gdy biuro umówi prezentację, zobaczysz ją tutaj.
          </div>
        ) : (
          minione.map((z) => <Zdarzenie key={z.id} z={z} />)
        )}
      </section>

      {propozycje.filter((x) => x.status !== "oczekuje").length > 0 && (
        <section className="portal-sekcja">
          <h3>Decyzje o cenie</h3>
          {propozycje
            .filter((x) => x.status !== "oczekuje")
            .map((x) => (
              <div key={x.id} className="portal-zdarzenie">
                <span className={`portal-ikonka${x.status === "zaakceptowana" ? " zrobione" : ""}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M8 7h6.5a2.5 2.5 0 0 1 0 5h-5a2.5 2.5 0 0 0 0 5H16" />
                  </svg>
                </span>
                <div>
                  <b>
                    {x.status === "zaakceptowana" ? "Zgoda na cenę" : "Cena bez zmian"}{" "}
                    {formatMoney(x.cena_proponowana)} zł
                  </b>
                  <div className="portal-kiedy">{kiedy(x.decided_at ?? x.created_at)}</div>
                </div>
              </div>
            ))}
        </section>
      )}
    </>
  );
}
