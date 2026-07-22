import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  getAgentStats,
  getRecentSessions,
  getAgencyStats,
  getTeamRanking,
} from "@/lib/data";
import { PageHeader, StatCard, ScoreBadge, EmptyState, Card } from "./components/ui";
import { formatDate } from "@/lib/blog";

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = (user.full_name ?? "").split(" ")[0] || "Cześć";

  const [stats, recent] = await Promise.all([
    getAgentStats(user.id),
    getRecentSessions(user.id, 5),
  ]);

  // Dla właściciela — dodatkowo dane zespołu
  const ownerData =
    user.role === "owner" && user.agency_id
      ? await Promise.all([
          getAgencyStats(user.agency_id),
          getTeamRanking(user.agency_id),
        ])
      : null;

  return (
    <>
      <PageHeader
        title={`Cześć, ${firstName} 👋`}
        subtitle={
          user.role === "owner"
            ? "Twój pulpit właściciela i osobisty trening."
            : "Twój pulpit. Trenuj codziennie 15 minut."
        }
        action={
          <Link
            href="/app/trening"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Zacznij trening →
          </Link>
        }
      />

      {/* Osobiste statystyki */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Średni wynik"
          value={stats.avgScore != null ? `${stats.avgScore}/10` : "—"}
          sub={stats.avgScore != null ? "z ukończonych sesji" : "brak sesji"}
          accent
        />
        <StatCard label="Sesje łącznie" value={stats.totalSessions} sub={`${stats.completedSessions} ukończonych`} />
        <StatCard label="W tym tygodniu" value={stats.sessionsThisWeek} sub="sesji treningowych" />
        <StatCard label="Najlepszy wynik" value={stats.bestScore != null ? `${stats.bestScore}/10` : "—"} />
      </div>

      {/* Ostatnie sesje */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-white">Ostatnie sesje</h2>
        {recent.length === 0 ? (
          <EmptyState
            title="Jeszcze nie trenowałeś"
            body="Odpal pierwszą sesję z AI Coachem. 15 minut, a zobaczysz konkretny feedback."
            ctaHref="/app/trening"
            ctaLabel="Zacznij pierwszą sesję"
          />
        ) : (
          <Card className="!p-0">
            <div className="divide-y divide-zinc-900">
              {recent.map((s) => (
                <Link
                  key={s.id}
                  href={s.status === "completed" ? `/app/sesja/${s.id}` : `/app/trening`}
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
      </div>

      {/* Snapshot zespołu (tylko owner) */}
      {ownerData && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Twój zespół</h2>
            <Link href="/app/zespol" className="text-sm text-emerald-400 hover:text-emerald-300">
              Zobacz pełny panel →
            </Link>
          </div>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <StatCard label="Agenci" value={ownerData[0].agentCount} />
            <StatCard
              label="Średni wynik zespołu"
              value={ownerData[0].avgTeamScore != null ? `${ownerData[0].avgTeamScore}/10` : "—"}
            />
            <StatCard label="Sesje w tym tyg." value={ownerData[0].sessionsThisWeek} />
          </div>
          {ownerData[0].weakestCategory && (
            <Card>
              <p className="text-sm text-zinc-400">
                Najsłabszy obszar zespołu:{" "}
                <span className="font-semibold text-amber-300">
                  {ownerData[0].weakestCategory.label}
                </span>{" "}
                (średnio {ownerData[0].weakestCategory.avg}/10). Warto zrobić na tym focus.
              </p>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
