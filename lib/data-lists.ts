import { createSupabaseAdmin } from "./supabase/admin";
import { warsawToIso, addDaysKey } from "./datetime";
import type { ListQuery } from "./list-params";
import type { Client, Property, Activity } from "./types";

/**
 * Listy pobierane z bazy stroną po stronie, z filtrami i sortowaniem po
 * stronie serwera. Przy bazie z importu (tysiące kontaktów) przeglądarka nie
 * dostaje całej tabeli, tylko jedną stronę wyników.
 */

export type Page<T> = { rows: T[]; total: number; pages: number };

/** Zamienia tekst na bezpieczny wzorzec do ilike (bez znaków sterujących PostgREST). */
function like(q: string): string {
  return `%${q.replace(/[%,()*]/g, " ").trim()}%`;
}

function range(page: number, per: number): [number, number] {
  const from = (page - 1) * per;
  return [from, from + per - 1];
}

function dateBounds(q: ListQuery): { gte?: string; lt?: string } {
  const out: { gte?: string; lt?: string } = {};
  if (/^\d{4}-\d{2}-\d{2}$/.test(q.from)) out.gte = warsawToIso(q.from, "00:00") ?? undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(q.to)) out.lt = warsawToIso(addDaysKey(q.to, 1), "00:00") ?? undefined;
  return out;
}

function empty<T>(per: number): Page<T> {
  return { rows: [], total: 0, pages: 1 };
}

export type ClientRow = Client & { opiekunName: string | null };

const CLIENT_SORTS: Record<string, { column: string; asc: boolean; nullsFirst?: boolean }> = {
  nowe: { column: "created_at", asc: false },
  zmiana: { column: "updated_at", asc: false },
  nazwa: { column: "name", asc: true },
  kontakt: { column: "last_contact_at", asc: true, nullsFirst: true },
  budzet: { column: "budget_pln", asc: false },
};

export async function queryClients(agencyId: string, q: ListQuery, userId: string): Promise<Page<ClientRow>> {
  const admin = createSupabaseAdmin();
  const sort = CLIENT_SORTS[q.sort] ?? CLIENT_SORTS.zmiana;
  const [from, to] = range(q.page, q.per);

  let sel = admin.from("clients").select("*", { count: "exact" }).eq("agency_id", agencyId);

  if (q.q) {
    const digits = q.q.replace(/\D/g, "");
    sel =
      digits.length >= 3
        ? sel.or(`name.ilike.${like(q.q)},phone_digits.ilike.%${digits}%,phone.ilike.%${digits}%`)
        : sel.or(`name.ilike.${like(q.q)},email.ilike.${like(q.q)},company.ilike.${like(q.q)}`);
  }
  if (q.agent) sel = sel.eq("agent_id", q.agent === "ja" ? userId : q.agent);
  if (q.status) sel = sel.eq("status", q.status);
  if (q.type) sel = sel.eq("type", q.type);
  if (q.city) sel = sel.ilike("city", like(q.city));
  if (q.min) sel = sel.gte("budget_pln", Number(q.min));
  if (q.max) sel = sel.lte("budget_pln", Number(q.max));

  const field = q.dateField === "kontakt" ? "last_contact_at" : q.dateField === "nowe" ? "created_at" : "updated_at";
  const bounds = dateBounds(q);
  if (bounds.gte) sel = sel.gte(field, bounds.gte);
  if (bounds.lt) sel = sel.lt(field, bounds.lt);

  // „Do kontaktu": zaplanowany kontakt wypada dziś albo już minął.
  if (q.extra === "do_kontaktu") {
    sel = sel.not("next_contact_at", "is", null).lte("next_contact_at", new Date().toISOString().slice(0, 10));
  }
  if (q.extra === "bez_kontaktu") sel = sel.is("last_contact_at", null);

  const { data, count, error } = await sel
    .order(sort.column, { ascending: sort.asc, nullsFirst: sort.nullsFirst ?? !sort.asc })
    .range(from, to);
  if (error) return empty(q.per);

  const rows = (data ?? []) as Client[];
  const ids = [...new Set(rows.map((r) => r.agent_id).filter(Boolean))] as string[];
  const { data: people } = ids.length
    ? await admin.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] as { id: string; full_name: string | null }[] };
  const names = new Map((people ?? []).map((p) => [p.id, p.full_name]));

  const total = count ?? rows.length;
  return {
    rows: rows.map((c) => ({ ...c, opiekunName: c.agent_id ? names.get(c.agent_id) ?? null : null })),
    total,
    pages: Math.max(1, Math.ceil(total / q.per)),
  };
}

