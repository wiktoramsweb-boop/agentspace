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
          className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {pending ? "Zapisuję…" : "Zapisz"}
        </button>
      </div>
    </form>
  );
}

/** Sekcja ustawień: karta z nagłówkiem i opcjonalną akcją po prawej. */
export function Fieldset({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {aside}
      </header>
      <div className="space-y-4 px-5 py-5">{children}</div>
    </section>
  );
}

export const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </span>
  );
}
