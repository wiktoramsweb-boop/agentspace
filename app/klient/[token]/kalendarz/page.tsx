import Link from "next/link";
import { notFound } from "next/navigation";
import { dostepPoTokenie, kalendarzKlienta } from "@/lib/data-portal";
import { siatkaMiesiaca, sasiedniMiesiac } from "@/lib/portal-klienta";
import { todayPL } from "@/lib/datetime";
import { DNI_SKROT, MIESIACE_MIANOWNIK, Zdarzenie, naglowekDnia } from "../wspolne";

export const dynamic = "force-dynamic";

/** Miesiąc z adresu, z zabezpieczeniem przed byle czym w parametrze. */
function wybranyMiesiac(m: string | undefined, dzis: string): { rok: number; miesiac: number } {
  const dopasowanie = /^(\d{4})-(\d{2})$/.exec(m ?? "");
  if (dopasowanie) {
    const rok = Number(dopasowanie[1]);
    const miesiac = Number(dopasowanie[2]);
    if (rok >= 2000 && rok <= 2100 && miesiac >= 1 && miesiac <= 12) return { rok, miesiac };
  }
  return { rok: Number(dzis.slice(0, 4)), miesiac: Number(dzis.slice(5, 7)) };
}

/** Kalendarz sprzedającego: wszystkie udostępnione terminy ze wszystkich jego nieruchomości. */
export default async function KalendarzKlienta({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { token } = await params;
  const { m } = await searchParams;
  const dostep = await dostepPoTokenie(token);
  if (!dostep) notFound();

  const dzis = todayPL();
  const { rok, miesiac } = wybranyMiesiac(m, dzis);
  const wpisy = await kalendarzKlienta(dostep);

  // Ile zdarzeń wypada którego dnia - do kropek w siatce.
  const liczbyDni: Record<string, number> = {};
  for (const w of wpisy) {
    const klucz = String(w.kiedy).slice(0, 10);
    liczbyDni[klucz] = (liczbyDni[klucz] ?? 0) + 1;
  }

  const siatka = siatkaMiesiaca(rok, miesiac, liczbyDni, dzis);
  const prefiks = `${rok}-${String(miesiac).padStart(2, "0")}`;
  const wTymMiesiacu = wpisy.filter((w) => String(w.kiedy).startsWith(prefiks));

  // Grupowanie po dniu, żeby nagłówek daty nie powtarzał się przy każdym wpisie.
  const dni = new Map<string, typeof wTymMiesiacu>();
  for (const w of wTymMiesiacu) {
    const klucz = String(w.kiedy).slice(0, 10);
    if (!dni.has(klucz)) dni.set(klucz, []);
    dni.get(klucz)!.push(w);
  }

  const poprzedni = sasiedniMiesiac(rok, miesiac, -1);
  const nastepny = sasiedniMiesiac(rok, miesiac, 1);
  const adres = (x: { rok: number; miesiac: number }) =>
    `/klient/${token}/kalendarz?m=${x.rok}-${String(x.miesiac).padStart(2, "0")}`;
  const kilkaNieruchomosci = new Set(wpisy.map((w) => w.propertyId)).size > 1;

  return (
    <>
      <div className="portal-top">
        <h1>Kalendarz</h1>
      </div>
      <p className="portal-sub">Terminy udostępnione przez biuro.</p>

      <div className="portal-kal-pasek">
        <Link href={adres(poprzedni)} aria-label="Poprzedni miesiąc">
          ‹
        </Link>
        <b>
          {MIESIACE_MIANOWNIK[miesiac - 1]} {rok}
        </b>
        <Link href={adres(nastepny)} aria-label="Następny miesiąc">
          ›
        </Link>
      </div>

      <div className="portal-kal-naglowki" aria-hidden="true">
        {DNI_SKROT.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="portal-kal-siatka">
        {siatka.map((d) => (
          <div
            key={d.klucz}
            className={[
              "portal-kal-dzien",
              d.wTymMiesiacu ? "" : "obcy",
              d.dzisiaj ? "dzisiaj" : "",
              d.ile > 0 ? "ma-wpisy" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {d.dzien}
            <span className="portal-kal-kropki">
              {Array.from({ length: Math.min(d.ile, 3) }, (_, i) => (
                <i key={i} />
              ))}
            </span>
          </div>
        ))}
      </div>

      {dni.size === 0 ? (
        <div className="portal-pusto" style={{ marginTop: 22 }}>
          W tym miesiącu nic nie jest zaplanowane.
          <br />
          Gdy biuro umówi prezentację, zobaczysz ją tutaj.
        </div>
      ) : (
        [...dni.entries()].map(([dzien, lista]) => (
          <section key={dzien} className="portal-sekcja">
            <h3>{naglowekDnia(dzien)}</h3>
            {lista.map((z) => (
              <Zdarzenie key={z.id} z={z} podpis={kilkaNieruchomosci ? z.nieruchomosc : undefined} />
            ))}
          </section>
        ))
      )}
    </>
  );
}
