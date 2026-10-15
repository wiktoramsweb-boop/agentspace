import { requireAktywny } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { brakTabeli } from "@/lib/migracja";
import { getAgencyAgents } from "@/lib/data-activities";
import { todayPL, addDaysKey } from "@/lib/datetime";
import type { Nieobecnosc } from "@/lib/zastepstwa-model";
import { PageHeader } from "../components/ui";
import { BrakMigracji } from "../components/brak-migracji";
import { PanelUrlopow } from "./panel";

export const metadata = { title: "Urlopy i zastępstwa | AgentSpace" };

export default async function UrlopyPage() {
  const user = await requireAktywny();
  const agencyId = user.agency_id!;
  const dzis = todayPL();
  const admin = createSupabaseAdmin();
  const [{ data, error }, ludzie] = await Promise.all([
    admin
      .from("agent_absences")
      .select("id, agent_id, substitute_id, kind, starts_on, ends_on, note, created_by")
      .eq("agency_id", agencyId)
      .gte("ends_on", addDaysKey(dzis, -30))
      .order("starts_on", { ascending: true })
      .limit(300),
    getAgencyAgents(agencyId),
  ]);

  const naglowek = (
    <PageHeader
      title="Urlopy i zastępstwa"
      subtitle="Kto jest nieobecny i kto go zastępuje. W dniach urlopu zadania, leady i powiadomienia same trafiają do zastępcy, a po powrocie wszystko wraca bez przepisywania klientów."
    />
  );

  if (brakTabeli(error)) {
    return (
      <>
        {naglowek}
        <BrakMigracji />
      </>
    );
  }

  return (
    <>
      {naglowek}
      <PanelUrlopow
        dzis={dzis}
        nieobecnosci={(data ?? []) as (Nieobecnosc & { created_by: string | null })[]}
        ludzie={ludzie}
        ja={user.id}
        zarzadza={["owner", "director", "manager"].includes(user.role)}
      />
    </>
  );
}
