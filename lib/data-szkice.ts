import { createSupabaseAdmin } from "./supabase/admin";
import type { Dane } from "./dokumenty/silnik";

export type Szkic = { id: string; wzorId: string; tytul: string; dane: Dane; klientId: string | null; ofertaId: string | null; zmieniony: string };

type Wiersz = { id: string; template: string; title: string; data: Dane; client_id: string | null; property_id: string | null; updated_at: string };

const zWiersza = (w: Wiersz): Szkic => ({ id: w.id, wzorId: w.template, tytul: w.title, dane: w.data, klientId: w.client_id, ofertaId: w.property_id, zmieniony: w.updated_at });

/** Szkice osoby, najnowsze na górze. `ready=false` przed migracją v54. */
export async function szkiceOsoby(agencyId: string | null, profileId: string): Promise<{ ready: boolean; lista: Szkic[] }> {
  if (!agencyId) return { ready: true, lista: [] };
  const { data, error } = await createSupabaseAdmin()
    .from("document_drafts")
    .select("id, template, title, data, client_id, property_id, updated_at")
    .eq("agency_id", agencyId)
    .eq("owner_id", profileId)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) return { ready: false, lista: [] };
  return { ready: true, lista: ((data ?? []) as Wiersz[]).map(zWiersza) };
}

export async function szkic(agencyId: string | null, profileId: string, id: string): Promise<Szkic | null> {
  if (!agencyId || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await createSupabaseAdmin()
    .from("document_drafts")
    .select("id, template, title, data, client_id, property_id, updated_at")
    .eq("id", id)
    .eq("agency_id", agencyId)
    .eq("owner_id", profileId)
    .maybeSingle();
  return data ? zWiersza(data as Wiersz) : null;
}
