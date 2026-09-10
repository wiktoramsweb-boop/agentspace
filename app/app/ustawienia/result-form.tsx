"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "./company-actions";

/**
 * Formularz ustawień z jednym przyciskiem „Zapisz" i czytelnym wynikiem.
 * Po zapisie odświeżamy dane serwera, żeby inne ekrany widziały zmianę.
 */
export function ResultForm({
  action,
  children,
  disabled = false,
}: {
  action: (fd: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setResult(null);
        start(async () => {
          const res = await action(fd);
          setResult(res);
          if (res.ok) router.refresh();
        });
      }}
      onChange={() => result?.ok && setResult(null)}
      className="space-y-6"
    >
      {children}

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg shadow-slate-900/5 backdrop-blur">
        {result && !result.ok && <p className="mr-auto text-sm text-red-600">{result.error}</p>}
        {result?.ok && <p className="mr-auto text-sm font-medium text-emerald-600">Zapisano</p>}
        <button
          type="submit"
          disabled={pending || disabled}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
        >
          {pending ? "Zapisuję…" : "Zapisz"}
        </button>
      </div>
    </form>
  );
}

/** Sekcja z tytułem na krawędzi ramki, jak w ASARI („Dane firmy", „Adres korespondencyjny"). */
export function Fieldset({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white px-5 pb-5 pt-2">
      <legend className="flex items-center gap-2 px-2 text-base font-semibold text-slate-900">{title}{aside}</legend>
      <div className="mt-3 space-y-4">{children}</div>
    </fieldset>
  );
}

export const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15";

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </span>
  );
}
