import { createSupabaseAdmin } from "./supabase/admin";

/**
 * Zapis błędu do dziennika (v41).
 *
 * `console.error` trafia do logów Vercela, które na planie Hobby żyją krótko
 * i nie dają się przeszukać. Przez to o awarii dowiadywaliśmy się od biura,
 * a nie z systemu. Tutaj błąd zostaje w bazie i da się go odczytać później,
 * także z panelu operatora i z diagnostyki.
 *
 * Zasady:
 *  - nigdy nie rzuca wyjątkiem, bo logowanie błędu nie może wywrócić akcji,
 *    w której ten błąd wystąpił,
 *  - nie zapisuje danych wpisanych przez użytkownika ani danych klientów biur;
 *    dziennik błędów nie ma się stać drugą bazą danych osobowych,
 *  - przycina szczegóły, bo liczy się pierwsza linia, a nie cały stos.
 */

const LIMIT_SZCZEGOLOW = 1500;

function opis(err: unknown): { wiadomosc: string; szczegoly: string | null } {
  if (err instanceof Error) {
    return {
      wiadomosc: err.message.slice(0, 300),
      szczegoly: (err.stack ?? "").slice(0, LIMIT_SZCZEGOLOW) || null,
    };
  }
  if (typeof err === "string") return { wiadomosc: err.slice(0, 300), szczegoly: null };
  try {
    return { wiadomosc: "Nieznany błąd", szczegoly: JSON.stringify(err).slice(0, LIMIT_SZCZEGOLOW) };
  } catch {
    return { wiadomosc: "Nieznany błąd", szczegoly: null };
  }
}

export async function zapiszBlad(
  gdzie: string,
  err: unknown,
  opcje?: { agencyId?: string | null; szczegoly?: string },
): Promise<void> {
  const { wiadomosc, szczegoly } = opis(err);

  // Log w konsoli zostaje: przy awarii bazy to jedyne, co się uchowa.
  console.error(`[${gdzie}] ${wiadomosc}`);

  try {
    await createSupabaseAdmin()
      .from("app_errors")
      .insert({
        gdzie: gdzie.slice(0, 120),
        wiadomosc,
        szczegoly: (opcje?.szczegoly ?? szczegoly)?.slice(0, LIMIT_SZCZEGOLOW) ?? null,
        agency_id: opcje?.agencyId ?? null,
      });
  } catch {
    // Brak tabeli (migracja nieuruchomiona) albo awaria bazy. Nic nie robimy:
    // komunikat jest już w konsoli, a zapis błędu nie może psuć aplikacji.
  }
}
