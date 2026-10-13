/**
 * Dopasowanie kolumn z cudzego eksportu do naszych pól.
 *
 * Bez importów, bo to jest sedno importu danych i musi mieć test: biuro wkleja
 * plik z ASARI albo z Excela i jeśli telefon wyląduje w polu notatki, zobaczy
 * to dopiero przy pierwszym telefonie do klienta.
 *
 * Nagłówki dopasowujemy luźno: bez wielkości liter, bez polskich znaków
 * i bez interpunkcji, bo „Nr telefonu", „nr_telefonu" i „TELEFON" to jedno.
 */

export type Pole = {
  klucz: string;
  nazwa: string;
  /** Warianty nagłówka, po których rozpoznajemy kolumnę. */
  warianty: string[];
  wymagane?: boolean;
};

export const POLA_KLIENTA: Pole[] = [
  { klucz: "name", nazwa: "Imię i nazwisko", warianty: ["imie i nazwisko", "nazwa", "klient", "imie", "nazwisko", "kontakt", "osoba", "name"], wymagane: true },
  { klucz: "phone", nazwa: "Telefon", warianty: ["telefon", "nr telefonu", "numer telefonu", "tel", "komorka", "phone", "mobile"] },
  { klucz: "email", nazwa: "E-mail", warianty: ["email", "e mail", "adres email", "mail", "poczta"] },
  { klucz: "type", nazwa: "Typ klienta", warianty: ["typ", "typ klienta", "rodzaj", "kategoria"] },
  { klucz: "status", nazwa: "Status", warianty: ["status", "etap", "stan"] },
  { klucz: "address", nazwa: "Adres", warianty: ["adres", "ulica", "lokalizacja", "miasto"] },
  { klucz: "budget_pln", nazwa: "Budżet", warianty: ["budzet", "budżet", "kwota", "cena", "budget"] },
  { klucz: "notes", nazwa: "Notatki", warianty: ["notatki", "notatka", "uwagi", "opis", "komentarz", "informacje"] },
  { klucz: "source", nazwa: "Źródło", warianty: ["zrodlo", "źródło", "source", "pochodzenie"] },
];

export const POLA_NIERUCHOMOSCI: Pole[] = [
  { klucz: "title", nazwa: "Nazwa oferty", warianty: ["nazwa", "tytul", "oferta", "nazwa oferty", "title"], wymagane: true },
  { klucz: "city", nazwa: "Miasto", warianty: ["miasto", "miejscowosc", "city"] },
  { klucz: "address", nazwa: "Adres", warianty: ["adres", "ulica", "lokalizacja", "address"] },
  { klucz: "price_pln", nazwa: "Cena", warianty: ["cena", "cena ofertowa", "kwota", "price", "cena pln"] },
  { klucz: "area_m2", nazwa: "Powierzchnia", warianty: ["powierzchnia", "metraz", "metraż", "m2", "area", "pow"] },
  { klucz: "rooms", nazwa: "Pokoje", warianty: ["pokoje", "liczba pokoi", "pokoi", "rooms"] },
  { klucz: "floor", nazwa: "Piętro", warianty: ["pietro", "piętro", "floor"] },
  { klucz: "property_type", nazwa: "Typ nieruchomości", warianty: ["typ", "rodzaj", "typ nieruchomosci", "kategoria"] },
  { klucz: "deal_kind", nazwa: "Sprzedaż czy wynajem", warianty: ["rodzaj transakcji", "transakcja", "sprzedaz wynajem", "oferta typ"] },
  { klucz: "description", nazwa: "Opis", warianty: ["opis", "opis oferty", "description", "uwagi"] },
  { klucz: "offer_no", nazwa: "Numer oferty", warianty: ["numer", "nr oferty", "numer oferty", "symbol", "id"] },
];

/** Nagłówek sprowadzony do postaci porównywalnej: bez ogonków, znaków i wielkości liter. */
export function uprosc(naglowek: string): string {
  return naglowek
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    // „m²" ma się dopasować do wariantu „m2", inaczej kolumna z powierzchnią
    // rozpoznaje się tylko po słowie, a nie po jednostce.
    .replace(/²/g, "2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Propozycja mapowania: który nagłówek pliku odpowiada któremu naszemu polu.
 *
 * Najpierw szukamy trafienia dokładnego, dopiero potem zawierania. Inaczej
 * „Adres e-mail" wpadłby do pola Adres, bo zawiera słowo „adres".
 */
export function zaproponujMapowanie(naglowki: string[], pola: Pole[]): Record<string, string> {
  const wolne = naglowki.map((n) => ({ oryginal: n, prosty: uprosc(n) }));
  const uzyte = new Set<string>();
  const mapa: Record<string, string> = {};

  for (const etap of ["dokladne", "zawieranie"] as const) {
    for (const pole of pola) {
      if (mapa[pole.klucz]) continue;
      const trafienie = wolne.find((n) => {
        if (uzyte.has(n.oryginal)) return false;
        return etap === "dokladne"
          ? pole.warianty.includes(n.prosty)
          : pole.warianty.some((w) => n.prosty.includes(w));
      });
      if (trafienie) {
        mapa[pole.klucz] = trafienie.oryginal;
        uzyte.add(trafienie.oryginal);
      }
    }
  }
  return mapa;
}

/** Liczba z cudzego pliku: „1 250 000,50 zł", „1250000.5", „450 tys." */
export function liczba(surowa: string): number | null {
  if (!surowa) return null;
  const tekst = surowa.toLowerCase();
  const mnoznik = /\bmln\b/.test(tekst) ? 1_000_000 : /\btys\b/.test(tekst) ? 1_000 : 1;

  const czysta = tekst
    .replace(/[^\d,.\s]/g, "")
    .replace(/\s/g, "")
    // Przecinek jest u nas separatorem dziesiętnym, kropka bywa separatorem tysięcy.
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");

  const n = Number.parseFloat(czysta);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * mnoznik * 100) / 100;
}

/** Telefon do postaci, po której da się rozpoznać duplikat: same cyfry, bez kierunkowego. */
export function kluczTelefonu(surowy: string): string {
  const cyfry = (surowy ?? "").replace(/\D/g, "");
  return cyfry.length > 9 ? cyfry.slice(-9) : cyfry;
}
