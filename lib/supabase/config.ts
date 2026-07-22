/**
 * Publiczne wartości Supabase (URL + publishable/anon key).
 * Te wartości SĄ jawne z definicji — trafiają do bundla przeglądarki,
 * więc bezpiecznie trzymać je jako domyślne w kodzie. Env var (jeśli
 * ustawiony) ma pierwszeństwo — ułatwia zmianę projektu bez ruszania kodu.
 *
 * UWAGA: to NIE jest service_role (sekret) — ten zawsze z env.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://puowqbebsbmrcvoivkxb.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_gJ3quMP_AXvYZZ9EJcpWHQ_EWfz3jmf";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://agentspace.pl";
