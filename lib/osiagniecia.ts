// Mapa programu: zadania za punkty, które prowadzą agenta przez kolejne moduły.
// Bez importów z bazy: liczniki zbiera lib/data-osiagniecia.ts.

export type Liczniki = {
  klienci: number;
  notatki: number;
  klienciZTerminem: number;
  klienciDalej: number; // w negocjacjach albo zamknięci
  oferty: number;
  ofertyZeZdjeciami: number;
  poszukiwania: number;
  dzialania: number;
  polaczeniaWykonane: number;
  spotkania: number;
  dokumenty: number;
  transakcje: number;
  transakcjeZamkniete: number;
  sesje: number;
  najlepszaOcena: number;
  cel: number;
  szybkiWpis: number;
  asystentCzat: number;
  asystentPisze: number;
  dopasowanieAi: number;
  zaproszenia: number;
  sprawyKredytowe: number;
  decyzjeKredytowe: number;
};

type Def = { id: string; tytul: string; opis: string; pkt: number; href: string; licznik: keyof Liczniki; prog: number; tylkoZarzad?: boolean; modul?: string };
type Obszar = { id: string; nazwa: string; opis: string; modul?: string; zadania: Def[] };

export const MAPA: Obszar[] = [
  {
    id: "klienci",
    nazwa: "Klienci",
    opis: "Baza, historia kontaktu i etapy.",
    modul: "klienci",
    zadania: [
      { id: "klient-1", tytul: "Pierwszy klient", opis: "Dodaj klienta do bazy.", pkt: 10, href: "/app/klienci", licznik: "klienci", prog: 1 },
      { id: "notatka-1", tytul: "Notatka po rozmowie", opis: "Zapisz notatkę przy kliencie.", pkt: 10, href: "/app/klienci", licznik: "notatki", prog: 1 },
      { id: "termin-5", tytul: "Nikt nie wypada", opis: "Zaplanuj kontakt u 5 klientów.", pkt: 20, href: "/app", licznik: "klienciZTerminem", prog: 5 },
      { id: "klient-25", tytul: "Baza rośnie", opis: "Miej 25 klientów w bazie.", pkt: 30, href: "/app/klienci", licznik: "klienci", prog: 25 },
      { id: "negocjacje-1", tytul: "Do negocjacji", opis: "Doprowadź klienta do etapu negocjacji.", pkt: 25, href: "/app/klienci?widok=tablica", licznik: "klienciDalej", prog: 1 },
    ],
  },
  {
    id: "oferty",
    nazwa: "Oferty",
    opis: "Nieruchomości, zdjęcia i dopasowania.",
    modul: "nieruchomosci",
    zadania: [
      { id: "oferta-1", tytul: "Pierwsza oferta", opis: "Dodaj nieruchomość do bazy biura.", pkt: 15, href: "/app/nieruchomosci", licznik: "oferty", prog: 1 },
      { id: "zdjecia-1", tytul: "Oferta ze zdjęciami", opis: "Wgraj zdjęcia do oferty.", pkt: 15, href: "/app/nieruchomosci", licznik: "ofertyZeZdjeciami", prog: 1 },
      { id: "poszukiwanie-1", tytul: "Czego szuka klient", opis: "Zapisz poszukiwanie kupującego.", pkt: 15, href: "/app/poszukiwania", licznik: "poszukiwania", prog: 1 },
      { id: "dopasowanie-1", tytul: "Dopasowanie AI", opis: "Niech AI dobierze oferty do poszukiwania.", pkt: 20, href: "/app/poszukiwania", licznik: "dopasowanieAi", prog: 1 },
    ],
  },
  {
    id: "dzien",
    nazwa: "Dzień pracy",
    opis: "Działania, kalendarz i AI pod ręką.",
    zadania: [
      { id: "dzialanie-1", tytul: "Pierwsze działanie", opis: "Dodaj telefon, zadanie albo spotkanie.", pkt: 10, href: "/app/dzialania", licznik: "dzialania", prog: 1, modul: "klienci" },
      { id: "telefony-10", tytul: "Telefony zapisane", opis: "Oznacz 10 rozmów jako wykonane.", pkt: 20, href: "/app/dzialania", licznik: "polaczeniaWykonane", prog: 10, modul: "klienci" },
      { id: "spotkanie-1", tytul: "Spotkanie w kalendarzu", opis: "Umów spotkanie z klientem.", pkt: 15, href: "/app/kalendarz", licznik: "spotkania", prog: 1, modul: "klienci" },
      { id: "wpis-1", tytul: "Szybki wpis głosem", opis: "Nagraj notatkę, program rozpisze ją sam.", pkt: 20, href: "/app/szybki-wpis", licznik: "szybkiWpis", prog: 1, modul: "klienci" },
      { id: "asystent-1", tytul: "Zapytaj asystenta", opis: "Zadaj pytanie asystentowi AI (przycisk z iskrą).", pkt: 15, href: "/app", licznik: "asystentCzat", prog: 1 },
      { id: "pisze-1", tytul: "AI pisze za Ciebie", opis: "Wygeneruj follow-up na karcie klienta.", pkt: 15, href: "/app/klienci", licznik: "asystentPisze", prog: 1, modul: "klienci" },
    ],
  },
  {
    id: "papiery",
    nazwa: "Papiery i pieniądze",
    opis: "Dokumenty, transakcje i prowizje.",
    zadania: [
      { id: "dokument-1", tytul: "Dokument w karcie", opis: "Dodaj dokument albo PDF umowy do karty.", pkt: 15, href: "/app/dokumenty", licznik: "dokumenty", prog: 1, modul: "dokumenty" },
      { id: "transakcja-1", tytul: "Pierwsza transakcja", opis: "Załóż transakcję w Prowizjach.", pkt: 25, href: "/app/prowizje", licznik: "transakcje", prog: 1, modul: "prowizje" },
      { id: "zamknieta-1", tytul: "Zamknięta transakcja", opis: "Zamknij transakcję i zobacz zarobek.", pkt: 50, href: "/app/prowizje", licznik: "transakcjeZamkniete", prog: 1, modul: "prowizje" },
    ],
  },
  {
    id: "trening",
    nazwa: "Trening",
    opis: "AI Coach i cele.",
    modul: "coach",
    zadania: [
      { id: "cel-1", tytul: "Cel na rok", opis: "Ustaw cel, a program rozpisze go na dzień.", pkt: 15, href: "/app/cele", licznik: "cel", prog: 1 },
      { id: "sesja-1", tytul: "Pierwszy trening", opis: "Porozmawiaj z klientem AI.", pkt: 20, href: "/app/trening", licznik: "sesje", prog: 1 },
      { id: "sesja-5", tytul: "Pięć rozmów", opis: "Ukończ 5 treningów.", pkt: 30, href: "/app/trening", licznik: "sesje", prog: 5 },
      { id: "ocena-8", tytul: "Rozmowa na 8", opis: "Zdobądź ocenę 8/10 lub wyższą.", pkt: 40, href: "/app/trening", licznik: "najlepszaOcena", prog: 8 },
    ],
  },
  {
    id: "kredyty",
    nazwa: "Kredyty",
    opis: "Sprawy klientów i decyzje banków.",
    modul: "kredyty",
    zadania: [
      { id: "kredyt-1", tytul: "Pierwsza sprawa", opis: "Załóż sprawę kredytową klienta.", pkt: 15, href: "/app/kredyty", licznik: "sprawyKredytowe", prog: 1 },
      { id: "kredyt-10", tytul: "Dziesięć spraw", opis: "Prowadź 10 spraw kredytowych.", pkt: 30, href: "/app/kredyty", licznik: "sprawyKredytowe", prog: 10 },
      { id: "decyzja-1", tytul: "Pierwsza decyzja", opis: "Doprowadź sprawę do pozytywnej decyzji banku.", pkt: 40, href: "/app/kredyty", licznik: "decyzjeKredytowe", prog: 1 },
    ],
  },
  {
    id: "biuro",
    nazwa: "Biuro",
    opis: "Zespół i zarządzanie.",
    zadania: [
      { id: "zespol-1", tytul: "Zespół w programie", opis: "Zaproś pierwszą osobę do biura.", pkt: 20, href: "/app/zespol", licznik: "zaproszenia", prog: 1, tylkoZarzad: true },
    ],
  },
];

