/**
 * Rozpoznawanie błędu „nie ma takiej tabeli albo kolumny".
 *
 * Kod wchodzi na produkcję przed migracją: Vercel buduje po każdym pushu,
 * a SQL uruchamia się ręcznie w Supabase. Przez ten czas nowy moduł ma
 * powiedzieć, czego mu brakuje, zamiast pokazać ekran błędu.
 */

export const MIGRACJA_V49 = "lib/SETUP-v49-rozbudowa.sql";

/** Kody i treści, którymi PostgREST i Postgres zgłaszają brak obiektu. */
export function brakTabeli(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  const kod = err.code ?? "";
  const tresc = err.message ?? "";
  return (
    kod === "42P01" || // undefined_table
    kod === "42703" || // undefined_column
    kod === "PGRST205" || // tabela spoza cache schematu
    kod === "PGRST204" || // kolumna spoza cache schematu
    /does not exist|Could not find the (table|.*column)/i.test(tresc)
  );
}

export function komunikatMigracji(plik = MIGRACJA_V49): string {
  return `Ten moduł czeka na aktualizację bazy. Uruchom w Supabase plik ${plik}.`;
}
