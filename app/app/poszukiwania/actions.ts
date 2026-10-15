"use server";

import { idZBiura } from "@/lib/agency-ids";
import { mozeUsunac } from "@/lib/uprawnienia";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { brakKredytow } from "@/lib/kredyty";
import { getSearch, getActiveProperties } from "@/lib/data-searches";
import { findMatches } from "@/lib/matching";
import { getAgencySettings, matchTolerance } from "@/lib/agency-settings";
import { rankingAi, type WynikDopasowania } from "@/lib/ai/dopasowanie";

function num(v: FormDataEntryValue | null): number | null {
  const n = parseFloat(String(v ?? "").replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : null;
}

function int(v: FormDataEntryValue | null): number | null {
  const n = parseInt(String(v ?? "").replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

/** Wynik zapisu. Formularz zamyka się tylko przy powodzeniu. */
export type SaveResult = { ok: true } | { ok: false; error: string };

export async function createSearch(formData: FormData): Promise<SaveResult> {
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

  const clientId = await idZBiura(createSupabaseAdmin(), "clients", txt("client_id"), user.agency_id);
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

  const { data, error } = await admin.from("searches").insert(row).select("id").single();
  if (!data) {
    return {
      ok: false,
      error: `Nie udało się zapisać poszukiwania: ${error?.message ?? "nieznany błąd"}`,
    };
  }

  revalidatePath("/app/poszukiwania");
  redirect(`/app/poszukiwania/${data.id}`);
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
  const { data: rekord } = await admin
    .from("searches")
    .select("agent_id")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!rekord || !mozeUsunac(user, rekord)) redirect(`/app/poszukiwania/${id}`);
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

/**
 * Ranking AI ofert dla poszukiwania: kandydaci z reguł, kolejność z notatek
 * o kliencie. Płatne kredytami, bo każde wywołanie to zapytanie do modelu.
 */
export async function rankingDopasowan(
  searchId: string,
): Promise<{ ok: true; ranking: WynikDopasowania[] } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const search = await getSearch(searchId, user.agency_id);
  if (!search) return { ok: false, error: "Nie znaleziono poszukiwania." };

  const [properties, settings] = await Promise.all([
    getActiveProperties(user.agency_id),
    getAgencySettings(user.agency_id, user.agency?.name),
  ]);
  const kandydaci = findMatches(search, properties, matchTolerance(settings))
    .sort((a, b) => Number(b.fits) - Number(a.fits) || b.score - a.score)
    .slice(0, 25)
    .map((m) => m.property);
  if (kandydaci.length === 0) return { ok: false, error: "Nie ma ofert do ułożenia. Poszerz kryteria poszukiwania." };
  if (await brakKredytow(user, "dopasowanie_ai")) return { ok: false, error: "Skończyła się pula kredytów AI biura na ten miesiąc." };

  const notatki: string[] = [];
  if (search.client_id) {
    const admin = createSupabaseAdmin();
    const [{ data: klient }, { data: wpisy }] = await Promise.all([
      admin.from("clients").select("notes").eq("id", search.client_id).eq("agency_id", user.agency_id).maybeSingle(),
      admin.from("client_notes").select("content").eq("client_id", search.client_id).order("created_at", { ascending: false }).limit(12),
    ]);
    for (const w of wpisy ?? []) if (w.content) notatki.push(String(w.content).slice(0, 600));
    if (klient?.notes) notatki.push(String(klient.notes).slice(0, 1200));
  }

  try {
    return { ok: true, ranking: await rankingAi(search, notatki, kandydaci) };
  } catch (err) {
    console.error("rankingDopasowan:", err);
    return { ok: false, error: "AI chwilowo nie odpowiada. Spróbuj za chwilę." };
  }
}
