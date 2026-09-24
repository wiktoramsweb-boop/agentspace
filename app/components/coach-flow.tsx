"use client";

import { motion } from "motion/react";
import { StaggerContainer, StaggerItem } from "./fade-in";
import { getDict, toLocale } from "@/lib/i18n";

/** Kolory osobowości - kolejność zgodna ze słownikiem. */
const PERSONALITY_COLORS = [
  "from-red-500/40 to-red-500/0",
  "from-amber-500/40 to-amber-500/0",
  "from-blue-500/40 to-blue-500/0",
  "from-violet-500/40 to-violet-500/0",
  "from-emerald-500/40 to-emerald-500/0",
];

/** Przykładowe punkty w makiecie oceny. */
const SCORE_VALUES = [8, 4, 7, 6];

function StepCard({
  number,
  title,
  body,
  children,
}: {
  number: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] p-6 transition-colors hover:border-emerald-500/30">
      {/* Subtle gradient bg on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-cyan-500/0 transition-all duration-500 group-hover:from-emerald-500/[0.04] group-hover:to-cyan-500/[0.04]" />

      <div className="relative">
        {/* Number */}
        <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 font-mono text-sm font-bold text-emerald-400">
          {number}
        </div>

        {/* Illustration */}
        <div className="mb-5 h-32 overflow-hidden rounded-xl border border-[var(--mk-hairline)] bg-[var(--color-mk-bg)]/60 p-4">
          {children}
        </div>

        {/* Text */}
        <h3 className="mb-2 text-base font-semibold text-[var(--color-mk-text)]">{title}</h3>
        <p className="text-sm leading-relaxed text-[var(--color-mk-muted)]">{body}</p>
      </div>
    </div>
  );
}

export function CoachFlow({ lang = "pl" }: { lang?: string }) {
  const t = getDict(toLocale(lang)).coachFlow;
  const SCENARIOS = t.scenarios;
  const PERSONALITIES = t.personalities.map((label, i) => ({ label, color: PERSONALITY_COLORS[i] }));
  const SCORES = t.scores.map((label, i) => ({ label, value: SCORE_VALUES[i] }));

  return (
    <StaggerContainer
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
      staggerDelay={0.08}
    >
      {/* 1. Wybierz scenariusz */}
      <StaggerItem>
        <StepCard
          number="01"
          title={t.steps[0].title}
          body={t.steps[0].body}
        >
          <div className="flex h-full flex-col justify-center gap-1.5">
            {SCENARIOS.slice(0, 4).map((scenario, i) => (
              <motion.div
                key={scenario}
                className={`rounded-md px-2 py-1 text-[10px] ${
                  i === 0
                    ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] text-[var(--color-mk-muted)]"
                }`}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                {scenario}
              </motion.div>
            ))}
          </div>
        </StepCard>
      </StaggerItem>

      {/* 2. Wybierz osobowość */}
      <StaggerItem>
        <StepCard
          number="02"
          title={t.steps[1].title}
          body={t.steps[1].body}
        >
          <div className="flex h-full flex-col justify-center gap-1">
            {PERSONALITIES.slice(0, 3).map((p, i) => (
              <motion.div
                key={p.label}
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${p.color}`} />
                <div className="text-[10px] text-[var(--color-mk-muted)]">{p.label}</div>
              </motion.div>
            ))}
            <div className="mt-1 text-[9px] text-[var(--color-mk-muted)]">+ 2 inne</div>
          </div>
        </StepCard>
      </StaggerItem>

      {/* 3. Mówisz */}
      <StaggerItem>
        <StepCard
          number="03"
          title={t.steps[2].title}
          body={t.steps[2].body}
        >
          <div className="flex h-full items-center justify-center gap-1">
            {Array.from({ length: 22 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-[2px] rounded-full bg-emerald-400"
                animate={{
                  height: [`${20 + Math.random() * 25}%`, `${60 + Math.random() * 35}%`, `${20 + Math.random() * 25}%`],
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
        </StepCard>
      </StaggerItem>

      {/* 4. AI odpowiada */}
      <StaggerItem>
        <StepCard
          number="04"
          title={t.steps[3].title}
          body={t.steps[3].body}
        >
          <div className="flex h-full flex-col justify-center gap-2">
            <motion.div
              className="flex justify-start"
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="max-w-[85%] rounded-lg rounded-tl-sm border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] px-2 py-1 text-[10px] text-[var(--color-mk-text)]">
                Już raz mi obiecali...
              </div>
            </motion.div>
            <motion.div
              className="flex justify-end"
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="max-w-[85%] rounded-lg rounded-tr-sm border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-100">
                Rozumiem. Co Pan przeszedł?
              </div>
            </motion.div>
          </div>
        </StepCard>
      </StaggerItem>

      {/* 5. Scoring + feedback */}
      <StaggerItem>
        <StepCard
          number="05"
          title={t.steps[4].title}
          body={t.steps[4].body}
        >
          <div className="flex h-full flex-col justify-center gap-1.5">
            {SCORES.map((score, i) => (
              <motion.div
                key={score.label}
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <span className="w-12 text-[9px] text-[var(--color-mk-muted)]">{score.label}</span>
                <div className="flex-1 h-1 overflow-hidden rounded-full bg-[var(--mk-surface-3)]">
                  <motion.div
                    className={`h-full rounded-full ${
                      score.value >= 7
                        ? "bg-emerald-400"
                        : score.value >= 5
                          ? "bg-amber-400"
                          : "bg-red-400"
                    }`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${score.value * 10}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: "easeOut" }}
                  />
                </div>
                <span className="w-4 text-right font-mono text-[9px] text-[var(--color-mk-muted)]">
                  {score.value}
                </span>
              </motion.div>
            ))}
          </div>
        </StepCard>
      </StaggerItem>
    </StaggerContainer>
  );
}
