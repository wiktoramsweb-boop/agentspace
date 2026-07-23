import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  getAgentStats,
  getRecentSessions,
  getAgencyStats,
} from "@/lib/data";
import {
  getTodayTasks,
  getClientsNeedingContact,
  getContactReminders,
  getCommissionStats,
  getGoal,
  getOnboardingState,
} from "@/lib/data-platform";
import { getGameData, getWeeklyChallenge } from "@/lib/gamification";
import { computeFunnel } from "@/lib/funnel";
import { CLIENT_STATUSES } from "@/lib/types";
import { PageHeader, StatCard, ScoreBadge, Card } from "./components/ui";
import { formatPln, daysAgo } from "@/lib/format";
import { formatDate } from "@/lib/blog";
import { TaskList } from "./components/task-list";
import { DailyAssistant } from "./components/daily-assistant";
import { GameStrip, BadgesCard } from "./components/game-strip";
import { OnboardingChecklist } from "./components/onboarding-checklist";

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = (user.full_name ?? "").split(" ")[0] || "Cześć";

  const [stats, recent, tasks, reminders, needContact, commission, goalRow, onboarding] =
    await Promise.all([
      getAgentStats(user.id),
      getRecentSessions(user.id, 4),
      getTodayTasks(user.id),
      getContactReminders(user.id, 5),
      getClientsNeedingContact(user.id, 6),
      getCommissionStats(user.id),
      getGoal(user.id),
      getOnboardingState(user.id),
    ]);

  // Zaplanowane przypomnienia mają priorytet; klientów "zapomnianych" pokazujemy
  // poniżej, bez duplikatów.
  const reminderIds = new Set(reminders.map((c) => c.id));
  const hotClients = needContact.filter((c) => !reminderIds.has(c.id)).slice(0, 5);

  // Cel dzienny telefonów (z lejka) → gamifikacja
  const dailyCallTarget = goalRow ? computeFunnel(goalRow).byStage.cold_calls.daily : 0;
  const game = await getGameData(user.id, dailyCallTarget);

  const goal = user.monthly_goal_pln ?? 0;
  const goalProgress = goal > 0 ? Math.min(100, Math.round((commission.monthClosed / goal) * 100)) : 0;

  const ownerStats =
    user.role === "owner" && user.agency_id ? await getAgencyStats(user.agency_id) : null;
  const weeklyChallenge =
    user.agency_id ? await getWeeklyChallenge(user.agency_id) : [];
  const myRank = weeklyChallenge.findIndex((a) => a.agentId === user.id) + 1;

  return (
    <>
      <PageHeader
        title={`Cześć, ${firstName} 👋`}
        subtitle={new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
        action={
          <Link
            href="/app/trening"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Zacznij trening →
          </Link>
        }
      />

      {/* Onboarding (znika po ukończeniu) */}
      <OnboardingChecklist state={onboarding} />

      {/* Gamifikacja: poziom, passa, następna odznaka */}
      <GameStrip game={game} />

      {/* Górne statystyki */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Twój zarobek (mc)"
          value={formatPln(commission.monthClosed)}
          sub={goal > 0 ? `${goalProgress}% celu` : undefined}
          accent
        />
        <StatCard label="Pipeline" value={formatPln(commission.pipelineValue)} sub={`${commission.dealsInProgress} w toku`} />
        <StatCard label="Średni wynik AI" value={stats.avgScore != null ? `${stats.avgScore}/10` : "—"} />
        <StatCard label="Sesje w tym tyg." value={stats.sessionsThisWeek} />
      </div>

      {/* Pasek celu */}
      {goal > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-zinc-400">Cel miesięczny</span>
            <span className="text-zinc-300">
              {formatPln(commission.monthClosed)} / {formatPln(goal)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* AI Asystent Dnia */}
      <div className="mb-6">
        <DailyAssistant />
      </div>

      {/* Plan dnia + Klienci do kontaktu */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-white">Plan dnia</h2>
          <TaskList tasks={tasks} />
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Do kontaktu</h2>
            <Link href="/app/klienci" className="text-sm text-emerald-400 hover:text-emerald-300">
              Wszyscy →
            </Link>
          </div>
          {reminders.length === 0 && hotClients.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-600">
              Wszyscy klienci na bieżąco. 👌
            </p>
          ) : (
            <ul className="space-y-1">
              {reminders.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/app/klienci/${c.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition hover:bg-zinc-900/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-300">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{c.name}</p>
                        <p className="text-xs text-amber-400">🔔 zaplanowany kontakt</p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
              {hotClients.map((c) => {
                const status = CLIENT_STATUSES.find((s) => s.value === c.status);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/app/klienci/${c.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition hover:bg-zinc-900/40"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{c.name}</p>
                          <p className="text-xs text-amber-400">{daysAgo(c.last_contact_at)}</p>
                        </div>
                      </div>
                      {status && (
                        <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Odznaki + wyzwanie tygodnia */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <BadgesCard game={game} />
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Wyzwanie tygodnia</h2>
            <span className="text-xs text-zinc-500">cold calle</span>
          </div>
          {weeklyChallenge.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">Brak danych zespołu.</p>
          ) : (
            <>
              <ol className="space-y-2">
                {weeklyChallenge.slice(0, 5).map((a, i) => (
                  <li
                    key={a.agentId}
                    className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${a.agentId === user.id ? "bg-emerald-500/10" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center font-mono text-sm font-bold text-zinc-500">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </span>
                      <span className={`text-sm ${a.agentId === user.id ? "font-semibold text-white" : "text-zinc-300"}`}>
                        {a.agentId === user.id ? "Ty" : a.name}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-emerald-400">{a.calls}</span>
                  </li>
                ))}
              </ol>
              {myRank > 5 && (
                <p className="mt-3 border-t border-zinc-700 pt-3 text-center text-xs text-zinc-500">
                  Twoje miejsce: {myRank}
                </p>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Ostatnie sesje */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Ostatnie treningi</h2>
          <Link href="/app/historia" className="text-sm text-emerald-400 hover:text-emerald-300">
            Historia →
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-zinc-400">
              Nie masz jeszcze treningów.{" "}
              <Link href="/app/trening" className="text-emerald-400 hover:text-emerald-300">
                Zacznij pierwszy →
              </Link>
            </p>
          </Card>
        ) : (
          <Card className="!p-0">
            <div className="divide-y divide-zinc-900">
              {recent.map((s) => (
                <Link
                  key={s.id}
                  href={`/app/sesja/${s.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-3.5 transition hover:bg-zinc-900/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {s.scenario_title ?? "Sesja"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(s.started_at)}
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

      {/* Snapshot zespołu (owner) */}
      {ownerStats && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Twój zespół</h2>
            <Link href="/app/zespol" className="text-sm text-emerald-400 hover:text-emerald-300">
              Panel zespołu →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Agenci" value={ownerStats.agentCount} />
            <StatCard label="Średni wynik zespołu" value={ownerStats.avgTeamScore != null ? `${ownerStats.avgTeamScore}/10` : "—"} />
            <StatCard label="Sesje zespołu w tyg." value={ownerStats.sessionsThisWeek} />
          </div>
        </div>
      )}
    </>
  );
}
