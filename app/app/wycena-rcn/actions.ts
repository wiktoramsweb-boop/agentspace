"use server";

import { revalidatePath } from "next/cache";
import { requireModul, zakresUzytkownika } from "@/lib/auth";
import { idZBiura } from "@/lib/agency-ids";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

/** Powiązanie wyceny z ofertą albo jego zdjęcie. Oferta musi być z tego biura. */
export async function powiazWycene(id: string, propertyId: string | null): Promise<{ ok: boolean; blad?: string }> {
  const user = await requireModul("nieruchomosci");
  const admin = createSupabaseAdmin();
  const oferta = propertyId ? await idZBiura(admin, "properties", propertyId, user.agency_id) : null;
  if (propertyId && !oferta) return { ok: false, blad: "Nie ma takiej oferty w Twoim biurze." };
  let q = admin.from("valuations").update({ property_id: oferta }).eq("id", id).eq("agency_id", user.agency_id);
  if (zakresUzytkownika(user) === "wlasne") q = q.eq("agent_id", user.id);
  const { error } = await q;
  if (error) return { ok: false, blad: "Nie udało się zapisać powiązania." };
  revalidatePath("/app/wycena-rcn/historia");
  if (oferta) revalidatePath(`/app/nieruchomosci/${oferta}`);
  return { ok: true };
}
