"use client";

import { useState, useTransition } from "react";
import {
  OKRESY,
  PAKIETY_KREDYTOW,
  cenaOkresu,
  cenaZaMiesiac,
  oszczednosc,
  type Okres,
} from "@/lib/abonament-cennik";
import type { Plan } from "@/lib/marketing/plans";
import { zamowAbonament, zamowPakietKredytow, zamowStroneWww } from "./actions";

/**
 * Wszystkie zakupy biura w jednym miejscu: abonament, strona internetowa
 * i dodatkowe kredyty AI.
 *
 * Okres rozliczeniowy wybiera się raz, na górze, i dotyczy abonamentu oraz
 * strony. Kredyty są jednorazowe, więc rabat za dłuższy okres ich nie dotyczy.
 */
export function Zakupy({
  plany,
  sugerowany,
  agentow,
  stronaMiesiecznie,
  wdrozenieStrony,
}: {
  plany: Plan[];
  sugerowany: string;
  agentow: number;
  stronaMiesiecznie: number;
  wdrozenieStrony: number;
}) {
  const [okres, setOkres] = useState<Okres>("yearly");
  const [plan, setPlan] = useState(sugerowany);
  const [wynik, setWynik] = useState<{ ok: boolean; tekst: string } | null>(null);
  const [pracuje, start] = useTransition();

  const zloz = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      setWynik(
        r.ok
          ? { ok: true, tekst: "Zamówienie przyjęte. Odezwiemy się z fakturą i danymi do przelewu." }
          : { ok: false, tekst: r.error ?? "Nie udało się." },
      );
    });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Jak chcecie płacić
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Im dłuższy okres, tym taniej. Dotyczy abonamentu i strony internetowej.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {OKRESY.map((o) => {
            const wybrany = o.id === okres;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setOkres(o.id)}
                aria-pressed={wybrany}
                className={`rounded-xl border p-4 text-left transition ${
                  wybrany
                    ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 dark:bg-emerald-500/15"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800"
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
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Abonament systemu
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          W biurze {agentow === 1 ? "jest 1 osoba" : `jest ${agentow} osób`}, więc podpowiadamy
          pakiet, który je obejmuje.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {plany.map((p) => {
            const wybrany = p.id === plan;
            const zaDuzy = agentow > p.maxAgents;
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
                  {cenaZaMiesiac(p.price, okres)} zł
                  <span className="ml-1 text-sm font-normal text-slate-500">/ mc netto</span>
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {okres === "monthly"
                    ? "Płatne co miesiąc."
                    : `Jedna płatność ${cenaOkresu(p.price, okres)} zł, oszczędzacie ${oszczednosc(p.price, okres)} zł.`}
                </p>
                {zaDuzy && (
                  <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-300">
                    Obejmuje do {p.maxAgents} osób.
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
        <button
          type="button"
          onClick={() => zloz(() => zamowAbonament(plan, okres))}
          disabled={pracuje}
          className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
        >
          {pracuje ? "Wysyłam..." : "Zamawiam abonament"}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Strona internetowa biura
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Oferty, zespół i poradnik zaciągają się wprost z systemu, więc strona aktualizuje się
          sama. Osobna usługa, system działa bez niej normalnie.
        </p>
        <p className="mt-4 text-3xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
          {cenaZaMiesiac(stronaMiesiecznie, okres)} zł
          <span className="ml-1 text-sm font-normal text-slate-500">/ mc netto</span>
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {okres === "monthly"
            ? `Płatne co miesiąc, plus ${wdrozenieStrony} zł wdrożenia.`
            : `Jedna płatność ${cenaOkresu(stronaMiesiecznie, okres)} zł, plus ${wdrozenieStrony} zł wdrożenia. Oszczędzacie ${oszczednosc(stronaMiesiecznie, okres)} zł.`}
        </p>
        <button
          type="button"
          onClick={() => zloz(() => zamowStroneWww(okres))}
          disabled={pracuje}
          className="mt-4 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Zamawiam stronę
        </button>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Dodatkowe kredyty AI
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Gdy miesięczna pula się kończy. Kupione kredyty nie przepadają z końcem miesiąca.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {PAKIETY_KREDYTOW.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
            >
              <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {p.kredyty.toLocaleString("pl-PL")}
                <span className="ml-1 text-sm font-normal text-slate-500">kredytów</span>
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{p.opis}</p>
              <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {p.cena} zł <span className="text-sm font-normal text-slate-500">netto</span>
              </p>
              <button
                type="button"
                onClick={() => zloz(() => zamowPakietKredytow(p.id))}
                disabled={pracuje}
                className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Dokupuję
              </button>
            </div>
          ))}
        </div>
      </section>

      {wynik && (
        <p className={`text-sm ${wynik.ok ? "text-emerald-600" : "text-red-600"}`}>{wynik.tekst}</p>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Ceny netto, bez umowy na czas określony. Po złożeniu zamówienia odzywamy się z fakturą
        i danymi do przelewu, a usługę włączamy po zaksięgowaniu wpłaty.
      </p>
    </div>
  );
}
