/**
 * Test liczenia kwot na fakturze.
 *
 * Pieniądze i zaokrąglenia to jedyne miejsce w tym module, w którym błąd
 * jest niewidoczny gołym okiem i kosztowny: faktura z sumą rozjechaną
 * o grosz nie przejdzie u księgowej, a przy korekcie rozjeżdża się JPK.
 *
 * Uruchamiane gołym node (`npm run test:faktury`), dlatego lib/invoice.ts
 * nie może mieć importów.
 */
import {
  invoiceTotal,
  kwotyPozycji,
  podsumowanieVat,
  sumyFaktury,
  amountToWordsPL,
  zVatem,
} from "./invoice.ts";

let bledy = 0;
function sprawdz(opis, otrzymano, oczekiwano) {
  const a = JSON.stringify(otrzymano);
  const b = JSON.stringify(oczekiwano);
  if (a !== b) {
    console.error(`BŁĄD: ${opis}\n  otrzymano:  ${a}\n  oczekiwano: ${b}`);
    bledy++;
  }
}

/* ── 1. Zwolnienie podmiotowe: tak działały wszystkie dotychczasowe faktury ── */
const zw = [{ name: "Pośrednictwo", qty: 1, unitPrice: 12300 }];
sprawdz("zw: sumy", sumyFaktury(zw, "netto"), { netto: 12300, vat: 0, brutto: 12300 });
sprawdz("zw: invoiceTotal bez zmian", invoiceTotal(zw), 12300);
sprawdz("zw: brak VAT-u", zVatem(zw), false);

/* ── 2. Stawka 23% od netto ── */
const vat23 = [{ name: "Prowizja", qty: 1, unitPrice: 10000, vat: "23" }];
sprawdz("23% netto: sumy", sumyFaktury(vat23, "netto"), { netto: 10000, vat: 2300, brutto: 12300 });
sprawdz("23% netto: jest VAT", zVatem(vat23), true);

/* ── 3. Ta sama kwota podana jako brutto ── */
const brutto23 = [{ name: "Prowizja", qty: 1, unitPrice: 12300, vat: "23" }];
sprawdz("23% brutto: sumy", sumyFaktury(brutto23, "brutto"), { netto: 10000, vat: 2300, brutto: 12300 });

/* ── 4. Zaokrąglenie: 100 zł brutto przy 23% nie dzieli się równo ── */
const trudne = [{ name: "Usługa", qty: 1, unitPrice: 100, vat: "23" }];
const t = sumyFaktury(trudne, "brutto");
sprawdz("brutto 100 zł: netto + VAT = brutto", Math.round((t.netto + t.vat) * 100) / 100, 100);
sprawdz("brutto 100 zł: netto", t.netto, 81.3);
sprawdz("brutto 100 zł: VAT", t.vat, 18.7);

/* ── 5. Kilka pozycji w tej samej stawce: podatek liczony od sumy grupy ──
   Trzy razy 0,33 zł netto przy 23%. Licząc pozycja po pozycji VAT wyszedłby
   3 × 0,08 = 0,24 zł. Od sumy grupy (0,99 zł) wychodzi 0,23 zł i to jest
   wynik poprawny. */
const drobne = [
  { name: "a", qty: 1, unitPrice: 0.33, vat: "23" },
  { name: "b", qty: 1, unitPrice: 0.33, vat: "23" },
  { name: "c", qty: 1, unitPrice: 0.33, vat: "23" },
];
sprawdz("grosze: VAT od sumy grupy", sumyFaktury(drobne, "netto"), {
  netto: 0.99,
  vat: 0.23,
  brutto: 1.22,
});

/* ── 6. Faktura mieszana: trzy stawki naraz ── */
const mieszana = [
  { name: "Pośrednictwo", qty: 1, unitPrice: 10000, vat: "23" },
  { name: "Materiały", qty: 2, unitPrice: 50, vat: "8" },
  { name: "Opłata sądowa", qty: 1, unitPrice: 200, vat: "zw" },
];
sprawdz("mieszana: zestawienie wg stawek", podsumowanieVat(mieszana, "netto"), [
  { stawka: "23", netto: 10000, vat: 2300, brutto: 12300 },
  { stawka: "8", netto: 100, vat: 8, brutto: 108 },
  { stawka: "zw", netto: 200, vat: 0, brutto: 200 },
]);
sprawdz("mieszana: sumy", sumyFaktury(mieszana, "netto"), {
  netto: 10300,
  vat: 2308,
  brutto: 12608,
});

/* ── 7. Ilość ułamkowa ── */
const ulamek = [{ name: "Godziny", qty: 1.5, unitPrice: 200, vat: "23" }];
sprawdz("ilość 1,5", sumyFaktury(ulamek, "netto"), { netto: 300, vat: 69, brutto: 369 });

/* ── 8. Kwoty pojedynczej pozycji do kolumn tabeli ── */
sprawdz("kwoty pozycji 23% netto", kwotyPozycji(vat23[0], "netto"), {
  netto: 10000,
  vat: 2300,
  brutto: 12300,
});

/* ── 9. Stawka 0% to nie to samo co zwolnienie, ale kwotowo wychodzi tak samo ── */
const zero = [{ name: "Eksport", qty: 1, unitPrice: 500, vat: "0" }];
sprawdz("stawka 0%", sumyFaktury(zero, "netto"), { netto: 500, vat: 0, brutto: 500 });
sprawdz("0% nie liczy się jako VAT", zVatem(zero), false);

/* ── 10. Kwota słownie ── */
sprawdz("słownie 12 608,00", amountToWordsPL(12608), "dwanaście tysięcy sześćset osiem złotych zero groszy");
sprawdz("słownie 1,22", amountToWordsPL(1.22), "jeden złotych dwadzieścia dwa groszy");

/* ── 11. Pusta faktura nie wywraca liczenia ── */
sprawdz("pusta faktura", sumyFaktury([], "netto"), { netto: 0, vat: 0, brutto: 0 });

if (bledy > 0) {
  console.error(`\n${bledy} błędów w liczeniu faktur.`);
  process.exit(1);
}
console.log("Liczenie faktur: wszystkie przypadki przechodzą (stawki, zaokrąglenia, tryb brutto, faktura mieszana).");
