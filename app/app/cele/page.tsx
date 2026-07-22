import { requireUser } from "@/lib/auth";
import { getGoal, getTodayLog, getRecentLogs, getYearClosedCommission } from "@/lib/data-platform";
import { computeFunnel } from "@/lib/funnel";
import { FUNNEL_STAGES } from "@/lib/types";
import { PageHeader, Card } from "../components/ui";
import { formatPln } from "@/lib/format";
import { GoalSetup } from "./goal-setup";
import { DailyTracker } from "./daily-tracker";
import { WeekView, type WeekDay, type WeekSummary } from "./week-view";

const DAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Poniedziałek tygodnia zawierającego datę d. */
function mondayOf(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0 = poniedziałek
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function CelePage() {
  const user = await requireUser();
  const goal = await getGoal(user.id);

  // Brak celu — pokaż setup
  if (!goal) {
    return (
      <>
        <PageHeader
          title="Twoje cele"
          subtitle="Ustaw cel, a rozbijemy go na konkretne działania każdego dnia."
        />
        <Card className="max-w-2xl">
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-semibold text-white">Zacznij od celu finansowego</h2>
            <p className="text-sm text-zinc-400">
              Powiedz ile chcesz zarobić w rok. Policzymy ile cold calli, spotkań i umów potrzebujesz —
              dziennie, tygodniowo, miesięcznie.
            </p>
          </div>
          <GoalSetup goal={null} />
        </Card>
      </>
    );
  }

  const [todayLog, recentLogs, yearCommission] = await Promise.all([
    getTodayLog(user.id),
    getRecentLogs(user.id, 56),
    getYearClosedCommission(user.id),
  ]);

  // Mapa data → cold_calls
  const callsByDate = new Map<string, number>();
  for (const l of recentLogs) callsByDate.set(l.log_date, l.cold_calls);

  const funnel = computeFunnel(goal);
  const dailyTargets = {
    cold_calls: funnel.byStage.cold_calls.daily,
    meetings: funnel.byStage.meetings.daily,
    listings: funnel.byStage.listings.daily,
    buyers: funnel.byStage.buyers.daily,
    sales: funnel.byStage.sales.daily,
  };
  const valuePerCall = goal.annual_income_pln / Math.max(1, funnel.annual.calls);
  const yearProgress = Math.min(100, Math.round((yearCommission / Math.max(1, goal.annual_income_pln)) * 100));

  // Passa: ile z ostatnich dni miało wykonany cel cold calli
  const daysHitCallGoal = recentLogs.filter((l) => l.cold_calls >= dailyTargets.cold_calls).length;

  // Bieżący tydzień (Pn-Nd)
  const todayStr = ymd(new Date());
  const monday = mondayOf(new Date());
  const weekDays: WeekDay[] = DAY_LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const ds = ymd(d);
    return {
      label,
      dayNum: String(d.getDate()),
      calls: callsByDate.get(ds) ?? 0,
      target: dailyTargets.cold_calls,
      isToday: ds === todayStr,
      isFuture: ds > todayStr,
    };
  });
  const weekTotal = weekDays.filter((d) => !d.isFuture).reduce((a, d) => a + d.calls, 0);
  const weekTarget = funnel.byStage.cold_calls.weekly;

  // Historia ostatnich 6 tygodni
  const history: WeekSummary[] = [];
  for (let w = 1; w <= 6; w++) {
    const wkMonday = new Date(monday);
    wkMonday.setDate(monday.getDate() - w * 7);
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(wkMonday);
      d.setDate(wkMonday.getDate() + i);
      total += callsByDate.get(ymd(d)) ?? 0;
    }
    const wkEnd = new Date(wkMonday);
    wkEnd.setDate(wkMonday.getDate() + 6);
    history.push({
      label: `${wkMonday.getDate()}.${wkMonday.getMonth() + 1}`,
      total,
      target: weekTarget,
    });
  }

  const PERIODS = [
    { key: "yearly" as const, label: "Rok" },
    { key: "monthly" as const, label: "Miesiąc" },
    { key: "weekly" as const, label: "Tydzień" },
    { key: "daily" as const, label: "Dzień" },
    { key: "hourly" as const, label: "Godzina" },
  ];

  return (
    <>
      <PageHeader
        title="Twoje cele"
        subtitle="Cold call → spotkanie → umowa → kupujący → sprzedaż. Tak powstaje prowizja."
      />

      {/* Roczny cel + postęp */}
      <Card className="mb-6 !border-emerald-500/30 !bg-gradient-to-br !from-emerald-500/10 !to-zinc-800/40">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Roczny cel</p>
            <p className="text-3xl font-semibold text-white">
              {formatPln(yearCommission)}{" "}
              <span className="text-lg text-zinc-500">/ {formatPln(goal.annual_income_pln)}</span>
            </p>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{yearProgress}%</p>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${yearProgress}%` }} />
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          Aby to osiągnąć potrzebujesz ~<strong className="text-white">{funnel.annual.sales}</strong> sprzedaży,{" "}
          <strong className="text-white">{funnel.annual.listings}</strong> umów,{" "}
          <strong className="text-white">{funnel.annual.calls}</strong> cold calli w rok.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Dzienny tracker */}
        <Card>
          <h2 className="mb-1 text-lg font-semibold text-white">Dziś</h2>
          <p className="mb-5 text-sm text-zinc-400">
            Odhacz co zrobiłeś. Passa: <span className="text-emerald-400">{daysHitCallGoal} dni</span> z celem telefonów (ost. 30 dni).
          </p>
          <DailyTracker log={todayLog} dailyTargets={dailyTargets} valuePerCall={valuePerCall} />
        </Card>

        {/* Lejek */}
        <div>
          <Card className="mb-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Twój lejek</h2>
            <div className="space-y-2">
              {FUNNEL_STAGES.map((stage, i) => {
                const s = funnel.byStage[stage.key];
                const width = 100 - i * 15;
                return (
                  <div key={stage.key} className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-between rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 px-3 py-2.5"
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-sm font-medium text-white">{stage.short}</span>
                      <span className="font-mono text-sm text-emerald-300">{s.daily}/dzień</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Rozbicie okresów */}
          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-400">
              Cold calle w liczbach
            </h2>
            <div className="grid grid-cols-5 gap-2 text-center">
              {PERIODS.map((p) => (
                <div key={p.key} className="rounded-lg bg-zinc-800/50 p-2">
                  <p className="text-[10px] uppercase text-zinc-500">{p.label}</p>
                  <p className="font-mono text-base font-semibold text-white">
                    {funnel.byStage.cold_calls[p.key]}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Plan tygodnia + historia */}
      <div className="mt-6">
        <WeekView days={weekDays} weekTotal={weekTotal} weekTarget={weekTarget} history={history} />
      </div>

      {/* Edycja celu */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-zinc-400 hover:text-white">
          Zmień cel lub współczynniki
        </summary>
        <Card className="mt-4 max-w-2xl">
          <GoalSetup goal={goal} />
        </Card>
      </details>
    </>
  );
}
