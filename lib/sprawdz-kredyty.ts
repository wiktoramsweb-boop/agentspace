/**
 * Sprawdzenie wyceny kredytów AI (`npm run test:kredyty`).
 *
 * Kredyty decydują o rachunku za model i o tym, co klient dostaje w pakiecie,
 * więc pilnujemy tu rzeczy, które łatwo zepsuć przy dopisywaniu nowej funkcji
 * AI: brak wyceny, brak polskiej nazwy, rozjazd między ceną a kosztem.
 */

import {
  CENNIK_KREDYTOW,
  KOSZT_KREDYTU_ZL,
  KREDYTY_NA_AGENTA,
  NAZWY_OPERACJI,
  type Operacja,
  poczatekMiesiaca,
  pulaMiesieczna,
  kredytyZaRozmowe,
  kredytyZGory,
  KREDYTY_ZA_MINUTE_GLOSU,
  MAX_MINUT_ROZMOWY,
  DZIENNY_LIMIT_OSOBY,
} from "./kredyty-cennik.ts";

let bledy = 0;
function sprawdz(opis: string, warunek: boolean, szczegol = "") {
  if (!warunek) {
    bledy++;
    console.error(`BŁĄD  ${opis}${szczegol ? ` (${szczegol})` : ""}`);
  }
}

const operacje = Object.keys(CENNIK_KREDYTOW) as Operacja[];

// Każda operacja musi mieć wycenę i nazwę po polsku, inaczej ekran zużycia
// pokaże gołe klucze techniczne.
for (const op of operacje) {
  sprawdz(`${op}: wycena dodatnia`, CENNIK_KREDYTOW[op] > 0, String(CENNIK_KREDYTOW[op]));
  sprawdz(`${op}: ma nazwę po polsku`, Boolean(NAZWY_OPERACJI[op]));
}
sprawdz(
  "nazwy nie opisują nieistniejących operacji",
  Object.keys(NAZWY_OPERACJI).every((k) => operacje.includes(k as Operacja)),
);

// Typowa sesja z mediany prawdziwych danych: 7 tur agenta plus ocena.
const sesja = CENNIK_KREDYTOW.coach_tura * 7 + CENNIK_KREDYTOW.coach_ocena;
sprawdz("typowa sesja Coacha to 10 kredytów", sesja === 10, `${sesja}`);
const kosztSesji = sesja * KOSZT_KREDYTU_ZL;
sprawdz("typowa sesja kosztuje ok. 0,17 zł", Math.abs(kosztSesji - 0.167) < 0.01, `${kosztSesji} zł`);

// Pakiet Start nie ma AI Coacha, więc musi mieć mniejszą pulę niż Pro.
sprawdz("Pro ma nie mniejszą pulę niż Start", KREDYTY_NA_AGENTA.pro >= KREDYTY_NA_AGENTA.start);
sprawdz(
  "każdy pakiet ma dodatnią pulę",
  Object.values(KREDYTY_NA_AGENTA).every((n) => n > 0),
);

// Pula biura: ręczne ustawienie ma pierwszeństwo przed wyliczeniem z pakietu.
const bazowa = { ai_credits_extra: 0, ai_credits_extra_used: 0 };
sprawdz(
  "pula liczy się z pakietu i liczby agentów",
  pulaMiesieczna({ ...bazowa, plan: "pro", ai_credits_monthly: null }, 10) ===
    KREDYTY_NA_AGENTA.pro * 10,
);
sprawdz(
  "ręczna pula ma pierwszeństwo",
  pulaMiesieczna({ ...bazowa, plan: "pro", ai_credits_monthly: 5000 }, 10) === 5000,
);
sprawdz(
  "zero agentów nie daje zerowej puli",
  pulaMiesieczna({ ...bazowa, plan: "pro", ai_credits_monthly: null }, 0) === KREDYTY_NA_AGENTA.pro,
);
sprawdz(
  "nieznany pakiet dostaje pulę domyślną",
  pulaMiesieczna({ ...bazowa, plan: "cokolwiek", ai_credits_monthly: null }, 1) > 0,
);

// Okno rozliczeniowe musi wypadać na przełomie miesiąca, nie w jego środku.
const start = new Date(poczatekMiesiaca("Europe/Warsaw"));
const dni = (Date.now() - start.getTime()) / 86_400_000;
sprawdz("początek miesiąca nie jest w przyszłości", start.getTime() <= Date.now());
sprawdz("początek miesiąca nie jest dalej niż 32 dni wstecz", dni <= 32, `${dni.toFixed(1)} dni`);

/* ── Rozmowa głosowa ──
   Najdroższa operacja w aplikacji: minuta kosztuje tyle, co 22 tury pisane.
   Dlatego pilnujemy, żeby nie dało się jej rozliczyć poniżej realnego kosztu
   ani żeby pobranie z góry nie było mniejsze niż najdłuższa możliwa rozmowa. */
sprawdz("sekundy rozmowy zaokrąglamy w górę do minuty", kredytyZaRozmowe(61) === 2 * KREDYTY_ZA_MINUTE_GLOSU);
sprawdz("równa minuta to jedna minuta", kredytyZaRozmowe(60) === KREDYTY_ZA_MINUTE_GLOSU);
sprawdz("krótkie rozłączenie płaci za minutę", kredytyZaRozmowe(4) === KREDYTY_ZA_MINUTE_GLOSU);
sprawdz("zero sekund też płaci za minutę", kredytyZaRozmowe(0) === KREDYTY_ZA_MINUTE_GLOSU);
sprawdz(
  "dłuższa rozmowa niż limit nie liczy się ponad limit",
  kredytyZaRozmowe(60 * 60) === MAX_MINUT_ROZMOWY * KREDYTY_ZA_MINUTE_GLOSU,
);
sprawdz("rezerwacja pokrywa co najmniej jedną minutę", kredytyZGory() >= kredytyZaRozmowe(1));
/* To jest dokładnie ten błąd, który wyszedł na produkcji: rezerwacja większa
   niż dzienny limit osoby sprawiała, że rozmowy nie dało się w ogóle zacząć.
   Cała rozmowa też musi się mieścić w dobie, inaczej nikt jej nie dokończy. */
sprawdz(
  "rezerwacja mieści się w dziennym limicie osoby",
  kredytyZGory() < DZIENNY_LIMIT_OSOBY,
  `${kredytyZGory()} z ${DZIENNY_LIMIT_OSOBY}`,
);
sprawdz(
  "najdłuższa rozmowa mieści się w dziennym limicie osoby",
  kredytyZaRozmowe(MAX_MINUT_ROZMOWY * 60) < DZIENNY_LIMIT_OSOBY,
);
sprawdz(
  "minuta głosu kosztuje więcej niż tura pisana",
  CENNIK_KREDYTOW.coach_glos > CENNIK_KREDYTOW.coach_tura,
);

if (bledy) {
  console.error(`\nWycena kredytów: ${bledy} błędów.`);
  process.exit(1);
}
console.log(`Wycena kredytów w porządku (${operacje.length} operacji, typowa sesja ${sesja} kredytów).`);
