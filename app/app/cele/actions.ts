"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

function num(v: FormDataEntryValue | null, fallback = 0): number {
  const n = parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export async function saveGoal(formData: FormData): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();

  const payload = {
    agent_id: user.id,
    agency_id: user.agency_id,
    annual_income_pln: Math.max(0, Math.round(num(formData.get("annualIncome"), 120000))),
    avg_commission_pln: Math.max(1000, Math.round(num(formData.get("avgCommission"), 8000))),
    workdays_per_week: Math.min(7, Math.max(1, Math.round(num(formData.get("workdays"), 5)))),
    calls_per_meeting: Math.max(1, num(formData.get("callsPerMeeting"), 12)),
    meetings_per_listing: Math.max(1, num(formData.get("meetingsPerListing"), 3)),
    listings_per_sale: Math.max(1, num(formData.get("listingsPerSale"), 1.6)),
    updated_at: new Date().toISOString(),
  };

  await admin.from("goals").upsert(payload, { onConflict: "agent_id" });
  revalidatePath("/app/cele");
  revalidatePath("/app");
}

/**
 * Zapisuje dzienną aktywność (upsert po agent+data).
 */
export async function saveTodayLog(formData: FormData): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  await admin.from("daily_logs").upsert(
    {
      agent_id: user.id,
      agency_id: user.agency_id,
      log_date: today,
      cold_calls: Math.max(0, Math.round(num(formData.get("cold_calls")))),
      meetings: Math.max(0, Math.round(num(formData.get("meetings")))),
      listings: Math.max(0, Math.round(num(formData.get("listings")))),
      buyers: Math.max(0, Math.round(num(formData.get("buyers")))),
      sales: Math.max(0, Math.round(num(formData.get("sales")))),
    },
    { onConflict: "agent_id,log_date" },
  );

  revalidatePath("/app/cele");
  revalidatePath("/app");
}
