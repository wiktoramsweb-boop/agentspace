import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManagerOrOwner } from "@/lib/auth";
import { getAgentDetail } from "@/lib/data";
import { PageHeader, StatCard, Card, ScoreBadge, scoreColor } from "../../components/ui";
import { formatPln } from "@/lib/format";
import { formatDate } from "@/lib/blog";
import { ROLE_LABELS, FUNNEL_STAGES } from "@/lib/types";
import { computeFunnel } from "@/lib/funnel";
import { buildMonthCalendar } from "@/lib/goal-calendar";
import { MonthCalendarView } from "../../cele/month-calendar";
import { removeAgent } from "../actions";

const STAGE_SHORT: Record<string, string> = Object.fromEntries(
  FUNNEL_STAGES.map((s) => [s.key, s.short]),
);
const STAGE_KEYS = ["cold_calls", "meetings", "listings", "buyers", "sales"] as const;

type Props = { params: Promise<{ agentId: string }> };

export default async function AgentDetailPage({ params }: Props) {
  const user = await requireManagerOrOwner();
  const { agentId } = await params;
  const isOwner = user.role === "owner";

  const detail = await getAgentDetail(agentId, user.agency_id!);
  if (!detail) notFound();

  const {
    profile,
    categoryAverages,
    sessions,
    avgScore,
    sessionCount,
    totalSessions,
    completedSessions,
    monthCommission,
    funnel,
    hasGoal,
    goal,
    todayLog,
    monthLogs,
    dailyCallTarget,
  } = detail;

  // Menedżer widzi tylko swoich przypisanych agentów.
  if (!isOwner && profile.manager_id !== user.id) notFound();

  const targets = goal ? computeFunnel(goal) : null;
  const todayVals: Record<string, number> = {
    cold_calls: todayLog?.cold_calls ?? 0,
    meetings: todayLog?.meetings ?? 0,
    listings: todayLog?.listings ?? 0,
    buyers: todayLog?.buyers ?? 0,
    sales: todayLog?.sales ?? 0,
  };
  const monthDone = new Map(funnel.map((s) => [s.key, s]));
  const calendar = buildMonthCalendar(monthLogs, dailyCallTarget);

  return (
    <>
      <Link href="/app/zespol" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-emerald-400">
        ← Zespół
      </Link>

      <PageHeader
        title={profile.full_name ?? profile.email ?? "Agent"}
        subtitle={`${ROLE_LABELS[profile.role]}${
          profile.phone ? ` · tel. ${profile.phone}` : ""
        }${profile.email ? ` · ${profile.email}` : ""}`}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Średni wynik AI" value={avgScore != null ? `${avgScore}/10` : "—"} sub={`${sessionCount} ocen`} accent />
        <StatCard label="Sesje AI Coach" value={`${completedSessions}/${totalSessions}`} sub="ukończone / rozpoczęte" />
        <StatCard
          label="Dziś telefony"
          value={todayVals.cold_calls}
          sub={dailyCallTarget > 0 ? `cel ${dailyCallTarget}/dzień` : "brak celu"}
        />
        {isOwner ? (
          <StatCard label="Prowizja w tym mc" value={formatPln(monthCommission)} />
        ) : (
          <StatCard label="Cel roczny" value={goal ? formatPln(goal.annual_income_pln) : "—"} />
        )}
      </div>

      {/* Cele i wykonanie: dziś + ten miesiąc */}
      <Card className="mb-8">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
          Cele i wykonanie
        </h2>

        <p className="mb-2 text-xs font-medium text-zinc-400">Dziś</p>
        <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {STAGE_KEYS.map((key) => {
            const daily = targets ? targets.byStage[key].daily : 0;
            return (
              <div key={key} className="rounded-xl bg-zinc-900/60 px-3 py-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">{STAGE_SHORT[key]}</p>
                <p className="mt-0.5 font-mono text-lg font-semibold text-white">
                  {todayVals[key]}
                  {daily > 0 && <span className="text-sm text-zinc-500">/{daily}</span>}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mb-2 text-xs font-medium text-zinc-400">Ten miesiąc</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {STAGE_KEYS.map((key) => {
            const s = monthDone.get(key);
            return (
              <div key={key} className="rounded-xl bg-zinc-900/60 px-3 py-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">{STAGE_SHORT[key]}</p>
                <p className="mt-0.5 font-mono text-lg font-semibold text-white">
                  {s?.done ?? 0}
                  {hasGoal && (s?.target ?? 0) > 0 && <span className="text-sm text-zinc-500">/{s!.target}</span>}
                </p>
              </div>
            );
          })}
        </div>

        {!hasGoal && (
          <p className="mt-3 text-xs text-zinc-600">
            Agent nie ustawił jeszcze celu w zakładce „Cele" — pokazujemy same wykonania.
          </p>
        )}
      </Card>

      {/* Kalendarz miesiąca — które dni z celem telefonów */}
      <div className="mb-8">
        <MonthCalendarView calendar={calendar} hasTarget={dailyCallTarget > 0} title="Aktywność dzień po dniu" />
      </div>

      {categoryAverages.length > 0 && (
        <Card className="mb-8">
          <h2 className="mb-5 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Obszary AI Coach
          </h2>
          <div className="space-y-4">
            {categoryAverages.map((c) => (
              <div key={c.key} className="flex items-center gap-4">
                <span className="w-40 flex-shrink-0 text-sm text-zinc-300">{c.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${c.avg >= 8 ? "bg-emerald-400" : c.avg >= 6 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${c.avg * 10}%` }}
                  />
                </div>
                <span className={`w-10 text-right font-mono text-sm font-semibold ${scoreColor(c.avg)}`}>
                  {c.avg}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-lg font-semibold text-white">Wszystkie sesje AI Coach</h2>
        <span className="text-sm text-zinc-500">
          {completedSessions} ukończonych z {totalSessions} rozpoczętych
        </span>
      </div>
      {sessions.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-zinc-500">Ten agent nie ma jeszcze żadnej sesji.</p>
        </Card>
      ) : (
        <Card className="!p-0">
          <div className="divide-y divide-zinc-900">
            {sessions.map((s) => {
              const sc = s.score;
              const inProgress = s.status !== "completed";
              const subs = sc
                ? [
                    { label: "Otwarcie", v: sc.opening },
                    { label: "Kwalifikacja", v: sc.qualification },
                    { label: "Obiekcje", v: sc.objection_handling },
                    { label: "Zamknięcie", v: sc.closing },
                  ]
                : [];
              return (
                <Link
                  key={s.id}
                  href={`/app/sesja/${s.id}`}
                  className="block px-6 py-4 transition hover:bg-zinc-900/40"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {s.scenario_title ?? "Sesja"}
                        {inProgress && (
                          <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                            niedokończona
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500">{formatDate(s.started_at)}</p>
                    </div>
                    <ScoreBadge score={sc?.overall ?? null} />
                  </div>
                  {subs.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {subs.map((sub) => (
                        <div key={sub.label} className="rounded-lg bg-zinc-900/60 px-2.5 py-1.5">
                          <p className="text-[10px] uppercase tracking-wide text-zinc-500">{sub.label}</p>
                          <p className={`font-mono text-sm font-semibold ${scoreColor(sub.v ?? null)}`}>
                            {sub.v != null ? `${sub.v}/10` : "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {isOwner && profile.role !== "owner" && (
        <form action={removeAgent.bind(null, profile.id)} className="mt-8">
          <button className="text-xs text-zinc-600 transition hover:text-red-400">
            Usuń z zespołu
          </button>
        </form>
      )}
    </>
  );
}
