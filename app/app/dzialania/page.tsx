import { requireUser } from "@/lib/auth";
import { getActivities, getActivityStats, getAgencyAgents } from "@/lib/data-activities";
import { getAgencyClientsLite, getAgencyProperties, getGoal } from "@/lib/data-platform";
import { computeFunnel } from "@/lib/funnel";
import { PageHeader, StatCard } from "../components/ui";
import { ActivitiesBrowser } from "./activities-browser";
import { ActivityModal } from "./activity-modal";

export default async function DzialaniaPage() {
  const user = await requireUser();
  const agencyId = user.agency_id;

  const [activities, stats, agents, clients, properties, goalRow] = await Promise.all([
    agencyId ? getActivities(agencyId, { limit: 300 }) : Promise.resolve([]),
    agencyId
      ? getActivityStats(agencyId, user.id)
      : Promise.resolve({ planned: 0, callsToday: 0, doneToday: 0, today: 0, overdue: 0, doneWeek: 0 }),
    agencyId ? getAgencyAgents(agencyId) : Promise.resolve([]),
    agencyId ? getAgencyClientsLite(agencyId) : Promise.resolve([]),
    agencyId ? getAgencyProperties(agencyId) : Promise.resolve([]),
    getGoal(user.id),
  ]);

  // Cel dzienny telefonów pochodzi z lejka w module Cele - dzięki temu
  // agent widzi w Działaniach ile mu jeszcze zostało, bez przełączania zakładek.
  const callTarget = goalRow ? computeFunnel(goalRow).byStage.cold_calls.daily : 0;
  const callsLeft = Math.max(0, callTarget - stats.callsToday);

  const propsLite = properties.map((p) => ({ id: p.id, name: p.title }));
  const clientsLite = clients.map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      <PageHeader
        title="Działania"
        subtitle="Telefony, zadania, spotkania i wydarzenia całego biura w jednym miejscu."
        action={
          <ActivityModal agents={agents} clients={clientsLite} properties={propsLite} />
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Zaplanowane" value={stats.planned} sub="moje działania" />
        <StatCard
          label="Telefony na dziś"
          value={callTarget > 0 ? `${stats.callsToday} / ${callTarget}` : stats.callsToday}
          sub={
            callTarget > 0
              ? callsLeft > 0
                ? `zostało ${callsLeft} do celu z Celów`
                : "cel dzienny zrobiony"
              : "ustaw cel w zakładce Cele"
          }
          accent
        />
        <StatCard label="Zaplanowane na dziś" value={stats.today} sub="w kalendarzu" />
        <StatCard label="Zaległe" value={stats.overdue} sub="termin minął" />
        <StatCard label="Wykonane" value={stats.doneWeek} sub="w ostatnich 7 dniach" />
      </div>

      <ActivitiesBrowser activities={activities} currentUserId={user.id} />
    </>
  );
}
