import { createSupabaseAdmin } from "./supabase/admin";
import type { Scenario, TrainingSession, SessionScore, Profile } from "./types";

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

export type RankedAgent = Profile & {
  avgScore: number | null;
  sessionCount: number;
  sessionsThisWeek: number;
};

export async function getTeamRanking(agencyId: string): Promise<RankedAgent[]> {
  const admin = createSupabaseAdmin();

  const { data: agents } = await admin
    .from("profiles")
    .select("*")
    .eq("agency_id", agencyId)
    .order("created_at");

  const { data: sessions } = await admin
    .from("training_sessions")
    .select("agent_id, started_at")
    .eq("agency_id", agencyId);

  const { data: scores } = await admin
    .from("session_scores")
    .select("agent_id, overall")
    .eq("agency_id", agencyId);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const ranked: RankedAgent[] = (agents ?? []).map((agent) => {
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
