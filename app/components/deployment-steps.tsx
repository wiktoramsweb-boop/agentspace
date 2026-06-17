"use client";

import { motion } from "motion/react";
import { StaggerContainer, StaggerItem } from "./fade-in";

const STEPS = [
  {
    number: "01",
    title: "Zapraszasz swoich agentów",
    body: "Wpisujesz emaile, system wysyła zaproszenia. Każdy agent loguje się w 30 sekund, ma swoje konto, swoje dane.",
    Icon: MailIcon,
  },
  {
    number: "02",
    title: "Agenci trenują codziennie",
    body: "15 minut dziennie ćwiczenia z AI Coach. Praktyka czyni mistrza — różnica między początkującym a doświadczonym to dziesiątki rozmów.",
    Icon: MicIcon,
  },
  {
    number: "03",
    title: "Widzisz wzrost zespołu",
    body: "Po 30 dniach masz dane: kto rośnie, gdzie są luki, jakie scenariusze biuro robi słabo. Konkretne decyzje, nie przeczucia.",
    Icon: ChartIcon,
  },
];

function MailIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

export function DeploymentSteps() {
  return (
    <div className="relative">
      {/* Połącznik między krokami — tylko desktop */}
      <div className="absolute left-0 right-0 top-[44px] hidden h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent md:block" />

      <StaggerContainer className="relative grid gap-8 md:grid-cols-3 md:gap-6" staggerDelay={0.15}>
        {STEPS.map((step) => (
          <StaggerItem key={step.number}>
            <div className="group relative flex flex-col items-start">
              {/* Numer + ikona w okrągłym badge */}
              <div className="relative mb-6 flex items-center gap-4">
                {/* Number badge with gradient */}
                <motion.div
                  className="relative flex h-[88px] w-[88px] items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
                  {/* Number */}
                  <span className="relative bg-gradient-to-br from-emerald-400 to-cyan-400 bg-clip-text font-mono text-4xl font-bold text-transparent">
                    {step.number}
                  </span>
                </motion.div>

                {/* Icon */}
                <div className="text-emerald-400/80">
                  <step.Icon />
                </div>
              </div>

              <h3 className="mb-3 text-xl font-semibold text-white">{step.title}</h3>
              <p className="leading-relaxed text-zinc-400">{step.body}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
