import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getRecentSessions, getAgentStats } from "@/lib/data";
import { PageHeader, StatCard, ScoreBadge, EmptyState, Card } from "../components/ui";
import { formatDate } from "@/lib/blog";

export default async function HistoriaPage() {
  const user = await requireUser();
  const [sessions, stats] = await Promise.all([
    getRecentSessions(user.id, 50),
    getAgentStats(user.id),
  ]);

  return (
    <>
      <PageHeader title="Historia sesji" subtitle="Wszystkie Twoje treningi i wyniki." />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Sesje łącznie" value={stats.totalSessions} accent />
        <StatCard label="Średni wynik" value={stats.avgScore != null ? `${stats.avgScore}/10` : "—"} />
        <StatCard label="Najlepszy wynik" value={stats.bestScore != null ? `${stats.bestScore}/10` : "—"} />
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="Brak sesji"
          body="Nie masz jeszcze żadnych treningów. Zacznij pierwszą sesję z AI Coachem."
          ctaHref="/app/trening"
          ctaLabel="Zacznij trening"
        />
      ) : (
        <Card className="!p-0">
          <div className="divide-y divide-zinc-900">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={s.status === "completed" ? `/app/sesja/${s.id}` : `/app/sesja/${s.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-zinc-900/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">
                    {s.scenario_title ?? "Sesja treningowa"}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {formatDate(s.started_at)}
                    {s.personality && ` · klient ${s.personality}`}
                    {s.status === "in_progress" && " · w trakcie"}
                  </p>
                </div>
                <ScoreBadge score={s.score?.overall ?? null} />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
