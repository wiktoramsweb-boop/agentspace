import { requireModul } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { brakTabeli } from "@/lib/migracja";
import { getAgencyAgents } from "@/lib/data-activities";
import type { Akcja, WarunkiReguly, Zdarzenie } from "@/lib/automatyzacje-model";
import { PageHeader } from "../components/ui";
import { BrakMigracji } from "../components/brak-migracji";
import { PanelAutomatyzacji, type ReguleWiersz, type UruchomienieWiersz } from "./panel";

export const metadata = { title: "Automatyzacje | AgentSpace" };

export default async function AutomatyzacjePage() {
  const user = await requireModul("zespol");
  if (!["owner", "director", "manager"].includes(user.role)) redirect("/app");
  const agencyId = user.agency_id!;
  const admin = createSupabaseAdmin();

  const [reguly, uruchomienia, ludzie] = await Promise.all([
    admin
      .from("automation_rules")
      .select("id, name, enabled, trigger, trigger_config, actions, runs_count, last_run_at, created_at")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: true }),
    admin
      .from("automation_runs")
      .select("id, rule_id, entity_type, entity_id, status, detail, created_at")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(40),
    getAgencyAgents(agencyId),
  ]);

  if (brakTabeli(reguly.error)) {
    return (
      <>
        <PageHeader title="Automatyzacje" subtitle="Reguły, które same tworzą zadania, przypisują leady i pilnują terminów." />
        <BrakMigracji />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Automatyzacje"
        subtitle="Reguły, które same tworzą zadania, przypisują leady i pilnują terminów. Zespół robi swoje, a nic nie przepada w ciszy."
      />
      <PanelAutomatyzacji
        reguly={(reguly.data ?? []).map((r) => ({
          ...r,
          trigger: r.trigger as Zdarzenie,
          trigger_config: (r.trigger_config ?? {}) as WarunkiReguly,
          actions: (r.actions ?? []) as Akcja[],
        })) as ReguleWiersz[]}
        uruchomienia={(uruchomienia.data ?? []) as UruchomienieWiersz[]}
        ludzie={ludzie.map((l) => ({ id: l.id, name: l.name }))}
      />
    </>
  );
}
