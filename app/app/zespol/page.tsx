import Link from "next/link";
import { requireManagerOrOwner } from "@/lib/auth";
import {
  getTeamRanking,
  getAgencyStats,
  getPendingInvitations,
  getAgencyCategoryAverages,
  getTeamFunnelProgress,
  getAgencyMembers,
  getTeamInsights,
  type FunnelStageProgress,
  type AgentTrend,
} from "@/lib/data";
import { getAgencyCommissionByAgent } from "@/lib/data-platform";
import { PageHeader, StatCard, Card, scoreColor } from "../components/ui";
import { formatPln } from "@/lib/format";
import { ROLE_LABELS, FUNNEL_STAGES, type UserRole } from "@/lib/types";
import { InviteForm, type ManagerOption } from "./invite-form";
import { cancelInvitation } from "./actions";
import { ReportButton } from "./report-button";
import { CopyLink } from "./copy-link";
import { TeamRoles, type TeamMember } from "./team-roles";
import { ManagerTeams } from "./manager-teams";
import { APP_URL } from "@/lib/supabase/config";

// Krótkie etykiety etapów lejka (klucz DB → skrót).
const STAGE_SHORT: Record<string, string> = Object.fromEntries(
  FUNNEL_STAGES.map((s) => [s.key, s.short]),
);

