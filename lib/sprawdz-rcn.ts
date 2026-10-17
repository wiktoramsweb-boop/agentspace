/**
 * Sprawdzenie wyceny z RCN (`npm run test:rcn`).
 *
 * Wycena trafia do klienta jako argument w rozmowie o cenie, więc pilnujemy
 * przeliczenia współrzędnych, odrzucania skrajnych cen i wag podobieństwa.
 */

import { adresRcn, doPuwg92, korektyCech, wycenRcn, type TransakcjaRcn } from "./rcn-wycena.ts";

let bledy = 0;
function sprawdz(opis: string, warunek: boolean, szczegol = "") {
  if (!warunek) {
    bledy++;
    console.error(`BŁĄD  ${opis}${szczegol ? ` (${szczegol})` : ""}`);
  }
}

// Punkt odniesienia z usługi RCN: lokal przy Krupniczej 32 w Krakowie
// ma w PL-1992 współrzędne x=244378, y=566339 (wg OpenStreetMap 50.06295 N, 19.92715 E).
const k = doPuwg92(50.06295, 19.92715);
sprawdz("przeliczenie na PL-1992 (północ)", Math.abs(k.x - 244378) < 60, k.x.toFixed(0));
sprawdz("przeliczenie na PL-1992 (wschód)", Math.abs(k.y - 566339) < 60, k.y.toFixed(0));

sprawdz("adres z formatu RCN", adresRcn("MSC:KRAKÓW;UL:KRUPNICZA;NR_PORZ:32") === "Krupnicza 32, Kraków", adresRcn("MSC:KRAKÓW;UL:KRUPNICZA;NR_PORZ:32"));
sprawdz("adres z „ulica” w nazwie", adresRcn("MSC:Warszawa;UL:ulica Ciasna;NR_PORZ:15") === "Ciasna 15, Warszawa", adresRcn("MSC:Warszawa;UL:ulica Ciasna;NR_PORZ:15"));

const DZIS = new Date("2026-10-17T12:00:00Z");
let n = 0;
const t = (z: Partial<TransakcjaRcn>): TransakcjaRcn => ({
  id: String(++n),
  transakcja: `T${n}`,
  data: "2026-06-01",
  rodzaj: "wolnyRynek",
  rynek: "rynekWtorny",
  funkcja: "mieszkalna",
  pow: 50,
  izby: 2,
  pietro: 2,
  cenaTransakcji: 750000,
  cenaLokalu: 750000,
  adres: "MSC:KRAKÓW;UL:TESTOWA;NR_PORZ:1",
  x: k.x + n * 20,
  y: k.y,
  ...z,
});
const cel = { x: k.x, y: k.y, pow: 50, izby: 2, rynek: "wtorny" as const };

const rowne = Array.from({ length: 12 }, (_, i) => t({ cenaTransakcji: 700000 + i * 10000, cenaLokalu: 700000 + i * 10000 }));
const w = wycenRcn(rowne, cel, DZIS);
sprawdz("wynik dla 12 podobnych", !!w && w.liczba === 12, String(w?.liczba));
sprawdz("mediana w środku zakresu", !!w && w.medianaM2 >= 14000 && w.medianaM2 <= 16500, String(w?.medianaM2));
sprawdz("przedział od < szacunek < do", !!w && w.od <= w.szacunek && w.szacunek <= w.do);

const zOdstajacym = [...rowne, t({ cenaTransakcji: 90000, cenaLokalu: 90000 })];
sprawdz("skrajna cena odrzucona", wycenRcn(zOdstajacym, cel, DZIS)?.liczba === 12);

const stare = [...rowne, t({ data: "2023-01-10", cenaLokalu: 300000, cenaTransakcji: 300000 })];
sprawdz("akty starsze niż 24 mc pominięte", wycenRcn(stare, cel, DZIS)?.liczba === 12);

const garaze = [...rowne, t({ funkcja: "garaz", pow: 15 })];
sprawdz("garaże pominięte", wycenRcn(garaze, cel, DZIS)?.liczba === 12);

const pakiet = [...rowne, t({ transakcja: "PAKIET", cenaLokalu: null, cenaTransakcji: 2000000 }), t({ transakcja: "PAKIET", cenaLokalu: null, cenaTransakcji: 2000000 })];
sprawdz("kilka lokali bez podziału ceny pominięte", wycenRcn(pakiet, cel, DZIS)?.liczba === 12);

sprawdz("za mało porównań daje brak wyniku", wycenRcn(rowne.slice(0, 3), cel, DZIS) === null);

// ── Korekty i dodatki ───────────────────────────────────────────────
sprawdz("bez cech brak korekt", korektyCech({ x: 0, y: 0, pow: 50 }).length === 0);
const zKorekta = wycenRcn(rowne, { ...cel, stan: "do_remontu" }, DZIS);
sprawdz("stan do remontu obniża cenę", !!w && !!zKorekta && zKorekta.szacunek < w.szacunek, `${zKorekta?.szacunek} vs ${w?.szacunek}`);
sprawdz("wysokie piętro bez windy ma korektę", korektyCech({ x: 0, y: 0, pow: 50, pietro: 5, winda: false }).some((k) => k.procent < 0));
sprawdz("warianty standardu rosną", !!w && w.warianty.every((v, i, a) => i === 0 || v.cena >= a[i - 1].cena));
sprawdz("cena wystawienia wyższa niż transakcyjna", !!w && w.cenaOfertowa > w.szacunek);
sprawdz("seria miesięczna jest", !!w && w.seria.length >= 1 && w.seria[0].liczba > 0);

// Trend: ceny rosnące w czasie dają dodatni trend roczny.
const rosnace = Array.from({ length: 96 }, (_, i) => {
  const miesiacTemu = Math.floor(i / 4);
  const d = new Date(Date.UTC(2026, 9 - miesiacTemu, 1 + (i % 4))).toISOString().slice(0, 10);
  const c = Math.round(750000 * Math.pow(0.992, miesiacTemu) * (1 + ((i % 3) - 1) * 0.02));
  return t({ data: d, cenaLokalu: c, cenaTransakcji: c });
});
const wr = wycenRcn(rosnace, cel, DZIS);
sprawdz("trend roczny dodatni przy rosnących cenach", !!wr && wr.trendRoczny > 5, String(wr?.trendRoczny));
const plaskie = Array.from({ length: 96 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 9 - Math.floor(i / 4), 1 + (i % 4))).toISOString().slice(0, 10);
  // Płaski rynek z kilkoma tanimi aktami na początku okresu.
  const c = i > 80 && i % 5 === 0 ? 400000 : 750000;
  return t({ data: d, cenaLokalu: c, cenaTransakcji: c });
});
const wp = wycenRcn(plaskie, cel, DZIS);
sprawdz("tanie pojedyncze akty nie robią trendu", !!wp && Math.abs(wp.trendRoczny) < 2, String(wp?.trendRoczny));

if (bledy) {
  console.error(`\nRCN: ${bledy} błędów.`);
  process.exit(1);
}
console.log("Wycena RCN w porządku.");
