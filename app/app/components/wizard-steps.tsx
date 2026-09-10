"use client";

import { motion } from "motion/react";

/**
 * Pasek kroków kreatorów (oferta, kontakt, poszukiwanie).
 *
 * Numerowane kółka połączone linią, która wypełnia się wraz z postępem.
 * Własny układ AgentSpace zamiast zakładek podkreślanych jak w ASARI.
 * Każdy krok jest klikalny, bo agent często wraca poprawić jedno pole.
 */
export function WizardSteps({
  steps,
  step,
  onStep,
}: {
  steps: readonly string[];
  step: number;
  onStep: (i: number) => void;
}) {
  const progress = steps.length > 1 ? step / (steps.length - 1) : 1;
  // Kółka stoją na środku równych kolumn, więc linia biegnie od środka
  // pierwszej do środka ostatniej: wypełnienie trafia dokładnie w bieżący krok.
  const edge = `${50 / steps.length}%`;

  return (
    <div className="flex-shrink-0 border-b border-slate-200 bg-slate-50 px-5 pb-4 pt-5">
      <ol className="relative flex items-start justify-between gap-2">
        {/* Linia pod kółkami: szara ścieżka i wypełnienie postępu. */}
        <span
          aria-hidden="true"
          className="absolute top-4 h-0.5 -translate-y-1/2 rounded-full bg-slate-200"
          style={{ left: edge, right: edge }}
        />
        <motion.span
          aria-hidden="true"
          className="absolute top-4 h-0.5 -translate-y-1/2 origin-left rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
          style={{ left: edge, right: edge }}
          initial={false}
          animate={{ scaleX: progress }}
          transition={{ type: "spring", stiffness: 260, damping: 32 }}
        />

        {steps.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label} className="relative z-10 flex min-w-0 flex-1 flex-col items-center">
              <button
                type="button"
                onClick={() => onStep(i)}
                aria-current={current ? "step" : undefined}
                className="group flex flex-col items-center gap-1.5 focus:outline-none"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-emerald-400 group-focus-visible:ring-offset-2 ${
                    current
                      ? "btn-ink scale-110 shadow-lg shadow-slate-900/20"
                      : done
                        ? "bg-emerald-500 text-white"
                        : "border-2 border-slate-200 bg-white text-slate-400 group-hover:border-slate-300"
                  }`}
                >
                  {done ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={`hidden max-w-[7.5rem] truncate text-[11px] font-medium sm:block ${
                    current ? "text-slate-900" : done ? "text-emerald-700" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {/* Na telefonie nazwy kroków się nie mieszczą - pokazujemy tylko bieżący. */}
      <p className="mt-2 text-center text-xs font-medium text-slate-700 sm:hidden">
        {step + 1}. {steps[step]}
      </p>
    </div>
  );
}

/** Stopka kreatora: licznik kroków i przyciski w jednym, spójnym układzie. */
export function WizardNav({
  step,
  total,
  onBack,
  onNext,
  onCancel,
  children,
}: {
  step: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  /** Przycisk zapisu (SubmitButton), zawsze widoczny - można zapisać z każdego kroku. */
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-t border-slate-200 px-5 py-3.5">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      >
        Anuluj
      </button>
      <span className="text-xs tabular-nums text-slate-400">
        {step + 1} / {total}
      </span>
      <div className="ml-auto flex items-center gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Wstecz
          </button>
        )}
        {step < total - 1 && (
          <button
            type="button"
            onClick={onNext}
            className="btn-ink group inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition"
          >
            Dalej
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
