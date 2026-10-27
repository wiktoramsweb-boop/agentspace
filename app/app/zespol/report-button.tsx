"use client";

import { useActionState } from "react";
import { sendMonthlyReportNow, sendWeeklyReportNow } from "./actions";

export function ReportButton({ tygodniowy = false }: { tygodniowy?: boolean }) {
  const [state, formAction, pending] = useActionState(tygodniowy ? sendWeeklyReportNow : sendMonthlyReportNow, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-emerald-500/50 hover:text-slate-900 disabled:opacity-60"
      >
        {pending ? "Wysyłam..." : tygodniowy ? "Tydzień w biurze na email" : "Raport miesięczny na email"}
      </button>
      {state?.success && <span className="text-sm text-emerald-600">{state.success}</span>}
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
