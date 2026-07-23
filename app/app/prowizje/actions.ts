"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { DealStatus } from "@/lib/types";

function num(v: FormDataEntryValue | null): number {
  const n = parseInt(String(v ?? "0").replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export async function createDeal(formData: FormData): Promise<void> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  // Prowizje od stron (już przeliczone na zł po stronie kalkulatora)
  const seller = num(formData.get("commission_seller"));
  const buyer = num(formData.get("commission_buyer"));
  const landlord = num(formData.get("commission_landlord"));
  const tenant = num(formData.get("commission_tenant"));
  const extras = num(formData.get("extras"));
  const extrasNote = String(formData.get("extras_note") ?? "").trim() || null;

  let split = num(formData.get("split"));
  if (split <= 0 || split > 100) split = user.default_split_pct ?? 50;

  // Prowizja łączna biura = suma stron. Zarobek agenta = jego % + dodatki (100% dla agenta).
  const officeTotal = seller + buyer + landlord + tenant;
  const agentEarnings = Math.round((officeTotal * split) / 100) + extras;

  const admin = createSupabaseAdmin();
  await admin.from("deals").insert({
    agent_id: user.id,
    agency_id: user.agency_id,
    title,
    property_id: String(formData.get("property_id") ?? "") || null,
    client_id: String(formData.get("client_id") ?? "") || null,
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

  revalidatePath("/app/prowizje");
  revalidatePath("/app");
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
