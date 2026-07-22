"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";

export function SettingsForm({
  fullName,
  monthlyGoal,
}: {
  fullName: string;
  monthlyGoal: number;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-zinc-300">
          Imię i nazwisko
        </label>
        <input
          id="fullName"
          name="fullName"
          defaultValue={fullName}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div>
        <label htmlFor="monthlyGoal" className="mb-2 block text-sm font-medium text-zinc-300">
          Cel prowizji miesięcznej (zł)
        </label>
        <input
          id="monthlyGoal"
          name="monthlyGoal"
          type="number"
          min={0}
          step={1000}
          defaultValue={monthlyGoal || ""}
          placeholder="np. 20000"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        <p className="mt-1.5 text-xs text-zinc-500">Pomaga śledzić postęp na pulpicie.</p>
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-400">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {pending ? "Zapisuję..." : "Zapisz zmiany"}
      </button>
    </form>
  );
}
