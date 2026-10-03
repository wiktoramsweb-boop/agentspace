/**
 * Eksport danych biura do pliku, który otwiera się w Excelu.
 *
 * Na stronie obiecujemy „zero lock-inu: dane eksportujesz w każdej chwili”,
 * a w aplikacji nie było żadnego eksportu poza PDF-em raportu. To jest
 * pierwsze pytanie biura, które zmienia system, i pierwsze, które zada
 * prawnik przy RODO, więc nie może zostać obietnicą marketingową.
 *
 * Format: CSV ze średnikiem i znacznikiem BOM.
 * Polski Excel dzieli kolumny po średniku (nie po przecinku), a bez BOM-u
 * zjada polskie znaki. Oba szczegóły decydują o tym, czy plik otworzy się
 * poprawnie dwuklikiem, czy wymaga kreatora importu.
 */

export const ZBIORY = ["klienci", "nieruchomosci", "transakcje", "leady", "dzialania"] as const;
export type Zbior = (typeof ZBIORY)[number];

export const NAZWY_ZBIOROW: Record<Zbior, string> = {
  klienci: "Klienci",
  nieruchomosci: "Nieruchomości",
  transakcje: "Transakcje i prowizje",
  leady: "Leady",
  dzialania: "Działania i zadania",
};

const BOM = "﻿";

/** Jedna komórka CSV. */
function komorka(wartosc: unknown): string {
  if (wartosc === null || wartosc === undefined) return "";
  if (typeof wartosc === "boolean") return wartosc ? "tak" : "nie";

  let tekst = String(wartosc);
  // Excel potraktowałby wiodący znak formuły jako formułę. To jest znany
  // wektor ataku (CSV injection), a dane pochodzą od użytkowników.
  if (/^[=+\-@\t\r]/.test(tekst)) tekst = `'${tekst}`;
  // Średnik, cudzysłów i złamanie linii wymagają cudzysłowów wokół wartości.
  if (/[";\n\r]/.test(tekst)) tekst = `"${tekst.replace(/"/g, '""')}"`;
  return tekst;
}

/** Wiersze jako CSV z nagłówkiem w kolejności podanej w `kolumny`. */
export function doCsv(
  kolumny: { klucz: string; naglowek: string }[],
  wiersze: Record<string, unknown>[],
): string {
  const naglowek = kolumny.map((k) => komorka(k.naglowek)).join(";");
  const tresc = wiersze.map((w) => kolumny.map((k) => komorka(w[k.klucz])).join(";"));
  // CRLF, bo tego oczekuje Excel na Windowsie.
  return BOM + [naglowek, ...tresc].join("\r\n") + "\r\n";
}

/** Nazwa pliku z datą, żeby kolejne eksporty się nie nadpisywały. */
export function nazwaPliku(zbior: Zbior, dzien: string): string {
  return `agentspace-${zbior}-${dzien}.csv`;
}
