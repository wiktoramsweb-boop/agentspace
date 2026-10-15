import { createSupabaseAdmin } from "./supabase/admin";

/**
 * Czy baza ma już migrację v49.
 *
 * Potrzebne tam, gdzie nowa kolumna wchodzi do istniejącego zapisu, np.
 * `edited_by` przy edycji oferty. Bez tej kolumny PostgREST odrzuca cały
 * zapis, a agent traci zmiany w ofercie tylko dlatego, że ktoś nie uruchomił
 * SQL-a. Sprawdzamy raz i pamiętamy wynik: gdy migracja już jest, nie
 * cofnie się, a gdy jej nie ma, sprawdzamy ponownie po minucie.
 */

let potwierdzona = false;
let sprawdzonoO = 0;

export async function maV49(): Promise<boolean> {
  if (potwierdzona) return true;
  if (Date.now() - sprawdzonoO < 60_000) return false;
  sprawdzonoO = Date.now();
  try {
    const { error } = await createSupabaseAdmin()
      .from("property_price_history")
      .select("id", { head: true, count: "exact" })
      .limit(1);
    potwierdzona = !error;
  } catch {
    potwierdzona = false;
  }
  return potwierdzona;
}
