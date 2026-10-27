import { createSupabaseAdmin } from "./supabase/admin";

/**
 * Oddziały biura (v54).
 *
 * Oddział to grupa ludzi z kierownikiem, nie osobne biuro: baza klientów
 * i ofert zostaje wspólna, a oddział porządkuje wyniki, pulę leadów
 * i poniedziałkowe podsumowanie kierownika. Przed migracją v54 wszystko
 * zwraca `ready: false` i aplikacja działa jak dotąd.
 */

export type Oddzial = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  manager_id: string | null;
};

export async function oddzialyBiura(agencyId: string | null): Promise<{ ready: boolean; lista: Oddzial[] }> {
  if (!agencyId) return { ready: true, lista: [] };
  const { data, error } = await createSupabaseAdmin()
    .from("branches")
    .select("id, name, city, address, phone, manager_id")
    .eq("agency_id", agencyId)
    .order("name");
  if (error) return { ready: false, lista: [] };
  return { ready: true, lista: (data ?? []) as Oddzial[] };
}

/** Osoba → oddział. Przed v54 pusta mapa. */
export async function oddzialOsob(agencyId: string): Promise<Map<string, string | null>> {
  const { data, error } = await createSupabaseAdmin().from("profiles").select("id, branch_id").eq("agency_id", agencyId);
  if (error) return new Map();
  return new Map(((data ?? []) as { id: string; branch_id: string | null }[]).map((p) => [p.id, p.branch_id]));
}

/** Oddziały, którymi kieruje osoba (menedżer może prowadzić więcej niż jeden). */
export async function oddzialyKierownika(agencyId: string | null, profileId: string): Promise<Oddzial[]> {
  const { ready, lista } = await oddzialyBiura(agencyId);
  return ready ? lista.filter((o) => o.manager_id === profileId) : [];
}

/**
 * Ludzie, których widzi kierownik: przypisani mu agenci (stary podział
 * na zespoły menedżerów) plus wszyscy z oddziałów, którymi kieruje.
 */
export async function ludzieKierownika(agencyId: string, profileId: string): Promise<string[]> {
  const admin = createSupabaseAdmin();
  const [oddzialy, { data: przypisani }] = await Promise.all([
    oddzialyKierownika(agencyId, profileId),
    admin.from("profiles").select("id").eq("agency_id", agencyId).eq("manager_id", profileId),
  ]);
  const ids = new Set(((przypisani ?? []) as { id: string }[]).map((p) => p.id));
  if (oddzialy.length) {
    const { data } = await admin.from("profiles").select("id").eq("agency_id", agencyId).in("branch_id", oddzialy.map((o) => o.id));
    for (const p of (data ?? []) as { id: string }[]) if (p.id !== profileId) ids.add(p.id);
  }
  return [...ids];
}
