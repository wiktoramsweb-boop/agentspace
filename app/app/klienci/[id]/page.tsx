import { todayPL } from "@/lib/datetime";
import { mozeUsunac } from "@/lib/uprawnienia";
import { maskPhone } from "@/lib/format";
import Link from "next/link";
import { BellIcon } from "../../components/icons";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getClient,
  getClientNotes,
  getPropertiesOwnedByClient,
  getPropertiesClientInterestedIn,
} from "@/lib/data-platform";
import { CLIENT_TYPE_LABELS, PROPERTY_STATUSES, type Property } from "@/lib/types";
import { Card } from "../../components/ui";
import { MiniMap } from "../../components/mini-map";
import { formatPln, daysAgo, formatDateShort, formatPhone } from "@/lib/format";
import { StatusChanger } from "./status-changer";
import { NoteForm } from "./note-form";
import { NextContactControl } from "./next-contact-control";
import { deleteClient } from "../actions";
import { AiWriter } from "../../components/ai-writer";
import { googleCalendarUrl } from "@/lib/calendar";
import { getActivities, getAgencyAgents } from "@/lib/data-activities";
import { getAgencyProperties } from "@/lib/data-platform";
import { ActivityModal } from "../../dzialania/activity-modal";
import { ClientActivities } from "./client-activities";
import { ClientDetails } from "./client-details";
import { DostepPortal, type DostepWiersz } from "./dostep-portal";
import { APP_URL } from "@/lib/supabase/config";
import { SearchWizard } from "../../poszukiwania/search-wizard";
import { ClientSearches } from "./client-searches";
import { getSearches, getActiveProperties } from "@/lib/data-searches";
import { findMatches } from "@/lib/matching";
import { getAgencySettings } from "@/lib/agency-settings";
import { getDocuments } from "@/lib/data-documents";
import { getClientMessages } from "@/lib/data-messages";
import { DocumentsCard } from "../../dokumenty/documents-card";
import { ClientCorrespondence } from "./client-correspondence";

type Props = { params: Promise<{ id: string }> };

