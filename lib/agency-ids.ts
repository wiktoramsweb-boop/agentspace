import type { createSupabaseAdmin } from "./supabase/admin";

type Admin = ReturnType<typeof createSupabaseAdmin>;

/**
 * Zostawia tylko identyfikatory rekordów z danego biura.
 *
 * Formularze przysyłają ID klienta, oferty czy agenta z przeglądarki. Bez tej
 * kontroli ktoś mógłby podpiąć (i podejrzeć przez to imię i telefon) klienta
 * z innego biura albo podbić cele osobie spoza zespołu.
 */
export async function idsZBiura(
  admin: Admin,
  table: "clients" | "properties" | "profiles",
  ids: (string | null | undefined)[],
  agencyId: string | null,
): Promise<Set<string>> {
  const lista = [...new Set(ids.filter((x): x is string => !!x))];
  if (!agencyId || lista.length === 0) return new Set();
  const { data } = await admin.from(table).select("id").eq("agency_id", agencyId).in("id", lista);
  return new Set((data ?? []).map((r) => r.id as string));
}

/** Jedno ID: zwraca je, gdy należy do biura, w przeciwnym razie null. */
export async function idZBiura(
  admin: Admin,
  table: "clients" | "properties" | "profiles",
  id: string | null | undefined,
  agencyId: string | null,
): Promise<string | null> {
  if (!id) return null;
  return (await idsZBiura(admin, table, [id], agencyId)).has(id) ? id : null;
}
