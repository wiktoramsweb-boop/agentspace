import type { Property, Search } from "./types";

export type MatchReason = { label: string; ok: boolean; detail?: string };

export type Match = {
  property: Property;
  score: number;         // 0-100, im wyżej tym lepiej pasuje
  fits: boolean;         // spełnia wszystkie twarde warunki
  nearMiss: boolean;     // ociera się o warunki (np. cena wyższa o kilka procent)
  reasons: MatchReason[];
};

/** Ile procent poza zakres jeszcze traktujemy jako „prawie pasuje". */
const TOLERANCE = 0.1;

function inRange(
  value: number | null | undefined,
  min: number | null,
  max: number | null,
): "ok" | "near" | "no" | "unknown" {
  if (value == null) return "unknown";
  if (min != null && value < min) {
    return value >= min * (1 - TOLERANCE) ? "near" : "no";
  }
  if (max != null && value > max) {
    return value <= max * (1 + TOLERANCE) ? "near" : "no";
  }
  return "ok";
}

function fmtPln(n: number): string {
  return new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(n) + " zł";
}

/**
 * Ocenia, czy oferta pasuje do poszukiwania.
 *
 * Świadomie zwracamy też „prawie pasuje": w praktyce klient, który szuka do
 * 700 tys., obejrzy mieszkanie za 730 tys. Odrzucanie takich ofert po cichu
 * jest gorsze niż pokazanie ich z adnotacją.
 */
export function matchPropertyToSearch(property: Property, search: Search): Match {
  const reasons: MatchReason[] = [];
  let hardFail = false;
  let nearCount = 0;
  let points = 0;
  let maxPoints = 0;

  // Rodzaj transakcji - warunek twardy, bez wyjątków.
  const kindOk = property.deal_kind === search.deal_kind;
  reasons.push({
    label: "Rodzaj transakcji",
    ok: kindOk,
    detail: property.deal_kind === "wynajem" ? "wynajem" : "sprzedaż",
  });
  if (!kindOk) hardFail = true;

  // Typ nieruchomości.
  if (search.property_types.length > 0) {
    maxPoints += 20;
    const typeOk = search.property_types.includes(property.property_type);
    reasons.push({ label: "Typ", ok: typeOk, detail: property.property_type });
    if (typeOk) points += 20;
    else hardFail = true;
  }

  // Cena.
  if (search.price_min != null || search.price_max != null) {
    maxPoints += 30;
    const r = inRange(property.price_pln, search.price_min, search.price_max);
    const detail = property.price_pln != null ? fmtPln(property.price_pln) : "brak ceny";
    reasons.push({ label: "Cena", ok: r === "ok", detail });
    if (r === "ok") points += 30;
    else if (r === "near") {
      points += 15;
      nearCount++;
    } else if (r === "no") hardFail = true;
  }

  // Powierzchnia.
  if (search.area_min != null || search.area_max != null) {
    maxPoints += 25;
    const r = inRange(property.area_m2, search.area_min, search.area_max);
    const detail = property.area_m2 != null ? `${property.area_m2} m2` : "brak metrażu";
    reasons.push({ label: "Powierzchnia", ok: r === "ok", detail });
    if (r === "ok") points += 25;
    else if (r === "near") {
      points += 12;
      nearCount++;
    } else if (r === "no") hardFail = true;
  }

  // Liczba pokoi - tu tolerancja procentowa nie ma sensu, liczby są małe.
  if (search.rooms_min != null || search.rooms_max != null) {
    maxPoints += 15;
    const v = property.rooms;
    let ok = true;
    if (v == null) ok = false;
    else {
      if (search.rooms_min != null && v < search.rooms_min) ok = false;
      if (search.rooms_max != null && v > search.rooms_max) ok = false;
    }
    reasons.push({ label: "Pokoje", ok, detail: v != null ? String(v) : "brak danych" });
    if (ok) points += 15;
    else if (v != null) hardFail = true;
  }

  // Piętro.
  if (search.floor_min != null || search.floor_max != null) {
    maxPoints += 5;
    const v = property.floor;
    let ok = true;
    if (v != null) {
      if (search.floor_min != null && v < search.floor_min) ok = false;
      if (search.floor_max != null && v > search.floor_max) ok = false;
    }
    reasons.push({ label: "Piętro", ok, detail: v != null ? String(v) : "brak danych" });
    if (ok) points += 5;
    else hardFail = true;
  }

  // Lokalizacja - szukamy fragmentu w mieście lub adresie.
  if (search.locations.length > 0) {
    maxPoints += 20;
    const hay = `${property.city ?? ""} ${property.address ?? ""}`.toLowerCase();
    const hit = search.locations.find((l) => hay.includes(l.toLowerCase().trim()));
    reasons.push({
      label: "Lokalizacja",
      ok: !!hit,
      detail: property.city ?? property.address ?? "brak",
    });
    if (hit) points += 20;
    else hardFail = true;
  }

  // Wymagane udogodnienia.
  const required = Object.entries(search.must_have ?? {}).filter(([, v]) => v);
  if (required.length > 0) {
    maxPoints += 10;
    const have = property.features ?? {};
    const missing = required.filter(([k]) => !have[k]).map(([k]) => k);
    reasons.push({
      label: "Udogodnienia",
      ok: missing.length === 0,
      detail: missing.length ? `brakuje: ${missing.join(", ")}` : "wszystkie",
    });
    if (missing.length === 0) points += 10;
    else nearCount++;   // brak udogodnienia to nie powód, żeby ukryć ofertę
  }

  // Rok budowy (minimalny).
  if (search.year_built_min != null) {
    maxPoints += 5;
    const v = property.year_built;
    const ok = v == null || v >= search.year_built_min;
    reasons.push({ label: "Rok budowy", ok, detail: v != null ? String(v) : "brak danych" });
    if (ok) points += 5;
    else nearCount++;
  }

  const score = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : kindOk ? 100 : 0;

  return {
    property,
    score,
    fits: !hardFail && nearCount === 0,
    nearMiss: !hardFail && nearCount > 0,
    reasons,
  };
}

/**
 * Dopasowania dla jednego poszukiwania. Zwraca posortowane: najpierw pełne
 * trafienia, potem „prawie", a w środku po trafności malejąco.
 */
export function findMatches(search: Search, properties: Property[]): Match[] {
  return properties
    .filter((p) => p.status === "aktywna")
    .map((p) => matchPropertyToSearch(p, search))
    .filter((m) => m.fits || m.nearMiss)
    .sort((a, b) => {
      if (a.fits !== b.fits) return a.fits ? -1 : 1;
      return b.score - a.score;
    });
}

/** Odwrotnie: które poszukiwania pasują do danej oferty (karta nieruchomości). */
export function findSearchesForProperty<T extends Search>(
  property: Property,
  searches: T[],
): { search: T; match: Match }[] {
  return searches
    .filter((s) => s.status === "aktualne")
    .map((s) => ({ search: s, match: matchPropertyToSearch(property, s) }))
    .filter(({ match }) => match.fits || match.nearMiss)
    .sort((a, b) => {
      if (a.match.fits !== b.match.fits) return a.match.fits ? -1 : 1;
      return b.match.score - a.match.score;
    });
}
