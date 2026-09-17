/**
 * Parametry list (klienci, oferty, działania) trzymane w adresie strony.
 *
 * Dzięki temu filtr, sortowanie i strona są w linku: można go zapisać w
 * zakładkach, wysłać koledze i wrócić przyciskiem „wstecz". Serwer czyta te
 * same parametry, więc filtrowanie dzieje się w bazie, a nie w przeglądarce.
 */

export type ListQuery = {
  q: string;
  page: number;
  per: number;
  sort: string;
  /** "" = wszyscy, "ja" = zalogowany, inaczej identyfikator agenta. */
  agent: string;
  status: string;
  type: string;
  /** Pole, po którym filtrujemy zakres dat. */
  dateField: string;
  from: string;
  to: string;
  city: string;
  min: string;
  max: string;
  extra: string;
};

export const PER_PAGE_OPTIONS = [25, 50, 100] as const;

const KEYS: Record<keyof ListQuery, string> = {
  q: "szukaj",
  page: "str",
  per: "na",
  sort: "sort",
  agent: "agent",
  status: "status",
  type: "typ",
  dateField: "pole",
  from: "od",
  to: "do",
  city: "miasto",
  min: "min",
  max: "max",
  extra: "x",
};

type Raw = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v ?? "").trim();
}

export function parseListQuery(sp: Raw, defaults: Partial<ListQuery> = {}): ListQuery {
  const num = (v: string, fallback: number, min: number, max: number) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  const per = num(one(sp[KEYS.per]), defaults.per ?? 25, 10, 100);
  return {
    q: one(sp[KEYS.q]).slice(0, 120),
    page: num(one(sp[KEYS.page]), 1, 1, 10_000),
    per: PER_PAGE_OPTIONS.includes(per as (typeof PER_PAGE_OPTIONS)[number]) ? per : 25,
    sort: one(sp[KEYS.sort]) || defaults.sort || "",
    agent: one(sp[KEYS.agent]) || defaults.agent || "",
    status: one(sp[KEYS.status]),
    type: one(sp[KEYS.type]),
    dateField: one(sp[KEYS.dateField]) || defaults.dateField || "",
    from: one(sp[KEYS.from]),
    to: one(sp[KEYS.to]),
    city: one(sp[KEYS.city]).slice(0, 80),
    min: one(sp[KEYS.min]).replace(/[^\d]/g, "").slice(0, 12),
    max: one(sp[KEYS.max]).replace(/[^\d]/g, "").slice(0, 12),
    extra: one(sp[KEYS.extra]).slice(0, 40),
  };
}

/** Adres listy z nowymi parametrami. Puste wartości znikają z linku. */
export function listHref(base: string, query: ListQuery, patch: Partial<ListQuery> = {}): string {
  const next = { ...query, ...patch };
  // Każda zmiana filtra wraca na pierwszą stronę, żeby nie wylądować na pustej.
  if (patch.page === undefined) next.page = 1;
  const params = new URLSearchParams();
  (Object.keys(KEYS) as (keyof ListQuery)[]).forEach((k) => {
    const v = next[k];
    if (v === "" || v === undefined || v === null) return;
    if (k === "page" && v === 1) return;
    if (k === "per" && v === 25) return;
    params.set(KEYS[k], String(v));
  });
  const s = params.toString();
  return s ? `${base}?${s}` : base;
}

/** Ile filtrów (poza wyszukiwarką) jest włączonych - do plakietki „Filtry (3)". */
export function activeFilterCount(q: ListQuery, defaults: Partial<ListQuery> = {}): number {
  const fields: (keyof ListQuery)[] = ["agent", "status", "type", "from", "to", "city", "min", "max", "extra"];
  return fields.filter((f) => q[f] !== "" && q[f] !== (defaults[f] ?? "")).length;
}

export function isEmptyQuery(q: ListQuery): boolean {
  return q.q === "" && activeFilterCount(q) === 0;
}
