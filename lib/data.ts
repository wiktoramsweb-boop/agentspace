import { createSupabaseAdmin } from "./supabase/admin";
import type { Scenario, TrainingSession, SessionScore, Profile, Goal, DailyLog } from "./types";
import { computeFunnel } from "./funnel";

export async function getScenarios(): Promise<Scenario[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("scenarios")
    .select("*")
    .eq("is_active", true)
    .order("order_index");
  return (data ?? []) as Scenario[];
}

export async function getScenarioBySlug(slug: string): Promise<Scenario | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("scenarios").select("*").eq("slug", slug).single();
  return (data as Scenario) ?? null;
}

export async function getScenarioById(id: string): Promise<Scenario | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("scenarios").select("*").eq("id", id).single();
  return (data as Scenario) ?? null;
}

export type AgentStats = {
  totalSessions: number;
  completedSessions: number;
  avgScore: number | null;
  bestScore: number | null;
  sessionsThisWeek: number;
  trend: { date: string; score: number }[];
};

export async function getAgentStats(agentId: string): Promise<AgentStats> {
  const admin = createSupabaseAdmin();

  const { data: sessions } = await admin
    .from("training_sessions")
    .select("id, status, started_at")
    .eq("agent_id", agentId);

  const { data: scores } = await admin
    .from("session_scores")
    .select("overall, created_at")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: true });

  const all = sessions ?? [];
  const completed = all.filter((s) => s.status === "completed");

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sessionsThisWeek = all.filter((s) => new Date(s.started_at) >= weekAgo).length;

  const scoreVals = (scores ?? []).map((s) => s.overall).filter((n): n is number => n != null);
  const avgScore = scoreVals.length
    ? Math.round((scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) * 10) / 10
    : null;
  const bestScore = scoreVals.length ? Math.max(...scoreVals) : null;

  const trend = (scores ?? [])
    .filter((s) => s.overall != null)
    .map((s) => ({ date: s.created_at as string, score: s.overall as number }));

  return {
    totalSessions: all.length,
    completedSessions: completed.length,
    avgScore,
    bestScore,
    sessionsThisWeek,
    trend,
  };
}

export type SessionWithScore = TrainingSession & { score: SessionScore | null };

export async function getRecentSessions(
  agentId: string,
  limit = 10,
): Promise<SessionWithScore[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("training_sessions")
    .select("*, score:session_scores(*)")
    .eq("agent_id", agentId)
    .order("started_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((s) => ({
    ...s,
    score: Array.isArray(s.score) ? (s.score[0] ?? null) : (s.score ?? null),
  })) as SessionWithScore[];
}

export async function getSessionWithScore(
  sessionId: string,
): Promise<SessionWithScore | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("training_sessions")
    .select("*, score:session_scores(*)")
    .eq("id", sessionId)
    .single();
  if (!data) return null;
  return {
    ...data,
    score: Array.isArray(data.score) ? (data.score[0] ?? null) : (data.score ?? null),
  } as SessionWithScore;
}

/** Poniedziałek bieżącego tygodnia (lokalnie, 00:00) - początek okna limitu. */
export function mondayOfThisWeek(ref = new Date()): Date {
  const d = new Date(ref);
  const day = (d.getDay() + 6) % 7; // 0 = poniedziałek
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Liczba sesji treningowych rozpoczętych w tym tygodniu (Pn-Nd) przez agenta. */
export async function getWeeklySessionCount(agentId: string): Promise<number> {
  const admin = createSupabaseAdmin();
  const { count } = await admin
    .from("training_sessions")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId)
    .gte("started_at", mondayOfThisWeek().toISOString());
  return count ?? 0;
}

export type RankedAgent = Profile & {
  avgScore: number | null;
  sessionCount: number;
  sessionsThisWeek: number;
};

