"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
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
  const [counts, setCounts] = useState<Counts>({
    cold_calls: log?.cold_calls ?? 0,
    meetings: log?.meetings ?? 0,
    listings: log?.listings ?? 0,
    buyers: log?.buyers ?? 0,
    sales: log?.sales ?? 0,
  });
  const [celebrate, setCelebrate] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const callTarget = dailyTargets.cold_calls ?? 0;
  const callsDone = counts.cold_calls;
  const callPct = callTarget > 0 ? Math.min(100, Math.round((callsDone / callTarget) * 100)) : 0;
  const callGoalMet = callTarget > 0 && callsDone >= callTarget;

  // Zapis debounced — klik jest natychmiastowy, zapis 900ms po ostatniej zmianie
  function scheduleSave(next: Counts) {
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const fd = new FormData();
      Object.entries(next).forEach(([k, v]) => fd.set(k, String(v)));
      void saveTodayLog(fd).then(() => setSaved(true));
    }, 900);
  }

  function change(key: string, delta: number) {
    setCounts((c) => {
      const prevVal = c[key] ?? 0;
      const nextVal = Math.max(0, prevVal + delta);
      const next = { ...c, [key]: nextVal };
      if (
        key === "cold_calls" &&
        callTarget > 0 &&
        nextVal >= callTarget &&
        prevVal < callTarget
      ) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 2600);
      }
      scheduleSave(next);
      return next;
    });
  }

  const earnedToday = Math.round(callsDone * valuePerCall);
  // Ring geometry
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div className="relative">
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
          >
            <div className="rounded-3xl bg-emerald-500 px-8 py-6 text-center shadow-[0_0_80px_rgba(16,185,129,0.7)]">
              <motion.p animate={{ scale: [1, 1.25, 1], rotate: [0, 8, -8, 0] }} transition={{ duration: 0.6, repeat: 2 }} className="text-5xl">
                🎯
              </motion.p>
              <p className="mt-2 text-lg font-bold text-zinc-950">Cel dnia wykonany!</p>
              <p className="text-sm text-zinc-900">Bliżej rocznego celu 💪</p>
            </div>
            {[...Array(16)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-2xl"
                initial={{ opacity: 1, y: 0, x: 0 }}
                animate={{ opacity: 0, y: -140 - Math.random() * 100, x: (Math.random() - 0.5) * 360 }}
                transition={{ duration: 1.8, delay: Math.random() * 0.4 }}
              >
                {["💰", "🎉", "✨", "🏆", "🔥"][i % 5]}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duży animowany ring postępu telefonów */}
      <div className="mb-6 flex items-center gap-6 rounded-2xl border border-zinc-700 bg-zinc-800/40 p-5">
        <div className="relative flex-shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
            <circle cx="64" cy="64" r={R} fill="none" stroke="#3f3f46" strokeWidth="10" />
            <motion.circle
              cx="64"
              cy="64"
              r={R}
              fill="none"
              stroke={callGoalMet ? "#34d399" : "#fbbf24"}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={false}
              animate={{ strokeDashoffset: C - (C * callPct) / 100 }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${callGoalMet ? "text-emerald-400" : "text-amber-400"}`}>
              {callPct}%
            </span>
            <span className="text-[10px] text-zinc-400">
              {callsDone}/{callTarget}
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-zinc-300">
            Każdy cold call wart dziś{" "}
            <span className="font-bold text-emerald-400">{formatPln(valuePerCall)}</span>
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">{formatPln(earnedToday)}</p>
          <p className="text-xs text-zinc-500">wypracowane dziś telefonami</p>
          {callGoalMet ? (
            <p className="mt-2 text-sm font-medium text-emerald-400">✓ Cel telefonów wykonany!</p>
          ) : (
            <p className="mt-2 text-sm text-amber-400">
              Jeszcze {Math.max(0, callTarget - callsDone)} telefonów do celu
            </p>
          )}
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
              className={`flex items-center justify-between gap-4 rounded-xl border p-3 transition ${met ? "border-emerald-500/40 bg-emerald-500/10" : "border-zinc-700 bg-zinc-800/40"}`}
            >
              <div className="min-w-0">
                <p className="font-medium text-white">{stage.label}</p>
                <p className="text-xs text-zinc-400">cel dziś: {target}{met && " · ✓"}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => change(stage.key, -1)}
                  disabled={val === 0}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-700 text-2xl text-white transition active:scale-90 hover:bg-zinc-600 disabled:opacity-30"
                >
                  −
                </button>
                <span className={`w-8 text-center font-mono text-xl font-bold ${met ? "text-emerald-400" : "text-white"}`}>
                  {val}
                </span>
                <button
                  type="button"
                  onClick={() => change(stage.key, 1)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-2xl font-bold text-zinc-950 transition active:scale-90 hover:bg-emerald-400"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-right text-xs text-zinc-600">{saved ? "✓ zapisano" : "zmiany zapisują się automatycznie"}</p>
    </div>
  );
}
