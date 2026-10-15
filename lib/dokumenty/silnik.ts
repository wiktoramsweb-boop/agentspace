import { amountToWordsPL } from "../invoice";
import { wMiejscowniku } from "../polszczyzna";

/**
 * Silnik wzorów dokumentów.
 *
 * Wzór to definicja: pola formularza pogrupowane w sekcje i funkcja, która
 * z wypełnionych pól składa treść (paragrafy, podpisy, załączniki). Ekran
 * formularza, podgląd i PDF są wspólne dla wszystkich wzorów, więc nowy
 * dokument to nowy plik z definicją, a nie nowy ekran.
 *
 * Puste pola nie blokują wydruku: w treści zostaje widoczne miejsce do
 * ręcznego uzupełnienia („[PESEL]”), bo agent często drukuje umowę, zanim
 * klient poda wszystkie dane.
 */

export type Strona = {
  imie: string;
  pesel: string;
  dokument: "dowod" | "paszport";
  nrDokumentu: string;
  adres: string;
  telefon?: string;
  email?: string;
};

export type Wartosc = string | Strona[];
export type Dane = Record<string, Wartosc>;

export type Opcja = { v: string; l: string };

export type Pole =
  | {
      k: string;
      e: string;
      typ: "tekst" | "data" | "kwota" | "liczba" | "opis";
      podp?: string;
      dom?: string;
      szer?: "pol" | "cala";
      placeholder?: string;
    }
  | { k: string; e: string; typ: "wybor"; opcje: Opcja[]; dom: string; podp?: string; szer?: "pol" | "cala" }
  | { k: string; e: string; typ: "strony"; rola: string; podp?: string; maks?: number; zKlienta?: boolean };

export type Grupa = { tytul: string; opis?: string; pola: Pole[]; gdy?: (d: Dane) => boolean };

export type Kontekst = {
  firma: { nazwa: string; adres: string; nip: string; telefon: string; email: string };
  miasto: string;
  agent: { imie: string; telefon: string };
};

export type Paragraf = { tytul?: string; ustepy: string[] };
export type Podpis = { rola: string; osoby: string[] };

export type Dokument = {
  tytul: string;
  /** Wiersz pod tytułem, np. „zawarta w dniu … w Krakowie pomiędzy:”. */
  wstep: string[];
  paragrafy: Paragraf[];
  podpisy: [Podpis, Podpis];
  /** Kolejne strony: załączniki, pouczenia, formularze odstąpienia. */
  dodatki?: { tytul: string; akapity: string[]; podpisy?: [Podpis, Podpis] }[];
  /** Ostrzeżenia dla agenta, pokazywane w formularzu, nie drukowane. */
  uwagi?: string[];
};

export type Kategoria = "Najem" | "Pośrednictwo" | "Sprzedaż i transakcja" | "Pisma";

export type Wzor = {
  id: string;
  nazwa: string;
  kategoria: Kategoria;
  opis: string;
  grupy: Grupa[];
  buduj: (d: Dane, k: Kontekst) => Dokument;
  /** Pole ze stronami, które wypełnia wybrany z bazy klient. */
  poleKlienta?: string;
  /** Pola wypełniane z wybranej oferty. */
  zOferty?: Partial<Record<"adres" | "cena" | "metraz" | "pokoje" | "kw" | "czynsz" | "kaucja", string>>;
};

// ── Pomocnicze ─────────────────────────────────────────────

export const pustaStrona = (): Strona => ({ imie: "", pesel: "", dokument: "dowod", nrDokumentu: "", adres: "" });

export function tekst(d: Dane, k: string, zastepczy?: string): string {
  const v = d[k];
  const s = typeof v === "string" ? v.trim() : "";
  return s || `[${zastepczy ?? k}]`;
}

export function strony(d: Dane, k: string): Strona[] {
  const v = d[k];
  const lista = Array.isArray(v) ? v.filter((s) => s.imie.trim() || s.pesel.trim() || s.adres.trim()) : [];
  return lista.length ? lista : [pustaStrona()];
}

export function liczba(d: Dane, k: string): number {
  const v = d[k];
  const n = Number(String(typeof v === "string" ? v : "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function dataPL(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "[data]";
  const [r, m, d] = iso.split("-");
  return `${d}.${m}.${r}`;
}

export function data(d: Dane, k: string): string {
  const v = d[k];
  return dataPL(typeof v === "string" ? v : "");
}

/** „3 500 zł (słownie: trzy tysiące pięćset złotych)”. */
export function kwota(d: Dane, k: string): string {
  const n = liczba(d, k);
  if (n <= 0) return "[kwota] zł";
  const zl = new Intl.NumberFormat("pl-PL").format(n).replace(/ /g, " ");
  return `${zl} zł (słownie: ${amountToWordsPL(n).replace(" zero groszy", "")})`;
}

function dokumentTozsamosci(s: Strona): string {
  return s.dokument === "paszport"
    ? `paszport nr ${s.nrDokumentu.trim() || "[nr paszportu]"}`
    : `dowód osobisty seria i nr ${s.nrDokumentu.trim() || "[seria i nr dowodu]"}`;
}

/**
 * Strony w treści umowy, z rolą zdefiniowaną w cudzysłowie. Forma „zam.”
 * i „(dalej: …)” jest poprawna bez względu na płeć i liczbę osób, więc nie
 * trzeba niczego odmieniać ani wstawiać ukośników w rodzaju „zwana/y”.
 */
export function opisStron(lista: Strona[], rola: string): string {
  const opisy = lista.map(
    (s) =>
      `**${s.imie.trim() || "[imię i nazwisko]"}**, PESEL ${s.pesel.trim() || "[PESEL]"}, ${dokumentTozsamosci(s)}, zam. ${s.adres.trim() || "[adres zamieszkania]"}`,
  );
  return `${opisy.join("; oraz ")} (dalej: **„${rola}”**)`;
}

export function imiona(lista: Strona[]): string[] {
  return lista.map((s) => s.imie.trim()).filter(Boolean);
}

export function wMiescie(miasto: string): string {
  return miasto.trim() ? wMiejscowniku(miasto.trim()) : "[miejscowość]";
}

/** Linia z danymi biura do komparycji umowy. */
export function opisBiura(k: Kontekst): string {
  const f = k.firma;
  return `**${f.nazwa || "[nazwa biura]"}**${f.adres ? `, ${f.adres}` : ""}${f.nip ? `, NIP ${f.nip}` : ""}`;
}

/** Numeracja ustępów: „1. …”, „2. …”. */
export function numeruj(ustepy: (string | false | null | undefined)[]): string[] {
  return ustepy.filter((u): u is string => typeof u === "string" && u.trim().length > 0).map((u, i) => `${i + 1}. ${u}`);
}

/** Wartości domyślne pól wzoru (pusta strona dla pól z osobami). */
export function daneStartowe(w: Wzor, dzis: string): Dane {
  const d: Dane = {};
  for (const g of w.grupy) {
    for (const p of g.pola) {
      if (p.typ === "strony") d[p.k] = [pustaStrona()];
      else if (p.typ === "data") d[p.k] = p.dom === "dzis" ? dzis : p.dom ?? "";
      else d[p.k] = p.dom ?? "";
    }
  }
  return d;
}
