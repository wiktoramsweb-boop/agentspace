import Link from "next/link";
import type { Przewodnik } from "@/lib/data-przewodnik";

/**
 * Zajawka przewodnika na pulpicie.
 *
 * Pokazuje pierwszy niezrobiony krok, a nie całą listę: nowe biuro ma na
 * starcie dość rzeczy do ogarnięcia i potrzebuje jednej następnej czynności,
 * nie spisu wszystkich. Znika, gdy kroki niezbędne są domknięte.
 */
export function BanerPrzewodnika({ przewodnik }: { przewodnik: Przewodnik }) {
  if (przewodnik.ukonczony) return null;

  const kroki = przewodnik.sekcje.flatMap((s) => s.kroki);
  const nastepny = kroki.find((k) => k.wymagany && !k.zrobiony) ?? kroki.find((k) => !k.zrobiony);
  if (!nastepny) return null;

  const pct = przewodnik.wszystkich
    ? Math.round((przewodnik.zrobione / przewodnik.wszystkich) * 100)
    : 0;

  return (
    <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] to-slate-50 p-6 dark:to-slate-800">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Pierwsze kroki w AgentSpace
        </h2>
        <span className="text-sm font-medium text-emerald-600">
          {przewodnik.zrobione}/{przewodnik.wszystkich}
        </span>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">Następny krok</p>
      <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{nastepny.tytul}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{nastepny.po_co}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={nastepny.href}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          {nastepny.cta}
        </Link>
        <Link
          href="/app/start"
          className="text-sm font-medium text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-300"
        >
          Zobacz wszystkie kroki →
        </Link>
      </div>
    </div>
  );
}
