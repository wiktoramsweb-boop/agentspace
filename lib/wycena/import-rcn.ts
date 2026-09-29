import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Import danych z Rejestru Cen Nieruchomości.
 *
 * RCN nie ma jednego ogólnopolskiego API. Każde starostwo udostępnia dane
 * inaczej: raz przez geoportal, raz na wniosek, w różnych formatach. Dlatego
 * tutaj przyjmujemy najmniejszy wspólny mianownik, czyli CSV, i mapujemy
 * kolumny nazwa po nazwie. Dodając nowy powiat, dopisujesz mapowanie kolumn,
 * a nie nowy importer.
 *
 * Użycie:
 *   npx tsx lib/wycena/import-rcn.ts dane.csv krakow
 */

export type ColumnMap = Record<string, string>;

/** Nagłówki bywają różne, więc dopuszczamy kilka nazw na to samo pole. */
const DEFAULT_MAP: Record<string, string[]> = {
  city: ["miejscowosc", "miasto", "gmina"],
  district: ["dzielnica", "obreb", "obręb"],
  address: ["adres", "ulica", "polozenie", "położenie"],
  areaM2: ["powierzchnia", "pow_uzytkowa", "powierzchnia_uzytkowa", "pow"],
  pricePln: ["cena", "cena_transakcyjna", "wartosc", "wartość"],
  transactedAt: ["data", "data_transakcji", "data_aktu"],
  rooms: ["liczba_pokoi", "pokoje"],
  floor: ["kondygnacja", "pietro", "piętro"],
  yearBuilt: ["rok_budowy", "rok"],
  propertyType: ["rodzaj", "typ", "rodzaj_nieruchomosci"],
  sourceRef: ["id", "nr_aktu", "numer", "lp"],
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[ąàá]/g, "a")
    .replace(/[ćç]/g, "c")
    .replace(/[ęèé]/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/[óòô]/g, "o")
    .replace(/ś/g, "s")
    .replace(/[źż]/g, "z")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Prosty parser CSV: obsługuje cudzysłowy i średnik albo przecinek. */
export function parseCsv(text: string): Record<string, string>[] {
  const clean = text.replace(/^﻿/, "");
  const delimiter = (clean.split("\n")[0].match(/;/g)?.length ?? 0) > 0 ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length < 2) return [];
  const header = rows[0].map(norm);
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c.trim()))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

function pick(row: Record<string, string>, field: string, extra?: ColumnMap): string {
  if (extra?.[field] && row[norm(extra[field])]) return row[norm(extra[field])];
  for (const candidate of DEFAULT_MAP[field] ?? []) {
    const v = row[norm(candidate)];
    if (v) return v;
  }
  return "";
}

/** „1 234 567,89" oraz „1234567.89" na liczbę. */
function toNumber(v: string): number | null {
  if (!v) return null;
  const n = Number(v.replace(/\s| /g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toDate(v: string): string | null {
  if (!v) return null;
  // Format dd.mm.rrrr albo dd-mm-rrrr, częsty w wypisach ze starostw.
  const m = v.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  const d = m ? new Date(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Rodzaj z wypisu bywa opisowy, sprowadzamy go do naszych typów. */
function toPropertyType(v: string): string {
  const s = norm(v);
  if (!s) return "mieszkanie";
  if (s.includes("dzialk") || s.includes("grunt")) return "dzialka";
  if (s.includes("dom") || s.includes("budynek")) return "dom";
  if (s.includes("lokal_uzytk") || s.includes("uslugow")) return "lokal";
  return "mieszkanie";
}

export type ImportResult = { parsed: number; imported: number; skipped: number; errors: string[] };

export async function importRcnCsv(
  csv: string,
  sourceTag: string,
  columnMap?: ColumnMap,
): Promise<ImportResult> {
  const rows = parseCsv(csv);
  const errors: string[] = [];
  const payload: Record<string, unknown>[] = [];

  rows.forEach((row, i) => {
    const areaM2 = toNumber(pick(row, "areaM2", columnMap));
    const pricePln = toNumber(pick(row, "pricePln", columnMap));
    const transactedAt = toDate(pick(row, "transactedAt", columnMap));

    if (!areaM2 || !pricePln || !transactedAt) {
      errors.push(`Wiersz ${i + 2}: brak powierzchni, ceny albo daty.`);
      return;
    }
    // Cena za metr poza tym zakresem to prawie zawsze błąd w danych
    // (np. udział w nieruchomości albo cena za cały budynek).
    const perM2 = pricePln / areaM2;
    if (perM2 < 500 || perM2 > 80000) {
      errors.push(`Wiersz ${i + 2}: cena za metr poza sensownym zakresem (${Math.round(perM2)} zł).`);
      return;
    }

    const ref = pick(row, "sourceRef", columnMap);
    payload.push({
      source: "rcn",
      source_ref: ref ? `${sourceTag}:${ref}` : null,
      city: pick(row, "city", columnMap) || null,
      district: pick(row, "district", columnMap) || null,
      address: pick(row, "address", columnMap) || null,
      property_type: toPropertyType(pick(row, "propertyType", columnMap)),
      area_m2: areaM2,
      rooms: toNumber(pick(row, "rooms", columnMap)),
      floor: toNumber(pick(row, "floor", columnMap)),
      year_built: toNumber(pick(row, "yearBuilt", columnMap)),
      price_pln: pricePln,
      transacted_at: transactedAt,
      raw: row,
    });
  });

  if (payload.length === 0) return { parsed: rows.length, imported: 0, skipped: rows.length, errors };

  const admin = createSupabaseAdmin();
  let imported = 0;
  // Porcjami, żeby nie wysyłać kilkudziesięciu tysięcy wierszy naraz.
  for (let i = 0; i < payload.length; i += 500) {
    const chunk = payload.slice(i, i + 500);
    const { error } = await admin
      .from("market_transactions")
      .upsert(chunk, { onConflict: "source,source_ref", ignoreDuplicates: false });
    if (error) errors.push(`Zapis porcji ${i / 500 + 1}: ${error.message}`);
    else imported += chunk.length;
  }

  return { parsed: rows.length, imported, skipped: rows.length - imported, errors };
}
