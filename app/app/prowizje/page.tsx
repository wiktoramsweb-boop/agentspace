import { requireUser } from "@/lib/auth";
import { getDeals, getCommissionStats, getPropertiesLite } from "@/lib/data-platform";
import { DEAL_STATUSES } from "@/lib/types";
import { PageHeader, StatCard, Card, EmptyState } from "../components/ui";
import { formatPln, formatDateShort } from "@/lib/format";
import { NewDealButton, DealActions } from "./deal-controls";

export default async function ProwizjePage() {
  const user = await requireUser();
  const [deals, stats, properties] = await Promise.all([
    getDeals(user.id),
    getCommissionStats(user.id),
    getPropertiesLite(user.id),
  ]);

  const goal = user.monthly_goal_pln ?? 0;
  const progress = goal > 0 ? Math.min(100, Math.round((stats.monthClosed / goal) * 100)) : 0;

  return (
    <>
      <PageHeader
        title="Prowizje"
        subtitle="Śledź transakcje i postęp do celu miesięcznego."
        action={<NewDealButton properties={properties} defaultSplit={user.default_split_pct ?? 50} />}
      />

      {/* Cel miesięczny */}
      {goal > 0 && (
        <Card className="mb-6 !border-emerald-500/30 !bg-gradient-to-br !from-emerald-500/10 !to-zinc-900/40">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Cel miesięczny
              </p>
              <p className="text-3xl font-semibold text-white">
                {formatPln(stats.monthClosed)}{" "}
                <span className="text-lg text-zinc-500">/ {formatPln(goal)}</span>
              </p>
            </div>
            <p className="text-2xl font-semibold text-emerald-400">{progress}%</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </Card>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Twój zarobek (mc)"
          value={formatPln(stats.monthClosed)}
          sub={`${stats.dealsClosedThisMonth} transakcji · biuro ${formatPln(stats.officeMonthClosed)}`}
          accent
        />
        <StatCard
          label="Twój pipeline (w toku)"
          value={formatPln(stats.pipelineValue)}
          sub={`${stats.dealsInProgress} transakcji`}
        />
        <StatCard
          label="Cel miesięczny"
          value={goal > 0 ? formatPln(goal) : "—"}
          sub={goal > 0 ? undefined : "ustaw w ustawieniach"}
        />
      </div>

      {deals.length === 0 ? (
        <EmptyState
          title="Brak transakcji"
          body="Dodaj pierwszą transakcję, żeby śledzić prowizje i postęp do celu miesięcznego."
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {deals.map((d) => {
            const status = DEAL_STATUSES.find((s) => s.value === d.status);
            const accent =
              d.status === "zamkniety"
                ? "bg-emerald-400"
                : d.status === "przepadl"
                  ? "bg-red-400"
                  : "bg-amber-400";
            return (
              <div
                key={d.id}
                className="flex items-center gap-4 overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-800/40 p-4 pl-0 transition hover:border-zinc-600 hover:bg-zinc-800/70"
              >
                <span className={`h-12 w-1.5 flex-shrink-0 rounded-r-full ${accent}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{d.title}</p>
                  <p className="text-sm text-zinc-400">
                    <span className="font-medium text-emerald-400">{formatPln(d.agent_earnings_pln)}</span>
                    {` dla Ciebie · biuro ${formatPln(d.commission_pln)}`}
                    {d.agent_split_pct ? ` (${d.agent_split_pct}%)` : ""}
                    {d.status === "zamkniety" && d.closed_at
                      ? ` · zamknięta ${formatDateShort(d.closed_at)}`
                      : d.expected_close
                        ? ` · plan: ${formatDateShort(d.expected_close)}`
                        : ""}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3 pr-4">
                  {status && (
                    <span className={`hidden rounded-md px-2 py-1 text-xs font-medium sm:inline ${status.color}`}>
                      {status.label}
                    </span>
                  )}
                  <DealActions dealId={d.id} status={d.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
