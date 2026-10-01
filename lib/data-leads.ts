import { createSupabaseAdmin } from "./supabase/admin";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "./types";
import { cyfryTelefonu, type LeadZPliku } from "./leady-import";

/** Filtry listy leadów. Puste znaczy „wszystkie". */
export type FiltrLeadow = {
  status?: string;
  agent?: string;
  source?: string;
  q?: string;
};

export type StatystykiLeadow = {
  razem: number;
  nowe: number;
  bezOpiekuna: number;
  doKontaktuDzis: number;
  wStatusach: Record<LeadStatus, number>;
  konwersja: number | null;
};

export async function getLeady(agencyId: string, f: FiltrLeadow = {}): Promise<Lead[]> {
  const admin = createSupabaseAdmin();
  let sel = admin.from("leads").select("*").eq("agency_id", agencyId);

  if (f.status) sel = sel.eq("status", f.status);
  if (f.source) sel = sel.eq("source", f.source);
  if (f.agent === "bez") sel = sel.is("agent_id", null);
  else if (f.agent) sel = sel.eq("agent_id", f.agent);
  if (f.q) {
    const cyfry = f.q.replace(/\D/g, "");
    sel =
      cyfry.length >= 3
        ? sel.or(`phone_digits.ilike.%${cyfry.slice(-9)}%,name.ilike.%${f.q}%,email.ilike.%${f.q}%`)
        : sel.or(`name.ilike.%${f.q}%,email.ilike.%${f.q}%,city.ilike.%${f.q}%,message.ilike.%${f.q}%`);
  }

  // Najnowsze zgłoszenia na górze: lead sprzed godziny jest wart więcej
  // niż sprzed tygodnia, bo człowiek jeszcze pamięta, że wypełniał formularz.
  const { data } = await sel.order("submitted_at", { ascending: false, nullsFirst: false }).limit(500);
  return (data ?? []) as Lead[];
}

export async function getStatystykiLeadow(agencyId: string): Promise<StatystykiLeadow> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("leads")
    .select("status, agent_id, next_action_at")
    .eq("agency_id", agencyId);
  const rows = (data ?? []) as { status: LeadStatus; agent_id: string | null; next_action_at: string | null }[];

  const wStatusach = Object.fromEntries(
    LEAD_STATUSES.map((s) => [s.value, rows.filter((r) => r.status === s.value).length]),
  ) as Record<LeadStatus, number>;

  const koniecDnia = new Date();
  koniecDnia.setHours(23, 59, 59, 999);

  const rozstrzygniete = wStatusach.klient + wStatusach.odrzucony;

  return {
    razem: rows.length,
    nowe: wStatusach.nowy,
    bezOpiekuna: rows.filter((r) => !r.agent_id).length,
    doKontaktuDzis: rows.filter(
      (r) => r.next_action_at && new Date(r.next_action_at) <= koniecDnia && r.status !== "klient" && r.status !== "odrzucony",
    ).length,
    wStatusach,
    konwersja: rozstrzygniete ? Math.round((wStatusach.klient / rozstrzygniete) * 100) : null,
  };
}

export type WynikImportu = {
  dodane: number;
  pominieteDuplikaty: number;
  bledy: number;
};

/**
 * Zapis leadów z pliku.
 *
 * Duplikaty odsiewamy na dwa sposoby: po identyfikatorze z pliku (ten sam plik
 * wgrany drugi raz) oraz po numerze telefonu (ta sama osoba z dwóch kampanii).
 * Drugi przypadek jest częstszy i to on ratuje agenta przed dzwonieniem
 * dwa razy do tej samej osoby.
 */
export async function zapiszLeadyZPliku(
  agencyId: string,
  leady: LeadZPliku[],
  source: string,
  agentId: string | null,
): Promise<WynikImportu> {
  const admin = createSupabaseAdmin();
  if (!leady.length) return { dodane: 0, pominieteDuplikaty: 0, bledy: 0 };

  const { data: istniejace } = await admin
    .from("leads")
    .select("phone_digits, external_id")
    .eq("agency_id", agencyId);
  const znaneNumery = new Set(
    ((istniejace ?? []) as { phone_digits: string | null }[]).map((r) => r.phone_digits).filter(Boolean),
  );
  const znaneId = new Set(
    ((istniejace ?? []) as { external_id: string | null }[]).map((r) => r.external_id).filter(Boolean),
  );

  const doDodania: Record<string, unknown>[] = [];
  let duplikaty = 0;
  const wTejPaczce = new Set<string>();

  for (const l of leady) {
    const cyfry = cyfryTelefonu(l.phone);
    const kluczId = l.external_id ?? null;
    const duplikat =
      (kluczId && (znaneId.has(kluczId) || wTejPaczce.has("id:" + kluczId))) ||
      (cyfry && (znaneNumery.has(cyfry) || wTejPaczce.has("tel:" + cyfry)));
    if (duplikat) {
      duplikaty++;
      continue;
    }
    if (kluczId) wTejPaczce.add("id:" + kluczId);
    if (cyfry) wTejPaczce.add("tel:" + cyfry);

    doDodania.push({
      agency_id: agencyId,
      agent_id: agentId,
      name: l.name,
      phone: l.phone,
      phone_digits: cyfry,
      email: l.email,
      city: l.city,
      address: l.address,
      message: l.message,
      source,
      campaign: l.campaign,
      ad_name: l.ad_name,
      form_name: l.form_name,
      platform: l.platform,
      external_id: l.external_id,
      submitted_at: l.submitted_at,
      raw: l.raw,
    });
  }

  if (!doDodania.length) return { dodane: 0, pominieteDuplikaty: duplikaty, bledy: 0 };

  // Wstawiamy paczkami: przy kilkuset leadach jedno zapytanie potrafi przekroczyć limit.
  let dodane = 0;
  let bledy = 0;
  for (let i = 0; i < doDodania.length; i += 200) {
    const { error, count } = await admin
      .from("leads")
      .insert(doDodania.slice(i, i + 200), { count: "exact" });
    if (error) bledy += Math.min(200, doDodania.length - i);
    else dodane += count ?? doDodania.slice(i, i + 200).length;
  }
  return { dodane, pominieteDuplikaty: duplikaty, bledy };
}
