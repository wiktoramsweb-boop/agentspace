"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { APP_URL } from "@/lib/supabase/config";

export type ResetResult = { error: string } | { ok: true } | undefined;

/**
 * Krok 1 - wysyła maila z linkiem do ustawienia nowego hasła.
 * Ze względów bezpieczeństwa NIE zdradzamy, czy dany email istnieje w bazie:
 * zawsze zwracamy „ok" (Supabase i tak nie zgłasza błędu dla nieznanego maila).
 */
export async function requestPasswordReset(
  _prev: ResetResult,
  formData: FormData,
): Promise<ResetResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Podaj poprawny adres email" };

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${APP_URL}/reset-hasla/callback`,
  });

  return { ok: true };
}

/**
 * Krok 3 - ustawia nowe hasło. Wymaga aktywnej sesji odzyskiwania
 * (ustawionej przez /reset-hasla/callback po kliknięciu w link z maila).
 */
export async function updatePassword(
  _prev: ResetResult,
  formData: FormData,
): Promise<ResetResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { error: "Hasło musi mieć min. 8 znaków" };
  if (password !== confirm) return { error: "Hasła nie są takie same" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Link wygasł lub jest nieprawidłowy. Poproś o nowy." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Nie udało się ustawić hasła. Spróbuj ponownie." };

  redirect("/app");
}
