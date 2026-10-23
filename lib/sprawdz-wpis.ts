/** Sprawdzenie szybkiego wpisu (`npm run test:wpis`). */
import { cyfryTelefonu, kwota, poprawnaData, poprawnaGodzina, znajdzKlienta } from "./szybki-wpis.ts";

let bledy = 0;
const sprawdz = (opis: string, w: boolean) => {
  if (!w) {
    bledy++;
    console.error(`BŁĄD  ${opis}`);
  }
};
const baza = [
  { id: "1", name: "Anna Kowalska", phone: "+48 600 100 200" },
  { id: "2", name: "Anna Nowak", phone: null },
  { id: "3", name: "Marcin Dąbski", phone: "501-222-333" },
];
sprawdz("telefon w innym zapisie", znajdzKlienta("ktoś", "600100200", baza)?.klient.id === "1");
sprawdz("telefon z +48", cyfryTelefonu("+48 501 222 333") === "501222333");
sprawdz("pełne nazwisko bez ogonków", znajdzKlienta("Marcin Dabski", null, baza)?.klient.id === "3");
sprawdz("pan/pani nie przeszkadza", znajdzKlienta("Pani Anna Nowak", null, baza)?.klient.id === "2");
sprawdz("samo imię nie dopasowuje", znajdzKlienta("Anna", null, baza) === null);
sprawdz("nowy klient", znajdzKlienta("Tomasz Zieliński", "700800900", baza) === null);
sprawdz("godzina 17.30", poprawnaGodzina("17.30") === "17:30");
sprawdz("godzina 9:05", poprawnaGodzina("9:05") === "09:05");
sprawdz("zła godzina", poprawnaGodzina("25:00") === null);
sprawdz("data w przyszłości", poprawnaData("2026-10-29", "2026-10-23") === "2026-10-29");
sprawdz("data z przeszłości odrzucona", poprawnaData("2026-09-01", "2026-10-23") === null);
sprawdz("nieistniejąca data", poprawnaData("2026-02-30", "2026-01-10") === null);
sprawdz("650 tys.", kwota("650 tys.") === 650000);
sprawdz("1,2 mln", kwota("1,2 mln") === 1200000);
sprawdz("liczba", kwota(480000) === 480000);
sprawdz("pusto", kwota("") === null);
if (bledy) {
  console.error(`\nSzybki wpis: ${bledy} błędów.`);
  process.exit(1);
}
console.log("Szybki wpis w porządku.");
