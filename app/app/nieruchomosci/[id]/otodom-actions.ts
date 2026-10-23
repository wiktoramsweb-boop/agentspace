"use server";

import { revalidatePath } from "next/cache";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { zapiszZdarzenie } from "@/lib/dziennik";
import { odswiezStanOtodom, publikujNaOtodom, zmienStanOtodom, type WynikOperacji } from "@/lib/otodom/ogloszenia";

/** Publikować może agent prowadzący ofertę i zarząd biura. */
async function wolno(propertyId: string) {
  const user = await requireModul("nieruchomosci");
  const { data } = await createSupabaseAdmin().from("properties").select("id, agent_id, title").eq("id", propertyId).eq("agency_id", user.agency_id).maybeSingle();
  if (!data) return null;
  const zarzad = ["owner", "director", "manager"].includes(user.role);
  return zarzad || data.agent_id === user.id ? { user, tytul: data.title as string } : null;
}

export async function opublikujOtodom(propertyId: string, exact: boolean): Promise<WynikOperacji> {
  const w = await wolno(propertyId);
  if (!w) return { ok: false, bledy: ["Publikować może agent prowadzący tę ofertę albo zarząd biura."] };
  const r = await publikujNaOtodom(w.user.agency_id!, w.user.id, propertyId, exact);
  if (r.ok) await zapiszZdarzenie({ agencyId: w.user.agency_id!, actorId: w.user.id, akcja: "portal_publikacja", rodzaj: "oferta", id: propertyId, opis: `Wysłano na Otodom: ${w.tytul}`, meta: { portal: "otodom" } });
  revalidatePath(`/app/nieruchomosci/${propertyId}`);
  return r;
}

export async function zmienOtodom(propertyId: string, akcja: "activate" | "deactivate" | "delete"): Promise<WynikOperacji> {
  const w = await wolno(propertyId);
  if (!w) return { ok: false, bledy: ["Zmieniać ogłoszenie może agent prowadzący tę ofertę albo zarząd biura."] };
  const r = await zmienStanOtodom(w.user.agency_id!, w.user.id, propertyId, akcja);
  if (r.ok) await zapiszZdarzenie({ agencyId: w.user.agency_id!, actorId: w.user.id, akcja: `portal_${akcja}`, rodzaj: "oferta", id: propertyId, opis: `Otodom (${akcja}): ${w.tytul}`, meta: { portal: "otodom" } });
  revalidatePath(`/app/nieruchomosci/${propertyId}`);
  return r;
}

export async function odswiezOtodom(propertyId: string): Promise<void> {
  const w = await wolno(propertyId);
  if (!w) return;
  await odswiezStanOtodom(w.user.agency_id!, propertyId);
  revalidatePath(`/app/nieruchomosci/${propertyId}`);
}
