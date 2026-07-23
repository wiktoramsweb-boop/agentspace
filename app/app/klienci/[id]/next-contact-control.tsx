"use client";

import { useState } from "react";
import { setNextContact, markClientContacted } from "../actions";

function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function NextContactControl({
  clientId,
  current,
}: {
  clientId: string;
  current: string | null;
}) {
  const [value, setValue] = useState(current ?? "");

  function set(date: string) {
    setValue(date);
    setNextContact(clientId, date || null);
  }

  return (
    <div className="space-y-3">
      <input
        type="date"
        value={value}
        onChange={(e) => set(e.target.value)}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
      />
      <div className="flex flex-wrap gap-2">
        <Quick label="Jutro" onClick={() => set(isoInDays(1))} />
        <Quick label="Za 3 dni" onClick={() => set(isoInDays(3))} />
        <Quick label="Za tydzień" onClick={() => set(isoInDays(7))} />
        {value && <Quick label="Wyczyść" onClick={() => set("")} />}
      </div>
      <button
        onClick={() => {
          setValue("");
          markClientContacted(clientId);
        }}
        className="w-full rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/25"
      >
        ✓ Kontakt wykonany dziś
      </button>
    </div>
  );
}

function Quick({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-emerald-500 hover:text-emerald-300"
    >
      {label}
    </button>
  );
}