export async function getTeamRanking(
  agencyId: string,
  opts?: { managerId?: string },
): Promise<RankedAgent[]> {
  const admin = createSupabaseAdmin();

  let agentsQuery = admin
    .from("profiles")
    .select("*")
    .eq("agency_id", agencyId)
    .order("created_at");

  // Menedżer widzi tylko swoich przypisanych agentów.
  if (opts?.managerId) agentsQuery = agentsQuery.eq("manager_id", opts.managerId);

  const { data: agents } = await agentsQuery;

  const { data: sessions } = await admin
    .from("training_sessions")
    .select("agent_id, started_at")
    .eq("agency_id", agencyId);

  const { data: scores } = await admin
    .from("session_scores")
    .select("agent_id, overall")
    .eq("agency_id", agencyId);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const ranked: RankedAgent[] = (agents ?? [])
    .filter((a) => a.role !== "owner") // właściciel poza rankingiem agentów
    .map((agent) => {
    const agentSessions = (sessions ?? []).filter((s) => s.agent_id === agent.id);
    const agentScores = (scores ?? [])
      .filter((s) => s.agent_id === agent.id)
      .map((s) => s.overall)
      .filter((n): n is number => n != null);
    const avg = agentScores.length
      ? Math.round((agentScores.reduce((a, b) => a + b, 0) / agentScores.length) * 10) / 10
      : null;
    return {
      ...(agent as Profile),
      avgScore: avg,
      sessionCount: agentSessions.length,
      sessionsThisWeek: agentSessions.filter((s) => new Date(s.started_at) >= weekAgo).length,
    };
  });

  // Sortuj: najpierw wg avgScore malejąco (null na końcu), potem liczba sesji
  ranked.sort((a, b) => {
    if (a.avgScore == null && b.avgScore == null) return b.sessionCount - a.sessionCount;
    if (a.avgScore == null) return 1;
    if (b.avgScore == null) return -1;
    return b.avgScore - a.avgScore;
  });

  return ranked;
}

// ---- Postęp lejka (Cele) per agent - dla widoku zespołu/menedżera ----

export type FunnelStageKeyDb = "cold_calls" | "meetings" | "listings" | "buyers" | "sales";

export type FunnelStageProgress = {
  key: FunnelStageKeyDb;
  done: number; // zrobione w bieżącym miesiącu
  target: number; // cel miesięczny (0 gdy agent nie ma ustawionego celu)
};

export type AgentFunnelProgress = {
  agentId: string;
  stages: FunnelStageProgress[];
  hasGoal: boolean;
};

const FUNNEL_STAGE_KEYS: FunnelStageKeyDb[] = [
  "cold_calls",
  "meetings",
  "listings",
  "buyers",
  "sales",
];

/**
 * Postęp lejka (telefony, spotkania, umowy, kupujący, sprzedaże) w bieżącym miesiącu
 * vs cel miesięczny - dla podanej listy agentów. Zwraca mapę agentId → postęp.
 */
export async function getTeamFunnelProgress(
  agentIds: string[],
): Promise<Record<string, AgentFunnelProgress>> {
  if (agentIds.length === 0) return {};
  const admin = createSupabaseAdmin();

  const now = new Date();
  const monthStartYmd = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [{ data: logs }, { data: goals }] = await Promise.all([
    admin.from("daily_logs").select("*").in("agent_id", agentIds).gte("log_date", monthStartYmd),
    admin.from("goals").select("*").in("agent_id", agentIds),
  ]);

  const goalByAgent = new Map<string, Goal>();
  for (const g of (goals ?? []) as Goal[]) goalByAgent.set(g.agent_id, g);

  const result: Record<string, AgentFunnelProgress> = {};
  for (const agentId of agentIds) {
    const agentLogs = ((logs ?? []) as DailyLog[]).filter((l) => l.agent_id === agentId);
    const goal = goalByAgent.get(agentId);
    const targets = goal ? computeFunnel(goal) : null;
    const stages: FunnelStageProgress[] = FUNNEL_STAGE_KEYS.map((key) => ({
      key,
      done: agentLogs.reduce((sum, l) => sum + (l[key] ?? 0), 0),
      target: targets ? targets.byStage[key].monthly : 0,
    }));
    result[agentId] = { agentId, stages, hasGoal: Boolean(goal) };
  }
  return result;
}

