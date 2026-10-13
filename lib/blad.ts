import { createSupabaseAdmin } from "./supabase/admin";
import { escapeHtml } from "./html";

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

/**
 * Powiadomienie o nowym rodzaju awarii.
 *
 * Dziennik działał, ale nikt do niego nie zaglądał: cron faktur wywalał się
 * dwa razy dziennie przez dwa tygodnie, zanim ktokolwiek to zobaczył. Mail
 * idzie tylko przy PIERWSZYM wystąpieniu danego miejsca w ciągu doby, bo
 * powiadomienie przy każdym powtórzeniu to spam, którego nikt nie czyta,
 * czyli ten sam problem co teraz.
 */
async function powiadomOAwarii(gdzie: string, wiadomosc: string): Promise<void> {
  const klucz = process.env.RESEND_API_KEY;
  if (!klucz) return;

  // Alert o błędzie nie może sam wywracać aplikacji ani wołać zapiszBlad,
  // bo przy awarii poczty zrobiłby pętlę.
  try {
    const admin = createSupabaseAdmin();
    const doba = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data, error } = await admin
      .from("app_errors")
      .select("id")
      .eq("gdzie", gdzie)
      .gte("created_at", doba)
      .limit(2);

    // Jeden wpis to ten, który właśnie zapisaliśmy. Więcej znaczy, że
    // o tym miejscu już dziś pisaliśmy.
    if (error || (data?.length ?? 0) > 1) return;

    const { Resend } = await import("resend");
    await new Resend(klucz).emails.send({
      from: process.env.RESEND_FROM ?? "AgentSpace <onboarding@resend.dev>",
      to: process.env.NOTIFICATION_EMAIL ?? "nieruchomoscispectra@gmail.com",
      subject: `AgentSpace: awaria w ${gdzie}`,
      html: `
        <div style="font-family:-apple-system,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <h2 style="color:#dc2626;margin:0 0 16px;">Nowy błąd na produkcji</h2>
          <p style="font-size:15px;color:#3f3f46;margin:0 0 8px;"><strong>${escapeHtml(gdzie)}</strong></p>
          <p style="font-size:15px;color:#3f3f46;margin:0 0 16px;">${escapeHtml(wiadomosc)}</p>
          <p style="font-size:13px;color:#71717a;">To pierwsze wystąpienie w ciągu doby. Kolejne powtórzenia nie wywołają maila. Pełny dziennik jest w panelu operatora.</p>
        </div>
      `,
    });
  } catch {
    // Poczta nie działa. Trudno: błąd jest już w dzienniku i w konsoli.
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

  const miejsce = gdzie.slice(0, 120);
  try {
    await createSupabaseAdmin()
      .from("app_errors")
      .insert({
        gdzie: miejsce,
        wiadomosc,
        szczegoly: (opcje?.szczegoly ?? szczegoly)?.slice(0, LIMIT_SZCZEGOLOW) ?? null,
        agency_id: opcje?.agencyId ?? null,
      });
    await powiadomOAwarii(miejsce, wiadomosc);
  } catch {
    // Brak tabeli (migracja nieuruchomiona) albo awaria bazy. Nic nie robimy:
    // komunikat jest już w konsoli, a zapis błędu nie może psuć aplikacji.
  }
}
