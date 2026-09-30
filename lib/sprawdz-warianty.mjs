/**
 * Kontrola ciemnego motywu: uruchom `npm run test:warianty`.
 *
 * Ciemny motyw to warstwa nadpisań wypisanych dla nazw klas (`.bg-emerald-50`).
 * Klasa z wariantem, np. `has-[:checked]:bg-emerald-50` albo `group-open:bg-slate-50`,
 * kompiluje się do INNEGO selektora, więc te nadpisania jej nie łapią. Jasne tło
 * zostaje jasne, tekst na nim robi się jasny i napis znika. Dokładnie tak zniknęło
 * „Tylko ulica" na zaznaczonej opcji w kreatorze oferty.
 *
 * Skrypt zgłasza tylko przypadki naprawdę groźne: jasne, nieprzezroczyste tła
 * (odcienie 50/100/200 i biel). Akcenty typu `focus:border-emerald-500` czy
 * `hover:bg-emerald-400` pomijamy - w ciemnym motywie wyglądają dobrze same z siebie.
 */
import fs from "node:fs";
import path from "node:path";

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== ".next") walk(p); }
    else if (/\.(tsx|ts)$/.test(p)) files.push(p);
  }
})("app");

const css = fs.readFileSync("app/globals.css", "utf8");
const COLOR = "(?:slate|zinc|gray|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white)";
// Tło bez ułamka przezroczystości: translucentne i tak zlewa się z ciemnym tłem.
const RE = new RegExp(`\\b((?:[a-z-]+(?:-\\[[^\\]]*\\])?:)+)(bg-${COLOR}(?:-(?:50|100|200))?)\\b(?!\\/|-)`, "g");
const esc = (c) => c.replace(/[:\[\]\/().%,]/g, (ch) => "\\" + ch);

const brak = new Map();
let zbadane = 0;
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(RE)) {
    const [full, , base] = m;
    if (!/-(?:50|100|200)$|^bg-white$/.test(base)) continue;
    zbadane++;
    if (css.includes(esc(full))) continue;
    if (!brak.has(full)) brak.set(full, new Set());
    brak.get(full).add(f);
  }
}

console.log(`Jasnych teł z wariantem w kodzie: ${zbadane} wystąpień`);
if (!brak.size) {
  console.log("Każde ma nadpisanie w ciemnym motywie.");
  process.exit(0);
}
console.error(`\n${brak.size} klas bez nadpisania w ciemnym motywie:`);
for (const [cls, gdzie] of [...brak].sort()) {
  console.error(`  ${cls}  -> ${[...gdzie].slice(0, 3).join(", ")}`);
}
console.error("\nDopisz reguły w app/globals.css, w sekcji nadpisań dla wariantów.");
process.exit(1);
