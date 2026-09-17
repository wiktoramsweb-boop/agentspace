"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { BellIcon } from "../components/icons";
import { ListToolbar, ServerPagination } from "../components/list-controls";
import { BulkBar, SelectBox, useSelection } from "../components/bulk-bar";
import { todayPL } from "@/lib/datetime";
import { CLIENT_STATUSES, CLIENT_TYPES, CLIENT_TYPE_LABELS, type ClientStatus } from "@/lib/types";
import type { ClientRow } from "@/lib/data-lists";
import type { ListQuery } from "@/lib/list-params";
import { formatPln, daysAgo, formatPhone } from "@/lib/format";

// Kolor awatara na podstawie nazwy - stabilny, żywy, w klimacie marki.
const AVATARS = [
  "from-emerald-400 to-cyan-500",
  "from-violet-400 to-fuchsia-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
  "from-rose-400 to-pink-500",
  "from-teal-400 to-emerald-500",
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATARS[h % AVATARS.length];
}

// Kolor lewego akcentu wiersza wg statusu.
const ACCENT: Record<ClientStatus, string> = {
  nowy: "bg-blue-400",
  w_kontakcie: "bg-cyan-400",
  oglada: "bg-violet-400",
  negocjacje: "bg-amber-400",
  zamkniety: "bg-emerald-400",
  stracony: "bg-red-400",
};

const SORTS = [
  { value: "zmiana", label: "Ostatnio zmienione" },
  { value: "nowe", label: "Najnowsze" },
  { value: "nazwa", label: "Nazwisko A-Z" },
  { value: "kontakt", label: "Najdawniej kontaktowani" },
  { value: "budzet", label: "Budżet malejąco" },
];

/**
 * Lista klientów. Filtrowanie, sortowanie i strony liczy baza, a przeglądarka
 * dostaje tylko jedną stronę wyników - to jedyna wersja, która zniesie bazę
 * z importu z innego systemu.
 */
export function ClientsBrowser({
  rows,
  query,
  total,
  pages,
  agents,
  canDelete,
}: {
  rows: ClientRow[];
  query: ListQuery;
  total: number;
  pages: number;
  agents: { id: string; name: string }[];
  canDelete: boolean;
}) {
  const reduce = useReducedMotion();
  const selection = useSelection();
  const today = todayPL();
  const pageIds = rows.map((r) => r.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selection.has(id));

  return (
    <div>
      <ListToolbar
        base="/app/klienci"
        query={query}
        total={total}
        sorts={SORTS}
        agents={agents}
        placeholder="Szukaj po nazwisku, numerze telefonu, e-mailu, firmie…"
        filters={{
          statuses: CLIENT_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          types: { label: "Typ klienta", options: CLIENT_TYPES.map((t) => ({ value: t.value, label: t.label })) },
          dateFields: [
            { value: "zmiana", label: "ostatniej zmiany" },
            { value: "nowe", label: "dodania" },
            { value: "kontakt", label: "ostatniego kontaktu" },
          ],
          city: true,
          range: { label: "Budżet", unit: "zł" },
          extra: {
            label: "Dodatkowo",
            options: [
              { value: "do_kontaktu", label: "Do kontaktu (termin minął)" },
              { value: "bez_kontaktu", label: "Nigdy nie kontaktowani" },
            ],
          },
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
          Zaznacz wszystkich na stronie ({rows.length})
        </label>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
          Nic nie pasuje do tych filtrów. Zmień je albo wyczyść, żeby zobaczyć całą bazę.
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((c, i) => {
            const status = CLIENT_STATUSES.find((s) => s.value === c.status);
            const typeLabel = CLIENT_TYPE_LABELS[c.type] ?? c.type;
            const due = c.next_contact_at && c.next_contact_at <= today;
            const picked = selection.has(c.id);
            return (
              <motion.div
                key={c.id}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : Math.min(0.2, i * 0.015), duration: 0.25 }}
                className={`hover-lift group relative flex items-center gap-2 overflow-hidden rounded-2xl border bg-white transition ${
                  picked ? "border-emerald-400 ring-1 ring-emerald-300" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className={`h-14 w-1.5 flex-shrink-0 rounded-r-full ${ACCENT[c.status]}`} />
                <SelectBox checked={picked} onChange={() => selection.toggle(c.id)} label={`Zaznacz ${c.name}`} />

                <Link href={`/app/klienci/${c.id}`} className="flex min-w-0 flex-1 items-center gap-4 py-4 pr-4">
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(c.name)} text-sm font-bold text-white`}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-0.5 sm:grid-cols-[1.4fr_1fr_1fr]">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{c.name}</p>
                      <p className="truncate text-sm text-slate-500">
                        {typeLabel}
                        {c.property && ` · ${c.property}`}
                      </p>
                    </div>
                    <div className="min-w-0 text-sm">
                      <p className="truncate text-slate-700">{formatPhone(c.phone)}</p>
                      <p className="truncate text-xs text-slate-500">
                        {c.budget_pln != null ? formatPln(c.budget_pln) : "-"}
                      </p>
                    </div>
                    <div className="hidden min-w-0 text-sm sm:block">
                      <p className="truncate text-slate-500">
                        <span className="text-slate-400">Opiekun: </span>
                        {c.opiekunName ?? "-"}
                      </p>
                      <p className="truncate text-xs text-slate-500">{daysAgo(c.last_contact_at)}</p>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-3">
                    {due && (
                      <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        <BellIcon className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {status && (
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <ServerPagination base="/app/klienci" query={query} total={total} pages={pages} label="kontaktów" />

      <BulkBar
        entity="clients"
        selection={selection}
        statuses={CLIENT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
        agents={agents}
        canDelete={canDelete}
        noun={["klient", "klientów", "klientów"]}
      />
    </div>
  );
}
