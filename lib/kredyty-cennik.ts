/**
 * Wycena kredytów AI. Celowo bez żadnych importów, żeby dało się ją sprawdzić
 * testem (`npm run test:kredyty`) bez uruchamiania Next i bez dostępu do bazy.
 *
 * Logika zużycia i odczyt z bazy siedzą w `lib/kredyty.ts`, które tylko
 * dokłada do tego Supabase i strefę czasową aplikacji.
 *
 * Wagi wyliczone z mediany 63 prawdziwych sesji: 7 tur agenta, 4619 znaków
 * transkryptu. Przy takiej sesji wychodzi 10 kredytów, czyli równo 0,25 zł.
 */

/** Ile nas kosztuje jeden kredyt. Służy do wyceny pakietów i raportów. */
export const KOSZT_KREDYTU_ZL = 0.025;

export type Operacja =
  | "coach_tura"
  | "coach_ocena"
  | "asystent_dnia"
  | "asystent_pisze"
  | "szybki_wpis"
  | "klauzula"
  | "parsowanie_dokumentu";

export const CENNIK_KREDYTOW: Record<Operacja, number> = {
  coach_tura: 1,
  coach_ocena: 3,
  asystent_dnia: 2,
  asystent_pisze: 2,
  szybki_wpis: 1,
  klauzula: 1,
  parsowanie_dokumentu: 1,
};

/** Nazwy po polsku na ekran zużycia. */
export const NAZWY_OPERACJI: Record<Operacja, string> = {
  coach_tura: "AI Coach - tura rozmowy",
  coach_ocena: "AI Coach - ocena sesji",
  asystent_dnia: "Asystent dnia",
  asystent_pisze: "AI pisze follow-up",
  szybki_wpis: "Szybki wpis",
  klauzula: "Klauzula do rezerwacji",
  parsowanie_dokumentu: "Odczyt dokumentu",
};

/**
 * Miesięczna pula na agenta, zależna od pakietu.
 *
 * Start nie ma AI Coacha, więc potrzebuje tylko tyle, co asystent i follow-upy.
 * 600 kredytów to około 15 zł kosztu i wystarcza na dwie sesje Coacha dziennie
 * przez cały miesiąc roboczy, czyli znacznie więcej niż realne zużycie.
 */
export const KREDYTY_NA_AGENTA: Record<string, number> = {
  trial: 400,
  start: 150,
  pro: 600,
  biuro: 600,
};

const DOMYSLNE_NA_AGENTA = 400;

export type PulaAgencji = {
  plan: string | null;
  ai_credits_monthly: number | null;
};

/** Pula miesięczna: ustawiona ręcznie albo wyliczona z pakietu i liczby agentów. */
export function pulaMiesieczna(agencja: PulaAgencji, liczbaAgentow: number): number {
  if (agencja.ai_credits_monthly != null) return agencja.ai_credits_monthly;
  const naAgenta = KREDYTY_NA_AGENTA[agencja.plan ?? ""] ?? DOMYSLNE_NA_AGENTA;
  return naAgenta * Math.max(1, liczbaAgentow);
}

/**
 * Początek bieżącego miesiąca w podanej strefie, jako znacznik ISO.
 *
 * Strefa przychodzi parametrem, żeby moduł nie musiał nic importować.
 * Polska to UTC+1 zimą i UTC+2 latem, więc pierwszy dzień miesiąca lokalnie
 * zaczyna się jeszcze poprzedniego dnia w UTC. Dwie godziny zapasu wstecz są
 * bezpieczne: najwyżej doliczymy zdarzenia z ostatnich godzin poprzedniego
 * miesiąca, co i tak działa na korzyść klienta.
 */
export function poczatekMiesiaca(strefa: string, teraz: Date = new Date()): string {
  const [rok, mc] = new Intl.DateTimeFormat("sv-SE", {
    timeZone: strefa,
    year: "numeric",
    month: "2-digit",
  })
    .format(teraz)
    .split("-")
    .map(Number);
  return new Date(Date.UTC(rok, mc - 1, 1, 0, 0, 0) - 2 * 3600 * 1000).toISOString();
}
