import { requireOwner } from "@/lib/auth";
import { getTeamRanking, getAgencyStats, getPendingInvitations } from "@/lib/data";
import { PageHeader, StatCard, Card, scoreColor } from "../components/ui";
import { InviteForm } from "./invite-form";
import { removeAgent, cancelInvitation } from "./actions";

export default async function ZespolPage() {
  const owner = await requireOwner();
  const agencyId = owner.agency_id!;

  const [ranking, stats, invitations] = await Promise.all([
    getTeamRanking(agencyId),
    getAgencyStats(agencyId),
    getPendingInvitations(agencyId),
  ]);

  return (
    <>
      <PageHeader
        title="Zespół"
        subtitle={`${owner.agency?.name ?? "Twoje biuro"} — ranking, statystyki, zarządzanie agentami.`}
      />

      {/* Statystyki zespołu */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Agenci" value={stats.agentCount} accent />
        <StatCard
          label="Średni wynik zespołu"
          value={stats.avgTeamScore != null ? `${stats.avgTeamScore}/10` : "—"}
        />
        <StatCard label="Sesje w tym tyg." value={stats.sessionsThisWeek} />
        <StatCard label="Sesje łącznie" value={stats.totalSessions} />
      </div>

      {stats.weakestCategory && (
        <Card className="mb-8 !border-amber-500/20 !bg-amber-500/[0.04]">
          <p className="text-sm text-zinc-300">
            ⚠ Najsłabszy obszar zespołu:{" "}
            <span className="font-semibold text-amber-300">{stats.weakestCategory.label}</span>{" "}
            (średnio {stats.weakestCategory.avg}/10). Rozważ wspólne szkolenie z tego tematu.
          </p>
        </Card>
      )}

      {/* Zaproszenie */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-white">Zaproś agenta</h2>
        <Card>
          <InviteForm />
          {invitations.length > 0 && (
            <div className="mt-5 border-t border-zinc-900 pt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Oczekujące zaproszenia
              </p>
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-zinc-300">{inv.email}</span>
                    <form action={cancelInvitation.bind(null, inv.id)}>
                      <button className="text-xs text-zinc-500 transition hover:text-red-400">
                        Anuluj
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Ranking */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-white">Ranking agentów</h2>
        <Card className="!p-0">
          <div className="divide-y divide-zinc-900">
            {ranking.map((agent, i) => (
              <div key={agent.id} className="flex items-center justify-between gap-4 px-6 py-4">
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
                      {agent.role === "owner" && (
                        <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                          właściciel
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {agent.sessionCount} sesji · {agent.sessionsThisWeek} w tym tyg.
                      {agent.sessionsThisWeek === 0 && agent.role !== "owner" && (
                        <span className="ml-1 text-amber-400">· nie trenuje</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-mono text-lg font-semibold ${scoreColor(agent.avgScore)}`}>
                    {agent.avgScore != null ? `${agent.avgScore}` : "—"}
                  </span>
                  {agent.role !== "owner" && (
                    <form action={removeAgent.bind(null, agent.id)}>
                      <button
                        className="text-xs text-zinc-600 transition hover:text-red-400"
                        title="Usuń z zespołu"
                      >
                        Usuń
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
