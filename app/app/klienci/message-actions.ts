"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { ClientMessage } from "@/lib/data-messages";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Zapis wiadomości przy kliencie. Wysłana wiadomość to kontakt, więc
 * przesuwa też datę ostatniego kontaktu - przypomnienia liczą się od niej.
 */
export async function addClientMessage(
  clientId: string,
  input: {
    channel: "mail" | "sms" | "inne";
    direction: "wyslana" | "otrzymana";
    subject?: string | null;
    body: string;
    sentAt?: string | null;
  },
): Promise<Result<{ message: ClientMessage }>> {
  const user = await requireUser();
  const body = String(input.body ?? "").trim();
  if (!body) return { ok: false, error: "Wpisz treść wiadomości." };

  const admin = createSupabaseAdmin();
  const { data: client } = await admin
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!client) return { ok: false, error: "Nie znaleziono klienta." };

  const sentAt = input.sentAt && !Number.isNaN(Date.parse(input.sentAt)) ? new Date(input.sentAt).toISOString() : new Date().toISOString();
  const row = {
    agency_id: user.agency_id,
    client_id: clientId,
    author_id: user.id,
    channel: ["mail", "sms", "inne"].includes(input.channel) ? input.channel : "mail",
    direction: input.direction === "otrzymana" ? "otrzymana" : "wyslana",
    subject: input.subject ? String(input.subject).trim().slice(0, 300) || null : null,
    body: body.slice(0, 20000),
    sent_at: sentAt,
  };

  const { data, error } = await admin
    .from("client_messages")
    .insert(row)
    .select("id, channel, direction, subject, body, sent_at")
    .single();
  if (error || !data) {
    return {
      ok: false,
      error: /client_messages/.test(error?.message ?? "")
        ? "Brak tabeli korespondencji. Uruchom w Supabase plik lib/SETUP-v23-dokumenty-korespondencja.sql."
        : `Nie udało się zapisać: ${error?.message ?? "nieznany błąd"}`,
    };
  }

  if (row.direction === "wyslana") {
    await admin
      .from("clients")
      .update({ last_contact_at: sentAt })
      .eq("id", clientId)
      .eq("agency_id", user.agency_id);
  }

  revalidatePath(`/app/klienci/${clientId}`);
  return { ok: true, message: { ...data, authorName: user.full_name ?? null } as ClientMessage };
}

export async function deleteClientMessage(id: string): Promise<Result> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("client_messages")
    .select("id, client_id")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!data) return { ok: false, error: "Nie znaleziono wiadomości." };
  await admin.from("client_messages").delete().eq("id", id).eq("agency_id", user.agency_id);
  revalidatePath(`/app/klienci/${data.client_id}`);
  return { ok: true };
}
