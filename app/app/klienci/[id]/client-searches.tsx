import Link from "next/link";
import type { SearchRich } from "@/lib/data-searches";
import { SEARCH_STATUSES } from "@/lib/types";

const STATUS_MAP = Object.fromEntries(SEARCH_STATUSES.map((s) => [s.value, s]));
const zl = (n: number) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(n) + " zł";

function range(min: number | null, max: number | null, money = false): string {
  const f = (n: number) => (money ? zl(n) : String(n));
  if (min == null && max == null) return "dowolnie";
  if (min == null) return `do ${f(max!)}`;
  if (max == null) return `od ${f(min)}`;
  return `${f(min)} - ${f(max)}`;
}

/** Poszukiwania klienta z liczbą pasujących ofert. */
export function ClientSearches({
  searches,
  matchCounts,
}: {
  searches: SearchRich[];
  matchCounts: Record<string, number>;
}) {
  if (searches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
        Brak poszukiwań. Zapisz czego szuka klient - system sam podpowie pasujące oferty.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {searches.map((s) => {
        const sm = STATUS_MAP[s.status] ?? STATUS_MAP.aktualne;
        const count = matchCounts[s.id] ?? 0;
        return (
          <Link
            key={s.id}
            href={`/app/poszukiwania/${s.id}`}
            className="block rounded-xl border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium text-slate-900">
                {s.title ?? (s.deal_kind === "wynajem" ? "Szuka do wynajęcia" : "Szuka do kupna")}
              </p>
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${sm.color}`}>{sm.label}</span>
              {count > 0 && (
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {count} ofert pasuje
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {range(s.price_min, s.price_max, true)} · {range(s.area_min, s.area_max)} m² ·{" "}
              {range(s.rooms_min, s.rooms_max)} pok.
              {s.locations.length > 0 && ` · ${s.locations.join(", ")}`}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
