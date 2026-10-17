import { createSupabaseAdmin } from "./supabase/admin";
import { odpowiedzJson, type SchematJson } from "./ai/struktura";
import { COACH_MODEL } from "./ai/client";

/**
 * Dyżur AI: odbiera telefony, których agent nie odebrał.
 *
 * Telefonię daje Twilio (numer + przekierowanie z komórki agenta). Twilio
 * wysyła nam to, co powiedział dzwoniący, a my odpowiadamy instrukcją TwiML:
 * co powiedzieć i czego słuchać dalej. Konfigurację trzymamy w
 * agency_settings.options.dyzur, więc nie potrzeba nowej tabeli.
 */

export type DyzurConfig = {
  wlaczony: boolean;
  /** Numer Twilio w formacie +48XXXXXXXXX. Po nim rozpoznajemy biuro. */
  numer: string;
  /** Jak AI przedstawia biuro w słuchawce. */
  nazwa: string;
  powitanie: string;
  /** Dodatkowe informacje: godziny, specjalizacja, rejon. */
  informacje: string;
  /** Opiekun leadów z telefonu. Pusty = pula biura (działa reguła „nowy lead”). */
  opiekun_id: string | null;
};

export const DYZUR_DOMYSLNY: DyzurConfig = {
  wlaczony: false,
  numer: "",
  nazwa: "",
  powitanie: "Dzień dobry, tu asystentka biura. Agent jest teraz na spotkaniu. W czym mogę pomóc?",
  informacje: "",
  opiekun_id: null,
};

export function numerE164(v: string): string {
  const cyfry = v.replace(/[^\d+]/g, "");
  if (/^\d{9}$/.test(cyfry)) return `+48${cyfry}`;
  if (/^48\d{9}$/.test(cyfry)) return `+${cyfry}`;
  return cyfry;
}

async function surowe(agencyId: string): Promise<Record<string, unknown>> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("agency_settings").select("options").eq("agency_id", agencyId).maybeSingle();
  return (data?.options ?? {}) as Record<string, unknown>;
}

export async function getDyzur(agencyId: string): Promise<DyzurConfig> {
  const raw = (await surowe(agencyId)).dyzur as Partial<DyzurConfig> | undefined;
  return { ...DYZUR_DOMYSLNY, ...(raw ?? {}) };
}

export async function zapiszDyzur(agencyId: string, cfg: DyzurConfig): Promise<string | null> {
  const admin = createSupabaseAdmin();
  const options = { ...(await surowe(agencyId)), dyzur: cfg };
  const { error } = await admin
    .from("agency_settings")
    .upsert({ agency_id: agencyId, options, updated_at: new Date().toISOString() }, { onConflict: "agency_id" });
  return error ? `Nie udało się zapisać: ${error.message}` : null;
}

/** Ustawienia „Pozostałe” zapisują opcje w całości: ta funkcja dokłada z powrotem Dyżur. */
export async function zDyzurem<T extends object>(agencyId: string, options: T): Promise<T & { dyzur?: unknown }> {
  const dyzur = (await surowe(agencyId)).dyzur;
  return dyzur ? { ...options, dyzur } : options;
}

export async function biuroPoNumerze(numer: string): Promise<{ agencyId: string; cfg: DyzurConfig; nazwaBiura: string } | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("agency_settings")
    .select("agency_id, options")
    .eq("options->dyzur->>numer", numerE164(numer))
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const cfg = { ...DYZUR_DOMYSLNY, ...((data.options as { dyzur?: Partial<DyzurConfig> })?.dyzur ?? {}) };
  const { data: ag } = await admin.from("agencies").select("name").eq("id", data.agency_id).maybeSingle();
  return { agencyId: data.agency_id as string, cfg, nazwaBiura: (ag?.name as string) ?? "biuro nieruchomości" };
}

/* ── Mózg rozmowy ──────────────────────────────────────────── */

export type TuraDyzuru = {
  odpowiedz: string;
  imie: string | null;
  potrzeba: string | null;
  /** Czy rozmowę można zakończyć (wiadomo, kto i w jakiej sprawie). */
  koniec: boolean;
};

const SCHEMAT: SchematJson = {
  type: "object",
  properties: {
    odpowiedz: { type: "string" },
    imie: { type: ["string", "null"] },
    potrzeba: { type: ["string", "null"] },
    koniec: { type: "boolean" },
  },
  required: ["odpowiedz", "imie", "potrzeba", "koniec"],
  additionalProperties: false,
};

export function promptDyzuru(p: { nazwa: string; informacje: string; telefon: string | null }): string {
  return `Odbierasz telefon w biurze nieruchomości ${p.nazwa}, bo agent nie mógł odebrać. Rozmawiasz GŁOSEM: Twoje zdania są czytane przez syntezator mowy.
${p.informacje ? `\nO biurze: ${p.informacje}\n` : ""}
TWOJE ZADANIE
1. Ustal, w jakiej sprawie dzwoni: kupno, sprzedaż, wynajem, konkretna oferta, coś innego. Jeśli o ofertę, zapytaj o adres albo numer ogłoszenia.
2. Zapytaj, jak się nazywa.
3. ${p.telefon ? "Numer dzwoniącego znamy, potwierdź tylko, czy oddzwonić na ten numer." : "Poproś o numer do oddzwonienia."} Zapytaj o dogodną porę.
4. Gdy znasz imię i sprawę, podziękuj, powiedz, że agent oddzwoni, i ustaw koniec na true.

ZASADY
- Mówisz po polsku, krótko: jedno, najwyżej dwa zdania. Jedno pytanie naraz.
- Bez list, nawiasów, skrótów i emotikon. Liczby zapisuj słowami, gdy to godziny.
- Nie podawaj cen, adresów ani dostępności ofert. Nie masz dostępu do bazy. Powiedz, że sprawdzi to agent.
- Nie obiecuj warunków umowy ani prowizji. Bez porad prawnych.
- Gdy ktoś jest niegrzeczny albo to reklama, uprzejmie zakończ (koniec true).
- Nie używaj myślnika ani półpauzy.

POLA
imie i potrzeba wypełniaj tylko tym, co rozmówca powiedział. potrzeba to jedno zdanie dla agenta, np. „Chce sprzedać mieszkanie 3 pokoje na Podgórzu, prosi o telefon po 17”.`;
}

export async function turaDyzuru(system: string, rozmowa: { role: "user" | "assistant"; content: string }[]): Promise<TuraDyzuru> {
  // Rozmowę podajemy jako jeden zapis, a nie naprzemienne wiadomości: przy
  // kilku turach model naśladował swoje wcześniejsze odpowiedzi tekstem i
  // przestawał zwracać JSON.
  const zapis = rozmowa
    .filter((m) => m.content !== "(połączenie odebrane)")
    .map((m) => `${m.role === "user" ? "Dzwoniący" : "Ty"}: ${m.content}`)
    .join("\n");
  const tresc = `Dotychczasowa rozmowa telefoniczna:\n${zapis}\n\nPodaj swoją następną kwestię i uzupełnij pola.`;
  return odpowiedzJson<TuraDyzuru>({ model: COACH_MODEL, system, messages: [{ role: "user", content: tresc }], maxTokens: 300, schemat: SCHEMAT });
}

export { podpisTwilioOk, twimlRozmowa, twimlKoniec, twiml, stanDoParametru, stanZParametru, type StanDyzuru } from "./dyzur-twilio";
