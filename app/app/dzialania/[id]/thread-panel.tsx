"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ACTIVITY_ICONS } from "../../components/icons";
import { ActivityModal, type ThreadParent } from "../activity-modal";
import { formatDateTimePL } from "@/lib/datetime";
import { ACTIVITY_KIND_MAP, ACTIVITY_STATUSES, CALL_DIRECTIONS, type ActivityKind } from "@/lib/types";

const STATUS_MAP = Object.fromEntries(ACTIVITY_STATUSES.map((s) => [s.value, s]));
const DIRECTION_MAP = Object.fromEntries(CALL_DIRECTIONS.map((c) => [c.value, c.label]));

export type ThreadItem = {
  id: string;
  subject: string;
  kind: ActivityKind;
  status: string;
  due_at: string | null;
  description: string | null;
  duration_s: number | null;
  call_direction: string | null;
  assigneeNames: string[];
  isRoot: boolean;
  isCurrent: boolean;
};

function fmtDuration(s: number | null): string | null {
  if (!s) return null;
  const m = Math.floor(s / 60);
  return m > 0 ? `${m} min ${s % 60} s` : `${s} s`;
}

/**
 * Oś czasu wątku: pierwsza rozmowa i wszystkie kolejne pod tym samym numerem.
 * Dzięki temu agent dzwoni ponownie bez tworzenia drugiego kontaktu.
 */
export function ThreadPanel({
  parent,
  items,
  agents,
  clients,
  properties,
  reportDefault,
}: {
  parent: ThreadParent;
  items: ThreadItem[];
  agents: { id: string; name: string }[];
  clients: { id: string; name: string; phone?: string | null }[];
  properties: { id: string; name: string }[];
  reportDefault: boolean;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">Przebieg kontaktu</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {items.length === 1
              ? "Na razie jedna rozmowa. Kolejne dopisuj tutaj, żeby nie mnożyć kontaktów."
              : `${items.length} rozmów w tym wątku, od najnowszej.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
        >
          + Dopisz rozmowę
        </button>
      </div>

      <ol className="relative space-y-3 border-l border-slate-200 pl-5">
        <AnimatePresence initial={false}>
          {items.map((it, i) => {
            const km = ACTIVITY_KIND_MAP[it.kind] ?? ACTIVITY_KIND_MAP.polaczenie;
            const sm = STATUS_MAP[it.status] ?? STATUS_MAP.zaplanowane;
            const Icon = ACTIVITY_ICONS[it.kind] ?? ACTIVITY_ICONS.polaczenie;
            const dur = fmtDuration(it.duration_s);
            return (
              <motion.li
                key={it.id}
                initial={reduce ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reduce ? 0 : Math.min(0.25, i * 0.04), duration: 0.25 }}
                className={`relative rounded-xl border p-3 transition ${
                  it.isCurrent ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span
                  className={`absolute -left-[30px] top-3.5 flex h-6 w-6 items-center justify-center rounded-full text-white ring-4 ring-white ${km.tile}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>

                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {it.isCurrent ? (
                    <span className="truncate text-sm font-semibold text-slate-900">{it.subject}</span>
                  ) : (
                    <a
                      href={`/app/dzialania/${it.id}`}
                      className="truncate text-sm font-semibold text-slate-900 hover:text-emerald-600 hover:underline"
                    >
                      {it.subject}
                    </a>
                  )}
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${sm.color}`}>{sm.label}</span>
                  {it.isRoot && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      pierwszy kontakt
                    </span>
                  )}
                  {it.isCurrent && (
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      oglądasz
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  {formatDateTimePL(it.due_at)}
                  {it.call_direction ? ` · ${DIRECTION_MAP[it.call_direction] ?? it.call_direction}` : ""}
                  {dur ? ` · ${dur}` : ""}
                  {it.assigneeNames.length ? ` · ${it.assigneeNames.join(", ")}` : ""}
                </p>
                {it.description && <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-600">{it.description}</p>}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>

      <ActivityModal
        trigger="none"
        open={open}
        onOpenChange={setOpen}
        parent={parent}
        agents={agents}
        clients={clients}
        properties={properties}
        reportDefault={reportDefault}
      />
    </div>
  );
}
