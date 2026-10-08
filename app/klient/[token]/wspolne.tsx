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
  klucz: "M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.03 5.91l-1.47 1.47a.75.75 0 0 1-.53.22H10.5v1.5a.75.75 0 0 1-.75.75H8.25v1.5a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75v-2.69c0-.2.08-.39.22-.53l6.6-6.6A6 6 0 1 1 21.75 8.25Z",
  aparat: "M6.83 6.18a2.3 2.3 0 0 1-1.64 1.05c-.38.06-.76.12-1.14.18-1.05.17-1.8 1.1-1.8 2.17V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.57c0-1.06-.75-1.99-1.8-2.17l-1.14-.17a2.3 2.3 0 0 1-1.64-1.06l-.82-1.31a2.19 2.19 0 0 0-1.74-1.04 48.8 48.8 0 0 0-5.23 0 2.19 2.19 0 0 0-1.74 1.04l-.82 1.31Zm8.92 6.57a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z",
  telefon: "M2.25 6.75c0 8.28 6.72 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.37c0-.52-.35-.97-.85-1.1l-4.43-1.1c-.44-.11-.9.05-1.17.42l-.97 1.29c-.28.38-.77.54-1.21.38a12.04 12.04 0 0 1-7.14-7.14c-.16-.44 0-.93.38-1.21l1.29-.97c.36-.27.53-.74.42-1.17L6.96 3.1a1.13 1.13 0 0 0-1.09-.85H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z",
  gwiazdka: "M11.48 3.5a.56.56 0 0 1 1.04 0l2.12 4.3 4.75.69a.56.56 0 0 1 .31.96l-3.44 3.35.81 4.73a.56.56 0 0 1-.81.59L12 15.9l-4.25 2.23a.56.56 0 0 1-.81-.59l.81-4.73-3.44-3.35a.56.56 0 0 1 .31-.96l4.75-.69 2.11-4.3Z",
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
