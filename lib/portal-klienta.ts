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

/**
 * Nazwy po celu działania. Biała lista, nie tłumaczenie czegokolwiek:
 * cel jest polem słownikowym (agent wybiera z listy), więc nie da się w nim
 * schować numeru telefonu. Cele spoza listy spadają na nazwę rodzaju.
 *
 * Świadomie nie ma tu celów pozyskowych ani wewnętrznych - sprzedający nie
 * musi czytać, że biuro „przedłuża umowę" albo prowadzi „rozmowę pozyskową".
 */
const NAZWY_PO_CELU: Record<string, string> = {
  prezentacja: "Prezentacja nieruchomości",
  sesja_foto: "Sesja zdjęciowa",
  home_staging: "Przygotowanie nieruchomości",
  obnizka_ceny: "Spotkanie w sprawie ceny",
};

/** Ikona obok zdarzenia w portalu. Czysto wizualna podpowiedź. */
export type IkonaZdarzenia = "klucz" | "aparat" | "telefon" | "gwiazdka";

function ikonaZdarzenia(kind: ActivityKindLike, purpose?: string | null): IkonaZdarzenia {
  if (purpose === "sesja_foto") return "aparat";
  if (kind === "spotkanie") return "klucz";
  if (kind === "polaczenie") return "telefon";
  return "gwiazdka";
}

export type ZdarzenieAgenta = {
  id: string;
  kind: ActivityKindLike;
  /** Cel ze słownika (lista wyboru, nie pole tekstowe). */
  purpose?: string | null;
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
  ikona: IkonaZdarzenia;
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
    tytul:
      (a.purpose ? NAZWY_PO_CELU[a.purpose] : undefined) ??
      NAZWY_DLA_KLIENTA[a.kind] ??
      "Działanie biura",
    // Wyłącznie pole pisane dla klienta. `subject` nie jest nawet czytane.
    opis: (a.client_note ?? "").trim() || null,
    kiedy: a.due_at ?? a.completed_at ?? null,
    zrobione: a.status === "wykonane" || Boolean(a.completed_at),
    ikona: ikonaZdarzenia(a.kind, a.purpose),
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

/* ─────────────── Kalendarz ─────────────── */

export type DzienKalendarza = {
  /** Data w formacie YYYY-MM-DD. */
  klucz: string;
  dzien: number;
  /** Czy należy do pokazywanego miesiąca, czy tylko dopełnia siatkę. */
  wTymMiesiacu: boolean;
  dzisiaj: boolean;
  /** Ile udostępnionych zdarzeń wypada tego dnia. */
  ile: number;
};

function iso(rok: number, miesiac: number, dzien: number): string {
  return `${rok}-${String(miesiac).padStart(2, "0")}-${String(dzien).padStart(2, "0")}`;
}

/** Ile dni ma miesiąc (1-12). */
export function dniWMiesiacu(rok: number, miesiac: number): number {
  return new Date(Date.UTC(rok, miesiac, 0)).getUTCDate();
}

/**
 * Siatka miesiąca zaczynająca się od poniedziałku.
 *
 * Czysta funkcja bez stref czasowych: dni liczymy na kluczach tekstowych,
 * a nie na obiektach Date z lokalną godziną. Dzięki temu kalendarz wygląda
 * tak samo na telefonie klienta i na serwerze w innej strefie.
 */
export function siatkaMiesiaca(
  rok: number,
  miesiac: number,
  liczbyDni: Record<string, number>,
  dzis: string,
): DzienKalendarza[] {
  const ile = dniWMiesiacu(rok, miesiac);
  // getUTCDay(): 0 = niedziela. Chcemy tydzień od poniedziałku.
  const pierwszy = (new Date(Date.UTC(rok, miesiac - 1, 1)).getUTCDay() + 6) % 7;

  const poprzedni = miesiac === 1 ? { r: rok - 1, m: 12 } : { r: rok, m: miesiac - 1 };
  const nastepny = miesiac === 12 ? { r: rok + 1, m: 1 } : { r: rok, m: miesiac + 1 };
  const ilePoprzedni = dniWMiesiacu(poprzedni.r, poprzedni.m);

  const pole = (r: number, m: number, d: number, wTym: boolean): DzienKalendarza => {
    const klucz = iso(r, m, d);
    return { klucz, dzien: d, wTymMiesiacu: wTym, dzisiaj: klucz === dzis, ile: liczbyDni[klucz] ?? 0 };
  };

  const dni: DzienKalendarza[] = [];
  for (let i = pierwszy; i > 0; i--) {
    dni.push(pole(poprzedni.r, poprzedni.m, ilePoprzedni - i + 1, false));
  }
  for (let d = 1; d <= ile; d++) dni.push(pole(rok, miesiac, d, true));
  // Dopełniamy do pełnych tygodni, żeby siatka nie miała poszarpanego dołu.
  let d = 1;
  while (dni.length % 7 !== 0) dni.push(pole(nastepny.r, nastepny.m, d++, false));

  return dni;
}

/** Przesunięcie o miesiąc, z przejściem przez rok. */
export function sasiedniMiesiac(rok: number, miesiac: number, o: number): { rok: number; miesiac: number } {
  const suma = miesiac - 1 + o;
  return { rok: rok + Math.floor(suma / 12), miesiac: ((suma % 12) + 12) % 12 + 1 };
}

/* ─────────────── Propozycja zmiany ceny ─────────────── */

export type StatusPropozycji = "oczekuje" | "zaakceptowana" | "odrzucona";

/**
 * Opis propozycji zmiany ceny dla właściciela.
 *
 * Obniżka ceny ofertowej jest decyzją właściciela. Biuro może ją tylko
 * zaproponować, a klient musi mieć to czarno na białym: ile jest teraz,
 * ile ma być, o ile mniej i dlaczego.
 */
export function opisPropozycjiCeny(obecna: number | null, proponowana: number): {
  kierunek: "obnizka" | "podwyzka";
  roznica: number;
  procent: number | null;
} {
  const roznica = obecna == null ? 0 : proponowana - obecna;
  return {
    kierunek: roznica > 0 ? "podwyzka" : "obnizka",
    roznica: Math.abs(roznica),
    procent: obecna && obecna > 0 ? Math.round((Math.abs(roznica) / obecna) * 1000) / 10 : null,
  };
}
