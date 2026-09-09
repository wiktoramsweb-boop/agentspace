import { requireUser } from "@/lib/auth";
import { getActivities, getActivityStats, getAgencyAgents } from "@/lib/data-activities";
import { getAgencyClientsLite, getAgencyProperties } from "@/lib/data-platform";
import { PageHeader, StatCard } from "../components/ui";
import { ActivitiesBrowser } from "./activities-browser";
import { ActivityModal } from "./activity-modal";

export default async function DzialaniaPage() {
  const user = await requireUser();
  const agencyId = user.agency_id;

  const [activities, stats, agents, clients, properties] = await Promise.all([
    agencyId ? getActivities(agencyId, { limit: 300 }) : Promise.resolve([]),
    agencyId ? getActivityStats(agencyId, user.id) : Promise.resolve({ planned: 0, today: 0, overdue: 0, doneWeek: 0 }),
    agencyId ? getAgencyAgents(agencyId) : Promise.resolve([]),
    agencyId ? getAgencyClientsLite(agencyId) : Promise.resolve([]),
    agencyId ? getAgencyProperties(agencyId) : Promise.resolve([]),
  ]);

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

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Zaplanowane" value={stats.planned} sub="moje działania" />
        <StatCard label="Na dziś" value={stats.today} sub="do zrobienia dzisiaj" accent />
        <StatCard label="Zaległe" value={stats.overdue} sub="termin minął" />
        <StatCard label="Wykonane" value={stats.doneWeek} sub="w ostatnich 7 dniach" />
      </div>

      <ActivitiesBrowser activities={activities} currentUserId={user.id} />
    </>
  );
}
