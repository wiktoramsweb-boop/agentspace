import { createSupabaseAdmin } from "./supabase/admin";
import type { Property, Search } from "./types";

export type SearchRich = Search & {
  clientName: string | null;
  clientPhone: string | null;
  agentName: string | null;
};

/** Lista poszukiwań biura z nazwami klienta i agenta. */
export async function getSearches(
  agencyId: string,
  f: { status?: string; clientId?: string; limit?: number } = {},
): Promise<SearchRich[]> {
  const admin = createSupabaseAdmin();
  let q = admin
    .from("searches")
    .select("*")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(f.limit ?? 200);

  if (f.status) q = q.eq("status", f.status);
  if (f.clientId) q = q.eq("client_id", f.clientId);

  const { data, error } = await q;
  if (error || !data) return [];
  const rows = data as Search[];
  if (rows.length === 0) return [];

  const clientIds = [...new Set(rows.map((r) => r.client_id).filter(Boolean))] as string[];
  const agentIds = [...new Set(rows.map((r) => r.agent_id).filter(Boolean))] as string[];

  const [clients, agents] = await Promise.all([
    clientIds.length
      ? admin.from("clients").select("id, name, phone").in("id", clientIds)
      : Promise.resolve({ data: [] }),
    agentIds.length
      ? admin.from("profiles").select("id, full_name").in("id", agentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const cMap = new Map(
    ((clients.data ?? []) as { id: string; name: string; phone: string | null }[]).map((c) => [
      c.id,
      c,
    ]),
  );
  const aMap = new Map(
    ((agents.data ?? []) as { id: string; full_name: string | null }[]).map((a) => [
      a.id,
      a.full_name ?? "Agent",
    ]),
  );

  return rows.map((r) => ({
    ...r,
    clientName: r.client_id ? (cMap.get(r.client_id)?.name ?? null) : null,
    clientPhone: r.client_id ? (cMap.get(r.client_id)?.phone ?? null) : null,
    agentName: r.agent_id ? (aMap.get(r.agent_id) ?? null) : null,
  }));
}

export async function getSearch(id: string, agencyId: string): Promise<SearchRich | null> {
  const list = await getSearches(agencyId, { limit: 500 });
  return list.find((s) => s.id === id) ?? null;
}

/** Aktywne oferty biura - baza do liczenia dopasowań. */
export async function getActiveProperties(agencyId: string): Promise<Property[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("properties")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("status", "aktywna")
    .limit(500);
  return (data ?? []) as Property[];
}

/** Zapisane decyzje agenta wobec dopasowań (wysłane / odrzucone / itd.). */
export async function getMatchStatuses(
  agencyId: string,
  searchId?: string,
): Promise<Map<string, string>> {
  const admin = createSupabaseAdmin();
  let q = admin.from("search_matches").select("search_id, property_id, status").eq("agency_id", agencyId);
  if (searchId) q = q.eq("search_id", searchId);
  const { data } = await q;
  const map = new Map<string, string>();
  for (const r of (data ?? []) as { search_id: string; property_id: string; status: string }[]) {
    map.set(`${r.search_id}:${r.property_id}`, r.status);
  }
  return map;
}

/** Aktywne poszukiwania - do zakładki „Pasujące poszukiwania" na ofercie. */
export async function getActiveSearches(agencyId: string): Promise<SearchRich[]> {
  return getSearches(agencyId, { status: "aktualne", limit: 500 });
}
