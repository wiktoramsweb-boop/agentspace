import { requireUser } from "@/lib/auth";
import { getAgencyClients } from "@/lib/data-platform";
import { PageHeader, EmptyState } from "../components/ui";
import { NewClientForm } from "./new-client-form";
import { ClientsBrowser } from "./clients-browser";

export default async function KlienciPage() {
  const user = await requireUser();
  const clients = user.agency_id ? await getAgencyClients(user.agency_id) : [];

  const active = clients.filter((c) => !["zamkniety", "stracony"].includes(c.status));
  const today = new Date().toISOString().slice(0, 10);
  const dueCount = active.filter(
    (c) => c.next_contact_at && c.next_contact_at <= today,
  ).length;

  return (
    <>
      <PageHeader
        title="Klienci"
        subtitle={`${active.length} aktywnych · ${clients.length} w biurze${
          dueCount > 0 ? ` · 🔔 ${dueCount} do kontaktu` : ""
        }`}
        action={<NewClientForm existingPhones={clients.map((c) => ({ phone: c.phone, owner: c.opiekunName }))} />}
      />

      {clients.length === 0 ? (
        <EmptyState
          title="Brak klientów"
          body="Dodaj pierwszego klienta - baza jest wspólna dla całego biura, więc każdy agent go zobaczy."
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          }
        />
      ) : (
        <ClientsBrowser clients={clients} currentUserId={user.id} />
      )}
    </>
  );
}
