// Test: rozliczenia najmu i konfiguracja biur. `npm run test:najem`
import { KONFIG_OGOLNY, KONFIG_SPECTRA, konfiguracja, krokiLokalu, miesiaceOkresu, najemWMiesiacu, rozliczMiesiac, sumuj, type Najem } from "./najem-model.ts";

let bledy = 0;
const sprawdz = (n: string, w: unknown, o: unknown) => {
  if (JSON.stringify(w) === JSON.stringify(o)) console.log(`  ok  ${n}`);
  else {
    bledy++;
    console.log(`  BŁĄD ${n}: ${JSON.stringify(w)} zamiast ${JSON.stringify(o)}`);
  }
};
const najem: Najem = { id: "1", forma: "okazjonalny", od: "2026-03-15", do_dnia: "2027-03-14", czynsz: 3000, parking: 0, oplaty: 900, kaucja: 3000, aktywny: true };
const A = { model: "A", prowizjaPct: 13, parkingWPodstawie: false };
// Przykład z planu wdrożenia Spectry: 3 900 zł wpłaty, 390 zł prowizji, 3 510 zł dla właściciela.
const r = rozliczMiesiac("2026-05", najem, { miesiac: "2026-05", czynsz: 3000, oplaty: 900, koszty: 0 }, A);
sprawdz("przykład z planu: prowizja", r.prowizja, 390);
sprawdz("przykład z planu: do przekazania", r.doPrzekazania, 3510);
sprawdz("brak zaległości", r.zaleglosc, 0);
const b = rozliczMiesiac("2026-05", najem, { miesiac: "2026-05", czynsz: 3000, oplaty: 900, koszty: 200 }, { ...A, model: "B" });
sprawdz("model B: nic do przekazania", b.doPrzekazania, 0);
sprawdz("model B: właściciel płaci prowizję i koszty", b.doZaplatyPrzezWlasciciela, 590);
const brak = rozliczMiesiac("2026-05", najem, null, A);
sprawdz("brak wpłaty to zaległość bez prowizji", [brak.zaleglosc, brak.prowizja], [3900, 0]);
const pusty = rozliczMiesiac("2026-05", null, null, A);
sprawdz("pustostan bez prowizji i zaległości", [pusty.wynajety, pusty.prowizja, pusty.zaleglosc], [false, 0, 0]);
const parking = { ...najem, parking: 300 };
sprawdz("parking poza podstawą", rozliczMiesiac("2026-05", parking, { miesiac: "2026-05", czynsz: 3300, oplaty: 900, koszty: 0 }, A).prowizja, 390);
sprawdz("parking w podstawie", rozliczMiesiac("2026-05", parking, { miesiac: "2026-05", czynsz: 3300, oplaty: 900, koszty: 0 }, { ...A, parkingWPodstawie: true }).prowizja, 429);
sprawdz("częściowa wpłata daje część prowizji", rozliczMiesiac("2026-05", najem, { miesiac: "2026-05", czynsz: 1500, oplaty: 0, koszty: 0 }, A).prowizja, 195);
sprawdz("nadpłata nie zawyża prowizji", rozliczMiesiac("2026-05", najem, { miesiac: "2026-05", czynsz: 6000, oplaty: 0, koszty: 0 }, A).prowizja, 390);
sprawdz("najem w miesiącu", [najemWMiesiacu(najem, "2026-02"), najemWMiesiacu(najem, "2026-03"), najemWMiesiacu(najem, "2027-03"), najemWMiesiacu(najem, "2027-04")], [false, true, true, false]);
sprawdz("kwartał 2", miesiaceOkresu("kwartal", 2026, 2), ["2026-04", "2026-05", "2026-06"]);
sprawdz("półrocze 2", miesiaceOkresu("polrocze", 2026, 2)[0], "2026-07");
sprawdz("rok ma 12 miesięcy", miesiaceOkresu("rok", 2026, 1).length, 12);
sprawdz("suma", sumuj([r, r]).prowizja, 780);
sprawdz("suma dla właściciela", sumuj([r, brak]).dlaWlasciciela, 3510);
sprawdz("Spectra: warunki z umowy", [KONFIG_SPECTRA.prowizjaPct, KONFIG_SPECTRA.oplataStartowa, KONFIG_SPECTRA.przegladyRok], [13, 800, 2]);
sprawdz("inne biuro nie dostaje warunków Spectry", konfiguracja("inne").prowizjaPct, KONFIG_OGOLNY.prowizjaPct);
sprawdz("zapis biura wygrywa", konfiguracja("fe78fb77-98e3-4e3e-831b-067c2fc4cc9e", { prowizjaPct: 12 }).prowizjaPct, 12);
sprawdz("kroki notariusza tylko przy okazjonalnym", [krokiLokalu("formalnosci", "zwykly", KONFIG_OGOLNY).some((k) => k.id === "notariusz"), krokiLokalu("formalnosci", "okazjonalny", KONFIG_OGOLNY).some((k) => k.id === "notariusz")], [false, true]);
sprawdz("wyłączona usługa znika z kroków", krokiLokalu("przygotowanie", null, { ...KONFIG_OGOLNY, uslugi: [] }).map((k) => k.id), ["czynsz"]);
const prad = { miesiac: "2026-05", rodzaj: "prad", kwota: 240, okres_mies: 2, najemca_placi: true, biuro_oplaca: false };
const zPradem = rozliczMiesiac("2026-05", najem, { miesiac: "2026-05", czynsz: 3000, oplaty: 1140, koszty: 0 }, A, [prad]);
sprawdz("rachunek za prąd zwiększa należność", [zPradem.oplatyNalezne, zPradem.zaleglosc], [1140, 0]);
sprawdz("prąd nie wchodzi do prowizji", zPradem.prowizja, 390);
sprawdz("rachunek z innego miesiąca się nie liczy", rozliczMiesiac("2026-06", najem, null, A, [prad]).oplatyNalezne, 900);
const zaplacone = rozliczMiesiac("2026-05", najem, { miesiac: "2026-05", czynsz: 3000, oplaty: 900, koszty: 0 }, A, [{ ...prad, najemca_placi: false, biuro_oplaca: true }]);
sprawdz("rachunek opłacony przez biuro zmniejsza wypłatę", zaplacone.doPrzekazania, 3270);
console.log(bledy ? `\n${bledy} błędów` : "\nWszystko OK");
process.exit(bledy ? 1 : 0);
