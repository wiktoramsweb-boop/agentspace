import { createSupabaseAdmin } from "./supabase/admin";
import { partsPL, warsawToIso, addDaysKey, todayPL } from "./datetime";
import type { Activity } from "./types";

/** Działanie w kalendarzu: tylko to, co potrzebne do narysowania i dymka. */
export type CalendarEvent = {
  id: string;
  kind: Activity["kind"];
  status: Activity["status"];
  priority: Activity["priority"];
  subject: string;
  due_at: string;
  duration_s: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  clientName: string | null;
  propertyTitle: string | null;
  assignee_ids: string[];
  assigneeNames: string[];
};

/**
 * Działania z terminem w zakresie dni [fromKey, toKey] (czas polski).
 * agentId = null oznacza całe biuro.
 */
export async function getCalendarEvents(
  agencyId: string,
  fromKey: string,
  toKey: string,
  agentId: string | null,
): Promise<CalendarEvent[]> {
  const admin = createSupabaseAdmin();
  const from = warsawToIso(fromKey, "00:00");
  const to = warsawToIso(addDaysKey(toKey, 1), "00:00");
  if (!from || !to) return [];

  let q = admin
    .from("activities")
    .select(
      "id, kind, status, priority, subject, due_at, duration_s, contact_name, contact_phone, client_id, property_id, assignee_ids",
    )
    .eq("agency_id", agencyId)
    .gte("due_at", from)
    .lt("due_at", to)
    .order("due_at", { ascending: true })
    .limit(1500);
  if (agentId) q = q.contains("assignee_ids", [agentId]);

  const { data, error } = await q;
  if (error || !data) return [];

  const rows = data as (Pick<Activity, "client_id" | "property_id"> & Omit<CalendarEvent, "clientName" | "propertyTitle" | "assigneeNames">)[];
  const clientIds = [...new Set(rows.map((r) => r.client_id).filter(Boolean))] as string[];
  const propertyIds = [...new Set(rows.map((r) => r.property_id).filter(Boolean))] as string[];
  const userIds = [...new Set(rows.flatMap((r) => r.assignee_ids ?? []))];

  const [clients, properties, profiles] = await Promise.all([
    clientIds.length ? admin.from("clients").select("id, name").in("id", clientIds) : Promise.resolve({ data: [] }),
    propertyIds.length ? admin.from("properties").select("id, title").in("id", propertyIds) : Promise.resolve({ data: [] }),
    userIds.length ? admin.from("profiles").select("id, full_name").in("id", userIds) : Promise.resolve({ data: [] }),
  ]);
  const cMap = new Map((clients.data ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
  const pMap = new Map((properties.data ?? []).map((p: { id: string; title: string }) => [p.id, p.title]));
  const uMap = new Map(
    (profiles.data ?? []).map((u: { id: string; full_name: string | null }) => [u.id, u.full_name ?? "Agent"]),
  );

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    status: r.status,
    priority: r.priority,
    subject: r.subject,
    due_at: r.due_at,
    duration_s: r.duration_s,
    contact_name: r.contact_name,
    contact_phone: r.contact_phone,
    clientName: r.client_id ? cMap.get(r.client_id) ?? null : null,
    propertyTitle: r.property_id ? pMap.get(r.property_id) ?? null : null,
    assignee_ids: r.assignee_ids ?? [],
    assigneeNames: (r.assignee_ids ?? []).map((id) => uMap.get(id) ?? "Agent"),
  }));
}

export type CallInsights = {
  /** Ile dni obejmują statystyki. */
  days: number;
  total: number;
  /** Mapa ciepła: [dzień tygodnia 0-6][godzina 0-23] = liczba telefonów. */
  heat: number[][];
  byHour: number[];
  byWeekday: number[];
  /** Średnia pora telefonu w minutach od północy (null, gdy brak danych). */
  avgMinute: number | null;
  busiestHour: number | null;
  bestWeekday: number | null;
  /** Średnio telefonów w dniu, w którym w ogóle dzwonił. */
  perActiveDay: number;
  /** W tym tygodniu i w poprzednim - do strzałki trendu. */
  thisWeek: number;
  lastWeek: number;
  /** Porównanie z biurem (średnia pora i średnio na agenta). */
  office: { avgMinute: number | null; perAgent: number } | null;
};

type CallRow = { due_at: string | null; completed_at: string | null; assignee_ids: string[] | null; created_by: string | null };

function aggregate(rows: CallRow[], days: number): Omit<CallInsights, "office"> {
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  const byHour = Array(24).fill(0) as number[];
  const byWeekday = Array(7).fill(0) as number[];
  const activeDays = new Set<string>();
  let minutes = 0;

  const today = todayPL();
  const monday = addDaysKey(today, -((new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7));
  const lastMonday = addDaysKey(monday, -7);
  let thisWeek = 0;
  let lastWeek = 0;

  for (const r of rows) {
    // Pora telefonu: termin wpisany przy działaniu, a gdy go brak - chwila odhaczenia.
    const p = partsPL(r.due_at ?? r.completed_at);
    if (!p) continue;
    heat[p.weekday][p.hour] += 1;
    byHour[p.hour] += 1;
    byWeekday[p.weekday] += 1;
    minutes += p.hour * 60 + p.minute;
    activeDays.add(p.dateKey);
    if (p.dateKey >= monday && p.dateKey <= today) thisWeek += 1;
    else if (p.dateKey >= lastMonday && p.dateKey < monday) lastWeek += 1;
  }

  const total = rows.length;
  const argmax = (arr: number[]) => {
    let best = -1;
    let idx: number | null = null;
    arr.forEach((v, i) => {
      if (v > best && v > 0) {
        best = v;
        idx = i;
      }
    });
    return idx;
  };

  return {
    days,
    total,
    heat,
    byHour,
    byWeekday,
    avgMinute: total ? Math.round(minutes / total) : null,
    busiestHour: argmax(byHour),
    bestWeekday: argmax(byWeekday),
    perActiveDay: activeDays.size ? Math.round((total / activeDays.size) * 10) / 10 : 0,
    thisWeek,
    lastWeek,
  };
}

/** Puste statystyki (konto bez biura albo brak danych). */
export function emptyInsights(days = 90): CallInsights {
  return {
    ...aggregate([], days),
    office: null,
  };
}

/**
 * Kiedy dzwonisz: wykonane telefony z ostatnich `days` dni, rozłożone na
 * godziny i dni tygodnia, plus porównanie z resztą biura.
 */
export async function getCallInsights(
  agencyId: string,
  agentId: string | null,
  days = 90,
): Promise<CallInsights> {
  const admin = createSupabaseAdmin();
  const since = warsawToIso(addDaysKey(todayPL(), -days), "00:00");

  const { data } = await admin
    .from("activities")
    .select("due_at, completed_at, assignee_ids, created_by")
    .eq("agency_id", agencyId)
    .eq("kind", "polaczenie")
    .eq("status", "wykonane")
    .gte("completed_at", since ?? "1970-01-01")
    .limit(5000);

  const all = (data ?? []) as CallRow[];
  const owner = (r: CallRow) => r.assignee_ids?.[0] ?? r.created_by;
  const mine = agentId ? all.filter((r) => owner(r) === agentId) : all;
  const base = aggregate(mine, days);

  let office: CallInsights["office"] = null;
  if (agentId) {
    const agg = aggregate(all, days);
    const agents = new Set(all.map(owner).filter(Boolean)).size || 1;
    office = { avgMinute: agg.avgMinute, perAgent: Math.round(all.length / agents) };
  }
  return { ...base, office };
}
