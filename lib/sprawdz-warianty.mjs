/**
 * Kontrola ciemnego motywu: uruchom `npm run test:warianty`.
 *
 * Ciemny motyw to warstwa nadpisań wypisanych dla nazw klas (`.bg-emerald-50`).
 * Tailwind kompiluje każdy zapis klasy do osobnego selektora, więc nadpisanie
 * dla `bg-emerald-50` NIE łapie ani `bg-emerald-50/60`, ani
 * `has-[:checked]:bg-emerald-50`, ani `group-open:bg-slate-50`. Jasne tło
 * zostaje jasne, tekst na nim robi się jasny i napis znika.
 *
 * Dwa błędy, które już nas na tym złapały:
 *   - „Tylko ulica" na zaznaczonej opcji w kreatorze (has-[:checked]:bg-emerald-50),
 *   - wyróżniona rozmowa w Przebiegu kontaktu (bg-emerald-50/60).
 *
 * Przy drugim z nich okazało się, że ułamek przezroczystości niczego nie ratuje:
 * emerald-50 jest prawie biały, więc nawet przy 60 procentach to jasna plama.
 * Dlatego sprawdzamy też zapisy z ułamkiem.
 *
 * Pomijamy klasy z listy DOZWOLONE: to elementy, które stoją na ciemnym tle
 * w obu motywach, więc biel z przezroczystością jest tam poprawna.
 */
import fs from "node:fs";
import path from "node:path";

/** Stoją na ciemnym tle w obu motywach - biel jest tam zamierzona. */
const DOZWOLONE = new Set([
  "bg-white/5", "bg-white/10", "bg-white/15", "bg-white/20", "bg-white/25",
  "hover:bg-white/10", "hover:bg-white/15", "hover:bg-white/25",
  "border-white/10", "border-white/15", "border-white/20", "border-white/40",
  "hover:border-white/20", "ring-white/20",
]);

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!["node_modules", ".next"].includes(e.name)) walk(p); }
    else if (p.endsWith(".tsx")) files.push(p);
  }
})("app/app");

const css = fs.readFileSync("app/globals.css", "utf8");
const esc = (c) => c.replace(/[:\[\]\/().%,]/g, (ch) => "\\" + ch);
const COLOR =
  "(?:slate|zinc|gray|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)";
const RE = new RegExp(
  `\\b((?:[a-z-]+(?:-\\[[^\\]]*\\])?:)*)((?:bg|border|ring|divide|outline|from|to|via|stroke|fill)-(?:${COLOR}-(?:50|100|200)|white))(\\/\\d{1,3})?\\b`,
  "g",
);

const braki = new Map();
let wszystkich = 0;
for (const f of files) {
  if (f.endsWith("components/select.tsx")) continue;
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(RE)) {
    const pelna = m[0];
    // Klasa z przedrostkiem `dark:` jest już wartością dla ciemnego motywu
    // (np. ciemna plakietka w jasnym motywie, jasna w ciemnym), więc nie ma
    // czego dla niej nadpisywać. Bez tego wyjątku test zglaszal wlasne
    // rozwiazanie jako brak.
    if (m[1].includes("dark:")) continue;
    wszystkich++;
    if (DOZWOLONE.has(pelna) || css.includes(esc(pelna))) continue;
    if (!braki.has(pelna)) braki.set(pelna, new Set());
    braki.get(pelna).add(f);
  }
}

console.log(`Jasnych teł, ramek i pierścieni: ${wszystkich} wystąpień.`);
if (!braki.size) {
  console.log("Każde ma nadpisanie w ciemnym motywie albo jest na liście dozwolonych.");
  process.exit(0);
}
console.error(`\n${braki.size} klas bez nadpisania w ciemnym motywie:`);
for (const [cls, gdzie] of [...braki].sort()) {
  console.error(`  ${cls}  ->  ${[...gdzie].slice(0, 3).join(", ")}`);
}
console.error(
  "\nDopisz reguły w app/globals.css (sekcja nadpisań dla wariantów)," +
    "\nalbo dodaj klasę do DOZWOLONE, jeśli element stoi na ciemnym tle w obu motywach.",
);
process.exit(1);
