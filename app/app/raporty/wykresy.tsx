"use client";

import { formatPln } from "@/lib/format";

/**
 * Wykresy raportu. Rysowane ręcznie, bez biblioteki: to kilkanaście liczb,
 * a każda dołożona zależność to kilkadziesiąt kB, które agent pobiera
 * na telefonie w terenie.
 */

/** Przychód miesiąc po miesiącu. Oś zaczyna się od zera, żeby słupki nie kłamały. */
export function PrzychodMiesiacami({
  dane,
}: {
  dane: { miesiac: string; pln: number; szt: number }[];
}) {
  const max = Math.max(...dane.map((d) => d.pln), 1);
  const suma = dane.reduce((s, d) => s + d.pln, 0);
  const srednia = suma / (dane.length || 1);
  const ostatnie3 = dane.slice(-3).reduce((s, d) => s + d.pln, 0) / 3;
  const poprzednie3 = dane.slice(-6, -3).reduce((s, d) => s + d.pln, 0) / 3;
  const zmiana = poprzednie3 > 0 ? Math.round(((ostatnie3 - poprzednie3) / poprzednie3) * 100) : null;

  if (!dane.some((d) => d.pln > 0)) {
    return <p className="py-8 text-center text-sm text-slate-500">Brak zamkniętych transakcji w ostatnim roku.</p>;
  }

  return (
    <div>
      <div className="flex items-end gap-2">
        {dane.map((d) => {
          const h = d.pln > 0 ? Math.max(4, Math.round((d.pln / max) * 100)) : 0;
          return (
            <div key={d.miesiac} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-semibold tabular-nums text-slate-600">
                {d.pln > 0 ? Math.round(d.pln / 1000) + "k" : ""}
              </span>
              <div className="flex h-44 w-full items-end">
                {h > 0 ? (
                  <div
                    title={`${d.miesiac}: ${formatPln(d.pln)} z ${d.szt} transakcji`}
                    className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400"
                    style={{ height: `${h}%` }}
                  />
                ) : (
                  <div className="h-1 w-full rounded-full bg-slate-200" />
                )}
              </div>
              <span className="truncate text-[10px] text-slate-400">{d.miesiac}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500">
        <span>
          Razem 12 miesięcy: <strong className="text-slate-800">{formatPln(suma)}</strong>
        </span>
        <span>
          Średnio: <strong className="text-slate-800">{formatPln(Math.round(srednia))}</strong> na miesiąc
        </span>
        {zmiana != null && (
          <span>
            Ostatni kwartał do poprzedniego:{" "}
            <strong className={zmiana >= 0 ? "text-emerald-600" : "text-red-600"}>
              {zmiana >= 0 ? "+" : ""}
              {zmiana}%
            </strong>
          </span>
        )}
      </div>
    </div>
  );
}

/** Udział źródeł w prowizji jako jeden poziomy pasek. */
export function UdzialZrodel({
  zrodla,
}: {
  zrodla: { zrodlo: string; label: string; prowizja: number }[];
}) {
  const zPieniedzmi = zrodla.filter((z) => z.prowizja > 0);
  const suma = zPieniedzmi.reduce((s, z) => s + z.prowizja, 0);
  if (!suma) return null;

  const KOLORY = [
    "bg-emerald-500", "bg-sky-500", "bg-violet-500", "bg-amber-500",
    "bg-rose-500", "bg-teal-500", "bg-indigo-500", "bg-slate-400",
  ];

  return (
    <div className="mb-5">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {zPieniedzmi.map((z, i) => (
          <div
            key={z.zrodlo}
            title={`${z.label}: ${formatPln(z.prowizja)}`}
            className={KOLORY[i % KOLORY.length]}
            style={{ width: `${(z.prowizja / suma) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {zPieniedzmi.map((z, i) => (
          <span key={z.zrodlo} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-sm ${KOLORY[i % KOLORY.length]}`} />
            {z.label}
            <span className="font-semibold tabular-nums text-slate-900">
              {Math.round((z.prowizja / suma) * 100)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
