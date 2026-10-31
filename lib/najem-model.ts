// Zarządzanie najmem: słowniki, konfiguracja biura i obliczenia.
// Bez importów: czyta to serwer, przeglądarka i test `npm run test:najem`.

export const ETAPY_NAJMU = [
  { id: "pozyskanie", nazwa: "Rozmowa z właścicielem", kolor: "bg-slate-400" },
  { id: "umowa", nazwa: "Umowa o zarządzanie", kolor: "bg-violet-500" },
  { id: "przejecie", nazwa: "Przejęcie lokalu", kolor: "bg-sky-500" },
  { id: "przygotowanie", nazwa: "Przygotowanie i oferta", kolor: "bg-cyan-500" },
  { id: "szukanie", nazwa: "Szukanie najemcy", kolor: "bg-amber-500" },
  { id: "formalnosci", nazwa: "Weryfikacja i umowa najmu", kolor: "bg-fuchsia-500" },
  { id: "wynajete", nazwa: "Wynajęte", kolor: "bg-emerald-500" },
  { id: "koniec", nazwa: "Koniec najmu", kolor: "bg-rose-500" },
] as const;
export type EtapNajmu = (typeof ETAPY_NAJMU)[number]["id"];

export const TYPY_NAJMU = [
  { id: "caly_lokal", nazwa: "Cały lokal" },
  { id: "pokoje", nazwa: "Na pokoje" },
  { id: "studencki", nazwa: "Studencki" },
  { id: "pracowniczy", nazwa: "Pracowniczy" },
  { id: "firmowy", nazwa: "Dla firmy (umowa z firmą)" },
];

export const FORMY_UMOWY = [
  { id: "zwykly", nazwa: "Najem zwykły", opis: "Umowa cywilna bez dodatkowych formalności." },
  { id: "okazjonalny", nazwa: "Najem okazjonalny", opis: "Oświadczenie notarialne, lokal zastępczy, zgłoszenie do US w 14 dni. Tylko gdy właściciel to osoba fizyczna bez działalności w najmie." },
  { id: "instytucjonalny", nazwa: "Najem instytucjonalny", opis: "Właściciel prowadzi działalność w najmie lokali." },
];

export const MODELE_ROZLICZEN = [
  { id: "A", nazwa: "Czynsz przez biuro", opis: "Najemca płaci na rachunek biura, biuro potrąca prowizję i przekazuje resztę właścicielowi." },
  { id: "B", nazwa: "Czynsz do właściciela", opis: "Najemca płaci właścicielowi, a właściciel przelewa prowizję biuru." },
  { id: "C", nazwa: "Rachunek właściciela z pełnomocnictwem", opis: "Czynsz wpływa do właściciela, biuro ma ograniczony dostęp do rachunku." },
];

export const ROLE_STRON = [
  { id: "wlasciciel", nazwa: "Właściciel" },
  { id: "wspolwlasciciel", nazwa: "Współwłaściciel" },
  { id: "najemca", nazwa: "Najemca" },
  { id: "wspolnajemca", nazwa: "Współnajemca" },
  { id: "poreczyciel", nazwa: "Poręczyciel" },
  { id: "lokal_zastepczy", nazwa: "Właściciel lokalu zastępczego" },
  { id: "kontakt", nazwa: "Osoba kontaktowa" },
];

export const USLUGI = [
  { id: "marketing", nazwa: "Przygotowanie lokalu, zdjęcia i ogłoszenia" },
  { id: "selekcja", nazwa: "Selekcja i weryfikacja najemców" },
  { id: "umowy", nazwa: "Umowy najmu i aneksy" },
  { id: "okazjonalny", nazwa: "Organizacja najmu okazjonalnego" },
  { id: "protokoly", nazwa: "Protokoły wydania i odbioru" },
  { id: "kaucja", nazwa: "Obsługa kaucji" },
  { id: "platnosci", nazwa: "Pilnowanie płatności i wezwania" },
  { id: "usterki", nazwa: "Usterki i awarie" },
  { id: "media", nazwa: "Rozliczenia mediów i wspólnoty" },
  { id: "przeglady", nazwa: "Przeglądy lokalu" },
  { id: "raporty", nazwa: "Miesięczne rozliczenie dla właściciela" },
];

