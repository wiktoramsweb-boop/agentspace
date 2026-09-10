import { requireUser } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { maskPhone } from "@/lib/format";
import { getActivities, getActivityStats, getAgencyAgents } from "@/lib/data-activities";
import { getAgencyClientsLite, getAgencyProperties, getGoal } from "@/lib/data-platform";
import { computeFunnel } from "@/lib/funnel";
import { PageHeader, StatCard } from "../components/ui";
import { ActivitiesBrowser } from "./activities-browser";
import { ActivityModal } from "./activity-modal";
import Link from "next/link";

export default async function DzialaniaPage() {
  const user = await requireUser();
  const agencyId = user.agency_id;

  const [activities, stats, agents, clients, properties, goalRow, settings] = await Promise.all([
    agencyId ? getActivities(agencyId, { limit: 300 }) : Promise.resolve([]),
    agencyId
      ? getActivityStats(agencyId, user.id)
      : Promise.resolve({ planned: 0, callsToday: 0, doneToday: 0, today: 0, overdue: 0, doneWeek: 0 }),
    agencyId ? getAgencyAgents(agencyId) : Promise.resolve([]),
    agencyId ? getAgencyClientsLite(agencyId) : Promise.resolve([]),
    agencyId ? getAgencyProperties(agencyId) : Promise.resolve([]),
    getGoal(user.id),
    getAgencySettings(agencyId, user.agency?.name),
  ]);

  // Cel dzienny telefonów pochodzi z lejka w module Cele - dzięki temu
  // agent widzi w Działaniach ile mu jeszcze zostało, bez przełączania zakładek.
  const callTarget = goalRow ? computeFunnel(goalRow).byStage.cold_calls.daily : 0;
  const callsLeft = Math.max(0, callTarget - stats.callsToday);

  const propsLite = properties.map((p) => ({ id: p.id, name: p.title }));

  // Ukrywanie kontaktów (Ustawienia → Pozostałe): agent widzi pełny numer
  // tylko przy swoich działaniach. Maskujemy przed wysłaniem do przeglądarki.
  const mask = settings.options.hide_contacts && user.role === "agent";
  const listActivities = mask
    ? activities.map((a) =>
        a.created_by === user.id || a.assignee_ids.includes(user.id)
          ? a
          : { ...a, contact_phone: maskPhone(a.contact_phone), contact_email: a.contact_email ? "ukryty" : null },
      )
    : activities;
  const clientsLite = clients.map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      <PageHeader
        title="Działania"
        subtitle="Telefony, zadania, spotkania i wydarzenia całego biura w jednym miejscu."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {user.role === "owner" && (
              <Link
                href="/app/dzialania/raport"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Raport zespołu
              </Link>
            )}
            <ActivityModal
              agents={agents}
              clients={clientsLite}
              properties={propsLite}
              reportDefault={settings.options.report_default}
            />
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
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

      <ActivitiesBrowser activities={listActivities} currentUserId={user.id} agents={agents} />
    </>
  );
}
