/**
 * Sprawdzenie silnika wyceny na danych syntetycznych.
 *
 * To jest logika, na podstawie której agent podaje klientowi kwotę, więc
 * ma testy - w odróżnieniu od reszty kodu, której nie testujemy.
 *
 * Uruchomienie (bez instalowania czegokolwiek):
 *   node --experimental-strip-types lib/wycena/sprawdz-model.ts
 */

import { estimate } from "./model.ts";
import type { Anchor } from "./model.ts";
import type { Comparable, Subject } from "./model.ts";

const NOW = new Date("2026-09-29T12:00:00Z");

function monthsAgoIso(months: number): string {
  const d = new Date(NOW);
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

/** Podgórze, Kraków. Punkt odniesienia dla odległości. */
const BASE = { lat: 50.04, lng: 19.95 };

type CompSpec = {
  id: string;
  area: number;
  price: number;
  source?: Comparable["source"];
  dLat?: number;
  monthsAgo?: number;
  condition?: string;
};

function comp(spec: CompSpec): Comparable {
  return {
    id: spec.id,
    source: spec.source ?? "wlasna",
    label: spec.id,
    address: null,
    city: "Kraków",
    lat: BASE.lat + (spec.dLat ?? 0),
    lng: BASE.lng,
    propertyType: "mieszkanie",
    areaM2: spec.area,
    rooms: 3,
    floor: 2,
    floorsTotal: 4,
    yearBuilt: 2010,
    condition: spec.condition ?? "do_wprowadzenia",
    market: "wtorny",
    pricePln: spec.price,
    transactedAt: monthsAgoIso(spec.monthsAgo ?? 2),
  };
}

const SUBJECT: Subject = {
  propertyType: "mieszkanie",
  city: "Kraków",
  lat: BASE.lat,
  lng: BASE.lng,
  areaM2: 54,
  rooms: 3,
  floor: 2,
  floorsTotal: 4,
  yearBuilt: 2010,
  condition: "do_wprowadzenia",
  market: "wtorny",
};

let failures = 0;

function check(name: string, actual: number, expected: number, tolerance: number): void {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (!ok) failures++;
  const status = ok ? "OK  " : "BLAD";
  console.log(`${status} ${name}: ${Math.round(actual)} (oczekiwane ${expected} ±${tolerance})`);
}

/** Jednorodny rynek po 16 000 zł za metr. */
const JEDNORODNY = Array.from({ length: 8 }, (_, i) => {
  const area = 50 + i * 2;
  return comp({ id: `c${i}`, area, price: Math.round(area * 16000), dLat: i * 0.001, monthsAgo: i });
});

console.log("── Silnik analizy cenowej ──\n");

// 1. Na jednorodnym rynku wynik ma trafić w cenę rynkową.
check("rynek jednorodny", estimate(SUBJECT, JEDNORODNY, { now: NOW }).pricePerM2, 16000, 100);

// 2. Nieruchomość do remontu musi wyjść taniej od porównań gotowych do wejścia.
check(
  "korekta za stan do remontu",
  estimate({ ...SUBJECT, condition: "do_remontu" }, JEDNORODNY, { now: NOW }).pricePerM2,
  14080,
  100,
);

// 3. Jedna transakcja za podwójną cenę nie może ruszyć wyniku.
const zOdstajaca = [...JEDNORODNY, comp({ id: "odstajaca", area: 55, price: 55 * 32000, monthsAgo: 1 })];
check("odstajaca transakcja odrzucona", estimate(SUBJECT, zOdstajaca, { now: NOW }).pricePerM2, 16000, 100);

// 4. Za mało porównań to brak wyniku, a nie zmyślona liczba.
const zaMalo = estimate(SUBJECT, JEDNORODNY.slice(0, 2), { now: NOW });
const okBrak = !zaMalo.ok && Boolean(zaMalo.reason);
if (!okBrak) failures++;
console.log(`${okBrak ? "OK  " : "BLAD"} brak wyniku przy dwóch porównaniach: ${zaMalo.reason ?? "brak powodu"}`);

// 5. Ceny ofertowe ważą mniej niż ceny transakcyjne.
const mieszane = [
  ...JEDNORODNY.slice(0, 4),
  ...[0, 1, 2, 3].map((i) =>
    comp({ id: `oferta${i}`, area: 52, price: 52 * 19000, source: "oferta", dLat: i * 0.001 }),
  ),
];
check("ceny ofertowe ważone słabiej", estimate(SUBJECT, mieszane, { now: NOW }).pricePerM2, 16000, 400);

// 6. Transakcje sprzed dwóch lat i z drugiego końca miasta wypadają z puli.
const zeSmieciami = [
  ...JEDNORODNY.slice(0, 3),
  comp({ id: "stara", area: 54, price: 54 * 9000, monthsAgo: 30 }),
  comp({ id: "daleka", area: 54, price: 54 * 9000, dLat: 0.09 }),
];
const odfiltrowane = estimate(SUBJECT, zeSmieciami, { now: NOW });
const okFiltr = odfiltrowane.usedCount === 3;
if (!okFiltr) failures++;
console.log(`${okFiltr ? "OK  " : "BLAD"} stare i odległe odrzucone: użyto ${odfiltrowane.usedCount} z 5`);

// 7. Gdy porownania sa tylko z drugiego konca miasta, wolimy uczciwa srednia
//    miejska od porownania Starego Miasta z Nowa Huta.
const ANCHOR: Anchor = {
  pricePerM2: 18000,
  city: "Kraków",
  period: "2025",
  source: "gus",
  market: null,
  sampleSize: 4200,
};
const tylkoDalekie = [0, 1, 2, 3].map((i) =>
  comp({ id: `daleko${i}`, area: 50, price: 50 * 11000, dLat: 0.05 + i * 0.002 }),
);
const zeWskaznikiem = estimate(SUBJECT, tylkoDalekie, { anchor: ANCHOR, now: NOW });
const okWskaznik = zeWskaznikiem.method === "wskaznik" && zeWskaznikiem.pricePerM2 > 15000;
if (!okWskaznik) failures++;
console.log(
  `${okWskaznik ? "OK  " : "BLAD"} wskaźnik miejski zamiast porównań z drugiego końca miasta: ` +
    `metoda ${zeWskaznikiem.method}, ${zeWskaznikiem.pricePerM2} zł/m²`,
);

// 8. Porownania z okolicy wygrywaja ze wskaznikiem - to one sa dokladniejsze.
const zOkolicy = estimate(SUBJECT, JEDNORODNY, { anchor: ANCHOR, now: NOW });
const okPierwszenstwo = zOkolicy.method === "porownania" && Math.abs(zOkolicy.pricePerM2 - 16000) < 100;
if (!okPierwszenstwo) failures++;
console.log(
  `${okPierwszenstwo ? "OK  " : "BLAD"} porównania z okolicy mają pierwszeństwo: ` +
    `metoda ${zOkolicy.method}, ${zOkolicy.pricePerM2} zł/m²`,
);

// 9. Brak porownan i brak wskaznika to odmowa, a nie zmyslona liczba.
const nicNieMa = estimate(SUBJECT, [], { now: NOW });
const okOdmowa = !nicNieMa.ok && nicNieMa.method === "brak";
if (!okOdmowa) failures++;
console.log(`${okOdmowa ? "OK  " : "BLAD"} brak danych to odmowa: ${nicNieMa.reason ?? ""}`);

console.log(`\n${failures === 0 ? "Wszystko przechodzi." : `Niepowodzenia: ${failures}`}`);
if (failures > 0) process.exit(1);
