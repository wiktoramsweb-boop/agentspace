import { MIGRACJA_V49 } from "@/lib/migracja";

/**
 * Ekran modułu, który czeka na migrację bazy. Mówi wprost, co zrobić,
 * zamiast pokazywać pustą listę, która wygląda jak błąd.
 */
export function BrakMigracji({ plik = MIGRACJA_V49, opis }: { plik?: string; opis?: string }) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-100 p-6">
      <p className="text-sm font-semibold text-amber-700">Ten moduł czeka na aktualizację bazy</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
        {opis ??
          "Kod jest już na miejscu, brakuje tabel w bazie. Wystarczy raz uruchomić plik migracji, a moduł zacznie działać od razu, bez ponownego wdrożenia."}
      </p>
      <ol className="mt-4 space-y-1.5 text-sm text-slate-700">
        <li>1. Otwórz Supabase, a w nim SQL Editor.</li>
        <li>
          2. Wklej całą zawartość pliku <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-slate-800">{plik}</code> i kliknij Run.
        </li>
        <li>3. Odśwież tę stronę.</li>
      </ol>
    </div>
  );
}
