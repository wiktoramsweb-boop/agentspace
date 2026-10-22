// Ścieżka nauki AI Coacha: poziomy, lekcje, progi i nagrody.
// Bez importów: liczy to strona ścieżki, pulpit (XP) i test (`npm run test:sciezka`).

export type Lekcja = {
  id: string;
  scenariusz: string;
  poziomTrudnosci: "latwy" | "sredni" | "trudny";
  charakter: string;
  tytul: string;
  /** Co konkretnie agent ma osiągnąć w tej rozmowie. */
  cel: string;
  /** Technika z biblioteki do przeczytania przed rozmową. */
  technika: string;
  /** Próg zaliczenia w punktach 0-100. */
  prog: number;
};

export type Poziom = {
  nr: number;
  nazwa: string;
  opis: string;
  kolor: "zielony" | "turkus" | "fiolet" | "zloto";
  lekcje: Lekcja[];
  /** Nagroda XP za ukończenie całego poziomu (skrzynia na końcu). */
  nagroda: number;
};

export const XP_ZA_LEKCJE = 40;

const L = (
  id: string,
  scenariusz: string,
  poziomTrudnosci: Lekcja["poziomTrudnosci"],
  charakter: string,
  tytul: string,
  cel: string,
  technika: string,
  prog: number,
): Lekcja => ({ id, scenariusz, poziomTrudnosci, charakter, tytul, cel, technika, prog });

export const SCIEZKA: Poziom[] = [
  {
    nr: 1,
    nazwa: "Podstawy",
    opis: "Życzliwi klienci. Uczysz się otwierać rozmowę, słuchać i zawsze kończyć konkretnym krokiem.",
    kolor: "zielony",
    nagroda: 100,
    lekcje: [
      L("1-1", "polecony-klient", "latwy", "zyczliwy", "Telefon z polecenia", "Przedstaw się przez osobę polecającą i umów spotkanie z terminem.", "pytania-otwarte", 50),
      L("1-2", "lead-najem-telefon", "latwy", "biznesowy", "Pierwszy telefon do najemcy", "Zadaj pytania o termin, liczbę osób i dochody, potem umów oglądanie.", "lejek-pytan", 50),
      L("1-3", "follow-up-po-ogledzinach", "latwy", "wahający", "Telefon po oglądaniu", "Wydobądź prawdziwą wątpliwość klientki i zaproponuj następny krok.", "pytanie-o-powod", 50),
      L("1-4", "najemca-z-dokumentami", "latwy", "biznesowy", "Weryfikacja najemcy", "Zbierz dokumenty sprawnie, tak żeby klientka nie poczuła się przesłuchiwana.", "aktywne-sluchanie", 50),
      L("1-5", "klient-gotowy-umowa", "latwy", "zyczliwy", "Domknięcie umowy", "Podsumuj ustalenia i poproś o podpis bez wahania.", "zamkniecie-podsumowujace", 55),
    ],
  },
  {
    nr: 2,
    nazwa: "Realia",
    opis: "Prawdziwy opór. Klient nie czekał na Twój telefon i nie ma ochoty na kolejnego agenta.",
    kolor: "turkus",
    nagroda: 150,
    lekcje: [
      L("2-1", "zimny-telefon-fsbo", "sredni", "nieufny", "Zimny telefon: „bez pośredników”", "Przejdź przez „bez biur” w ogłoszeniu i umów 20 minut przy mieszkaniu.", "audyt-oskarzen", 60),
      L("2-2", "lead-z-otodom", "sredni", "biznesowy", "Lead z Otodom", "Zakwalifikuj: budżet, finansowanie, termin, kto decyduje. Potem oglądanie.", "lejek-pytan", 60),
      L("2-3", "telefon-archiwalny-najem", "sredni", "nieufny", "Telefon z archiwum", "Nie sprzedawaj w pierwszej minucie. Dowiedz się, co się zmieniło u klienta.", "lustrzane-odbicie", 60),
      L("2-4", "prezentacja-uslugi", "sredni", "cenowy", "Prezentacja usługi", "Pokaż trzy konkretne rzeczy, które robisz inaczej niż poprzednie biura.", "regula-trzech", 60),
      L("2-5", "najem-najemca-dokumenty", "sredni", "emocjonalny", "Dokumenty bez urazy", "Uzasadnij każdy dokument tak, żeby najemczyni sama chciała go dać.", "etykietowanie", 60),
    ],
  },
  {
    nr: 3,
    nazwa: "Trudne rozmowy",
    opis: "Klient testuje Cię pytaniami i rozłącza się po drugim ogólniku. Wygrywają liczby i spokój.",
    kolor: "fiolet",
    nagroda: 200,
    lekcje: [
      L("3-1", "zimny-telefon-wygasle", "trudny", "emocjonalny", "Wygasłe ogłoszenie", "Pokaż, dlaczego się nie sprzedało, bez krytykowania właścicielki.", "spin", 70),
      L("3-2", "monitoring-rynku-sprzedaz", "trudny", "nieufny", "Monitoring rynku", "Otwórz rozmowę obserwacją rynku, nie ofertą. Umów dłuższą rozmowę.", "wzajemnosc", 70),
      L("3-3", "klient-gotowkowy-gdybanie", "trudny", "wahający", "Technika gdybania", "Nie pytaj wprost o sprzedaż. Zbuduj scenariusz „gdyby” i wydobądź kwotę.", "pytania-kalibrowane", 70),
      L("3-4", "przewartosciowane-mieszkanie", "trudny", "emocjonalny", "Za wysoka cena", "Urealnij cenę danymi z aktów notarialnych, nie opinią.", "obiektywne-kryteria", 70),
      L("3-5", "na-wylacznosc", "trudny", "biznesowy", "Wyłączność", "Przekonaj do wyłączności planem działań, nie prośbą.", "czuje-czuli-odkryli", 70),
    ],
  },
  {
    nr: 4,
    nazwa: "Mistrz negocjacji",
    opis: "Pieniądze i decyzje. Bronisz prowizji, rozbrajasz „muszę pomyśleć” i domykasz ceny.",
    kolor: "zloto",
    nagroda: 300,
    lekcje: [
      L("4-1", "obiekcja-nie-place-prowizji", "trudny", "cenowy", "„Nie zapłacę prowizji”", "Obroń stawkę wartością w złotówkach, bez schodzenia z ceny.", "bumerang", 75),
      L("4-2", "negocjacja-prowizji", "trudny", "biznesowy", "Negocjacja prowizji", "Ustępuj tylko warunkowo: „jeśli Pan…, to ja…”.", "strategia-ustepstw", 75),
      L("4-3", "obiekcja-musze-pomyslec", "trudny", "wahający", "„Muszę pomyśleć”", "Izoluj prawdziwy powód i umów konkretny termin decyzji.", "izolacja-obiekcji", 75),
      L("4-4", "obiekcja-przyjdz-z-klientem", "trudny", "agresywny", "„Proszę przyjść z kupcem”", "Wyjaśnij, dlaczego bez umowy nie inwestujesz w kupca, i nie zrażaj klienta.", "plan-b", 75),
      L("4-5", "negocjacja-oferty-wlasciciel", "trudny", "cenowy", "Oferta poniżej ceny", "Przedstaw ofertę kupującego tak, żeby właścicielka złożyła kontrofertę.", "kotwiczenie", 80),
    ],
  },
];

