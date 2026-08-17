"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PROPERTY_TYPES, type PropertyDealKind, type PropertyStatus, type PropertyType } from "@/lib/types";

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

/** Pola z v17. Wydzielone, bo bez migracji trzeba je pominąć (patrz insertProperty). */
function extraFromForm(formData: FormData) {
  const txt = (k: string) => String(formData.get(k) ?? "").trim() || null;
  let features: Record<string, boolean> = {};
  try {
    const raw = String(formData.get("features") ?? "");
    if (raw) features = JSON.parse(raw);
  } catch {
    features = {};
  }
  return {
    headline: txt("headline"),
    market: txt("market"),
    ownership: txt("ownership"),
    building_type: txt("building_type"),
    condition_std: txt("condition_std"),
    heating: txt("heating"),
    available_from: txt("available_from"),
    floors_total: intOrNull(formData.get("floors_total")),
    year_built: intOrNull(formData.get("year_built")),
    plot_area_m2: floatOrNull(formData.get("plot_area_m2")),
    admin_fee_pln: floatOrNull(formData.get("admin_fee_pln")),
    deposit_pln: floatOrNull(formData.get("deposit_pln")),
    features,
    export_to_web: formData.get("export_to_web") === "1",
    export_to_portals: formData.get("export_to_portals") === "1",
    export_address_mode: txt("export_address_mode") ?? "ulica",
  };
}

/** Nazwa oferty, gdy agent jej nie wpisał: typ + miasto + metraż (jak w ASARI). */
function buildTitle(f: ReturnType<typeof propertyFromForm>): string {
  const typeLabel =
    PROPERTY_TYPES.find((t) => t.value === f.property_type)?.label ?? "Nieruchomość";
  const where = f.city || f.address || "";
  const size = f.area_m2 ? `${f.area_m2} m2` : "";
  return [typeLabel, where, size].filter(Boolean).join(", ");
}

/** Człon URL pod stronę www: mieszkanie-sprzedaz-47m2-krakow-soltysowska. */
function buildSlug(f: ReturnType<typeof propertyFromForm>, offerNo: string | null): string {
  const parts = [
    f.property_type,
    f.deal_kind,
    f.area_m2 ? `${Math.round(f.area_m2)}m2` : "",
    f.city ?? "",
    f.address ?? "",
    offerNo ?? "",
  ];
  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function createProperty(formData: FormData): Promise<void> {
  const user = await requireUser();
  const fields = propertyFromForm(formData);
  // Kreator nie wymaga nazwy: jeśli agent jej nie wpisał, układamy ją z danych.
  if (!fields.title) fields.title = buildTitle(fields);
  if (!fields.title) return;

  const admin = createSupabaseAdmin();
  const extra = extraFromForm(formData);

  // Numer oferty per biuro i rok (SP/2026/001). Gdy brak funkcji z v17,
  // po prostu pomijamy numer, żeby zapis się nie wywalił.
  const year = new Date().getFullYear();
  let offerNo: string | null = null;
  const { data: noData } = await admin.rpc("next_offer_no", {
    p_agency: user.agency_id,
    p_year: year,
  });
  if (typeof noData === "number") {
    offerNo = `SP/${year}/${String(noData).padStart(3, "0")}`;
  }

  const full = {
    agent_id: user.id,
    agency_id: user.agency_id,
    ...fields,
    ...extra,
    offer_no: offerNo,
    slug: buildSlug(fields, offerNo),
    web_published_at: extra.export_to_web ? new Date().toISOString() : null,
  };

  let { data, error } = await admin.from("properties").insert(full).select("id").single();

  // Brak migracji v17 = nieznane kolumny. Zapisujemy wtedy sam rdzeń oferty,
  // żeby agent nie stracił wprowadzonych danych podstawowych.
  if (error) {
    const retry = await admin
      .from("properties")
      .insert({ agent_id: user.id, agency_id: user.agency_id, ...fields })
      .select("id")
      .single();
    data = retry.data;
    error = retry.error;
  }

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
    .eq("agency_id", user.agency_id);

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
    .eq("agency_id", user.agency_id);
  revalidatePath(`/app/nieruchomosci/${id}`);
  revalidatePath("/app/nieruchomosci");
}

export async function deleteProperty(id: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin.from("properties").delete().eq("id", id).eq("agency_id", user.agency_id);
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
    .eq("agency_id", user.agency_id);
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
