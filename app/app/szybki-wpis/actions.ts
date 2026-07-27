"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { ClientType } from "@/lib/types";

export type QuickEntryPayload = {
  clientName: string;
  phone: string;
  clientType: ClientType;
  address: string;
  city: string;
  createProperty: boolean;
  propertyTitle: string;
  note: string;
};

export async function createQuickEntry(p: QuickEntryPayload): Promise<void> {
  const user = await requireUser();
  const name = p.clientName.trim();
  if (!name) return;

  const admin = createSupabaseAdmin();

  // 1) Klient
  const { data: client } = await admin
    .from("clients")
    .insert({
      agent_id: user.id,
      agency_id: user.agency_id,
      name,
      phone: p.phone.trim() || null,
      type: p.clientType,
      status: "w_kontakcie",
      address: p.address.trim() || null,
      city: p.city.trim() || null,
      notes: p.note.trim() || null,
      last_contact_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (!client) return;

  // 2) Notatka w osi czasu
  if (p.note.trim()) {
    await admin.from("client_notes").insert({
      client_id: client.id,
      agent_id: user.id,
      content: p.note.trim(),
    });
  }

  // 3) Nieruchomość powiązana z klientem (jeśli podano adres)
  if (p.createProperty && p.address.trim()) {
    await admin.from("properties").insert({
      agent_id: user.id,
      agency_id: user.agency_id,
      title: p.propertyTitle.trim() || `Nieruchomość ${p.address.trim()}`,
      deal_kind: "sprzedaz",
      property_type: "mieszkanie",
      status: "aktywna",
      address: p.address.trim() || null,
      city: p.city.trim() || null,
      owner_client_id: client.id,
    });
  }

  revalidatePath("/app/klienci");
  revalidatePath("/app/nieruchomosci");
  redirect(`/app/klienci/${client.id}`);
}