export type PropertyRow = Property & { opiekunName: string | null };

const PROPERTY_SORTS: Record<string, { column: string; asc: boolean }> = {
  nowe: { column: "created_at", asc: false },
  zmiana: { column: "updated_at", asc: false },
  cena_rosnaco: { column: "price_pln", asc: true },
  cena_malejaco: { column: "price_pln", asc: false },
  powierzchnia: { column: "area_m2", asc: false },
};

export async function queryProperties(agencyId: string, q: ListQuery, userId: string): Promise<Page<PropertyRow>> {
  const admin = createSupabaseAdmin();
  const sort = PROPERTY_SORTS[q.sort] ?? PROPERTY_SORTS.nowe;
  const [from, to] = range(q.page, q.per);

  let sel = admin.from("properties").select("*", { count: "exact" }).eq("agency_id", agencyId);

  if (q.q) {
    sel = sel.or(
      `title.ilike.${like(q.q)},city.ilike.${like(q.q)},address.ilike.${like(q.q)},offer_no.ilike.${like(q.q)}`,
    );
  }
  if (q.agent) sel = sel.eq("agent_id", q.agent === "ja" ? userId : q.agent);
  if (q.status) sel = sel.eq("status", q.status);
  if (q.type) sel = sel.eq("property_type", q.type);
  if (q.city) sel = sel.ilike("city", like(q.city));
  if (q.min) sel = sel.gte("price_pln", Number(q.min));
  if (q.max) sel = sel.lte("price_pln", Number(q.max));
  if (q.extra === "sprzedaz" || q.extra === "wynajem") sel = sel.eq("deal_kind", q.extra);
  if (q.extra === "na_strone") sel = sel.eq("export_to_web", true);
  if (q.extra === "bez_zdjec") sel = sel.eq("photos", "[]");

  const field = q.dateField === "nowe" ? "created_at" : "updated_at";
  const bounds = dateBounds(q);
  if (bounds.gte) sel = sel.gte(field, bounds.gte);
  if (bounds.lt) sel = sel.lt(field, bounds.lt);

  const { data, count, error } = await sel
    .order(sort.column, { ascending: sort.asc, nullsFirst: false })
    .range(from, to);
  if (error) return empty(q.per);

  const rows = (data ?? []) as Property[];
  const ids = [...new Set(rows.map((r) => r.agent_id).filter(Boolean))] as string[];
  const { data: people } = ids.length
    ? await admin.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] as { id: string; full_name: string | null }[] };
  const names = new Map((people ?? []).map((p) => [p.id, p.full_name]));

  const total = count ?? rows.length;
  return {
    rows: rows.map((p) => ({ ...p, opiekunName: p.agent_id ? names.get(p.agent_id) ?? null : null })),
    total,
    pages: Math.max(1, Math.ceil(total / q.per)),
  };
}

export type ActivityRow = Activity & {
  clientName: string | null;
  propertyTitle: string | null;
  assigneeNames: string[];
  /** Ile rozmów ma wątek (1 = pojedyncze działanie). */
  threadCount: number;
  /** Termin ostatniej rozmowy w wątku. */
  lastAt: string | null;
};

const ACTIVITY_SORTS: Record<string, { column: string; asc: boolean }> = {
  termin: { column: "due_at", asc: false },
  najstarsze: { column: "due_at", asc: true },
  dodane: { column: "created_at", asc: false },
};

/**
 * Działania z bazy, stroną po stronie. Domyślnie pokazujemy tylko wątki
 * główne (kolejne rozmowy pod tym samym numerem siedzą w środku wątku).
 */
