"use client";

import { useState } from "react";
import { saveGoal } from "./actions";
import type { Goal } from "@/lib/types";

export function GoalSetup({ goal }: { goal: Goal | null }) {
  const [advanced, setAdvanced] = useState(false);

  return (
    <form action={saveGoal} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Roczny cel finansowy (zł)"
          name="annualIncome"
          type="number"
          defaultValue={goal?.annual_income_pln ?? 120000}
          hint="Ile chcesz zarobić na prowizjach w rok"
        />
        <Field
          label="Średnia prowizja z transakcji (zł)"
          name="avgCommission"
          type="number"
          defaultValue={goal?.avg_commission_pln ?? 8000}
          hint="Ile średnio zarabiasz na jednej transakcji"
        />
      </div>

      <Field
        label="Dni robocze w tygodniu"
        name="workdays"
        type="number"
        defaultValue={goal?.workdays_per_week ?? 5}
      />

      <button
        type="button"
        onClick={() => setAdvanced((v) => !v)}
        className="text-sm text-emerald-400 hover:text-emerald-300"
      >
        {advanced ? "− Ukryj" : "+ Dostosuj"} współczynniki lejka (zaawansowane)
      </button>

      {advanced && (
        <div className="grid gap-4 rounded-2xl border border-zinc-700 bg-zinc-800/40 p-4 sm:grid-cols-3">
          <Field label="Cold calle na 1 spotkanie" name="callsPerMeeting" type="number" step="0.5" defaultValue={goal?.calls_per_meeting ?? 12} />
          <Field label="Spotkania na 1 umowę" name="meetingsPerListing" type="number" step="0.5" defaultValue={goal?.meetings_per_listing ?? 3} />
          <Field label="Umowy na 1 sprzedaż" name="listingsPerSale" type="number" step="0.1" defaultValue={goal?.listings_per_sale ?? 1.6} />
        </div>
      )}

      <button
        type="submit"
        className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
      >
        {goal ? "Zapisz cel" : "Ustaw mój cel →"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  hint,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  hint?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-200">{label}</label>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