export type Konfig = {
  prowizjaPct: number;
  oplataStartowa: number;
  limitNapraw: number;
  przegladyRok: number;
  dzienRozliczenia: number;
  /** Ile dni właściciel ma na zastrzeżenia do rozliczenia. 0: bez takiego zapisu. */
  dniNaZastrzezenia: number;
  modele: string[];
  typy: string[];
  formy: string[];
  uslugi: string[];
};

/** Punkt startowy dla każdego biura: wszystko dostępne, kwoty do ustawienia. */
export const KONFIG_OGOLNY: Konfig = {
  prowizjaPct: 10,
  oplataStartowa: 0,
  limitNapraw: 500,
  przegladyRok: 1,
  dzienRozliczenia: 10,
  dniNaZastrzezenia: 0,
  modele: ["A", "B", "C"],
  typy: TYPY_NAJMU.map((t) => t.id),
  formy: FORMY_UMOWY.map((f) => f.id),
  uslugi: USLUGI.map((u) => u.id),
};

/** Oferta Spectry z umowy o zarządzanie: 13%, 800 zł, przegląd 2 razy w roku, rozliczenie do 10. dnia. */
export const KONFIG_SPECTRA: Konfig = {
  ...KONFIG_OGOLNY,
  prowizjaPct: 13,
  oplataStartowa: 800,
  limitNapraw: 500,
  przegladyRok: 2,
  dniNaZastrzezenia: 7,
  typy: ["caly_lokal"],
  formy: ["zwykly", "okazjonalny"],
};

const SPECTRA = "fe78fb77-98e3-4e3e-831b-067c2fc4cc9e";

/** Zapisane ustawienia biura mają pierwszeństwo przed domyślnymi. */
export function konfiguracja(agencyId: string | null, zapisana?: Partial<Konfig> | null): Konfig {
  return { ...(agencyId === SPECTRA ? KONFIG_SPECTRA : KONFIG_OGOLNY), ...(zapisana ?? {}) };
}

export type Krok = { id: string; etap: EtapNajmu; nazwa: string; usluga?: string; tylko?: "okazjonalny" };

/** Cykl obsługi jednego lokalu: od umowy z właścicielem po rozliczenie końcowe. */
export const KROKI: Krok[] = [
  { id: "umowa_podpisana", etap: "umowa", nazwa: "Umowa o zarządzanie podpisana" },
  { id: "pelnomocnictwo", etap: "umowa", nazwa: "Pełnomocnictwo od właściciela" },
  { id: "ankieta", etap: "umowa", nazwa: "Ankieta właściciela wypełniona" },
  { id: "rodo", etap: "umowa", nazwa: "Informacja RODO i powierzenie danych" },
  { id: "dokumenty", etap: "przejecie", nazwa: "Dokumenty: KW, wspólnota, polisa, świadectwo energetyczne" },
  { id: "inwentaryzacja", etap: "przejecie", nazwa: "Protokół przejęcia i spis wyposażenia" },
  { id: "liczniki", etap: "przejecie", nazwa: "Stany liczników, PPE, punkt gazowy" },
  { id: "klucze", etap: "przejecie", nazwa: "Klucze odebrane" },
  { id: "zdjecia", etap: "przygotowanie", nazwa: "Przygotowanie lokalu i zdjęcia", usluga: "marketing" },
  { id: "czynsz", etap: "przygotowanie", nazwa: "Czynsz uzgodniony z właścicielem" },
  { id: "ogloszenie", etap: "przygotowanie", nazwa: "Ogłoszenie opublikowane", usluga: "marketing" },
  { id: "prezentacje", etap: "szukanie", nazwa: "Prezentacje i wybór kandydata", usluga: "selekcja" },
  { id: "weryfikacja", etap: "formalnosci", nazwa: "Weryfikacja kandydata: tożsamość, dochody, bazy dłużników", usluga: "selekcja" },
  { id: "akceptacja", etap: "formalnosci", nazwa: "Akceptacja właściciela" },
  { id: "notariusz", etap: "formalnosci", nazwa: "Oświadczenie notarialne i lokal zastępczy", usluga: "okazjonalny", tylko: "okazjonalny" },
  { id: "umowa_najmu", etap: "formalnosci", nazwa: "Umowa najmu podpisana", usluga: "umowy" },
  { id: "kaucja", etap: "formalnosci", nazwa: "Kaucja wpłacona", usluga: "kaucja" },
  { id: "wydanie", etap: "formalnosci", nazwa: "Wydanie lokalu: protokół, liczniki, klucze", usluga: "protokoly" },
  { id: "us", etap: "wynajete", nazwa: "Zgłoszenie najmu do urzędu skarbowego (14 dni)", usluga: "okazjonalny", tylko: "okazjonalny" },
  { id: "media_przepisane", etap: "wynajete", nazwa: "Media przepisane albo ustalone rozliczenie", usluga: "media" },
  { id: "odbior", etap: "koniec", nazwa: "Odbiór lokalu: protokół zwrotny", usluga: "protokoly" },
  { id: "kaucja_zwrot", etap: "koniec", nazwa: "Rozliczenie i zwrot kaucji", usluga: "kaucja" },
  { id: "rozliczenie_koncowe", etap: "koniec", nazwa: "Rozliczenie końcowe z właścicielem" },
];

