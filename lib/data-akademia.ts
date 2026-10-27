import { createSupabaseAdmin } from "./supabase/admin";
import type { Wpis } from "./techniki/akademia";

type Wiersz = { profile_id: string; item: string; passed: boolean; best_score: number | null; attempts: number; updated_at: string; last_answers?: number[] | null; last_score?: number | null };

const zWiersza = (r: Wiersz): Wpis => ({ item: r.item, passed: r.passed, best: r.best_score, attempts: r.attempts, updated: r.updated_at });

/** Postęp osoby w Akademii. `ready=false` przed migracją v56. */
export async function postepAkademii(agencyId: string | null, profileId: string): Promise<{ ready: boolean; wpisy: Wpis[] }> {
  if (!agencyId) return { ready: true, wpisy: [] };
  const { data, error } = await createSupabaseAdmin()
    .from("academy_progress")
    .select("profile_id, item, passed, best_score, attempts, updated_at")
    .eq("agency_id", agencyId)
    .eq("profile_id", profileId);
  if (error) return { ready: false, wpisy: [] };
  return { ready: true, wpisy: ((data ?? []) as Wiersz[]).map(zWiersza) };
}

/** Postęp wielu osób naraz, do widoku CEO. */
export async function postepZespolu(agencyId: string, ids: string[]): Promise<{ ready: boolean; wgOsoby: Map<string, Wpis[]>; ostatnie: Map<string, { item: string; answers: number[] | null; score: number | null }[]> }> {
  const wgOsoby = new Map<string, Wpis[]>();
  const ostatnie = new Map<string, { item: string; answers: number[] | null; score: number | null }[]>();
  if (!ids.length) return { ready: true, wgOsoby, ostatnie };
  const { data, error } = await createSupabaseAdmin()
    .from("academy_progress")
    .select("profile_id, item, passed, best_score, attempts, updated_at, last_answers, last_score")
    .eq("agency_id", agencyId)
    .in("profile_id", ids)
    .limit(5000);
  if (error) return { ready: false, wgOsoby, ostatnie };
  for (const r of (data ?? []) as Wiersz[]) {
    wgOsoby.set(r.profile_id, [...(wgOsoby.get(r.profile_id) ?? []), zWiersza(r)]);
    ostatnie.set(r.profile_id, [...(ostatnie.get(r.profile_id) ?? []), { item: r.item, answers: (r.last_answers as number[] | null) ?? null, score: r.last_score ?? null }]);
  }
  return { ready: true, wgOsoby, ostatnie };
}
