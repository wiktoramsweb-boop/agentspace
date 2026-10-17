// Wycena z Rejestru Cen Nieruchomości: liczenie na transakcjach z okolicy.
// Bez importów, żeby test (npm run test:rcn) liczył dokładnie to samo co aplikacja.

export type TransakcjaRcn = {
  id: string;
  transakcja: string; // oznaczenie transakcji (kilka lokali może mieć wspólne)
  data: string | null; // data aktu RRRR-MM-DD
  rodzaj: string; // wolnyRynek, sprzedazZBonifikata, ...
  rynek: string | null; // rynekPierwotny / rynekWtorny
  funkcja: string; // mieszkalna, garaz, ...
  pow: number;
  izby: number | null;
  pietro: number | null;
  cenaTransakcji: number;
  cenaLokalu: number | null;
  adres: string;
  x: number; // PL-1992, północ
  y: number; // PL-1992, wschód
};

export type CelWyceny = { x: number; y: number; pow: number; izby?: number | null; rynek?: "pierwotny" | "wtorny" | null };

export type Porownanie = {
  id: string;
  data: string;
  adres: string;
  pow: number;
  izby: number | null;
  pietro: number | null;
  rynek: string | null;
  cena: number;
  cenaM2: number;
  odleglosc: number;
};

export type WynikWyceny = {
  liczba: number;
  medianaM2: number;
  p25M2: number;
  p75M2: number;
  szacunek: number;
  od: number;
  do: number;
  pewnosc: "wysoka" | "srednia" | "niska";
  okres: { od: string; do: string } | null;
  porownania: Porownanie[];
};

const MIESIAC = 30.44 * 24 * 3600 * 1000;

