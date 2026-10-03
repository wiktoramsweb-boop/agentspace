import { stanDostepu } from "./abonament-cennik";
import { createSupabaseAdmin } from "./supabase/admin";
import { APP_TZ } from "./datetime";
import {
  CENNIK_KREDYTOW,
  KOSZT_KREDYTU_ZL,
  NAZWY_OPERACJI,
  poczatekMiesiaca,
  pulaMiesieczna,
  type Operacja,
  type PulaAgencji,
} from "./kredyty-cennik";

export {
  CENNIK_KREDYTOW,
  KOSZT_KREDYTU_ZL,
  KREDYTY_NA_AGENTA,
  NAZWY_OPERACJI,
  pulaMiesieczna,
  type Operacja,
} from "./kredyty-cennik";

/**
 * Zużycie kredytów AI: odczyt i zapis w bazie.
 *
 * Sama wycena (ile kredytów kosztuje która operacja, ile ich daje pakiet)
 * siedzi w `lib/kredyty-cennik.ts`, bez importów, żeby dało się ją sprawdzić
 * testem `npm run test:kredyty`.
 */

/** Początek bieżącego miesiąca rozliczeniowego w czasie polskim. */
export function poczatekMiesiacaPL(): string {
  return poczatekMiesiaca(APP_TZ);
}

/**
 * Dzienny bezpiecznik na osobę. Niezależny od puli biura: chroni przed tym,
 * żeby jeden agent wyczerpał miesięczny limit całego zespołu w jedno popołudnie.
 * 120 kredytów to 12 sesji AI Coacha dziennie, czyli grubo ponad realne użycie.
 */
function dziennyLimitOsoby(): number {
  const v = Number(process.env.AI_DAILY_CREDITS_USER);
  return Number.isFinite(v) && v > 0 ? v : 120;
}

function poczatekDniaPL(): string {
  return new Date(Date.now() - 24 * 3600 * 1000).toISOString();
}

export type StanKredytow = {
  /** Pula miesięczna biura (bez dokupionych). */
  pula: number;
  /** Zużyte w tym miesiącu. */
  zuzyte: number;
  /** Dostępne dokupione kredyty (nie przepadają z końcem miesiąca). */
  dokupioneDostepne: number;
  /** Ile łącznie zostało do wykorzystania. */
  zostalo: number;
  /** Przybliżony koszt zużycia w złotych. */
  kosztZl: number;
};

type Agencja = PulaAgencji & {
  ai_credits_extra: number;
  ai_credits_extra_used: number;
};


/**
 * Stan kredytów biura. Gdy migracji v35 jeszcze nie ma, zwracamy null,
 * a wywołujący traktuje to jak brak limitu: lepiej działać bez licznika
 * niż zablokować biuro przez nieuruchomioną migrację.
 */
export async function stanKredytow(agencyId: string): Promise<StanKredytow | null> {
  const admin = createSupabaseAdmin();

  const { data: agencja, error: bladAgencji } = await admin
    .from("agencies")
    .select("plan, ai_credits_monthly, ai_credits_extra, ai_credits_extra_used")
    .eq("id", agencyId)
    .maybeSingle();
  if (bladAgencji || !agencja) return null;

  const { count: agentow } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId);

  const { data: zdarzenia, error: bladZdarzen } = await admin
    .from("rate_events")
    .select("credits")
    .eq("agency_id", agencyId)
    .gte("created_at", poczatekMiesiacaPL());
  if (bladZdarzen) return null;

  const zuzyte = (zdarzenia ?? []).reduce((suma, z) => suma + (z.credits ?? 1), 0);
  const pula = pulaMiesieczna(agencja as Agencja, agentow ?? 1);
  const dokupioneDostepne = Math.max(
    0,
    (agencja.ai_credits_extra ?? 0) - (agencja.ai_credits_extra_used ?? 0),
  );

  return {
    pula,
    zuzyte,
    dokupioneDostepne,
    zostalo: Math.max(0, pula - zuzyte) + dokupioneDostepne,
    kosztZl: Math.round(zuzyte * KOSZT_KREDYTU_ZL * 100) / 100,
  };
}

/**
 * Pobiera kredyty za operację. Zwraca true, gdy zabrakło i operacji nie wolno
 * wykonać. Przy braku tabeli albo błędzie bazy przepuszczamy: awaria licznika
 * nie może zatrzymać pracy biura.
 */
