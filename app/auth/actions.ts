"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type AuthResult = { error: string } | undefined;

/**
 * Rejestracja właściciela biura: tworzy usera, agencję i profil owner,
 * następnie loguje.
 */
export async function signUpOwner(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const agencyName = String(formData.get("agencyName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName || fullName.length < 2) return { error: "Podaj imię i nazwisko" };
  if (!agencyName || agencyName.length < 2) return { error: "Podaj nazwę biura" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Niepoprawny email" };
  if (password.length < 8) return { error: "Hasło min. 8 znaków" };

  const admin = createSupabaseAdmin();

  // 1. Utwórz usera (bez maila potwierdzającego — od razu aktywny)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createErr || !created.user) {
    if (createErr?.message?.toLowerCase().includes("already")) {
      return { error: "Ten email jest już zarejestrowany. Zaloguj się." };
    }
    return { error: "Nie udało się utworzyć konta. Spróbuj ponownie." };
  }

  const userId = created.user.id;

  // 2. Agencja
  const { data: agency, error: agencyErr } = await admin
    .from("agencies")
    .insert({ name: agencyName, owner_id: userId })
    .select()
    .single();

  if (agencyErr || !agency) {
    await admin.auth.admin.deleteUser(userId); // rollback
    return { error: "Nie udało się utworzyć biura. Spróbuj ponownie." };
  }

  // 3. Profil owner
  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId,
    agency_id: agency.id,
    full_name: fullName,
    email,
    role: "owner",
  });

  if (profileErr) {
    await admin.auth.admin.deleteUser(userId);
    await admin.from("agencies").delete().eq("id", agency.id);
    return { error: "Nie udało się dokończyć rejestracji. Spróbuj ponownie." };
  }

  // 4. Zaloguj (ustawia cookie sesji)
  const supabase = await createSupabaseServerClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) return { error: "Konto utworzone, ale logowanie nie powiodło się. Zaloguj się ręcznie." };

  redirect("/app");
}

/**
 * Logowanie email/hasło.
 */
export async function signIn(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Podaj email i hasło" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Niepoprawny email lub hasło" };

  redirect("/app");
}

/**
 * Wylogowanie.
 */
export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Przyjęcie zaproszenia: agent ustawia hasło, tworzy konto w agencji.
 */
export async function acceptInvitation(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const token = String(formData.get("token") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!token) return { error: "Brak tokenu zaproszenia" };
  if (!fullName || fullName.length < 2) return { error: "Podaj imię i nazwisko" };
  if (password.length < 8) return { error: "Hasło min. 8 znaków" };

  const admin = createSupabaseAdmin();

  const { data: invitation } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (!invitation) return { error: "Zaproszenie nieważne lub już wykorzystane" };
  if (new Date(invitation.expires_at) < new Date()) {
    return { error: "Zaproszenie wygasło. Poproś właściciela o nowe." };
  }

  const email = invitation.email.toLowerCase();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createErr || !created.user) {
    if (createErr?.message?.toLowerCase().includes("already")) {
      return { error: "Ten email ma już konto. Zaloguj się." };
    }
    return { error: "Nie udało się utworzyć konta. Spróbuj ponownie." };
  }

  const userId = created.user.id;

  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId,
    agency_id: invitation.agency_id,
    full_name: fullName,
    email,
    role: invitation.role ?? "agent",
  });

  if (profileErr) {
    await admin.auth.admin.deleteUser(userId);
    return { error: "Nie udało się dokończyć rejestracji." };
  }

  await admin.from("invitations").update({ status: "accepted" }).eq("id", invitation.id);

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithPassword({ email, password });

  redirect("/app");
}
