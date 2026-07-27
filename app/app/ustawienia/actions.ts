"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type SettingsResult = { error?: string; success?: string } | undefined;

export async function updateProfile(
  _prev: SettingsResult,
  formData: FormData,
): Promise<SettingsResult> {
  const user = await requireUser();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const goalRaw = String(formData.get("monthlyGoal") ?? "0").replace(/\s/g, "");
  const monthlyGoal = Math.max(0, parseInt(goalRaw, 10) || 0);
  const splitRaw = parseInt(String(formData.get("defaultSplit") ?? "50"), 10);
  const defaultSplit = Math.min(100, Math.max(1, Number.isFinite(splitRaw) ? splitRaw : 50));
  const phone = String(formData.get("phone") ?? "").trim();

  if (!fullName || fullName.length < 2) return { error: "Podaj imię i nazwisko" };

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      monthly_goal_pln: monthlyGoal,
      default_split_pct: defaultSplit,
      phone: phone || null,
    })
    .eq("id", user.id);

  if (error) return { error: "Nie udało się zapisać zmian." };

  revalidatePath("/app/ustawienia");
  revalidatePath("/app");
  return { success: "Zapisano zmiany." };
}

/**
 * Zmienia email logowania zalogowanego użytkownika (Supabase Auth + profiles).
 * Sesja pozostaje ważna (JWT po user.id); następne logowanie nowym mailem, hasło bez zmian.
 */
export async function changeMyEmail(
  _prev: SettingsResult,
  formData: FormData,
): Promise<SettingsResult> {
  const user = await requireUser();
  const newEmail = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return { error: "Niepoprawny email" };
  if (newEmail === (user.email ?? "").toLowerCase()) return { error: "To już jest Twój obecny email." };

  const admin = createSupabaseAdmin();

  const { error: authErr } = await admin.auth.admin.updateUserById(user.id, {
    email: newEmail,
    email_confirm: true,
  });
  if (authErr) {
    const msg = authErr.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return { error: "Ten email jest już zajęty przez inne konto." };
    }
    return { error: "Nie udało się zmienić emaila. Spróbuj ponownie." };
  }

  await admin.from("profiles").update({ email: newEmail }).eq("id", user.id);

  revalidatePath("/app/ustawienia");
  return { success: `Email zmieniony na ${newEmail}. Następnym razem loguj się tym adresem (hasło bez zmian).` };
}
