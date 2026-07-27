import { Card } from "../components/ui";
import type { MonthCalendar } from "@/lib/goal-calendar";

const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

/**
 * Miesięczny kalendarz wykonania celu telefonów — który dzień był „na zielono" (cel zrobiony),
 * a który nie. Czysto prezentacyjny (dane z buildMonthCalendar).
 */
export function MonthCalendarView({
  calendar,
  hasTarget,
  title = "Ostatni miesiąc",
}: {
  calendar: MonthCalendar;
  hasTarget: boolean;
  title?: string;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <span className="text-sm text-zinc-400">{calendar.monthLabel}</span>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] font-medium uppercase tracking-wide text-zinc-600">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {calendar.weeks.flat().map((d) => {
          const base = "flex aspect-square flex-col items-center justify-center rounded-lg border text-center";
          let cls: string;
          if (!d.inMonth) {
            cls = "border-transparent bg-transparent text-zinc-700";
          } else if (d.isFuture) {
            cls = "border-zinc-800/60 bg-zinc-900/30 text-zinc-700";
          } else if (d.met) {
            cls = "border-emerald-500/40 bg-emerald-500/20 text-emerald-200";
          } else if (d.partial) {
            cls = "border-amber-500/30 bg-amber-500/15 text-amber-200";
          } else {
            cls = "border-zinc-800 bg-zinc-900/40 text-zinc-500";
          }
          return (
            <div
              key={d.date}
              className={`${base} ${cls} ${d.isToday ? "ring-2 ring-emerald-400/70" : ""}`}
              title={d.inMonth ? `${d.date}: ${d.calls}${hasTarget ? `/${d.target}` : ""} telefonów` : undefined}
            >
              <span className="text-[10px] leading-none opacity-70">{d.inMonth ? d.dayNum : ""}</span>
              {d.inMonth && !d.isFuture && (
                <span className="mt-0.5 font-mono text-xs font-semibold leading-none">{d.calls}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
        <Legend cls="bg-emerald-500/20 border-emerald-500/40" label="cel wykonany" />
        <Legend cls="bg-amber-500/15 border-amber-500/30" label="częściowo" />
        <Legend cls="bg-zinc-900/40 border-zinc-800" label="brak / 0" />
        {!hasTarget && <span className="text-zinc-600">· agent bez ustawionego celu — liczby to same wykonania</span>}
      </div>
    </Card>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded border ${cls}`} />
      {label}
    </span>
  );
}
