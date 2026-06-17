"use client";

import { motion } from "motion/react";

export function AiCoachMockup() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 font-sans text-xs">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Sesja treningowa</p>
            <p className="text-[10px] text-zinc-500">Zimny telefon — agresywny klient</p>
          </div>
        </div>
        <div className="rounded-md bg-zinc-800/50 px-2 py-1 font-mono text-[10px] tabular-nums text-zinc-300">
          03:24
        </div>
      </div>

      {/* Transcript area */}
      <div className="mb-4 space-y-2.5">
        <div className="flex gap-2">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400">
            K
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-zinc-800/60 px-3 py-2 text-zinc-300">
            Słuchaj, nie chcę żadnych biur. Już raz mi obiecali złote góry.
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <div className="rounded-2xl rounded-tr-sm bg-emerald-500/15 px-3 py-2 text-emerald-50">
            Rozumiem Panie Krzysztofie. Co Pan przeszedł?
          </div>
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-zinc-950">
            M
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400">
            K
          </div>
          <motion.div
            className="rounded-2xl rounded-tl-sm bg-zinc-800/60 px-3 py-2 text-zinc-300"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "300ms" }} />
            </span>
          </motion.div>
        </div>
      </div>

      {/* Voice waveform + mic */}
      <div className="absolute inset-x-5 bottom-5">
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-3 backdrop-blur-xl">
          <div className="flex h-8 flex-1 items-center justify-center gap-[3px]">
            {Array.from({ length: 28 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-[2px] rounded-full bg-emerald-400"
                animate={{
                  height: [
                    `${15 + Math.random() * 25}%`,
                    `${55 + Math.random() * 40}%`,
                    `${15 + Math.random() * 25}%`,
                  ],
                }}
                transition={{
                  duration: 0.7 + Math.random() * 0.5,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }}
                style={{ height: "30%" }}
              />
            ))}
          </div>
          <motion.div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.6)]"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm5 9a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
            </svg>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
