import { createSupabaseAdmin } from "./supabase/admin";
import { zakresDanych } from "./role";
import { ludzieKierownika } from "./oddzialy";

export type OsobaSzkolenia = { id: string; imie: string; rola: string; avatar: string | null; dolaczyl: string };

/**
 * Kogo widzi osoba z modułem „Szkolenie zespołu”: zakres „całe biuro”
 * (CEO, dyrektor albo ktoś z takim zakresem) widzi wszystkich, pozostali
 * swoich ludzi (przypisanych agentów i oddziały, którymi kierują).
 */
export async function ludzieSzkolenia(user: { id: string; agency_id: string | null; role: string; permissions?: unknown }): Promise<OsobaSzkolenia[]> {
  if (!user.agency_id) return [];
  const admin = createSupabaseAdmin();
  const caleBiuro = zakresDanych({ id: user.id, role: user.role, permissions: user.permissions as never }) === "wszystko";
  const ids = caleBiuro ? null : await ludzieKierownika(user.agency_id, user.id);
  let q = admin.from("profiles").select("id, full_name, email, role, avatar_path, created_at").eq("agency_id", user.agency_id).order("full_name");
  if (ids) q = q.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const { data } = await q;
  return ((data ?? []) as { id: string; full_name: string | null; email: string | null; role: string; avatar_path: string | null; created_at: string }[])
    .filter((p) => !["credit_advisor", "rental_manager"].includes(p.role) && p.role !== "accountant")
    .map((p) => ({ id: p.id, imie: p.full_name ?? p.email ?? "Osoba", rola: p.role, avatar: p.avatar_path, dolaczyl: p.created_at }));
}

/** Osoby, których wyniki ta osoba może oglądać, zawsze razem z nią samą. */
export async function osobyWZakresie(user: { id: string; agency_id: string | null; role: string; permissions?: unknown; full_name?: string | null; avatar_path?: string | null }): Promise<{ id: string; name: string; avatar: string | null }[]> {
  const inni = (await ludzieSzkolenia(user)).map((o) => ({ id: o.id, name: o.imie, avatar: o.avatar }));
  if (inni.some((o) => o.id === user.id)) return inni;
  return [{ id: user.id, name: user.full_name ?? "Ty", avatar: user.avatar_path ?? null }, ...inni];
}
