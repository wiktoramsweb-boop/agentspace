import { requireUser } from "@/lib/auth";
import { getAgencyProperties, getAgencyClientsLite } from "@/lib/data-platform";
import { PageHeader, EmptyState } from "../components/ui";
import { PropertyWizard } from "./property-wizard";
import { PropertiesBrowser } from "./properties-browser";

export default async function NieruchomosciPage() {
  const user = await requireUser();
  const agencyId = user.agency_id;
  const [properties, clients] = await Promise.all([
    agencyId ? getAgencyProperties(agencyId) : Promise.resolve([]),
    agencyId ? getAgencyClientsLite(agencyId) : Promise.resolve([]),
  ]);

  const active = properties.filter((p) => p.status === "aktywna");

  return (
    <>
      <PageHeader
        title="Nieruchomości"
        subtitle={`${active.length} aktywnych · ${properties.length} w biurze`}
        action={<PropertyWizard clients={clients} />}
      />

      {properties.length === 0 ? (
        <EmptyState
          title="Brak nieruchomości"
          body="Dodaj pierwszą ofertę - baza jest wspólna dla całego biura, więc każdy agent ją zobaczy (możesz filtrować na „Moje”)."
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          }
        />
      ) : (
        <PropertiesBrowser properties={properties} currentUserId={user.id} />
      )}
    </>
  );
}
