"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { ClientMessage } from "@/lib/data-messages";
import { wyslijMailBiura } from "@/lib/poczta-biura";
import { hitLimit } from "@/lib/rate-limit";
import { brakTabeli, komunikatMigracji } from "@/lib/migracja";
import { SZABLONY_WBUDOWANE, type SzablonWiadomosci } from "@/lib/szablony-wiadomosci";

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

/**
 * Wysyłka maila prosto z karty klienta (v49).
 *
 * Nadawcą jest biuro (nazwa z Ustawień firmy), odpowiedź klienta wraca do
 * skrzynki agenta. Każdy mail zostaje w korespondencji ze statusem, więc
 * po tygodniu wiadomo, co poszło i czy w ogóle wyszło.
 */
export async function wyslijMailZKarty(
  clientId: string,
  temat: string,
  tresc: string,
): Promise<Result<{ message: ClientMessage }>> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  if (!temat.trim() || !tresc.trim()) return { ok: false, error: "Mail musi mieć temat i treść." };
  if (await hitLimit(`mail-klient:${user.id}`, 60, 3600)) {
    return { ok: false, error: "Wysłano już dużo maili w tej godzinie. Odczekaj chwilę." };
  }

  const admin = createSupabaseAdmin();
  const { data: client } = await admin
    .from("clients")
    .select("id, email, name, agent_id")
    .eq("id", clientId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!client) return { ok: false, error: "Nie znaleziono klienta." };
  if (!client.email) return { ok: false, error: "Klient nie ma adresu e-mail w karcie." };

  const wynik = await wyslijMailBiura({
    agencyId: user.agency_id,
    agencyName: user.agency?.name,
    do: client.email,
    temat,
    tresc,
    odpowiedzDo: user.email,
    podpis: { imie: user.full_name, telefon: user.phone },
  });

  const teraz = new Date().toISOString();
  const wiersz = {
    agency_id: user.agency_id,
    client_id: clientId,
    author_id: user.id,
    channel: "mail" as const,
    direction: "wyslana" as const,
    subject: temat.trim().slice(0, 300),
    body: tresc.trim().slice(0, 20000),
    sent_at: teraz,
  };
  const pola = "id, channel, direction, subject, body, sent_at";
  let { data, error } = await admin
    .from("client_messages")
    .insert({
      ...wiersz,
      status: wynik.ok ? "wyslana" : "blad",
      provider_id: wynik.ok ? wynik.id : null,
      error: wynik.ok ? null : wynik.error,
      to_address: client.email,
    })
    .select(pola)
    .single();
  // Przed migracją v49 nie ma kolumn statusu: zapisujemy sam ślad wiadomości.
  if (error) ({ data, error } = await admin.from("client_messages").insert(wiersz).select(pola).single());

  if (!wynik.ok) return { ok: false, error: `Mail nie wyszedł: ${wynik.error}` };
  await admin.from("clients").update({ last_contact_at: teraz, updated_at: teraz }).eq("id", clientId).eq("agency_id", user.agency_id);
  revalidatePath(`/app/klienci/${clientId}`);
  return {
    ok: true,
    message: { ...(data as Omit<ClientMessage, "authorName">), authorName: user.full_name ?? null, status: "wyslana" } as ClientMessage,
  };
}

export async function szablonyWiadomosci(): Promise<SzablonWiadomosci[]> {
  const user = await requireUser();
  const { data, error } = await createSupabaseAdmin()
    .from("message_templates")
    .select("id, channel, name, subject, body")
    .eq("agency_id", user.agency_id ?? "")
    .order("name", { ascending: true });
  const wlasne: SzablonWiadomosci[] = error
    ? []
    : (data ?? []).map((t) => ({
        id: t.id as string,
        kanal: (t.channel === "sms" ? "sms" : "mail") as "mail" | "sms",
        nazwa: t.name as string,
        temat: (t.subject as string | null) ?? undefined,
        tresc: t.body as string,
        wlasny: true,
      }));
  return [...wlasne, ...SZABLONY_WBUDOWANE];
}

export async function zapiszSzablon(input: { kanal: "mail" | "sms"; nazwa: string; temat?: string; tresc: string }): Promise<Result> {
  const user = await requireUser();
  const nazwa = input.nazwa.trim().slice(0, 80);
  if (!nazwa || !input.tresc.trim()) return { ok: false, error: "Szablon musi mieć nazwę i treść." };
  const { error } = await createSupabaseAdmin().from("message_templates").insert({
    agency_id: user.agency_id,
    channel: input.kanal,
    name: nazwa,
    subject: input.kanal === "mail" ? input.temat?.trim().slice(0, 200) || null : null,
    body: input.tresc.trim().slice(0, 5000),
    created_by: user.id,
  });
  if (error) return { ok: false, error: brakTabeli(error) ? komunikatMigracji() : error.message };
  return { ok: true };
}

export async function usunSzablon(id: string): Promise<Result> {
  const user = await requireUser();
  const { error } = await createSupabaseAdmin().from("message_templates").delete().eq("id", id).eq("agency_id", user.agency_id ?? "");
  return error ? { ok: false, error: error.message } : { ok: true };
}