// ---- Alerty proaktywne + trendy dla widoku zespołu (CEO/menedżer) ----

export type TeamAlert = {
  agentId: string;
  agentName: string;
  message: string;
  severity: "warn" | "info";
};
export type AgentTrend = { scoreTrend: "up" | "down" | "flat" | null; drop: number };
export type WeeklyActivity = { label: string; total: number };
export type TeamInsights = {
  alerts: TeamAlert[];
  trends: Record<string, AgentTrend>;
  weeklyActivity: WeeklyActivity[];
};

/**
 * Sygnały dla CEO/menedżera: kto nie dzwoni, komu spadł wynik AI, kto nie trenuje,
 * plus trend wyniku per agent i aktywność zespołu (cold calle) w 4 tygodniach.
 * Wszystko w kilku zbiorczych zapytaniach (bez N+1).
 */
export async function getTeamInsights(
  agents: { id: string; name: string }[],
): Promise<TeamInsights> {
  const ids = agents.map((a) => a.id);
  if (ids.length === 0) return { alerts: [], trends: {}, weeklyActivity: [] };
  const admin = createSupabaseAdmin();

  const since35 = new Date(Date.now() - 35 * 86400000).toISOString().slice(0, 10);
  const since28 = new Date(Date.now() - 28 * 86400000).toISOString();

  const [{ data: logs }, { data: scores }, { data: sess }] = await Promise.all([
    admin.from("daily_logs").select("agent_id, log_date, cold_calls").in("agent_id", ids).gte("log_date", since35),
    admin
      .from("session_scores")
      .select("agent_id, overall, created_at")
      .in("agent_id", ids)
      .order("created_at", { ascending: true }),
    admin.from("training_sessions").select("agent_id, started_at").in("agent_id", ids).gte("started_at", since28),
  ]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const monday = mondayOfThisWeek();

  const trends: Record<string, AgentTrend> = {};
  const alerts: TeamAlert[] = [];
  const avg = (arr: number[]) => arr.reduce((x, y) => x + y, 0) / arr.length;

  for (const a of agents) {
    const aLogs = (logs ?? []).filter((l) => l.agent_id === a.id);
    const aScores = (scores ?? [])
      .filter((s) => s.agent_id === a.id && s.overall != null)
      .map((s) => s.overall as number);
    const aSess = (sess ?? []).filter((s) => s.agent_id === a.id);

    // Trend wyniku: średnia z ostatnich 3 ocen vs poprzednie 3.
    let scoreTrend: AgentTrend["scoreTrend"] = null;
    let drop = 0;
    if (aScores.length >= 4) {
      const diff = avg(aScores.slice(-3)) - avg(aScores.slice(-6, -3));
      scoreTrend = diff >= 0.5 ? "up" : diff <= -0.5 ? "down" : "flat";
      drop = -diff;
    }
    trends[a.id] = { scoreTrend, drop };

    if (scoreTrend === "down" && drop >= 1.0) {
      alerts.push({ agentId: a.id, agentName: a.name, severity: "warn", message: `Wynik AI spadł o ${drop.toFixed(1)} pkt.` });
    }

    // Nie dzwoni: dni od ostatniego dnia z cold_calls > 0.
    const callDays = aLogs.filter((l) => (l.cold_calls ?? 0) > 0).map((l) => l.log_date);
    if (callDays.length === 0) {
      alerts.push({ agentId: a.id, agentName: a.name, severity: "info", message: "Brak zalogowanych telefonów (35+ dni)." });
    } else {
      const last = callDays.sort()[callDays.length - 1];
      const days = Math.round((Date.parse(todayStr) - Date.parse(last)) / 86400000);
      if (days >= 3) {
        alerts.push({ agentId: a.id, agentName: a.name, severity: "warn", message: `Nie logował telefonów od ${days} dni.` });
      }
    }

    // Nie trenuje w tym tygodniu (ma jakąś historię ocen).
    const thisWeekSess = aSess.filter((s) => new Date(s.started_at) >= monday).length;
    if (thisWeekSess === 0 && aScores.length > 0) {
      alerts.push({ agentId: a.id, agentName: a.name, severity: "info", message: "Nie trenował w tym tygodniu." });
    }
  }

  // Aktywność zespołu - cold calle w 4 kolejnych tygodniach.
  const weeklyActivity: WeeklyActivity[] = [];
  for (let w = 3; w >= 0; w--) {
    const start = new Date(monday);
    start.setDate(monday.getDate() - w * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const total = (logs ?? [])
      .filter((l) => l.log_date >= startStr && l.log_date < endStr)
      .reduce((x, l) => x + (l.cold_calls ?? 0), 0);
    weeklyActivity.push({ label: `${start.getDate()}.${start.getMonth() + 1}`, total });
  }

  alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "warn" ? -1 : 1));
  return { alerts, trends, weeklyActivity };
}

