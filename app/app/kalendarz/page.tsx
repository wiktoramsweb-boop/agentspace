import { requireUser } from "@/lib/auth";
import { getAgencyAgents } from "@/lib/data-activities";
import { getAgencyClientsLite, getAgencyProperties } from "@/lib/data-platform";
import { emptyInsights, getCalendarEvents, getCallInsights } from "@/lib/data-calendar";
import { getAgencySettings } from "@/lib/agency-settings";
import { addDaysKey, isDateKey, mondayOfKey, todayPL } from "@/lib/datetime";
import { maskPhone } from "@/lib/format";
import { PageHeader } from "../components/ui";
import { CalendarApp } from "./calendar-app";
import type { CalView } from "./shared";

type Props = { searchParams: Promise<{ widok?: string; data?: string; kto?: string }> };

export default async function KalendarzPage({ searchParams }: Props) {
  const user = await requireUser();
  const agencyId = user.agency_id;
  const sp = await searchParams;

  const view: CalView = sp.widok === "dzien" || sp.widok === "miesiac" ? sp.widok : "tydzien";
  const dateKey = isDateKey(sp.data) ? sp.data : todayPL();

  // Zakres widoku: dzień, tydzień od poniedziałku albo 6 tygodni siatki miesiąca.
  let rangeStart = dateKey;
  let rangeEnd = dateKey;
  if (view === "tydzien") {
    rangeStart = mondayOfKey(dateKey);
    rangeEnd = addDaysKey(rangeStart, 6);
  } else if (view === "miesiac") {
    rangeStart = mondayOfKey(`${dateKey.slice(0, 7)}-01`);
    rangeEnd = addDaysKey(rangeStart, 41);
  }

  const agents = agencyId ? await getAgencyAgents(agencyId) : [];
  const canPickAgent = user.role === "owner" || user.role === "manager";

  // Czyj kalendarz: moje (domyślnie), całe biuro, a CEO i menedżer także konkretny agent.
  const requested = sp.kto ?? "moje";
  const scope =
    requested === "biuro" || requested === "moje"
      ? requested
      : canPickAgent && agents.some((a) => a.id === requested)
        ? requested
        : "moje";
  const agentId = scope === "moje" ? user.id : scope === "biuro" ? null : scope;

  const [events, insights, clients, properties, settings] = await Promise.all([
    agencyId ? getCalendarEvents(agencyId, rangeStart, rangeEnd, agentId) : Promise.resolve([]),
    agencyId ? getCallInsights(agencyId, agentId) : Promise.resolve(emptyInsights()),
    agencyId ? getAgencyClientsLite(agencyId) : Promise.resolve([]),
    agencyId ? getAgencyProperties(agencyId) : Promise.resolve([]),
    getAgencySettings(agencyId, user.agency?.name),
  ]);

  // Ukrywanie kontaktów (Ustawienia → Pozostałe) obowiązuje także w kalendarzu.
  const mask = settings.options.hide_contacts && user.role === "agent";
  const visibleEvents = mask
    ? events.map((e) =>
        e.assignee_ids.includes(user.id) ? e : { ...e, contact_phone: maskPhone(e.contact_phone) },
      )
    : events;

  const scopeOptions = [
    { value: "moje", label: "Mój kalendarz" },
    { value: "biuro", label: "Całe biuro" },
    ...(canPickAgent
      ? agents.filter((a) => a.id !== user.id).map((a) => ({ value: a.id, label: a.name }))
      : []),
  ];
  const pickedAgent = agents.find((a) => a.id === agentId);
  const insightsWho = scope === "moje" ? "Ty" : scope === "biuro" ? "biuro" : pickedAgent?.name ?? "agent";

  return (
    <>
      <PageHeader
        title="Kalendarz"
        subtitle="Telefony, spotkania i zadania na osi czasu. Przeciągnij wpis, żeby zmienić termin."
      />
      <CalendarApp
        view={view}
        dateKey={dateKey}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        events={visibleEvents}
        insights={insights}
        scope={scope}
        scopeOptions={scopeOptions}
        insightsWho={insightsWho}
        insightsSelf={scope === "moje"}
        agents={agents}
        clients={clients.map((c) => ({ id: c.id, name: c.name, phone: mask ? null : c.phone }))}
        properties={properties.map((p) => ({ id: p.id, name: p.title }))}
        reportDefault={settings.options.report_default}
      />
    </>
  );
}
