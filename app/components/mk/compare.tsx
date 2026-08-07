"use client";

import { useState } from "react";
import { Card } from "./ui";

/**
 * Przełącznik „z systemem / bez systemu” — ten sam layout, dwa stany.
 * Kontrast robi robotę lepiej niż lista zalet.
 */

const STATES = {
  with: {
    label: "Z AgentSpace",
    rows: [
      ["Baza klientów", "Jedna wspólna karta klienta z historią i notatkami"],
      ["Kontakt do właściciela", "Wpisany w system, zostaje w biurze"],
      ["Wiesz co robi zespół", "Ranking, cele dzienne, realizacja lejka"],
      ["Rozliczenie prowizji", "Liczy się samo z transakcji"],
      ["Nowy agent", "Trenuje na AI od pierwszego dnia"],
      ["Raport miesięczny", "Przychodzi na e-mail 1. dnia miesiąca"],
    ],
  },
  without: {
    label: "Bez systemu",
    rows: [
      ["Baza klientów", "Excel, notes, WhatsApp i głowa agenta"],
      ["Kontakt do właściciela", "W telefonie agenta — odchodzi razem z nim"],
      ["Wiesz co robi zespół", "Tyle, ile powie na porannej odprawie"],
      ["Rozliczenie prowizji", "Arkusz, który ktoś musi domknąć ręcznie"],
      ["Nowy agent", "Uczy się na prawdziwych klientach"],
      ["Raport miesięczny", "Robisz go sam w niedzielę wieczorem"],
    ],
  },
} as const;

type StateKey = keyof typeof STATES;

export function Compare() {
  const [state, setState] = useState<StateKey>("with");
  const active = STATES[state];
  const isWith = state === "with";

  return (
    <div className="flex flex-col items-center">
      {/* Przełącznik */}
      <div className="mb-12 inline-flex items-center gap-[2px] rounded-full border border-white/10 bg-white/[0.04] p-[3px] backdrop-blur-sm">
        {(Object.keys(STATES) as StateKey[]).map((key) => {
          const isActive = key === state;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setState(key)}
              aria-pressed={isActive}
              className={`h-12 rounded-full px-7 text-[0.9375rem] font-medium transition-all duration-300 ${
                isActive
                  ? key === "with"
                    ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-zinc-950 shadow-[0_8px_28px_-10px_rgba(16,185,129,0.8)]"
                    : "bg-white/10 text-[var(--color-mk-text)]"
                  : "text-[var(--color-mk-muted)] hover:text-[var(--color-mk-text)]"
              }`}
            >
              {STATES[key].label}
            </button>
          );
        })}
      </div>

      <Card
        accent={isWith}
        className="w-full max-w-3xl overflow-hidden transition-colors duration-500"
      >
        <ul>
          {active.rows.map(([label, value], i) => (
            <li
              key={label}
              className={`grid gap-2 px-6 py-5 md:grid-cols-[minmax(0,15rem)_1fr] md:gap-8 md:px-8 ${
                i > 0 ? "border-t border-white/[0.06]" : ""
              }`}
            >
              <span className="text-[0.9375rem] text-[var(--color-mk-muted)]">
                {label}
              </span>
              <span
                className={`flex items-start gap-3 text-[0.9375rem] leading-snug ${
                  isWith ? "text-[var(--color-mk-text)]" : "text-[var(--color-mk-muted)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                    isWith ? "bg-emerald-400" : "bg-zinc-600"
                  }`}
                />
                {value}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
