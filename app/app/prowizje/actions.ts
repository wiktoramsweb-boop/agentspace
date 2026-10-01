"use server";

import { idZBiura } from "@/lib/agency-ids";
import { mozeEdytowacTransakcje } from "@/lib/uprawnienia";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { DealStatus } from "@/lib/types";

function num(v: FormDataEntryValue | null): number {
  const n = parseInt(String(v ?? "0").replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** Wynik zapisu. Modal zamyka się tylko przy ok, inaczej pokazuje powód. */
export type SaveResult = { ok: true } | { ok: false; error: string };

export async function createDeal(formData: FormData): Promise<SaveResult> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Podaj opis transakcji." };

  // Prowizje od stron (już przeliczone na zł po stronie kalkulatora)
  const seller = num(formData.get("commission_seller"));
  const buyer = num(formData.get("commission_buyer"));
  const landlord = num(formData.get("commission_landlord"));
  const tenant = num(formData.get("commission_tenant"));
  const extras = num(formData.get("extras"));
  const extrasNote = String(formData.get("extras_note") ?? "").trim() || null;

  let split = num(formData.get("split"));
  if (split <= 0 || split > 100) split = user.default_split_pct ?? 50;

  // Prowizja biura (brutto) = suma stron. Agent liczony od NETTO (bez 23% VAT).
  const officeTotal = seller + buyer + landlord + tenant;
  const netto = officeTotal / 1.23;
  const agentEarnings = Math.round((netto * split) / 100) + extras;

  const admin = createSupabaseAdmin();
  const [propertyId, clientId] = await Promise.all([
    idZBiura(admin, "properties", String(formData.get("property_id") ?? ""), user.agency_id),
    idZBiura(admin, "clients", String(formData.get("client_id") ?? ""), user.agency_id),
  ]);
  const { error: insertError } = await admin.from("deals").insert({
    agent_id: user.id,
    agency_id: user.agency_id,
    title,
    property_id: propertyId,
    client_id: clientId,
    transaction_value_pln: num(formData.get("transaction_value")) || null,
    commission_seller_pln: seller,
    commission_buyer_pln: buyer,
    commission_landlord_pln: landlord,
    commission_tenant_pln: tenant,
    extras_pln: extras,
    extras_note: extrasNote,
    agent_split_pct: split,
    commission_pln: officeTotal,
    agent_earnings_pln: agentEarnings,
    status: "w_toku",
    expected_close: String(formData.get("expectedClose") ?? "") || null,
  });

  // Bez tego nieudany zapis zamykał modal tak samo jak udany.
  if (insertError) {
    return { ok: false, error: `Nie udało się zapisać transakcji: ${insertError.message}` };
  }

  revalidatePath("/app/prowizje");
  revalidatePath("/app");
  return { ok: true };
}

export async function setDealStatus(dealId: string, status: DealStatus): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  const closedAt = status === "zamkniety" ? new Date().toISOString() : null;
  await admin
    .from("deals")
    .update({ status, closed_at: closedAt })
    .eq("id", dealId)
    .eq("agent_id", user.id);
  revalidatePath("/app/prowizje");
  revalidatePath("/app");
}

export async function deleteDeal(dealId: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin.from("deals").delete().eq("id", dealId).eq("agent_id", user.id);
  revalidatePath("/app/prowizje");
  revalidatePath("/app");
}

/** Zapis karty transakcji (etapy + dokumenty). Autozapis z detalu transakcji. */
export async function updateTransactionCard(
  dealId: string,
  card: unknown,
): Promise<{ error?: string } | undefined> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();

  const { data: deal } = await admin
    .from("deals")
    .select("agent_id")
    .eq("id", dealId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!deal || !mozeEdytowacTransakcje(user, deal)) {
    return { error: "Tę kartę prowadzi opiekun transakcji. Nie masz uprawnień do zmian." };
  }

  // count: bez niego zapis, który nie trafił w żaden wiersz, wyglądał jak udany.
  const { error, count } = await admin
    .from("deals")
    .update({ transaction_card: card }, { count: "exact" })
    .eq("id", dealId)
    .eq("agency_id", user.agency_id);
  if (error) {
    return { error: "Nie zapisano. Uruchom w Supabase migrację SETUP-v15 (kolumna transaction_card)." };
  }
  if (!count) return { error: "Nie zapisano: nie znaleziono transakcji." };
  revalidatePath(`/app/prowizje/${dealId}`);
  return {};
}
