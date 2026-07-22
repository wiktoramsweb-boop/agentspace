import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getAgentDetail } from "@/lib/data";
import { PageHeader, StatCard, Card, ScoreBadge, scoreColor } from "../../components/ui";
import { formatPln } from "@/lib/format";
import { formatDate } from "@/lib/blog";
import { removeAgent } from "../actions";

type Props = { params: Promise<{ agentId: string }> };

export default async function AgentDetailPage({ params }: Props) {
  const owner = await requireOwner();
  const { agentId } = await params;

  const detail = await getAgentDetail(agentId, owner.agency_id!);
  if (!detail) notFound();

  const { profile, categoryAverages, sessions, avgScore, sessionCount, monthCommission } = detail;

  return (
    <>
      <Link href="/app/zespol" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-emerald-400">
        ← Zespół
      </Link>

      <PageHeader
        title={profile.full_name ?? profile.email ?? "Agent"}
        subtitle={profile.role === "owner" ? "Właściciel" : "Agent"}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Średni wynik" value={avgScore != null ? `${avgScore}/10` : "—"} sub={`${sessionCount} ocen`} accent />
        <StatCard label="Prowizja w tym mc" value={formatPln(monthCommission)} />
        <StatCard label="Cel miesięczny" value={profile.monthly_goal_pln ? formatPln(profile.monthly_goal_pln) : "—"} />
      </div>

      {categoryAverages.length > 0 && (
        <Card className="mb-8">
          <h2 className="mb-5 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Obszary
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

      <h2 className="mb-3 text-lg font-semibold text-white">Ostatnie sesje</h2>
      {sessions.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-zinc-500">Ten agent nie ma jeszcze sesji.</p>
        </Card>
      ) : (
        <Card className="!p-0">
          <div className="divide-y divide-zinc-900">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/app/sesja/${s.id}`}
                className="flex items-center justify-between gap-4 px-6 py-3.5 transition hover:bg-zinc-900/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{s.scenario_title ?? "Sesja"}</p>
                  <p className="text-xs text-zinc-500">{formatDate(s.started_at)}</p>
                </div>
                <ScoreBadge score={s.score?.overall ?? null} />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {profile.role !== "owner" && (
        <form action={removeAgent.bind(null, profile.id)} className="mt-8">
          <button className="text-xs text-zinc-600 transition hover:text-red-400">
            Usuń agenta z zespołu
          </button>
        </form>
      )}
    </>
  );
}
