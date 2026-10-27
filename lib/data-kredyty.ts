import { createSupabaseAdmin } from "./supabase/admin";
import { zakresDanych, type Uprawnienia } from "./role";
import type { Dokument, EtapKredytu } from "./kredyt-etapy";

/**
 * Sprawy kredytowe: klient przekazany przez agenta doradcy kredytowemu biura.
 *
 * Kto widzi sprawę:
 *  - doradca: sprawy, które prowadzi,
 *  - agent: sprawy klientów, których przekazał albo jest ich opiekunem
 *    (musi wiedzieć, czy transakcja nie upadnie przez finansowanie),
 *  - osoby z zakresem „całe biuro” lub „zespół”: wszystkie sprawy biura.
 */

export type Osoba = { id: string; agency_id: string | null; role: string; permissions?: Uprawnienia | null };

export type SprawaKredytowa = {
  id: string;
  stage: EtapKredytu;
  rodzaj: string;
  amount_pln: number | null;
  bank: string | null;
  note: string | null;
  documents: Dokument[];
  bank_commission_pln: number | null;
  referral_fee_pln: number | null;
  created_at: string;
  updated_at: string;
  client: { id: string; name: string; phone: string | null; email: string | null; agent_id: string | null };
  property: { id: string; title: string } | null;
  doradca: { id: string; name: string; avatar: string | null } | null;
  polecajacy: { id: string; name: string; avatar: string | null } | null;
};

export type ZdarzenieSprawy = { id: string; kind: string; text: string; created_at: string; autor: string | null };

const POLA =
  "id, stage, rodzaj, amount_pln, bank, note, documents, bank_commission_pln, referral_fee_pln, created_at, updated_at, referred_by, advisor_id, client:clients(id, name, phone, email, agent_id), property:properties(id, title)";

type Wiersz = Omit<SprawaKredytowa, "doradca" | "polecajacy" | "client" | "property"> & {
  referred_by: string | null;
  advisor_id: string | null;
  client: SprawaKredytowa["client"] | null;
  property: SprawaKredytowa["property"];
};

function widzi(o: Osoba, w: Wiersz): boolean {
  if (zakresDanych(o) !== "wlasne") return true;
  return w.advisor_id === o.id || w.referred_by === o.id || w.client?.agent_id === o.id;
}

async function zOsobami(wiersze: Wiersz[]): Promise<SprawaKredytowa[]> {
  const ids = [...new Set(wiersze.flatMap((w) => [w.advisor_id, w.referred_by]).filter((x): x is string => Boolean(x)))];
  const { data } = ids.length ? await createSupabaseAdmin().from("profiles").select("id, full_name, avatar_path").in("id", ids) : { data: [] };
  const mapa = new Map(((data ?? []) as { id: string; full_name: string | null; avatar_path: string | null }[]).map((p) => [p.id, { id: p.id, name: p.full_name ?? "Osoba", avatar: p.avatar_path }]));
  return wiersze
    .filter((w) => w.client)
    .map(({ referred_by, advisor_id, ...w }) => ({
      ...w,
      client: w.client!,
      documents: Array.isArray(w.documents) ? w.documents : [],
      doradca: advisor_id ? mapa.get(advisor_id) ?? null : null,
      polecajacy: referred_by ? mapa.get(referred_by) ?? null : null,
    }));
}

/** Lista spraw widocznych dla osoby. `ready=false` przed migracją v53. */
export async function sprawyKredytowe(o: Osoba): Promise<{ ready: boolean; sprawy: SprawaKredytowa[] }> {
  if (!o.agency_id) return { ready: true, sprawy: [] };
  const { data, error } = await createSupabaseAdmin().from("credit_cases").select(POLA).eq("agency_id", o.agency_id).order("updated_at", { ascending: false }).limit(500);
  if (error) return { ready: false, sprawy: [] };
  return { ready: true, sprawy: await zOsobami(((data ?? []) as unknown as Wiersz[]).filter((w) => widzi(o, w))) };
}

export async function sprawaKredytowa(o: Osoba, id: string): Promise<{ sprawa: SprawaKredytowa; historia: ZdarzenieSprawy[] } | null> {
  if (!o.agency_id) return null;
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("credit_cases").select(POLA).eq("id", id).eq("agency_id", o.agency_id).maybeSingle();
  const w = data as unknown as Wiersz | null;
  if (!w || !widzi(o, w)) return null;
  const [sprawa] = await zOsobami([w]);
  if (!sprawa) return null;
  const { data: ev } = await admin.from("credit_case_events").select("id, kind, text, created_at, author_id").eq("case_id", id).order("created_at", { ascending: false }).limit(100);
  const autorzy = [...new Set(((ev ?? []) as { author_id: string | null }[]).map((e) => e.author_id).filter((x): x is string => Boolean(x)))];
  const { data: prof } = autorzy.length ? await admin.from("profiles").select("id, full_name").in("id", autorzy) : { data: [] };
  const imiona = new Map(((prof ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name]));
  return {
    sprawa,
    historia: ((ev ?? []) as { id: string; kind: string; text: string; created_at: string; author_id: string | null }[]).map((e) => ({
      id: e.id,
      kind: e.kind,
      text: e.text,
      created_at: e.created_at,
      autor: e.author_id ? imiona.get(e.author_id) ?? null : null,
    })),
  };
}

/** Sprawy jednego klienta (karta klienta): czy już jest w toku i na jakim etapie. */
export async function sprawyKlienta(o: Osoba, clientId: string): Promise<SprawaKredytowa[]> {
  if (!o.agency_id) return [];
  const { data, error } = await createSupabaseAdmin().from("credit_cases").select(POLA).eq("agency_id", o.agency_id).eq("client_id", clientId).order("created_at", { ascending: false });
  if (error) return [];
  return zOsobami(((data ?? []) as unknown as Wiersz[]).filter((w) => widzi(o, w)));
}

/** Doradcy kredytowi biura (do wyboru przy przekazaniu klienta). */
export async function doradcyBiura(agencyId: string | null): Promise<{ id: string; name: string; avatar: string | null }[]> {
  if (!agencyId) return [];
  const { data } = await createSupabaseAdmin().from("profiles").select("id, full_name, avatar_path").eq("agency_id", agencyId).eq("role", "credit_advisor");
  return ((data ?? []) as { id: string; full_name: string | null; avatar_path: string | null }[]).map((p) => ({ id: p.id, name: p.full_name ?? "Doradca", avatar: p.avatar_path }));
}
