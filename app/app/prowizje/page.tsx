import { requireModul } from "@/lib/auth";
import { getCommissionStats } from "@/lib/data-platform";
import { daneProwizji } from "@/lib/data-prowizje";
import { StatCard } from "../components/ui";
import { formatPln } from "@/lib/format";
import { ProwizjePanel } from "./panel";

export default async function ProwizjePage() {
  const user = await requireModul("prowizje");
  const [stats, dane] = await Promise.all([getCommissionStats(user.id), daneProwizji(user.id, user.agency_id)]);

  const goal = user.monthly_goal_pln ?? 0;
  const progress = goal > 0 ? Math.min(100, Math.round((stats.monthClosed / goal) * 100)) : 0;

  const statystyki = (
    <>
      {goal > 0 && (
        <div className="hero-goal mb-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Cel w tym miesiącu</p>
              <p className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                {formatPln(stats.monthClosed)} <span className="text-base text-slate-500 sm:text-lg">/ {formatPln(goal)}</span>
              </p>
            </div>
            <p className="text-2xl font-semibold text-emerald-600">{progress}%</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {stats.monthClosed < goal && (
            <p className="mt-2 text-xs text-slate-500">
              Brakuje {formatPln(goal - stats.monthClosed)}. W toku masz {formatPln(stats.pipelineValue)}.
            </p>
          )}
        </div>
      )}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Zarobione w tym miesiącu"
          value={formatPln(stats.monthClosed)}
          sub={`${stats.dealsClosedThisMonth} zamkniętych`}
          accent
        />
        <StatCard label="W toku" value={formatPln(stats.pipelineValue)} sub={`${stats.dealsInProgress} transakcji`} />
        <StatCard label="Prognoza do końca kwartału" value={formatPln(stats.forecastQuarter)} sub="z planowaną datą" />
        <StatCard
          label="Cel miesięczny"
          value={goal > 0 ? formatPln(goal) : "-"}
          sub={goal > 0 ? undefined : "ustawisz w Ustawieniach"}
        />
      </div>
    </>
  );

  return (
    <ProwizjePanel
      transakcje={dane.transakcje}
      oferty={dane.ofertyWybor}
      klienci={dane.klienciWybor}
      podpowiedzi={dane.podpowiedzi}
      defaultSplit={user.default_split_pct ?? 50}
      statystyki={statystyki}
    />
  );
}
