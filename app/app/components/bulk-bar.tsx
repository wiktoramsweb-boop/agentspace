"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  bulkAssignAgent,
  bulkDelete,
  bulkSetStage,
  bulkSetStatus,
  type BulkEntity,
} from "../bulk-actions";

export type BulkOption = { value: string; label: string };

/**
 * Zaznaczanie wielu pozycji na liście. Trzymamy zbiór identyfikatorów, bo
 * lista przychodzi stronami i po przejściu dalej zaznaczenie ma zostać.
 */
export function useSelection() {
  const [ids, setIds] = useState<Set<string>>(new Set());
  return {
    ids,
    has: (id: string) => ids.has(id),
    toggle: (id: string) =>
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    setMany: (list: string[], on: boolean) =>
      setIds((prev) => {
        const next = new Set(prev);
        list.forEach((id) => (on ? next.add(id) : next.delete(id)));
        return next;
      }),
    clear: () => setIds(new Set()),
    count: ids.size,
  };
}

export type Selection = ReturnType<typeof useSelection>;

/** Kwadracik zaznaczenia przy pozycji listy. Nie otwiera karty pod spodem. */
export function SelectBox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label
      className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onChange();
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        readOnly
        aria-label={label}
        className="h-4 w-4 cursor-pointer accent-emerald-500"
      />
    </label>
  );
}

/**
 * Belka akcji masowych. Pojawia się na dole, gdy coś jest zaznaczone:
 * zmiana statusu, opiekuna, etapu i usuwanie wielu pozycji naraz.
 */
export function BulkBar({
  entity,
  selection,
  statuses,
  stages,
  agents,
  canDelete,
  noun,
}: {
  entity: BulkEntity;
  selection: Selection;
  statuses: BulkOption[];
  stages?: BulkOption[];
  agents: { id: string; name: string }[];
  canDelete: boolean;
  /** Odmiana rzeczownika: [1, 2-4, 5+], np. ["klient", "klientów", "klientów"]. */
  noun: [string, string, string];
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const n = selection.count;
  const word = n === 1 ? noun[0] : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? noun[1] : noun[2];

  async function run(fn: () => Promise<{ ok: boolean; count?: number; error?: string }>, done: string) {
    setBusy(true);
    setError(null);
    setOkMsg(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Nie udało się wykonać akcji.");
      return;
    }
    setOkMsg(`${done} (${res.count ?? n})`);
    selection.clear();
    setConfirm(false);
    router.refresh();
    setTimeout(() => setOkMsg(null), 2500);
  }

  const ids = () => [...selection.ids];

  return (
    <AnimatePresence>
      {(n > 0 || okMsg) && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="fixed inset-x-3 bottom-4 z-[60] mx-auto max-w-3xl print-hide"
        >
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700/40 bg-slate-900 px-3 py-2.5 text-white shadow-2xl">
            {okMsg ? (
              <p className="px-2 py-1 text-sm font-medium text-emerald-300">{okMsg}</p>
            ) : (
              <>
                <span className="rounded-lg bg-white/10 px-2.5 py-1 text-sm font-semibold tabular-nums">
                  {n} {word}
                </span>

                <select
                  disabled={busy}
                  defaultValue=""
                  onChange={(e) => {
                    const v = e.target.value;
                    e.target.value = "";
                    if (v) void run(() => bulkSetStatus(entity, ids(), v), "Zmieniono status");
                  }}
                  className={select}
                >
                  <option value="">Zmień status…</option>
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                {stages && stages.length > 0 && (
                  <select
                    disabled={busy}
                    defaultValue=""
                    onChange={(e) => {
                      const v = e.target.value;
                      e.target.value = "";
                      if (v) void run(() => bulkSetStage(ids(), v), "Zmieniono etap");
                    }}
                    className={select}
                  >
                    <option value="">Zmień etap…</option>
                    {stages.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  disabled={busy}
                  defaultValue=""
                  onChange={(e) => {
                    const v = e.target.value;
                    e.target.value = "";
                    if (v) void run(() => bulkAssignAgent(entity, ids(), v), "Zmieniono opiekuna");
                  }}
                  className={select}
                >
                  <option value="">Przypisz agenta…</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>

                {canDelete &&
                  (confirm ? (
                    <span className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void run(() => bulkDelete(entity, ids()), "Usunięto")}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
                      >
                        Usuń {n}
                      </button>
                      <button type="button" onClick={() => setConfirm(false)} className="px-2 text-sm text-white/70 hover:text-white">
                        Nie
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirm(true)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                    >
                      Usuń
                    </button>
                  ))}

                <button
                  type="button"
                  onClick={selection.clear}
                  className="ml-auto rounded-lg px-2.5 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Odznacz
                </button>
              </>
            )}
            {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          </div>
          {error && (
            <p className="mt-2 rounded-xl bg-red-500 px-3 py-2 text-sm font-medium text-white shadow-lg">{error}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const select =
  "rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 [&>option]:text-slate-900";
