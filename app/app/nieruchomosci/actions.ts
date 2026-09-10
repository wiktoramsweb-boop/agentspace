"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PROPERTY_TYPES, type PropertyDealKind, type PropertyStatus, type PropertyType } from "@/lib/types";
import { sanitizePhotos } from "@/lib/property-photos";
import { getAgencySettings } from "@/lib/agency-settings";
import { PHOTO_BUCKET } from "@/lib/storage";
import { removeFiles } from "@/lib/storage-server";

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

/** Wynik zapisu. Kreator zamyka się tylko przy powodzeniu. */
export type SaveResult = { ok: true } | { ok: false; error: string };

export async function createProperty(formData: FormData): Promise<SaveResult> {
  const user = await requireUser();
  const fields = propertyFromForm(formData);
  // Kreator nie wymaga nazwy: jeśli agent jej nie wpisał, układamy ją z danych.
  if (!fields.title) fields.title = buildTitle(fields);
  if (!fields.title) {
    return { ok: false, error: "Uzupełnij nazwę oferty albo typ, miasto i metraż." };
  }

  const admin = createSupabaseAdmin();
  const extra = extraFromForm(formData);

  // Numer oferty per biuro i rok, np. SP/2026/001. Prefiks z ustawień biura,
  // żeby inne biura nie dostawały numerów „SP". Gdy brak funkcji z v17,
  // pomijamy numer, żeby zapis się nie wywalił.
  const settings = await getAgencySettings(user.agency_id, user.agency?.name);
  const year = new Date().getFullYear();
  let offerNo: string | null = null;
  if (settings.options.auto_numbering) {
    const { data: noData } = await admin.rpc("next_offer_no", {
      p_agency: user.agency_id,
      p_year: year,
    });
    if (typeof noData === "number") {
      offerNo = `${settings.options.offer_prefix}/${year}/${String(noData).padStart(3, "0")}`;
    }
  }

  // Zdjęcia wgrane w kreatorze. Przepuszczamy tylko pliki z folderu biura.
  let photos: ReturnType<typeof sanitizePhotos> = [];
  try {
    photos = user.agency_id
      ? sanitizePhotos(JSON.parse(String(formData.get("photos") ?? "[]")), user.agency_id)
      : [];
  } catch {
    photos = [];
  }

  const full = {
    agent_id: user.id,
    agency_id: user.agency_id,
    ...fields,
    ...extra,
    photos,
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

  if (!data) {
    return {
      ok: false,
      error: `Nie udało się zapisać oferty: ${error?.message ?? "nieznany błąd"}`,
    };
  }

  revalidatePath("/app/nieruchomosci");
  redirect(`/app/nieruchomosci/${data.id}`);
}

/**
 * Edycja oferty z kreatora: wszystkie pola, udogodnienia, publikacja i zdjęcia.
 * Pliki zdjęć usunięte w edycji kasujemy z magazynu dopiero po udanym zapisie.
 */
export async function updateProperty(id: string, formData: FormData): Promise<SaveResult> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const fields = propertyFromForm(formData);
  if (!fields.title) fields.title = buildTitle(fields);
  if (!fields.title) {
    return { ok: false, error: "Uzupełnij nazwę oferty albo typ, miasto i metraż." };
  }

  const admin = createSupabaseAdmin();
  const { data: before } = await admin
    .from("properties")
    .select("photos, export_to_web, web_published_at")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!before) return { ok: false, error: "Nie znaleziono oferty." };

  let photos: ReturnType<typeof sanitizePhotos> = [];
  try {
    photos = sanitizePhotos(JSON.parse(String(formData.get("photos") ?? "[]")), user.agency_id);
  } catch {
    photos = (before.photos ?? []) as ReturnType<typeof sanitizePhotos>;
  }

  const extra = extraFromForm(formData);
  const now = new Date().toISOString();
  const full = {
    ...fields,
    ...extra,
    photos,
    // Data publikacji na stronie ustawiana przy pierwszym włączeniu eksportu.
    web_published_at: extra.export_to_web ? before.web_published_at ?? now : null,
    updated_at: now,
  };

  let { error } = await admin.from("properties").update(full).eq("id", id).eq("agency_id", user.agency_id);
  if (error) {
    // Brak kolumn z v17: zapisujemy przynajmniej rdzeń oferty.
    const retry = await admin
      .from("properties")
      .update({ ...fields, updated_at: now })
      .eq("id", id)
      .eq("agency_id", user.agency_id);
    error = retry.error;
    if (error) return { ok: false, error: `Nie udało się zapisać zmian: ${error.message}` };
  } else {
    const keep = new Set(photos.flatMap((p) => [p.path, p.original_path]).filter(Boolean));
    const dropped = ((before.photos ?? []) as { path?: string; original_path?: string }[])
      .flatMap((p) => [p.path, p.original_path])
      .filter((p): p is string => !!p && !keep.has(p) && p.startsWith(`${user.agency_id}/`));
    await removeFiles(PHOTO_BUCKET, [...new Set(dropped)]);
  }

  revalidatePath(`/app/nieruchomosci/${id}`);
  revalidatePath("/app/nieruchomosci");
  return { ok: true };
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

  // Zdjęcia oferty kasujemy razem z nią, inaczej zostałyby w magazynie na zawsze.
  const { data: prop } = await admin
    .from("properties")
    .select("photos")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();

  const { error } = await admin.from("properties").delete().eq("id", id).eq("agency_id", user.agency_id);
  if (!error && prop && user.agency_id) {
    const files = ((prop.photos ?? []) as { path?: string; original_path?: string }[])
      .flatMap((p) => [p.path, p.original_path])
      .filter((p): p is string => !!p && p.startsWith(`${user.agency_id}/`));
    await removeFiles(PHOTO_BUCKET, [...new Set(files)]);
  }
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

