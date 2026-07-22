"use client";

import { useState } from "react";
import type { DailySuggestion } from "@/lib/ai/assistant";

const CATEGORY_STYLE: Record<string, { label: string; className: string }> = {
  klient: { label: "Klient", className: "bg-cyan-500/15 text-cyan-300" },
  trening: { label: "Trening", className: "bg-violet-500/15 text-violet-300" },
  prowizja: { label: "Prowizja", className: "bg-emerald-500/15 text-emerald-300" },
  zadanie: { label: "Zadanie", className: "bg-amber-500/15 text-amber-300" },
};

export function DailyAssistant() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [suggestions, setSuggestions] = useState<DailySuggestion[]>([]);
  const [error, setError] = useState("");

  async function run() {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/assistant/daily", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nie udało się wygenerować.");
        setState("error");
        return;
      }
      setSuggestions(data.suggestions ?? []);
      setState("done");
    } catch {
      setError("Brak połączenia.");
      setState("error");
    }
  }

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-zinc-900/40 p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-white">AI Asystent Dnia</h2>
            <p className="text-xs text-zinc-500">Priorytety na dziś na bazie Twoich klientów i pipeline</p>
          </div>
        </div>
        {state !== "loading" && (
          <button
            onClick={run}
            className="flex-shrink-0 rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            {state === "idle" ? "Zaplanuj dzień" : "Odśwież"}
          </button>
        )}
      </div>

      {state === "loading" && (
        <div className="flex items-center gap-3 py-4 text-sm text-zinc-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-400" />
          Analizuję Twój dzień...
        </div>
      )}

      {state === "error" && <p className="py-2 text-sm text-red-400">{error}</p>}

      {state === "done" && suggestions.length > 0 && (
        <ol className="space-y-3">
          {suggestions.map((s, i) => {
            const cat = CATEGORY_STYLE[s.category] ?? CATEGORY_STYLE.zadanie;
            return (
              <li key={i} className="flex gap-3 rounded-xl bg-zinc-900/40 p-4">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="font-medium text-white">{s.title}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${cat.className}`}>
                      {cat.label}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">{s.reason}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {state === "done" && suggestions.length === 0 && (
        <p className="py-2 text-sm text-zinc-500">
          Brak pilnych priorytetów — dodaj klientów i transakcje, żeby asystent miał z czego korzystać.
        </p>
      )}
    </div>
  );
}
