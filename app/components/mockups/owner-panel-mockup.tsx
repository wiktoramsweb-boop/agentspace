"use client";

import { motion } from "motion/react";

const AGENTS = [
  { name: "Anna Kwiatkowska", score: 8.9, trend: "+0.4", color: "emerald" },
  { name: "Marcin Wójcik", score: 8.1, trend: "+0.6", color: "emerald" },
  { name: "Joanna Lis", score: 7.4, trend: "+0.2", color: "emerald" },
  { name: "Krzysztof Nowak", score: 5.2, trend: "-0.3", color: "red" },
];

// SVG punkty dla wykresu trendu (od dołu lewa do góry prawa)
const CHART_POINTS = "0,40 25,38 50,32 75,28 100,24 125,22 150,18 175,16 200,12";

export function OwnerPanelMockup() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 font-sans text-xs">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Panel właściciela</p>
          <p className="text-base font-semibold text-white">Spectra Nieruchomości</p>
        </div>
        <div className="rounded-md bg-zinc-800/50 px-2 py-1 text-[10px] text-zinc-400">
          Styczeń 2026
        </div>
      </div>

      {/* Top stats */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <motion.div
          className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-[10px] text-zinc-500">Średni score</p>
          <p className="text-base font-semibold text-white">7.8</p>
          <p className="text-[9px] text-emerald-400">+0.6 w mc</p>
        </motion.div>
        <motion.div
          className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <p className="text-[10px] text-zinc-500">Sesje treningowe</p>
          <p className="text-base font-semibold text-white">73</p>
          <p className="text-[9px] text-emerald-400">+12%</p>
        </motion.div>
        <motion.div
          className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <p className="text-[10px] text-zinc-500">Aktywni agenci</p>
          <p className="text-base font-semibold text-white">5</p>
          <p className="text-[9px] text-zinc-500">z 5</p>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        className="mb-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] text-zinc-400">Trend score zespołu</p>
          <p className="text-[10px] text-emerald-400">↗ 8 tyg.</p>
        </div>
        <svg viewBox="0 0 200 50" className="w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.polyline
            points={CHART_POINTS}
            fill="none"
            stroke="rgb(52, 211, 153)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, delay: 0.4, ease: "easeInOut" }}
          />
          <motion.polygon
            points={`${CHART_POINTS} 200,50 0,50`}
            fill="url(#chart-gradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.6 }}
          />
        </svg>
      </motion.div>

      {/* Ranking */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Ranking agentów
          </p>
        </div>
        <div className="space-y-1.5">
          {AGENTS.map((agent, i) => (
            <motion.div
              key={agent.name}
              className="flex items-center justify-between rounded-lg bg-zinc-900/30 px-2.5 py-1.5"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
            >
              <div className="flex items-center gap-2">
                <span className="w-4 text-[10px] font-bold text-zinc-500">{i + 1}.</span>
                <span className="text-zinc-300">{agent.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tabular-nums text-white">
                  {agent.score}
                </span>
                <span
                  className={`text-[10px] ${
                    agent.color === "emerald" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {agent.trend}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Alert footer */}
      <motion.div
        className="absolute inset-x-5 bottom-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 backdrop-blur"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <p className="text-[10px] text-amber-200">
          ⚠ Krzysztof: 1 sesja w tym tygodniu. Porozmawiaj.
        </p>
      </motion.div>
    </div>
  );
}
