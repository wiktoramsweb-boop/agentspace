import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import {
  getTeamRanking,
  getAgencyStats,
  getPendingInvitations,
  getAgencyCategoryAverages,
} from "@/lib/data";
import { getAgencyCommissionByAgent } from "@/lib/data-platform";
import { PageHeader, StatCard, Card, scoreColor } from "../components/ui";
import { formatPln } from "@/lib/format";
import { InviteForm } from "./invite-form";
import { cancelInvitation } from "./actions";
import { ReportButton } from "./report-button";

export default async function ZespolPage() {
  const owner = await requireOwner();
  const agencyId = owner.agency_id!;

  const [ranking, stats, invitations, categories, commissions] = await Promise.all([
    getTeamRanking(agencyId),
    getAgencyStats(agencyId),
    getPendingInvitations(agencyId),
    getAgencyCategoryAverages(agencyId),
    getAgencyCommissionByAgent(agencyId),
  ]);

  const strongest = categories[0];
  const weakest = categories[categories.length - 1];

  return (
    <>
      <PageHeader
        title="Zespół"
        subtitle={`${owner.agency?.name ?? "Twoje biuro"} — dane, nie przeczucia.`}
        action={<ReportButton />}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Agenci" value={stats.agentCount} accent />
        <StatCard label="Średni wynik zespołu" value={stats.avgTeamScore != null ? `${stats.avgTeamScore}/10` : "—"} />
        <StatCard label="Sesje w tym tyg." value={stats.sessionsThisWeek} />
        <StatCard
          label="Prowizje zespołu (mc)"
          value={formatPln(Object.values(commissions).reduce((a, b) => a + b, 0))}
        />
      </div>

      {/* Mocne / słabe obszary */}
      {categories.length > 0 && (
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

      {/* Wszystkie kategorie */}
      {categories.length > 0 && (
        <Card className="mb-8">
          <h2 className="mb-5 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Obszary zespołu
          </h2>
          <div className="space-y-4">
            {categories.map((c) => (
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
                      <button className="text-xs text-zinc-500 transition hover:text-red-400">Anuluj</button>
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
              <Link
                key={agent.id}
                href={`/app/zespol/${agent.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-zinc-900/40"
              >
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
                        <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">właściciel</span>
                      )}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {agent.sessionCount} sesji · {formatPln(commissions[agent.id] ?? 0)} prowizji (mc)
                      {agent.sessionsThisWeek === 0 && agent.role !== "owner" && (
                        <span className="ml-1 text-amber-400">· nie trenuje</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-lg font-semibold ${scoreColor(agent.avgScore)}`}>
                    {agent.avgScore != null ? `${agent.avgScore}` : "—"}
                  </span>
                  <span className="text-zinc-600">→</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
