import { createSupabaseAdmin } from "./supabase/admin";
import { todayPL } from "./datetime";
import { rozwinZastepce, type Nieobecnosc } from "./zastepstwa-model";

export { RODZAJE_NIEOBECNOSCI, rozwinZastepce } from "./zastepstwa-model";
export type { Nieobecnosc, RodzajNieobecnosci } from "./zastepstwa-model";

/**
 * Urlopy i zastępstwa (v49).
 *
 * Zastępstwo działa samo, w dniach urlopu, bez przepisywania klientów:
 *  - zadania z automatyzacji i nowe leady trafiają do zastępcy,
 *  - powiadomienia o sprawach nieobecnego idą do zastępcy,
 *  - zastępca widzi kontakty klientów nieobecnego, nawet przy ukrywaniu kontaktów,
 *  - na pulpicie zastępcy pojawia się lista spraw do przejęcia.
 * Po urlopie wszystko wraca do opiekuna, bo nic nie zostało przepisane.
 *
 * U konkurencji zastępstwo to jednorazowe przepisanie klientów, które ktoś
 * musi potem ręcznie odkręcić. Tutaj odkręcać nie trzeba.
 */

/** Nieobecności obejmujące dany dzień. Pusta lista także przed migracją v49. */
export async function nieobecnosciWDniu(agencyId: string, dzien = todayPL()): Promise<Nieobecnosc[]> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("agent_absences")
    .select("id, agent_id, substitute_id, kind, starts_on, ends_on, note")
    .eq("agency_id", agencyId)
    .lte("starts_on", dzien)
    .gte("ends_on", dzien);
  if (error) return [];
  return (data ?? []) as Nieobecnosc[];
}

export async function ktoObsluguje(agencyId: string, userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null;
  return rozwinZastepce(userId, await nieobecnosciWDniu(agencyId));
}

/** Kogo dana osoba zastępuje dzisiaj. */
export async function kogoZastepuje(agencyId: string, userId: string): Promise<Nieobecnosc[]> {
  return (await nieobecnosciWDniu(agencyId)).filter((n) => n.substitute_id === userId);
}
