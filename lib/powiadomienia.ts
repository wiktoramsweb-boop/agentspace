import { createSupabaseAdmin } from "./supabase/admin";
import { sendPushToAgent, isPushConfigured } from "./push";

/**
 * Powiadomienia w aplikacji (dzwonek w menu), z opcjonalnym pushem na telefon.
 *
 * Push sam w sobie nie wystarcza: działa tylko na urządzeniach, na których
 * ktoś go włączył, i znika po przeczytaniu. Dzwonek trzyma historię, więc
 * agent, który wrócił z prezentacji, widzi, co się działo pod jego nieobecność.
 *
 * Nigdy nie rzuca: brak powiadomienia nie może wywrócić akcji, która je wywołała.
 */

export type RodzajPowiadomienia =
  | "info"
  | "zadanie"
  | "lead"
  | "czat"
  | "automatyzacja"
  | "zastepstwo"
  | "trening"
  | "cena"
  | "portal";

export type Powiadomienie = {
  rodzaj?: RodzajPowiadomienia;
  tytul: string;
  tresc?: string | null;
  /** Adres w aplikacji, na który prowadzi kliknięcie. */
  adres?: string | null;
  /** Wysłać też push na telefon. Domyślnie tak. */
  push?: boolean;
  /** Push z tym samym znacznikiem podmienia poprzedni zamiast dokładać kolejny. */
  znacznik?: string;
  /** Push zostaje na ekranie do dotknięcia. */
  pilne?: boolean;
  /**
   * Zapis w dzwonku. Domyślnie tak. Czat wyłącza: rozmowa ma własny licznik
   * nieprzeczytanych, a każda wiadomość w dzwonku zalałaby resztę powiadomień.
   */
  wDzwonku?: boolean;
};

export async function powiadom(
  agencyId: string,
  odbiorcy: (string | null | undefined)[],
  p: Powiadomienie,
): Promise<number> {
  const ids = [...new Set(odbiorcy.filter((x): x is string => typeof x === "string" && x.length > 0))];
  if (ids.length === 0) return 0;

  if (p.wDzwonku !== false) try {
    const admin = createSupabaseAdmin();
    const { error } = await admin.from("notifications").insert(
      ids.map((user_id) => ({
        agency_id: agencyId,
        user_id,
        kind: p.rodzaj ?? "info",
        title: p.tytul.slice(0, 200),
        body: p.tresc ? p.tresc.slice(0, 600) : null,
        href: p.adres ?? null,
      })),
    );
    // Brak tabeli (przed migracją v49) nie blokuje pushu: telefon dostanie
    // powiadomienie tak jak dotąd, zabraknie tylko historii w dzwonku.
    if (error && !/notifications/.test(error.message)) {
      console.error("powiadom:", error.message);
    }
  } catch (err) {
    console.error("powiadom:", err);
  }

  if (p.push !== false && isPushConfigured()) {
    await Promise.all(
      ids.map((id) =>
        sendPushToAgent(id, {
          title: p.tytul,
          body: p.tresc ?? "",
          url: p.adres ?? "/app",
          tag: p.znacznik,
          important: p.pilne,
        }).catch(() => 0),
      ),
    );
  }
  return ids.length;
}
