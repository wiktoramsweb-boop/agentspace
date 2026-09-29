/**
 * Silnik analizy porównawczej cen.
 *
 * Świadomie NIE jest to model uczony maszynowo. Agent musi umieć obronić
 * liczbę przed klientem, który zapyta „skąd to", więc liczymy tak, jak liczy
 * rzeczoznawca: bierzemy podobne transakcje, korygujemy je o różnice i
 * pokazujemy, z czego wynik wyszedł. Model statystyczny ma sens dopiero
 * przy kilku tysiącach własnych transakcji.
 *
 * WAŻNE: to nie jest operat szacunkowy w rozumieniu ustawy o gospodarce
 * nieruchomościami. Operaty sporządzają wyłącznie rzeczoznawcy majątkowi.
 */

export type Subject = {
  propertyType: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  areaM2: number;
  rooms: number | null;
  floor: number | null;
  floorsTotal: number | null;
  yearBuilt: number | null;
  condition: string | null;
  market: string | null;
};

export type Comparable = {
  id: string;
  source: "wlasna" | "rcn" | "oferta";
  label: string;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  propertyType: string;
  areaM2: number;
  rooms: number | null;
  floor: number | null;
  floorsTotal: number | null;
  yearBuilt: number | null;
  condition: string | null;
  market: string | null;
  pricePln: number;
  transactedAt: string;
};

export type Adjustment = { label: string; pct: number };

export type ScoredComparable = {
  comp: Comparable;
  distanceM: number | null;
  monthsAgo: number;
  basePricePerM2: number;
  adjustments: Adjustment[];
  adjustedPricePerM2: number;
  weight: number;
};

export type Estimate = {
  ok: boolean;
  reason?: string;
  pricePerM2: number;
  low: number;
  mid: number;
  high: number;
  confidence: "niska" | "srednia" | "wysoka";
  comparables: ScoredComparable[];
  usedCount: number;
  droppedCount: number;
  spreadPct: number;
};

/* ── parametry modelu ───────────────────────────────────────── */

/** Ile procent dodajemy albo odejmujemy za stan wykończenia. */
const CONDITION_VALUE: Record<string, number> = {
  do_remontu: -0.12,
  w_budowie: -0.1,
  deweloperski: -0.03,
  do_odswiezenia: -0.05,
  do_wprowadzenia: 0,
};

/** Rynek pierwotny bywa droższy za metr niż porównywalny wtórny. */
const MARKET_VALUE: Record<string, number> = { pierwotny: 0.04, wtorny: 0 };

const MAX_DISTANCE_M = 2500;
const MAX_MONTHS = 18;
const MIN_COMPS = 3;
const TARGET_COMPS = 12;

/* ── pomocnicze ─────────────────────────────────────────────── */

/** Odległość po powierzchni Ziemi, w metrach. */
export function distanceMeters(
  a: { lat: number | null; lng: number | null },
  b: { lat: number | null; lng: number | null },
): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

