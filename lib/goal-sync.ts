import { createSupabaseAdmin } from "./supabase/admin";
import { dateKeyPL } from "./datetime";

/**
 * Łącznik między Działaniami a Celami.
 *
 * Po co: agent, który zaloguje telefon albo spotkanie w CRM, nie powinien
 * potem klikać tego drugi raz w liczniku na stronie Cele. Wykonane działanie
 * samo podbija odpowiedni etap lejka na dany dzień.
 */

export type GoalStage = "cold_calls" | "meetings" | "listings" | "buyers" | "sales";

/**
 * Który etap lejka podbija dane działanie. null = działanie nie liczy się
 * do celów (zadanie, szkolenie, sesja foto itd.).
 *
 * Reguła jest celowo prosta i przewidywalna, żeby agent wiedział, czego się
 * spodziewać: telefon to telefon, spotkanie to spotkanie.
 */
export function goalStageForActivity(
  kind: string | null,
  purpose: string | null,
): GoalStage | null {
  if (kind === "polaczenie") return "cold_calls";
  if (kind === "spotkanie") return "meetings";
  // Wydarzenie w kalendarzu bywa zwykłym spotkaniem z klientem.
  if (kind === "wydarzenie" && (purpose === "spotkanie_pozyskowe" || purpose === "prezentacja")) {
    return "meetings";
  }
  return null;
}

/** Komu przypisać wynik: osobie przypisanej do działania, a gdy jej brak - autorowi. */
export function goalOwnerOf(activity: {
  assignee_ids?: string[] | null;
  created_by?: string | null;
}): string | null {
  const first = activity.assignee_ids?.[0];
  return first ?? activity.created_by ?? null;
}

type ActivityLike = {
  kind: string | null;
  purpose: string | null;
  status: string | null;
  completed_at: string | null;
  assignee_ids?: string[] | null;
  created_by?: string | null;
  agency_id?: string | null;
};

/**
 * Podbija (delta=1) albo cofa (delta=-1) licznik w dzienniku celów.
 * Robi to tylko dla działań wykonanych i tylko dla rodzajów z lejka.
 *
 * Uwaga: odczyt i zapis to dwa kroki, więc dwa zapisy w tej samej sekundzie
 * mogą policzyć się jak jeden. Przy tempie pracy agenta to nie ma znaczenia,
 * a licznik na stronie Cele i tak można poprawić ręcznie.
 */
export async function applyActivityToGoals(
  admin: ReturnType<typeof createSupabaseAdmin>,
  activity: ActivityLike,
  delta: 1 | -1,
): Promise<void> {
  if (activity.status !== "wykonane") return;

  const stage = goalStageForActivity(activity.kind, activity.purpose);
  if (!stage) return;

  const agentId = goalOwnerOf(activity);
  if (!agentId) return;

  const logDate = dateKeyPL(activity.completed_at ?? new Date().toISOString());
  if (!logDate) return;

  const { data: existing } = await admin
    .from("daily_logs")
    .select("id, cold_calls, meetings, listings, buyers, sales")
    .eq("agent_id", agentId)
    .eq("log_date", logDate)
    .maybeSingle();

  const current = (existing?.[stage] as number | undefined) ?? 0;
  const next = Math.max(0, current + delta);

  await admin.from("daily_logs").upsert(
    {
      agent_id: agentId,
      agency_id: activity.agency_id ?? null,
      log_date: logDate,
      cold_calls: existing?.cold_calls ?? 0,
      meetings: existing?.meetings ?? 0,
      listings: existing?.listings ?? 0,
      buyers: existing?.buyers ?? 0,
      sales: existing?.sales ?? 0,
      [stage]: next,
    },
    { onConflict: "agent_id,log_date" },
  );
}