export type AgencyStats = {
  agentCount: number;
  avgTeamScore: number | null;
  sessionsThisWeek: number;
  totalSessions: number;
  weakestCategory: { key: string; label: string; avg: number } | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  opening: "Otwarcie",
  qualification: "Kwalifikacja",
  objection_handling: "Obsługa obiekcji",
  closing: "Zamknięcie",
};

export async function getAgencyStats(agencyId: string): Promise<AgencyStats> {
  const admin = createSupabaseAdmin();

  const { count: agentCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId);

  const { data: sessions } = await admin
    .from("training_sessions")
    .select("started_at")
    .eq("agency_id", agencyId);

  const { data: scores } = await admin
    .from("session_scores")
    .select("overall, opening, qualification, objection_handling, closing")
    .eq("agency_id", agencyId);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sessionsThisWeek = (sessions ?? []).filter(
    (s) => new Date(s.started_at) >= weekAgo,
  ).length;

  const overallVals = (scores ?? []).map((s) => s.overall).filter((n): n is number => n != null);
  const avgTeamScore = overallVals.length
    ? Math.round((overallVals.reduce((a, b) => a + b, 0) / overallVals.length) * 10) / 10
    : null;

  // Najsłabsza kategoria zespołu
  let weakestCategory: AgencyStats["weakestCategory"] = null;
  if ((scores ?? []).length > 0) {
    const cats = ["opening", "qualification", "objection_handling", "closing"] as const;
    const avgs = cats.map((key) => {
      const vals = (scores ?? []).map((s) => s[key]).filter((n): n is number => n != null);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 10;
      return { key, label: CATEGORY_LABELS[key], avg: Math.round(avg * 10) / 10 };
    });
    weakestCategory = avgs.reduce((min, c) => (c.avg < min.avg ? c : min), avgs[0]);
  }

  return {
    agentCount: agentCount ?? 0,
    avgTeamScore,
    sessionsThisWeek,
    totalSessions: (sessions ?? []).length,
    weakestCategory,
  };
}

export type CategoryAvg = { key: string; label: string; avg: number };

const CATEGORY_KEYS = ["opening", "qualification", "objection_handling", "closing"] as const;
const CATEGORY_LABEL_MAP: Record<string, string> = {
  opening: "Otwarcie",
  qualification: "Kwalifikacja",
  objection_handling: "Obsługa obiekcji",
  closing: "Zamknięcie",
};

/** Średnie per kategoria dla całej agencji (posortowane malejąco). */
export async function getAgencyCategoryAverages(agencyId: string): Promise<CategoryAvg[]> {
  const admin = createSupabaseAdmin();
  const { data: scores } = await admin
    .from("session_scores")
    .select("opening, qualification, objection_handling, closing")
    .eq("agency_id", agencyId);

  if (!scores || scores.length === 0) return [];

  return CATEGORY_KEYS.map((key) => {
    const vals = scores.map((s) => s[key]).filter((n): n is number => n != null);
    const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    return { key, label: CATEGORY_LABEL_MAP[key], avg };
  }).sort((a, b) => b.avg - a.avg);
}