export function krokiLokalu(etap: string, forma: string | null, k: Konfig): Krok[] {
  return KROKI.filter((x) => x.etap === etap && (!x.usluga || k.uslugi.includes(x.usluga)) && (!x.tylko || x.tylko === forma));
}

/* ───────────── obliczenia ───────────── */

export type Najem = { id: string; forma: string; od: string; do_dnia: string | null; czynsz: number; parking: number; oplaty: number; kaucja: number; aktywny: boolean };
export type Wplata = { miesiac: string; czynsz: number; oplaty: number; koszty: number };
/** Jeden rachunek: prąd za 2 miesiące, gaz, wyrównanie ze wspólnoty. */
export type Naliczenie = { miesiac: string; rodzaj: string; kwota: number; okres_mies: number; najemca_placi: boolean; biuro_oplaca: boolean };
export type WarunkiLokalu = { model: string; prowizjaPct: number; parkingWPodstawie: boolean };

const grosze = (n: number) => Math.round(n * 100) / 100;

/** Czy najem obejmuje miesiąc RRRR-MM. Ostatni i pierwszy miesiąc liczymy w całości. */
export function najemWMiesiacu(n: Pick<Najem, "od" | "do_dnia">, miesiac: string): boolean {
  return n.od.slice(0, 7) <= miesiac && (!n.do_dnia || n.do_dnia.slice(0, 7) >= miesiac);
}

export type Rozliczenie = {
  miesiac: string;
  wynajety: boolean;
  czynszNalezny: number;
  oplatyNalezne: number;
  wplaty: number;
  zaleglosc: number;
  prowizja: number;
  koszty: number;
  doPrzekazania: number;
  doZaplatyPrzezWlasciciela: number;
};

/**
 * Jeden miesiąc jednego lokalu, jak w załączniku „Rozliczenie z właścicielem”.
 * Prowizja jest liczona od czynszu faktycznie wpłaconego, nigdy od opłat i mediów.
 * Model A: biuro potrąca prowizję i koszty, resztę przekazuje.
 * Modele B i C: pieniądze są u właściciela, więc to on płaci prowizję.
 * Rachunki z danego miesiąca dokładają się do należności najemcy, a te, które
 * opłaciło biuro, zmniejszają wypłatę.
 */
