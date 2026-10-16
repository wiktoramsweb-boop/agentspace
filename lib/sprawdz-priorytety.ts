/**
 * Sprawdzenie oceny klientów na pulpicie (`npm run test:priorytety`).
 *
 * Kolejność spraw decyduje, do kogo agent zadzwoni rano, więc pilnujemy,
 * żeby zaległe terminy i spotkania dziś zawsze wygrywały z resztą.
 */

import { ocenKlienta, type SygnalyKlienta } from "./priorytety.ts";

let bledy = 0;
function sprawdz(opis: string, warunek: boolean, szczegol = "") {
  if (!warunek) {
    bledy++;
    console.error(`BŁĄD  ${opis}${szczegol ? ` (${szczegol})` : ""}`);
  }
}

const DZIS = "2026-10-16";
const baza: SygnalyKlienta = {
  status: "w_kontakcie",
  type: "kupujacy",
  budget_pln: null,
  phone: "500100200",
  email: null,
  next_contact_at: null,
  last_contact_at: "2026-10-14T10:00:00Z",
  created_at: "2026-10-01T10:00:00Z",
  notatek: 0,
  polaczenWykonanych: 1,
  spotkanWykonanych: 0,
  spotkanieNajblizsze: null,
  ofert: 0,
  transakcjaWToku: false,
  transakcjaTermin: null,
};
const k = (z: Partial<SygnalyKlienta>) => ocenKlienta({ ...baza, ...z }, DZIS);

// ── Wynik i temperatura ─────────────────────────────────────────────────
for (const s of ["nowy", "w_kontakcie", "oglada", "negocjacje"] as const) {
  const o = k({ status: s });
  sprawdz(`wynik w zakresie 1-99 (${s})`, o.wynik >= 1 && o.wynik <= 99, `${o.wynik}`);
}
sprawdz("negocjacje z transakcją są gorące", k({ status: "negocjacje", transakcjaWToku: true, budget_pln: 800000 }).temperatura === "goracy");
sprawdz("stary nowy kontakt jest zimny", k({ status: "nowy", last_contact_at: "2026-08-01T10:00:00Z" }).temperatura === "zimny");
sprawdz("dalszy etap daje wyższy wynik", k({ status: "oglada" }).wynik > k({ status: "nowy" }).wynik);
sprawdz("długi brak kontaktu obniża wynik", k({ last_contact_at: "2026-09-01T10:00:00Z" }).wynik < k({}).wynik);

// ── Pilność ─────────────────────────────────────────────────────────────
const zalegly = k({ status: "nowy", next_contact_at: "2026-10-13" });
const goracyBezTerminu = k({ status: "negocjacje", transakcjaWToku: true });
sprawdz("zaległy termin wygrywa z gorącym bez terminu", zalegly.pilnosc > goracyBezTerminu.pilnosc, `${zalegly.pilnosc} vs ${goracyBezTerminu.pilnosc}`);
sprawdz("powód podaje liczbę dni zaległości", zalegly.powod === "Kontakt zaplanowany 3 dni temu", zalegly.powod);
sprawdz("spotkanie dziś jest najpilniejsze", k({ spotkanieNajblizsze: `${DZIS}T14:00:00Z` }).pilnosc > zalegly.pilnosc);
sprawdz("termin w przyszłości spycha w dół", k({ next_contact_at: "2026-10-25" }).pilnosc < k({}).pilnosc);
sprawdz("nowy bez rozmowy ma powód", k({ status: "nowy", last_contact_at: null, polaczenWykonanych: 0 }).powod.startsWith("Nowy kontakt"));

// ── Kroki etapu ─────────────────────────────────────────────────────────
const nowy = k({ status: "nowy", last_contact_at: null, polaczenWykonanych: 0 });
sprawdz("nowy kupujący: pierwszy krok to telefon", nowy.kroki[0]?.klucz === "telefon" && !nowy.kroki[0].zrobiony);
sprawdz("drugi wymagany krok czeka na pierwszy", nowy.kroki[1]?.zablokowany === true);
sprawdz("sprzedający dostaje krok z ofertą", k({ status: "nowy", type: "sprzedajacy" }).kroki.some((x) => x.klucz === "oferta"));
const gotowy = k({ status: "w_kontakcie", notatek: 2, spotkanWykonanych: 1 });
sprawdz("etap gotowy, gdy wymagane zrobione", gotowy.etapGotowy && gotowy.nastepnyEtap === "oglada");
sprawdz("etap niegotowy bez notatki", !k({}).etapGotowy);
sprawdz("zamknięty nie ma kroków ani następnego etapu", k({ status: "zamkniety" }).kroki.length === 0 && k({ status: "zamkniety" }).nastepnyEtap === null);

if (bledy) {
  console.error(`\nPriorytety: ${bledy} błędów.`);
  process.exit(1);
}
console.log("Priorytety w porządku.");
