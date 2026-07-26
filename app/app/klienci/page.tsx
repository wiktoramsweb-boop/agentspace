import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getClients } from "@/lib/data-platform";
import { CLIENT_STATUSES, CLIENT_TYPES } from "@/lib/types";
import { PageHeader, Card, EmptyState } from "../components/ui";
import { formatPln, daysAgo } from "@/lib/format";
import { NewClientForm } from "./new-client-form";

export default async function KlienciPage() {
  const user = await requireUser();
  const clients = await getClients(user.id);

  const active = clients.filter((c) => !["zamkniety", "stracony"].includes(c.status));
  const today = new Date().toISOString().slice(0, 10);
  const dueCount = active.filter(
    (c) => c.next_contact_at && c.next_contact_at <= today,
  ).length;

  return (
    <>
      <PageHeader
        title="Klienci"
        subtitle={`${active.length} aktywnych · ${clients.length} łącznie${
          dueCount > 0 ? ` · 🔔 ${dueCount} do kontaktu` : ""
        }`}
        action={<NewClientForm />}
      />

      {clients.length === 0 ? (
        <EmptyState
          title="Brak klientów"
          body="Dodaj pierwszego klienta, żeby prowadzić notatki, śledzić status i nie zgubić żadnego leada."
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          }
        />
      ) : (
        <Card className="!p-0">
          <div className="divide-y divide-zinc-900">
            {clients.map((c) => {
              const status = CLIENT_STATUSES.find((s) => s.value === c.status);
              const type = CLIENT_TYPES.find((t) => t.value === c.type);
              return (
                <Link
                  key={c.id}
                  href={`/app/klienci/${c.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-zinc-900/40"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-300">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{c.name}</p>
                      <p className="truncate text-sm text-zinc-500">
                        {type?.label}
                        {c.property && ` · ${c.property}`}
                        {c.budget_pln != null && ` · ${formatPln(c.budget_pln)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-4">
                    {c.next_contact_at && c.next_contact_at <= today && (
                      <span className="rounded-md bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-300">
                        🔔 do kontaktu
                      </span>
                    )}
                    <span className="hidden text-xs text-zinc-600 sm:block">
                      {daysAgo(c.last_contact_at)}
                    </span>
                    {status && (
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}
