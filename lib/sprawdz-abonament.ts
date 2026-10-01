/**
 * Sprawdzenie okresu próbnego i rabatów (`npm run test:abonament`).
 *
 * To logika, która decyduje, czy biuro ma dostęp do systemu i ile zapłaci.
 * Błąd tutaj albo odcina pracujące biuro, albo rozdaje system za darmo,
 * więc pilnujemy obu skrajności.
 */

import {
  DNI_PROBNE,
  OKRESY,
  cenaOkresu,
  cenaZaMiesiac,
  koniecOkresu,
  opisOkresu,
  oszczednosc,
  stanDostepu,
  type Okres,
} from "./abonament-cennik.ts";

let bledy = 0;
function sprawdz(opis: string, warunek: boolean, szczegol = "") {
  if (!warunek) {
    bledy++;
    console.error(`BŁĄD  ${opis}${szczegol ? ` (${szczegol})` : ""}`);
  }
}

const teraz = new Date("2026-06-15T12:00:00Z");
const za = (dni: number) => new Date(teraz.getTime() + dni * 86_400_000).toISOString();

// ── Dostęp ──────────────────────────────────────────────────────────────
// Najważniejsza zasada: brak danych nie może nikomu zamknąć systemu.
sprawdz("brak agencji to otwarty dostęp", stanDostepu(null, teraz).aktywne);
sprawdz("brak kolumn v37 to otwarty dostęp", stanDostepu({}, teraz).aktywne);
sprawdz(
  "biuro sprzed v37 (trial bez daty) ma dostęp",
  stanDostepu({ subscription_status: "trial", trial_ends_at: null }, teraz).aktywne,
);

const wTrakcie = stanDostepu({ subscription_status: "trial", trial_ends_at: za(3) }, teraz);
sprawdz("trwający okres próbny daje dostęp", wTrakcie.aktywne && wTrakcie.probny);
sprawdz("trwający okres próbny liczy dni", wTrakcie.dniDoKonca === 3, `${wTrakcie.dniDoKonca}`);
sprawdz("w okresie próbnym zawsze ostrzegamy", wTrakcie.ostrzegaj);

const poProbnym = stanDostepu({ subscription_status: "trial", trial_ends_at: za(-1) }, teraz);
sprawdz("okres próbny po terminie odcina dostęp", !poProbnym.aktywne);

const oplacony = stanDostepu(
  { subscription_status: "active", subscription_ends_at: za(40) },
  teraz,
);
sprawdz("opłacony abonament daje dostęp", oplacony.aktywne && !oplacony.probny);
sprawdz("przy 40 dniach nie zawracamy głowy", !oplacony.ostrzegaj);
sprawdz(
  "przy 5 dniach ostrzegamy",
  stanDostepu({ subscription_status: "active", subscription_ends_at: za(5) }, teraz).ostrzegaj,
);
sprawdz(
  "wygasły abonament odcina dostęp",
  !stanDostepu({ subscription_status: "active", subscription_ends_at: za(-1) }, teraz).aktywne,
);
sprawdz(
  "anulowany abonament odcina dostęp",
  !stanDostepu({ subscription_status: "cancelled" }, teraz).aktywne,
);
sprawdz(
  "abonament bezterminowy daje dostęp",
  stanDostepu({ subscription_status: "active", subscription_ends_at: null }, teraz).aktywne,
);

// ── Rabaty ──────────────────────────────────────────────────────────────
sprawdz("okres próbny to 7 dni", DNI_PROBNE === 7);
sprawdz("miesięczny nie ma rabatu", opisOkresu("monthly").rabat === 0);
sprawdz(
  "dłuższy okres ma nie mniejszy rabat",
  OKRESY.every((o, i) => i === 0 || o.rabat >= OKRESY[i - 1].rabat),
);
sprawdz(
  "dłuższy okres ma więcej miesięcy",
  OKRESY.every((o, i) => i === 0 || o.miesiecy > OKRESY[i - 1].miesiecy),
);

const cena = 599;
sprawdz("miesięcznie to po prostu cena", cenaOkresu(cena, "monthly") === cena);
sprawdz("pół roku to 10% taniej", cenaOkresu(cena, "half_year") === Math.round(cena * 6 * 0.9));
sprawdz("rok to 20% taniej", cenaOkresu(cena, "yearly") === Math.round(cena * 12 * 0.8));

for (const o of OKRESY) {
  const id = o.id as Okres;
  sprawdz(
    `${o.id}: cena za miesiąc nie przekracza miesięcznej`,
    cenaZaMiesiac(cena, id) <= cena,
    `${cenaZaMiesiac(cena, id)} zł`,
  );
  sprawdz(`${o.id}: oszczędność nie jest ujemna`, oszczednosc(cena, id) >= 0);
}
sprawdz(
  "rok oszczędza więcej niż pół roku",
  oszczednosc(cena, "yearly") > oszczednosc(cena, "half_year"),
);

// ── Koniec okresu ───────────────────────────────────────────────────────
const rok = koniecOkresu("yearly", teraz);
sprawdz("rok kończy się za 12 miesięcy", rok.getUTCFullYear() === 2027 && rok.getUTCMonth() === 5);
const pol = koniecOkresu("half_year", teraz);
sprawdz("pół roku kończy się w grudniu", pol.getUTCMonth() === 11);

if (bledy) {
  console.error(`\nAbonament: ${bledy} błędów.`);
  process.exit(1);
}
console.log(`Abonament w porządku (${OKRESY.length} okresy, próbny ${DNI_PROBNE} dni).`);
