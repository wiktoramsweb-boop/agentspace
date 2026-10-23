/**
 * Wycena kredytów AI. Celowo bez żadnych importów, żeby dało się ją sprawdzić
 * testem (`npm run test:kredyty`) bez uruchamiania Next i bez dostępu do bazy.
 *
 * Logika zużycia i odczyt z bazy siedzą w `lib/kredyty.ts`, które tylko
 * dokłada do tego Supabase i strefę czasową aplikacji.
 *
 * Wagi wyliczone z mediany 63 prawdziwych sesji: 7 tur agenta, 4619 znaków
 * transkryptu. Przy takiej sesji wychodzi 10 kredytów, czyli 0,17 zł przy Sonnet 5.5.
 */

/**
 * Ile nas kosztuje jeden kredyt. Służy do wyceny pakietów i raportów.
 * Przy Sonnet 5.5 ($2/$10 za milion tokenów, kurs 4 zł/USD).
 */
export const KOSZT_KREDYTU_ZL = 0.0167;

/**
 * Minuta rozmowy głosowej w kredytach.
 *
 * ElevenLabs liczy 0,08 USD za minutę rozmowy, do tego dochodzi model językowy,
 * który prowadzi dialog. Przy kursie 4 zł i zapasie na model wychodzi około
 * 0,37 zł za minutę, czyli 22 kredyty (kredyt = 0,0167 zł).
 *
 * To jest 22 razy drożej niż tura rozmowy tekstowej, więc głos musi mieć
 * własny limit, a nie jechać po tej samej puli bez ograniczeń.
 */
export const KREDYTY_ZA_MINUTE_GLOSU = 22;

/** Ile minut maksymalnie trwa jedna rozmowa głosowa. */
export const MAX_MINUT_ROZMOWY = 5;

/**
 * Ile minut rezerwujemy w chwili startu rozmowy.
 *
 * Nie całą długość, tylko początek. Rezerwacja na pięć minut była większa niż
 * dzienny limit osoby, więc rozmowa odbijała się od własnego zabezpieczenia
 * i nie dało się jej w ogóle zacząć. Resztę dopisujemy po rozłączeniu, według
 * faktycznego czasu.
 */
export const MINUT_REZERWACJI = 2;

/**
 * Dzienny bezpiecznik na osobę.
 *
 * 120 kredytów wystarczało, póki najdroższą operacją była tura pisana za jeden
 * kredyt. Minuta głosu kosztuje 22, więc przy starym limicie mieściło się pięć
 * minut rozmowy na dobę razem z całą resztą pracy. 400 to około osiemnastu
 * minut głosu albo czterdziestu sesji pisanych i nadal chroni pulę biura przed
 * jedną osobą, która wyczerpie ją w popołudnie.
 */
export const DZIENNY_LIMIT_OSOBY = 400;

/**
 * Kredyty za rozmowę o danej długości.
 *
 * Zaokrąglamy w górę do pełnej minuty, bo tak samo liczy dostawca, i nigdy
 * nie schodzimy poniżej jednej minuty: połączenie kosztuje nas nawet wtedy,
 * gdy ktoś rozłączył się po dziesięciu sekundach.
 */
export function kredytyZaRozmowe(sekundy: number): number {
  const minuty = Math.min(MAX_MINUT_ROZMOWY, Math.max(1, Math.ceil(sekundy / 60)));
  return minuty * KREDYTY_ZA_MINUTE_GLOSU;
}

/**
 * Ile pobieramy z góry przy starcie rozmowy.
 *
 * Po rozłączeniu różnicę rozliczamy w obie strony: krótsza rozmowa dostaje
 * zwrot, dłuższa dopłatę. Gdy przeglądarka zniknie w połowie, zostaje przy nas
 * tyle, ile zarezerwowaliśmy, i tyle wynosi nasza strata.
 */
export function kredytyZGory(): number {
  return MINUT_REZERWACJI * KREDYTY_ZA_MINUTE_GLOSU;
}

export type Operacja =
  | "coach_tura"
  | "coach_ocena"
  | "asystent_dnia"
  | "asystent_pisze"
  | "szybki_wpis"
  | "klauzula"
  | "parsowanie_dokumentu"
  | "coach_glos"
  | "czat_strony"
  | "dopasowanie_ai"
  | "asystent_czat"
  | "dyzur_tura"
  | "import_ogloszenia";

export const CENNIK_KREDYTOW: Record<Operacja, number> = {
  coach_tura: 1,
  coach_ocena: 3,
  asystent_dnia: 2,
  asystent_pisze: 2,
  szybki_wpis: 1,
  klauzula: 1,
  parsowanie_dokumentu: 1,
  coach_glos: KREDYTY_ZA_MINUTE_GLOSU,
  czat_strony: 1,
  dopasowanie_ai: 3,
  asystent_czat: 1,
  dyzur_tura: 1,
  import_ogloszenia: 2,
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
  coach_glos: "AI Coach - rozmowa głosowa",
  czat_strony: "Czat na stronie biura",
  dopasowanie_ai: "Dopasowanie ofert AI",
  asystent_czat: "Asystent AI (rozmowa)",
  dyzur_tura: "Dyżur AI (tura rozmowy)",
  import_ogloszenia: "Import ogłoszenia do ofertówki",
};

/**
 * Miesięczna pula na agenta, zależna od pakietu.
 *
 * Pula jest wspólna dla całego biura, więc ktoś, kto trenuje codziennie,
 * korzysta z tego, że inni trenują rzadziej. Dobrane tak, żeby przy pełnym
 * wykorzystaniu koszt AI trzymał się w okolicy 10% abonamentu, a biura, które
 * naprawdę intensywnie trenują, dokupywały pakiety.
 *
 * Start nie ma AI Coacha, więc potrzebuje tylko tyle, co asystent dnia
 * i follow-upy.
 */
export const KREDYTY_NA_AGENTA: Record<string, number> = {
  trial: 200,
  solo: 1500,
  start: 120,
  pro: 250,
  biuro: 200,
};

const DOMYSLNE_NA_AGENTA = 200;

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
