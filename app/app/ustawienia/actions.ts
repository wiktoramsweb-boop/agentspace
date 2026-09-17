"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { ASSET_BUCKET } from "@/lib/storage";
import { removeFiles, signUploads, type SignedUpload } from "@/lib/storage-server";

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
  const jobTitle = String(formData.get("jobTitle") ?? "").trim().slice(0, 80);
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 600);

  if (!fullName || fullName.length < 2) return { error: "Podaj imię i nazwisko" };

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      monthly_goal_pln: monthlyGoal,
      default_split_pct: defaultSplit,
      phone: phone || null,
      job_title: jobTitle || null,
      bio: bio || null,
    })
    .eq("id", user.id);

  if (error) {
    // Najczęstsza przyczyna: nieuruchomiona migracja v24 (stanowisko i opis).
    return { error: "Nie udało się zapisać zmian. Jeśli to nowe pola profilu, uruchom w Supabase SETUP-v24." };
  }

  revalidatePath("/app/ustawienia");
  revalidatePath("/app/zespol");
  revalidatePath("/app");
  return { success: "Zapisano zmiany." };
}

/**
 * Zdjęcie profilowe: każdy zmienia własne. Plik ląduje w magazynie biura,
 * w folderze użytkownika, więc podpisany link nie pozwala nadpisać cudzego.
 */
export async function signAvatarUpload(
  ext: string,
): Promise<{ upload: SignedUpload | null; error: string | null }> {
  const user = await requireUser();
  if (!user.agency_id) return { upload: null, error: "Konto nie jest przypisane do biura." };
  const res = await signUploads(ASSET_BUCKET, `${user.agency_id}/avatars/${user.id}`, [{ ext }]);
  return { upload: res.uploads[0] ?? null, error: res.error };
}

export async function setAvatar(path: string | null): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  if (path && !path.startsWith(`${user.agency_id}/avatars/${user.id}/`)) {
    return { ok: false, error: "Nieprawidłowy plik." };
  }

  const admin = createSupabaseAdmin();
  const { data: before } = await admin.from("profiles").select("avatar_path").eq("id", user.id).maybeSingle();
  const { error } = await admin.from("profiles").update({ avatar_path: path }).eq("id", user.id);
  if (error) {
    if (path) await removeFiles(ASSET_BUCKET, [path]);
    return { ok: false, error: "Nie udało się zapisać zdjęcia. Uruchom w Supabase SETUP-v24." };
  }

  const previous = before?.avatar_path as string | null | undefined;
  if (previous && previous !== path) await removeFiles(ASSET_BUCKET, [previous]);

  revalidatePath("/app/ustawienia");
  revalidatePath("/app/zespol");
  revalidatePath("/app");
  return { ok: true };
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
