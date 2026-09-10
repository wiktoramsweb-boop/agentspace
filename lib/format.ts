import { APP_TZ, dateKeyPL } from "./datetime";

export function formatPln(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: APP_TZ,
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/** „1 dzień", „3 dni", „7 dni" - polska odmiana, żeby nie wychodziło „1 dni". */
export function plDays(n: number): string {
  return `${n} ${n === 1 ? "dzień" : "dni"}`;
}

/**
 * Liczymy w dniach kalendarzowych polskiej strefy, nie w dobach.
 * Inaczej kontakt z wczoraj o 23:00 pokazywał się rano jako „dzisiaj".
 */
export function daysAgo(iso: string | null): string {
  if (!iso) return "brak kontaktu";
  const then = dateKeyPL(iso);
  const now = dateKeyPL(new Date().toISOString());
  if (!then) return "brak kontaktu";
  const diff = Math.round(
    (Date.parse(`${now}T00:00:00Z`) - Date.parse(`${then}T00:00:00Z`)) / 86400000,
  );
  if (diff <= 0) return "dzisiaj";
  if (diff === 1) return "wczoraj";
  return `${diff} dni temu`;
}
