"use client";

import { useState } from "react";
import { createDeal, setDealStatus, deleteDeal } from "./actions";
import type { DealStatus } from "@/lib/types";

export function NewDealButton() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
      >
        + Dodaj transakcję
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/80 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Nowa transakcja</h2>
          <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white">
            ✕
          </button>
        </div>
        <form action={createDeal} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Opis</label>
            <input
              name="title"
              required
              placeholder="Sprzedaż mieszkania ul. Zbożowa"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Prowizja (zł)</label>
            <input
              name="commission"
              type="number"
              required
              placeholder="8000"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">
              Przewidywane zamknięcie <span className="text-zinc-600">(opcjonalnie)</span>
            </label>
            <input
              name="expectedClose"
              type="date"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Dodaj
          </button>
        </form>
      </div>
    </div>
  );
}

export function DealActions({ dealId, status }: { dealId: string; status: DealStatus }) {
  return (
    <div className="flex items-center gap-2">
      {status === "w_toku" && (
        <>
          <button
            onClick={() => setDealStatus(dealId, "zamkniety")}
            className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25"
          >
            Zamknij ✓
          </button>
          <button
            onClick={() => setDealStatus(dealId, "przepadl")}
            className="rounded-lg bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-red-500/15 hover:text-red-300"
          >
            Przepadł
          </button>
        </>
      )}
      {status !== "w_toku" && (
        <button
          onClick={() => setDealStatus(dealId, "w_toku")}
          className="rounded-lg bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800"
        >
          Wznów
        </button>
      )}
      <button
        onClick={() => deleteDeal(dealId)}
        className="text-xs text-zinc-600 transition hover:text-red-400"
        title="Usuń"
      >
        ✕
      </button>
    </div>
  );
}
