/**
 * Test logiki automatyzacji i zastępstw: `npm run test:automatyzacje`.
 * Sprawdza to, co psuje się po cichu: warunki ceny, klucze zdarzeń
 * (czy reguła nie odpali się dwa razy) i łańcuch zastępstw.
 */
import assert from "node:assert/strict";
import {
  spelniaWarunki, kluczZdarzenia, wypelnij, terminZadania, opisReguly, SZABLONY_REGUL, akcjeDlaZdarzenia,
} from "./automatyzacje-model.ts";
import { rozwinZastepce } from "./zastepstwa-model.ts";

let n = 0;
const t = (nazwa, fn) => { fn(); n++; };

t("obniżka spełnia warunek obniżki", () => {
  assert.equal(spelniaWarunki({ kierunekCeny: "obnizka" }, { zdarzenie: "zmiana_ceny_oferty", staraCena: 500000, nowaCena: 480000 }), true);
});
t("podwyżka nie spełnia warunku obniżki", () => {
  assert.equal(spelniaWarunki({ kierunekCeny: "obnizka" }, { zdarzenie: "zmiana_ceny_oferty", staraCena: 500000, nowaCena: 520000 }), false);
});
t("obniżka o 1% nie przechodzi progu 2%", () => {
  assert.equal(spelniaWarunki({ kierunekCeny: "obnizka", minZmianaProcent: 2 }, { zdarzenie: "zmiana_ceny_oferty", staraCena: 500000, nowaCena: 495000 }), false);
});
t("obniżka dokładnie o próg przechodzi", () => {
  assert.equal(spelniaWarunki({ minZmianaProcent: 2 }, { zdarzenie: "zmiana_ceny_oferty", staraCena: 500000, nowaCena: 490000 }), true);
});
t("pierwsze ustawienie ceny to nie obniżka", () => {
  assert.equal(spelniaWarunki({ kierunekCeny: "obnizka" }, { zdarzenie: "zmiana_ceny_oferty", staraCena: null, nowaCena: 490000 }), false);
});
t("status spoza listy nie spełnia warunku", () => {
  assert.equal(spelniaWarunki({ statusNa: ["negocjacje"] }, { zdarzenie: "zmiana_statusu_klienta", statusKlienta: "oglada" }), false);
  assert.equal(spelniaWarunki({ statusNa: ["negocjacje"] }, { zdarzenie: "zmiana_statusu_klienta", statusKlienta: "negocjacje" }), true);
});
t("pusty warunek przepuszcza wszystko", () => {
  assert.equal(spelniaWarunki({}, { zdarzenie: "nowy_klient" }), true);
});

t("klucz klienta bez kontaktu zależy od daty ostatniego kontaktu", () => {
  const k = { zdarzenie: "klient_bez_kontaktu", klientId: "c1" };
  assert.equal(kluczZdarzenia(k, "2026-10-01"), kluczZdarzenia(k, "2026-10-01"));
  assert.notEqual(kluczZdarzenia(k, "2026-10-01"), kluczZdarzenia(k, "2026-10-09"));
});
t("ta sama zmiana ceny daje ten sam klucz, inna inny", () => {
  const a = kluczZdarzenia({ zdarzenie: "zmiana_ceny_oferty", ofertaId: "p1", staraCena: 1, nowaCena: 2 });
  assert.equal(a, kluczZdarzenia({ zdarzenie: "zmiana_ceny_oferty", ofertaId: "p1", staraCena: 1, nowaCena: 2 }));
  assert.notEqual(a, kluczZdarzenia({ zdarzenie: "zmiana_ceny_oferty", ofertaId: "p1", staraCena: 2, nowaCena: 1 }));
});
t("nowy klient: jeden klucz na klienta", () => {
  assert.equal(kluczZdarzenia({ zdarzenie: "nowy_klient", klientId: "x" }), "nowy_klient:x");
});

t("szablon treści podstawia zmienne i imię", () => {
  const w = wypelnij("Zadzwoń do {imie} w sprawie {oferta}, cena {cena}", {
    zdarzenie: "zmiana_ceny_oferty", nazwaKlienta: "Anna Nowak", nazwaOferty: "M3 Bronowice", nowaCena: 749000,
  });
  assert.equal(w, "Zadzwoń do Anna w sprawie M3 Bronowice, cena 749 000 zł");
});
t("nieznana zmienna zostaje widoczna", () => {
  assert.equal(wypelnij("Cześć {imiee}", { zdarzenie: "nowy_klient", nazwaKlienta: "Jan" }), "Cześć {imiee}");
});

t("termin zadania przechodzi przez koniec miesiąca", () => {
  assert.deepEqual(terminZadania("2026-10-31", 1, "10:00"), { dzien: "2026-11-01", godzina: "10:00" });
  assert.deepEqual(terminZadania("2026-12-31", 2, "zła"), { dzien: "2027-01-02", godzina: "09:00" });
});

t("każdy szablon reguły ma akcje pasujące do zdarzenia", () => {
  for (const s of SZABLONY_REGUL) {
    assert.ok(s.actions.length > 0, s.klucz);
    const dozwolone = akcjeDlaZdarzenia(s.trigger);
    for (const a of s.actions) assert.ok(dozwolone.includes(a.typ), `${s.klucz}: ${a.typ}`);
    assert.ok(opisReguly(s).startsWith("Kiedy"), s.klucz);
  }
});

// Zastępstwa
const urlopy = (pary) => pary.map(([agent, zast], i) => ({ id: String(i), agent_id: agent, substitute_id: zast, kind: "urlop", starts_on: "", ends_on: "", note: null }));

t("obecna osoba obsługuje sama", () => {
  assert.equal(rozwinZastepce("anna", urlopy([["piotr", "anna"]])), "anna");
});
t("nieobecna osoba przekazuje zastępcy", () => {
  assert.equal(rozwinZastepce("anna", urlopy([["anna", "piotr"]])), "piotr");
});
t("zastępca zastępcy, gdy pierwszy też na urlopie", () => {
  assert.equal(rozwinZastepce("anna", urlopy([["anna", "piotr"], ["piotr", "ola"]])), "ola");
});
t("pętla zastępstw wraca do opiekuna", () => {
  assert.equal(rozwinZastepce("anna", urlopy([["anna", "piotr"], ["piotr", "anna"]])), "anna");
});
t("urlop bez wskazanego zastępcy zostawia opiekuna", () => {
  assert.equal(rozwinZastepce("anna", urlopy([["anna", null]])), "anna");
});
t("pusty użytkownik zostaje pusty", () => {
  assert.equal(rozwinZastepce(null, []), null);
});

console.log(`Automatyzacje i zastępstwa: ${n} sprawdzeń, wszystkie przeszły.`);
