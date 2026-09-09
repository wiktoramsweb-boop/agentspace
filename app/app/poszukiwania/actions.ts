"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

function num(v: FormDataEntryValue | null): number | null {
  const n = parseFloat(String(v ?? "").replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : null;
}

function int(v: FormDataEntryValue | null): number | null {
  const n = parseInt(String(v ?? "").replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export async function createSearch(formData: FormData): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  const txt = (k: string) => String(formData.get(k) ?? "").trim() || null;

  // Numer poszukiwania per biuro i rok (PS/2026/001).
  const year = new Date().getFullYear();
  let searchNo: string | null = null;
  const { data: noData } = await admin.rpc("next_search_no", {
    p_agency: user.agency_id,
    p_year: year,
  });
  if (typeof noData === "number") searchNo = `PS/${year}/${String(noData).padStart(3, "0")}`;

  const types = formData.getAll("property_types").map(String).filter(Boolean);
  const locations = String(formData.get("locations") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let mustHave: Record<string, boolean> = {};
  try {
    const raw = String(formData.get("must_have") ?? "");
    if (raw) mustHave = JSON.parse(raw);
  } catch {
    mustHave = {};
  }

  const clientId = txt("client_id");
  const row = {
    agency_id: user.agency_id,
    agent_id: user.id,
    client_id: clientId,
    search_no: searchNo,
    title: txt("title"),
    deal_kind: txt("deal_kind") ?? "sprzedaz",
    property_types: types,
    price_min: num(formData.get("price_min")),
    price_max: num(formData.get("price_max")),
    area_min: num(formData.get("area_min")),
    area_max: num(formData.get("area_max")),
    rooms_min: int(formData.get("rooms_min")),
    rooms_max: int(formData.get("rooms_max")),
    floor_min: int(formData.get("floor_min")),
    floor_max: int(formData.get("floor_max")),
    year_built_min: int(formData.get("year_built_min")),
    locations,
    must_have: mustHave,
    status: txt("status") ?? "aktualne",
    notes: txt("notes"),
  };

  const { data } = await admin.from("searches").insert(row).select("id").single();

  revalidatePath("/app/poszukiwania");
  if (data) redirect(`/app/poszukiwania/${data.id}`);
}

export async function setSearchStatus(id: string, status: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin
    .from("searches")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("agency_id", user.agency_id);
  revalidatePath("/app/poszukiwania");
  revalidatePath(`/app/poszukiwania/${id}`);
}

export async function deleteSearch(id: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin.from("searches").delete().eq("id", id).eq("agency_id", user.agency_id);
  revalidatePath("/app/poszukiwania");
  redirect("/app/poszukiwania");
}

/** Decyzja agenta wobec dopasowania (wysłane klientowi, odrzucone itd.). */
export async function setMatchStatus(
  searchId: string,
  propertyId: string,
  status: string,
): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin.from("search_matches").upsert(
    {
      agency_id: user.agency_id,
      search_id: searchId,
      property_id: propertyId,
      status,
    },
    { onConflict: "search_id,property_id" },
  );
  revalidatePath(`/app/poszukiwania/${searchId}`);
}
