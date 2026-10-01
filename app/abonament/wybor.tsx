"use client";

import { useState, useTransition } from "react";
import { OKRESY, cenaOkresu, cenaZaMiesiac, oszczednosc, type Okres } from "@/lib/abonament-cennik";
import type { Plan } from "@/lib/marketing/plans";
import { zamow } from "./actions";

/**
 * Wybór pakietu i okresu rozliczeniowego.
 *
 * Pakiet jest podpowiedziany na podstawie liczby osób w biurze, bo właściciel
 * nie powinien musieć sam sprawdzać, w który próg się łapie.
 */
export function WyborAbonamentu({
  plany,
  sugerowany,
  agentow,
  czyCeo,
}: {
  plany: Plan[];
  sugerowany: string;
  agentow: number;
  czyCeo: boolean;
}) {
  const [okres, setOkres] = useState<Okres>("yearly");
  const [plan, setPlan] = useState(sugerowany);
  const [wynik, setWynik] = useState<{ ok: boolean; tekst: string } | null>(null);
  const [wysyla, start] = useTransition();

  const zloz = () =>
    start(async () => {
      const r = await zamow(plan, okres);
      setWynik(
        r.ok
          ? { ok: true, tekst: "Zamówienie przyjęte. Odezwiemy się z danymi do przelewu." }
          : { ok: false, tekst: r.error },
      );
    });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Jak chcesz płacić
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {OKRESY.map((o) => {
            const wybrany = o.id === okres;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setOkres(o.id)}
                aria-pressed={wybrany}
                className={`rounded-2xl border p-4 text-left transition ${
                  wybrany
                    ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 dark:bg-emerald-500/15"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{o.nazwa}</span>
                  {o.rabat > 0 && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                      -{Math.round(o.rabat * 100)}%
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{o.opis}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Pakiet{" "}
          <span className="font-normal normal-case tracking-normal text-slate-400">
            (w biurze {agentow === 1 ? "jest 1 osoba" : `jest ${agentow} osób`})
          </span>
        </h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          {plany.map((p) => {
            const wybrany = p.id === plan;
            const zaDuzy = agentow > p.maxAgents;
            const zaOkres = cenaOkresu(p.price, okres);
            const naMiesiac = cenaZaMiesiac(p.price, okres);
            const taniej = oszczednosc(p.price, okres);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => !zaDuzy && setPlan(p.id)}
                disabled={zaDuzy}
                aria-pressed={wybrany}
                className={`rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  wybrany
                    ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 dark:bg-emerald-500/15"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {p.name}
                  </span>
                  {p.id === sugerowany && (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900">
                      dla Was
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{p.tagline}</p>

                <p className="mt-4 text-3xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {naMiesiac} zł
                  <span className="ml-1 text-sm font-normal text-slate-500">/ mc netto</span>
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {okres === "monthly" ? (
                    "Płatne co miesiąc."
                  ) : (
                    <>
                      Jedna płatność {zaOkres} zł. Oszczędzasz {taniej} zł.
                    </>
                  )}
                </p>

                {zaDuzy && (
                  <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-300">
                    Za mało miejsc: obejmuje do {p.maxAgents} osób.
                  </p>
                )}

                <ul className="mt-4 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span aria-hidden="true" className="text-emerald-600">
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={zloz}
          disabled={!czyCeo || wysyla}
          className="rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
        >
          {wysyla ? "Wysyłam..." : "Zamawiam abonament"}
        </button>
        {!czyCeo && (
          <span className="text-sm text-slate-500">
            Abonament wykupuje właściciel biura. Przekaż mu, że dostęp wygasł.
          </span>
        )}
        {wynik && (
          <span className={`text-sm ${wynik.ok ? "text-emerald-600" : "text-red-600"}`}>
            {wynik.tekst}
          </span>
        )}
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Ceny netto, bez umowy na czas określony. Po złożeniu zamówienia odzywamy się z fakturą
        i danymi do przelewu, a dostęp włączamy po zaksięgowaniu wpłaty.
      </p>
    </div>
  );
}
