"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { ClientStatus, ClientType } from "@/lib/types";

export async function createClient(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const admin = createSupabaseAdmin();
  const budget = parseInt(String(formData.get("budget") ?? "").replace(/\s/g, ""), 10);

  const { data } = await admin
    .from("clients")
    .insert({
      agent_id: user.id,
      agency_id: user.agency_id,
      name,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      type: (String(formData.get("type") ?? "kupujacy") as ClientType),
      status: (String(formData.get("status") ?? "nowy") as ClientStatus),
      budget_pln: Number.isFinite(budget) ? budget : null,
      property: String(formData.get("property") ?? "").trim() || null,
      last_contact_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  revalidatePath("/app/klienci");
  if (data) redirect(`/app/klienci/${data.id}`);
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
    .eq("agent_id", user.id);
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
    .eq("agent_id", user.id);

  revalidatePath(`/app/klienci/${clientId}`);
}

export async function markClientContacted(clientId: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin
    .from("clients")
    .update({ last_contact_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("agent_id", user.id);
  revalidatePath("/app");
  revalidatePath("/app/klienci");
}

export async function deleteClient(clientId: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin.from("clients").delete().eq("id", clientId).eq("agent_id", user.id);
  revalidatePath("/app/klienci");
  redirect("/app/klienci");
}