function FunnelChips({ stages, hasGoal }: { stages: FunnelStageProgress[]; hasGoal: boolean }) {
  if (stages.length === 0) return null;
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
      {stages.map((s) => (
        <div key={s.key} className="rounded-lg bg-zinc-900/60 px-2.5 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">{STAGE_SHORT[s.key]}</p>
          <p className="font-mono text-sm font-semibold text-zinc-200">
            {s.done}
            {hasGoal && s.target > 0 && <span className="text-zinc-500">/{s.target}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

function TrendArrow({ trend }: { trend?: AgentTrend }) {
  if (!trend || trend.scoreTrend == null) return null;
  if (trend.scoreTrend === "up") return <span title="wynik rośnie" className="text-sm text-emerald-400">↑</span>;
  if (trend.scoreTrend === "down") return <span title="wynik spada" className="text-sm text-red-400">↓</span>;
  return <span title="wynik stabilny" className="text-sm text-zinc-500">→</span>;
}

export default async function ZespolPage() {
  const user = await requireManagerOrOwner();
  const agencyId = user.agency_id!;
  const isOwner = user.role === "owner";

  // Zakres: CEO widzi całą agencję; menedżer tylko swoich agentów.
  const ranking = await getTeamRanking(agencyId, isOwner ? undefined : { managerId: user.id });
  const funnelByAgent = await getTeamFunnelProgress(ranking.map((a) => a.id));
  const insights = await getTeamInsights(
    ranking.map((a) => ({ id: a.id, name: a.full_name ?? a.email ?? "Agent" })),
  );

  // Dane tylko dla CEO.
  const [stats, invitations, categories, commissions, members] = isOwner
    ? await Promise.all([
        getAgencyStats(agencyId),
        getPendingInvitations(agencyId),
        getAgencyCategoryAverages(agencyId),
        getAgencyCommissionByAgent(agencyId),
        getAgencyMembers(agencyId),
      ])
    : [null, [], [], {} as Record<string, number>, []];

  // Lista menedżerów/CEO (do przypisań) + członkowie (do zarządzania rolami) — tylko CEO.
  const managerOptions: ManagerOption[] = members
    .filter((m) => m.role === "manager" || m.role === "owner")
    .map((m) => ({ id: m.id, label: `${m.full_name ?? m.email ?? "—"} (${ROLE_LABELS[m.role]})` }));
  const teamMembers: TeamMember[] = members.map((m) => ({
    id: m.id,
    label: m.full_name ?? m.email ?? "—",
    email: m.email,
    role: m.role,
    manager_id: m.manager_id,
    weekly_ai_limit: m.weekly_ai_limit,
  }));

  // Statystyki nagłówka — dla menedżera liczone z jego zakresu.
  const scopedAvg = (() => {
    const vals = ranking.map((a) => a.avgScore).filter((n): n is number => n != null);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  })();
  const scopedSessionsWeek = ranking.reduce((a, r) => a + r.sessionsThisWeek, 0);

  const strongest = categories[0];
  const weakest = categories[categories.length - 1];

  return (
    <>
      <PageHeader
        title="Zespół"
        subtitle={
          isOwner
            ? `${user.agency?.name ?? "Twoje biuro"} — dane, nie przeczucia.`
            : "Twoi agenci — cele i wyniki AI."
        }
        action={isOwner ? <ReportButton /> : undefined}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Agenci" value={isOwner ? stats!.agentCount : ranking.length} accent />
        <StatCard
          label="Średni wynik AI"
          value={
            isOwner
              ? stats!.avgTeamScore != null
                ? `${stats!.avgTeamScore}/10`
                : "—"
              : scopedAvg != null
                ? `${scopedAvg}/10`
                : "—"
          }
        />
        <StatCard label="Sesje w tym tyg." value={isOwner ? stats!.sessionsThisWeek : scopedSessionsWeek} />
        {isOwner && (
          <StatCard
            label="Prowizje zespołu (mc)"
            value={formatPln(Object.values(commissions).reduce((a, b) => a + b, 0))}
          />
        )}
      </div>

      {/* Alerty proaktywne — kto wymaga uwagi */}
      {insights.alerts.length > 0 ? (
        <Card className="mb-8 !border-amber-500/20 !bg-amber-500/[0.04]">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-amber-400">
            ⚠️ Wymaga uwagi
          </h2>
          <div className="space-y-2">
            {insights.alerts.map((a, i) => (
              <Link
                key={i}
                href={`/app/zespol/${a.agentId}`}
                className="flex items-center justify-between gap-3 rounded-lg bg-zinc-900/50 px-3 py-2 text-sm transition hover:bg-zinc-900"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium text-white">{a.agentName}</span>
                  <span className="text-zinc-400"> — {a.message}</span>
                </span>
                <span
                  className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    a.severity === "warn" ? "bg-amber-500/20 text-amber-300" : "bg-zinc-700/60 text-zinc-300"
                  }`}
                >
                  {a.severity === "warn" ? "pilne" : "info"}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      ) : (
        ranking.length > 0 && (
          <Card className="mb-8 !border-emerald-500/20 !bg-emerald-500/[0.04]">
            <p className="text-sm text-emerald-300">✅ Wszystko gra — brak sygnałów wymagających uwagi.</p>
          </Card>
        )
      )}

      {/* Aktywność zespołu — cold calle w 4 tygodniach */}
      {insights.weeklyActivity.some((w) => w.total > 0) && (
        <Card className="mb-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Aktywność zespołu — telefony (4 tygodnie)
          </h2>
          <div className="flex items-end gap-3">
            {insights.weeklyActivity.map((w, i) => {
              const max = Math.max(1, ...insights.weeklyActivity.map((x) => x.total));
              const h = Math.round((w.total / max) * 100);
              const isCurrent = i === insights.weeklyActivity.length - 1;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-mono text-zinc-300">{w.total}</span>
                  <div className="flex h-24 w-full items-end">
                    <div
                      className={`w-full rounded-t-md ${isCurrent ? "bg-emerald-400/70" : "bg-zinc-600/60"}`}
                      style={{ height: `${Math.max(4, h)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500">{w.label}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-zinc-600">Ostatni słupek (zielony) = bieżący tydzień.</p>
        </Card>
      )}

      {/* Mocne / słabe obszary — tylko CEO */}
      {isOwner && categories.length > 0 && (
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Card className="!border-emerald-500/20 !bg-emerald-500/[0.04]">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-400">
              Najmocniejszy obszar zespołu
            </p>
            <p className="text-xl font-semibold text-white">
              {strongest.label} <span className="text-emerald-400">{strongest.avg}/10</span>
            </p>
          </Card>
          <Card className="!border-amber-500/20 !bg-amber-500/[0.04]">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-amber-400">
              Do poprawy — najsłabszy obszar
            </p>
            <p className="text-xl font-semibold text-white">
              {weakest.label} <span className="text-amber-400">{weakest.avg}/10</span>
            </p>
          </Card>
        </div>
      )}

      {/* Zapraszanie + zarządzanie rolami — tylko CEO */}
      {isOwner && (
        <>
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-white">Zaproś do zespołu</h2>
            <Card>
              <InviteForm managers={managerOptions} />
              {invitations.length > 0 && (
                <div className="mt-5 border-t border-zinc-900 pt-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Oczekujące zaproszenia
                  </p>
                  <div className="space-y-2">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between gap-4 text-sm">
                        <span className="min-w-0 truncate text-zinc-300">
                          {inv.email}
                          <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                            {ROLE_LABELS[(inv.role ?? "agent") as UserRole]}
                          </span>
                        </span>
                        <div className="flex flex-shrink-0 items-center gap-4">
                          <CopyLink link={`${APP_URL}/zaproszenie/${inv.token}`} label="Kopiuj link" compact />
                          <form action={cancelInvitation.bind(null, inv.id)}>
                            <button className="text-xs text-zinc-500 transition hover:text-red-400">Anuluj</button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="mb-8">
            <h2 className="mb-1 text-lg font-semibold text-white">Role i limity</h2>
            <p className="mb-3 text-sm text-zinc-400">
              Nadaj rolę (CEO / Menedżer / Agent) i ustaw tygodniowy limit rozmów z AI Coach.
            </p>
            <TeamRoles members={teamMembers} currentUserId={user.id} />
          </div>

          <div className="mb-8">
            <h2 className="mb-1 text-lg font-semibold text-white">Zespoły menedżerów</h2>
            <p className="mb-3 text-sm text-zinc-400">
              Przypisz każdemu menedżerowi osoby, które ma widzieć (cele, telefony, wyniki AI — bez prowizji).
            </p>
            <ManagerTeams
              managers={teamMembers.filter((m) => m.role === "manager").map((m) => ({ id: m.id, name: m.label }))}
              agents={teamMembers
                .filter((m) => m.role === "agent")
                .map((m) => ({ id: m.id, name: m.label, manager_id: m.manager_id }))}
            />
          </div>
        </>
      )}

      {/* Ranking / lista agentów */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-white">
          {isOwner ? "Ranking agentów" : "Twoi agenci"}
        </h2>
        {ranking.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-zinc-500">
              {isOwner ? "Brak agentów. Zaproś kogoś powyżej." : "Nie masz jeszcze przypisanych agentów."}
            </p>
          </Card>
        ) : (
          <Card className="!p-0">
            <div className="divide-y divide-zinc-900">
              {ranking.map((agent, i) => {
                const fp = funnelByAgent[agent.id];
                return (
                  <Link
                    key={agent.id}
                    href={`/app/zespol/${agent.id}`}
                    className="block px-6 py-4 transition hover:bg-zinc-900/40"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="w-6 flex-shrink-0 text-center font-mono text-sm font-bold text-zinc-500">
                          {i + 1}
                        </span>
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-bold text-zinc-950">
                          {(agent.full_name ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {agent.full_name ?? agent.email}
                            {agent.role === "manager" && (
                              <span className="ml-2 rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-300">
                                Menedżer
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {agent.sessionCount} sesji
                            {isOwner && ` · ${formatPln(commissions[agent.id] ?? 0)} prowizji (mc)`}
                            {agent.sessionsThisWeek === 0 && (
                              <span className="ml-1 text-amber-400">· nie trenuje</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 font-mono text-lg font-semibold ${scoreColor(agent.avgScore)}`}>
                            {agent.avgScore != null ? `${agent.avgScore}` : "—"}
                            <TrendArrow trend={insights.trends[agent.id]} />
                          </span>
                          <span className="hidden text-xs text-zinc-500 sm:block">wynik AI</span>
                        </div>
                        <span className="text-xs text-emerald-400/70">Szczegóły →</span>
                      </div>
                    </div>
                    {fp && <FunnelChips stages={fp.stages} hasGoal={fp.hasGoal} />}
                  </Link>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
