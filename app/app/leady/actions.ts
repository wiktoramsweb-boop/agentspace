"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { cyfryTelefonu, type LeadZPliku } from "@/lib/leady-import";
import { zapiszLeadyZPliku, type WynikImportu } from "@/lib/data-leads";

export type Wynik = { ok: true } | { ok: false; error: string };

/** Zmiana jednego pola leada prosto z listy, bez wchodzenia w szczegóły. */
export async function ustawPoleLeada(
  id: string,
  pole: "status" | "agent_id" | "next_action_at" | "notes",
  wartosc: string | null,
): Promise<Wynik> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("leads")
    .update({ [pole]: wartosc || null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("agency_id", user.agency_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/leady");
  return { ok: true };
}

/** Przypisanie wielu leadów naraz: po imporcie rozdziela się je między zespół. */
export async function przypiszLeady(ids: string[], agentId: string | null): Promise<Wynik> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  if (!ids.length) return { ok: true };

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("leads")
    .update({ agent_id: agentId, updated_at: new Date().toISOString() })
    .in("id", ids)
    .eq("agency_id", user.agency_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/leady");
  return { ok: true };
}

export async function dodajLeadRecznie(formData: FormData): Promise<Wynik> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };

  const t = (k: string) => String(formData.get(k) ?? "").trim() || null;
  const phone = t("phone");
  if (!phone && !t("email")) {
    return { ok: false, error: "Podaj telefon albo e-mail, inaczej nie ma do kogo oddzwonić." };
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin.from("leads").insert({
    agency_id: user.agency_id,
    agent_id: t("agent_id") ?? user.id,
    name: t("name"),
    phone,
    phone_digits: cyfryTelefonu(phone),
    email: t("email"),
    city: t("city"),
    address: t("address"),
    message: t("message"),
    source: t("source") ?? "reczny",
    campaign: t("campaign"),
    status: "nowy",
    submitted_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/leady");
  return { ok: true };
}

export async function importujLeady(
  leady: LeadZPliku[],
  source: string,
  agentId: string | null,
): Promise<{ ok: true; wynik: WynikImportu } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  if (!Array.isArray(leady) || !leady.length) return { ok: false, error: "Plik nie zawiera leadów." };
  if (leady.length > 5000) return { ok: false, error: "Na raz przyjmujemy do 5000 leadów." };

  try {
    const wynik = await zapiszLeadyZPliku(user.agency_id, leady, source, agentId);
    revalidatePath("/app/leady");
    return { ok: true, wynik };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nie udało się wczytać." };
  }
}

/**
 * Lead, z którym coś wyszło, przechodzi do CRM jako klient.
 * To jest moment, w którym kończy się praca z leadem: dalej prowadzi się go
 * jak każdego innego klienta, z notatkami, działaniami i pipeline'em.
 */
export async function przeniesDoKlientow(id: string): Promise<Wynik> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };

  const admin = createSupabaseAdmin();
  const { data: lead } = await admin
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!lead) return { ok: false, error: "Nie znaleziono leada." };
  if (lead.client_id) return { ok: false, error: "Ten lead jest już w bazie klientów." };

  const { data: klient, error } = await admin
    .from("clients")
    .insert({
      agent_id: lead.agent_id ?? user.id,
      agency_id: user.agency_id,
      name: lead.name || lead.phone || "Kontakt bez nazwy",
      phone: lead.phone,
      email: lead.email,
      city: lead.city,
      address: lead.address,
      type: "sprzedajacy",
      status: "nowy",
      source: lead.source,
      notes: [lead.message, lead.notes].filter(Boolean).join("\n\n") || null,
    })
    .select("id")
    .single();

  if (error || !klient) {
    return { ok: false, error: `Nie udało się założyć klienta: ${error?.message ?? "nieznany błąd"}` };
  }

  await admin
    .from("leads")
    .update({ client_id: klient.id, status: "klient", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("agency_id", user.agency_id);

  revalidatePath("/app/leady");
  revalidatePath("/app/klienci");
  return { ok: true };
}

export async function usunLeady(ids: string[]): Promise<Wynik> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  if (user.role === "agent") return { ok: false, error: "Leady usuwa właściciel albo menedżer." };

  const admin = createSupabaseAdmin();
  const { error } = await admin.from("leads").delete().in("id", ids).eq("agency_id", user.agency_id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/leady");
  return { ok: true };
}
