"use client";

import { useState } from "react";
import { Frame } from "./frame";
import { Button, Tick } from "./ui";
import { PLANS, planForAgents } from "@/lib/marketing/plans";

/**
 * Cennik z licznikiem agentów — pakiet podświetla się sam w zależności
 * od wielkości biura. Cel: właściciel od razu widzi „to jest mój pakiet”,
 * zamiast porównywać trzy kolumny.
 *
 * Dane pakietów: lib/marketing/plans.ts
 */

export function Pricing() {
  const [agents, setAgents] = useState(6);
  const recommended = planForAgents(agents);

  return (
    <div className="flex flex-col items-center">
      {/* Licznik agentów */}
      <p className="mb-4 text-[0.9375rem] text-[var(--color-mk-muted)]">
        Ilu agentów pracuje w Twoim biurze?
      </p>

      <div className="mb-14 inline-flex items-center gap-[2px] rounded-full border border-[var(--color-mk-line)] bg-[var(--color-mk-surface)] p-[2px]">
        <button
          type="button"
          onClick={() => setAgents((n) => Math.max(1, n - 1))}
          aria-label="Mniej agentów"
          className="flex h-12 w-12 items-center justify-center rounded-l-full text-[var(--color-mk-text)] transition-colors hover:bg-white/[0.05] disabled:opacity-30"
          disabled={agents <= 1}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4.2 10h11.6" stroke="currentColor" strokeLinecap="round" />
          </svg>
        </button>

        <span className="flex h-12 min-w-[3.5rem] items-center justify-center px-2 text-lg font-medium text-[var(--color-mk-text)] tabular-nums">
          {agents >= 30 ? "30+" : agents}
        </span>

        <button
          type="button"
          onClick={() => setAgents((n) => Math.min(30, n + 1))}
          aria-label="Więcej agentów"
          className="flex h-12 w-12 items-center justify-center rounded-r-full text-[var(--color-mk-text)] transition-colors hover:bg-white/[0.05] disabled:opacity-30"
          disabled={agents >= 30}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4.2 10h11.6M10 4.2v11.6" stroke="currentColor" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Pakiety */}
      <div className="grid w-full gap-0 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isRecommended = plan.id === recommended.id;
          return (
            <Frame
              key={plan.id}
              className={`flex flex-col gap-8 p-8 transition-colors duration-300 ${
                isRecommended
                  ? "bg-[var(--color-mk-surface)]"
                  : "bg-transparent"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="mk-eyebrow">{plan.name}</span>
                {isRecommended ? (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      color: "var(--color-mk-accent)",
                      background: "rgba(47,109,246,0.1)",
                    }}
                  >
                    Dla Ciebie
                  </span>
                ) : null}
              </div>

              <div>
                <p className="mb-2 text-sm text-[var(--color-mk-muted)]">
                  {plan.tagline}
                </p>
                <p className="flex items-baseline gap-1.5">
                  {plan.priceFrom ? (
                    <span className="text-lg text-[var(--color-mk-muted)]">od</span>
                  ) : null}
                  <span className="text-4xl font-medium text-[var(--color-mk-text)] md:text-[2.75rem]">
                    {plan.price}
                  </span>
                  <span className="text-lg text-[var(--color-mk-muted)]">zł / mc</span>
                </p>
              </div>

              <ul className="flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-[0.9375rem] leading-snug text-[var(--color-mk-muted)]"
                  >
                    <Tick />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                href="/kontakt"
                variant={isRecommended ? "primary" : "ghost"}
                className="w-full"
              >
                Umów rozmowę
              </Button>
            </Frame>
          );
        })}
      </div>

      <p className="mt-8 text-center text-sm text-[var(--color-mk-muted)]">
        Ceny netto, rozliczenie miesięczne. Bez umowy na czas określony —
        rezygnujesz kiedy chcesz.
      </p>
    </div>
  );
}
