"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import type { Dict } from "@/lib/i18n/pl";

/**
 * Pokaz AI Coacha na stronie głównej.
 *
 * Rozmowa odtwarza się sama, zdanie po zdaniu, razem ze wskaźnikiem pisania,
 * falą głosu i oceną na końcu. To najszybszy sposób, żeby ktoś zrozumiał,
 * na czym polega trening, bez czytania trzech akapitów.
 */

const ease = [0.22, 0.61, 0.36, 1] as const;

type CoachDict = Dict["coach"];

export function CoachLive({ t }: { t: CoachDict }) {
  const SCENARIOS = t.scenarios;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduce = useReducedMotion();

  const [scenario, setScenario] = useState(0);
  const [step, setStep] = useState(0);
  const current = SCENARIOS[scenario];
  const done = step >= current.lines.length;

  // Rozmowa rusza dopiero, gdy sekcja jest na ekranie: inaczej odwiedzający
  // trafia na gotowy zapis i nie widzi, jak trening przebiega.
  useEffect(() => {
    if (!inView || reduce) {
      if (reduce) setStep(SCENARIOS[scenario].lines.length);
      return;
    }
    if (done) {
      const restart = setTimeout(() => {
        setScenario((s) => (s + 1) % SCENARIOS.length);
        setStep(0);
      }, 4200);
      return () => clearTimeout(restart);
    }
    const next = setTimeout(() => setStep((s) => s + 1), step === 0 ? 700 : 1900);
    return () => clearTimeout(next);
  }, [inView, reduce, step, done, scenario]);

  const visible = useMemo(() => current.lines.slice(0, step), [current, step]);
  const typing = !done && step > 0 && current.lines[step]?.who === "klient";

  return (
    <div ref={ref} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14">
      {/* ── telefon z rozmową ── */}
      <div className="relative mx-auto w-full max-w-[420px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-8 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 30%, color-mix(in srgb, var(--color-mk-accent) 22%, transparent), transparent 70%)",
          }}
        />

        <div className="mk-force-dark overflow-hidden rounded-[32px] border border-[var(--mk-hairline-strong)] bg-[#0c0f14] p-3 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.75)]">
          <div className="rounded-[24px] bg-[#0f1319] p-4">
            {/* pasek sesji */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
                  <span className="absolute inset-0 animate-ping rounded-xl bg-emerald-500/20" />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span>
                  <span className="block text-[13px] font-semibold text-white">{current.title}</span>
                  <span className="block text-[11px] text-zinc-500">{current.person}</span>
                </span>
              </div>
              <span className="rounded-md bg-white/5 px-2 py-1 font-mono text-[11px] tabular-nums text-zinc-300">
                0{Math.min(4, step)}:{String(12 + step * 17).padStart(2, "0")}
              </span>
            </div>

            {/* rozmowa */}
            <div className="flex min-h-[290px] flex-col justify-end gap-2.5">
              <AnimatePresence initial={false}>
                {visible.map((line, i) => (
                  <motion.div
                    key={`${current.key}-${i}`}
                    initial={reduce ? false : { opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease }}
                    className={`flex gap-2 ${line.who === "agent" ? "justify-end" : ""}`}
                  >
                    {line.who === "klient" && (
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-zinc-300">
                        K
                      </span>
                    )}
                    <span className="max-w-[78%]">
                      {line.tag && (
                        <span className="mb-1 inline-block rounded-md bg-amber-400/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                          {line.tag}
                        </span>
                      )}
                      <span
                        className={`block rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                          line.who === "agent"
                            ? "rounded-tr-sm bg-emerald-500/18 text-emerald-50"
                            : "rounded-tl-sm bg-white/8 text-zinc-200"
                        }`}
                      >
                        {line.text}
                      </span>
                    </span>
                    {line.who === "agent" && (
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-emerald-950">
                        Ty
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {typing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-zinc-300">
                    K
                  </span>
                  <span className="flex gap-1 rounded-2xl rounded-tl-sm bg-white/8 px-3.5 py-3">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                        animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }}
                      />
                    ))}
                  </span>
                </motion.div>
              )}
            </div>

            {/* ocena po rozmowie */}
            <AnimatePresence>
              {done && (
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease }}
                  className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-3.5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-white">{t.scoreTitle}</span>
                    <span className="font-mono text-lg font-semibold text-emerald-300">
                      {(current.scores.reduce((a, s) => a + s.value, 0) / current.scores.length).toFixed(1)}
                      <span className="text-[11px] text-emerald-500/70">/10</span>
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {current.scores.map(({ label, value }, i) => (
                      <div key={label} className="grid grid-cols-[1fr_auto] items-center gap-2">
                        <span className="text-[11px] text-zinc-400">{label}</span>
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                            <motion.span
                              className="block h-full rounded-full bg-emerald-400"
                              initial={{ width: 0 }}
                              animate={{ width: `${value * 10}%` }}
                              transition={{ duration: 0.8, delay: 0.15 + i * 0.1, ease }}
                            />
                          </span>
                          <span className="w-5 text-right font-mono text-[11px] text-zinc-300">{value}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-white/10 pt-3 text-[11.5px] leading-relaxed text-zinc-300">
                    {current.tip}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* pasek nagrywania */}
            {!done && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                <span className="flex h-7 flex-1 items-center gap-[3px]">
                  {Array.from({ length: 26 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="w-[2px] flex-1 rounded-full bg-emerald-400/80"
                      animate={reduce ? undefined : { height: ["22%", `${35 + ((i * 37) % 55)}%`, "22%"] }}
                      transition={{ duration: 0.9 + (i % 5) * 0.12, repeat: Infinity, delay: i * 0.04, ease: "easeInOut" }}
                      style={{ height: "24%" }}
                    />
                  ))}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-emerald-950">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm5 9a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
                  </svg>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── opis i wybór obiekcji ── */}
      <div className="flex flex-col justify-center">
        <p className="mk-eyebrow mb-6">{t.eyebrow}</p>
        <h2 className="mb-5 text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.1]">
          {t.title.a}<span className="grad">{t.title.b}</span>
        </h2>
        <p className="mb-7 max-w-[54ch] text-[1.0625rem] leading-relaxed text-[var(--color-mk-muted)]">
          {t.lead}
        </p>

        <p className="mb-3 text-[13px] uppercase tracking-wider text-[var(--color-mk-muted)]">
          {t.pick}
        </p>
        <div className="mb-8 flex flex-wrap gap-2">
          {SCENARIOS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setScenario(i);
                setStep(0);
              }}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                scenario === i
                  ? "border-transparent bg-[var(--color-mk-accent)] text-[var(--mk-on-accent)]"
                  : "border-[var(--mk-hairline-strong)] text-[var(--color-mk-muted)] hover:text-[var(--color-mk-text)]"
              }`}
            >
              {s.chip}
            </button>
          ))}
        </div>

        <ul className="grid gap-3">
          {t.points.map((point) => (
            <li key={point.title} className="flex gap-3">
              <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-mk-accent)]" />
              <span>
                <span className="font-medium text-[var(--color-mk-text)]">{point.title}. </span>
                <span className="text-[0.9375rem] text-[var(--color-mk-muted)]">{point.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
