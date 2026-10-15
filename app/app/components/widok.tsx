import Link from "next/link";

/**
 * Przełącznik Lista / Tablica nad listą klientów i ofert. Widok siedzi
 * w adresie (`?widok=tablica`), więc link do tablicy da się wysłać komuś
 * z zespołu, a przycisk wstecz wraca do listy.
 */
export function PrzelacznikWidoku({
  sciezka,
  aktywny,
  agent,
}: {
  sciezka: string;
  aktywny: "lista" | "tablica";
  /** Filtr opiekuna przenoszony między widokami. */
  agent?: string;
}) {
  const z = (widok: string) => {
    const p = new URLSearchParams();
    if (widok === "tablica") p.set("widok", "tablica");
    if (agent) p.set("agent", agent);
    const q = p.toString();
    return q ? `${sciezka}?${q}` : sciezka;
  };
  const przycisk = (widok: "lista" | "tablica", etykieta: string, d: string) => (
    <Link
      href={z(widok)}
      aria-current={aktywny === widok ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        aktywny === widok ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      </svg>
      {etykieta}
    </Link>
  );
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
      {przycisk("lista", "Lista", "M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z")}
      {przycisk("tablica", "Tablica", "M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z")}
    </div>
  );
}

/** Kwota w skrócie do nagłówków kolumn: „650 tys. zł", „1,2 mln zł". */
export function kwotaKrotko(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 zł";
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} mln zł`;
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString("pl-PL")} tys. zł`;
  return `${Math.round(n)} zł`;
}
