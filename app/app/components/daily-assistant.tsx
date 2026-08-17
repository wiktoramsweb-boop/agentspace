"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { DailySuggestion } from "@/lib/ai/assistant";

// Wejście priorytetów, gdy AI je zwróci - delikatny stagger (raz dziennie, warto).
const listVariants = { show: { transition: { staggerChildren: 0.06 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.21, 0.47, 0.32, 0.98] as const } },
};

const CATEGORY_STYLE: Record<string, { label: string; className: string }> = {
  klient: { label: "Klient", className: "bg-cyan-100 text-cyan-700" },
  trening: { label: "Trening", className: "bg-violet-100 text-violet-700" },
  prowizja: { label: "Prowizja", className: "bg-emerald-100 text-emerald-700" },
  zadanie: { label: "Zadanie", className: "bg-amber-100 text-amber-700" },
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
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-slate-50 p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">AI Asystent Dnia</h2>
            <p className="text-xs text-slate-500">Priorytety na dziś na bazie Twoich klientów i pipeline</p>
          </div>
        </div>
        {state !== "loading" && (
          <button
            onClick={run}
            className="flex-shrink-0 rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-violet-400"
          >
            {state === "idle" ? "Zaplanuj dzień" : "Odśwież"}
          </button>
        )}
      </div>

      {state === "loading" && (
        <div className="flex items-center gap-3 py-4 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-violet-400" />
          Analizuję Twój dzień...
        </div>
      )}

      {state === "error" && <p className="py-2 text-sm text-red-600">{error}</p>}

      {state === "done" && suggestions.length > 0 && (
        <motion.ol className="space-y-3" initial="hidden" animate="show" variants={listVariants}>
          {suggestions.map((s, i) => {
            const cat = CATEGORY_STYLE[s.category] ?? CATEGORY_STYLE.zadanie;
            return (
              <motion.li key={i} variants={itemVariants} className="flex gap-3 rounded-xl bg-slate-50 p-4">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="font-medium text-slate-900">{s.title}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${cat.className}`}>
                      {cat.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{s.reason}</p>
                </div>
              </motion.li>
            );
          })}
        </motion.ol>
      )}

      {state === "done" && suggestions.length === 0 && (
        <p className="py-2 text-sm text-slate-500">
          Brak pilnych priorytetów - dodaj klientów i transakcje, żeby asystent miał z czego korzystać.
        </p>
      )}
    </div>
  );
}