/**
 * Sprawdza, że oferta należy do biura zalogowanego użytkownika.
 * Tabela property_interests nie ma kolumny agency_id, więc bez tego ktoś
 * z innego biura mógłby modyfikować powiązania, znając identyfikator oferty.
 */
async function ownsProperty(
  admin: ReturnType<typeof createSupabaseAdmin>,
  propertyId: string,
  agencyId: string | null,
): Promise<boolean> {
  if (!agencyId) return false;
  const { data } = await admin
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("agency_id", agencyId)
    .maybeSingle();
  return !!data;
}

/** Dodaj klienta jako zainteresowanego ofertą (kupujący/najemca). */
export async function addPropertyInterest(
  propertyId: string,
  clientId: string,
): Promise<void> {
  const user = await requireUser();
  if (!clientId) return;
  const admin = createSupabaseAdmin();
  if (!(await ownsProperty(admin, propertyId, user.agency_id))) return;
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
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  if (!(await ownsProperty(admin, propertyId, user.agency_id))) return;
  await admin
    .from("property_interests")
    .delete()
    .eq("property_id", propertyId)
    .eq("client_id", clientId);
  revalidatePath(`/app/nieruchomosci/${propertyId}`);
}

/** Rola powiązanego klienta: właściciel przy sprzedaży, wynajmujący przy najmie. */
export async function setPropertyOwnerRole(propertyId: string, role: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin
    .from("properties")
    .update({ owner_role: role, updated_at: new Date().toISOString() })
    .eq("id", propertyId)
    .eq("agency_id", user.agency_id);
  revalidatePath(`/app/nieruchomosci/${propertyId}`);
}

/**
 * Zakłada klienta i od razu przypina go do oferty. Agent stojący u klienta
 * nie musi przełączać się do modułu Klienci, żeby dopisać właściciela.
 */
export async function attachNewOwner(
  propertyId: string,
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const name = String(formData.get("owner_name") ?? "").trim();
  if (!name) return;
  const phone = String(formData.get("owner_phone") ?? "").trim() || null;
  const role = String(formData.get("owner_role") ?? "wlasciciel");

  const admin = createSupabaseAdmin();
  const { data: client } = await admin
    .from("clients")
    .insert({
      agent_id: user.id,
      agency_id: user.agency_id,
      name,
      phone,
      type: role === "wynajmujacy" ? "wynajmujacy" : "sprzedajacy",
      status: "w_kontakcie",
      last_contact_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (client) {
    await admin
      .from("properties")
      .update({ owner_client_id: client.id, owner_role: role, updated_at: new Date().toISOString() })
      .eq("id", propertyId)
      .eq("agency_id", user.agency_id);
  }

  revalidatePath(`/app/nieruchomosci/${propertyId}`);
  revalidatePath("/app/klienci");
}

/** Etap procesu obsługi oferty (pasek na karcie). */
export async function setProcessStage(propertyId: string, stage: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin
    .from("properties")
    .update({
      process_stage: stage,
      process_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId)
    .eq("agency_id", user.agency_id);
  revalidatePath(`/app/nieruchomosci/${propertyId}`);
}
