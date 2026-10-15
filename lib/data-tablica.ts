import { createSupabaseAdmin } from "./supabase/admin";
import { warsawToIso, addDaysKey, todayPL } from "./datetime";
import type { Client, Property, PropertyPhoto } from "./types";

/**
 * Dane tablic kanban. Zamknięte sprawy pokazujemy tylko z ostatnich tygodni,
 * bo kolumna „Zamknięty" z pięciu lat pracy biura zamieniłaby tablicę
 * w archiwum, w którym nie widać tego, co się dzieje dziś.
 */

const ZAMKNIETE_DNI = 30;
const WYGRANE_DNI = 60;

export type KartaKlienta = {
  id: string;
  kolumna: string;
  pos: number | null;
  name: string;
  type: string;
  budget_pln: number | null;
  agent_id: string | null;
  opiekun: string | null;
  phone: string | null;
  last_contact_at: string | null;
  next_contact_at: string | null;
  created_at: string;
  source: string | null;
};

export type KartaOferty = {
  id: string;
  kolumna: string;
  pos: number | null;
  title: string;
  price_pln: number | null;
  area_m2: number | null;
  rooms: number | null;
  city: string | null;
  deal_kind: string;
  agent_id: string | null;
  opiekun: string | null;
  zdjecie: string | null;
  od: string | null;
  /** Obniżka z ostatnich 30 dni w procentach, gdy była. */
  obnizka: number | null;
  status: string;
};

async function nazwiska(ids: (string | null)[]): Promise<Map<string, string>> {
  const lista = [...new Set(ids.filter((x): x is string => !!x))];
  if (!lista.length) return new Map();
  const { data } = await createSupabaseAdmin().from("profiles").select("id, full_name").in("id", lista);
  return new Map((data ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? "Agent"]));
}

export async function kartyKlientow(agencyId: string, filtr: { agent?: string | null } = {}): Promise<KartaKlienta[]> {
  const admin = createSupabaseAdmin();
  const granica = warsawToIso(addDaysKey(todayPL(), -ZAMKNIETE_DNI), "00:00") ?? new Date(0).toISOString();
  let q = admin
    .from("clients")
    .select("*")
    .eq("agency_id", agencyId)
    .or(`status.not.in.(zamkniety,stracony),updated_at.gte.${granica}`)
    .order("updated_at", { ascending: false })
    .limit(600);
  if (filtr.agent) q = q.eq("agent_id", filtr.agent);
  const { data } = await q;
  const rows = (data ?? []) as (Client & { kanban_pos?: number | null })[];
  const imiona = await nazwiska(rows.map((r) => r.agent_id));
  return rows.map((c) => ({
    id: c.id,
    kolumna: c.status,
    pos: c.kanban_pos ?? null,
    name: c.name,
    type: c.type,
    budget_pln: c.budget_pln,
    agent_id: c.agent_id,
    opiekun: c.agent_id ? imiona.get(c.agent_id) ?? null : null,
    phone: c.phone,
    last_contact_at: c.last_contact_at,
    next_contact_at: c.next_contact_at,
    created_at: c.created_at,
    source: (c as { source?: string | null }).source ?? null,
  }));
}

export async function kartyOfert(agencyId: string, filtr: { agent?: string | null } = {}): Promise<KartaOferty[]> {
  const admin = createSupabaseAdmin();
  const granica = warsawToIso(addDaysKey(todayPL(), -WYGRANE_DNI), "00:00") ?? new Date(0).toISOString();
  let q = admin
    .from("properties")
    .select("*")
    .eq("agency_id", agencyId)
    .or(`status.in.(aktywna,zarezerwowana),and(process_stage.eq.wygrana,updated_at.gte.${granica})`)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (filtr.agent) q = q.eq("agent_id", filtr.agent);
  const { data } = await q;
  const rows = (data ?? []) as (Property & { kanban_pos?: number | null })[];
  const imiona = await nazwiska(rows.map((r) => r.agent_id));

  // Obniżki z ostatnich 30 dni. Bez migracji v49 tabeli nie ma i plakietki
  // po prostu się nie pokazują.
  const obnizki = new Map<string, number>();
  if (rows.length) {
    const od = warsawToIso(addDaysKey(todayPL(), -30), "00:00") ?? new Date(0).toISOString();
    const { data: hist, error } = await admin
      .from("property_price_history")
      .select("property_id, old_price_pln, new_price_pln, changed_at")
      .eq("agency_id", agencyId)
      .gte("changed_at", od)
      .not("old_price_pln", "is", null)
      .in("property_id", rows.map((r) => r.id).slice(0, 300));
    if (!error) {
      for (const h of hist ?? []) {
        const stara = Number(h.old_price_pln);
        const nowa = Number(h.new_price_pln);
        if (stara > 0 && nowa < stara) {
          const proc = Math.round(((stara - nowa) / stara) * 100);
          obnizki.set(h.property_id as string, Math.max(obnizki.get(h.property_id as string) ?? 0, proc));
        }
      }
    }
  }

  return rows.map((p) => ({
    id: p.id,
    kolumna: p.process_stage ?? "przyjeta",
    pos: p.kanban_pos ?? null,
    title: p.title,
    price_pln: p.price_pln,
    area_m2: p.area_m2,
    rooms: p.rooms,
    city: p.city,
    deal_kind: p.deal_kind,
    agent_id: p.agent_id,
    opiekun: p.agent_id ? imiona.get(p.agent_id) ?? null : null,
    zdjecie: ((p.photos ?? []) as PropertyPhoto[])[0]?.url ?? null,
    od: p.process_changed_at ?? p.created_at,
    obnizka: obnizki.get(p.id) ?? null,
    status: p.status,
  }));
}
