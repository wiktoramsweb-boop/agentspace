import { createSupabaseAdmin } from "./supabase/admin";
import type { Task, Client, ClientNote, Deal, Goal, DailyLog } from "./types";

// ---------- GOALS ----------

export async function getGoal(agentId: string): Promise<Goal | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("goals").select("*").eq("agent_id", agentId).maybeSingle();
  return (data as Goal) ?? null;
}

export async function getTodayLog(agentId: string): Promise<DailyLog | null> {
  const admin = createSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await admin
    .from("daily_logs")
    .select("*")
    .eq("agent_id", agentId)
    .eq("log_date", today)
    .maybeSingle();
  return (data as DailyLog) ?? null;
}

export async function getOnboardingState(agentId: string) {
  const admin = createSupabaseAdmin();
  const [goal, clients, sessions, deals] = await Promise.all([
    admin.from("goals").select("id", { count: "exact", head: true }).eq("agent_id", agentId),
    admin.from("clients").select("id", { count: "exact", head: true }).eq("agent_id", agentId),
    admin.from("training_sessions").select("id", { count: "exact", head: true }).eq("agent_id", agentId),
    admin.from("deals").select("id", { count: "exact", head: true }).eq("agent_id", agentId),
  ]);
  return {
    hasGoal: (goal.count ?? 0) > 0,
    hasClient: (clients.count ?? 0) > 0,
    hasSession: (sessions.count ?? 0) > 0,
    hasDeal: (deals.count ?? 0) > 0,
  };
}

/** Suma prowizji z transakcji zamkniętych w tym roku (realny postęp finansowy). */
export async function getYearClosedCommission(agentId: string): Promise<number> {
  const admin = createSupabaseAdmin();
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const { data } = await admin
    .from("deals")
    .select("commission_pln")
    .eq("agent_id", agentId)
    .eq("status", "zamkniety")
    .gte("closed_at", yearStart);
  return (data ?? []).reduce((a, d) => a + (d.commission_pln ?? 0), 0);
}

export async function getRecentLogs(agentId: string, days = 30): Promise<DailyLog[]> {
  const admin = createSupabaseAdmin();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data } = await admin
    .from("daily_logs")
    .select("*")
    .eq("agent_id", agentId)
    .gte("log_date", since)
    .order("log_date", { ascending: false });
  return (data ?? []) as DailyLog[];
}

// ---------- TASKS ----------

export async function getTasks(agentId: string, onlyOpen = false): Promise<Task[]> {
  const admin = createSupabaseAdmin();
  let q = admin
    .from("tasks")
    .select("*")
    .eq("agent_id", agentId)
    .order("is_done")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (onlyOpen) q = q.eq("is_done", false);
  const { data } = await q;
  return (data ?? []) as Task[];
}

export async function getTodayTasks(agentId: string): Promise<Task[]> {
  const admin = createSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await admin
    .from("tasks")
    .select("*")
    .eq("agent_id", agentId)
    .or(`due_date.lte.${today},due_date.is.null`)
    .order("is_done")
    .order("created_at", { ascending: true });
  return (data ?? []) as Task[];
}

// ---------- CLIENTS ----------

export async function getClients(agentId: string): Promise<Client[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("clients")
    .select("*")
    .eq("agent_id", agentId)
    .order("updated_at", { ascending: false });
  return (data ?? []) as Client[];
}

export async function getClient(id: string): Promise<Client | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("clients").select("*").eq("id", id).single();
  return (data as Client) ?? null;
}

export async function getClientNotes(clientId: string): Promise<ClientNote[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("client_notes")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ClientNote[];
}

/**
 * Klienci "do kontaktu" — aktywni (nie zamknięci/straceni), bez kontaktu
 * od 3+ dni. Do porannej odprawy.
 */
export async function getClientsNeedingContact(
  agentId: string,
  limit = 5,
): Promise<Client[]> {
  const admin = createSupabaseAdmin();
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("clients")
    .select("*")
    .eq("agent_id", agentId)
    .not("status", "in", "(zamkniety,stracony)")
    .or(`last_contact_at.lte.${threeDaysAgo},last_contact_at.is.null`)
    .order("last_contact_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  return (data ?? []) as Client[];
}

// ---------- DEALS ----------

export async function getDeals(agentId: string): Promise<Deal[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("deals")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Deal[];
}

export type CommissionStats = {
  monthClosed: number; // suma prowizji zamkniętych w tym miesiącu
  pipelineValue: number; // suma prowizji w toku
  dealsInProgress: number;
  dealsClosedThisMonth: number;
};

export async function getCommissionStats(agentId: string): Promise<CommissionStats> {
  const admin = createSupabaseAdmin();
  const { data: deals } = await admin
    .from("deals")
    .select("commission_pln, status, closed_at")
    .eq("agent_id", agentId);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let monthClosed = 0;
  let pipelineValue = 0;
  let dealsInProgress = 0;
  let dealsClosedThisMonth = 0;

  for (const d of deals ?? []) {
    if (d.status === "w_toku") {
      pipelineValue += d.commission_pln ?? 0;
      dealsInProgress += 1;
    } else if (d.status === "zamkniety" && d.closed_at) {
      if (new Date(d.closed_at) >= monthStart) {
        monthClosed += d.commission_pln ?? 0;
        dealsClosedThisMonth += 1;
      }
    }
  }

  return { monthClosed, pipelineValue, dealsInProgress, dealsClosedThisMonth };
}

/** Prowizja zamknięta w tym miesiącu per agent (dla panelu właściciela). */
export async function getAgencyCommissionByAgent(
  agencyId: string,
): Promise<Record<string, number>> {
  const admin = createSupabaseAdmin();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data } = await admin
    .from("deals")
    .select("agent_id, commission_pln")
    .eq("agency_id", agencyId)
    .eq("status", "zamkniety")
    .gte("closed_at", monthStart);

  const map: Record<string, number> = {};
  for (const d of data ?? []) {
    map[d.agent_id] = (map[d.agent_id] ?? 0) + (d.commission_pln ?? 0);
  }
  return map;
}
