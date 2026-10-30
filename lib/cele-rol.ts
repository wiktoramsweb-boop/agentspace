// Cele stanowisk. Agent i menedżer pracują lejkiem sprzedaży (lib/funnel), reszta
// ma mierniki swojej pracy. Bez importów: test `npm run test:cele`.

export type Miernik = { klucz: string; nazwa: string; opis: string; domyslnie: number; jednostka: "szt" | "zl" | "ocena"; href: string };
export type CeleStanowiska = { tytul: string; opis: string; mierniki: Miernik[] };

const DORADCA: CeleStanowiska = {
  tytul: "Cele doradcy na ten miesiąc",
  opis: "Liczone same ze spraw kredytowych, które prowadzisz.",
  mierniki: [
    { klucz: "wnioski", nazwa: "Złożone wnioski", opis: "Wnioski złożone w bankach w tym miesiącu.", domyslnie: 12, jednostka: "szt", href: "/app/kredyty" },
    { klucz: "decyzje", nazwa: "Decyzje pozytywne", opis: "Pozytywne decyzje banków w tym miesiącu.", domyslnie: 6, jednostka: "szt", href: "/app/kredyty" },
    { klucz: "umowy", nazwa: "Podpisane umowy", opis: "Umowy kredytowe podpisane w tym miesiącu.", domyslnie: 4, jednostka: "szt", href: "/app/kredyty" },
    { klucz: "wolumen", nazwa: "Wolumen kredytów", opis: "Suma kredytów z podpisanych umów.", domyslnie: 2_000_000, jednostka: "zl", href: "/app/kredyty" },
    { klucz: "prowizja", nazwa: "Prowizja z banków", opis: "Prowizje z podpisanych umów.", domyslnie: 30_000, jednostka: "zl", href: "/app/kredyty" },
  ],
};

const SZEF: CeleStanowiska = {
  tytul: "Cele biura na ten miesiąc",
  opis: "Liczone same z pracy całego biura.",
  mierniki: [
    { klucz: "prowizje_biura", nazwa: "Prowizje biura", opis: "Prowizje z transakcji zamkniętych w tym miesiącu.", domyslnie: 100_000, jednostka: "zl", href: "/app/prowizje" },
    { klucz: "transakcje_biura", nazwa: "Zamknięte transakcje", opis: "Transakcje zamknięte w tym miesiącu.", domyslnie: 8, jednostka: "szt", href: "/app/prowizje" },
    { klucz: "nowe_oferty", nazwa: "Nowe oferty", opis: "Oferty dodane w tym miesiącu.", domyslnie: 15, jednostka: "szt", href: "/app/nieruchomosci" },
    { klucz: "nowi_klienci", nazwa: "Nowi klienci", opis: "Klienci dodani w tym miesiącu.", domyslnie: 40, jednostka: "szt", href: "/app/klienci" },
  ],
};

const STAZYSTA: CeleStanowiska = {
  tytul: "Cele stażysty na ten miesiąc",
  opis: "Na początku liczy się nauka: treningi i wynik rozmów.",
  mierniki: [
    { klucz: "sesje", nazwa: "Ukończone treningi", opis: "Rozmowy z klientem AI w tym miesiącu.", domyslnie: 12, jednostka: "szt", href: "/app/trening" },
    { klucz: "srednia_ocena", nazwa: "Średnia ocena", opis: "Średni wynik rozmów w tym miesiącu.", domyslnie: 7, jednostka: "ocena", href: "/app/historia" },
    { klucz: "lekcje", nazwa: "Lekcje Akademii", opis: "Ukończone lekcje w tym miesiącu.", domyslnie: 8, jednostka: "szt", href: "/app/techniki/akademia" },
  ],
};

/** `null`: stanowisko pracuje lejkiem sprzedaży. */
export function celeStanowiska(rola: string): CeleStanowiska | null {
  if (rola === "credit_advisor") return DORADCA;
  if (rola === "owner" || rola === "director") return SZEF;
  if (rola === "trainee") return STAZYSTA;
  return null;
}

/** Odcinek do wykonania w tym miesiącu: ile powinno być dziś przy równym tempie. */
export function tempo(cel: number, teraz: number, dzien: number, dniWMiesiacu: number): { procent: number; zaPlanem: boolean } {
  const procent = cel > 0 ? Math.min(100, Math.round((teraz / cel) * 100)) : 0;
  return { procent, zaPlanem: teraz >= cel * (dzien / dniWMiesiacu) };
}