export function rozliczMiesiac(miesiac: string, najem: Najem | null, wplata: Wplata | null, w: WarunkiLokalu, naliczenia: Naliczenie[] = []): Rozliczenie {
  const wynajety = Boolean(najem);
  const czynszNalezny = najem ? najem.czynsz + najem.parking : 0;
  const zMiesiaca = naliczenia.filter((n) => n.miesiac === miesiac);
  const oplatyNalezne = grosze((najem?.oplaty ?? 0) + zMiesiaca.filter((n) => n.najemca_placi).reduce((a, n) => a + n.kwota, 0));
  const wplaconyCzynsz = wplata?.czynsz ?? 0;
  const wplaconeOplaty = wplata?.oplaty ?? 0;
  const koszty = grosze((wplata?.koszty ?? 0) + zMiesiaca.filter((n) => n.biuro_oplaca).reduce((a, n) => a + n.kwota, 0));
  const wplaty = grosze(wplaconyCzynsz + wplaconeOplaty);
  // Z wpłaty odejmujemy parking, gdy nie wchodzi do podstawy prowizji.
  const podstawa = najem ? (w.parkingWPodstawie ? wplaconyCzynsz : Math.max(0, wplaconyCzynsz - najem.parking)) : 0;
  const prowizja = grosze((Math.min(podstawa, (najem?.czynsz ?? 0) + (w.parkingWPodstawie ? (najem?.parking ?? 0) : 0)) * w.prowizjaPct) / 100);
  const zaleglosc = grosze(Math.max(0, czynszNalezny + oplatyNalezne - wplaty));
  return {
    miesiac,
    wynajety,
    czynszNalezny,
    oplatyNalezne,
    wplaty,
    zaleglosc,
    prowizja,
    koszty,
    doPrzekazania: w.model === "A" ? grosze(Math.max(0, wplaty - prowizja - koszty)) : 0,
    doZaplatyPrzezWlasciciela: w.model === "A" ? 0 : grosze(prowizja + koszty),
  };
}

export const RODZAJE_OPLAT = [
  { id: "czynsz_admin", nazwa: "Czynsz administracyjny", jednostka: null },
  { id: "prad", nazwa: "Prąd", jednostka: "kWh" },
  { id: "gaz", nazwa: "Gaz", jednostka: "m³" },
  { id: "woda", nazwa: "Woda", jednostka: "m³" },
  { id: "ogrzewanie", nazwa: "Ogrzewanie", jednostka: null },
  { id: "smieci", nazwa: "Śmieci", jednostka: null },
  { id: "internet", nazwa: "Internet i TV", jednostka: null },
  { id: "ubezpieczenie", nazwa: "Ubezpieczenie", jednostka: null },
  { id: "rozliczenie", nazwa: "Rozliczenie roczne wspólnoty", jednostka: null },
  { id: "inne", nazwa: "Inne", jednostka: null },
];
export const nazwaOplaty = (id: string) => RODZAJE_OPLAT.find((r) => r.id === id)?.nazwa ?? id;

export type RodzajOkresu = "miesiac" | "kwartal" | "polrocze" | "rok";

export function miesiaceOkresu(rodzaj: RodzajOkresu, rok: number, numer: number): string[] {
  const m = (i: number) => `${rok}-${String(i).padStart(2, "0")}`;
  if (rodzaj === "miesiac") return [m(numer)];
  if (rodzaj === "kwartal") return [0, 1, 2].map((i) => m((numer - 1) * 3 + 1 + i));
  if (rodzaj === "polrocze") return Array.from({ length: 6 }, (_, i) => m((numer - 1) * 6 + 1 + i));
  return Array.from({ length: 12 }, (_, i) => m(i + 1));
}

export type Suma = { miesiace: number; wynajete: number; czynsz: number; wplaty: number; zaleglosc: number; prowizja: number; koszty: number; dlaWlasciciela: number };

export function sumuj(r: Rozliczenie[]): Suma {
  const s: Suma = { miesiace: r.length, wynajete: 0, czynsz: 0, wplaty: 0, zaleglosc: 0, prowizja: 0, koszty: 0, dlaWlasciciela: 0 };
  for (const x of r) {
    if (x.wynajety) s.wynajete++;
    s.czynsz += x.czynszNalezny;
    s.wplaty += x.wplaty;
    s.zaleglosc += x.zaleglosc;
    s.prowizja += x.prowizja;
    s.koszty += x.koszty;
    s.dlaWlasciciela += x.wplaty - x.prowizja - x.koszty;
  }
  for (const k of ["czynsz", "wplaty", "zaleglosc", "prowizja", "koszty", "dlaWlasciciela"] as const) s[k] = grosze(s[k]);
  return s;
}
