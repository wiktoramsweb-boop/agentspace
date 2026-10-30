import { randomBytes } from "node:crypto";
import { createSupabaseAdmin } from "./supabase/admin";

export type StanKalendarza = { gotowe: boolean; token: string | null; ostatnio: string | null };

export async function stanKalendarza(profileId: string): Promise<StanKalendarza> {
  const { data, error } = await createSupabaseAdmin().from("calendar_tokens").select("token, ostatnio_pobrany").eq("profile_id", profileId).maybeSingle();
  if (error) return { gotowe: false, token: null, ostatnio: null };
  return { gotowe: true, token: data?.token ?? null, ostatnio: data?.ostatnio_pobrany ?? null };
}

export async function nowyToken(profileId: string, agencyId: string): Promise<string | null> {
  const token = randomBytes(32).toString("base64url");
  const { error } = await createSupabaseAdmin().from("calendar_tokens").upsert({ profile_id: profileId, agency_id: agencyId, token, ostatnio_pobrany: null }, { onConflict: "profile_id" });
  return error ? null : token;
}
