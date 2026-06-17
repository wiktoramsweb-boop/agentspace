"use client";

import { motion } from "motion/react";
import { StaggerContainer, StaggerItem } from "./fade-in";

const SCENARIOS = ["Zimny telefon", "Follow-up", "Obiekcje cenowe", "Negocjacja prowizji", "Muszę pomyśleć"];

const PERSONALITIES = [
  { label: "Agresywny", color: "from-red-500/40 to-red-500/0" },
  { label: "Wahający", color: "from-amber-500/40 to-amber-500/0" },
  { label: "Cenowy", color: "from-blue-500/40 to-blue-500/0" },
  { label: "Emocjonalny", color: "from-violet-500/40 to-violet-500/0" },
  { label: "Biznesowy", color: "from-emerald-500/40 to-emerald-500/0" },
];

const SCORES = [
  { label: "Otwarcie", value: 8 },
  { label: "Kwalifikacja", value: 4 },
  { label: "Obiekcje", value: 7 },
  { label: "Zamknięcie", value: 6 },
];

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
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 transition-colors hover:border-emerald-500/30">
      {/* Subtle gradient bg on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-cyan-500/0 transition-all duration-500 group-hover:from-emerald-500/[0.04] group-hover:to-cyan-500/[0.04]" />

      <div className="relative">
        {/* Number */}
        <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 font-mono text-sm font-bold text-emerald-400">
          {number}
        </div>

        {/* Illustration */}
        <div className="mb-5 h-32 overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/60 p-4">
          {children}
        </div>

        {/* Text */}
        <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-zinc-400">{body}</p>
      </div>
    </div>
  );
}

export function CoachFlow() {
  return (
    <StaggerContainer
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
      staggerDelay={0.08}
    >
      {/* 1. Wybierz scenariusz */}
      <StaggerItem>
        <StepCard
          number="01"
          title="Wybierz scenariusz"
          body="5 sytuacji z polskiego rynku RE: od zimnego telefonu po negocjację prowizji."
        >
          <div className="flex h-full flex-col justify-center gap-1.5">
            {SCENARIOS.slice(0, 4).map((scenario, i) => (
              <motion.div
                key={scenario}
                className={`rounded-md px-2 py-1 text-[10px] ${
                  i === 0
                    ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border border-zinc-800 bg-zinc-900/60 text-zinc-500"
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
          title="Wybierz osobowość klienta"
          body="AI gra klienta z konkretną postawą — od agresywnego po biznesowego."
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
                <div className="text-[10px] text-zinc-400">{p.label}</div>
              </motion.div>
            ))}
            <div className="mt-1 text-[9px] text-zinc-600">+ 2 inne</div>
          </div>
        </StepCard>
      </StaggerItem>

      {/* 3. Mówisz */}
      <StaggerItem>
        <StepCard
          number="03"
          title="Rozmawiasz głosem"
          body="Mikrofon w przeglądarce. Mówisz jak do prawdziwego klienta — naturalne tempo."
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
          title="AI odpowiada głosem"
          body="Polski głos, naturalny ton, kontruje argumenty. To nie ChatGPT — to symulacja klienta."
        >
          <div className="flex h-full flex-col justify-center gap-2">
            <motion.div
              className="flex justify-start"
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="max-w-[85%] rounded-lg rounded-tl-sm border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[10px] text-zinc-300">
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
          title="Scoring + feedback PL"
          body="Po sesji: wynik 1–10 w 4 kategoriach + konkretne sugestie poprawy."
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
                <span className="w-12 text-[9px] text-zinc-500">{score.label}</span>
                <div className="flex-1 h-1 overflow-hidden rounded-full bg-zinc-800">
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
                <span className="w-4 text-right font-mono text-[9px] text-zinc-400">
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
