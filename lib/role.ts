/**
 * Role i uprawnienia. Bez importów, żeby dało się sprawdzić testem
 * (`npm run test:role`) bez uruchamiania Next i bez dostępu do bazy.
 *
 * Model jest dwupoziomowy:
 *  1. Rola daje zestaw domyślny, dobrany pod typowe stanowisko w biurze.
 *  2. CEO może dowolny moduł dołożyć albo odebrać konkretnej osobie.
 *
 * Dzięki temu biuro, które ma księgową na pół etatu albo koordynatora ofert,
 * nie musi nikomu dawać roli menedżera tylko po to, żeby wpuścić go do jednej
 * zakładki.
 */

/** Grupa funkcji, do której daje się dostęp. Celowo szersze niż pojedyncze strony. */
export type Modul =
  | "klienci"
  | "nieruchomosci"
  | "dokumenty"
  | "prowizje"
  | "faktury"
  | "raporty"
  | "zespol"
  | "ustawienia"
  | "abonament"
  | "coach";

export type OpisModulu = { id: Modul; nazwa: string; opis: string };

export const MODULY: OpisModulu[] = [
  { id: "klienci", nazwa: "Klienci i leady", opis: "CRM, leady, poszukiwania, kalendarz kontaktów." },
  { id: "nieruchomosci", nazwa: "Nieruchomości", opis: "Baza ofert, analiza cenowa, ofertówka." },
  { id: "dokumenty", nazwa: "Dokumenty", opis: "Rezerwacje, protokoły, aneksy, oferty współpracy." },
  { id: "prowizje", nazwa: "Prowizje", opis: "Transakcje i rozliczenia prowizji." },
  { id: "faktury", nazwa: "Faktury i podatki", opis: "Wystawianie faktur, kalkulator podatkowy." },
  { id: "raporty", nazwa: "Raporty", opis: "Wyniki biura, raport dla właściciela." },
  { id: "zespol", nazwa: "Zespół", opis: "Lista osób, zapraszanie, cele i ranking." },
  { id: "ustawienia", nazwa: "Ustawienia firmy", opis: "Dane firmy, logo, strona www, opcje biura." },
  { id: "abonament", nazwa: "Abonament", opis: "Zakup i przedłużanie abonamentu." },
  { id: "coach", nazwa: "AI Coach i cele", opis: "Trening rozmów, historia sesji, cele osobiste." },
];

/** Jak szeroko dana osoba widzi dane biura. */
export type Zakres = "wlasne" | "zespol" | "wszystko";

export const ZAKRESY: { id: Zakres; nazwa: string; opis: string }[] = [
  { id: "wlasne", nazwa: "Tylko swoje", opis: "Widzi wyłącznie klientów i oferty, których jest opiekunem." },
  { id: "zespol", nazwa: "Swój zespół", opis: "Widzi siebie i agentów, którymi się opiekuje." },
  { id: "wszystko", nazwa: "Całe biuro", opis: "Widzi wszystkie dane biura." },
];

export type UserRole =
  | "owner"
  | "director"
  | "manager"
  | "agent"
  | "assistant"
  | "accountant"
  | "coordinator"
  | "trainee";

export type OpisRoli = {
  id: UserRole;
  nazwa: string;
  opis: string;
  moduly: Modul[];
  zakres: Zakres;
};

const WSZYSTKIE: Modul[] = MODULY.map((m) => m.id);

/**
 * Role i ich domyślne uprawnienia.
 *
 * Wartości 'owner', 'manager' i 'agent' zostają takie jak w v13, bo siedzą
 * w bazie przy istniejących kontach. Reszta to nowe stanowiska, które realnie
 * występują w biurach większych niż nasze.
 */
