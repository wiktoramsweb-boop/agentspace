"use client";

import { useTransition } from "react";
import { deleteActivityAndBack, toggleActivityDone } from "../actions";

export function ActivityActions({ id, done }: { id: string; done: boolean }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      <button
        onClick={() => start(() => toggleActivityDone(id, !done))}
        disabled={pending}
        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
          done
            ? "border border-slate-300 text-slate-700 hover:bg-slate-100"
            : "bg-emerald-500 text-white hover:bg-emerald-400"
        }`}
      >
        {done ? "Cofnij wykonanie" : "✓ Oznacz jako wykonane"}
      </button>
      <button
        onClick={() => {
          if (confirm("Usunąć to działanie? Tej operacji nie da się cofnąć.")) {
            start(() => deleteActivityAndBack(id));
          }
        }}
        disabled={pending}
        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-600 transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
      >
        Usuń
      </button>
    </div>
  );
}
