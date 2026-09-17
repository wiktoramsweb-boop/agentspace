"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { ActivityRow } from "@/lib/data-lists";
import type { ListQuery } from "@/lib/list-params";
import { setActivityStatus } from "./actions";
import { ActivityModal, type ThreadParent } from "./activity-modal";
import { ACTIVITY_ICONS } from "../components/icons";
import { ListToolbar, ServerPagination } from "../components/list-controls";
import { BulkBar, SelectBox, useSelection } from "../components/bulk-bar";
import { formatDateTimePL } from "@/lib/datetime";
import { formatPhone } from "@/lib/format";
import {
  ACTIVITY_KINDS,
  ACTIVITY_KIND_MAP,
  ACTIVITY_PRIORITIES,
  ACTIVITY_PURPOSES,
  ACTIVITY_STATUSES,
} from "@/lib/types";

const STATUS_MAP = Object.fromEntries(ACTIVITY_STATUSES.map((s) => [s.value, s]));
const PRIORITY_MAP = Object.fromEntries(ACTIVITY_PRIORITIES.map((p) => [p.value, p]));
const PURPOSE_MAP = Object.fromEntries(ACTIVITY_PURPOSES.map((p) => [p.value, p.label]));

const SORTS = [
  { value: "termin", label: "Termin: najnowsze" },
  { value: "najstarsze", label: "Termin: najstarsze" },
  { value: "dodane", label: "Ostatnio dodane" },
];

