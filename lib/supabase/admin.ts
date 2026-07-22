import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — omija RLS. TYLKO server-side (API routes, server
 * actions). Cały dostęp do danych aplikacji idzie przez ten klient, a
 * autoryzację (kto może co) egzekwujemy w kodzie na podstawie sesji usera.
 * Klucz service_role NIGDY nie trafia do przeglądarki.
 */
export function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Brak SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY w env.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
