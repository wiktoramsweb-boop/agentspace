// Dane i logika faktur (VAT zw - art. 113 ust. 1).

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

export type InvoiceItem = { name: string; qty: number; unitPrice: number };

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
  total_pln: number;
  paid_pln: number;
  issuer: string | null;
  description: string | null;
  created_at: string;
};

export function invoiceTotal(items: InvoiceItem[]): number {
  return items.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);
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
