"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { applyActivityToGoals } from "@/lib/goal-sync";
import { PHOTO_BUCKET } from "@/lib/storage";
import { removeFiles } from "@/lib/storage-server";
import { CLIENT_STATUSES, PROPERTY_STATUSES, ACTIVITY_STATUSES, PROCESS_STAGES } from "@/lib/types";

export type BulkEntity = "clients" | "properties" | "activities" | "searches";
export type BulkResult = { ok: true; count: number } | { ok: false; error: string };

/** Ile pozycji naraz. Więcej i tak nikt nie zaznacza świadomie. */
const MAX = 300;

const TABLE: Record<BulkEntity, string> = {
  clients: "clients",
  properties: "properties",
  activities: "activities",
  searches: "searches",
};

const PATHS: Record<BulkEntity, string[]> = {
  clients: ["/app/klienci", "/app"],
  properties: ["/app/nieruchomosci", "/app"],
  activities: ["/app/dzialania", "/app/kalendarz", "/app/cele", "/app"],
  searches: ["/app/poszukiwania"],
};

const SEARCH_STATUSES = ["aktualne", "wstrzymane", "zamkniete"];

function statusesFor(entity: BulkEntity): string[] {
  if (entity === "clients") return CLIENT_STATUSES.map((s) => s.value);
  if (entity === "properties") return PROPERTY_STATUSES.map((s) => s.value);
  if (entity === "activities") return ACTIVITY_STATUSES.map((s) => s.value);
  return SEARCH_STATUSES;
}

function cleanIds(ids: string[]): string[] {
  return [...new Set((ids ?? []).filter((id) => typeof id === "string" && id.length > 10))].slice(0, MAX);
}

function done(entity: BulkEntity, count: number): BulkResult {
  PATHS[entity].forEach((p) => revalidatePath(p));
  return { ok: true, count };
}

/** Zmiana statusu wielu pozycji naraz. */
export async function bulkSetStatus(entity: BulkEntity, ids: string[], status: string): Promise<BulkResult> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false, error: "Nie zaznaczono żadnej pozycji." };
  if (!statusesFor(entity).includes(status)) return { ok: false, error: "Nieznany status." };

  const admin = createSupabaseAdmin();

  if (entity === "activities") {
    // Działania liczą się do celów, więc każdą zmianę trzeba przeliczyć:
    // odejmujemy stan sprzed zmiany i dodajemy nowy.
    const { data: before } = await admin
      .from("activities")
      .select("id, kind, purpose, status, completed_at, assignee_ids, created_by, agency_id")
      .eq("agency_id", user.agency_id)
      .in("id", list);
    const completedAt = status === "wykonane" ? new Date().toISOString() : null;
    const { error } = await admin
      .from("activities")
      .update({ status, completed_at: completedAt, updated_at: new Date().toISOString() })
      .eq("agency_id", user.agency_id)
      .in("id", list);
    if (error) return { ok: false, error: `Nie udało się zapisać: ${error.message}` };
    for (const row of before ?? []) {
      await applyActivityToGoals(admin, row, -1);
      await applyActivityToGoals(admin, { ...row, status, completed_at: completedAt }, 1);
    }
    return done(entity, before?.length ?? list.length);
  }

  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  const { error, count } = await admin
    .from(TABLE[entity])
    .update(patch, { count: "exact" })
    .eq("agency_id", user.agency_id)
    .in("id", list);
  if (error) return { ok: false, error: `Nie udało się zapisać: ${error.message}` };
  return done(entity, count ?? list.length);
}

/** Zmiana opiekuna: klient, oferta, poszukiwanie albo osoba przypisana do działania. */
export async function bulkAssignAgent(entity: BulkEntity, ids: string[], agentId: string): Promise<BulkResult> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false, error: "Nie zaznaczono żadnej pozycji." };

  const admin = createSupabaseAdmin();
  const { data: agent } = await admin
    .from("profiles")
    .select("id")
    .eq("id", agentId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!agent) return { ok: false, error: "Nie znaleziono agenta w tym biurze." };

  const patch =
    entity === "activities"
      ? { assignee_ids: [agentId], updated_at: new Date().toISOString() }
      : { agent_id: agentId, updated_at: new Date().toISOString() };

  const { error, count } = await admin
    .from(TABLE[entity])
    .update(patch, { count: "exact" })
    .eq("agency_id", user.agency_id)
    .in("id", list);
  if (error) return { ok: false, error: `Nie udało się zapisać: ${error.message}` };
  return done(entity, count ?? list.length);
}

/** Etap obsługi oferty (pasek na karcie) dla wielu ofert naraz. */
export async function bulkSetStage(ids: string[], stage: string): Promise<BulkResult> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false, error: "Nie zaznaczono żadnej pozycji." };
  if (!PROCESS_STAGES.some((s) => s.value === stage)) return { ok: false, error: "Nieznany etap." };

  const admin = createSupabaseAdmin();
  const now = new Date().toISOString();
  const { error, count } = await admin
    .from("properties")
    .update({ process_stage: stage, process_changed_at: now, updated_at: now }, { count: "exact" })
    .eq("agency_id", user.agency_id)
    .in("id", list);
  if (error) return { ok: false, error: `Nie udało się zapisać: ${error.message}` };
  return done("properties", count ?? list.length);
}

/**
 * Usunięcie wielu pozycji. Zarezerwowane dla CEO i menedżera: masowe
 * kasowanie bazy to za duża jednorazowa strata, żeby dać je każdemu.
 */
export async function bulkDelete(entity: BulkEntity, ids: string[]): Promise<BulkResult> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  if (user.role !== "owner" && user.role !== "manager") {
    return { ok: false, error: "Masowe usuwanie może wykonać tylko CEO albo menedżer." };
  }
  const list = cleanIds(ids);
  if (!list.length) return { ok: false, error: "Nie zaznaczono żadnej pozycji." };

  const admin = createSupabaseAdmin();

  if (entity === "activities") {
    const { data: before } = await admin
      .from("activities")
      .select("id, kind, purpose, status, completed_at, assignee_ids, created_by, agency_id")
      .eq("agency_id", user.agency_id)
      .in("id", list);
    await admin.from("activities").delete().eq("agency_id", user.agency_id).in("id", list);
    for (const row of before ?? []) await applyActivityToGoals(admin, row, -1);
    return done(entity, before?.length ?? list.length);
  }

  if (entity === "properties") {
    // Zdjęcia usuwanych ofert znikają razem z nimi, żeby nie zostały w magazynie.
    const { data: props } = await admin
      .from("properties")
      .select("photos")
      .eq("agency_id", user.agency_id)
      .in("id", list);
    const { error, count } = await admin
      .from("properties")
      .delete({ count: "exact" })
      .eq("agency_id", user.agency_id)
      .in("id", list);
    if (error) return { ok: false, error: `Nie udało się usunąć: ${error.message}` };
    const files = (props ?? [])
      .flatMap((p) => ((p.photos ?? []) as { path?: string; original_path?: string }[]))
      .flatMap((ph) => [ph.path, ph.original_path])
      .filter((p): p is string => !!p && p.startsWith(`${user.agency_id}/`));
    await removeFiles(PHOTO_BUCKET, [...new Set(files)]);
    return done(entity, count ?? list.length);
  }

  const { error, count } = await admin
    .from(TABLE[entity])
    .delete({ count: "exact" })
    .eq("agency_id", user.agency_id)
    .in("id", list);
  if (error) return { ok: false, error: `Nie udało się usunąć: ${error.message}` };
  return done(entity, count ?? list.length);
}
