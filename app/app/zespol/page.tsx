import Link from "next/link";
import { requireManagerOrOwner } from "@/lib/auth";
import {
  getTeamRanking,
  getAgencyStats,
  getPendingInvitations,
  getAgencyCategoryAverages,
  getTeamFunnelProgress,
  getAgencyMembers,
  type FunnelStageProgress,
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

export default async function ZespolPage() {
  const user = await requireManagerOrOwner();
  const agencyId = user.agency_id!;
  const isOwner = user.role === "owner";

  // Zakres: CEO widzi całą agencję; menedżer tylko swoich agentów.
  const ranking = await getTeamRanking(agencyId, isOwner ? undefined : { managerId: user.id });
  const funnelByAgent = await getTeamFunnelProgress(ranking.map((a) => a.id));

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
            <h2 className="mb-1 text-lg font-semibold text-white">Role i przypisania</h2>
            <p className="mb-3 text-sm text-zinc-400">
              Nadaj rolę i przypisz agentów do menedżera. Menedżer widzi cele i wyniki AI swoich agentów.
            </p>
            <TeamRoles members={teamMembers} managers={managerOptions} currentUserId={user.id} />
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
                          <span className={`font-mono text-lg font-semibold ${scoreColor(agent.avgScore)}`}>
                            {agent.avgScore != null ? `${agent.avgScore}` : "—"}
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