export type Zadanie = Omit<Def, "licznik" | "prog" | "tylkoZarzad"> & { zrobione: boolean; postep: { teraz: number; cel: number } };
export type Mapa = {
  obszary: { id: string; nazwa: string; opis: string; zadania: Zadanie[]; zrobione: number }[];
  punkty: number;
  maksimum: number;
  procent: number;
  ranga: string;
  /** Numer rangi od 0 i próg kolejnej w procentach, do ścieżki na ekranie. */
  poziom: number;
  rangi: { nazwa: string; od: number }[];
  nastepne: Zadanie | null;
};

const RANGI: [number, string][] = [
  [0, "Nowy w programie"],
  [20, "Odkrywca"],
  [45, "Bywalec"],
  [70, "Znawca"],
  [90, "Mistrz programu"],
];

/** `moduly`: zadania spoza stanowiska nie pojawiają się wcale. Doradca nie dostaje zadania „dodaj ofertę”. */
export function policzMape(l: Liczniki, zarzad: boolean, moduly?: readonly string[]): Mapa {
  const wolno = (m?: string) => !m || !moduly || moduly.includes(m);
  const obszary = MAPA.filter((o) => wolno(o.modul)).map((o) => {
    const zadania = o.zadania
      .filter((d) => (!d.tylkoZarzad || zarzad) && wolno(d.modul))
      .map(({ licznik, prog, tylkoZarzad: _, modul: _m, ...reszta }) => {
        const teraz = Math.min(l[licznik], prog);
        return { ...reszta, zrobione: l[licznik] >= prog, postep: { teraz, cel: prog } };
      });
    return { id: o.id, nazwa: o.nazwa, opis: o.opis, zadania, zrobione: zadania.filter((z) => z.zrobione).length };
  }).filter((o) => o.zadania.length > 0);

  const wszystkie = obszary.flatMap((o) => o.zadania);
  const punkty = wszystkie.filter((z) => z.zrobione).reduce((s, z) => s + z.pkt, 0);
  const maksimum = wszystkie.reduce((s, z) => s + z.pkt, 0);
  const procent = maksimum ? Math.round((punkty / maksimum) * 100) : 0;
  const ranga = [...RANGI].reverse().find(([od]) => procent >= od)?.[1] ?? RANGI[0][1];
  // Podpowiadamy najtańsze niezrobione zadanie: szybka wygrana zachęca do następnej.
  const nastepne = [...wszystkie].filter((z) => !z.zrobione).sort((a, b) => a.pkt - b.pkt)[0] ?? null;
  const poziom = RANGI.filter(([od]) => procent >= od).length - 1;
  return { obszary, punkty, maksimum, procent, ranga, poziom, rangi: RANGI.map(([od, nazwa]) => ({ nazwa, od })), nastepne };
}
