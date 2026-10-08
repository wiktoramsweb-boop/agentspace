/**
 * Portal klienta: co wolno pokazać, a czego nie.
 *
 * Plik celowo BEZ importów - jest objęty testem uruchamianym w gołym node
 * (`npm run test:portal`). To jest warstwa, w której najłatwiej o wyciek
 * cudzych danych, więc musi dać się sprawdzić automatem, a nie okiem.
 *
 * ZASADA, OD KTÓREJ NIE MA ODSTĘPSTW:
 * widok klienta powstaje wyłącznie z pól strukturalnych z białej listy
 * (rodzaj zdarzenia, data, godzina, status) oraz z pola `client_note`,
 * które agent wypełnia świadomie. Pole `subject` NIGDY nie wychodzi na
 * zewnątrz: agenci wpisują tam rzeczy w rodzaju
 * "Prezka mazowiecka, Bogdan 792 847 892", czyli numer telefonu osoby
 * trzeciej. Filtrowanie takiego tekstu jest nie do uratowania - zawsze
 * znajdzie się wpis, który przejdzie przez filtr.
 */

export type RodzajDostepu = "sprzedajacy" | "kupujacy";

/* ─────────────── Token dostępu ─────────────── */

/** Znaki bez tych, które mylą się przy przepisywaniu: 0/O, 1/l/I. */
const ZNAKI = "abcdefghjkmnpqrstuvwxyz23456789";

/**
 * Token do adresu portalu.
 *
 * @param losuj funkcja zwracająca liczbę 0..1, wstrzykiwana, żeby test
 *   mógł sprawdzić długość i alfabet bez zgadywania losowości.
 */
export function nowyToken(losuj: () => number = Math.random, dlugosc = 22): string {
  let out = "";
  for (let i = 0; i < dlugosc; i++) {
    out += ZNAKI[Math.floor(losuj() * ZNAKI.length) % ZNAKI.length];
  }
  return out;
}

export function poprawnyToken(token: string): boolean {
  return /^[a-z2-9]{16,40}$/.test(token);
}

/* ─────────────── Ważność dostępu ─────────────── */

export type StanDostepu =
  | { aktywny: true }
  | { aktywny: false; powod: "odwolany" | "wygasl" | "brak" };

export function stanDostepu(
  dostep: { revoked_at?: string | null; expires_at?: string | null } | null | undefined,
  dzis: string,
): StanDostepu {
  if (!dostep) return { aktywny: false, powod: "brak" };
  if (dostep.revoked_at) return { aktywny: false, powod: "odwolany" };
  // Dzień wygaśnięcia jest jeszcze ważny: umowa kończy się z końcem dnia.
  if (dostep.expires_at && String(dostep.expires_at) < dzis) {
    return { aktywny: false, powod: "wygasl" };
  }
  return { aktywny: true };
}

/* ─────────────── Projekcja zdarzeń na widok klienta ─────────────── */

export type ActivityKindLike = "polaczenie" | "zadanie" | "wydarzenie" | "spotkanie";

/** Nazwy zdarzeń widoczne dla klienta. Neutralne, bez żargonu biura. */
const NAZWY_DLA_KLIENTA: Record<ActivityKindLike, string> = {
  spotkanie: "Prezentacja nieruchomości",
  wydarzenie: "Wydarzenie",
  polaczenie: "Kontakt z zainteresowanym",
  zadanie: "Działanie biura",
};

export type ZdarzenieAgenta = {
  id: string;
  kind: ActivityKindLike;
  /** Tekst agenta. NIE trafia do klienta. */
  subject?: string | null;
  /** Opis napisany świadomie dla klienta. */
  client_note?: string | null;
  client_visible?: boolean | null;
  status?: string | null;
  due_at?: string | null;
  completed_at?: string | null;
};

export type ZdarzenieKlienta = {
  id: string;
  tytul: string;
  opis: string | null;
  kiedy: string | null;
  zrobione: boolean;
};

/**
 * Jedno zdarzenie w wersji dla klienta.
 *
 * Zwraca `null`, gdy zdarzenia nie wolno pokazać. Decyduje wyłącznie flaga
 * `client_visible` ustawiona przez agenta - domyślnie nic nie jest widoczne.
 */
export function zdarzenieDlaKlienta(a: ZdarzenieAgenta): ZdarzenieKlienta | null {
  if (!a.client_visible) return null;
  if (a.status === "anulowane") return null;

  return {
    id: a.id,
    tytul: NAZWY_DLA_KLIENTA[a.kind] ?? "Działanie biura",
    // Wyłącznie pole pisane dla klienta. `subject` nie jest nawet czytane.
    opis: (a.client_note ?? "").trim() || null,
    kiedy: a.due_at ?? a.completed_at ?? null,
    zrobione: a.status === "wykonane" || Boolean(a.completed_at),
  };
}

/** Cała lista, już przefiltrowana i posortowana od najbliższego terminu. */
export function osCzasuDlaKlienta(lista: ZdarzenieAgenta[]): ZdarzenieKlienta[] {
  return lista
    .map(zdarzenieDlaKlienta)
    .filter((z): z is ZdarzenieKlienta => z !== null)
    .sort((a, b) => String(b.kiedy ?? "").localeCompare(String(a.kiedy ?? "")));
}

/* ─────────────── Podsumowanie pracy biura ─────────────── */

export type PodsumowanieDlaKlienta = {
  prezentacje: number;
  prezentacjeWTymTygodniu: number;
  kontakty: number;
  najblizszaPrezentacja: string | null;
};

/**
 * Liczby, które widzi sprzedający.
 *
 * Liczone z WSZYSTKICH zdarzeń, także tych nieoznaczonych jako widoczne:
 * sama liczba prezentacji nie zdradza niczyich danych, a to ona odpowiada
 * na pytanie „czy coś się dzieje". Pusty portal jest gorszy niż jego brak.
 */
export function podsumowanieDlaKlienta(
  lista: ZdarzenieAgenta[],
  dzis: string,
  odTygodnia: string,
): PodsumowanieDlaKlienta {
  const zywe = lista.filter((a) => a.status !== "anulowane");
  const prezentacje = zywe.filter((a) => a.kind === "spotkanie");
  const przyszle = prezentacje
    .map((a) => a.due_at)
    .filter((d): d is string => Boolean(d) && String(d).slice(0, 10) >= dzis)
    .sort();

  return {
    prezentacje: prezentacje.length,
    prezentacjeWTymTygodniu: prezentacje.filter(
      (a) => a.due_at && String(a.due_at).slice(0, 10) >= odTygodnia,
    ).length,
    kontakty: zywe.filter((a) => a.kind === "polaczenie").length,
    najblizszaPrezentacja: przyszle[0] ?? null,
  };
}

/* ─────────────── Treść powiadomienia ─────────────── */

/**
 * Powiadomienie o prezentacji.
 *
 * Nie zawiera ani nazwiska, ani telefonu, ani adresu - tylko godzina
 * i nazwa nieruchomości, którą klient i tak zna, bo jest jego.
 */
export function powiadomienieOPrezentacji(
  nazwaNieruchomosci: string,
  godzina: string,
): { tytul: string; tresc: string } {
  return {
    tytul: "Dziś prezentacja",
    tresc: `${nazwaNieruchomosci} · godz. ${godzina}`,
  };
}
