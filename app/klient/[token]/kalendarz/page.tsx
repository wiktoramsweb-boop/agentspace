import { notFound } from "next/navigation";
import { dostepPoTokenie, nieruchomosciKlienta, procesNieruchomosci } from "@/lib/data-portal";

export const dynamic = "force-dynamic";

const DNI = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];
const MIES = ["stycznia","lutego","marca","kwietnia","maja","czerwca","lipca","sierpnia","września","października","listopada","grudnia"];

function naglowekDnia(iso: string): string {
  const d = new Date(iso);
  return `${DNI[d.getDay()]}, ${d.getDate()} ${MIES[d.getMonth()]}`;
}
function godzina(iso: string): string {
  const d = new Date(iso);
  const g = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return g === "00:00" ? "" : g;
}

/** Kalendarz sprzedającego: wszystkie udostępnione terminy ze wszystkich jego nieruchomości. */
export default async function KalendarzKlienta({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const dostep = await dostepPoTokenie(token);
  if (!dostep) notFound();

  const nieruchomosci = await nieruchomosciKlienta(dostep);
  const procesy = await Promise.all(
    nieruchomosci.map(async (n) => ({ n, dane: await procesNieruchomosci(dostep, n.id) })),
  );

  const wpisy = procesy
    .flatMap(({ n, dane }) =>
      (dane?.osCzasu ?? [])
        .filter((z) => z.kiedy)
        .map((z) => ({ ...z, nieruchomosc: n.title })),
    )
    .sort((a, b) => String(a.kiedy).localeCompare(String(b.kiedy)));

  // Grupowanie po dniu, żeby nagłówek daty nie powtarzał się przy każdym wpisie.
  const dni = new Map<string, typeof wpisy>();
  for (const w of wpisy) {
    const klucz = String(w.kiedy).slice(0, 10);
    if (!dni.has(klucz)) dni.set(klucz, []);
    dni.get(klucz)!.push(w);
  }

  return (
    <>
      <div className="portal-top">
        <h1>Kalendarz</h1>
      </div>
      <p className="portal-sub" style={{ marginBottom: 18 }}>
        Terminy udostępnione przez agenta.
      </p>

      {dni.size === 0 ? (
        <div className="portal-pusto">
          Brak zaplanowanych terminów.
          <br />
          Gdy agent umówi prezentację, zobaczysz ją tutaj.
        </div>
      ) : (
        [...dni.entries()].map(([dzien, lista]) => (
          <section key={dzien} className="portal-sekcja">
            <h3>{naglowekDnia(dzien)}</h3>
            {lista.map((z) => (
              <div key={z.id} className="portal-zdarzenie">
                <span className={`portal-kropka${z.zrobione ? " zrobione" : ""}`} />
                <div>
                  <b>{z.tytul}</b>
                  <p>{z.nieruchomosc}</p>
                  {godzina(String(z.kiedy)) && (
                    <div className="portal-kiedy">godz. {godzina(String(z.kiedy))}</div>
                  )}
                </div>
              </div>
            ))}
          </section>
        ))
      )}
    </>
  );
}
