"use server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Zgłoszenia z publicznej strony biura.
 *
 * Nie ma tu logowania, więc traktujemy wszystko jak dane od obcego: ucinamy
 * długości, sprawdzamy format i odrzucamy zgłoszenia bez kontaktu. Zapis idzie
 * do trzech miejsc: surowe zgłoszenie, kontakt w CRM i zadanie dla agenta.
 */

export type LeadResult = { ok: true } | { ok: false; error: string };

const KINDS = ["kontakt", "zglos", "poszukiwanie", "oferta"] as const;
export type SiteLeadKind = (typeof KINDS)[number];

const LABEL: Record<SiteLeadKind, string> = {
  kontakt: "Wiadomość ze strony",
  zglos: "Zgłoszenie nieruchomości",
  poszukiwanie: "Zlecenie poszukiwania",
  oferta: "Pytanie o ofertę",
};

function clean(v: FormDataEntryValue | null, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

export async function submitSiteLead(formData: FormData): Promise<LeadResult> {
  const agencyId = clean(formData.get("agency_id"), 64);
  const kindRaw = clean(formData.get("kind"), 20) as SiteLeadKind;
  const kind: SiteLeadKind = (KINDS as readonly string[]).includes(kindRaw) ? kindRaw : "kontakt";

  const name = clean(formData.get("name"), 120);
  const phone = clean(formData.get("phone"), 40);
  const email = clean(formData.get("email"), 160);
  const message = clean(formData.get("message"), 2000);

  if (!agencyId) return { ok: false, error: "Brak identyfikatora biura." };
  if (name.length < 3) return { ok: false, error: "Podaj imię i nazwisko." };
  if (!phone && !email) return { ok: false, error: "Zostaw telefon albo e-mail, żebyśmy mogli odpowiedzieć." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Sprawdź adres e-mail." };

  const admin = createSupabaseAdmin();

  // Biuro musi istnieć i mieć opublikowaną stronę: inaczej ktoś mógłby
  // wrzucać zgłoszenia do dowolnej agencji, znając jej identyfikator.
  const { data: site } = await admin
    .from("site_config")
    .select("agency_id, published")
    .eq("agency_id", agencyId)
    .maybeSingle();
  if (!site?.published) return { ok: false, error: "Ta strona nie przyjmuje w tej chwili zgłoszeń." };

  const meta: Record<string, string> = {};
  for (const k of ["address", "area", "what", "budget", "offer_no", "favorites"]) {
    const v = clean(formData.get(k), 300);
    if (v) meta[k] = v;
  }

  const { data: lead } = await admin
    .from("site_leads")
    .insert({ agency_id: agencyId, kind, name, phone: phone || null, email: email || null, message: message || null, meta })
    .select("id")
    .single();

  // Kontakt w CRM: jeśli numer już istnieje, nie dublujemy klienta.
  const digits = phone.replace(/\D/g, "");
  let clientId: string | null = null;

  if (digits.length >= 6) {
    const { data: existing } = await admin
      .from("clients")
      .select("id")
      .eq("agency_id", agencyId)
      .ilike("phone", `%${digits.slice(-9)}%`)
      .limit(1)
      .maybeSingle();
    clientId = (existing?.id as string) ?? null;
  }

  if (!clientId) {
    const { data: owner } = await admin
      .from("profiles")
      .select("id")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: created } = await admin
      .from("clients")
      .insert({
        agency_id: agencyId,
        agent_id: owner?.id ?? null,
        name,
        phone: phone || null,
        email: email || null,
        type: kind === "zglos" ? "sprzedajacy" : kind === "poszukiwanie" ? "kupujacy" : "inny",
        status: "nowy",
        source: "strona www",
        notes: message || null,
      })
      .select("id")
      .single();
    clientId = (created?.id as string) ?? null;
  }

  if (clientId) {
    await admin.from("site_leads").update({ client_id: clientId }).eq("id", lead?.id ?? "");

    const { data: agent } = await admin
      .from("clients")
      .select("agent_id")
      .eq("id", clientId)
      .maybeSingle();

    await admin.from("activities").insert({
      agency_id: agencyId,
      created_by: agent?.agent_id ?? null,
      kind: "zadanie",
      purpose: "kontakt_ze_strony",
      subject: `${LABEL[kind]}: ${name}`,
      description: [message, Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join("\n")].filter(Boolean).join("\n\n"),
      status: "zaplanowane",
      priority: "wysoki",
      due_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      client_id: clientId,
      contact_name: name,
      contact_phone: phone || null,
      contact_email: email || null,
      assignee_ids: agent?.agent_id ? [agent.agent_id] : [],
      include_in_report: true,
    });
  }

  return { ok: true };
}
