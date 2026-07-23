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
