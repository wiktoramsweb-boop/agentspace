"use client";

import { useActionState } from "react";
import { sendMonthlyReportNow } from "./actions";

export function ReportButton() {
  const [state, formAction, pending] = useActionState(sendMonthlyReportNow, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-emerald-500/50 hover:text-white disabled:opacity-60"
      >
        {pending ? "Wysyłam..." : "Wyślij raport na email"}
      </button>
      {state?.success && <span className="text-sm text-emerald-400">{state.success}</span>}
      {state?.error && <span className="text-sm text-red-400">{state.error}</span>}
    </form>
  );
}