export type AgentDetail = {
  profile: Profile;
  categoryAverages: CategoryAvg[];
  sessions: SessionWithScore[];
  avgScore: number | null;
  sessionCount: number; // liczba OCEN (scored)
  totalSessions: number; // wszystkie rozpoczęte sesje
  completedSessions: number; // ukończone sesje
  monthCommission: number;
  funnel: FunnelStageProgress[];
  hasGoal: boolean;
  goal: Goal | null;
  todayLog: DailyLog | null;
  monthLogs: DailyLog[];
  dailyCallTarget: number;
};

/** Szczegóły jednego agenta dla właściciela. */
export async function getAgentDetail(
  agentId: string,
  agencyId: string,
): Promise<AgentDetail | null> {
  const admin = createSupabaseAdmin();

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", agentId)
    .eq("agency_id", agencyId)
    .single();
  if (!profile) return null;

  const { data: scores } = await admin
    .from("session_scores")
    .select("overall, opening, qualification, objection_handling, closing")
    .eq("agent_id", agentId);

  // Wszystkie sesje agenta (nie tylko 10) - CEO/menedżer chce widzieć każdą.
  const sessions = await getRecentSessions(agentId, 500);
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === "completed").length;

  const overallVals = (scores ?? []).map((s) => s.overall).filter((n): n is number => n != null);
  const avgScore = overallVals.length
    ? Math.round((overallVals.reduce((a, b) => a + b, 0) / overallVals.length) * 10) / 10
    : null;

  const categoryAverages: CategoryAvg[] =
    (scores ?? []).length > 0
      ? CATEGORY_KEYS.map((key) => {
          const vals = (scores ?? []).map((s) => s[key]).filter((n): n is number => n != null);
          const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
          return { key, label: CATEGORY_LABEL_MAP[key], avg };
        })
      : [];

  // Prowizja zamknięta w tym miesiącu
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data: deals } = await admin
    .from("deals")
    .select("commission_pln")
    .eq("agent_id", agentId)
    .eq("status", "zamkniety")
    .gte("closed_at", monthStart);
  const monthCommission = (deals ?? []).reduce((a, d) => a + (d.commission_pln ?? 0), 0);

  // Cel + logi bieżącego miesiąca (do lejka, dzisiejszego wpisu i kalendarza).
  const { data: goalRow } = await admin
    .from("goals")
    .select("*")
    .eq("agent_id", agentId)
    .maybeSingle();
  const goal = (goalRow as Goal) ?? null;

  const monthStartYmd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
  const { data: logRows } = await admin
    .from("daily_logs")
    .select("*")
    .eq("agent_id", agentId)
    .gte("log_date", monthStartYmd)
    .order("log_date");
  const monthLogs = (logRows ?? []) as DailyLog[];
  const todayYmd = new Date().toISOString().slice(0, 10);
  const todayLog = monthLogs.find((l) => l.log_date === todayYmd) ?? null;

  const targets = goal ? computeFunnel(goal) : null;
  const funnel: FunnelStageProgress[] = FUNNEL_STAGE_KEYS.map((key) => ({
    key,
    done: monthLogs.reduce((s, l) => s + (l[key] ?? 0), 0),
    target: targets ? targets.byStage[key].monthly : 0,
  }));

  return {
    profile: profile as Profile,
    categoryAverages,
    sessions,
    avgScore,
    sessionCount: overallVals.length,
    totalSessions,
    completedSessions,
    monthCommission,
    funnel,
    hasGoal: Boolean(goal),
    goal,
    todayLog,
    monthLogs,
    dailyCallTarget: targets ? targets.byStage.cold_calls.daily : 0,
  };
}

/** Wszyscy członkowie agencji (CEO + menedżerowie + agenci). */
export async function getAgencyMembers(agencyId: string): Promise<Profile[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("agency_id", agencyId)
    .order("created_at");
  return (data ?? []) as Profile[];
}

export async function getPendingInvitations(agencyId: string) {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("invitations")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return data ?? [];
}
