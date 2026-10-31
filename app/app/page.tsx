import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  getAgentStats,
  getRecentSessions,
  getAgencyStats,
} from "@/lib/data";
import {
  getTodayTasks,
  getCommissionStats,
  getGoal,
} from "@/lib/data-platform";
import { getGameData, getWeeklyChallenge } from "@/lib/gamification";
import { computeFunnel } from "@/lib/funnel";
import { PageHeader, StatCard, ScoreBadge, Card } from "./components/ui";
import { formatPln } from "@/lib/format";
import { formatDate } from "@/lib/blog";
import { TaskList } from "./components/task-list";
import { TodayActivities } from "./components/today-activities";
import { getActivities, getAgencyAgents } from "@/lib/data-activities";
import { priorytetyDnia } from "@/lib/data-priorytety";
import { PriorytetyDnia } from "./components/priorytety-dnia";
import { GameStrip, BadgesCard } from "./components/game-strip";
import { BanerPrzewodnika } from "./components/baner-przewodnika";
import { redirect } from "next/navigation";
import { getPrzewodnik } from "@/lib/data-przewodnik";
import { stanDostepu } from "@/lib/abonament-cennik";
import { DostepWstrzymany } from "./dostep-wstrzymany";
import { getAgencySettings } from "@/lib/agency-settings";
import { ZastepstwoKarta } from "./zastepstwo-karta";
import { PulpitWlasciciela } from "./components/pulpit-wlasciciela";

