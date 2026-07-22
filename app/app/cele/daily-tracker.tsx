"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { saveTodayLog } from "./actions";
import { FUNNEL_STAGES, type DailyLog } from "@/lib/types";
import { formatPln } from "@/lib/format";

type Counts = Record<string, number>;

export function DailyTracker({
  log,
  dailyTargets,
  valuePerCall,
}: {
  log: DailyLog | null;
  dailyTargets: Record<string, number>;
  valuePerCall: number;
}) {
  const initial: Counts = {
    cold_calls: log?.cold_calls ?? 0,
    meetings: log?.meetings ?? 0,
    listings: log?.listings ?? 0,
    buyers: log?.buyers ?? 0,
    sales: log?.sales ?? 0,
  };
  const [counts, setCounts] = useState<Counts>(initial);
  const [pending, startTransition] = useTransition();
  const [celebrate, setCelebrate] = useState(false);

  const callTarget = dailyTargets.cold_calls ?? 0;
  const callsDone = counts.cold_calls;
  const callGoalMet = callTarget > 0 && callsDone >= callTarget;

  function change(key: string, delta: number) {
    setCounts((c) => {
      const next = Math.max(0, (c[key] ?? 0) + delta);
      const updated = { ...c, [key]: next };
      // Świętowanie gdy właśnie osiągnięto cel cold calli
      if (key === "cold_calls" && next >= callTarget && (c[key] ?? 0) < callTarget && callTarget > 0) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 2500);
      }
      persist(updated);
      return updated;
    });
  }

  function persist(c: Counts) {
    const fd = new FormData();
    Object.entries(c).forEach(([k, v]) => fd.set(k, String(v)));
    startTransition(() => saveTodayLog(fd));
  }

  const earnedToday = Math.round(callsDone * valuePerCall);

  return (
    <div className="relative">
      {/* Animacja świętowania */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          >
            <div className="rounded-3xl bg-emerald-500 px-8 py-6 text-center shadow-[0_0_60px_rgba(16,185,129,0.6)]">
              <motion.p
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="text-4xl"
              >
                🎯
              </motion.p>
              <p className="mt-2 text-lg font-bold text-zinc-950">Cel dnia wykonany!</p>
              <p className="text-sm text-zinc-900">Zbliżasz się do rocznego celu 💪</p>
            </div>
            {[...Array(12)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-2xl"
                initial={{ opacity: 1, y: 0, x: 0 }}
                animate={{ opacity: 0, y: -120 - Math.random() * 80, x: (Math.random() - 0.5) * 300 }}
                transition={{ duration: 1.6, delay: Math.random() * 0.3 }}
              >
                {["💰", "🎉", "✨", "🏆"][i % 4]}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Motywacja: wartość cold calla */}
      <div className={`mb-5 rounded-2xl border p-5 transition ${callGoalMet ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/[0.06]"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-300">
              Każdy cold call jest dziś wart{" "}
              <span className="font-bold text-emerald-400">{formatPln(valuePerCall)}</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {callsDone}/{callTarget} telefonów · wypracowane dziś: {formatPln(earnedToday)}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${callGoalMet ? "text-emerald-400" : "text-amber-400"}`}>
              {callTarget > 0 ? Math.min(100, Math.round((callsDone / callTarget) * 100)) : 0}%
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            className={`h-full rounded-full ${callGoalMet ? "bg-emerald-400" : "bg-gradient-to-r from-amber-400 to-emerald-400"}`}
            animate={{ width: `${callTarget > 0 ? Math.min(100, (callsDone / callTarget) * 100) : 0}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* Liczniki aktywności */}
      <div className="space-y-2">
        {FUNNEL_STAGES.map((stage) => {
          const val = counts[stage.key] ?? 0;
          const target = dailyTargets[stage.key] ?? 0;
          const met = target > 0 && val >= target;
          return (
            <div
              key={stage.key}
              className={`flex items-center justify-between gap-4 rounded-xl border p-3 transition ${met ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-700 bg-zinc-800/40"}`}
            >
              <div className="min-w-0">
                <p className="font-medium text-white">{stage.label}</p>
                <p className="text-xs text-zinc-500">
                  cel dziś: {target}{met && " ✓ wykonane"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => change(stage.key, -1)}
                  disabled={val === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-700 text-lg text-white transition hover:bg-zinc-600 disabled:opacity-40"
                >
                  −
                </button>
                <span className={`w-8 text-center font-mono text-lg font-bold ${met ? "text-emerald-400" : "text-white"}`}>
                  {val}
                </span>
                <button
                  onClick={() => change(stage.key, 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-lg font-bold text-zinc-950 transition hover:bg-emerald-400"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {pending && <p className="mt-2 text-right text-xs text-zinc-600">zapisywanie...</p>}
    </div>
  );
}
