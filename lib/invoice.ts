// Dane i logika faktur: stawki VAT, kwoty netto/VAT/brutto, kwota słownie.
//
// Plik celowo NIE MA importów - liczenie pieniędzy jest objęte testem
// uruchamianym w gołym node (`npm run test:faktury`).

export type Seller = {
  key: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  nip: string;
  bank: string;
  account: string;
  /**
   * Czy faktura nosi markę biura (logo i nazwa w nagłówku). Spółka działa pod
   * marką biura, a faktury z jednoosobowych działalności wspólników
   * wystawiamy bez logo, żeby nie sugerowały, że sprzedawcą jest spółka.
   */
  brand: boolean;
};

/**
 * Sprzedawcy są per biuro i siedzą w ustawieniach (`agency_settings.sellers`,
 * migracja v36). W kodzie nie ma i nie może być żadnych prawdziwych danych:
 * numer konta z pliku źródłowego trafiłby na faktury obcego biura.
 */
export const PUSTY_SPRZEDAWCA: Seller = {
  key: "firma",
  name: "",
  address: "",
  city: "",
  postcode: "",
  nip: "",
  bank: "",
  account: "",
  brand: true,
};

type DaneFirmy = {
  name?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  nip?: string;
};

/**
 * Sprzedawca złożony z danych firmy. Dzięki temu nowe biuro może wystawić
 * fakturę zaraz po wpisaniu danych w ustawieniach, bez osobnej konfiguracji.
 * Numer konta trzeba uzupełnić ręcznie, bo danych firmy nie obejmuje.
 */
export function sprzedawcaZDanychFirmy(company: DaneFirmy): Seller {
  return {
    ...PUSTY_SPRZEDAWCA,
    name: company.name ?? "",
    address: company.street ?? "",
    city: company.city ?? "",
    postcode: company.postal_code ?? "",
    nip: company.nip ?? "",
  };
}

/** Lista sprzedawców biura, zawsze z co najmniej jedną pozycją. */
export function sprzedawcy(zapisani: Seller[], company: DaneFirmy): Seller[] {
  return zapisani.length > 0 ? zapisani : [sprzedawcaZDanychFirmy(company)];
}

export function getSeller(key: string, lista: Seller[]): Seller {
  return lista.find((s) => s.key === key) ?? lista[0] ?? PUSTY_SPRZEDAWCA;
}

export const VAT_NOTE = "Zw z VAT na podstawie art. 113 ust. 1 ustawy o VAT.";

/* ───────────────────────── STAWKI VAT ─────────────────────────
   Wcześniej faktura znała wyłącznie zwolnienie podmiotowe z art. 113,
   czyli działała dla jednoosobowej działalności poniżej limitu i dla
   nikogo więcej. Biuro będące czynnym podatnikiem nie mogło wystawić
   niczego zgodnego z przepisami.
   ──────────────────────────────────────────────────────────── */

export type StawkaVat = "23" | "8" | "5" | "0" | "zw" | "np";

export const STAWKI_VAT: {
  id: StawkaVat;
  etykieta: string;
  /** Ułamek do mnożenia. null = brak podatku do naliczenia. */
  ulamek: number | null;
  opis: string;
}[] = [
  { id: "23", etykieta: "23%", ulamek: 0.23, opis: "Stawka podstawowa, m.in. usługi pośrednictwa." },
  { id: "8", etykieta: "8%", ulamek: 0.08, opis: "Stawka obniżona." },
  { id: "5", etykieta: "5%", ulamek: 0.05, opis: "Stawka obniżona." },
  { id: "0", etykieta: "0%", ulamek: 0, opis: "Stawka zero procent." },
  { id: "zw", etykieta: "zw", ulamek: null, opis: "Zwolnione z VAT." },
  { id: "np", etykieta: "np", ulamek: null, opis: "Nie podlega opodatkowaniu w kraju." },
];

export function opisStawki(id: StawkaVat) {
  return STAWKI_VAT.find((s) => s.id === id) ?? STAWKI_VAT[4];
}

/** Czy faktura zawiera cokolwiek, od czego liczy się podatek. */
export function zVatem(items: InvoiceItem[]): boolean {
  return items.some((i) => (opisStawki(stawka(i)).ulamek ?? 0) > 0);
}

/** Ceny jednostkowe podane na fakturze: netto albo brutto. */
export type TrybCen = "netto" | "brutto";

export type InvoiceItem = {
  name: string;
  qty: number;
  unitPrice: number;
  /** Brak = "zw", żeby faktury wystawione przed tą zmianą liczyły się tak jak dotąd. */
  vat?: StawkaVat;
  /** Jednostka miary. Brak = "szt.". */
  unit?: string;
};

