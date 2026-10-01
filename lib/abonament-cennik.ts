/**
 * Okresy rozliczeniowe i rabaty. Bez importów, żeby dało się to sprawdzić
 * testem (`npm run test:abonament`) bez uruchamiania Next.
 *
 * Ceny pakietów siedzą w `lib/marketing/plans.ts` i są wspólne ze stroną
 * sprzedażową: cennik na landingu i kwota do zapłaty w aplikacji nie mogą
 * się rozjechać.
 */

export const DNI_PROBNE = 7;

export type Okres = "monthly" | "half_year" | "yearly";

export type OpisOkresu = {
  id: Okres;
  nazwa: string;
  miesiecy: number;
  /** Rabat jako ułamek, np. 0.2 to 20% taniej. */
  rabat: number;
  opis: string;
};

export const OKRESY: OpisOkresu[] = [
  { id: "monthly", nazwa: "Miesięcznie", miesiecy: 1, rabat: 0, opis: "Płacisz co miesiąc, rezygnujesz kiedy chcesz." },
  { id: "half_year", nazwa: "Co pół roku", miesiecy: 6, rabat: 0.1, opis: "Jedna płatność na sześć miesięcy, 10% taniej." },
  { id: "yearly", nazwa: "Co rok", miesiecy: 12, rabat: 0.2, opis: "Jedna płatność na rok, 20% taniej." },
];

export function opisOkresu(id: string): OpisOkresu {
  return OKRESY.find((o) => o.id === id) ?? OKRESY[0];
}

/** Cena za cały okres, w złotych netto, po rabacie. Zaokrąglona do złotówki. */
export function cenaOkresu(cenaMiesieczna: number, okres: Okres): number {
  const o = opisOkresu(okres);
  return Math.round(cenaMiesieczna * o.miesiecy * (1 - o.rabat));
}

/** Efektywna cena za miesiąc po rabacie, do pokazania przy wyborze okresu. */
export function cenaZaMiesiac(cenaMiesieczna: number, okres: Okres): number {
  const o = opisOkresu(okres);
  return Math.round(cenaOkresu(cenaMiesieczna, okres) / o.miesiecy);
}

/** Ile biuro oszczędza, wybierając dłuższy okres zamiast miesięcznego. */
export function oszczednosc(cenaMiesieczna: number, okres: Okres): number {
  const o = opisOkresu(okres);
  return cenaMiesieczna * o.miesiecy - cenaOkresu(cenaMiesieczna, okres);
}

export type StanDostepu = {
  /** Czy biuro może korzystać z systemu. */
  aktywne: boolean;
  /** Czy trwa okres próbny. */
  probny: boolean;
  /** Ile pełnych dni zostało (okresu próbnego albo abonamentu). */
  dniDoKonca: number | null;
  /** Czy warto już pokazać pasek z przypomnieniem o płatności. */
  ostrzegaj: boolean;
  powod: "brak_migracji" | "probny" | "oplacony" | "wygasl" | "anulowany";
};

type Agencja = {
  subscription_status?: string | null;
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;
};

/**
 * Czy biuro ma dostęp do systemu.
 *
 * Zasada przy braku danych: wpuszczamy. Biura sprzed migracji v37 nie mają
 * ustawionego okresu próbnego i nie wolno im odciąć systemu w trakcie pracy
 * tylko dlatego, że doszła nowa kolumna.
 */
export function stanDostepu(agencja: Agencja | null, teraz: Date = new Date()): StanDostepu {
  if (!agencja || agencja.subscription_status == null) {
    return { aktywne: true, probny: false, dniDoKonca: null, ostrzegaj: false, powod: "brak_migracji" };
  }

  const dni = (iso: string | null | undefined): number | null => {
    if (!iso) return null;
    const koniec = new Date(iso).getTime();
    if (Number.isNaN(koniec)) return null;
    return Math.ceil((koniec - teraz.getTime()) / 86_400_000);
  };

  if (agencja.subscription_status === "active") {
    const zostalo = dni(agencja.subscription_ends_at);
    // Brak daty końca to abonament bezterminowy (np. biuro sprzed v37).
    if (zostalo == null) {
      return { aktywne: true, probny: false, dniDoKonca: null, ostrzegaj: false, powod: "oplacony" };
    }
    if (zostalo <= 0) {
      return { aktywne: false, probny: false, dniDoKonca: 0, ostrzegaj: true, powod: "wygasl" };
    }
    return {
      aktywne: true,
      probny: false,
      dniDoKonca: zostalo,
      ostrzegaj: zostalo <= 7,
      powod: "oplacony",
    };
  }

  if (agencja.subscription_status === "trial") {
    const zostalo = dni(agencja.trial_ends_at);
    if (zostalo == null) {
      return { aktywne: true, probny: false, dniDoKonca: null, ostrzegaj: false, powod: "brak_migracji" };
    }
    if (zostalo <= 0) {
      return { aktywne: false, probny: true, dniDoKonca: 0, ostrzegaj: true, powod: "wygasl" };
    }
    return { aktywne: true, probny: true, dniDoKonca: zostalo, ostrzegaj: true, powod: "probny" };
  }

  if (agencja.subscription_status === "cancelled") {
    return { aktywne: false, probny: false, dniDoKonca: 0, ostrzegaj: true, powod: "anulowany" };
  }

  return { aktywne: false, probny: false, dniDoKonca: 0, ostrzegaj: true, powod: "wygasl" };
}

/** Data końca opłaconego okresu, licząc od podanego momentu. */
export function koniecOkresu(okres: Okres, od: Date = new Date()): Date {
  const o = opisOkresu(okres);
  const koniec = new Date(od);
  koniec.setMonth(koniec.getMonth() + o.miesiecy);
  return koniec;
}
