// Dane i logika faktur (VAT zw — art. 113 ust. 1).

export type Seller = {
  key: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  nip: string;
  bank: string;
  account: string;
};

export const SELLERS: Seller[] = [
  {
    key: "spectra",
    name: "Agencja Nieruchomości Spectra s.c. Wiktor Szostek, Krystian Sławęta",
    address: "ul. Zbożowa 2/1",
    city: "Kraków",
    postcode: "30-002",
    nip: "6772516327",
    bank: "mBank",
    account: "61 1140 2004 0000 3802 8526 2390",
  },
  {
    key: "slaweta",
    name: "Krystian Sławęta Agencja Nieruchomości",
    address: "ul. Śledziejowice 497",
    city: "Śledziejowice",
    postcode: "32-020",
    nip: "6832140513",
    bank: "mBank",
    account: "21 1140 2004 0000 3202 8525 9912",
  },
  {
    key: "szostek",
    name: "Wiktor Szostek Agencja Nieruchomości",
    address: "ul. Batalionów Chłopskich 26c",
    city: "Skawina",
    postcode: "32-050",
    nip: "9442290347",
    bank: "mBank",
    account: "54 1140 2004 0000 3502 8526 0044",
  },
];

export function getSeller(key: string): Seller {
  return SELLERS.find((s) => s.key === key) ?? SELLERS[0];
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