function stawka(i: InvoiceItem): StawkaVat {
  return i.vat ?? "zw";
}

/* ─── Arytmetyka w groszach ───
   Liczymy na całkowitych groszach, bo 0.1 + 0.2 w liczbach zmiennoprzecinkowych
   nie daje 0.3, a faktura musi się zgadzać co do grosza. */

const gr = (zl: number): number => Math.round((Number(zl) || 0) * 100);
const zl = (grosze: number): number => grosze / 100;

/** Wartość pozycji w groszach, w trybie, w jakim podano cenę. */
function wartoscPozycjiGr(i: InvoiceItem): number {
  return Math.round((Number(i.qty) || 0) * gr(i.unitPrice));
}

export type WierszStawki = { stawka: StawkaVat; netto: number; vat: number; brutto: number };

/**
 * Zestawienie wg stawek - obowiązkowy element faktury VAT.
 *
 * Podatek liczymy RAZ dla całej grupy stawki, a nie osobno dla każdej pozycji.
 * Liczenie pozycja po pozycji i sumowanie potrafi rozjechać się o grosz
 * przy kilku wierszach, a wtedy suma kontrolna na fakturze się nie zgadza.
 */
export function podsumowanieVat(items: InvoiceItem[], tryb: TrybCen): WierszStawki[] {
  const grupy = new Map<StawkaVat, number>();
  for (const i of items) {
    const s = stawka(i);
    grupy.set(s, (grupy.get(s) ?? 0) + wartoscPozycjiGr(i));
  }

  const kolejnosc = STAWKI_VAT.map((s) => s.id);
  return [...grupy.entries()]
    .sort((a, b) => kolejnosc.indexOf(a[0]) - kolejnosc.indexOf(b[0]))
    .map(([s, wartoscGr]) => {
      const u = opisStawki(s).ulamek;
      if (u === null || u === 0) {
        return { stawka: s, netto: zl(wartoscGr), vat: 0, brutto: zl(wartoscGr) };
      }
      if (tryb === "brutto") {
        // Z brutto wyliczamy netto, a podatek bierzemy jako różnicę. Dzięki temu
        // netto + VAT zawsze równa się dokładnie kwocie, którą klient zapłaci.
        const nettoGr = Math.round(wartoscGr / (1 + u));
        return { stawka: s, netto: zl(nettoGr), vat: zl(wartoscGr - nettoGr), brutto: zl(wartoscGr) };
      }
      const vatGr = Math.round(wartoscGr * u);
      return { stawka: s, netto: zl(wartoscGr), vat: zl(vatGr), brutto: zl(wartoscGr + vatGr) };
    });
}

export type SumyFaktury = { netto: number; vat: number; brutto: number };

/** Sumy faktury, liczone z zestawienia wg stawek, nie z pozycji. */
export function sumyFaktury(items: InvoiceItem[], tryb: TrybCen): SumyFaktury {
  return podsumowanieVat(items, tryb).reduce(
    (a, w) => ({ netto: a.netto + w.netto, vat: a.vat + w.vat, brutto: a.brutto + w.brutto }),
    { netto: 0, vat: 0, brutto: 0 },
  );
}

/** Kwoty jednej pozycji - do kolumn w tabeli faktury. */
export function kwotyPozycji(i: InvoiceItem, tryb: TrybCen): SumyFaktury {
  const wartoscGr = wartoscPozycjiGr(i);
  const u = opisStawki(stawka(i)).ulamek;
  if (u === null || u === 0) return { netto: zl(wartoscGr), vat: 0, brutto: zl(wartoscGr) };
  if (tryb === "brutto") {
    const nettoGr = Math.round(wartoscGr / (1 + u));
    return { netto: zl(nettoGr), vat: zl(wartoscGr - nettoGr), brutto: zl(wartoscGr) };
  }
  const vatGr = Math.round(wartoscGr * u);
  return { netto: zl(wartoscGr), vat: zl(vatGr), brutto: zl(wartoscGr + vatGr) };
}

