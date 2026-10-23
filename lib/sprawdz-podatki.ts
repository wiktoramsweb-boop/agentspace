/**
 * Sprawdzenie kalkulatora podatkowego (`npm run test:podatki`).
 * Wartości porównujemy z kwotami ZUS i wyliczeniami na 2026 r.
 */
import { DEFAULT_CONSTANTS as c, computeForm, kosztAgenta, pccKupujacego, podatekOdSprzedazy, podstawaMalyZusPlus, zusMies, zusTimeline, computeSpzooPayout, pitSkala, computeVat } from "./tax.ts";

let bledy = 0;
function blisko(opis: string, wynik: number, oczekiwane: number, tolerancja = 0.02) {
  if (Math.abs(wynik - oczekiwane) > tolerancja) {
    bledy++;
    console.error(`BŁĄD  ${opis}: jest ${wynik}, powinno ${oczekiwane}`);
  }
}
function sprawdz(opis: string, warunek: boolean) {
  if (!warunek) {
    bledy++;
    console.error(`BŁĄD  ${opis}`);
  }
}

// ZUS 2026: kwoty z komunikatów (duży 1926,76 zł z chorobowym i FP, mały 456,18 zł).
blisko("duży ZUS 2026", zusMies("duzy", c).razem, 1926.76);
blisko("mały ZUS 2026", zusMies("preferencyjny", c).razem, 456.18);
blisko("duży ZUS bez chorobowego", zusMies("duzy", c, { chorobowe: false }).razem, 1926.76 - 138.47);
blisko("ulga na start", zusMies("ulga_start", c).razem, 0);
sprawdz("mały ZUS bez Funduszu Pracy", zusMies("preferencyjny", c).fp === 0);
// Mały ZUS Plus: dochód 80 000 zł → podstawa 3333,33 zł (iFirma: ~1040 zł z chorobowym)
blisko("podstawa Małego ZUS Plus", podstawaMalyZusPlus(80000, c), 3333.33);
blisko("Mały ZUS Plus 80 tys.", zusMies("maly_plus", c, { dochodPoprzedni: 80000 }).razem, 1054.66, 1);
blisko("Mały ZUS Plus nie niżej niż mały", podstawaMalyZusPlus(5000, c), 1441.8);
blisko("Mały ZUS Plus nie wyżej niż duży", podstawaMalyZusPlus(900000, c), 5652);

// PIT skala
blisko("skala do kwoty wolnej", pitSkala(30000, c), 0);
blisko("skala 100 tys.", pitSkala(100000, c), 8400);
blisko("skala 150 tys.", pitSkala(150000, c), 10800 + 9600);

// Forma: liniowy 200 tys. dochodu, duży ZUS
const zusRok = zusMies("duzy", c).razem * 12;
const fpRok = zusMies("duzy", c).fp * 12;
const lin = computeForm("liniowy", { przychod: 200000, koszty: 0, zusStage: "duzy" }, c);
const podstawaZdr = 200000 - (zusRok - fpRok);
blisko("liniowy: zdrowotna 4,9% po społecznych", lin.zdrowotna, podstawaZdr * 0.049, 0.5);
blisko("liniowy: podatek", lin.podatek, (podstawaZdr - Math.min(lin.zdrowotna, 14100)) * 0.19, 0.5);
// Skala: niski dochód → minimalna zdrowotna
const niska = computeForm("skala", { przychod: 40000, koszty: 0, zusStage: "preferencyjny" }, c);
blisko("skala: zdrowotna nie niżej niż minimalna", niska.zdrowotna, Math.max(432.54 * 12, (40000 - zusMies("preferencyjny", c).razem * 12) * 0.09), 0.5);
// Ryczałt: progi zdrowotnej
const ry = computeForm("ryczalt", { przychod: 100000, koszty: 0, zusStage: "duzy" }, c);
blisko("ryczałt: zdrowotna środkowy próg", ry.zdrowotna, 830.58 * 12);
blisko("ryczałt: podatek 15%", ry.podatek, (100000 - (zusRok - fpRok) - 0.5 * 830.58 * 12) * 0.15, 0.5);
// Wspólne rozliczenie z małżonkiem bez dochodu obniża podatek na skali
const sam = computeForm("skala", { przychod: 200000, koszty: 0, zusStage: "duzy" }, c);
const razem = computeForm("skala", { przychod: 200000, koszty: 0, zusStage: "duzy", dochodMalzonka: 0 }, c);
sprawdz("wspólne rozliczenie obniża podatek", razem.podatek < sam.podatek);

