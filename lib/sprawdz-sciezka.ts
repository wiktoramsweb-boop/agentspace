/**
 * Sprawdzenie ścieżki nauki (`npm run test:sciezka`).
 * Od tego zależy, które lekcje agent widzi jako dostępne i ile XP dostaje.
 */

import { SCIEZKA, WSZYSTKIE_LEKCJE, XP_ZA_LEKCJE, lekcja, stanSciezki, wynikSesji } from "./coach/sciezka.ts";
import { TECHNIKI } from "./techniki/techniki.ts";
import { PERSONALITIES } from "./types.ts";

let bledy = 0;
function sprawdz(opis: string, warunek: boolean, szczegol = "") {
  if (!warunek) {
    bledy++;
    console.error(`BŁĄD  ${opis}${szczegol ? ` (${szczegol})` : ""}`);
  }
}

const SCENARIUSZE = new Set([
  "zimny-telefon-fsbo", "polecony-klient", "obiekcja-tylko-wylacznosc", "obiekcja-nie-place-prowizji",
  "telefon-archiwalny-najem", "klient-gotowkowy-gdybanie", "follow-up-po-ogledzinach", "obiekcja-przyjdz-z-klientem",
  "lead-najem-telefon", "obiekcja-zadnych-umow", "monitoring-rynku-sprzedaz", "lead-z-otodom", "zimny-telefon-wygasle",
  "najem-wlasciciel-weryfikacja", "najem-najemca-dokumenty", "najemca-z-dokumentami",
  "prezentacja-uslugi", "na-wylacznosc", "obiekcja-musze-pomyslec", "negocjacja-prowizji", "klient-gotowy-umowa",
  "przewartosciowane-mieszkanie", "negocjacja-oferty-wlasciciel", "doradca-kredytowy-prezentacja",
]);
const techniki = new Set(TECHNIKI.map((t) => t.slug));
const charaktery = new Set(PERSONALITIES.map((p) => p.value));

sprawdz("20 lekcji", WSZYSTKIE_LEKCJE.length === 20);
sprawdz("unikalne id", new Set(WSZYSTKIE_LEKCJE.map((l) => l.id)).size === 20);
for (const l of WSZYSTKIE_LEKCJE) {
  sprawdz(`${l.id}: scenariusz istnieje`, SCENARIUSZE.has(l.scenariusz), l.scenariusz);
  sprawdz(`${l.id}: technika istnieje`, techniki.has(l.technika), l.technika);
  sprawdz(`${l.id}: charakter istnieje`, charaktery.has(l.charakter), l.charakter);
  sprawdz(`${l.id}: próg w zakresie`, l.prog >= 40 && l.prog <= 90);
}
sprawdz("bez myślników", !JSON.stringify(SCIEZKA).includes("—"));

const pusty = stanSciezki([]);
sprawdz("na start tylko pierwsza lekcja otwarta", pusty.poziomy[0].lekcje[0].odblokowana && !pusty.poziomy[0].lekcje[1].odblokowana);
sprawdz("aktualna to pierwsza lekcja", pusty.aktualna?.id === "1-1");
sprawdz("zero XP na start", pusty.xp === 0);

const poJednej = stanSciezki([{ scenariusz: "polecony-klient", poziomTrudnosci: "latwy", wynik: 72 }]);
sprawdz("zaliczona pierwsza", poJednej.poziomy[0].lekcje[0].zaliczona);
sprawdz("odblokowana druga", poJednej.poziomy[0].lekcje[1].odblokowana && poJednej.aktualna?.id === "1-2");
sprawdz("XP za lekcję", poJednej.xp === XP_ZA_LEKCJE);

const ponizej = stanSciezki([{ scenariusz: "polecony-klient", poziomTrudnosci: "latwy", wynik: 30 }]);
sprawdz("poniżej progu nie zalicza", !ponizej.poziomy[0].lekcje[0].zaliczona && ponizej.poziomy[0].lekcje[0].najlepszy === 30);

const innyPoziom = stanSciezki([{ scenariusz: "polecony-klient", poziomTrudnosci: "trudny", wynik: 90 }]);
sprawdz("inny poziom trudności nie zalicza", !innyPoziom.poziomy[0].lekcje[0].zaliczona);

const caly = stanSciezki(SCIEZKA[0].lekcje.map((l) => ({ scenariusz: l.scenariusz, poziomTrudnosci: l.poziomTrudnosci, wynik: 100 })));
sprawdz("ukończony poziom 1", caly.poziomy[0].ukonczony);
sprawdz("skrzynia doliczona", caly.xp === 5 * XP_ZA_LEKCJE + SCIEZKA[0].nagroda, String(caly.xp));
sprawdz("drugi poziom otwarty", caly.poziomy[1].lekcje[0].odblokowana);

sprawdz("lekcja po id", lekcja("2-1")?.poziom.nr === 2 && lekcja("x") === null);
sprawdz("wynik z analizy", wynikSesji(64, 3) === 64);
sprawdz("wynik ze starej oceny", wynikSesji(undefined, 7) === 70);
sprawdz("brak wyniku", wynikSesji(undefined, null) === null);

if (bledy) {
  console.error(`\nŚcieżka: ${bledy} błędów.`);
  process.exit(1);
}
console.log("Ścieżka nauki w porządku.");