export const ROLE: OpisRoli[] = [
  {
    id: "owner",
    nazwa: "CEO",
    opis: "Właściciel biura. Pełny dostęp, w tym do rozliczeń i abonamentu.",
    moduly: WSZYSTKIE,
    zakres: "wszystko",
  },
  {
    id: "director",
    nazwa: "Dyrektor",
    opis: "Prowadzi biuro na co dzień. Wszystko oprócz ustawień firmy i abonamentu.",
    moduly: WSZYSTKIE.filter((m) => m !== "ustawienia" && m !== "abonament"),
    zakres: "wszystko",
  },
  {
    id: "manager",
    nazwa: "Menedżer",
    opis: "Prowadzi zespół agentów. Widzi ich pracę, ale nie kwoty cudzych prowizji.",
    moduly: ["klienci", "nieruchomosci", "dokumenty", "zespol", "coach"],
    zakres: "zespol",
  },
  {
    id: "agent",
    nazwa: "Agent",
    opis: "Pracuje na swoich klientach i ofertach.",
    moduly: ["klienci", "nieruchomosci", "dokumenty", "prowizje", "coach"],
    zakres: "wlasne",
  },
  {
    id: "assistant",
    nazwa: "Asystent biura",
    opis: "Wprowadza dane i obsługuje dokumenty dla całego zespołu. Bez dostępu do pieniędzy.",
    moduly: ["klienci", "nieruchomosci", "dokumenty"],
    zakres: "wszystko",
  },
  {
    id: "accountant",
    nazwa: "Księgowość",
    opis: "Faktury, prowizje i raporty. Bez dostępu do bazy klientów.",
    moduly: ["faktury", "prowizje", "raporty"],
    zakres: "wszystko",
  },
  {
    id: "coordinator",
    nazwa: "Koordynator ofert",
    opis: "Pilnuje jakości ofert i dokumentów. Bez rozliczeń.",
    moduly: ["nieruchomosci", "dokumenty", "klienci"],
    zakres: "wszystko",
  },
  {
    id: "trainee",
    nazwa: "Stażysta",
    opis: "Uczy się na AI Coachu i podgląda bazę ofert. Bez klientów i pieniędzy.",
    moduly: ["nieruchomosci", "coach"],
    zakres: "wlasne",
  },
];

export const ROLE_LABELS: Record<UserRole, string> = Object.fromEntries(
  ROLE.map((r) => [r.id, r.nazwa]),
) as Record<UserRole, string>;

export function opisRoli(role: string | null | undefined): OpisRoli {
  return ROLE.find((r) => r.id === role) ?? ROLE[ROLE.length - 1];
}

/**
 * Indywidualne odstępstwa od roli, zapisane przy koncie (v38).
 * `moduly` trzyma tylko te moduły, które CEO świadomie włączył albo wyłączył.
 */
export type Uprawnienia = {
  moduly?: Partial<Record<Modul, boolean>>;
  zakres?: Zakres;
};

export type OsobaZUprawnieniami = {
  id: string;
  role: string;
  permissions?: Uprawnienia | null;
};

/** Czy osoba ma dostęp do modułu: rola plus ewentualne odstępstwo. */
export function maModul(osoba: OsobaZUprawnieniami, modul: Modul): boolean {
  const wyjatek = osoba.permissions?.moduly?.[modul];
  if (typeof wyjatek === "boolean") return wyjatek;
  return opisRoli(osoba.role).moduly.includes(modul);
}

/** Zakres danych: odstępstwo ma pierwszeństwo przed rolą. */
export function zakresDanych(osoba: OsobaZUprawnieniami): Zakres {
  return osoba.permissions?.zakres ?? opisRoli(osoba.role).zakres;
}

/** Pełna lista modułów, do których osoba ma dostęp. Do budowania menu. */
export function moduly(osoba: OsobaZUprawnieniami): Modul[] {
  return WSZYSTKIE.filter((m) => maModul(osoba, m));
}

/**
 * Czy osoba może zarządzać rolami innych.
 *
 * Tylko CEO. Dyrektor prowadzi biuro, ale nie może sam sobie dołożyć dostępu
 * do rozliczeń ani odebrać go właścicielowi.
 */
export function mozeZarzadzacRolami(osoba: OsobaZUprawnieniami): boolean {
  return osoba.role === "owner";
}

/**
 * Oczyszcza uprawnienia przed zapisem: zostawia tylko znane moduły i zakresy,
 * i wyrzuca wpisy zgodne z rolą, żeby w bazie nie rosła lista bez znaczenia.
 */
export function oczyscUprawnienia(role: string, wejscie: Uprawnienia | null): Uprawnienia | null {
  if (!wejscie) return null;
  const domyslne = opisRoli(role);
  const moduly: Partial<Record<Modul, boolean>> = {};

  for (const m of WSZYSTKIE) {
    const v = wejscie.moduly?.[m];
    if (typeof v !== "boolean") continue;
    if (v === domyslne.moduly.includes(m)) continue;
    moduly[m] = v;
  }

  const zakres =
    wejscie.zakres && ZAKRESY.some((z) => z.id === wejscie.zakres) && wejscie.zakres !== domyslne.zakres
      ? wejscie.zakres
      : undefined;

  const wynik: Uprawnienia = {};
  if (Object.keys(moduly).length) wynik.moduly = moduly;
  if (zakres) wynik.zakres = zakres;
  return Object.keys(wynik).length ? wynik : null;
}