/** Ładny adres z formatu RCN „MSC:KRAKÓW;UL:KRUPNICZA;NR_PORZ:32”. */
export function adresRcn(surowy: string): string {
  const pola = Object.fromEntries(
    surowy
      .split(";")
      .map((c) => c.split(":"))
      .filter((p) => p.length >= 2)
      .map(([k, ...v]) => [k, v.join(":")]),
  ) as Record<string, string>;
  const male = (s: string) => s.toLowerCase().replace(/(^|[\s.-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
  const ulica = pola.UL ? male(pola.UL.replace(/^ULICA\s+/i, "")) : "";
  const czesci = [ulica && `${ulica}${pola.NR_PORZ ? ` ${pola.NR_PORZ}` : ""}`, pola.MSC ? male(pola.MSC) : ""].filter(Boolean);
  return czesci.join(", ") || "adres nieznany";
}

/** Cena konkretnego lokalu albo null, gdy transakcja obejmowała kilka lokali bez podziału ceny. */
function cenaLokalu(t: TransakcjaRcn, ileWTransakcji: number): number | null {
  if (t.cenaLokalu && t.cenaLokalu > 0) return t.cenaLokalu;
  if (ileWTransakcji === 1 && t.cenaTransakcji > 0) return t.cenaTransakcji;
  return null;
}

function kwantylWazony(pary: { v: number; w: number }[], q: number): number {
  const s = [...pary].sort((a, b) => a.v - b.v);
  const suma = s.reduce((a, p) => a + p.w, 0);
  let acc = 0;
  for (const p of s) {
    acc += p.w;
    if (acc >= q * suma) return p.v;
  }
  return s[s.length - 1]?.v ?? 0;
}

function kwantyl(v: number[], q: number): number {
  const s = [...v].sort((a, b) => a - b);
  const i = (s.length - 1) * q;
  const d = Math.floor(i);
  return s[d] + (s[Math.min(d + 1, s.length - 1)] - s[d]) * (i - d);
}

export function wycenRcn(transakcje: TransakcjaRcn[], cel: CelWyceny, dzis = new Date()): WynikWyceny | null {
  const ileWTransakcji = new Map<string, number>();
  for (const t of transakcje) ileWTransakcji.set(t.transakcja, (ileWTransakcji.get(t.transakcja) ?? 0) + 1);

  const teraz = dzis.getTime();
  const kandydaci = transakcje
    .map((t) => {
      const cena = cenaLokalu(t, ileWTransakcji.get(t.transakcja) ?? 1);
      if (!cena || !t.data || t.funkcja !== "mieszkalna" || t.rodzaj !== "wolnyRynek" || t.pow < 12) return null;
      const miesiecy = (teraz - Date.parse(t.data)) / MIESIAC;
      if (miesiecy < 0 || miesiecy > 24) return null;
      const stosunek = t.pow / cel.pow;
      if (stosunek < 0.65 || stosunek > 1.5) return null;
      const cenaM2 = cena / t.pow;
      if (cenaM2 < 2500 || cenaM2 > 80000) return null;
      const odleglosc = Math.hypot(t.x - cel.x, t.y - cel.y);
      const rynekT = t.rynek === "rynekPierwotny" ? "pierwotny" : t.rynek === "rynekWtorny" ? "wtorny" : null;
      // Wagi: bliżej, świeżej i bardziej podobne mieszkanie liczy się mocniej.
      const wOdl = 1 / (1 + (odleglosc / 450) ** 2);
      const wCzas = Math.exp(-miesiecy / 18);
      const wPow = Math.max(0.15, 1 - Math.abs(Math.log(stosunek)) * 1.6);
      const roznicaIzb = cel.izby && t.izby ? Math.abs(cel.izby - t.izby) : null;
      const wIzby = roznicaIzb == null ? 0.85 : roznicaIzb === 0 ? 1 : roznicaIzb === 1 ? 0.7 : 0.4;
      const wRynek = !cel.rynek || !rynekT ? 0.85 : rynekT === cel.rynek ? 1 : 0.5;
      return { t, cena, cenaM2, odleglosc, waga: wOdl * wCzas * wPow * wIzby * wRynek };
    })
    .filter((k): k is NonNullable<typeof k> => k !== null);

  if (kandydaci.length < 4) return null;

  // Skrajne ceny (np. udziały, rodzina, lokal do remontu generalnego) odcinamy regułą 1,5 IQR.
  const m2 = kandydaci.map((k) => k.cenaM2);
  const q1 = kwantyl(m2, 0.25);
  const q3 = kwantyl(m2, 0.75);
  const iqr = q3 - q1;
  const czyste = kandydaci.filter((k) => k.cenaM2 >= q1 - 1.5 * iqr && k.cenaM2 <= q3 + 1.5 * iqr);
  if (czyste.length < 4) return null;

  const pary = czyste.map((k) => ({ v: k.cenaM2, w: k.waga }));
  const medianaM2 = Math.round(kwantylWazony(pary, 0.5));
  const p25M2 = Math.round(kwantylWazony(pary, 0.25));
  const p75M2 = Math.round(kwantylWazony(pary, 0.75));
  const zaokr = (v: number) => Math.round(v / 1000) * 1000;
  const rozrzut = (p75M2 - p25M2) / Math.max(1, medianaM2);
  const pewnosc = czyste.length >= 15 && rozrzut < 0.25 ? "wysoka" : czyste.length >= 8 && rozrzut < 0.4 ? "srednia" : "niska";
  const daty = czyste.map((k) => k.t.data as string).sort();

  return {
    liczba: czyste.length,
    medianaM2,
    p25M2,
    p75M2,
    szacunek: zaokr(medianaM2 * cel.pow),
    od: zaokr(p25M2 * cel.pow),
    do: zaokr(p75M2 * cel.pow),
    pewnosc,
    okres: daty.length ? { od: daty[0], do: daty[daty.length - 1] } : null,
    porownania: [...czyste]
      .sort((a, b) => b.waga - a.waga)
      .slice(0, 12)
      .map((k) => ({
        id: k.t.id,
        data: k.t.data as string,
        adres: adresRcn(k.t.adres),
        pow: k.t.pow,
        izby: k.t.izby,
        pietro: k.t.pietro,
        rynek: k.t.rynek === "rynekPierwotny" ? "pierwotny" : k.t.rynek === "rynekWtorny" ? "wtórny" : null,
        cena: k.cena,
        cenaM2: Math.round(k.cenaM2),
        odleglosc: Math.round(k.odleglosc),
      })),
  };
}

/** WGS84 (GPS) na układ PL-1992 (EPSG:2180), w którym działa usługa RCN. */
export function doPuwg92(lat: number, lng: number): { x: number; y: number } {
  const a = 6378137;
  const f = 1 / 298.257222101;
  const e2 = 2 * f - f * f;
  const ep2 = e2 / (1 - e2);
  const k0 = 0.9993;
  const phi = (lat * Math.PI) / 180;
  const dl = ((lng - 19) * Math.PI) / 180;
  const sin = Math.sin(phi);
  const cos = Math.cos(phi);
  const N = a / Math.sqrt(1 - e2 * sin * sin);
  const T = Math.tan(phi) ** 2;
  const C = ep2 * cos * cos;
  const A = cos * dl;
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const M =
    a *
    ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * phi -
      ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * phi) +
      ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * phi) -
      ((35 * e6) / 3072) * Math.sin(6 * phi));
  const x = -5300000 + k0 * (M + N * Math.tan(phi) * ((A * A) / 2 + ((5 - T + 9 * C + 4 * C * C) * A ** 4) / 24 + ((61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6) / 720));
  const y = 500000 + k0 * N * (A + ((1 - T + C) * A ** 3) / 6 + ((5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5) / 120);
  return { x, y };
}
