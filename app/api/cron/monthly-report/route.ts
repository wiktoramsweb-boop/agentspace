import { cronUnauthorized } from "@/lib/cron-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendAgencyMonthlyReport } from "@/lib/report";

export const maxDuration = 300;

/**
 * Wysyła raport miesięczny do wszystkich właścicieli.
 * Uruchamiany przez Vercel Cron (patrz vercel.json).
 * Zabezpieczony CRON_SECRET (bez niego odmawia, patrz lib/cron-auth.ts).
 */
export async function GET(request: Request) {
  const denied = cronUnauthorized(request);
  if (denied) return denied;

  const admin = createSupabaseAdmin();
  const { data: agencies } = await admin.from("agencies").select("id");

  let sent = 0;
  for (const agency of agencies ?? []) {
    const ok = await sendAgencyMonthlyReport(agency.id);
    if (ok) sent += 1;
  }

  return Response.json({ ok: true, agencies: agencies?.length ?? 0, sent });
}