export type Invoice = {
  id: string;
  agency_id: string;
  created_by: string | null;
  number: string;
  seller_key: string;
  buyer_name: string | null;
  buyer_address: string | null;
  buyer_city: string | null;
  buyer_postcode: string | null;
  buyer_nip: string | null;
  buyer_pesel: string | null;
  place: string | null;
  issue_date: string | null;
  sale_date: string | null;
  payment_date: string | null;
  payment_method: string | null;
  items: InvoiceItem[];
  /** Tryb cen jednostkowych (v42). Brak = 'netto'. */
  prices_mode?: TrybCen | null;
  /** Rodzaj dokumentu (v43). Brak = 'faktura'. */
  doc_type?: RodzajDokumentu | null;
  /** Faktura pierwotna, gdy to korekta (v43). */
  corrects_invoice_id?: string | null;
  /** Powód korekty (v43). */
  correction_reason?: string | null;
  /** Kwota do zapłaty (brutto). */
  total_pln: number;
  net_pln?: number | null;
  vat_pln?: number | null;
  paid_pln: number;
  issuer: string | null;
  description: string | null;
  created_at: string;
};

/**
 * Kwota do zapłaty (brutto). Nazwa i zwracana wartość zostają zgodne
 * z poprzednią wersją: przy wszystkich pozycjach "zw" wynik jest ten sam.
 */
export function invoiceTotal(items: InvoiceItem[], tryb: TrybCen = "netto"): number {
  return sumyFaktury(items, tryb).brutto;
}

// ---------- Kwota słownie (PL) ----------

const ONES = ["", "jeden", "dwa", "trzy", "cztery", "pięć", "sześć", "siedem", "osiem", "dziewięć"];
const TEENS = [
  "dziesięć", "jedenaście", "dwanaście", "trzynaście", "czternaście",
  "piętnaście", "szesnaście", "siedemnaście", "osiemnaście", "dziewiętnaście",
];
const TENS = [
  "", "", "dwadzieścia", "trzydzieści", "czterdzieści", "pięćdziesiąt",
  "sześćdziesiąt", "siedemdziesiąt", "osiemdziesiąt", "dziewięćdziesiąt",
];
const HUNDREDS = [
  "", "sto", "dwieście", "trzysta", "czterysta", "pięćset",
  "sześćset", "siedemset", "osiemset", "dziewięćset",
];
const SCALE: [string, string, string][] = [
  ["", "", ""],
  ["tysiąc", "tysiące", "tysięcy"],
  ["milion", "miliony", "milionów"],
  ["miliard", "miliardy", "miliardów"],
];

function plural(n: number, forms: [string, string, string]): string {
  if (n === 1) return forms[0];
  const t = n % 10;
  const h = n % 100;
  if (t >= 2 && t <= 4 && !(h >= 12 && h <= 14)) return forms[1];
  return forms[2];
}

function group3ToWords(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  if (h) parts.push(HUNDREDS[h]);
  if (t === 1) parts.push(TEENS[o]);
  else {
    if (t) parts.push(TENS[t]);
    if (o) parts.push(ONES[o]);
  }
  return parts.join(" ");
}

function intToWords(n: number): string {
  if (n === 0) return "zero";
  const groups: string[] = [];
  let i = 0;
  while (n > 0 && i < SCALE.length) {
    const g = n % 1000;
    if (g) {
      // "tysiąc" zamiast "jeden tysiąc"
      const words = i === 1 && g === 1 ? "" : group3ToWords(g);
      const scaleWord = i > 0 ? plural(g, SCALE[i]) : "";
      groups.unshift([words, scaleWord].filter(Boolean).join(" "));
    }
    n = Math.floor(n / 1000);
    i++;
  }
  return groups.join(" ").replace(/\s+/g, " ").trim();
}

export function amountToWordsPL(amount: number): string {
  const zl = Math.floor(amount);
  const gr = Math.round((amount - zl) * 100);
  return `${intToWords(zl)} złotych ${gr === 0 ? "zero" : intToWords(gr)} groszy`;
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}


/* ───────────────────── RODZAJ DOKUMENTU ─────────────────────
   Proforma nie jest fakturą: nie rodzi obowiązku podatkowego i nie trafia
   do ewidencji sprzedaży. Korekta odwołuje się do faktury pierwotnej.
   Rozróżnienie siedzi w danych, a nie tylko w nazwie pliku, bo od niego
   zależy, co wchodzi do zestawienia dla księgowej.
   ──────────────────────────────────────────────────────────── */

export type RodzajDokumentu = "faktura" | "proforma" | "korekta";

export const RODZAJE_DOKUMENTU: { id: RodzajDokumentu; nazwa: string; tytul: string; opis: string }[] = [
  { id: "faktura", nazwa: "Faktura", tytul: "Faktura VAT", opis: "Dokument sprzedaży. Wchodzi do ewidencji." },
  {
    id: "proforma",
    nazwa: "Proforma",
    tytul: "Faktura proforma",
    opis: "Dokument do zapłaty z góry. Nie jest fakturą i nie wchodzi do ewidencji.",
  },
  {
    id: "korekta",
    nazwa: "Korekta",
    tytul: "Faktura korygująca",
    opis: "Poprawia fakturę już wystawioną. Wymaga wskazania dokumentu pierwotnego.",
  },
];