function reminderState(next: string | null): { due: boolean; label: string } | null {
  if (!next) return null;
  const today = todayPL();
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
  if (client.agency_id !== user.agency_id) redirect("/app/klienci");

  const [notes, owned, interested] = await Promise.all([
    getClientNotes(id),
    getPropertiesOwnedByClient(id),
    getPropertiesClientInterestedIn(id),
  ]);
  const type = { label: CLIENT_TYPE_LABELS[client.type] ?? client.type };
  const reminder = reminderState(client.next_contact_at);

  // Działania tego klienta - historia telefonów i spotkań w jednym miejscu.
  const agencyId = user.agency_id;
  const [clientActivities, agents, agencyProps, clientSearches, activeProps, settings, documents, correspondence] = await Promise.all([
    agencyId ? getActivities(agencyId, { clientId: client.id, limit: 50 }) : Promise.resolve([]),
    agencyId ? getAgencyAgents(agencyId) : Promise.resolve([]),
    agencyId ? getAgencyProperties(agencyId) : Promise.resolve([]),
    agencyId ? getSearches(agencyId, { clientId: client.id, limit: 20 }) : Promise.resolve([]),
    agencyId ? getActiveProperties(agencyId) : Promise.resolve([]),
    getAgencySettings(agencyId, user.agency?.name),
    getDocuments(agencyId, "client", client.id),
    getClientMessages(agencyId, client.id),
  ]);

  // Ukrywanie kontaktów (Ustawienia → Pozostałe) działa tu tak samo jak na
  // liście: agent nie dostaje pełnych danych cudzego klienta. Bez tego wystarczyło
  // kliknąć w klienta, żeby spisać numer, i ustawienie niczego nie chroniło.
  const masked = settings.options.hide_contacts && user.role === "agent" && client.agent_id !== user.id;
  // Dostępy do portalu. Brak tabeli (migracja v46 nieuruchomiona) daje pustą
  // listę, a nie błąd całej karty klienta.
  const dostepyPortalu = ((
    await createSupabaseAdmin()
      .from("client_portal_access")
      .select("id, token, rodzaj, created_at, revoked_at, last_seen_at")
      .eq("client_id", id)
      .eq("agency_id", user.agency_id ?? "")
      .order("created_at", { ascending: false })
  ).data ?? []) as DostepWiersz[];

  const contact = masked
    ? { ...client, phone: null, email: null, phones: null, emails: null, pesel: null, id_document: null }
    : client;

  // Ile ofert pasuje do każdego poszukiwania tego klienta - agent widzi od razu,
  // czy ma o czym z nim rozmawiać.
  const searchMatchCounts: Record<string, number> = {};
  for (const s of clientSearches) {
    searchMatchCounts[s.id] = findMatches(s, activeProps).filter((m) => m.fits).length;
  }

  return (
    <>
      <Link href="/app/klienci" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        ← Wszyscy klienci
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-xl font-bold text-white">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{client.name}</h1>
            <p className="text-slate-500">
              {type?.label}
              {client.property && ` · ${client.property}`}
            </p>
            {reminder && (
              <span
                className={`mt-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${
                  reminder.due
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <BellIcon className="h-4 w-4" /> {reminder.label}
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
            client={{ id: client.id, name: client.name, email: contact.email ?? null, phone: contact.phone ?? null }}
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
              }${contact.phone ? ` · tel. ${formatPhone(contact.phone)}` : ""}`,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-emerald-500 hover:text-emerald-600"
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
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
              Status
            </h2>
            <StatusChanger clientId={client.id} current={client.status} />
          </Card>

          <ClientDetails client={contact} />

          <DostepPortal clientId={client.id} appUrl={APP_URL} istniejace={dostepyPortalu} />

          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
              Kontakt
            </h2>
            <dl className="space-y-3 text-sm">
              {masked && client.phone && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Telefon</dt>
                  <dd className="text-slate-500" title="Biuro ukrywa kontakty cudzych klientów">
                    {maskPhone(client.phone)}
                  </dd>
                </div>
              )}
              {contact.phone && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Telefon</dt>
                  <dd>
                    <a href={`tel:${contact.phone}`} className="text-emerald-600 hover:text-emerald-700">
                      {formatPhone(contact.phone)}
                    </a>
                  </dd>
                </div>
              )}
              {contact.email && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Email</dt>
                  <dd>
                    <a href={`mailto:${contact.email}`} className="text-emerald-600 hover:text-emerald-700">
                      {contact.email}
                    </a>
                  </dd>
                </div>
              )}
              {client.budget_pln != null && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Budżet</dt>
                  <dd className="text-slate-800">{formatPln(client.budget_pln)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">Ostatni kontakt</dt>
                <dd className="text-slate-800">{daysAgo(client.last_contact_at)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
              Następny kontakt
            </h2>
            <NextContactControl clientId={client.id} current={client.next_contact_at} />
          </Card>

          {client.address && (
            <Card>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
                Lokalizacja
              </h2>
              <p className="mb-3 text-sm text-slate-700">{client.address}</p>
              {client.lat != null && client.lng != null && (
                <MiniMap lat={client.lat} lng={client.lng} title={client.name} />
              )}
            </Card>
          )}

          {mozeUsunac(user, client) && (
            <form action={deleteClient.bind(null, client.id)}>
              <button className="text-xs text-slate-400 transition hover:text-red-600">
                Usuń klienta
              </button>
            </form>
          )}
        </div>

        {/* Prawa: nieruchomości + notatki */}
        <div className="space-y-6">
          {(owned.length > 0 || interested.length > 0) && (
            <Card>
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
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
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
                Poszukiwania ({clientSearches.length})
              </h2>
              <SearchWizard
                clients={[{ id: client.id, name: client.name, phone: contact.phone }]}
                presetClientId={client.id}
                trigger="plus"
              />
            </div>
            <ClientSearches searches={clientSearches} matchCounts={searchMatchCounts} />
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
                Działania ({clientActivities.length})
              </h2>
              <ActivityModal
                agents={agents}
                clients={[{ id: client.id, name: client.name, phone: contact.phone }]}
                properties={agencyProps.map((p) => ({ id: p.id, name: p.title }))}
                presetClientId={client.id}
                trigger="plus"
                reportDefault={settings.options.report_default}
              />
            </div>
            <ClientActivities activities={clientActivities} />
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
              Korespondencja ({correspondence.messages.length})
            </h2>
            <ClientCorrespondence
              clientId={client.id}
              clientEmail={contact.email ?? null}
              clientPhone={contact.phone ?? null}
              initial={correspondence.messages}
              ready={correspondence.ready}
            />
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
              Dokumenty ({documents.docs.length})
            </h2>
            <DocumentsCard entity="client" entityId={client.id} initial={documents.docs} ready={documents.ready} />
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
              Nowa notatka
            </h2>
            <NoteForm clientId={client.id} />
          </Card>

          <div>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
              Historia kontaktu ({notes.length})
            </h2>
            {notes.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Brak notatek. Dodaj pierwszą po rozmowie z klientem.
              </p>
            ) : (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                      {n.content}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
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
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <ul className="space-y-2">
        {items.map((p) => {
          const st = PROPERTY_STATUSES.find((s) => s.value === p.status);
          return (
            <li key={p.id}>
              <Link
                href={`/app/nieruchomosci/${p.id}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 transition hover:bg-white"
              >
                <span className="min-w-0 truncate text-sm text-slate-800">
                  {p.title}
                  {p.price_pln != null && (
                    <span className="text-slate-500"> · {formatPln(p.price_pln)}</span>
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
