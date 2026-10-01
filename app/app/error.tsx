"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Błąd wewnątrz aplikacji (np. baza chwilowo nie odpowiada).
 *
 * Bez tego pliku agent dostawał angielskie „This page couldn't load”
 * bez nawigacji. Tu zostaje menu boczne, polski komunikat i ponowienie.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl py-12">
      <p className="text-sm font-medium uppercase tracking-wider text-slate-400">Coś poszło nie tak</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Nie udało się wczytać tej strony</h1>
      <p className="mt-3 leading-relaxed text-slate-600">
        To zwykle chwilowy problem z połączeniem. Twoje dane są bezpieczne. Spróbuj ponownie za
        moment, a jeśli błąd się powtarza, napisz do nas i podaj kod poniżej.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Spróbuj ponownie
        </button>
        <Link
          href="/app"
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Wróć na pulpit
        </Link>
      </div>

      {error.digest && <p className="mt-6 font-mono text-xs text-slate-400">Kod błędu: {error.digest}</p>}
    </div>
  );
}
