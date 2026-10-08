import type { IkonaZdarzenia, ZdarzenieKlienta } from "@/lib/portal-klienta";

/** Drobiazgi używane na kilku ekranach portalu. Trzymane razem, żeby daty
 *  i ikony wyglądały wszędzie tak samo. */

export const DNI = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];
export const DNI_SKROT = ["pon", "wt", "śr", "czw", "pt", "sob", "niedz"];
export const MIESIACE = [
  "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
];
export const MIESIACE_MIANOWNIK = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
];

/** Data i godzina po polsku. Północ traktujemy jak „brak godziny". */
export function kiedy(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dzien = `${DNI[d.getDay()]} ${d.getDate()} ${MIESIACE[d.getMonth()]}`;
  const godz = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return godz === "00:00" ? dzien : `${dzien}, godz. ${godz}`;
}

export function godzina(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const g = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return g === "00:00" ? "" : g;
}

/** Nagłówek dnia z klucza YYYY-MM-DD. Godzina 12 chroni przed przesunięciem strefy. */
export function naglowekDnia(klucz: string): string {
  const d = new Date(`${klucz}T12:00:00`);
  return `${DNI[d.getDay()]}, ${d.getDate()} ${MIESIACE[d.getMonth()]}`;
}

const SCIEZKI: Record<IkonaZdarzenia, string> = {
  klucz: "M15 7a4 4 0 1 1-3.9 5H8v2H6v2H3v-3l8.1-8.1A4 4 0 0 1 15 7Z",
  aparat: "M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm8 3.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  telefon: "M5 4h3l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v3a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z",
  gwiazdka: "M12 4.5l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 9.8l5-.7L12 4.5Z",
};

export function IkonaZdarzeniaSvg({ ikona }: { ikona: IkonaZdarzenia }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={SCIEZKI[ikona]} />
    </svg>
  );
}

/** Jeden wiersz osi czasu. */
export function Zdarzenie({ z, podpis }: { z: ZdarzenieKlienta; podpis?: string }) {
  return (
    <div className="portal-zdarzenie">
      <span className={`portal-ikonka${z.zrobione ? " zrobione" : ""}`}>
        <IkonaZdarzeniaSvg ikona={z.ikona} />
      </span>
      <div style={{ minWidth: 0 }}>
        <b>{z.tytul}</b>
        {z.opis && <p>{z.opis}</p>}
        {podpis && <p>{podpis}</p>}
        <div className="portal-kiedy">{kiedy(z.kiedy)}</div>
      </div>
    </div>
  );
}

export function Foto({ url, alt, ile }: { url: string | null; alt: string; ile?: number }) {
  return (
    <div className="portal-foto">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} loading="lazy" />
      ) : (
        <div className="portal-foto-pusta">Brak zdjęcia</div>
      )}
      {ile != null && ile > 1 && <span className="portal-licznik-zdjec">{ile} zdjęć</span>}
    </div>
  );
}

export function opisNieruchomosci(n: {
  area_m2: number | null;
  rooms: number | null;
  city: string | null;
}): string {
  return [
    n.rooms ? `${n.rooms} ${n.rooms === 1 ? "pokój" : n.rooms < 5 ? "pokoje" : "pokoi"}` : null,
    n.area_m2 ? `${n.area_m2} m²` : null,
    n.city,
  ]
    .filter(Boolean)
    .join(" · ");
}
