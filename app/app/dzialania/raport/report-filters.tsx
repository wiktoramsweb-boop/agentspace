"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ACTIVITY_KINDS,
  ACTIVITY_PRIORITIES,
  ACTIVITY_PURPOSES,
  ACTIVITY_STATUSES,
} from "@/lib/types";

/**
 * Panel filtrów raportu. Stan trzymamy w adresie strony, więc wynik da się
 * zapisać w zakładkach albo wysłać komuś linkiem, a odświeżenie nic nie gubi.
 */
export function ReportFilterForm({
  agents,
  current,
}: {
  agents: { id: string; name: string }[];
  current: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, setPending] = useState(false);

  function apply(form: FormData) {
    setPending(true);
    const p = new URLSearchParams();
    for (const [k, v] of form.entries()) {
      const s = String(v).trim();
      if (s) p.set(k, s);
    }
    router.push(`/app/dzialania/raport?${p.toString()}`);
    setPending(false);
  }

  const hasAny = [...params.keys()].length > 0;

  return (
    <form action={apply} className="space-y-3">
      <Field label="Szukaj w temacie i opisie">
        <input name="q" defaultValue={current.q ?? ""} placeholder="np. pozysk" className={inp} />
      </Field>

      <Field label="Agent">
        <select name="agent" defaultValue={current.agent ?? ""} className={inp}>
          <option value="">wszyscy</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Termin od">
          <input type="date" name="from" defaultValue={current.from ?? ""} className={inp} />
        </Field>
        <Field label="Termin do">
          <input type="date" name="to" defaultValue={current.to ?? ""} className={inp} />
        </Field>
      </div>

      <Field label="Rodzaj">
        <select name="kind" defaultValue={current.kind ?? ""} className={inp}>
          <option value="">wszystkie</option>
          {ACTIVITY_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Status">
        <select name="status" defaultValue={current.status ?? ""} className={inp}>
          <option value="">wszystkie</option>
          {ACTIVITY_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Cel">
        <select name="purpose" defaultValue={current.purpose ?? ""} className={inp}>
          <option value="">wszystkie</option>
          {ACTIVITY_PURPOSES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Priorytet">
        <select name="priority" defaultValue={current.priority ?? ""} className={inp}>
          <option value="">wszystkie</option>
          {ACTIVITY_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-60"
        >
          Szukaj
        </button>
        {hasAny && (
          <button
            type="button"
            onClick={() => router.push("/app/dzialania/raport")}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Wyczyść
          </button>
        )}
      </div>
    </form>
  );
}

const inp =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      {children}
    </div>
  );
}