export const WSZYSTKIE_LEKCJE = SCIEZKA.flatMap((p) => p.lekcje);

export function lekcja(id: string | null | undefined): (Lekcja & { poziom: Poziom }) | null {
  if (!id) return null;
  for (const p of SCIEZKA) {
    const l = p.lekcje.find((x) => x.id === id);
    if (l) return { ...l, poziom: p };
  }
  return null;
}

/** Jedna zakończona i oceniona rozmowa. */
export type Podejscie = { scenariusz: string; poziomTrudnosci: string; wynik: number };

export type StanLekcji = Lekcja & {
  najlepszy: number | null;
  podejscia: number;
  zaliczona: boolean;
  odblokowana: boolean;
  aktualna: boolean;
};

export type StanPoziomu = Omit<Poziom, "lekcje"> & {
  lekcje: StanLekcji[];
  ukonczony: boolean;
  zaliczone: number;
};

export type StanSciezki = {
  poziomy: StanPoziomu[];
  zaliczone: number;
  wszystkie: number;
  sredniWynik: number | null;
  xp: number;
  aktualna: StanLekcji | null;
};

/**
 * Stan ścieżki z historii podejść. Lekcję zalicza każda rozmowa w tym samym
 * scenariuszu i na tym samym poziomie trudności z wynikiem od progu, także
 * zaczęta spoza ścieżki: liczy się umiejętność, nie przycisk, którym weszło się
 * w rozmowę. Lekcje odblokowują się po kolei.
 */
export function stanSciezki(podejscia: Podejscie[]): StanSciezki {
  let poprzedniaZaliczona = true;
  let aktualna: StanLekcji | null = null;
  let xp = 0;
  const wynikiLekcji: number[] = [];

  const poziomy: StanPoziomu[] = SCIEZKA.map((p) => {
    const lekcje: StanLekcji[] = p.lekcje.map((l) => {
      const moje = podejscia.filter((x) => x.scenariusz === l.scenariusz && x.poziomTrudnosci === l.poziomTrudnosci);
      const najlepszy = moje.length ? Math.max(...moje.map((x) => x.wynik)) : null;
      const zaliczona = najlepszy !== null && najlepszy >= l.prog;
      const odblokowana = poprzedniaZaliczona;
      const stan: StanLekcji = { ...l, najlepszy, podejscia: moje.length, zaliczona, odblokowana, aktualna: false };
      if (odblokowana && !zaliczona && !aktualna) {
        stan.aktualna = true;
        aktualna = stan;
      }
      if (zaliczona) xp += XP_ZA_LEKCJE;
      if (najlepszy !== null) wynikiLekcji.push(najlepszy);
      poprzedniaZaliczona = zaliczona;
      return stan;
    });
    const zaliczone = lekcje.filter((l) => l.zaliczona).length;
    const ukonczony = zaliczone === lekcje.length;
    if (ukonczony) xp += p.nagroda;
    return { nr: p.nr, nazwa: p.nazwa, opis: p.opis, kolor: p.kolor, nagroda: p.nagroda, lekcje, ukonczony, zaliczone };
  });

  const zaliczone = poziomy.reduce((s, p) => s + p.zaliczone, 0);
  return {
    poziomy,
    zaliczone,
    wszystkie: WSZYSTKIE_LEKCJE.length,
    sredniWynik: wynikiLekcji.length ? Math.round(wynikiLekcji.reduce((a, b) => a + b, 0) / wynikiLekcji.length) : null,
    xp,
    aktualna,
  };
}

/** Wynik 0-100 z oceny: nowa analiza ma punkty, starsze oceny tylko skalę 1-10. */
export function wynikSesji(analizaWynik: unknown, overall: number | null | undefined): number | null {
  if (typeof analizaWynik === "number" && Number.isFinite(analizaWynik)) return Math.max(0, Math.min(100, Math.round(analizaWynik)));
  if (typeof overall === "number") return overall * 10;
  return null;
}
