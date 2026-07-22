import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client dla Server Components / Server Actions / Route Handlers.
 * Używa sesji użytkownika (cookies) — RLS enforced z perspektywy usera.
 * Do operacji auth (login, signup, getUser).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
