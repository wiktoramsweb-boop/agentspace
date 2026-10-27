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
  { klucz: "agent", nazwa: "Opiekun (agent)", warianty: ["opiekun", "agent", "pośrednik", "posrednik", "handlowiec", "doradca", "email agenta", "opiekun oferty"] },
  { klucz: "external_id", nazwa: "ID w poprzednim systemie", warianty: ["id klienta", "id kontaktu", "external id", "identyfikator", "id"] },
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
  { klucz: "offer_no", nazwa: "Numer oferty", warianty: ["numer", "nr oferty", "numer oferty", "symbol", "sygnatura"] },
  { klucz: "status", nazwa: "Status oferty", warianty: ["status", "status oferty", "stan oferty", "aktywna"] },
  { klucz: "agent", nazwa: "Opiekun (agent)", warianty: ["opiekun", "agent", "pośrednik", "posrednik", "handlowiec", "email agenta", "opiekun oferty"] },
  { klucz: "photos", nazwa: "Zdjęcia (linki)", warianty: ["zdjecia", "zdjęcia", "foto", "zdjecia url", "photos", "images", "linki do zdjec", "galeria"] },
  { klucz: "external_id", nazwa: "ID w poprzednim systemie", warianty: ["id oferty", "external id", "identyfikator", "id"] },
];

/** Typ klienta z cudzego słownika: „Sprzedający”, „S”, „kupno”, „Najemca”… */
export function typKlienta(surowy: string): "sprzedajacy" | "kupujacy" | "wynajmujacy" | "najemca" | "inny" {
  const t = uprosc(surowy ?? "");
  if (!t) return "inny";
  if (/najemc|szuka najmu|wynajmie od/.test(t)) return "najemca";
  if (/wynajmuj|wynajem|landlord/.test(t)) return "wynajmujacy";
  if (/sprzedaj|sprzedaz|zbywc|seller|^s$/.test(t)) return "sprzedajacy";
  if (/kupuj|kupno|nabywc|poszukuj|buyer|^k$/.test(t)) return "kupujacy";
  return "inny";
}

/**
 * Status oferty z cudzego pliku. Bez kolumny statusu (albo z czymś
 * nierozpoznanym) zwracamy `domyslny`, czyli to, co biuro wybrało w kreatorze.
 */
export function statusOferty(surowy: string, domyslny: "aktywna" | "archiwum"): "aktywna" | "zarezerwowana" | "sfinalizowana" | "archiwum" {
  const t = uprosc(surowy ?? "");
  if (!t) return domyslny;
  if (/rezerw/.test(t)) return "zarezerwowana";
  if (/sprzedan|wynajet|zrealizow|zamknie|sfinaliz/.test(t)) return "sfinalizowana";
  if (/archiw|wycofan|nieaktyw|zawieszon|wygasl/.test(t)) return "archiwum";
  if (/aktywn|w sprzedazy|opublikow|^tak$|^1$/.test(t)) return "aktywna";
  return domyslny;
}

/** Linki do zdjęć z jednej komórki: oddzielone spacją, przecinkiem, średnikiem, kreską albo nową linią. */
export function linkiZdjec(surowe: string, maks = 30): string[] {
  const out: string[] = [];
  for (const kawalek of (surowe ?? "").split(/[\s,;|]+/)) {
    const u = kawalek.trim();
    if (!/^https?:\/\/[^\s]+$/i.test(u) || out.includes(u)) continue;
    out.push(u);
    if (out.length >= maks) break;
  }
  return out;
}

/**
 * Opiekun z pliku: e-mail albo imię i nazwisko osoby z zespołu. Bez trafienia
 * `null`, a rekord dostaje osoba, która robi import.
 */
export function dopasujOsobe(surowy: string, osoby: { id: string; email: string | null; full_name: string | null }[]): string | null {
  const t = (surowy ?? "").trim().toLowerCase();
  if (!t) return null;
  const mail = osoby.find((o) => o.email && o.email.toLowerCase() === t);
  if (mail) return mail.id;
  const prosty = uprosc(t);
  const slowa = prosty.split(" ").sort().join(" ");
  const trafienie = osoby.find((o) => {
    const n = uprosc(o.full_name ?? "");
    return n && (n === prosty || n.split(" ").sort().join(" ") === slowa);
  });
  return trafienie?.id ?? null;
}

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
