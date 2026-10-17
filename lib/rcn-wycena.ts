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

export type Stan = "do_remontu" | "do_odswiezenia" | "standard" | "po_remoncie" | "premium";
export type RodzajBudynku = "blok" | "kamienica" | "apartamentowiec" | "wielorodzinny";
export type OkresBudowy = "przed_1945" | "1945_1970" | "1971_1990" | "1991_2005" | "2006_2015" | "po_2015";
export type Zewnatrz = "brak" | "balkon" | "taras" | "ogrod";
export type Parking = "brak" | "naziemne" | "garaz";

export type CelWyceny = {
  x: number;
  y: number;
  pow: number;
  izby?: number | null;
  rynek?: "pierwotny" | "wtorny" | null;
  pietro?: number | null;
  pieter?: number | null;
  winda?: boolean | null;
  stan?: Stan | null;
  budynek?: RodzajBudynku | null;
  okres?: OkresBudowy | null;
  zewnatrz?: Zewnatrz | null;
  piwnica?: boolean | null;
  parking?: Parking | null;
};

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
  dx: number; // metry na wschód od wycenianego mieszkania
  dy: number; // metry na północ
};

export type Korekta = { nazwa: string; procent: number };
export type PunktSerii = { miesiac: string; mediana: number; p25: number; p75: number; liczba: number };

export type WynikWyceny = {
  liczba: number;
  medianaM2: number; // po indeksacji do dziś, przed korektami
  cenaM2: number; // po korektach
  p25M2: number;
  p75M2: number;
  szacunek: number;
  od: number;
  do: number;
  cenaOfertowa: number;
  pewnosc: "wysoka" | "srednia" | "niska";
  okres: { od: string; do: string } | null;
  trendRoczny: number; // % zmiany ceny za m² rok do roku z aktów w okolicy
  korekty: Korekta[];
  warianty: { stan: Stan; nazwa: string; cena: number }[];
  seria: PunktSerii[];
  porownania: Porownanie[];
  wszystkichAktow: number;
};

const MIESIAC = 30.44 * 24 * 3600 * 1000;
/** Typowa różnica między ceną w ogłoszeniu a ceną z aktu. Rekomendacja wystawienia ją uwzględnia. */
export const MARGINES_NEGOCJACYJNY = 0.05;

export const NAZWY_STANU: Record<Stan, string> = {
  do_remontu: "Do generalnego remontu",
  do_odswiezenia: "Do odświeżenia",
  standard: "Standardowy",
  po_remoncie: "Po remoncie",
  premium: "Wysoki standard",
};

const KOREKTA_STANU: Record<Stan, number> = { do_remontu: -0.12, do_odswiezenia: -0.05, standard: 0, po_remoncie: 0.04, premium: 0.09 };

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
  if (!s.length) return 0;
  const i = (s.length - 1) * q;
  const d = Math.floor(i);
  return s[d] + (s[Math.min(d + 1, s.length - 1)] - s[d]) * (i - d);
}

/**
 * Korekty za cechy, których rejestr nie zapisuje (stan, winda, balkon...).
 * Procenty są orientacyjne i pokazujemy je wprost w wyniku i raporcie,
 * żeby agent wiedział, skąd bierze się różnica względem mediany z aktów.
 */
export function korektyCech(cel: CelWyceny): Korekta[] {
  const k: Korekta[] = [];
  const dodaj = (nazwa: string, p: number) => p !== 0 && k.push({ nazwa, procent: p });
  if (cel.stan) dodaj(`Stan: ${NAZWY_STANU[cel.stan].toLowerCase()}`, KOREKTA_STANU[cel.stan]);
  const p = cel.pietro;
  const bezWindy = cel.winda === false;
  if (p === 0) dodaj("Parter", cel.zewnatrz === "ogrod" ? -0.01 : -0.04);
  else if (p != null && p >= 4 && bezWindy) dodaj("Wysokie piętro bez windy", -0.05);
  else if (p != null && cel.pieter != null && p >= cel.pieter && cel.pieter > 1) dodaj("Ostatnie piętro", bezWindy ? -0.03 : 0.01);
  // Balkon ma większość mieszkań w aktach, więc dopiero jego brak coś zmienia.
  if (cel.zewnatrz === "brak") dodaj("Bez balkonu", -0.02);
  if (cel.zewnatrz === "taras") dodaj("Taras", 0.03);
  if (cel.zewnatrz === "ogrod") dodaj("Ogródek", 0.02);
  if (cel.piwnica) dodaj("Piwnica lub komórka lokatorska", 0.01);
  if (cel.parking === "naziemne") dodaj("Miejsce postojowe", 0.02);
  if (cel.parking === "garaz") dodaj("Miejsce w garażu podziemnym", 0.04);
  // Typ i wiek budynku liczymy raz: apartamentowiec i „nowy budynek” to zwykle ta sama cecha.
  if (cel.budynek === "apartamentowiec") dodaj("Apartamentowiec", 0.02);
  else if (cel.budynek === "blok" && cel.okres === "1971_1990") dodaj("Blok z lat 70. i 80.", -0.03);
  else if (cel.okres === "po_2015") dodaj("Budynek po 2015 roku", 0.02);
  else if (cel.okres === "1945_1970") dodaj("Budynek z lat 1945-1970", -0.02);
  return k;
}

