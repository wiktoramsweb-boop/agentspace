import Link from "next/link";

/**
 * Pulpit po wygaśnięciu okresu próbnego albo abonamentu.
 *
 * Celowo nie wyrzucamy z aplikacji. Płatności online jeszcze nie ma, więc
 * nikt nie kupi abonamentu w pięć minut, a wyrzucony użytkownik zostaje bez
 * dostępu do własnych danych i bez informacji, co dalej. Zamiast tego
 * zamykamy moduły, a tutaj mówimy wprost, co się stało i co zrobić.
 */
export function DostepWstrzymany({ probny, czyCeo }: { probny: boolean; czyCeo: boolean }) {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 dark:border-amber-500/30 dark:bg-amber-500/10">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V7.5a4.5 4.5 0 1 0-9 0v3m-1.5 0h12a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V12A1.5 1.5 0 0 1 6 10.5Z"
            />
          </svg>
        </span>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {probny ? "Okres próbny się zakończył" : "Abonament wygasł"}
        </h1>

        <p className="mt-3 text-slate-700 dark:text-slate-200">
          Moduły są chwilowo zamknięte, ale <strong>wszystkie Wasze dane są bezpieczne</strong>:
          klienci, oferty, transakcje i dokumenty czekają nietknięte. Wrócą w całości zaraz po
          opłaceniu.
        </p>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Ustawienia zostają otwarte, więc możecie w każdej chwili sprawdzić dane firmy albo
          wyeksportować bazę.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {czyCeo ? (
            <Link
              href="/app/ustawienia/abonament"
              className="rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-500"
            >
              Przejdź do płatności
            </Link>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Abonament wykupuje właściciel biura. Daj mu znać, żeby odblokować zespół.
            </p>
          )}
          <Link
            href="/app/ustawienia"
            className="text-sm font-medium text-slate-600 underline-offset-2 transition hover:underline dark:text-slate-300"
          >
            Ustawienia
          </Link>
        </div>
      </div>
    </div>
  );
}
