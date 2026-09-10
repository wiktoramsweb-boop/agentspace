"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { ClientStatus, ClientType } from "@/lib/types";

function floatOrNull(v: FormDataEntryValue | null): number | null {
  const n = parseFloat(String(v ?? "").replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Zbiera dodatkowe telefony/maile z pól o powtarzalnych nazwach. */
function listFrom(formData: FormData, key: string): { value: string; label?: string }[] {
  const values = formData.getAll(`${key}_value`).map(String);
  const labels = formData.getAll(`${key}_label`).map(String);
  return values
    .map((v, i) => ({ value: v.trim(), label: labels[i]?.trim() || undefined }))
    .filter((x) => x.value);
}

/** Wynik zapisu. Formularz zamyka się tylko przy powodzeniu. */
export type SaveResult = { ok: true } | { ok: false; error: string };

export async function createClient(formData: FormData): Promise<SaveResult> {
  const user = await requireUser();
  const txt = (k: string) => String(formData.get(k) ?? "").trim() || null;

  // Nazwa wyświetlana: z imienia i nazwiska, a gdy ich brak - z pola „name".
  const first = txt("first_name");
  const last = txt("last_name");
  const name = [first, last].filter(Boolean).join(" ") || String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Podaj imię i nazwisko albo nazwę kontaktu." };

  const admin = createSupabaseAdmin();
  const budget = parseInt(String(formData.get("budget") ?? "").replace(/\s/g, ""), 10);

  // Rdzeń zapisujemy zawsze; pola z v20 dokładamy osobno, żeby brak migracji
  // nie zablokował dodania klienta.
  const core = {
    agent_id: user.id,
    agency_id: user.agency_id,
    name,
    phone: txt("phone"),
    email: txt("email"),
    type: (String(formData.get("type") ?? "kupujacy") as ClientType),
    status: (String(formData.get("status") ?? "nowy") as ClientStatus),
    budget_pln: Number.isFinite(budget) ? budget : null,
    property: txt("property"),
    city: txt("city"),
    address: txt("address"),
    lat: floatOrNull(formData.get("lat")),
    lng: floatOrNull(formData.get("lng")),
    next_contact_at: String(formData.get("next_contact_at") ?? "") || null,
    last_contact_at: new Date().toISOString(),
  };

  const consent = formData.get("marketing_consent") === "1";
  const extra = {
    first_name: first,
    last_name: last,
    phones: listFrom(formData, "extra_phone"),
    emails: listFrom(formData, "extra_email"),
    pesel: txt("pesel"),
    nip: txt("nip"),
    id_document: txt("id_document"),
    company: txt("company"),
    position: txt("position"),
    source: txt("source"),
    country: txt("country") ?? "Polska",
    postal_code: txt("postal_code"),
    voivodeship: txt("voivodeship"),
    marketing_consent: consent,
    marketing_consent_at: consent ? new Date().toISOString() : null,
  };

  let { data, error } = await admin
    .from("clients")
    .insert({ ...core, ...extra })
    .select("id")
    .single();

  let lastError = error;
  if (error) {
    // Brak kolumn z migracji v20: zapisujemy sam rdzeń kontaktu, żeby agent
    // nie stracił wpisanych danych.
    const retry = await admin.from("clients").insert(core).select("id").single();
    data = retry.data;
    lastError = retry.error;
  }

  if (!data) {
    return {
      ok: false,
      error: `Nie udało się zapisać kontaktu: ${lastError?.message ?? "nieznany błąd"}`,
    };
  }

  revalidatePath("/app/klienci");
  redirect(`/app/klienci/${data.id}`);
}

/** Ustawia (lub czyści) datę następnego zaplanowanego kontaktu. */
export async function setNextContact(
  clientId: string,
  date: string | null,
): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin
    .from("clients")
    .update({ next_contact_at: date || null, updated_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("agency_id", user.agency_id);
  revalidatePath(`/app/klienci/${clientId}`);
  revalidatePath("/app/klienci");
  revalidatePath("/app");
}

export async function updateClientStatus(
  clientId: string,
  status: ClientStatus,
): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin
    .from("clients")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("agency_id", user.agency_id);
  revalidatePath(`/app/klienci/${clientId}`);
  revalidatePath("/app/klienci");
}

export async function addClientNote(clientId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  const admin = createSupabaseAdmin();
  await admin.from("client_notes").insert({
    client_id: clientId,
    agent_id: user.id,
    content,
  });
  // Aktualizuj "ostatni kontakt"
  await admin
    .from("clients")
    .update({ last_contact_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("agency_id", user.agency_id);

  revalidatePath(`/app/klienci/${clientId}`);
}

export async function markClientContacted(clientId: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  // Kontakt wykonany → czyścimy zaplanowane przypomnienie.
  await admin
    .from("clients")
    .update({
      last_contact_at: new Date().toISOString(),
      next_contact_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .eq("agency_id", user.agency_id);
  revalidatePath("/app");
  revalidatePath("/app/klienci");
}

export async function deleteClient(clientId: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin.from("clients").delete().eq("id", clientId).eq("agency_id", user.agency_id);
  revalidatePath("/app/klienci");
  redirect("/app/klienci");
}

/**
 * Czy ten numer jest już w bazie biura i kto jest opiekunem. Zwraca tylko
 * nazwisko opiekuna, nigdy dane klienta - działa więc także wtedy, gdy biuro
 * ukrywa agentom kontakty cudzych klientów.
 */
export async function lookupPhoneOwner(phone: string): Promise<{ owner: string | null } | null> {
  const user = await requireUser();
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!user.agency_id || digits.length < 7) return null;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("clients")
    .select("agent_id")
    .eq("agency_id", user.agency_id)
    .eq("phone_digits", digits)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;

  const { data: agent } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", data.agent_id)
    .maybeSingle();
  return { owner: agent?.full_name ?? agent?.email ?? null };
}
