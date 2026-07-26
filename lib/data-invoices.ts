import { createSupabaseAdmin } from "./supabase/admin";
import type { Invoice } from "./invoice";

export async function getInvoices(agencyId: string): Promise<Invoice[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("invoices")
    .select("*")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Invoice[];
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("invoices").select("*").eq("id", id).maybeSingle();
  return (data as Invoice) ?? null;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Sugerowany numer faktury: {kolejny w miesiącu}/{MM}/{RRRR}. */
export async function getInvoiceNumberSuggestion(agencyId: string): Promise<string> {
  const admin = createSupabaseAdmin();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count } = await admin
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .gte("created_at", monthStart);
  const seq = (count ?? 0) + 1;
  return `${pad2(seq)}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
}
