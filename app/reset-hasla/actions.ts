"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/supabase/config";
import { wyslijMail } from "@/lib/mail";
import { zapiszBlad } from "@/lib/blad";

export type ResetResult = { error: string } | { ok: true } | undefined;

/**
 * Krok 1 - wysyła maila z linkiem do ustawienia nowego hasła.
 *
 * Link generujemy sami i sami wysyłamy wiadomość, zamiast zlecać to Supabase.
 * Ich szablon jest po angielsku i podpisany „Supabase Auth", więc klient biura
 * dostawał list od firmy, o której nigdy nie słyszał. Przy sprzedaży systemu
 * innym biurom to jest realny problem, nie drobiazg.
 *
 * Ze względów bezpieczeństwa NIE zdradzamy, czy dany email istnieje w bazie:
 * zawsze zwracamy „ok", niezależnie od tego, czy cokolwiek wysłaliśmy.
 */
export async function requestPasswordReset(
  _prev: ResetResult,
  formData: FormData,
): Promise<ResetResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Podaj poprawny adres email" };

  try {
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${APP_URL}/reset-hasla/callback` },
    });

    const link = data?.properties?.action_link;
    // Nieznany adres kończy się tutaj po cichu: odpowiedź dla przeglądarki
    // i tak jest identyczna, więc nie da się po niej zgadnąć, kto ma konto.
    if (!error && link) {
      await wyslijMail({
        do: email,
        temat: "Ustaw nowe hasło do AgentSpace",
        naglowek: "Nowe hasło do AgentSpace",
        akapity: [
          "Ktoś poprosił o zmianę hasła do Twojego konta. Jeśli to byłeś Ty, kliknij przycisk poniżej.",
          "Jeśli nie prosiłeś o zmianę, zignoruj tę wiadomość. Hasło zostanie bez zmian.",
        ],
        przycisk: { tekst: "Ustaw nowe hasło", adres: link },
        stopka: "Link działa przez godzinę i tylko raz. Otwórz go na tym samym urządzeniu, na którym prosiłeś o zmianę.",
      });
    }
  } catch (err) {
    await zapiszBlad("reset-hasla", err);
  }

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
