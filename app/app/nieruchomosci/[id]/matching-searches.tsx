import Link from "next/link";
import type { Property } from "@/lib/types";
import type { SearchRich } from "@/lib/data-searches";
import { findSearchesForProperty, type MatchTolerance } from "@/lib/matching";

const zl = (n: number | null) =>
  n == null ? "-" : new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(n) + " zł";

function range(min: number | null, max: number | null, money = false): string {
  const f = (n: number) => (money ? zl(n) : String(n));
  if (min == null && max == null) return "dowolnie";
  if (min == null) return `do ${f(max!)}`;
  if (max == null) return `od ${f(min)}`;
  return `${f(min)} - ${f(max)}`;
}

/**
 * Kto z bazy szuka takiej nieruchomości. To odwrotność dopasowań z modułu
 * Poszukiwania: agent wystawia ofertę i od razu widzi, do kogo zadzwonić.
 */
export function MatchingSearches({
  property,
  searches,
  tolerance,
}: {
  property: Property;
  searches: SearchRich[];
  tolerance?: MatchTolerance;
}) {
  const results = findSearchesForProperty(property, searches, tolerance);

  if (results.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
        Nikt w bazie nie szuka takiej nieruchomości. Dodaj poszukiwania klientów, a system sam
        podpowie komu ją pokazać.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {results.map(({ search: s, match }) => (
        <Link
          key={s.id}
          href={`/app/poszukiwania/${s.id}`}
          className={`block rounded-xl border p-3 transition hover:shadow-sm ${
            match.fits ? "border-emerald-200 hover:border-emerald-400" : "border-amber-200 hover:border-amber-400"
          }`}
        >
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-slate-900">
              {s.clientName ?? s.title ?? "Poszukiwanie"}
            </p>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                match.fits ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {match.fits ? "Pasuje" : "Prawie"} · {match.score}%
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {range(s.price_min, s.price_max, true)} · {range(s.area_min, s.area_max)} m² ·{" "}
            {range(s.rooms_min, s.rooms_max)} pok.
          </p>
          {s.clientPhone && (
            <p className="mt-1 text-xs font-medium text-blue-600">{s.clientPhone}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