export default async function DashboardPage() {
  const user = await requireUser();
  // Doradca kredytowy nie ma telefonów, ofert ani celów agenta: jego pulpitem jest tablica kredytów.
  if (user.role === "credit_advisor") redirect("/app/kredyty");
  if (user.role === "rental_manager") redirect("/app/najem");
  const firstName = (user.full_name ?? "").split(" ")[0] || "Cześć";

  const przewodnik = await getPrzewodnik(user);

  // Po wygaśnięciu dostępu pulpit zamienia się w jedną kartę z wyjaśnieniem
  // i drogą do płatności. Reszta modułów jest zamknięta, ale użytkownik
  // zostaje w aplikacji i widzi swoje dane w ustawieniach.
  const dostep = stanDostepu(user.agency ?? null);
  if (!dostep.aktywne && !user.agency?.is_demo) {
    return <DostepWstrzymany probny={dostep.probny} czyCeo={user.role === "owner"} />;
  }

  // Zupełnie puste biuro kierujemy prosto do przewodnika. Nowa osoba widzi
  // inaczej pusty pulpit i nie wie, od czego zacząć. Po zrobieniu czegokolwiek
  // albo po pominięciu przewodnika zostaje już na pulpicie.
  const { options } = await getAgencySettings(user.agency_id, user.agency?.name);
  if (
    !przewodnik.ukonczony &&
    przewodnik.zrobione === 0 &&
    !options.onboarding_skipped &&
    !user.agency?.is_demo
  ) {
    redirect("/app/start");
  }
  const [stats, recent, tasks, commission, goalRow, priorytety, agenci] =
    await Promise.all([
      getAgentStats(user.id),
      getRecentSessions(user.id, 4),
      getTodayTasks(user.id),
      getCommissionStats(user.id),
      getGoal(user.id),
      priorytetyDnia(user.id),
      user.agency_id ? getAgencyAgents(user.agency_id) : Promise.resolve([]),
    ]);

  // Cel dzienny telefonów (z lejka) → gamifikacja
  const dailyCallTarget = goalRow ? computeFunnel(goalRow).byStage.cold_calls.daily : 0;
  const game = await getGameData(user.id, dailyCallTarget);
  const myActivities = user.agency_id
    ? await getActivities(user.agency_id, { scope: "mine", userId: user.id, limit: 100 })
    : [];

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
        title={`Cześć, ${firstName}`}
        subtitle={new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
        action={
          <Link
            href="/app/trening"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            Zacznij trening →
          </Link>
        }
      />

      {/* Przewodnik dla nowego biura (znika po domknięciu kroków niezbędnych) */}
      <BanerPrzewodnika przewodnik={przewodnik} />

      {/* CEO i dyrektor: stan biura zanim zejdą do własnych spraw */}
      {(user.role === "owner" || user.role === "director") && user.agency_id && <PulpitWlasciciela agencyId={user.agency_id} />}

      {/* Zastępstwo: sprawy osoby na urlopie, które przejmuję dziś */}
      {user.agency_id && <ZastepstwoKarta agencyId={user.agency_id} userId={user.id} />}

      {/* Najważniejsze sprawy dnia z oceną klienta i krokami etapu */}
      <PriorytetyDnia
        sprawy={priorytety.sprawy}
        aktywnych={priorytety.aktywnych}
        agenci={agenci}
        raportDomyslnie={options.report_default}
      />

      {/* Działania i plan dnia */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Działania na dziś</h2>
            <Link href="/app/dzialania" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Wszystkie →
            </Link>
          </div>
          <TodayActivities activities={myActivities} />
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Plan dnia</h2>
          <TaskList tasks={tasks} />
        </Card>

      </div>

      {/* Twój miesiąc: liczby pod sprawami dnia, bo rano liczy się, do kogo zadzwonić */}
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Twój miesiąc</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Twój zarobek (mc)"
          value={formatPln(commission.monthClosed)}
          sub={goal > 0 ? `${goalProgress}% celu` : undefined}
          accent
          icon={<IconWallet />}
        />
        <StatCard label="Pipeline" value={formatPln(commission.pipelineValue)} sub={`${commission.dealsInProgress} w toku`} icon={<IconTrend />} />
        <StatCard label="Średni wynik AI" value={stats.avgScore != null ? `${stats.avgScore}/10` : "-"} icon={<IconSpark />} />
        <StatCard label="Sesje w tym tyg." value={stats.sessionsThisWeek} icon={<IconBolt />} />
      </div>

      {/* Pasek celu */}
      {goal > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Cel miesięczny</span>
            <span className="text-slate-700">
              {formatPln(commission.monthClosed)} / {formatPln(goal)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Gamifikacja: poziom, passa, następna odznaka */}
      <GameStrip game={game} />

      {/* Odznaki + wyzwanie tygodnia */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
        <BadgesCard game={game} />
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Wyzwanie tygodnia</h2>
            <span className="text-xs text-slate-500">cold calle</span>
          </div>
          {weeklyChallenge.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Brak danych zespołu.</p>
          ) : (
            <>
              <ol className="space-y-2">
                {weeklyChallenge.slice(0, 5).map((a, i) => (
                  <li
                    key={a.agentId}
                    className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${a.agentId === user.id ? "bg-emerald-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Podium bez emotek: kolorowy krążek z numerem. */}
                      <span
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                          i === 0
                            ? "bg-amber-100 text-amber-700"
                            : i === 1
                              ? "bg-slate-200 text-slate-700"
                              : i === 2
                                ? "bg-orange-100 text-orange-700"
                                : "text-slate-500"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className={`text-sm ${a.agentId === user.id ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                        {a.agentId === user.id ? "Ty" : a.name}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-emerald-600">{a.calls}</span>
                  </li>
                ))}
              </ol>
              {myRank > 5 && (
                <p className="mt-3 border-t border-slate-300 pt-3 text-center text-xs text-slate-500">
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
          <h2 className="text-lg font-semibold text-slate-900">Ostatnie treningi</h2>
          <Link href="/app/historia" className="text-sm text-emerald-600 hover:text-emerald-700">
            Historia →
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-slate-500">
              Nie masz jeszcze treningów.{" "}
              <Link href="/app/trening" className="text-emerald-600 hover:text-emerald-700">
                Zacznij pierwszy →
              </Link>
            </p>
          </Card>
        ) : (
          <Card className="!p-0">
            <div className="divide-y divide-slate-200">
              {recent.map((s) => (
                <Link
                  key={s.id}
                  href={`/app/sesja/${s.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-3.5 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {s.scenario_title ?? "Sesja"}
                    </p>
                    <p className="text-xs text-slate-500">
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

      {/* --- ikony statystyk --- */}
      {/* Snapshot zespołu (owner) */}
      {ownerStats && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Twój zespół</h2>
            <Link href="/app/zespol" className="text-sm text-emerald-600 hover:text-emerald-700">
              Panel zespołu →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Agenci" value={ownerStats.agentCount} />
            <StatCard label="Średni wynik zespołu" value={ownerStats.avgTeamScore != null ? `${ownerStats.avgTeamScore}/10` : "-"} />
            <StatCard label="Sesje zespołu w tyg." value={ownerStats.sessionsThisWeek} />
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- ikony kafelków ---------- */
function IconWallet() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" /></svg>;
}
function IconTrend() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>;
}
function IconSpark() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5a.56.56 0 0 1 1.04 0l1.83 4.4 4.75.38a.56.56 0 0 1 .32.98l-3.62 3.1 1.1 4.64a.56.56 0 0 1-.83.6L12 15.6l-4.07 2.5a.56.56 0 0 1-.84-.6l1.1-4.64-3.61-3.1a.56.56 0 0 1 .32-.98l4.75-.38 1.83-4.4Z" /></svg>;
}
function IconBolt() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 14.25 3l-1.5 7.5h7.5L9.75 21l1.5-7.5h-7.5Z" /></svg>;
}