function monthsBetween(iso: string, now = new Date()): number {
  const then = new Date(iso);
  return Math.max(0, (now.getFullYear() - then.getFullYear()) * 12 + now.getMonth() - then.getMonth());
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Mediana ważona: wartość, przy której skumulowana waga przekracza połowę.
 * Odporna na pojedynczy dziwny rekord, w odróżnieniu od średniej ważonej,
 * którą jedna transakcja za podwójną cenę potrafiła podnieść o kilka procent.
 */
function weightedMedian(items: { value: number; weight: number }[]): number {
  if (items.length === 0) return 0;
  const sorted = [...items].sort((a, b) => a.value - b.value);
  const total = sorted.reduce((sum, i) => sum + i.weight, 0);
  let running = 0;
  for (const item of sorted) {
    running += item.weight;
    if (running >= total / 2) return item.value;
  }
  return sorted[sorted.length - 1].value;
}

/** Mediana odchyleń od mediany. Miara rozrzutu nieczuła na wartości skrajne. */
function mad(values: number[], center: number): number {
  return median(values.map((v) => Math.abs(v - center)));
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

/* ── korekty ────────────────────────────────────────────────── */

/**
 * Różnice między porównaniem a wycenianą nieruchomością, wyrażone w procentach
 * ceny za metr. Dodatnia korekta oznacza: „to porównanie było gorsze, więc
 * dla naszej nieruchomości cena powinna być wyższa".
 */
function buildAdjustments(subject: Subject, comp: Comparable): Adjustment[] {
  const out: Adjustment[] = [];

  // Mniejsze mieszkania mają wyższą cenę za metr. Korygujemy łagodnie,
  // bo zależność jest wyraźna dopiero przy sporej różnicy metrażu.
  const areaRatio = comp.areaM2 / subject.areaM2;
  if (areaRatio > 1.15 || areaRatio < 0.87) {
    const pct = Math.max(-0.08, Math.min(0.08, (areaRatio - 1) * 0.22));
    out.push({ label: `Różnica metrażu (${Math.round(comp.areaM2)} m² wobec ${Math.round(subject.areaM2)} m²)`, pct });
  }

  const cond = (c: string | null) => (c && c in CONDITION_VALUE ? CONDITION_VALUE[c] : 0);
  const condDiff = cond(subject.condition) - cond(comp.condition);
  if (Math.abs(condDiff) > 0.001) {
    out.push({ label: "Stan wykończenia", pct: condDiff });
  }

  const mkt = (m: string | null) => (m && m in MARKET_VALUE ? MARKET_VALUE[m] : 0);
  const mktDiff = mkt(subject.market) - mkt(comp.market);
  if (Math.abs(mktDiff) > 0.001) {
    out.push({ label: "Rynek pierwotny wobec wtórnego", pct: mktDiff });
  }

  // Parter i ostatnie piętro bez windy sprzedają się gorzej.
  const floorPenalty = (floor: number | null, total: number | null) => {
    if (floor == null) return 0;
    if (floor === 0) return -0.03;
    if (total != null && floor === total && total > 3) return -0.02;
    return 0;
  };
  const floorDiff = floorPenalty(subject.floor, subject.floorsTotal) - floorPenalty(comp.floor, comp.floorsTotal);
  if (Math.abs(floorDiff) > 0.001) {
    out.push({ label: "Piętro", pct: floorDiff });
  }

  // Wiek budynku. Zamiast wymyślać krzywą, bierzemy prosty gradient
  // i ucinamy go, żeby stara kamienica nie wyszła warta połowy bloku.
  if (subject.yearBuilt && comp.yearBuilt) {
    const diff = subject.yearBuilt - comp.yearBuilt;
    const pct = Math.max(-0.06, Math.min(0.06, (diff / 10) * 0.012));
    if (Math.abs(pct) > 0.005) {
      out.push({ label: `Rok budowy (${subject.yearBuilt} wobec ${comp.yearBuilt})`, pct });
    }
  }

  return out;
}

/** Im bliżej i im świeższa transakcja, tym większa waga w wyniku. */
function weightFor(distanceM: number | null, monthsAgo: number, source: Comparable["source"]): number {
  const distW = distanceM == null ? 0.45 : Math.max(0.15, 1 - distanceM / MAX_DISTANCE_M);
  const timeW = Math.max(0.2, 1 - monthsAgo / MAX_MONTHS);
  // Cena ofertowa to nie cena transakcyjna, więc waży mniej.
  const sourceW = source === "oferta" ? 0.5 : 1;
  return distW * timeW * sourceW;
}

/* ── wycena ─────────────────────────────────────────────────── */

export function estimate(subject: Subject, pool: Comparable[], now = new Date()): Estimate {
  const empty: Estimate = {
    ok: false,
    pricePerM2: 0,
    low: 0,
    mid: 0,
    high: 0,
    confidence: "niska",
    comparables: [],
    usedCount: 0,
    droppedCount: 0,
    spreadPct: 0,
  };

  if (!subject.areaM2 || subject.areaM2 <= 0) {
    return { ...empty, reason: "Podaj powierzchnię nieruchomości." };
  }

  const scored: ScoredComparable[] = [];

  for (const comp of pool) {
    if (comp.propertyType !== subject.propertyType) continue;
    if (!comp.areaM2 || comp.areaM2 <= 0 || !comp.pricePln || comp.pricePln <= 0) continue;

    const monthsAgo = monthsBetween(comp.transactedAt, now);
    if (monthsAgo > MAX_MONTHS) continue;

    const distanceM = distanceMeters(subject, comp);
    if (distanceM != null && distanceM > MAX_DISTANCE_M) continue;
    // Bez współrzędnych zostaje tylko miasto. Lepsze to niż nic, ale
    // z mniejszą wagą (patrz weightFor).
    if (distanceM == null && (!subject.city || comp.city !== subject.city)) continue;

    // Skrajnie inny metraż to już inny produkt, nie porównanie.
    const ratio = comp.areaM2 / subject.areaM2;
    if (ratio > 1.8 || ratio < 0.55) continue;

    const basePricePerM2 = comp.pricePln / comp.areaM2;
    const adjustments = buildAdjustments(subject, comp);
    const totalPct = adjustments.reduce((sum, a) => sum + a.pct, 0);

    scored.push({
      comp,
      distanceM,
      monthsAgo,
      basePricePerM2,
      adjustments,
      adjustedPricePerM2: basePricePerM2 * (1 + totalPct),
      weight: weightFor(distanceM, monthsAgo, comp.source),
    });
  }

  if (scored.length < MIN_COMPS) {
    return {
      ...empty,
      reason:
        scored.length === 0
          ? "Brak porównywalnych transakcji w bazie. Dodaj transakcje albo zaimportuj dane rynkowe."
          : `Za mało porównań (${scored.length}). Potrzebujemy co najmniej ${MIN_COMPS}, żeby wynik miał sens.`,
      comparables: scored,
      usedCount: scored.length,
    };
  }

  // Najbliższe i najświeższe na wierzch, resztę odcinamy.
  scored.sort((a, b) => b.weight - a.weight);
  const candidates = scored.slice(0, TARGET_COMPS);

  // Odcinamy wartości odstające, zanim cokolwiek policzymy. Jedno mieszkanie
  // sprzedane w rodzinie za pół ceny albo penthouse w tym samym bloku potrafi
  // przesunąć wynik o kilka procent, a dla klienta to dziesiątki tysięcy.
  const rawValues = candidates.map((c) => c.adjustedPricePerM2);
  const center = median(rawValues);
  const deviation = mad(rawValues, center);
  // Gdy rozrzut jest zerowy (rynek jednorodny), MAD nie zadziała jako próg,
  // więc bierzemy stały margines wokół mediany.
  const limit = deviation > 0 ? 3 * deviation : center * 0.08;
  const kept = candidates.filter((c) => Math.abs(c.adjustedPricePerM2 - center) <= limit);

  // Gdyby odrzut zjadł za dużo, wracamy do pełnego zestawu.
  const used = kept.length >= MIN_COMPS ? kept : candidates;
  const dropped = candidates.length - used.length;

  const values = used.map((s) => s.adjustedPricePerM2);
  const pricePerM2 = weightedMedian(
    used.map((s) => ({ value: s.adjustedPricePerM2, weight: s.weight })),
  );

  const p25 = percentile(values, 0.25);
  const p75 = percentile(values, 0.75);
  const spreadPct = pricePerM2 > 0 ? (p75 - p25) / pricePerM2 : 0;

  const confidence: Estimate["confidence"] =
    used.length >= 8 && spreadPct < 0.18 ? "wysoka" : used.length >= 5 && spreadPct < 0.3 ? "srednia" : "niska";

  const round = (n: number) => Math.round(n / 1000) * 1000;

  return {
    ok: true,
    pricePerM2: Math.round(pricePerM2),
    mid: round(pricePerM2 * subject.areaM2),
    low: round(Math.min(p25, pricePerM2 * 0.94) * subject.areaM2),
    high: round(Math.max(p75, pricePerM2 * 1.06) * subject.areaM2),
    confidence,
    comparables: used,
    usedCount: used.length,
    droppedCount: dropped,
    spreadPct,
  };
}
