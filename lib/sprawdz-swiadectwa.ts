/**
 * Sprawdzenie zamówień świadectw (`npm run test:swiadectwa`).
 * Cena trafia do rozliczenia biura, a walidacja decyduje, czy audytor dostanie komplet danych.
 */

import { PUSTE, bledyZamowienia, cenaZamowienia, oczyscZamowienie } from "./swiadectwa.ts";

let bledy = 0;
function sprawdz(opis: string, warunek: boolean, szczegol = "") {
  if (!warunek) {
    bledy++;
    console.error(`BŁĄD  ${opis}${szczegol ? ` (${szczegol})` : ""}`);
  }
}

sprawdz("mieszkanie standard 300 netto", cenaZamowienia("mieszkanie", "standard").netto === 300);
sprawdz("brutto z VAT 23%", cenaZamowienia("mieszkanie", "standard").brutto === 369);
sprawdz("express dolicza 100", cenaZamowienia("dom", "express").netto === 550);

const pelne = oczyscZamowienie({
  ...PUSTE,
  ulica: "Testowa", nrBudynku: "1", kod: "30-002", miasto: "Kraków", powierzchnia: "48", wysokosc: "260", scianyZewn: "2",
  imie: "Jan", email: "jan@example.com", telefon: "+48 500 100 200", zgoda: true,
  ogrzewanie: "Nie wiem", cwu: "Nie wiem", grzejniki: "Nie wiem", wentylacja: "Nie wiem", sciany: "Nie wiem", izolacja: "Nie wiem",
  gruboscSciany: "38", gruboscIzolacji: "0", rokOddania: "1998", rokTermo: "1998",
});
sprawdz("komplet przechodzi", bledyZamowienia(pelne, 1).length === 0, bledyZamowienia(pelne, 1).join("; "));
sprawdz("bez zdjęcia budynku nie przechodzi", bledyZamowienia(pelne, 0).some((b) => b.includes("zdjęcie")));
sprawdz("zły kod pocztowy wyłapany", bledyZamowienia({ ...pelne, kod: "30002" }, 1).some((b) => b.includes("Kod")));
sprawdz("bez zgody nie przechodzi", bledyZamowienia({ ...pelne, zgoda: false }, 1).some((b) => b.includes("zgodę")));
sprawdz("wartość spoza listy odrzucona", oczyscZamowienie({ ...pelne, ogrzewanie: "<script>" }).ogrzewanie === "");
sprawdz("nieznany typ zamieniony na mieszkanie", oczyscZamowienie({ ...pelne, typ: "zamek" as never }).typ === "mieszkanie");

if (bledy) {
  console.error(`\nŚwiadectwa: ${bledy} błędów.`);
  process.exit(1);
}
console.log("Świadectwa w porządku.");
