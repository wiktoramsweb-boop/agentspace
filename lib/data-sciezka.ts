import { createSupabaseAdmin } from "./supabase/admin";
import { mondayOfThisWeek } from "./data";
import { stanSciezki, wynikSesji, type Podejscie, type StanSciezki } from "./coach/sciezka";

type Wiersz = {
  agent_id: string;
  scenario_id: string;
  difficulty: string | null;
  status: string;
  started_at: string;
  context: { analiza?: { wynik?: number } } | null;
  score: { overall: number | null }[] | { overall: number | null } | null;
};

async function podejsciaZBazy(filtr: { agentId?: string; agencyId?: string; od?: string }) {
  const admin = createSupabaseAdmin();
  let q = admin
    .from("training_sessions")
    .select("agent_id, scenario_id, difficulty, status, started_at, context, score:session_scores(overall)")
    .eq("status", "completed")
    .limit(3000);
  if (filtr.agentId) q = q.eq("agent_id", filtr.agentId);
  if (filtr.agencyId) q = q.eq("agency_id", filtr.agencyId);
  if (filtr.od) q = q.gte("started_at", filtr.od);
  const [{ data }, { data: scen }] = await Promise.all([q, admin.from("scenarios").select("id, slug")]);
  const slug = new Map((scen ?? []).map((s) => [s.id as string, s.slug as string]));
  return ((data ?? []) as unknown as Wiersz[])
    .map((w) => {
      const s = Array.isArray(w.score) ? w.score[0] : w.score;
      const wynik = wynikSesji(w.context?.analiza?.wynik, s?.overall);
      return wynik === null
        ? null
        : { agentId: w.agent_id, scenariusz: slug.get(w.scenario_id) ?? "", poziomTrudnosci: w.difficulty ?? "sredni", wynik };
    })
    .filter((x): x is Podejscie & { agentId: string } => x !== null);
}

export async function postepSciezki(agentId: string): Promise<StanSciezki> {
  return stanSciezki(await podejsciaZBazy({ agentId }));
}

export type MiejsceWRankingu = { agentId: string; imie: string; punkty: number; rozmowy: number; zaliczone: number };

/**
 * Ranking treningu w biurze na bieżący tydzień. Punkty to suma wyników
 * z rozmów (0-100 każda), więc liczy się i ilość, i jakość.
 */
export async function rankingTreningu(agencyId: string): Promise<MiejsceWRankingu[]> {
  const admin = createSupabaseAdmin();
  const od = mondayOfThisWeek().toISOString();
  const [podejscia, { data: ludzie }] = await Promise.all([
    podejsciaZBazy({ agencyId, od }),
    admin.from("profiles").select("id, full_name, email").eq("agency_id", agencyId),
  ]);
  return (ludzie ?? [])
    .map((p) => {
      const moje = podejscia.filter((x) => x.agentId === p.id);
      return {
        agentId: p.id as string,
        imie: (p.full_name as string | null) ?? (p.email as string | null) ?? "Agent",
        punkty: moje.reduce((s, x) => s + x.wynik, 0),
        rozmowy: moje.length,
        zaliczone: moje.filter((x) => x.wynik >= 60).length,
      };
    })
    .filter((m) => m.rozmowy > 0)
    .sort((a, b) => b.punkty - a.punkty);
}
