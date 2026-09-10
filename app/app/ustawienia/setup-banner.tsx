/**
 * Informacja dla CEO, gdy w bazie nie ma jeszcze tabeli ustawień firmy.
 * Strona działa i pokazuje wartości domyślne, ale zapis wymaga migracji.
 */
export function SetupBanner() {
  return (
    <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Jeden krok przed zapisem ustawień firmy</p>
      <p className="mt-1">
        Uruchom w Supabase (SQL Editor) plik <code className="rounded bg-amber-100 px-1">lib/SETUP-v22-ustawienia-firmy.sql</code>.
        Do tego czasu widzisz wartości domyślne, a zapis zwróci komunikat.
      </p>
    </div>
  );
}
