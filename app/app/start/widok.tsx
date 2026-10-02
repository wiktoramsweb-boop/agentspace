import Link from "next/link";
import type { KrokPrzewodnika, Przewodnik } from "@/lib/data-przewodnik";
import { PageHeader } from "../components/ui";
import { Pomin } from "./pomin";

/**
 * Widok przewodnika, bez pobierania danych.
 *
 * Oddzielony od strony, żeby dało się go obejrzeć w stanie świeżego biura
 * bez zakładania konta: inaczej jedyny sposób na zobaczenie pierwszego kroku
 * to rejestracja nowego biura.
 */
export function PrzewodnikWidok({ p, czyCeo }: { p: Przewodnik; czyCeo: boolean }) {
  const kroki = p.sekcje.flatMap((s) => s.kroki);
  const pct = p.wszystkich ? Math.round((p.zrobione / p.wszystkich) * 100) : 100;

  const teraz =
    kroki.find((k) => k.wymagany && !k.zrobiony) ?? kroki.find((k) => !k.zrobiony) ?? null;
  const dalej = kroki.filter((k) => !k.zrobiony && k.id !== teraz?.id);
  const zrobione = kroki.filter((k) => k.zrobiony);
  // Numer liczymy z postępu, nie z pozycji na liście. Kroki niezbędne idą
  // przed dodatkowymi, więc pozycja potrafi skoczyć na „7 z 8” przy trzech
  // zrobionych i wygląda to jak błąd.
  const numer = Math.min(p.zrobione + 1, p.wszystkich);

  return (
    <>
      <PageHeader
        title={teraz ? "Ustawmy Wasze biuro" : "Biuro jest ustawione"}
        subtitle={
          teraz
            ? "Po kolei, jedna rzecz naraz. Każdy krok odhacza się sam, gdy go zrobisz."
            : "Wszystko, co niezbędne, jest zrobione. Ten ekran zniknie z menu."
        }
      />

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div className="h-2 min-w-[12rem] flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
          {p.zrobione} z {p.wszystkich}
        </span>
      </div>

      {teraz ? (
        <section className="rounded-2xl border-2 border-emerald-500/40 bg-white p-6 shadow-sm dark:bg-slate-800 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Krok {numer} z {kroki.length}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {teraz.tytul}
          </h2>

          <p className="mt-4 text-slate-700 dark:text-slate-200">{teraz.po_co}</p>

          <div className="mt-5 rounded-xl bg-slate-100 p-4 dark:bg-slate-700/60">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Gdzie kliknąć
            </p>
            <p className="mt-1 text-slate-800 dark:text-slate-100">{teraz.jak}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href={teraz.href}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-500"
            >
              {teraz.cta}
            </Link>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Wróć tutaj, gdy skończysz. Krok odhaczy się sam.
            </span>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <p className="text-slate-800 dark:text-slate-100">
            Możecie pracować normalnie. Jeśli zostały jakieś kroki dodatkowe, znajdziecie je niżej.
          </p>
          <Link
            href="/app"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Przejdź do pulpitu
          </Link>
        </section>
      )}

      {dalej.length > 0 && (
        <section className="mt-10">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Potem
          </h3>
          <ul className="mt-3 space-y-2">
            {dalej.map((k) => (
              <Podglad key={k.id} krok={k} />
            ))}
          </ul>
        </section>
      )}

      {zrobione.length > 0 && (
        <section className="mt-10">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Już zrobione
          </h3>
          <ul className="mt-3 space-y-2">
            {zrobione.map((k) => (
              <li
                key={k.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white"
                >
                  ✓
                </span>
                <span className="text-slate-500 line-through dark:text-slate-400">{k.tytul}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {czyCeo && (
        <div className="mt-10">
          <Pomin />
        </div>
      )}
    </>
  );
}

function Podglad({ krok }: { krok: KrokPrzewodnika }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-slate-100">{krok.tytul}</span>
          {krok.wymagany && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
              niezbędne
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{krok.jak}</p>
      </div>
      <Link
        href={krok.href}
        className="shrink-0 text-sm font-medium text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-300"
      >
        Przejdź →
      </Link>
    </li>
  );
}
