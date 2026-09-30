/**
 * Kontrola słownika pól oferty: uruchom `npm run test:pola`.
 *
 * Sprawdzamy to, co łatwo przeoczyć przy dopisywaniu pól: powtórzony klucz w
 * jednym typie (dwa inputy o tej samej nazwie w formularzu), pole wyboru bez
 * listy opcji, powtórzoną opcję na liście oraz kolizję nazwy z kolumną bazy.
 */
import { PROPERTY_SCHEMAS, sectionsFor } from "./property-fields.ts";
import { PROPERTY_TYPES, type PropertyDealKind } from "./types.ts";

const KOLUMNY = new Set([
  "price", "area", "rooms", "floor", "floors_total", "year_built", "plot_area_m2",
  "admin_fee_pln", "deposit_pln", "market", "ownership", "building_type",
  "condition_std", "heating", "available_from", "energy_cert_status", "energy_ep",
  "energy_cert_valid_until",
]);

const bledy: string[] = [];
let pol = 0;

for (const { value: type, label } of PROPERTY_TYPES) {
  for (const deal of ["sprzedaz", "wynajem"] as PropertyDealKind[]) {
    const widziane = new Map<string, string>();
    for (const sec of sectionsFor(type, deal)) {
      for (const f of sec.fields) {
        pol++;
        const gdzie = `${label}/${deal}: ${sec.title} -> ${f.key}`;
        if (widziane.has(f.key)) {
          bledy.push(`POWTÓRZONY KLUCZ ${f.key} (${widziane.get(f.key)} i ${sec.title}) w ${label}/${deal}`);
        }
        widziane.set(f.key, sec.title);
        if (f.column && !KOLUMNY.has(f.key)) bledy.push(`${gdzie}: oznaczone jako kolumna, a nie ma takiej kolumny`);
        if (!f.column && KOLUMNY.has(f.key)) bledy.push(`${gdzie}: nazwa koliduje z kolumną bazy`);
        if ((f.kind === "select" || f.kind === "multi") && !f.options?.length) bledy.push(`${gdzie}: brak listy opcji`);
        if (f.options) {
          const dup = f.options.filter((o, i) => f.options!.indexOf(o) !== i);
          if (dup.length) bledy.push(`${gdzie}: powtórzone opcje ${[...new Set(dup)].join(", ")}`);
        }
        if (!/^[a-z0-9_]+$/.test(f.key)) bledy.push(`${gdzie}: klucz musi być z małych liter, cyfr i podkreśleń`);
      }
    }
  }
}

console.log(`Typy: ${Object.keys(PROPERTY_SCHEMAS).length}, pól łącznie (oba rodzaje transakcji): ${pol}`);
for (const { value, label } of PROPERTY_TYPES) {
  const s = sectionsFor(value, "sprzedaz");
  console.log(`  ${label.padEnd(18)} ${String(s.length).padStart(2)} sekcji, ${String(s.reduce((a, x) => a + x.fields.length, 0)).padStart(3)} pól`);
}

if (bledy.length) {
  console.error(`\n${bledy.length} błędów:`);
  for (const b of bledy) console.error("  - " + b);
  process.exit(1);
}
console.log("\nSłownik pól w porządku.");
