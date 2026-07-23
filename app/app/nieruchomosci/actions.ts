"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { PropertyDealKind, PropertyStatus, PropertyType } from "@/lib/types";

function intOrNull(v: FormDataEntryValue | null): number | null {
  const n = parseInt(String(v ?? "").replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function floatOrNull(v: FormDataEntryValue | null): number | null {
  const n = parseFloat(String(v ?? "").replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : null;
}

function propertyFromForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    deal_kind: String(formData.get("deal_kind") ?? "sprzedaz") as PropertyDealKind,
    property_type: String(formData.get("property_type") ?? "mieszkanie") as PropertyType,
    status: String(formData.get("status") ?? "aktywna") as PropertyStatus,
    city: String(formData.get("city") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    lat: floatOrNull(formData.get("lat")),
    lng: floatOrNull(formData.get("lng")),
    price_pln: intOrNull(formData.get("price")),
    area_m2: floatOrNull(formData.get("area")),
    rooms: intOrNull(formData.get("rooms")),
    floor: intOrNull(formData.get("floor")),
    description: String(formData.get("description") ?? "").trim() || null,
    owner_client_id: String(formData.get("owner_client_id") ?? "") || null,
  };
}

export async function createProperty(formData: FormData): Promise<void> {
  const user = await requireUser();
  const fields = propertyFromForm(formData);
  if (!fields.title) return;

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("properties")
    .insert({ agent_id: user.id, agency_id: user.agency_id, ...fields })
    .select("id")
    .single();

  revalidatePath("/app/nieruchomosci");
  if (data) redirect(`/app/nieruchomosci/${data.id}`);
}

export async function updateProperty(id: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  const fields = propertyFromForm(formData);
  if (!fields.title) return;

  const admin = createSupabaseAdmin();
  await admin
    .from("properties")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("agent_id", user.id);

  revalidatePath(`/app/nieruchomosci/${id}`);
  revalidatePath("/app/nieruchomosci");
}

export async function setPropertyStatus(
  id: string,
  status: PropertyStatus,
): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin
    .from("properties")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("agent_id", user.id);
  revalidatePath(`/app/nieruchomosci/${id}`);
  revalidatePath("/app/nieruchomosci");
}

export async function deleteProperty(id: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin.from("properties").delete().eq("id", id).eq("agent_id", user.id);
  revalidatePath("/app/nieruchomosci");
  redirect("/app/nieruchomosci");
}

/** Powiąż/odłącz klienta-właściciela oferty. */
export async function setPropertyOwner(
  propertyId: string,
  clientId: string | null,
): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin
    .from("properties")
    .update({ owner_client_id: clientId, updated_at: new Date().toISOString() })
    .eq("id", propertyId)
    .eq("agent_id", user.id);
  revalidatePath(`/app/nieruchomosci/${propertyId}`);
}

/** Dodaj klienta jako zainteresowanego ofertą (kupujący/najemca). */
export async function addPropertyInterest(
  propertyId: string,
  clientId: string,
): Promise<void> {
  await requireUser();
  if (!clientId) return;
  const admin = createSupabaseAdmin();
  await admin
    .from("property_interests")
    .upsert(
      { property_id: propertyId, client_id: clientId },
      { onConflict: "property_id,client_id", ignoreDuplicates: true },
    );
  revalidatePath(`/app/nieruchomosci/${propertyId}`);
}

export async function removePropertyInterest(
  propertyId: string,
  clientId: string,
): Promise<void> {
  await requireUser();
  const admin = createSupabaseAdmin();
  await admin
    .from("property_interests")
    .delete()
    .eq("property_id", propertyId)
    .eq("client_id", clientId);
  revalidatePath(`/app/nieruchomosci/${propertyId}`);
}
