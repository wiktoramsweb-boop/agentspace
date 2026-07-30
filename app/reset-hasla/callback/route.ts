import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Krok 2 — użytkownik klika link z maila i ląduje tutaj. Zamieniamy token na
 * sesję odzyskiwania (cookies), potem przekierowujemy na formularz nowego hasła.
 *
 * Obsługujemy oba warianty szablonu maila Supabase:
 *  - domyślny (PKCE): przychodzi `?code=...` → exchangeCodeForSession
 *  - z `{{ .TokenHash }}`: przychodzi `?token_hash=...` → verifyOtp
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");

  const supabase = await createSupabaseServerClient();

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
    if (!error) redirect("/reset-hasla/nowe");
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect("/reset-hasla/nowe");
  }

  redirect("/reset-hasla?error=link");
}
