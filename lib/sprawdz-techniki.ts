/**
 * Sprawdzenie biblioteki technik (`npm run test:techniki`).
 * Linki między technikami, skryptami i scenariuszami AI Coacha muszą prowadzić do istniejących stron.
 */

import { TECHNIKI, KATEGORIE } from "./techniki/techniki.ts";
import { SKRYPTY, STRUKTURA } from "./techniki/skrypty.ts";
import { ROZMOWY } from "./techniki/rozmowy.ts";
import { OBIEKCJE } from "./techniki/obiekcje.ts";

// Aktywne scenariusze z tabeli scenarios (stan z października 2026).
const SCENARIUSZE = new Set([
  "zimny-telefon-fsbo", "polecony-klient", "obiekcja-tylko-wylacznosc", "obiekcja-nie-place-prowizji",
  "telefon-archiwalny-najem", "klient-gotowkowy-gdybanie", "follow-up-po-ogledzinach", "obiekcja-przyjdz-z-klientem",
  "lead-najem-telefon", "obiekcja-zadnych-umow", "monitoring-rynku-sprzedaz", "lead-z-otodom", "zimny-telefon-wygasle",
  "najem-wlasciciel-weryfikacja", "najem-najemca-dokumenty", "najemca-z-dokumentami",
  "prezentacja-uslugi", "na-wylacznosc", "obiekcja-musze-pomyslec", "negocjacja-prowizji", "klient-gotowy-umowa",
  "przewartosciowane-mieszkanie", "negocjacja-oferty-wlasciciel", "doradca-kredytowy-prezentacja",
]);

let bledy = 0;
function sprawdz(opis: string, warunek: boolean) {
  if (!warunek) {
    bledy++;
    console.error(`BŁĄD  ${opis}`);
  }
}

const slugi = new Set(TECHNIKI.map((t) => t.slug));
sprawdz("unikalne slugi technik", slugi.size === TECHNIKI.length);
sprawdz("unikalne slugi skryptów", new Set(SKRYPTY.map((s) => s.slug)).size === SKRYPTY.length);
sprawdz("struktura sumuje się do 100%", STRUKTURA.reduce((s, e) => s + e.procent, 0) === 100);

for (const t of TECHNIKI) {
  sprawdz(`${t.slug}: kategoria`, t.kategoria in KATEGORIE);
  sprawdz(`${t.slug}: ma kroki i przykład`, t.kroki.length > 0 && t.przyklady.length > 0);
  sprawdz(`${t.slug}: ma scenariusz do treningu`, t.scenariusze.length > 0);
  for (const p of [...t.powiazane, ...t.kontra]) sprawdz(`${t.slug}: powiązana ${p} istnieje`, slugi.has(p));
  for (const s of t.scenariusze) sprawdz(`${t.slug}: scenariusz ${s} istnieje`, SCENARIUSZE.has(s));
}
for (const s of SKRYPTY) {
  for (const t of s.techniki) sprawdz(`${s.slug}: technika ${t} istnieje`, slugi.has(t));
  for (const o of s.obiekcje) sprawdz(`${s.slug}: technika obiekcji ${o.technika} istnieje`, slugi.has(o.technika));
  for (const sc of s.scenariusze) sprawdz(`${s.slug}: scenariusz ${sc} istnieje`, SCENARIUSZE.has(sc));
}

for (const [slug, d] of Object.entries(ROZMOWY)) {
  sprawdz(`rozmowa ${slug}: skrypt istnieje`, SKRYPTY.some((s) => s.slug === slug));
  sprawdz(`rozmowa ${slug}: start istnieje`, Boolean(d.wezly[d.start]));
  const osiagalne = new Set<string>();
  const kolejka = [d.start];
  while (kolejka.length) {
    const id = kolejka.pop()!;
    if (osiagalne.has(id)) continue;
    osiagalne.add(id);
    const w = d.wezly[id];
    sprawdz(`rozmowa ${slug}: węzeł ${id} istnieje`, Boolean(w));
    if (!w) continue;
    sprawdz(`rozmowa ${slug}/${id}: ma odpowiedzi albo koniec`, Boolean(w.koniec) !== Boolean(w.opcje?.length));
    if (w.technika) sprawdz(`rozmowa ${slug}/${id}: technika ${w.technika} istnieje`, slugi.has(w.technika));
    for (const o of w.opcje ?? []) kolejka.push(o.dalej);
  }
  for (const id of Object.keys(d.wezly)) sprawdz(`rozmowa ${slug}: węzeł ${id} jest osiągalny`, osiagalne.has(id));
}

sprawdz("unikalne id obiekcji", new Set(OBIEKCJE.map((o) => o.id)).size === OBIEKCJE.length);
for (const o of OBIEKCJE) {
  sprawdz(`obiekcja ${o.id}: technika ${o.technika} istnieje`, slugi.has(o.technika));
  sprawdz(`obiekcja ${o.id}: trzy style odpowiedzi`, new Set(o.odpowiedzi.map((x) => x.styl)).size === 3);
}

const caly = JSON.stringify([TECHNIKI, SKRYPTY, STRUKTURA, ROZMOWY, OBIEKCJE]);
sprawdz("bez długich myślników w treściach", !caly.includes("—"));

if (bledy) {
  console.error(`\n${bledy} błędów.`);
  process.exit(1);
}
console.log(`OK: ${TECHNIKI.length} technik, ${SKRYPTY.length} skryptów.`);
