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

  if (!fullName || fullName.length < 2) return { error: "Podaj imię i nazwisko" };

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      monthly_goal_pln: monthlyGoal,
      default_split_pct: defaultSplit,
    })
    .eq("id", user.id);

  if (error) return { error: "Nie udało się zapisać zmian." };

  revalidatePath("/app/ustawienia");
  revalidatePath("/app");
  return { success: "Zapisano zmiany." };
}