export async function brakKredytow(
  user: { id: string; agency_id: string | null },
  operacja: Operacja,
): Promise<boolean> {
  if (!user.agency_id) return false;
  const koszt = CENNIK_KREDYTOW[operacja];
  const admin = createSupabaseAdmin();

  // Po wygaśnięciu okresu próbnego albo abonamentu nie liczymy AI.
  // Interfejs jest wtedy zamknięty, ale same endpointy odpowiadały dalej,
  // więc otwarta karta w przeglądarce potrafiła palić budżet po terminie.
  // Konto demo jest wyjątkiem, bo służy do pokazów.
  const { data: dostepAgencji } = await admin
    .from("agencies")
    .select("is_demo, subscription_status, subscription_ends_at, trial_ends_at")
    .eq("id", user.agency_id)
    .maybeSingle();
  if (dostepAgencji && !dostepAgencji.is_demo && !stanDostepu(dostepAgencji).aktywne) {
    return true;
  }

  // Dzienny bezpiecznik na osobę.
  const { data: dzisiaj, error: bladDnia } = await admin
    .from("rate_events")
    .select("credits")
    .eq("user_id", user.id)
    .gte("created_at", poczatekDniaPL());
  if (bladDnia) return false;
  const zuzyteDzis = (dzisiaj ?? []).reduce((s, z) => s + (z.credits ?? 1), 0);
  if (zuzyteDzis + koszt > dziennyLimitOsoby()) return true;

  const stan = await stanKredytow(user.agency_id);
  if (!stan) return false;
  if (stan.zostalo < koszt) return true;

  // Gdy pula miesięczna się skończyła, dobieramy z dokupionych.
  const pozaPula = Math.max(0, stan.zuzyte + koszt - stan.pula);
  const juzPozaPula = Math.max(0, stan.zuzyte - stan.pula);
  const zDokupionych = pozaPula - juzPozaPula;
  if (zDokupionych > 0) {
    const { data: a } = await admin
      .from("agencies")
      .select("ai_credits_extra_used")
      .eq("id", user.agency_id)
      .maybeSingle();
    await admin
      .from("agencies")
      .update({ ai_credits_extra_used: (a?.ai_credits_extra_used ?? 0) + zDokupionych })
      .eq("id", user.agency_id);
  }

  await admin.from("rate_events").insert({
    key: `ai:${operacja}`,
    credits: koszt,
    agency_id: user.agency_id,
    user_id: user.id,
  });

  // Sprzątanie raz na jakiś czas, żeby tabela nie rosła bez końca. Trzymamy
  // 13 miesięcy, żeby dało się pokazać zużycie rok do roku.
  if (Math.random() < 0.01) {
    const stare = new Date(Date.now() - 400 * 86400 * 1000).toISOString();
    await admin.from("rate_events").delete().lt("created_at", stare);
  }
  return false;
}

/** Gotowa odpowiedź 429 dla endpointów AI. */
export function brakKredytowResponse(): Response {
  return Response.json(
    {
      error:
        "Skończyły się kredyty AI na ten miesiąc. Właściciel biura może dokupić pakiet w Ustawieniach.",
    },
    { status: 429 },
  );
}

export type PozycjaZuzycia = { nazwa: string; kredyty: number; razy: number };

/** Rozbicie zużycia w tym miesiącu: na operacje i na agentów. */
export async function zuzycieMiesiaca(agencyId: string): Promise<{
  operacje: PozycjaZuzycia[];
  agenci: PozycjaZuzycia[];
} | null> {
  const admin = createSupabaseAdmin();

  const { data: zdarzenia, error } = await admin
    .from("rate_events")
    .select("key, credits, user_id")
    .eq("agency_id", agencyId)
    .gte("created_at", poczatekMiesiacaPL());
  if (error) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("agency_id", agencyId);
  const imiona = new Map((profile ?? []).map((p) => [p.id, p.full_name ?? "Bez nazwy"]));

  const zlicz = (klucz: (z: { key: string; user_id: string | null }) => string) => {
    const mapa = new Map<string, PozycjaZuzycia>();
    for (const z of zdarzenia ?? []) {
      const k = klucz(z as { key: string; user_id: string | null });
      const biez = mapa.get(k) ?? { nazwa: k, kredyty: 0, razy: 0 };
      biez.kredyty += z.credits ?? 1;
      biez.razy += 1;
      mapa.set(k, biez);
    }
    return [...mapa.values()].sort((a, b) => b.kredyty - a.kredyty);
  };

  return {
    operacje: zlicz((z) => {
      const op = z.key.replace(/^ai:/, "") as Operacja;
      return NAZWY_OPERACJI[op] ?? z.key;
    }),
    agenci: zlicz((z) => (z.user_id ? (imiona.get(z.user_id) ?? "Nieznany") : "Nieznany")),
  };
}
