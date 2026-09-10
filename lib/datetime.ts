/**
 * Czas w aplikacji.
 *
 * Problem, który to rozwiązuje: serwer na Vercelu działa w UTC, a agenci
 * pracują w Polsce. Bez jawnej strefy godzina wpisana w formularzu zapisywała
 * się przesunięta o 1-2 h, a ta sama pozycja pokazywała inną godzinę na liście
 * (renderowanej w przeglądarce) niż na karcie (renderowanej na serwerze).
 *
 * Wszystko liczymy więc jawnie w strefie Europe/Warsaw - produkt jest polski,
 * więc to jedyna strefa, która ma znaczenie.
 */

export const APP_TZ = "Europe/Warsaw";

/** Przesunięcie strefy (w minutach) dla danej chwili. Uwzględnia czas letni. */
function tzOffsetMinutes(instant: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(instant).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour) === 24 ? 0 : Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return (asUtc - instant.getTime()) / 60000;
}

/**
 * Zamienia datę i godzinę z formularza (czas polski) na znacznik UTC do bazy.
 * Zwraca null, gdy brak daty.
 */
export function warsawToIso(dateStr: string, timeStr = "09:00"): string | null {
  const d = dateStr?.trim();
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return null;
  const [hh, mm] = (timeStr?.trim() || "09:00").split(":").map(Number);

  // Traktujemy wpisane wartości jak "ścianę zegara" w Polsce i szukamy
  // odpowiadającej chwili UTC. Drugie przejście domyka przypadki na granicy
  // zmiany czasu, gdzie przesunięcie liczone wstępnie mogło być inne.
  const naive = Date.UTC(y, m - 1, day, hh || 0, mm || 0);
  let utc = naive - tzOffsetMinutes(new Date(naive)) * 60000;
  utc = naive - tzOffsetMinutes(new Date(utc)) * 60000;
  const out = new Date(utc);
  return Number.isNaN(out.getTime()) ? null : out.toISOString();
}

/** Data i godzina po polsku, zawsze w polskiej strefie (serwer i przeglądarka tak samo). */
export function formatDateTimePL(iso: string | null | undefined, fallback = "-"): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: APP_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Sama data po polsku, w polskiej strefie. */
export function formatDatePL(iso: string | null | undefined, fallback = "-"): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: APP_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** Sama godzina po polsku, w polskiej strefie. */
export function formatTimePL(iso: string | null | undefined, fallback = "-"): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: APP_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Dzisiejsza data (YYYY-MM-DD) w polskiej strefie - do porównań „na dziś". */
export function todayPL(): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Data (YYYY-MM-DD) danej chwili w polskiej strefie. Potrzebne do porównań
 * typu „czy to dzisiaj" - surowy ISO z bazy jest w UTC, więc po 22:00 wskazywałby
 * już następny dzień.
 */
export function dateKeyPL(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}

/** Bieżąca godzina (HH:MM) w polskiej strefie - domyślna wartość pól formularza. */
export function nowTimePL(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/**
 * „Dzisiaj" jako obiekt Date ustawiony na północ UTC polskiej daty.
 * Dzięki temu arytmetyka dni (tydzień, miesiąc) i klucze YYYY-MM-DD zgadzają
 * się z tym, co zapisujemy w dziennikach celów.
 */
export function todayDatePL(): Date {
  const [y, m, d] = todayPL().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
