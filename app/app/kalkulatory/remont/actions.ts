"use server";

import { revalidatePath } from "next/cache";
import { requireAktywny } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { idZBiura } from "@/lib/agency-ids";
import { maV49 } from "@/lib/schemat";
import { komunikatMigracji } from "@/lib/migracja";
import { policz, type Kosztorys } from "@/lib/remont";

type Wynik<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export type ZapisanyKosztorys = {
  id: string;
  title: string;
  total_gross_pln: number | null;
  updated_at: string;
  property_id: string | null;
};

function poprawny(k: unknown): k is Kosztorys {
  const x = k as Kosztorys;
  return !!x && Array.isArray(x.pomieszczenia) && x.pomieszczenia.length <= 40 && typeof x.standard === "string";
}

export async function zapiszKosztorys(
  k: Kosztorys,
  opcje: { id?: string; propertyId?: string | null },
): Promise<Wynik<{ id: string }>> {
  const user = await requireAktywny();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  if (!poprawny(k)) return { ok: false, error: "Nieprawidłowy kosztorys." };
  if (JSON.stringify(k).length > 100_000) return { ok: false, error: "Kosztorys jest za duży." };
  if (!(await maV49())) return { ok: false, error: komunikatMigracji() };

  const admin = createSupabaseAdmin();
  const propertyId = opcje.propertyId ? await idZBiura(admin, "properties", opcje.propertyId, user.agency_id) : null;
  const wiersz = {
    agency_id: user.agency_id,
    property_id: propertyId,
    title: (k.tytul || "Kosztorys remontu").slice(0, 200),
    data: k,
    total_gross_pln: policz(k).brutto,
    updated_at: new Date().toISOString(),
  };

  if (opcje.id) {
    const { data, error } = await admin
      .from("renovation_estimates")
      .update(wiersz)
      .eq("id", opcje.id)
      .eq("agency_id", user.agency_id)
      .select("id")
      .maybeSingle();
    if (error || !data) return { ok: false, error: "Nie udało się zapisać zmian." };
    revalidatePath("/app/kalkulatory/remont");
    return { ok: true, id: data.id };
  }

  const { data, error } = await admin
    .from("renovation_estimates")
    .insert({ ...wiersz, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Nie udało się zapisać kosztorysu." };
  revalidatePath("/app/kalkulatory/remont");
  return { ok: true, id: data.id };
}

export async function usunKosztorys(id: string): Promise<Wynik> {
  const user = await requireAktywny();
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("renovation_estimates")
    .select("id, created_by")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!data) return { ok: false, error: "Nie znaleziono kosztorysu." };
  if (user.role === "agent" && data.created_by !== user.id) return { ok: false, error: "Możesz usuwać tylko własne kosztorysy." };
  await admin.from("renovation_estimates").delete().eq("id", id).eq("agency_id", user.agency_id);
  revalidatePath("/app/kalkulatory/remont");
  return { ok: true };
}