export function opisRodzaju(id: RodzajDokumentu | null | undefined) {
  return RODZAJE_DOKUMENTU.find((r) => r.id === id) ?? RODZAJE_DOKUMENTU[0];
}

/**
 * Tytuł na dokumencie.
 *
 * „Faktura VAT" przy sprzedaży zwolnionej wprowadza w błąd: nie ma tam
 * żadnego podatku, a nazwa sugeruje coś przeciwnego. Przy zwolnieniu
 * i przy stawce zero zostaje samo „Faktura".
 */
export function tytulDokumentu(rodzaj: RodzajDokumentu | null | undefined, items: InvoiceItem[]): string {
  const r = opisRodzaju(rodzaj);
  if (r.id === "faktura") return zVatem(items) ? "Faktura VAT" : "Faktura";
  return r.tytul;
}

export const NOTA_PROFORMA =
  "Dokument nie jest fakturą VAT i nie stanowi podstawy do odliczenia podatku.";

/* ───────────────────── STATUS PŁATNOŚCI ─────────────────────
   Liczony z danych, a nie trzymany jako osobne pole, które trzeba pamiętać
   zaktualizować. Dzięki temu „po terminie” pojawia się samo następnego dnia
   po terminie płatności, bez żadnego zadania w tle.
   ──────────────────────────────────────────────────────────── */

export type StatusPlatnosci = "zaplacona" | "czesciowa" | "po_terminie" | "nieoplacona";

export const STATUSY_PLATNOSCI: { id: StatusPlatnosci; nazwa: string }[] = [
  { id: "zaplacona", nazwa: "Zapłacona" },
  { id: "czesciowa", nazwa: "Zapłacona częściowo" },
  { id: "po_terminie", nazwa: "Po terminie" },
  { id: "nieoplacona", nazwa: "Nieopłacona" },
];

/**
 * @param dzis data w formacie RRRR-MM-DD, podawana z zewnątrz, żeby funkcja
 *   była czysta i dała się przetestować bez udawania zegara.
 */
export function statusPlatnosci(
  f: { total_pln: number; paid_pln?: number | null; payment_date?: string | null },
  dzis: string,
): StatusPlatnosci {
  const doZaplaty = Math.round((Number(f.total_pln) || 0) * 100);
  const zaplacone = Math.round((Number(f.paid_pln) || 0) * 100);

  if (doZaplaty > 0 && zaplacone >= doZaplaty) return "zaplacona";
  // Termin minął, gdy jest wcześniejszy niż dzisiaj. W dniu terminu jeszcze
  // nie jest po terminie - klient ma czas do końca dnia.
  const poTerminie = Boolean(f.payment_date) && String(f.payment_date) < dzis;
  if (poTerminie) return "po_terminie";
  if (zaplacone > 0) return "czesciowa";
  return "nieoplacona";
}

/** Ile zostało do zapłaty. */
export function pozostaloDoZaplaty(f: { total_pln: number; paid_pln?: number | null }): number {
  return Math.max(0, Math.round(((Number(f.total_pln) || 0) - (Number(f.paid_pln) || 0)) * 100) / 100);
}

/** Ile dni po terminie. Zero albo mniej = termin jeszcze nie minął. */
export function dniPoTerminie(payment_date: string | null | undefined, dzis: string): number {
  if (!payment_date) return 0;
  const t = Date.parse(`${payment_date}T00:00:00Z`);
  const d = Date.parse(`${dzis}T00:00:00Z`);
  if (Number.isNaN(t) || Number.isNaN(d)) return 0;
  return Math.round((d - t) / 86_400_000);
}

/**
 * Data wystawienia przesunięta o zadaną liczbę miesięcy.
 *
 * Dzień miesiąca cofamy do ostatniego istniejącego: harmonogram na 31. dzień
 * w lutym wystawiłby się inaczej 3 marca, czyli nie w tym miesiącu, o który
 * chodziło.
 */
export function kolejnaData(od: string, coMiesiecy: number, dzienMiesiaca: number): string {
  const [rok, mies] = od.split("-").map(Number);
  const docelowyMiesiac = mies - 1 + coMiesiecy;
  const r = rok + Math.floor(docelowyMiesiac / 12);
  const m = ((docelowyMiesiac % 12) + 12) % 12;
  const ostatniDzien = new Date(Date.UTC(r, m + 1, 0)).getUTCDate();
  const d = Math.min(dzienMiesiaca, ostatniDzien);
  return `${r}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
