"use client";

import { useState } from "react";
import { Frame } from "./frame";

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

  return (
    <div className="flex flex-col items-center">
      {/* Przełącznik */}
      <div className="mb-10 inline-flex items-center gap-[2px] rounded-full border border-[var(--color-mk-line)] bg-[var(--color-mk-surface)] p-[2px]">
        {(Object.keys(STATES) as StateKey[]).map((key) => {
          const isActive = key === state;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setState(key)}
              aria-pressed={isActive}
              className={`h-12 rounded-full px-6 text-[0.9375rem] font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-[var(--color-mk-accent)] text-white"
                  : "text-[var(--color-mk-muted)] hover:text-[var(--color-mk-text)]"
              }`}
            >
              {STATES[key].label}
            </button>
          );
        })}
      </div>

      <Frame className="w-full max-w-3xl">
        <ul>
          {active.rows.map(([label, value], i) => (
            <li
              key={label}
              className={`grid gap-2 px-6 py-5 md:grid-cols-[minmax(0,15rem)_1fr] md:gap-8 md:px-8 ${
                i > 0 ? "border-t border-[var(--color-mk-line)]" : ""
              }`}
            >
              <span className="text-[0.9375rem] text-[var(--color-mk-muted)]">
                {label}
              </span>
              <span
                className={`text-[0.9375rem] leading-snug ${
                  state === "with"
                    ? "text-[var(--color-mk-text)]"
                    : "text-[var(--color-mk-muted)]"
                }`}
              >
                {value}
              </span>
            </li>
          ))}
        </ul>
      </Frame>
    </div>
  );
}