export function wycenRcn(transakcje: TransakcjaRcn[], cel: CelWyceny, dzis = new Date()): WynikWyceny | null {
  const ileWTransakcji = new Map<string, number>();
  for (const t of transakcje) ileWTransakcji.set(t.transakcja, (ileWTransakcji.get(t.transakcja) ?? 0) + 1);
  const teraz = dzis.getTime();

  // Wszystkie mieszkania z rynku wolnego z ostatnich 24 miesięcy: z nich trend i wykres okolicy.
  const okolica = transakcje
    .map((t) => {
      const cena = cenaLokalu(t, ileWTransakcji.get(t.transakcja) ?? 1);
      if (!cena || !t.data || t.funkcja !== "mieszkalna" || t.rodzaj !== "wolnyRynek" || t.pow < 12) return null;
      const miesiecy = (teraz - Date.parse(t.data)) / MIESIAC;
      if (miesiecy < 0 || miesiecy > 24) return null;
      const cenaM2 = cena / t.pow;
      if (cenaM2 < 2500 || cenaM2 > 80000) return null;
      return { t, cena, cenaM2, miesiecy };
    })
    .filter((k): k is NonNullable<typeof k> => k !== null);
  if (okolica.length < 4) return null;

  // Trend z median kwartalnych, a nie ze wszystkich aktów: pojedyncze tanie
  // transakcje (udziały, lokale do remontu) potrafiły udawać kilkuprocentowy
  // wzrost przy płaskim rynku. Ograniczony do ±1% miesięcznie.
  const kwartaly = new Map<number, number[]>();
  for (const k of okolica) {
    const q = Math.floor(k.miesiecy / 3);
    const l = kwartaly.get(q);
    if (l) l.push(k.cenaM2);
    else kwartaly.set(q, [k.cenaM2]);
  }
  const punkty = [...kwartaly.entries()].filter(([, v]) => v.length >= 5).map(([q, v]) => ({ m: q * 3 + 1.5, v: Math.log(kwantyl(v, 0.5)), w: Math.sqrt(v.length) }));
  let nachylenie = 0;
  if (punkty.length >= 3) {
    const sw = punkty.reduce((s, p) => s + p.w, 0);
    const mx = punkty.reduce((s, p) => s + p.w * p.m, 0) / sw;
    const my = punkty.reduce((s, p) => s + p.w * p.v, 0) / sw;
    const cov = punkty.reduce((s, p) => s + p.w * (p.m - mx) * (p.v - my), 0);
    const varx = punkty.reduce((s, p) => s + p.w * (p.m - mx) ** 2, 0);
    nachylenie = varx > 0 ? Math.max(-0.01, Math.min(0.01, -cov / varx)) : 0; // na miesiąc, dodatnie = rośnie
  }
  const trendRoczny = Math.round((Math.exp(nachylenie * 12) - 1) * 1000) / 10;

  const kandydaci = okolica
    .map((k) => {
      const stosunek = k.t.pow / cel.pow;
      if (stosunek < 0.6 || stosunek > 1.6) return null;
      const dx = k.t.y - cel.y;
      const dy = k.t.x - cel.x;
      const odleglosc = Math.hypot(dx, dy);
      const cenaDzis = k.cenaM2 * Math.exp(nachylenie * k.miesiecy);
      const rynekT = k.t.rynek === "rynekPierwotny" ? "pierwotny" : k.t.rynek === "rynekWtorny" ? "wtorny" : null;
      // Wagi: bliżej, świeżej i bardziej podobne mieszkanie liczy się mocniej.
      const wOdl = 1 / (1 + (odleglosc / 700) ** 2);
      const wCzas = Math.exp(-k.miesiecy / 20);
      const wPow = Math.max(0.15, 1 - Math.abs(Math.log(stosunek)) * 1.5);
      const roznicaIzb = cel.izby && k.t.izby ? Math.abs(cel.izby - k.t.izby) : null;
      const wIzby = roznicaIzb == null ? 0.85 : roznicaIzb === 0 ? 1 : roznicaIzb === 1 ? 0.7 : 0.4;
      const wRynek = !cel.rynek || !rynekT ? 0.85 : rynekT === cel.rynek ? 1 : 0.45;
      const roznicaPietra = cel.pietro != null && k.t.pietro != null ? Math.abs(cel.pietro - k.t.pietro) : null;
      const wPietro = roznicaPietra == null ? 0.9 : roznicaPietra === 0 ? 1 : roznicaPietra <= 2 ? 0.9 : 0.75;
      return { ...k, cenaDzis, odleglosc, dx, dy, waga: wOdl * wCzas * wPow * wIzby * wRynek * wPietro };
    })
    .filter((k): k is NonNullable<typeof k> => k !== null);
  if (kandydaci.length < 4) return null;

  // Skrajne ceny (udziały, rodzina, lokal do remontu generalnego) odcinamy regułą 1,5 IQR.
  const m2 = kandydaci.map((k) => k.cenaDzis);
  const q1 = kwantyl(m2, 0.25);
  const q3 = kwantyl(m2, 0.75);
  const iqr = q3 - q1;
  const czyste = kandydaci.filter((k) => k.cenaDzis >= q1 - 1.5 * iqr && k.cenaDzis <= q3 + 1.5 * iqr);
  if (czyste.length < 4) return null;

  const pary = czyste.map((k) => ({ v: k.cenaDzis, w: k.waga }));
  const medianaM2 = kwantylWazony(pary, 0.5);
  const korekty = korektyCech(cel);
  const mnoznik = Math.max(0.75, Math.min(1.25, korekty.reduce((m, k) => m * (1 + k.procent), 1)));
  const cenaM2 = medianaM2 * mnoznik;
  const p25M2 = kwantylWazony(pary, 0.25) * mnoznik;
  const p75M2 = kwantylWazony(pary, 0.75) * mnoznik;
  const zaokr = (v: number) => Math.round(v / 1000) * 1000;
  // Przedział: środkowe 50% podobnych transakcji, ale nie szerszy niż ±12% od szacunku.
  const od = zaokr(Math.max(p25M2, cenaM2 * 0.88) * cel.pow);
  const doo = zaokr(Math.min(p75M2, cenaM2 * 1.12) * cel.pow);
  const rozrzut = (p75M2 - p25M2) / Math.max(1, cenaM2);
  const pewnosc = czyste.length >= 20 && rozrzut < 0.3 ? "wysoka" : czyste.length >= 8 && rozrzut < 0.45 ? "srednia" : "niska";
  const daty = czyste.map((k) => k.t.data as string).sort();

  // Bez korekty stanu: z tej bazy liczymy wpływ standardu na cenę.
  const bezStanu = medianaM2 * Math.max(0.75, Math.min(1.25, korekty.filter((k) => !k.nazwa.startsWith("Stan:")).reduce((m, k) => m * (1 + k.procent), 1)));
  const warianty = (Object.keys(NAZWY_STANU) as Stan[]).map((s) => ({ stan: s, nazwa: NAZWY_STANU[s], cena: zaokr(bezStanu * (1 + KOREKTA_STANU[s]) * cel.pow) }));

  // Wykres okolicy: mediana i kwartyle ceny za m² w każdym miesiącu.
  const miesiace = new Map<string, number[]>();
  for (const k of okolica) {
    const m = (k.t.data as string).slice(0, 7);
    const l = miesiace.get(m);
    if (l) l.push(k.cenaM2);
    else miesiace.set(m, [k.cenaM2]);
  }
  // Każdy punkt liczymy z trzech miesięcy (poprzedni, ten, następny): pojedynczy miesiąc
  // z kilkoma aktami skakał o kilkanaście procent i wykres nic nie mówił.
  const klucze = [...miesiace.keys()].sort();
  const seria = klucze.map((miesiac, i) => {
    const okno = klucze.slice(Math.max(0, i - 1), i + 2).flatMap((k) => miesiace.get(k) ?? []);
    return { miesiac, mediana: Math.round(kwantyl(okno, 0.5)), p25: Math.round(kwantyl(okno, 0.25)), p75: Math.round(kwantyl(okno, 0.75)), liczba: miesiace.get(miesiac)?.length ?? 0 };
  });

  return {
    liczba: czyste.length,
    medianaM2: Math.round(medianaM2),
    cenaM2: Math.round(cenaM2),
    p25M2: Math.round(p25M2),
    p75M2: Math.round(p75M2),
    szacunek: zaokr(cenaM2 * cel.pow),
    od,
    do: doo,
    cenaOfertowa: zaokr(cenaM2 * cel.pow * (1 + MARGINES_NEGOCJACYJNY)),
    pewnosc,
    okres: daty.length ? { od: daty[0], do: daty[daty.length - 1] } : null,
    trendRoczny,
    korekty,
    warianty,
    seria,
    wszystkichAktow: okolica.length,
    porownania: [...czyste]
      .sort((a, b) => b.waga - a.waga)
      .slice(0, 15)
      .map((k) => ({
        id: k.t.id,
        data: k.t.data as string,
        adres: adresRcn(k.t.adres),
        pow: k.t.pow,
        izby: k.t.izby,
        pietro: k.t.pietro,
        rynek: k.t.rynek === "rynekPierwotny" ? "pierwotny" : k.t.rynek === "rynekWtorny" ? "wtórny" : null,
        cena: Math.round(k.cena),
        cenaM2: Math.round(k.cenaM2),
        odleglosc: Math.round(k.odleglosc),
        dx: Math.round(k.dx),
        dy: Math.round(k.dy),
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
