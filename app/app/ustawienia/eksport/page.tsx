import { requireModul } from "@/lib/auth";
import { ZBIORY, NAZWY_ZBIOROW } from "@/lib/eksport-csv";

const OPISY: Record<string, string> = {
  klienci: "Kontakty z typem, statusem, budżetem, notatkami i datami kontaktu.",
  nieruchomosci: "Oferty biura z ceną, metrażem, statusem i opisem.",
  transakcje: "Transakcje z wartością, podziałem prowizji i zarobkiem agenta.",
  leady: "Zapytania z reklam i formularzy wraz ze źródłem i kampanią.",
  dzialania: "Zadania i kontakty z terminem oraz statusem wykonania.",
};

/**
 * Eksport danych biura.
 *
 * Strona istnieje, bo na stronie głównej obiecujemy „zero lock-inu”.
 * Dane schodzą jako CSV otwierany dwuklikiem w Excelu, zawsze z zakresu
 * całego biura i zawsze dostępne, także po rezygnacji z abonamentu.
 */
export default async function EksportPage() {
  await requireModul("ustawienia");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Eksport danych</h2>
        <p className="mt-1 text-sm text-slate-500">
          Każdy plik otwiera się w Excelu dwuklikiem. To są Wasze dane i możecie je
          zabrać w każdej chwili, także po zakończeniu współpracy.
        </p>
      </div>

      {/* Całość osobno i na wierzchu: to jest procedura wyjścia i ma być
          jednym kliknięciem, a nie zbieraniem pięciu plików po kolei. */}
      {/* Zwykły <a>, nie <Link>: to jest pobranie pliku, a nawigacja klienta
          przerwałaby je i zostawiła pustą stronę zamiast archiwum. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/api/eksport/wszystko"
        className="group flex items-start justify-between gap-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 transition-colors hover:border-emerald-500"
      >
        <span className="min-w-0">
          <span className="block font-semibold text-emerald-900">Pobierz wszystko (ZIP)</span>
          <span className="mt-1 block text-sm leading-snug text-emerald-800">
            Komplet danych biura w jednym archiwum: klienci, oferty, transakcje, leady
            i działania. Przy większej bazie pobranie może potrwać kilkanaście sekund.
          </span>
        </span>
        <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </span>
      </a>

      <div className="grid gap-3 sm:grid-cols-2">
        {ZBIORY.map((zbior) => (
          <a
            key={zbior}
            href={`/api/eksport/${zbior}`}
            className="group flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-emerald-400"
          >
            <span className="min-w-0">
              <span className="block font-semibold text-slate-900">{NAZWY_ZBIOROW[zbior]}</span>
              <span className="mt-1 block text-sm leading-snug text-slate-500">{OPISY[zbior]}</span>
            </span>
            <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
            </span>
          </a>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Pliki zawierają dane całego biura, więc pobrać je może tylko osoba
        z dostępem do ustawień firmy. Format CSV ze średnikiem, kodowanie UTF-8.
      </p>
    </div>
  );
}
