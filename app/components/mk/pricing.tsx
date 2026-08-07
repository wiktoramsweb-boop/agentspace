"use client";

import { useState } from "react";
import { BorderBeam } from "../effects/border-beam";
import { Button, Card, Tick } from "./ui";
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

      <div className="mb-14 inline-flex items-center gap-[2px] rounded-full border border-white/10 bg-white/[0.04] p-[3px] backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setAgents((n) => Math.max(1, n - 1))}
          aria-label="Mniej agentów"
          className="flex h-12 w-12 items-center justify-center rounded-full text-[var(--color-mk-text)] transition-colors hover:bg-emerald-500/15 disabled:opacity-25"
          disabled={agents <= 1}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4.2 10h11.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

        <span className="flex h-12 min-w-[4rem] items-center justify-center px-2 text-xl font-semibold tabular-nums">
          <span className="grad">{agents >= 30 ? "30+" : agents}</span>
        </span>

        <button
          type="button"
          onClick={() => setAgents((n) => Math.min(30, n + 1))}
          aria-label="Więcej agentów"
          className="flex h-12 w-12 items-center justify-center rounded-full text-[var(--color-mk-text)] transition-colors hover:bg-emerald-500/15 disabled:opacity-25"
          disabled={agents >= 30}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M4.2 10h11.6M10 4.2v11.6"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Pakiety */}
      <div className="grid w-full gap-5 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isRecommended = plan.id === recommended.id;
          return (
            <Card
              key={plan.id}
              accent={isRecommended}
              className={`flex flex-col gap-8 overflow-hidden p-8 ${
                isRecommended ? "md:-translate-y-2" : ""
              }`}
            >
              {/* Świetlna linia okrążająca polecany pakiet */}
              {isRecommended ? (
                <>
                  <BorderBeam size={260} duration={9} colorFrom="#10b981" colorTo="#22d3ee" />
                  <BorderBeam
                    size={260}
                    duration={9}
                    colorFrom="#22d3ee"
                    colorTo="#10b981"
                    delay={4.5}
                  />
                </>
              ) : null}

              <div className="relative flex items-center justify-between gap-3">
                <span className="text-lg font-semibold text-[var(--color-mk-text)]">
                  {plan.name}
                </span>
                {isRecommended ? (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/25">
                    Dla Ciebie
                  </span>
                ) : null}
              </div>

              <div className="relative">
                <p className="mb-3 text-sm text-[var(--color-mk-muted)]">
                  {plan.tagline}
                </p>
                <p className="flex items-baseline gap-1.5">
                  {plan.priceFrom ? (
                    <span className="text-lg text-[var(--color-mk-muted)]">od</span>
                  ) : null}
                  <span
                    className={`text-5xl font-semibold ${
                      isRecommended ? "grad" : "text-[var(--color-mk-text)]"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span className="text-lg text-[var(--color-mk-muted)]">zł / mc</span>
                </p>
              </div>

              <ul className="relative flex flex-1 flex-col gap-3">
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

              <div className="relative">
                <Button
                  href="/kontakt"
                  variant={isRecommended ? "primary" : "ghost"}
                  className="w-full"
                >
                  Umów rozmowę
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-10 text-center text-sm text-[var(--color-mk-muted)]">
        Ceny netto, rozliczenie miesięczne. Bez umowy na czas określony —
        rezygnujesz kiedy chcesz.
      </p>
    </div>
  );
}
