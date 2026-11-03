import { createSupabaseAdmin } from "./supabase/admin";
import { ITEM_BLEDOW } from "./techniki/teoria";

export type WynikTestu = { najlepszy: number; ostatni: number | null; max: number; podejscia: number; zaliczony: boolean };
export type PostepTeorii = { ready: boolean; przeczytane: Set<string>; testy: Record<string, WynikTestu>; bledy: string[] };

type Wiersz = { item: string; passed: boolean; best_score: number | null; last_score: number | null; max_score: number | null; attempts: number; last_answers: unknown };

/**
 * Postęp w Teorii trzymamy w tej samej tabeli co Akademię (`academy_progress`,
 * v56), z przedrostkiem `teoria-`, więc nie trzeba nowej migracji.
 */
export async function postepTeorii(agencyId: string | null, profileId: string): Promise<PostepTeorii> {
  const pusty: PostepTeorii = { ready: true, przeczytane: new Set(), testy: {}, bledy: [] };
  if (!agencyId) return pusty;
  const { data, error } = await createSupabaseAdmin()
    .from("academy_progress")
    .select("item, passed, best_score, last_score, max_score, attempts, last_answers")
    .eq("agency_id", agencyId)
    .eq("profile_id", profileId)
    .like("item", "teoria-%");
  if (error) return { ...pusty, ready: false };
  for (const r of (data ?? []) as Wiersz[]) {
    if (r.item === ITEM_BLEDOW) pusty.bledy = Array.isArray(r.last_answers) ? (r.last_answers as unknown[]).filter((x): x is string => typeof x === "string") : [];
    else if (r.item.startsWith("teoria-r-")) {
      if (r.passed) pusty.przeczytane.add(r.item.slice("teoria-r-".length));
    } else pusty.testy[r.item] = { najlepszy: r.best_score ?? 0, ostatni: r.last_score, max: r.max_score ?? 0, podejscia: r.attempts, zaliczony: r.passed };
  }
  return pusty;
}
