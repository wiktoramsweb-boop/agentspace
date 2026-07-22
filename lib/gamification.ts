import { createSupabaseAdmin } from "./supabase/admin";

// XP za akcje
const XP = {
  coldCall: 2,
  meeting: 15,
  listing: 40,
  buyer: 10,
  sale: 100,
  session: 20,
  highScore: 30, // bonus za sesję z wynikiem >= 8
};

export type GameData = {
  totals: {
    coldCalls: number;
    meetings: number;
    listings: number;
    buyers: number;
    sales: number;
    sessions: number;
    highScoreSessions: number;
    bestScore: number;
    daysHitCallGoal: number;
    streak: number;
  };
  xp: number;
  level: LevelInfo;
  badges: Badge[];
};

export type LevelInfo = {
  level: number;
  title: string;
  xpInLevel: number;
  xpForNext: number;
  progressPct: number;
};

export type Badge = {
  id: string;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: { current: number; target: number };
};

const LEVEL_TITLES = [
  "Nowicjusz",
  "Adept",
  "Praktyk",
  "Specjalista",
  "Ekspert",
  "Weteran",
  "Mistrz",
  "Legenda",
];

// Próg XP na poziom rośnie kwadratowo: level n wymaga 100*n^2 XP łącznie.
function totalXpForLevel(level: number): number {
  return 100 * Math.pow(level - 1, 2);
}

export function levelFromXP(xp: number): LevelInfo {
  let level = 1;
  while (totalXpForLevel(level + 1) <= xp) level++;
  const base = totalXpForLevel(level);
  const next = totalXpForLevel(level + 1);
  const xpInLevel = xp - base;
  const xpForNext = next - base;
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
  return {
    level,
    title,
    xpInLevel,
    xpForNext,
    progressPct: xpForNext > 0 ? Math.min(100, Math.round((xpInLevel / xpForNext) * 100)) : 100,
  };
}

/**
 * Passa: kolejne dni (kończąc dziś lub wczoraj) z wykonanym celem cold calli.
 */
function computeStreak(
  logsByDate: Map<string, number>,
  dailyCallTarget: number,
): number {
  if (dailyCallTarget <= 0) return 0;
  let streak = 0;
  const d = new Date();
  // Pozwól zacząć passę od dziś LUB wczoraj (jeszcze dziś nie dzwonił)
  const todayHit = (logsByDate.get(d.toISOString().slice(0, 10)) ?? 0) >= dailyCallTarget;
  if (!todayHit) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 400; i++) {
    const ds = d.toISOString().slice(0, 10);
    if ((logsByDate.get(ds) ?? 0) >= dailyCallTarget) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export async function getGameData(
  agentId: string,
  dailyCallTarget: number,
): Promise<GameData> {
  const admin = createSupabaseAdmin();

  const [{ data: logs }, { data: sessions }, { data: scores }] = await Promise.all([
    admin.from("daily_logs").select("*").eq("agent_id", agentId),
    admin.from("training_sessions").select("id, status").eq("agent_id", agentId),
    admin.from("session_scores").select("overall").eq("agent_id", agentId),
  ]);

  const logsByDate = new Map<string, number>();
  let coldCalls = 0, meetings = 0, listings = 0, buyers = 0, sales = 0, daysHitCallGoal = 0;
  for (const l of logs ?? []) {
    coldCalls += l.cold_calls ?? 0;
    meetings += l.meetings ?? 0;
    listings += l.listings ?? 0;
    buyers += l.buyers ?? 0;
    sales += l.sales ?? 0;
    logsByDate.set(l.log_date, l.cold_calls ?? 0);
    if (dailyCallTarget > 0 && (l.cold_calls ?? 0) >= dailyCallTarget) daysHitCallGoal++;
  }

  const sessionCount = (sessions ?? []).filter((s) => s.status === "completed").length;
  const scoreVals = (scores ?? []).map((s) => s.overall).filter((n): n is number => n != null);
  const highScoreSessions = scoreVals.filter((s) => s >= 8).length;
  const bestScore = scoreVals.length ? Math.max(...scoreVals) : 0;
  const streak = computeStreak(logsByDate, dailyCallTarget);

  const xp =
    coldCalls * XP.coldCall +
    meetings * XP.meeting +
    listings * XP.listing +
    buyers * XP.buyer +
    sales * XP.sale +
    sessionCount * XP.session +
    highScoreSessions * XP.highScore;

  const totals = {
    coldCalls, meetings, listings, buyers, sales,
    sessions: sessionCount, highScoreSessions, bestScore, daysHitCallGoal, streak,
  };

  return { totals, xp, level: levelFromXP(xp), badges: computeBadges(totals) };
}

function computeBadges(t: GameData["totals"]): Badge[] {
  const mk = (
    id: string,
    label: string,
    description: string,
    icon: string,
    current: number,
    target: number,
  ): Badge => ({
    id, label, description, icon,
    unlocked: current >= target,
    progress: { current: Math.min(current, target), target },
  });

  return [
    mk("first-session", "Pierwszy krok", "Ukończ 1 sesję AI Coach", "🎯", t.sessions, 1),
    mk("caller-50", "Rozmówca", "50 cold calli łącznie", "📞", t.coldCalls, 50),
    mk("caller-250", "Maszyna do dzwonienia", "250 cold calli łącznie", "🔥", t.coldCalls, 250),
    mk("streak-5", "Passa tygodnia", "5 dni z rzędu z celem telefonów", "⚡", t.streak, 5),
    mk("streak-14", "Żelazna passa", "14 dni z rzędu z celem telefonów", "💎", t.streak, 14),
    mk("high-score", "Mistrz rozmowy", "Sesja Coach z wynikiem 9+", "🏅", t.bestScore, 9),
    mk("first-listing", "Pierwsza umowa", "Podpisz pierwszą umowę", "📄", t.listings, 1),
    mk("closer", "Zamykacz", "Pierwsza sprzedaż", "🏆", t.sales, 1),
    mk("closer-10", "Rekin", "10 sprzedaży łącznie", "🦈", t.sales, 10),
    mk("meetings-20", "Człowiek spotkań", "20 spotkań pozyskowych", "🤝", t.meetings, 20),
  ];
}

/** Tygodniowy leaderboard cold calli w agencji. */
export async function getWeeklyChallenge(
  agencyId: string,
): Promise<{ agentId: string; name: string; calls: number }[]> {
  const admin = createSupabaseAdmin();
  const monday = new Date();
  const day = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - day);
  monday.setHours(0, 0, 0, 0);

  const [{ data: logs }, { data: profiles }] = await Promise.all([
    admin
      .from("daily_logs")
      .select("agent_id, cold_calls")
      .eq("agency_id", agencyId)
      .gte("log_date", monday.toISOString().slice(0, 10)),
    admin.from("profiles").select("id, full_name, email").eq("agency_id", agencyId),
  ]);

  const byAgent = new Map<string, number>();
  for (const l of logs ?? []) byAgent.set(l.agent_id, (byAgent.get(l.agent_id) ?? 0) + (l.cold_calls ?? 0));

  return (profiles ?? [])
    .map((p) => ({
      agentId: p.id,
      name: p.full_name ?? p.email ?? "Agent",
      calls: byAgent.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.calls - a.calls);
}
