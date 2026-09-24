"use client";

import { useState } from "react";
import { Card } from "./ui";
import type { Dict } from "@/lib/i18n/pl";

/**
 * Przełącznik „z systemem / bez systemu” - ten sam layout, dwa stany.
 * Kontrast robi robotę lepiej niż lista zalet.
 */

type StateKey = "with" | "without";

export function Compare({ t }: { t: Dict["home"]["compare"] }) {
  const [state, setState] = useState<StateKey>("with");
  const isWith = state === "with";
  const labels: Record<StateKey, string> = { with: t.withLabel, without: t.withoutLabel };

  return (
    <div className="flex flex-col items-center">
      {/* Przełącznik */}
      <div className="mb-12 inline-flex items-center gap-[2px] rounded-full border border-[var(--mk-hairline-strong)] bg-[var(--mk-surface-2)] p-[3px] backdrop-blur-sm">
        {(["with", "without"] as StateKey[]).map((key) => {
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
                    ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-[var(--mk-on-accent)] shadow-[0_8px_28px_-10px_rgba(16,185,129,0.8)]"
                    : "bg-[var(--mk-surface-3)] text-[var(--color-mk-text)]"
                  : "text-[var(--color-mk-muted)] hover:text-[var(--color-mk-text)]"
              }`}
            >
              {labels[key]}
            </button>
          );
        })}
      </div>

      <Card
        accent={isWith}
        className="w-full max-w-3xl overflow-hidden transition-colors duration-500"
      >
        <ul>
          {t.rows.map((row, i) => (
            <li
              key={row.label}
              className={`grid gap-2 px-6 py-5 md:grid-cols-[minmax(0,15rem)_1fr] md:gap-8 md:px-8 ${
                i > 0 ? "border-t border-[var(--mk-hairline)]" : ""
              }`}
            >
              <span className="text-[0.9375rem] text-[var(--color-mk-muted)]">
                {row.label}
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
                {isWith ? row.with : row.without}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