// Koszt agenta: etat za płacę minimalną 2026 → ok. 3605,85 zł netto, koszt pracodawcy 5790,27 zł
const etat = kosztAgenta("etat", 4806, c);
blisko("etat: netto płacy minimalnej", etat.nettoAgenta, 3605.85, 0.05);
blisko("etat: koszt pracodawcy", etat.kosztBiura, 5790.27, 0.05);
const mlody = kosztAgenta("etat", 4806, c, { do26: true });
sprawdz("ulga dla młodych: bez PIT", mlody.zaliczkaPit === 0 && mlody.nettoAgenta > etat.nettoAgenta);
const student = kosztAgenta("zlecenie", 3000, c, { do26: true, student: true });
sprawdz("student na zleceniu: brutto = netto", student.nettoAgenta === 3000 && student.kosztBiura === 3000);
const b2b = kosztAgenta("b2b", 10000, c, { b2bForma: "ryczalt", b2bZus: "duzy" });
sprawdz("B2B: biuro płaci fakturę", b2b.kosztBiura === 10000 && b2b.nettoAgenta < 10000);

// Sprzedaż: kupione 2021, sprzedane 2026 → podatek; 2027 → bez podatku
const s1 = podatekOdSprzedazy({ rokNabycia: 2021, rokSprzedazy: 2026, cenaSprzedazy: 800000, kosztySprzedazy: 20000, kosztNabycia: 500000, naklady: 80000, wydatkiMieszkaniowe: 0 }, c);
sprawdz("przed 5 latami jest podatek", !s1.zwolnionaPo5Latach && s1.rokBezPodatku === 2027);
blisko("PIT 19% od dochodu", s1.podatek, Math.round((780000 - 580000) * 0.19));
const s2 = podatekOdSprzedazy({ rokNabycia: 2021, rokSprzedazy: 2026, cenaSprzedazy: 800000, kosztySprzedazy: 20000, kosztNabycia: 500000, naklady: 80000, wydatkiMieszkaniowe: 390000 }, c);
blisko("ulga mieszkaniowa w połowie przychodu", s2.podatek, Math.round(200000 * 0.5 * 0.19));
const s3 = podatekOdSprzedazy({ rokNabycia: 2021, rokSprzedazy: 2027, cenaSprzedazy: 800000, kosztySprzedazy: 0, kosztNabycia: 100000, naklady: 0, wydatkiMieszkaniowe: 0 }, c);
sprawdz("po 5 latach bez podatku", s3.zwolnionaPo5Latach && s3.podatek === 0);
blisko("PCC 2% rynek wtórny", pccKupujacego(600000, "wtorny", false, c), 12000);
blisko("PCC pierwsze mieszkanie", pccKupujacego(600000, "wtorny", true, c), 0);

// Oś ZUS: założenie we wrześniu 2024 bez ulgi → mały ZUS od października 2024 do września 2026
const t = zusTimeline(new Date(2024, 8, 1), false, c, new Date(2026, 0, 1));
sprawdz("mały ZUS kończy się po 24 miesiącach", t.preferencyjnyDo.getFullYear() === 2026 && t.preferencyjnyDo.getMonth() === 9);

// Spółka: jedyny wspólnik płaci ZUS, dwóch nie
const sp1 = computeSpzooPayout(300000, 100000, true, false, c, 1);
const sp2 = computeSpzooPayout(300000, 100000, true, false, c, 2);
sprawdz("jedyny wspólnik płaci ZUS", sp1.zusJedynegoWspolnika > 0 && sp2.zusJedynegoWspolnika === 0);
const vat = computeVat([{ name: "A", przychod: 250000 }], 0, c);
sprawdz("VAT: ponad limit 240 tys.", vat.subjects[0].nadLimit && vat.nadPojemnosc === 10000);

if (bledy) {
  console.error(`\nKalkulator podatkowy: ${bledy} błędów.`);
  process.exit(1);
}
console.log("Kalkulator podatkowy w porządku.");
