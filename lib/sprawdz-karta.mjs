/**
 * Test karty rozmowy (`npm run test:karta`).
 *
 * Odmiana polskich imion ma tyle wyjątków, że bez tego pliku pierwszy nowy
 * scenariusz po cichu pokazałby agentowi „Pan Marki" na ekranie telefonu.
 */
import { kartaRozmowy, mianownikImienia, plecRozmowcy } from "./karta-rozmowy.ts";

let bledy = 0;
function sprawdz(opis, otrzymano, oczekiwano) {
  const a = JSON.stringify(otrzymano);
  const b = JSON.stringify(oczekiwano);
  if (a !== b) {
    console.error(`BŁĄD: ${opis}\n  otrzymano:  ${a}\n  oczekiwano: ${b}`);
    bledy++;
  }
}

/* ── Odmiana ── */
sprawdz("dopełniacz męski", mianownikImienia("Krzysztofa"), "Krzysztof");
sprawdz("dopełniacz z sz", mianownikImienia("Tadeusza"), "Tadeusz");
sprawdz("ruchome e w dopełniaczu", mianownikImienia("Marka"), "Marek");
sprawdz("ruchome e w narzędniku", mianownikImienia("Markiem"), "Marek");
sprawdz("narzędnik męski", mianownikImienia("Piotrem"), "Piotr");
sprawdz("dopełniacz żeński na y", mianownikImienia("Barbary"), "Barbara");
sprawdz("dopełniacz żeński na i", mianownikImienia("Oli"), "Ola");
sprawdz("podwójne i", mianownikImienia("Natalii"), "Natalia");
sprawdz("zbyt krótkie słowo zostaje bez zmian", mianownikImienia("Jo"), "Jo");

/* ── Całe karty, treści wprost ze scenariuszy ── */
sprawdz(
  "zimny telefon do właściciela",
  kartaRozmowy("Dzwonisz do Pana Krzysztofa, który wystawił mieszkanie na OLX bez pośrednika."),
  { kto: "Pan Krzysztof", szczegoly: [] },
);
sprawdz(
  "follow-up po oględzinach",
  kartaRozmowy("Dzwonisz do Pani Anny, która 2 dni temu oglądała z Tobą mieszkanie (3 pokoje, 65 m², Ruczaj, 890 tys.)."),
  { kto: "Pani Anna", szczegoly: ["3 pokoje", "65 m²", "Ruczaj", "890 tys. zł"] },
);
sprawdz(
  "najem pokazuje czynsz, nie cenę",
  kartaRozmowy("Oddzwaniasz do Pani Oli, która pytała o mieszkanie na wynajem (2 pok., Zabłocie, 3200 zł/mc)."),
  { kto: "Pani Ola", szczegoly: ["2 pokoje", "Zabłocie", "3200 zł/mc"] },
);
sprawdz(
  "spotkanie w narzędniku",
  kartaRozmowy("Spotykasz się z Panem Markiem, właścicielem mieszkania, który jest gotów podpisać umowę."),
  { kto: "Pan Marek", szczegoly: [] },
);
sprawdz(
  "imię podane w mianowniku zostaje nietknięte",
  kartaRozmowy("Pani Ewa jest przekonana że jej mieszkanie warte 1,1 mln."),
  { kto: "Pani Ewa", szczegoly: ["1,1 mln zł"] },
);
sprawdz(
  "żeńskie imię na -ia w mianowniku",
  kartaRozmowy("Pani Natalia chce wynająć mieszkanie, jest przygotowana."),
  { kto: "Pani Natalia", szczegoly: [] },
);
sprawdz(
  "męskie imię po samym Pan zostaje",
  kartaRozmowy("Pan Robert chce wystawić mieszkanie w 3 biurach naraz."),
  { kto: "Pan Robert", szczegoly: [] },
);
sprawdz(
  "scenariusz bez imienia spada na rolę",
  kartaRozmowy("Rozmawiasz z właścicielem, który chce, żebyś sprzedał jego mieszkanie."),
  { kto: "Właściciel", szczegoly: [] },
);
sprawdz(
  "pusty opis nie wywraca karty",
  kartaRozmowy("", "Klient"),
  { kto: "Klient", szczegoly: [] },
);

/* ── Płeć do wyboru głosu ──
   Na ekranie telefonu stoi imię i głos musi się z nim zgadzać. Pomyłka tutaj
   kompromituje funkcję przy pierwszym pokazie, więc sprawdzamy oba kierunki. */
sprawdz("kobieta po imieniu", plecRozmowcy("Dzwonisz do Pani Anny, która oglądała mieszkanie."), "k");
sprawdz("kobieta w mianowniku", plecRozmowcy("Pani Ewa jest przekonana, że mieszkanie warte 1,1 mln."), "k");
sprawdz("mężczyzna po imieniu", plecRozmowcy("Dzwonisz do Pana Krzysztofa, który wystawił mieszkanie."), "m");
sprawdz("mężczyzna w narzędniku", plecRozmowcy("Spotykasz się z Panem Markiem, właścicielem mieszkania."), "m");
sprawdz("rola bez imienia idzie na głos męski", plecRozmowcy("Rozmawiasz z właścicielem mieszkania."), "m");
sprawdz("pusty opis nie wywraca wyboru", plecRozmowcy(""), "m");

if (bledy > 0) {
  console.error(`\n${bledy} błędów w karcie rozmowy.`);
  process.exit(1);
}
console.log("Karta rozmowy w porządku (odmiana imion, metraż, dzielnica, cena i czynsz).");
