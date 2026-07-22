"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { DealStatus } from "@/lib/types";

export async function createDeal(formData: FormData): Promise<void> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const commission = parseInt(
    String(formData.get("commission") ?? "0").replace(/\s/g, ""),
    10,
  );

  const admin = createSupabaseAdmin();
  await admin.from("deals").insert({
    agent_id: user.id,
    agency_id: user.agency_id,
    title,
    commission_pln: Number.isFinite(commission) ? commission : 0,
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
