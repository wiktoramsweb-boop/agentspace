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
  // Kropka wybranej opcji w AI Coachu: leży w środku zielonego kółka,
  // które jest zielone w obu motywach, więc biel jest tam zamierzona.
  "group-has-[:checked]:bg-white",
  // Ekran rozmowy głosowej rysuje telefon: obudowa i wyświetlacz są ciemne
  // w obu motywach, bo telefon ma wyglądać jak telefon, a nie jak strona.
  "ring-white/10", "bg-white/35",
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

/* ──────────────────────────────────────────────────────────────────────────
   Druga kontrola: tekst w kolorze tła.

   Osobna od poprzedniej, bo tamta pilnuje ciemnego motywu, a ta czytelności
   w ogóle. Powód jest z życia: dymek transkryptu miał „bg-emerald-50
   text-emerald-50", czyli tekst dokładnie w kolorze tła, i po rozmowie
   głosowej połowa zapisu nie istniała dla oka.

   Porównujemy wyłącznie pary, które naprawdę działają razem:
   - ten sam wariant (oba bez prefiksu, oba `dark:`, oba `hover:`),
   - albo tekst z wariantem i tło bez wariantu, ale TYLKO wtedy, gdy ten
     wariant nie ma własnego tła, które by tamto nadpisało.

   Klasy z przezroczystością (`bg-white/10`) pomijamy: leżą warstwowo na tle,
   którego z samej klasy odczytać się nie da.
   ────────────────────────────────────────────────────────────────────────── */

const JASNE = new Set([0, 50, 100, 200]);
const CIEMNE = new Set([700, 800, 900, 950, 1000]);
const odcienLiczba = (x) => (x === "white" ? 0 : x === "black" ? 1000 : Number(x));

const KOLOR_KLASA =
  /(?:([a-z-]+(?:\[[^\]]*\])?:))?(bg|text)-(?:([a-z]+)-(\d{2,3})|(white|black))(?![\w/-])/g;
/** Dowolna deklaracja tła, także z przezroczystością. Służy tylko do wykrycia nadpisania. */
const TLO_Z_WARIANTEM = /(?:([a-z-]+(?:\[[^\]]*\])?:))?bg-[a-z]+(?:-\d{2,3})?(?:\/\d{1,3})?\b/g;

const nieczytelne = [];
for (const f of files) {
  for (const [literal] of fs.readFileSync(f, "utf8").matchAll(/"([^"\n]*)"/g)) {
    const tokeny = [...literal.matchAll(KOLOR_KLASA)].map((m) => ({
      prefiks: m[1] ?? "",
      rodzaj: m[2],
      rodzina: m[3] ?? m[5],
      odcien: odcienLiczba(m[4] ?? m[5]),
    }));
    const wariantyZTlem = new Set([...literal.matchAll(TLO_Z_WARIANTEM)].map((m) => m[1] ?? ""));
    const tla = tokeny.filter((t) => t.rodzaj === "bg");

    for (const t of tokeny.filter((x) => x.rodzaj === "text")) {
      const wlasne = tla.find((x) => x.prefiks === t.prefiks);
      // Wariant ma własne tło, którego nie umiemy odczytać: nie zgadujemy.
      if (!wlasne && t.prefiks && wariantyZTlem.has(t.prefiks)) continue;
      const b = wlasne ?? tla.find((x) => x.prefiks === "");
      if (!b) continue;

      const taSama = b.rodzina === t.rodzina && Math.abs(b.odcien - t.odcien) <= 100;
      const obaJasne = JASNE.has(b.odcien) && JASNE.has(t.odcien);
      const obaCiemne = CIEMNE.has(b.odcien) && CIEMNE.has(t.odcien);
      if (taSama || obaJasne || obaCiemne) {
        nieczytelne.push(
          `  ${f}\n     ${b.prefiks}bg-${b.rodzina}-${b.odcien} + ${t.prefiks}text-${t.rodzina}-${t.odcien}`,
        );
      }
    }
  }
}

if (nieczytelne.length > 0) {
  console.error(`\n${nieczytelne.length} par tekstu nieczytelnego na swoim tle:`);
  console.error(nieczytelne.join("\n"));
  console.error("\nTekst i tło są w tym samym albo zbyt zbliżonym odcieniu.");
  process.exit(1);
}


console.log(`Jasnych teł, ramek i pierścieni: ${wszystkich} wystąpień.`);
if (!braki.size) {
  console.log(
  "Każde ma nadpisanie w ciemnym motywie albo jest na liście dozwolonych.\nŻaden tekst nie stoi na tle w swoim kolorze.",
);
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
