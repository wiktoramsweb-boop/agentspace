import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client dla Client Components (przeglądarka).
 * Używa publishable/anon key. Do operacji auth po stronie klienta.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
