import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Supabase client dla Server Components / Server Actions / Route Handlers.
 * Używa sesji użytkownika (cookies) — RLS enforced z perspektywy usera.
 * Do operacji auth (login, signup, getUser).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll wywołany z Server Component — można zignorować
            // jeśli middleware odświeża sesję.
          }
        },
      },
    },
  );
}
