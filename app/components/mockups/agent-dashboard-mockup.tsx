"use client";

import { motion } from "motion/react";

const TASKS = [
  { label: "Oddzwoń do Pana Kowalskiego (Mieszko 12)", done: true },
  { label: "Oględziny ul. Wielicka 134 — 15:00", done: true },
  { label: "Follow-up: rodzina Nowak (3 propozycje)", done: false },
  { label: "Trening AI Coach — scenariusz Obiekcje", done: false },
];

const STATS = [
  { label: "Telefony", value: 7, target: 10 },
  { label: "Spotkania", value: 3, target: 4 },
  { label: "Oferty", value: 12, target: 15 },
];

export function AgentDashboardMockup() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 font-sans text-xs">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-zinc-500">Środa, 22 stycznia</p>
          <p className="text-base font-semibold text-white">Cześć Marcin 👋</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-zinc-950">
          M
        </div>
      </div>

      {/* Commission banner */}
      <motion.div
        className="mb-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-[10px] text-emerald-300">Prowizja w tym miesiącu</p>
        <p className="text-xl font-semibold text-white">14 200 zł</p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            initial={{ width: "0%" }}
            animate={{ width: "62%" }}
            transition={{ duration: 1.4, delay: 0.3, ease: "easeOut" }}
          />
        </div>
        <p className="mt-1 text-[10px] text-zinc-400">62% celu (23 000 zł)</p>
      </motion.div>

      {/* Today's stats */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
          >
            <p className="text-[10px] text-zinc-500">{stat.label}</p>
            <p className="text-sm font-semibold text-white">
              {stat.value}
              <span className="text-zinc-600">/{stat.target}</span>
            </p>
          </motion.div>
        ))}
      </div>

      {/* Tasks */}
      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Plan dnia
          </p>
          <p className="text-[10px] text-zinc-600">2 z 4</p>
        </div>
        <div className="space-y-1.5">
          {TASKS.map((task, i) => (
            <motion.div
              key={task.label}
              className="flex items-center gap-2 rounded-lg bg-zinc-900/30 px-2.5 py-2"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.7 + i * 0.08 }}
            >
              <div
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  task.done
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-zinc-700 bg-transparent"
                }`}
              >
                {task.done && (
                  <svg
                    className="h-3 w-3 text-zinc-950"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <p
                className={`flex-1 ${
                  task.done ? "text-zinc-600 line-through" : "text-zinc-300"
                }`}
              >
                {task.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Ranking footer */}
      <div className="absolute inset-x-5 bottom-3 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 backdrop-blur">
        <p className="text-[10px] text-zinc-400">
          Ranking biura: <span className="font-semibold text-white">2 / 5</span>
        </p>
        <p className="text-[10px] text-emerald-400">↑ awans z 4 miejsca</p>
      </div>
    </div>
  );
}
