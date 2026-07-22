export function formatPln(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

export function daysAgo(iso: string | null): string {
  if (!iso) return "brak kontaktu";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "dzisiaj";
  if (diff === 1) return "wczoraj";
  return `${diff} dni temu`;
}