function fmtDuration(s: number | null): string | null {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m} min ${sec} s` : `${sec} s`;
}

/**
 * Lista działań. Filtry i strony liczy baza, a kolejne rozmowy pod tym samym
 * numerem są zwinięte w jeden wątek, żeby lista nie puchła od powtórek.
 */
export function ActivitiesBrowser({
  rows,
  query,
  total,
  pages,
  agents,
  clients,
  properties,
  canDelete,
  reportDefault,
}: {
  rows: ActivityRow[];
  query: ListQuery;
  total: number;
  pages: number;
  agents: { id: string; name: string }[];
  clients: { id: string; name: string; phone?: string | null }[];
  properties: { id: string; name: string }[];
  canDelete: boolean;
  reportDefault: boolean;
}) {
  const reduce = useReducedMotion();
  const selection = useSelection();
  const [pending, start] = useTransition();
  const [followUp, setFollowUp] = useState<ThreadParent | null>(null);
  const pageIds = rows.map((r) => r.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selection.has(id));

  return (
    <div>
      <ListToolbar
        base="/app/dzialania"
        query={query}
        total={total}
        sorts={SORTS}
        agents={agents}
        placeholder="Szukaj po temacie, numerze telefonu, nazwisku…"
        filters={{
          statuses: ACTIVITY_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          types: { label: "Rodzaj", options: ACTIVITY_KINDS.map((k) => ({ value: k.value, label: k.label })) },
          dateFields: [{ value: "termin", label: "terminu działania" }],
          extra: { label: "Cel", options: ACTIVITY_PURPOSES.map((p) => ({ value: p.value, label: p.label })) },
        }}
      />

      {rows.length > 0 && (
        <label className="mb-2 flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-slate-500">
          <input
            type="checkbox"
            checked={allOnPage}
            onChange={() => selection.setMany(pageIds, !allOnPage)}
            className="h-4 w-4 accent-emerald-500"
          />
          Zaznacz wszystkie na stronie ({rows.length})
        </label>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-sm text-slate-500">
          Brak działań dla tych filtrów. Dodaj pierwsze albo wyczyść filtry.
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((a, i) => {
            const km = ACTIVITY_KIND_MAP[a.kind] ?? ACTIVITY_KIND_MAP.polaczenie;
            const sm = STATUS_MAP[a.status] ?? STATUS_MAP.zaplanowane;
            const pm = PRIORITY_MAP[a.priority] ?? PRIORITY_MAP.normalny;
            const overdue = a.status === "zaplanowane" && a.due_at && new Date(a.due_at) < new Date();
            const dur = fmtDuration(a.duration_s);
            const KindIcon = ACTIVITY_ICONS[a.kind] ?? ACTIVITY_ICONS.polaczenie;
            const picked = selection.has(a.id);
            const isThread = a.threadCount > 1;

            return (
              <motion.div
                key={a.id}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : Math.min(0.2, i * 0.015), duration: 0.25 }}
                className={`group flex items-stretch gap-2 overflow-hidden rounded-2xl border bg-white transition hover:shadow-sm ${
                  picked ? "border-emerald-400 ring-1 ring-emerald-300" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className={`w-1.5 flex-shrink-0 ${sm.bar}`} />
                <div className="flex items-center pt-4">
                  <SelectBox checked={picked} onChange={() => selection.toggle(a.id)} label={`Zaznacz ${a.subject}`} />
                </div>

                <div className="min-w-0 flex-1 py-4 pr-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${km.tile}`}>
                      <KindIcon className="h-4 w-4" />
                    </span>
                    <Link
                      href={`/app/dzialania/${a.id}`}
                      className="font-semibold text-slate-900 hover:text-emerald-600 hover:underline"
                    >
                      {a.subject}
                    </Link>
                    {isThread && (
                      <Link
                        href={`/app/dzialania/${a.id}`}
                        className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white"
                        title="Historia rozmów pod tym numerem"
                      >
                        {a.threadCount} rozmów
                      </Link>
                    )}
                    {overdue && (
                      <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">zaległe</span>
                    )}
                  </div>

                  <div className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <Row label="Typ">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${km.badge}`}>{km.label}</span>
                    </Row>
                    <Row label="Priorytet">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${pm.color}`}>{pm.label}</span>
                    </Row>
                    <Row label="Status">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${sm.color}`}>{sm.label}</span>
                    </Row>
                    <Row label={isThread ? "Ostatnia rozmowa" : "Termin"}>
                      <span className={overdue ? "font-medium text-red-600" : "text-slate-700"}>
                        {formatDateTimePL(a.lastAt ?? a.due_at)}
                      </span>
                    </Row>

                    {a.purpose && <Row label="Cel">{PURPOSE_MAP[a.purpose] ?? a.purpose}</Row>}
                    <Row label="Agent">{a.assigneeNames.join(", ") || "-"}</Row>
                    <Row label="Telefon">
                      {a.contact_phone?.includes("•") ? (
                        <span className="text-slate-500">{a.contact_phone}</span>
                      ) : a.contact_phone ? (
                        <a href={`tel:${a.contact_phone}`} className="text-blue-600 hover:underline">
                          {formatPhone(a.contact_phone)}
                        </a>
                      ) : (
                        "-"
                      )}
                    </Row>
                    <Row label="Kontakt">{a.contact_name ?? "-"}</Row>
                    <Row label="Klient">
                      {a.client_id && a.clientName ? (
                        <Link href={`/app/klienci/${a.client_id}`} className="text-blue-600 hover:underline">
                          {a.clientName}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </Row>
                    <Row label="Nieruchomość">
                      {a.property_id && a.propertyTitle ? (
                        <Link href={`/app/nieruchomosci/${a.property_id}`} className="text-blue-600 hover:underline">
                          {a.propertyTitle}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </Row>
                    {dur && <Row label="Czas rozmowy">{dur}</Row>}
                  </div>

                  {a.description && <p className="mt-2.5 line-clamp-2 text-sm text-slate-500">{a.description}</p>}
                </div>

                <div className="flex flex-shrink-0 flex-col items-end justify-center gap-1.5 pr-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFollowUp({
                        id: a.id,
                        subject: a.subject,
                        kind: a.kind,
                        contactName: a.contact_name,
                        contactPhone: a.contact_phone,
                        clientId: a.client_id,
                        count: a.threadCount,
                      })
                    }
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    + Rozmowa
                  </button>
                  <Link
                    href={`/app/dzialania/${a.id}`}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:text-emerald-600"
                  >
                    Szczegóły →
                  </Link>
                  {a.status !== "wykonane" ? (
                    <button
                      onClick={() => start(() => setActivityStatus(a.id, "wykonane"))}
                      disabled={pending}
                      className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50"
                    >
                      ✓ Wykonane
                    </button>
                  ) : (
                    <button
                      onClick={() => start(() => setActivityStatus(a.id, "zaplanowane"))}
                      disabled={pending}
                      className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
                    >
                      Cofnij
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ServerPagination base="/app/dzialania" query={query} total={total} pages={pages} label="działań" />

      <BulkBar
        entity="activities"
        selection={selection}
        statuses={ACTIVITY_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
        agents={agents}
        canDelete={canDelete}
        noun={["działanie", "działania", "działań"]}
      />

      {/* Dopisanie kolejnej rozmowy do wybranego wątku */}
      <ActivityModal
        trigger="none"
        open={!!followUp}
        onOpenChange={(o) => !o && setFollowUp(null)}
        parent={followUp ?? undefined}
        agents={agents}
        clients={clients}
        properties={properties}
        reportDefault={reportDefault}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 truncate">
      <span className="text-slate-400">{label}:</span>
      <span className="truncate text-slate-700">{children}</span>
    </p>
  );
}
