import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  getClient,
  getClientNotes,
  getPropertiesOwnedByClient,
  getPropertiesClientInterestedIn,
} from "@/lib/data-platform";
import { CLIENT_TYPES, PROPERTY_STATUSES, type Property } from "@/lib/types";
import { Card } from "../../components/ui";
import { MiniMap } from "../../components/mini-map";
import { formatPln, daysAgo, formatDateShort } from "@/lib/format";
import { StatusChanger } from "./status-changer";
import { NoteForm } from "./note-form";
import { NextContactControl } from "./next-contact-control";
import { deleteClient } from "../actions";
import { AiWriter } from "../../components/ai-writer";
import { googleCalendarUrl } from "@/lib/calendar";

type Props = { params: Promise<{ id: string }> };

function reminderState(next: string | null): { due: boolean; label: string } | null {
  if (!next) return null;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = next < today;
  const isToday = next === today;
  return {
    due: overdue || isToday,
    label: overdue ? "Kontakt zaległy" : isToday ? "Kontakt dziś" : `Kontakt: ${formatDateShort(next)}`,
  };
}

export default async function ClientDetailPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  const client = await getClient(id);
  if (!client) notFound();
  if (client.agent_id !== user.id) redirect("/app/klienci");

  const [notes, owned, interested] = await Promise.all([
    getClientNotes(id),
    getPropertiesOwnedByClient(id),
    getPropertiesClientInterestedIn(id),
  ]);
  const type = CLIENT_TYPES.find((t) => t.value === client.type);
  const reminder = reminderState(client.next_contact_at);

  return (
    <>
      <Link href="/app/klienci" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-emerald-400">
        ← Wszyscy klienci
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-xl font-bold text-zinc-950">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">{client.name}</h1>
            <p className="text-zinc-500">
              {type?.label}
              {client.property && ` · ${client.property}`}
            </p>
            {reminder && (
              <span
                className={`mt-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${
                  reminder.due
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                🔔 {reminder.label}
              </span>
            )}
          </div>
        </div>

        {/* AI pisze za agenta */}
        <div className="flex flex-wrap gap-2">
          <AiWriter
            kind="followup"
            clientName={client.name}
            presetContext={`Klient: ${client.name}, ${type?.label ?? ""}${client.property ? `, szuka/sprzedaje: ${client.property}` : ""}${client.budget_pln ? `, budżet ${client.budget_pln} zł` : ""}. Status: ${client.status}.${client.notes ? ` Notatka: ${client.notes}` : ""}`}
            buttonLabel="Napisz follow-up"
            title="Wiadomość follow-up do klienta"
            placeholder="O czym była ostatnia rozmowa? Co chcesz przekazać?"
          />
          <AiWriter
            kind="objection"
            buttonLabel="Pomoc z obiekcją"
            title="Jak odpowiedzieć na obiekcję?"
            placeholder="Np. klient mówi że prowizja za wysoka..."
          />
          <a
            href={googleCalendarUrl({
              title: `Spotkanie: ${client.name}`,
              details: `Klient: ${client.name}${type?.label ? ` (${type.label})` : ""}${
                client.property ? ` · ${client.property}` : ""
              }${client.phone ? ` · tel. ${client.phone}` : ""}`,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-emerald-500 hover:text-emerald-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Umów spotkanie
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Lewa: dane + status */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Status
            </h2>
            <StatusChanger clientId={client.id} current={client.status} />
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Kontakt
            </h2>
            <dl className="space-y-3 text-sm">
              {client.phone && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Telefon</dt>
                  <dd>
                    <a href={`tel:${client.phone}`} className="text-emerald-400 hover:text-emerald-300">
                      {client.phone}
                    </a>
                  </dd>
                </div>
              )}
              {client.email && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Email</dt>
                  <dd>
                    <a href={`mailto:${client.email}`} className="text-emerald-400 hover:text-emerald-300">
                      {client.email}
                    </a>
                  </dd>
                </div>
              )}
              {client.budget_pln != null && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Budżet</dt>
                  <dd className="text-zinc-200">{formatPln(client.budget_pln)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-zinc-500">Ostatni kontakt</dt>
                <dd className="text-zinc-200">{daysAgo(client.last_contact_at)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Następny kontakt
            </h2>
            <NextContactControl clientId={client.id} current={client.next_contact_at} />
          </Card>

          {client.address && (
            <Card>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
                Lokalizacja
              </h2>
              <p className="mb-3 text-sm text-zinc-300">{client.address}</p>
              {client.lat != null && client.lng != null && (
                <MiniMap lat={client.lat} lng={client.lng} title={client.name} />
              )}
            </Card>
          )}

          <form action={deleteClient.bind(null, client.id)}>
            <button className="text-xs text-zinc-600 transition hover:text-red-400">
              Usuń klienta
            </button>
          </form>
        </div>

        {/* Prawa: nieruchomości + notatki */}
        <div className="space-y-6">
          {(owned.length > 0 || interested.length > 0) && (
            <Card>
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
                Powiązane nieruchomości
              </h2>
              <div className="space-y-4">
                {owned.length > 0 && (
                  <PropertyGroup label="Sprzedaje / wynajmuje" items={owned} />
                )}
                {interested.length > 0 && (
                  <PropertyGroup label="Zainteresowany" items={interested} />
                )}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Nowa notatka
            </h2>
            <NoteForm clientId={client.id} />
          </Card>

          <div>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Historia kontaktu ({notes.length})
            </h2>
            {notes.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-6 text-center text-sm text-zinc-500">
                Brak notatek. Dodaj pierwszą po rozmowie z klientem.
              </p>
            ) : (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n.id} className="rounded-2xl border border-zinc-900 bg-zinc-900/40 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                      {n.content}
                    </p>
                    <p className="mt-2 text-xs text-zinc-600">
                      {new Intl.DateTimeFormat("pl-PL", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(n.created_at))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function PropertyGroup({ label, items }: { label: string; items: Property[] }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-zinc-600">{label}</p>
      <ul className="space-y-2">
        {items.map((p) => {
          const st = PROPERTY_STATUSES.find((s) => s.value === p.status);
          return (
            <li key={p.id}>
              <Link
                href={`/app/nieruchomosci/${p.id}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-zinc-900/50 px-3 py-2 transition hover:bg-zinc-900"
              >
                <span className="min-w-0 truncate text-sm text-zinc-200">
                  {p.title}
                  {p.price_pln != null && (
                    <span className="text-zinc-500"> · {formatPln(p.price_pln)}</span>
                  )}
                </span>
                {st && (
                  <span className={`flex-shrink-0 rounded px-2 py-0.5 text-xs ${st.color}`}>
                    {st.label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
