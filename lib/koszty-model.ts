/**
 * Koszty biura: kategorie, VAT i miesiące. Bez importów, żeby liczenie dało się
 * sprawdzić w gołym node, tak jak faktury.
 */

export const KATEGORIE_KOSZTOW: { v: string; l: string }[] = [
  { v: "lokal", l: "Lokal i media" },
  { v: "portale", l: "Portale ogłoszeniowe" },
  { v: "oprogramowanie", l: "Oprogramowanie i CRM" },
  { v: "marketing", l: "Reklama i marketing" },
  { v: "telefon", l: "Telefony i internet" },
  { v: "samochod", l: "Samochód i paliwo" },
  { v: "ksiegowosc", l: "Księgowość i prawnik" },
  { v: "ubezpieczenie", l: "Ubezpieczenie OC" },
  { v: "wynagrodzenia", l: "Wynagrodzenia stałe" },
  { v: "zus", l: "ZUS i podatki" },
  { v: "szkolenia", l: "Szkolenia" },
  { v: "biuro", l: "Materiały biurowe" },
  { v: "inne", l: "Inne" },
];

export function nazwaKategorii(v: string): string {
  return KATEGORIE_KOSZTOW.find((k) => k.v === v)?.l ?? "Inne";
}

export const STAWKI_VAT: { v: string; l: string }[] = [
  { v: "23", l: "23%" },
  { v: "8", l: "8%" },
  { v: "5", l: "5%" },
  { v: "0", l: "0%" },
  { v: "zw", l: "zw." },
];

const grosze = (n: number) => Math.round(n * 100) / 100;

/** Brutto z netto i stawki. „zw." i brak stawki: brutto = netto. */
export function brutto(netto: number, stawka: string | number | null): number {
  const s = typeof stawka === "number" ? stawka : Number(stawka);
  return grosze(netto * (1 + (Number.isFinite(s) ? s : 0) / 100));
}

/** Netto z brutto: dla faktur, na których agent widzi tylko kwotę do zapłaty. */
export function netto(bruttoKwota: number, stawka: string | number | null): number {
  const s = typeof stawka === "number" ? stawka : Number(stawka);
  return grosze(bruttoKwota / (1 + (Number.isFinite(s) ? s : 0) / 100));
}

/** „2026-10" z daty „2026-10-15". */
export function miesiacZDaty(iso: string): string {
  return iso.slice(0, 7);
}

export function poprawnyMiesiac(m: string | null | undefined): m is string {
  return !!m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
}

/** Pierwszy dzień miesiąca i pierwszy dzień następnego, do zapytań „od-do". */
export function zakresMiesiaca(m: string): { od: string; doWyl: string } {
  const [r, mm] = m.split("-").map(Number);
  const nr = mm === 12 ? r + 1 : r;
  const nm = mm === 12 ? 1 : mm + 1;
  return { od: `${m}-01`, doWyl: `${nr}-${String(nm).padStart(2, "0")}-01` };
}

export function przesunMiesiac(m: string, o: number): string {
  const [r, mm] = m.split("-").map(Number);
  const idx = r * 12 + (mm - 1) + o;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

const NAZWY = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"];
export function nazwaMiesiaca(m: string): string {
  const [r, mm] = m.split("-").map(Number);
  return `${NAZWY[mm - 1]} ${r}`;
}

/**
 * Czy stały koszt trzeba już dopisać w tym miesiącu: dzień płatności minął,
 * a w tym miesiącu jeszcze go nie generowaliśmy.
 */
export function doWygenerowania(
  s: { active: boolean; day_of_month: number; last_generated_month: string | null },
  dzis: string,
): boolean {
  const m = miesiacZDaty(dzis);
  if (!s.active) return false;
  if (s.last_generated_month && s.last_generated_month >= m) return false;
  return Number(dzis.slice(8, 10)) >= s.day_of_month;
}

/** Pole CSV dla polskiego Excela: średnik jako separator, cudzysłowy podwojone. */
export function poleCsv(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = typeof v === "number" ? v.toFixed(2).replace(".", ",") : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csv(naglowki: string[], wiersze: (string | number | null | undefined)[][]): string {
  // BOM, żeby Excel otworzył polskie znaki bez kreatora importu.
  return "﻿" + [naglowki, ...wiersze].map((w) => w.map(poleCsv).join(";")).join("\r\n") + "\r\n";
}
