import { Card } from "../components/ui";

export type WeekDay = {
  label: string; // Pn, Wt...
  dayNum: string;
  calls: number;
  target: number;
  isToday: boolean;
  isFuture: boolean;
};

export type WeekSummary = { label: string; total: number; target: number };

export function WeekView({
  days,
  weekTotal,
  weekTarget,
  history,
}: {
  days: WeekDay[];
  weekTotal: number;
  weekTarget: number;
  history: WeekSummary[];
}) {
  const weekPct = weekTarget > 0 ? Math.min(100, Math.round((weekTotal / weekTarget) * 100)) : 0;
  const maxHistory = Math.max(1, ...history.map((h) => Math.max(h.total, h.target)));

  return (
    <div className="space-y-6">
      {/* Ten tydzień */}
      <Card>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Ten tydzień</h2>
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{weekTotal}</span> / {weekTarget} telefonów ·{" "}
            <span className={weekPct >= 100 ? "text-emerald-600" : "text-amber-600"}>{weekPct}%</span>
          </p>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => {
            const met = d.target > 0 && d.calls >= d.target;
            const pct = d.target > 0 ? Math.min(100, (d.calls / d.target) * 100) : 0;
            return (
              <div key={i} className="text-center">
                <p className={`mb-1 text-xs ${d.isToday ? "font-bold text-emerald-600" : "text-slate-500"}`}>
                  {d.label}
                </p>
                <div
                  className={`relative flex h-20 flex-col justify-end overflow-hidden rounded-lg border ${
                    d.isToday ? "border-emerald-500/50" : "border-slate-300"
                  } ${d.isFuture ? "bg-slate-50" : "bg-white"}`}
                >
                  {!d.isFuture && (
                    <div
                      className={`w-full transition-all ${met ? "bg-emerald-400/60" : "bg-amber-400/40"}`}
                      style={{ height: `${pct}%` }}
                    />
                  )}
                  <div className="absolute inset-x-0 top-1 text-center">
                    <span className={`text-sm font-bold ${d.isFuture ? "text-slate-400" : met ? "text-emerald-700" : "text-slate-900"}`}>
                      {d.isFuture ? "·" : d.calls}
                    </span>
                  </div>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-400">{d.dayNum}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">
          Słupki = telefony vs cel dnia. Zielony = cel wykonany.
        </p>
      </Card>

      {/* Historia tygodni */}
      {history.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Ostatnie tygodnie</h2>
          <div className="space-y-3">
            {history.map((w, i) => {
              const pct = w.target > 0 ? Math.min(100, Math.round((w.total / w.target) * 100)) : 0;
              const barW = (w.total / maxHistory) * 100;
              const met = w.target > 0 && w.total >= w.target;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-16 flex-shrink-0 text-xs text-slate-500">{w.label}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-lg bg-slate-100">
                    <div
                      className={`flex h-full items-center justify-end rounded-lg px-2 ${met ? "bg-emerald-500/50" : "bg-amber-500/40"}`}
                      style={{ width: `${Math.max(8, barW)}%` }}
                    >
                      <span className="text-xs font-medium text-slate-900">{w.total}</span>
                    </div>
                  </div>
                  <span className={`w-10 flex-shrink-0 text-right text-xs ${met ? "text-emerald-600" : "text-slate-500"}`}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
