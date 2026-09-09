import { createSupabaseAdmin } from "./supabase/admin";
import type { Activity } from "./types";

/** Działanie wzbogacone o nazwy powiązań (żeby lista nie robiła N+1 zapytań). */
export type ActivityRich = Activity & {
  clientName: string | null;
  propertyTitle: string | null;
  assigneeNames: string[];
};

type Filters = {
  status?: string;
  kind?: string;
  scope?: "all" | "mine";
  userId?: string;
  clientId?: string;
  propertyId?: string;
  limit?: number;
};

/**
 * Lista działań biura z nazwami powiązań. Nazwy dociągamy trzema zbiorczymi
 * zapytaniami zamiast pytać bazę o każdy wiersz osobno.
 */
export async function getActivities(agencyId: string, f: Filters = {}): Promise<ActivityRich[]> {
  const admin = createSupabaseAdmin();
  let q = admin
    .from("activities")
    .select("*")
    .eq("agency_id", agencyId)
    .order("due_at", { ascending: false, nullsFirst: false })
    .limit(f.limit ?? 200);

  if (f.status) q = q.eq("status", f.status);
  if (f.kind) q = q.eq("kind", f.kind);
  if (f.clientId) q = q.eq("client_id", f.clientId);
  if (f.propertyId) q = q.eq("property_id", f.propertyId);
  if (f.scope === "mine" && f.userId) q = q.contains("assignee_ids", [f.userId]);

  const { data, error } = await q;
  if (error || !data) return [];
  const rows = data as Activity[];
  if (rows.length === 0) return [];

  const clientIds = [...new Set(rows.map((r) => r.client_id).filter(Boolean))] as string[];
  const propertyIds = [...new Set(rows.map((r) => r.property_id).filter(Boolean))] as string[];
  const userIds = [...new Set(rows.flatMap((r) => r.assignee_ids ?? []))];

  const [clients, properties, profiles] = await Promise.all([
    clientIds.length
      ? admin.from("clients").select("id, name").in("id", clientIds)
      : Promise.resolve({ data: [] }),
    propertyIds.length
      ? admin.from("properties").select("id, title").in("id", propertyIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? admin.from("profiles").select("id, full_name").in("id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const cMap = new Map((clients.data ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
  const pMap = new Map(
    (properties.data ?? []).map((p: { id: string; title: string }) => [p.id, p.title]),
  );
  const uMap = new Map(
    (profiles.data ?? []).map((u: { id: string; full_name: string | null }) => [
      u.id,
      u.full_name ?? "Agent",
    ]),
  );

  return rows.map((r) => ({
    ...r,
    clientName: r.client_id ? (cMap.get(r.client_id) ?? null) : null,
    propertyTitle: r.property_id ? (pMap.get(r.property_id) ?? null) : null,
    assigneeNames: (r.assignee_ids ?? []).map((id) => uMap.get(id) ?? "Agent"),
  }));
}

/** Statystyki na górze listy (kafelki: zaplanowane, dziś, zaległe, wykonane w tym tygodniu). */
export async function getActivityStats(agencyId: string, userId: string) {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("activities")
    .select("status, due_at, assignee_ids, completed_at")
    .eq("agency_id", agencyId)
    .limit(2000);

  const rows = (data ?? []) as Pick<Activity, "status" | "due_at" | "assignee_ids" | "completed_at">[];
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 864e5).toISOString();

  const mine = rows.filter((r) => (r.assignee_ids ?? []).includes(userId));
  return {
    planned: mine.filter((r) => r.status === "zaplanowane").length,
    today: mine.filter((r) => r.status === "zaplanowane" && (r.due_at ?? "").slice(0, 10) === todayStr)
      .length,
    overdue: mine.filter(
      (r) => r.status === "zaplanowane" && r.due_at && r.due_at < now.toISOString(),
    ).length,
    doneWeek: mine.filter((r) => r.status === "wykonane" && (r.completed_at ?? "") > weekAgo).length,
  };
}

/** Lekka lista agentów biura do przypisywania działań. */
export async function getAgencyAgents(
  agencyId: string,
): Promise<{ id: string; name: string }[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("agency_id", agencyId)
    .order("full_name", { ascending: true });
  return (data ?? []).map((p: { id: string; full_name: string | null }) => ({
    id: p.id,
    name: p.full_name ?? "Agent",
  }));
}