export async function queryActivities(
  agencyId: string,
  q: ListQuery,
  userId: string,
  opts: { threads: boolean } = { threads: true },
): Promise<Page<ActivityRow>> {
  const admin = createSupabaseAdmin();
  const sort = ACTIVITY_SORTS[q.sort] ?? ACTIVITY_SORTS.termin;
  const [from, to] = range(q.page, q.per);

  let sel = admin.from("activities").select("*", { count: "exact" }).eq("agency_id", agencyId);
  if (opts.threads) sel = sel.is("parent_id", null);

  if (q.q) {
    const digits = q.q.replace(/\D/g, "");
    sel =
      digits.length >= 3
        ? sel.or(`subject.ilike.${like(q.q)},contact_name.ilike.${like(q.q)},contact_phone_digits.ilike.%${digits}%`)
        : sel.or(`subject.ilike.${like(q.q)},contact_name.ilike.${like(q.q)},description.ilike.${like(q.q)}`);
  }
  if (q.agent) sel = sel.contains("assignee_ids", [q.agent === "ja" ? userId : q.agent]);
  if (q.status) sel = sel.eq("status", q.status);
  if (q.type) sel = sel.eq("kind", q.type);
  if (q.extra) sel = sel.eq("purpose", q.extra);

  const bounds = dateBounds(q);
  if (bounds.gte) sel = sel.gte("due_at", bounds.gte);
  if (bounds.lt) sel = sel.lt("due_at", bounds.lt);

  let res = await sel.order(sort.column, { ascending: sort.asc, nullsFirst: false }).range(from, to);
  // Brak kolumny parent_id (nieuruchomiona migracja v24): lista działa dalej,
  // tylko bez zwijania kolejnych rozmów w wątki.
  if (res.error && opts.threads) {
    return queryActivities(agencyId, q, userId, { threads: false });
  }
  if (res.error) return empty(q.per);

  const rows = (res.data ?? []) as Activity[];
  const ids = rows.map((r) => r.id);
  const clientIds = [...new Set(rows.map((r) => r.client_id).filter(Boolean))] as string[];
  const propertyIds = [...new Set(rows.map((r) => r.property_id).filter(Boolean))] as string[];
  const userIds = [...new Set(rows.flatMap((r) => r.assignee_ids ?? []))];

  const [clients, properties, profiles, children] = await Promise.all([
    clientIds.length ? admin.from("clients").select("id, name").in("id", clientIds) : Promise.resolve({ data: [] }),
    propertyIds.length ? admin.from("properties").select("id, title").in("id", propertyIds) : Promise.resolve({ data: [] }),
    userIds.length ? admin.from("profiles").select("id, full_name").in("id", userIds) : Promise.resolve({ data: [] }),
    opts.threads && ids.length
      ? admin.from("activities").select("parent_id, due_at").in("parent_id", ids)
      : Promise.resolve({ data: [] as { parent_id: string; due_at: string | null }[] }),
  ]);

  const cMap = new Map((clients.data ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
  const pMap = new Map((properties.data ?? []).map((p: { id: string; title: string }) => [p.id, p.title]));
  const uMap = new Map(
    (profiles.data ?? []).map((u: { id: string; full_name: string | null }) => [u.id, u.full_name ?? "Agent"]),
  );
  const thread = new Map<string, { count: number; last: string | null }>();
  for (const ch of (children.data ?? []) as { parent_id: string; due_at: string | null }[]) {
    const cur = thread.get(ch.parent_id) ?? { count: 0, last: null };
    cur.count += 1;
    if (ch.due_at && (!cur.last || ch.due_at > cur.last)) cur.last = ch.due_at;
    thread.set(ch.parent_id, cur);
  }

  const total = res.count ?? rows.length;
  return {
    rows: rows.map((r) => {
      const t = thread.get(r.id);
      return {
        ...r,
        clientName: r.client_id ? cMap.get(r.client_id) ?? null : null,
        propertyTitle: r.property_id ? pMap.get(r.property_id) ?? null : null,
        assigneeNames: (r.assignee_ids ?? []).map((id) => uMap.get(id) ?? "Agent"),
        threadCount: 1 + (t?.count ?? 0),
        lastAt: t?.last && r.due_at && t.last > r.due_at ? t.last : r.due_at,
      };
    }),
    total,
    pages: Math.max(1, Math.ceil(total / q.per)),
  };
}

/** Wszystkie identyfikatory pasujące do filtra - do zaznaczenia „wszystkie wyniki". */
export async function idsForQuery(
  entity: "clients" | "properties" | "activities",
  agencyId: string,
  q: ListQuery,
  userId: string,
): Promise<string[]> {
  const wide: ListQuery = { ...q, page: 1, per: 100 };
  const out: string[] = [];
  for (let page = 1; page <= 20; page++) {
    const chunk =
      entity === "clients"
        ? await queryClients(agencyId, { ...wide, page }, userId)
        : entity === "properties"
          ? await queryProperties(agencyId, { ...wide, page }, userId)
          : await queryActivities(agencyId, { ...wide, page }, userId);
    out.push(...chunk.rows.map((r) => r.id));
    if (page >= chunk.pages) break;
  }
  return out;
}
