import { createClient } from "@supabase/supabase-js";

/**
 * Server-side klient z service_role key.
 * Tylko w API routes — NIGDY w client components.
 * Service role omija RLS, więc możemy zapisywać dane od użytkowników
 * bez konieczności rzutu autoryzacji.
 */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Brak zmiennych SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. " +
        "Ustaw je w .env.local oraz w Vercel Environment Variables.",
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
