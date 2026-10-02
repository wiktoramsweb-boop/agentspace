import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { createSupabaseAdmin } from "./supabase/admin";
import type { ProfileWithAgency } from "./types";
import { maModul, zakresDanych, type Modul, type Zakres } from "./role";
import { stanDostepu } from "./abonament-cennik";

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
    // User w auth.users bez profilu (np. przerwana rejestracja) - dołóż email
    return {
      id: user.id,
      agency_id: null,
      full_name: user.user_metadata?.full_name ?? null,
      email: user.email ?? null,
      role: "owner",
      monthly_goal_pln: 0,
      default_split_pct: 50,
      phone: null,
      manager_id: null,
      weekly_ai_limit: null,
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
 * Wymusza rolę właściciela (CEO).
 */
export async function requireOwner(): Promise<ProfileWithAgency> {
  const user = await requireUser();
  if (user.role !== "owner") redirect("/app");
  return user;
}

/**
 * Wymusza rolę CEO lub menedżera (dostęp do widoku zespołu).
 * CEO widzi całą agencję; menedżer tylko swoich przypisanych agentów (zakres egzekwowany w kodzie stron).
 */
export async function requireManagerOrOwner(): Promise<ProfileWithAgency> {
  const user = await requireUser();
  if (user.role !== "owner" && user.role !== "manager") redirect("/app");
  return user;
}

/**
 * Wymusza dostęp do modułu (v38).
 *
 * Ukrycie pozycji w menu to tylko wygoda: adres i tak da się wpisać ręcznie,
 * więc każda strona modułu musi sprawdzić uprawnienie u siebie. Odsyłamy na
 * pulpit, a nie na 403, bo dla użytkownika to nie jest błąd, tylko zakres
 * obowiązków ustawiony przez CEO.
 */
export async function requireModul(modul: Modul): Promise<ProfileWithAgency> {
  const user = await requireUser();
  if (!maModul({ id: user.id, role: user.role, permissions: user.permissions }, modul)) {
    redirect("/app");
  }
  // Po okresie próbnym nie wyrzucamy z aplikacji, tylko zamykamy moduły.
  // Ustawienia i abonament zostają otwarte, bo inaczej biuro nie miałoby
  // jak zapłacić ani zabrać swoich danych.
  if (modul !== "abonament" && !user.agency?.is_demo) {
    const dostep = stanDostepu(user.agency ?? null);
    if (!dostep.aktywne) redirect("/app");
  }
  return user;
}

/** Zakres danych zalogowanej osoby: tylko swoje, zespół albo całe biuro. */
export function zakresUzytkownika(user: ProfileWithAgency): Zakres {
  return zakresDanych({ id: user.id, role: user.role, permissions: user.permissions });
}
