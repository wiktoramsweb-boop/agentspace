import { requireUser } from "@/lib/auth";
import { getDeals, getCommissionStats } from "@/lib/data-platform";
import { DEAL_STATUSES } from "@/lib/types";
import { PageHeader, StatCard, Card, EmptyState } from "../components/ui";
import { formatPln, formatDateShort } from "@/lib/format";
import { NewDealButton, DealActions } from "./deal-controls";

export default async function ProwizjePage() {
  const user = await requireUser();
  const [deals, stats] = await Promise.all([
    getDeals(user.id),
    getCommissionStats(user.id),
  ]);

  const goal = user.monthly_goal_pln ?? 0;
  const progress = goal > 0 ? Math.min(100, Math.round((stats.monthClosed / goal) * 100)) : 0;

  return (
    <>
      <PageHeader
        title="Prowizje"
        subtitle="Śledź transakcje i postęp do celu miesięcznego."
        action={<NewDealButton />}
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
          label="Zamknięte w tym mc"
          value={formatPln(stats.monthClosed)}
          sub={`${stats.dealsClosedThisMonth} transakcji`}
          accent
        />
        <StatCard
          label="W toku (pipeline)"
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
        />
      ) : (
        <Card className="!p-0">
          <div className="divide-y divide-zinc-900">
            {deals.map((d) => {
              const status = DEAL_STATUSES.find((s) => s.value === d.status);
              return (
                <div key={d.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{d.title}</p>
                    <p className="text-sm text-zinc-500">
                      {formatPln(d.commission_pln)}
                      {d.status === "zamkniety" && d.closed_at
                        ? ` · zamknięta ${formatDateShort(d.closed_at)}`
                        : d.expected_close
                          ? ` · plan: ${formatDateShort(d.expected_close)}`
                          : ""}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3">
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
        </Card>
      )}
    </>
  );
}
