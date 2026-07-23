import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { createSupabaseAdmin } from "./supabase/admin";
import type { ProfileWithAgency } from "./types";

/**
 * Zwraca zalogowanego użytkownika z profilem i agencją, albo null.
 * Cache per-request żeby nie odpytywać wielokrotnie w jednym renderze.
 */
export const getCurrentUser = cache(async (): Promise<ProfileWithAgency | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Profil + agencja przez admin client (RLS omijamy, autoryzacja przez user.id)
  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("*, agency:agencies(*)")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // User w auth.users bez profilu (np. przerwana rejestracja) — dołóż email
    return {
      id: user.id,
      agency_id: null,
      full_name: user.user_metadata?.full_name ?? null,
      email: user.email ?? null,
      role: "owner",
      monthly_goal_pln: 0,
      default_split_pct: 50,
      created_at: user.created_at,
      agency: null,
    };
  }

  return profile as ProfileWithAgency;
});

/**
 * Wymusza zalogowanie. Zwraca profil lub przekierowuje na /login.
 */
export async function requireUser(): Promise<ProfileWithAgency> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Wymusza rolę właściciela.
 */
export async function requireOwner(): Promise<ProfileWithAgency> {
  const user = await requireUser();
  if (user.role !== "owner") redirect("/app");
  return user;
}
