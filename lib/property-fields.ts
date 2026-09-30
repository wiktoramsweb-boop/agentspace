import type { PropertyDealKind, PropertyType } from "./types";

/**
 * Pola oferty osobno dla każdego typu nieruchomości.
 *
 * Dlaczego to jest dane, a nie kod formularza: mieszkanie, działka, hala i pokój
 * opisuje się zupełnie innymi parametrami, a lista tych parametrów rośnie z
 * każdym miesiącem pracy biura. Trzymając je w jednej tablicy dodanie pola albo
 * pozycji w słowniku to jedna linia tutaj, bez ruszania kreatora i bez migracji
 * bazy - wartości spoza kolumn lądują w kolumnie `details` (jsonb).
 *
 * Wartością pola wyboru jest jego etykieta. To celowe: te dane wyświetlamy
 * dosłownie i nigdy nie porównujemy w kodzie, więc nie potrzebujemy drugiej
 * warstwy tłumaczenia wartość-etykieta. Gdy dojdzie eksport na portale, mapowanie
 * na ich słowniki zrobimy w osobnym pliku.
 */

export type FieldKind = "number" | "text" | "date" | "select" | "multi" | "bool" | "textarea";

export type PropertyField = {
  /** Klucz w `details`, albo nazwa kolumny gdy `column`. */
  key: string;
  label: string;
  kind: FieldKind;
  options?: readonly string[];
  unit?: string;
  hint?: string;
  placeholder?: string;
  /** Pole pokazujemy tylko przy sprzedaży albo tylko przy wynajmie. */
  only?: PropertyDealKind;
  /** Pole ma własną kolumnę w tabeli properties (dane z v17). */
  column?: true;
  /** Pole zajmuje całą szerokość wiersza. */
  wide?: true;
};

/** Ikona nagłówka sekcji; rysuje ją app/app/nieruchomosci/section-icon.tsx. */
export type SectionIcon =
  | "podstawy" | "pokoje" | "budynek" | "instalacje" | "parking" | "media"
  | "koszty" | "najem" | "otoczenie" | "bezpieczenstwo" | "prawne" | "energia"
  | "teren" | "zabudowa" | "dojazd" | "przeznaczenie" | "ekonomia" | "terminy"
  | "ludzie" | "technika" | "logistyka" | "potencjal" | "handel" | "noclegi";

export type PropertySection = {
  title: string;
  icon: SectionIcon;
  hint?: string;
  fields: PropertyField[];
  only?: PropertyDealKind;
  /** Sekcja otwarta od razu po wejściu w krok Parametry. */
  open?: true;
};

export type TypeSchema = {
  /** Nazwa pola ceny w tym typie, np. inwestycja ma widełki. */
  sections: PropertySection[];
  /** Czy pokazać kafelki udogodnień (kolumna features, wspólna z poszukiwaniami). */
  features: boolean;
};

// ── Skróty do budowania pól ─────────────────────────────────────────────
type X = Partial<Omit<PropertyField, "key" | "label" | "kind">>;
const n = (key: string, label: string, x: X = {}): PropertyField => ({ kind: "number", key, label, ...x });
const t = (key: string, label: string, x: X = {}): PropertyField => ({ kind: "text", key, label, ...x });
const d = (key: string, label: string, x: X = {}): PropertyField => ({ kind: "date", key, label, ...x });
const s = (key: string, label: string, options: readonly string[], x: X = {}): PropertyField => ({
  kind: "select", key, label, options, ...x,
});
const m = (key: string, label: string, options: readonly string[], x: X = {}): PropertyField => ({
  kind: "multi", key, label, options, ...x,
});
const b = (key: string, label: string, x: X = {}): PropertyField => ({ kind: "bool", key, label, ...x });
const area = (key: string, label: string, x: X = {}): PropertyField => n(key, label, { unit: "m²", ...x });

// ── Wspólne słowniki ────────────────────────────────────────────────────
const MEDIUM = ["Jest", "W drodze", "Możliwość podłączenia", "Brak"] as const;
const STAN_BUD = [
  "Bardzo dobry", "Dobry", "Do odświeżenia", "Do remontu", "Do generalnego remontu",
  "Stan surowy zamknięty", "Stan surowy otwarty", "W budowie", "Nowy",
] as const;
const OKNA = ["PVC", "Drewniane", "Aluminiowe", "Drewno-aluminium", "Stare skrzynkowe"] as const;
const DRZWI = ["Antywłamaniowe", "Drewniane", "Stalowe", "PVC", "Zwykłe"] as const;
const OGRZEWANIE = [
  "Miejskie (MPEC)", "Gazowe", "Gazowe kondensacyjne", "Elektryczne", "Pompa ciepła",
  "Pompa ciepła powietrzna", "Pompa ciepła gruntowa", "Kominek z rozprowadzeniem",
  "Piec kaflowy", "Kocioł na pellet", "Kocioł na węgiel", "Olejowe", "Podłogowe", "Brak",
] as const;
const CIEPLA_WODA = ["Z sieci", "Piec gazowy", "Bojler elektryczny", "Pompa ciepła", "Kolektory słoneczne", "Przepływowy"] as const;
const PODLOGI = ["Parkiet", "Deska barlinecka", "Laminat", "Winyl", "Płytki", "Wykładzina", "Beton", "Do wyboru przez kupującego"] as const;
const KUCHNIA = ["Osobna", "Aneks kuchenny", "Otwarta na salon", "Kuchnia z jadalnią", "Wnęka kuchenna"] as const;
const PARKING = ["Brak", "Miejsce naziemne", "Miejsce podziemne", "Hala garażowa", "Garaż wolnostojący", "Garaż w bryle budynku", "Wiata", "Postój na posesji"] as const;
const W_CENIE = ["W cenie", "Dodatkowo płatne", "Do wynajęcia osobno", "Brak"] as const;
const WLASNOSC = [
  "Pełna własność (KW)", "Spółdzielcze własnościowe", "Spółdzielcze własnościowe z KW",
  "Spółdzielcze lokatorskie", "Udział w nieruchomości", "Użytkowanie wieczyste", "Własność z udziałem w gruncie",
] as const;
const UMOWA = ["Otwarta", "Z klauzulą wyłączności", "Umowa z deweloperem", "Brak umowy"] as const;
const KLASA_ENERG = ["A+", "A", "B", "C", "D", "E", "F", "G"] as const;
const DROGA = ["Asfaltowa", "Kostka brukowa", "Utwardzona", "Gruntowa", "Brak drogi"] as const;
const OTOCZENIE = [
  "Szkoła", "Przedszkole", "Żłobek", "Uczelnia", "Sklep spożywczy", "Galeria handlowa",
  "Przystanek autobusowy", "Przystanek tramwajowy", "Dworzec", "Park", "Las", "Rzeka lub jezioro",
  "Przychodnia", "Szpital", "Siłownia", "Restauracje", "Centrum miasta", "Obwodnica lub wjazd na autostradę",
] as const;

// ── Sekcje wspólne (funkcje, żeby każdy typ miał własną tablicę) ────────

function sekcjaMedia(rozszerzona = false): PropertySection {
  return {
    title: "Media i przyłącza",
    icon: "media",
    fields: [
      s("media_prad", "Prąd", MEDIUM),
      s("media_gaz", "Gaz", rozszerzona ? ["Sieć", "Zbiornik na działce", "Butla", "W drodze", "Brak"] : MEDIUM),
      s("media_woda", "Woda", rozszerzona ? ["Sieć miejska", "Studnia", "Sieć i studnia", "W drodze", "Brak"] : MEDIUM),
      s("media_kanalizacja", "Kanalizacja", rozszerzona
        ? ["Sieć miejska", "Szambo", "Oczyszczalnia przydomowa", "W drodze", "Brak"]
        : MEDIUM),
      s("media_internet", "Internet", ["Światłowód", "Kablowy", "Radiowy", "Brak"]),
      n("media_moc_kw", "Moc przyłącza", { unit: "kW", placeholder: "12" }),
      b("media_sila", "Siła (instalacja 3-fazowa)"),
    ],
  };
}

function sekcjaKoszty(dodatkowe: PropertyField[] = []): PropertySection {
  return {
    title: "Koszty i opłaty",
    icon: "koszty",
    fields: [
      n("admin_fee_pln", "Czynsz administracyjny", { unit: "zł/mc", column: true, placeholder: "700" }),
      m("czynsz_zawiera", "Co zawiera czynsz", [
        "Woda", "Ścieki", "Ogrzewanie", "Ciepła woda", "Wywóz śmieci", "Części wspólne",
        "Fundusz remontowy", "Sprzątanie", "Ochrona", "Internet", "Zarząd",
      ]),
      n("koszty_media_pln", "Media poza czynszem (średnio)", { unit: "zł/mc", placeholder: "350" }),
      n("podatek_nieruchomosc_pln", "Podatek od nieruchomości", { unit: "zł/rok" }),
      n("deposit_pln", "Kaucja", { unit: "zł", column: true, only: "wynajem", placeholder: "3000" }),
      ...dodatkowe,
    ],
  };
}

function sekcjaNajem(dodatkowe: PropertyField[] = []): PropertySection {
  return {
    title: "Warunki najmu",
    icon: "najem",
    only: "wynajem",
    fields: [
      d("available_from", "Dostępne od", { column: true }),
      s("najem_okres_min", "Minimalny okres najmu", ["Dowolny", "1 miesiąc", "3 miesiące", "6 miesięcy", "12 miesięcy", "24 miesiące", "Dłużej"]),
      s("najem_zwierzeta", "Zwierzęta", ["Dozwolone", "Do ustalenia", "Niedozwolone"]),
      s("najem_palenie", "Palenie", ["Dozwolone", "Tylko na balkonie", "Niedozwolone"]),
      s("najem_faktura", "Faktura VAT", ["Tak", "Nie"]),
      t("najem_wypowiedzenie", "Okres wypowiedzenia", { placeholder: "1 miesiąc" }),
      ...dodatkowe,
    ],
  };
}

function sekcjaPrawne(dodatkowe: PropertyField[] = []): PropertySection {
  return {
    title: "Stan prawny i umowa",
    icon: "prawne",
    fields: [
      s("ownership", "Forma własności", WLASNOSC, { column: true }),
      s("market", "Rynek", ["Wtórny", "Pierwotny"], { column: true }),
      t("kw_numer", "Numer księgi wieczystej", { placeholder: "KR1P/00012345/6" }),
      m("obciazenia", "Obciążenia i wpisy", [
        "Hipoteka", "Służebność", "Dożywocie", "Roszczenie", "Zajęcie komornicze",
        "Umowa najmu", "Dzierżawa", "Prawo pierwokupu", "Brak obciążeń",
      ]),
      s("vat", "VAT do ceny", ["Cena brutto", "Cena netto + 23% VAT", "Cena netto + 8% VAT", "Zwolnione z VAT", "Nie dotyczy"]),
      s("umowa_typ", "Umowa pośrednictwa", UMOWA),
      n("prowizja_proc", "Prowizja biura", { unit: "%", placeholder: "2" }),
      b("zameldowani", "Osoby zameldowane"),
      ...dodatkowe,
    ],
  };
}

function sekcjaEnergia(): PropertySection {
  return {
    title: "Świadectwo charakterystyki energetycznej",
    icon: "energia",
    hint: "Od 2023 roku ogłoszenie sprzedaży i najmu musi podawać wskaźnik EP. Skan świadectwa dodasz na karcie oferty w Dokumentach.",
    fields: [
      s("energy_cert_status", "Stan świadectwa", ["Posiada świadectwo", "W przygotowaniu", "Zwolniona z obowiązku"], { column: true }),
      n("energy_ep", "EP - energia pierwotna", { unit: "kWh/m²·rok", column: true, placeholder: "95" }),
      n("energia_eu", "EU - energia użytkowa", { unit: "kWh/m²·rok", placeholder: "70" }),
      n("energia_eco2", "ECO2 - emisja CO₂", { unit: "t CO₂/m²·rok", placeholder: "0,02" }),
      s("energia_klasa", "Klasa energetyczna", KLASA_ENERG),
      d("energy_cert_valid_until", "Świadectwo ważne do", { column: true }),
    ],
  };
}

function sekcjaOtoczenie(extra: readonly string[] = [], bezDrogi = false): PropertySection {
  return {
    title: "Okolica i otoczenie",
    icon: "otoczenie",
    fields: [
      m("otoczenie", "W pobliżu", [...OTOCZENIE, ...extra]),
      n("odleglosc_centrum_km", "Odległość od centrum", { unit: "km", placeholder: "4" }),
      ...(bezDrogi ? [] : [s("droga_dojazdowa", "Droga dojazdowa", DROGA)]),
      t("dzielnica", "Dzielnica lub osiedle", { placeholder: "Czyżyny" }),
    ],
  };
}

function sekcjaBezpieczenstwo(): PropertySection {
  return {
    title: "Bezpieczeństwo",
    icon: "bezpieczenstwo",
    fields: [
      m("bezpieczenstwo", "Zabezpieczenia", [
        "Drzwi antywłamaniowe", "Rolety antywłamaniowe", "Okna antywłamaniowe", "System alarmowy",
        "Monitoring", "Domofon", "Wideofon", "Kontrola dostępu", "Ochrona", "Portiernia",
        "Teren ogrodzony", "Osiedle zamknięte", "Brama automatyczna", "Czujniki dymu",
        "Czujnik czadu", "Czujnik zalania", "Oświetlenie z czujnikiem ruchu",
      ]),
    ],
  };
}

function sekcjaParking(): PropertySection {
  return {
    title: "Garaż i parking",
    icon: "parking",
    fields: [
      s("parking_rodzaj", "Rodzaj miejsca", PARKING),
      n("parking_liczba", "Liczba miejsc", { placeholder: "1" }),
      s("parking_w_cenie", "Miejsce w cenie", W_CENIE),
      n("parking_cena_pln", "Cena miejsca", { unit: "zł" }),
      area("garaz_m2", "Powierzchnia garażu"),
    ],
  };
}

// ── MIESZKANIE ──────────────────────────────────────────────────────────
const MIESZKANIE: TypeSchema = {
  features: true,
  sections: [
    {
      title: "Podstawowe",
      icon: "podstawy",
      open: true,
      fields: [
        n("price", "Cena", { unit: "zł", column: true, placeholder: "650000" }),
        area("area", "Powierzchnia", { column: true, placeholder: "48" }),
        n("rooms", "Liczba pokoi", { column: true, placeholder: "2" }),
        n("floor", "Piętro", { column: true, hint: "0 = parter", placeholder: "2" }),
        n("floors_total", "Pięter w budynku", { column: true, placeholder: "5" }),
        n("year_built", "Rok budowy", { column: true, placeholder: "2015" }),
      ],
    },
    {
      title: "Rozkład i pomieszczenia",
      icon: "pokoje",
      open: true,
      fields: [
        s("kuchnia", "Kuchnia", KUCHNIA),
        n("lazienki", "Liczba łazienek", { placeholder: "1" }),
        b("wc_osobno", "Osobna toaleta"),
        b("rozkladowe", "Mieszkanie rozkładowe"),
        b("dwupoziomowe", "Dwupoziomowe"),
        s("uklad_okien", "Ekspozycja okien", ["Wschód", "Zachód", "Północ", "Południe", "Wschód-zachód", "Północ-południe", "Na dwie strony", "Na trzy strony"]),
        area("balkon_m2", "Powierzchnia balkonu"),
        n("balkony", "Liczba balkonów"),
        area("taras_m2", "Powierzchnia tarasu"),
        area("loggia_m2", "Powierzchnia loggii"),
        area("ogrodek_m2", "Powierzchnia ogródka"),
        area("piwnica_m2", "Powierzchnia piwnicy"),
        b("komorka", "Komórka lokatorska"),
        b("strych", "Strych do dyspozycji"),
        b("garderoba", "Garderoba"),
        b("pralnia", "Osobna pralnia"),
      ],
    },
    {
      title: "Budynek",
      icon: "budynek",
      fields: [
        s("building_type", "Rodzaj budynku", [
          "Blok", "Niski blok (do 4 pięter)", "Wysoki blok", "Apartamentowiec", "Kamienica",
          "Plomba", "Dom wielolokalowy", "Loft", "Willa miejska", "Segment", "Budynek mieszkalno-usługowy",
        ], { column: true }),
        s("material_budynku", "Materiał budynku", [
          "Cegła", "Pustak", "Beton komórkowy", "Silikat", "Keramzyt", "Wielka płyta",
          "Żelbet", "Szkielet drewniany", "Drewno", "Kamień", "Prefabrykat",
        ]),
        s("stan_budynku", "Stan budynku", STAN_BUD),
        s("winda", "Winda", ["Tak", "Nie", "Dwie i więcej"]),
        n("mieszkan_w_budynku", "Mieszkań w budynku", { placeholder: "40" }),
        n("klatki_w_budynku", "Liczba klatek"),
        b("teren_zamkniety", "Teren zamknięty"),
        d("remont_budynku", "Ostatni remont budynku"),
        m("czesci_wspolne", "Części wspólne", [
          "Rowerownia", "Wózkownia", "Plac zabaw", "Siłownia", "Sala fitness", "Concierge",
          "Sauna", "Zieleń wewnętrzna", "Paczkomat w budynku", "Poczekalnia", "Myjnia dla psów",
        ]),
      ],
    },
    {
      title: "Standard i instalacje",
      icon: "instalacje",
      fields: [
        s("condition_std", "Stan mieszkania", [
          "Do wprowadzenia", "Wysoki standard", "Po remoncie", "Do odświeżenia", "Do remontu",
          "Stan deweloperski", "Pod klucz", "W budowie",
        ], { column: true }),
        s("heating", "Ogrzewanie", OGRZEWANIE, { column: true }),
        s("ciepla_woda", "Ciepła woda", CIEPLA_WODA),
        b("ogrzewanie_podlogowe", "Ogrzewanie podłogowe"),
        s("okna", "Okna", OKNA),
        s("drzwi_wejsciowe", "Drzwi wejściowe", DRZWI),
        s("podlogi", "Podłogi", PODLOGI),
        b("rekuperacja", "Rekuperacja"),
        b("rolety", "Rolety zewnętrzne"),
        n("wysokosc_pomieszczen_m", "Wysokość pomieszczeń", { unit: "m", placeholder: "2,6" }),
        m("wyposazenie", "Wyposażenie w cenie", [
          "Kuchnia w zabudowie", "Płyta indukcyjna", "Płyta gazowa", "Piekarnik", "Zmywarka",
          "Pralka", "Lodówka", "Mikrofalówka", "Okap", "Szafy wnękowe", "Meble", "Telewizor", "Klimatyzator",
        ]),
      ],
    },
    sekcjaParking(),
    sekcjaMedia(),
    sekcjaKoszty(),
    sekcjaNajem([
      n("najem_miejsc_spania", "Liczba miejsc do spania"),
      m("najem_dla", "Preferowani najemcy", ["Bez preferencji", "Rodzina", "Para", "Osoba pracująca", "Studenci", "Firma", "Najem krótkoterminowy"]),
    ]),
    sekcjaOtoczenie(),
    sekcjaBezpieczenstwo(),
    sekcjaPrawne(),
    sekcjaEnergia(),
  ],
};

// ── DOM ─────────────────────────────────────────────────────────────────
const DOM: TypeSchema = {
  features: true,
  sections: [
    {
      title: "Podstawowe",
      icon: "podstawy",
      open: true,
      fields: [
        n("price", "Cena", { unit: "zł", column: true, placeholder: "1250000" }),
        area("area", "Powierzchnia użytkowa", { column: true, placeholder: "140" }),
        area("pow_calkowita_m2", "Powierzchnia całkowita", { placeholder: "180" }),
        area("plot_area_m2", "Powierzchnia działki", { column: true, placeholder: "800" }),
        n("rooms", "Liczba pokoi", { column: true, placeholder: "5" }),
        n("kondygnacje", "Liczba kondygnacji", { placeholder: "2" }),
        n("year_built", "Rok budowy", { column: true, placeholder: "2008" }),
      ],
    },
    {
      title: "Typ i konstrukcja",
      icon: "zabudowa",
      open: true,
      fields: [
        s("typ_domu", "Typ domu", [
          "Wolnostojący", "Bliźniak", "Szeregowy skrajny", "Szeregowy środkowy", "Segment",
          "Willa", "Rezydencja", "Dworek", "Kamienica", "Dom wielolokalowy", "Dom z lokalem usługowym",
          "Dom drewniany", "Dom letniskowy", "Dom całoroczny", "Gospodarstwo", "Dom w zabudowie zwartej", "Bliźniak - połowa",
        ]),
        s("material_scian", "Materiał ścian", [
          "Cegła", "Pustak", "Beton komórkowy", "Silikat", "Keramzyt", "Żelbet",
          "Szkielet drewniany (kanadyjski)", "Bale drewniane", "Kamień", "Prefabrykat", "Wielka płyta",
        ]),
        s("technologia", "Technologia budowy", ["Tradycyjna murowana", "Tradycyjna ulepszona", "Szkieletowa kanadyjska", "Modułowa prefabrykowana", "Pasywna", "Energooszczędna"]),
        s("stan_budynku", "Stan budynku", STAN_BUD),
        s("condition_std", "Stan wykończenia", [
          "Do wprowadzenia", "Wysoki standard", "Po remoncie", "Do odświeżenia", "Do remontu",
          "Stan deweloperski", "Stan surowy zamknięty", "Stan surowy otwarty", "W budowie",
        ], { column: true }),
        s("dach_rodzaj", "Kształt dachu", ["Dwuspadowy", "Czterospadowy", "Wielospadowy", "Kopertowy", "Jednospadowy", "Płaski", "Mansardowy", "Naczółkowy", "Pulpitowy"]),
        s("dach_pokrycie", "Pokrycie dachu", ["Dachówka ceramiczna", "Dachówka betonowa", "Blachodachówka", "Blacha na rąbek", "Papa", "Gont bitumiczny", "Gont drewniany", "Strzecha", "Łupek", "Eternit", "Membrana"]),
        s("okna", "Stolarka okienna", OKNA),
        s("drzwi_wejsciowe", "Drzwi wejściowe", DRZWI),
        s("elewacja", "Elewacja", ["Tynk", "Tynk silikonowy", "Klinkier", "Cegła", "Kamień", "Drewno", "Płyta włóknocementowa", "Blacha", "Do wykonania"]),
        b("ocieplony", "Budynek ocieplony"),
        n("grubosc_ocieplenia_cm", "Grubość ocieplenia", { unit: "cm", placeholder: "15" }),
        d("ostatni_remont", "Ostatni remont"),
      ],
    },
    {
      title: "Pomieszczenia i kondygnacje",
      icon: "pokoje",
      fields: [
        area("salon_m2", "Powierzchnia salonu"),
        n("lazienki", "Liczba łazienek", { placeholder: "2" }),
        n("wc", "Liczba toalet"),
        s("kuchnia", "Kuchnia", KUCHNIA),
        s("poddasze", "Poddasze", ["Brak", "Nieużytkowe", "Użytkowe", "Do adaptacji", "Zaadaptowane"]),
        s("piwnica", "Piwnica", ["Brak", "Częściowa", "Pełna (pod całym domem)", "Tylko kotłownia"]),
        m("pomieszczenia", "Pomieszczenia dodatkowe", [
          "Garderoba", "Pralnia", "Kotłownia", "Gabinet", "Biblioteka", "Spiżarnia", "Jadalnia",
          "Sauna", "Siłownia", "Pokój gościnny", "Pokój kinowy", "Wiatrołap", "Hol", "Schowek pod schodami",
        ]),
        area("taras_m2", "Powierzchnia tarasu"),
        area("balkon_m2", "Powierzchnia balkonów"),
        b("weranda", "Weranda lub ganek"),
        b("antresola", "Antresola"),
      ],
    },
    {
      title: "Garaż i budynki gospodarcze",
      icon: "parking",
      fields: [
        s("garaz_rodzaj", "Garaż", ["Brak", "W bryle budynku", "Przybudowany", "Wolnostojący", "Podziemny", "Wiata", "Blaszak"]),
        n("garaz_stanowiska", "Liczba stanowisk", { placeholder: "2" }),
        area("garaz_m2", "Powierzchnia garażu"),
        b("brama_automatyczna", "Brama garażowa automatyczna"),
        m("budynki_gospodarcze", "Zabudowania na działce", [
          "Budynek gospodarczy", "Warsztat", "Stodoła", "Obora", "Kurnik", "Szklarnia",
          "Altana", "Domek narzędziowy", "Wędzarnia", "Piec ogrodowy", "Garaż dodatkowy",
        ]),
      ],
    },
    {
      title: "Instalacje i technika",
      icon: "instalacje",
      fields: [
        s("heating", "Ogrzewanie", OGRZEWANIE, { column: true }),
        s("ciepla_woda", "Ciepła woda", CIEPLA_WODA),
        b("ogrzewanie_podlogowe", "Ogrzewanie podłogowe"),
        s("kominek", "Kominek", ["Brak", "Dekoracyjny", "Z płaszczem wodnym", "Z rozprowadzeniem powietrza", "Piec wolnostojący (koza)"]),
        b("rekuperacja", "Rekuperacja"),
        b("klimatyzacja_dom", "Klimatyzacja"),
        n("fotowoltaika_kw", "Fotowoltaika", { unit: "kWp", placeholder: "6" }),
        b("kolektory", "Kolektory słoneczne"),
        b("magazyn_energii", "Magazyn energii"),
        b("smart_home", "System inteligentnego domu"),
        b("centralny_odkurzacz", "Centralny odkurzacz"),
        b("zmiekczacz_wody", "Zmiękczacz wody"),
        b("stacja_ladowania", "Ładowarka do auta elektrycznego"),
        s("podlogi", "Podłogi", PODLOGI),
      ],
    },
    {
      title: "Działka i ogród",
      icon: "teren",
      fields: [
        s("ksztalt_dzialki", "Kształt działki", ["Prostokątna", "Kwadratowa", "Trapez", "Wielokąt", "Nieregularna", "Wąska i długa"]),
        t("wymiary_dzialki", "Wymiary działki", { placeholder: "20 x 40 m" }),
        s("uksztaltowanie", "Ukształtowanie terenu", ["Płaska", "Lekko nachylona", "Stok", "Tarasowa", "Zagłębiona"]),
        s("ogrodzenie", "Ogrodzenie", ["Brak", "Siatka", "Panele", "Drewniane", "Murowane", "Klinkier", "Kamień", "Metalowe kute", "Żywopłot", "Częściowe"]),
        s("nawierzchnia_podjazdu", "Nawierzchnia podjazdu", ["Kostka brukowa", "Beton", "Asfalt", "Żwir", "Płyty ażurowe", "Gruntowa", "Brak"]),
        b("ogrod_zagospodarowany", "Ogród zagospodarowany"),
        b("nawadnianie", "System nawadniania"),
        b("basen", "Basen"),
        b("oczko_wodne", "Oczko wodne lub staw"),
        b("studnia", "Studnia"),
        b("plac_zabaw", "Plac zabaw"),
        s("naslonecznienie", "Nasłonecznienie działki", ["Bardzo dobre", "Dobre", "Średnie", "Zacienione"]),
      ],
    },
    sekcjaMedia(true),
    sekcjaKoszty([n("koszt_ogrzewania_rok_pln", "Roczny koszt ogrzewania", { unit: "zł" })]),
    sekcjaNajem(),
    sekcjaOtoczenie(["Jezioro", "Morze", "Góry", "Pola uprawne", "Zabudowa jednorodzinna", "Zabudowa wielorodzinna", "Strefa przemysłowa"]),
    sekcjaBezpieczenstwo(),
    sekcjaPrawne(),
    sekcjaEnergia(),
  ],
};

// ── DZIAŁKA ─────────────────────────────────────────────────────────────
const DZIALKA: TypeSchema = {
  features: false,
  sections: [
    {
      title: "Podstawowe",
      icon: "podstawy",
      open: true,
      fields: [
        n("price", "Cena", { unit: "zł", column: true, placeholder: "320000" }),
        area("plot_area_m2", "Powierzchnia działki", { column: true, placeholder: "1200" }),
        n("pow_ha", "Powierzchnia", { unit: "ha", hint: "Uzupełnij przy dużych działkach rolnych", placeholder: "1,5" }),
        n("dzialek_liczba", "Liczba działek w ofercie", { placeholder: "1" }),
        t("numer_dzialki", "Numer ewidencyjny działki", { placeholder: "123/4" }),
        t("obreb", "Obręb ewidencyjny" ),
      ],
    },
    {
      title: "Przeznaczenie",
      icon: "przeznaczenie",
      open: true,
      fields: [
        s("rodzaj_dzialki", "Rodzaj działki", [
          "Budowlana", "Budowlano-usługowa", "Usługowa", "Pod zabudowę wielorodzinną",
          "Pod zabudowę bliźniaczą", "Pod zabudowę szeregową", "Przemysłowa", "Pod halę lub magazyn",
          "Inwestycyjna", "Rolna", "Rolno-budowlana", "Siedliskowa", "Rekreacyjna",
          "Leśna", "Ogrodnicza", "Sadownicza", "Pod usługi turystyczne", "Pod fotowoltaikę", "Inna",
        ]),
        t("mpzp_zapis", "Zapis w planie miejscowym", { placeholder: "MN - zabudowa mieszkaniowa jednorodzinna", wide: true }),
      ],
    },
    {
      title: "Warunki zabudowy",
      icon: "zabudowa",
      open: true,
      fields: [
        s("plan_miejscowy", "Plan miejscowy (MPZP)", ["Jest", "W przygotowaniu", "Brak", "W trakcie uchwalania", "Studium"]),
        s("warunki_zabudowy", "Wydane warunki zabudowy", ["Tak", "Nie", "W toku", "Nie są wymagane"]),
        s("pozwolenie_budowa", "Pozwolenie na budowę", ["Jest", "W toku", "Brak", "Zgłoszenie budowy"]),
        b("projekt_w_cenie", "Projekt domu w cenie"),
        n("wysokosc_zabudowy_m", "Dopuszczalna wysokość zabudowy", { unit: "m", placeholder: "9" }),
        n("kondygnacje_dopuszczalne", "Dopuszczalna liczba kondygnacji", { placeholder: "2" }),
        n("procent_zabudowy", "Procent możliwej zabudowy", { unit: "%", placeholder: "30" }),
        n("intensywnosc_zabudowy", "Intensywność zabudowy", { placeholder: "0,8" }),
        n("pow_biologicznie_czynna", "Powierzchnia biologicznie czynna", { unit: "%", placeholder: "40" }),
        s("dach_wymagany", "Wymagany kształt dachu", ["Dowolny", "Dwuspadowy", "Czterospadowy", "Wielospadowy", "Płaski"]),
        t("linia_zabudowy", "Linia zabudowy", { placeholder: "6 m od drogi" }),
        s("mozliwosc_podzialu", "Możliwość podziału", ["Tak", "Nie", "Do sprawdzenia"]),
        n("dzialek_po_podziale", "Liczba działek po podziale", { placeholder: "3" }),
      ],
    },
    {
      title: "Wygląd i kształt gruntu",
      icon: "teren",
      fields: [
        s("ksztalt_dzialki", "Kształt działki", ["Prostokątna", "Kwadratowa", "Trapez", "Wielokąt", "Nieregularna", "Wąska i długa", "Trójkątna"]),
        t("wymiary_dzialki", "Wymiary", { placeholder: "25 x 48 m" }),
        n("szerokosc_dzialki_m", "Szerokość od drogi", { unit: "m", placeholder: "25" }),
        s("uksztaltowanie", "Ukształtowanie terenu", ["Płaska", "Lekko nachylona", "Stok", "Tarasowa", "Zagłębiona", "Nierówna"]),
        s("rodzaj_gruntu", "Rodzaj gruntu", ["Piaszczysty", "Gliniasty", "Próchniczy", "Kamienisty", "Torfowy", "Podmokły", "Nasyp"]),
        s("klasa_gruntu", "Klasa gruntu rolnego", ["I", "II", "IIIa", "IIIb", "IVa", "IVb", "V", "VI", "Nie dotyczy"]),
        s("zadrzewienie", "Zadrzewienie", ["Brak", "Pojedyncze drzewa", "Częściowo zadrzewiona", "Zadrzewiona", "Las"]),
        s("uzbrojenie", "Uzbrojenie", ["Pełne", "Częściowe", "Brak"]),
        s("ogrodzenie", "Ogrodzenie", ["Brak", "Siatka", "Panele", "Murowane", "Częściowe"]),
        m("zabudowania", "Zabudowania na działce", ["Brak", "Dom do rozbiórki", "Dom do remontu", "Budynek gospodarczy", "Stodoła", "Fundamenty", "Wiata", "Altana", "Studnia"]),
        b("odrolniona", "Działka odrolniona"),
        b("wycinka_zgoda", "Zgoda na wycinkę drzew"),
      ],
    },
    {
      title: "Media i przyłącza",
      icon: "media",
      hint: "Przy działkach najważniejsze jest, czy media są w granicy, czy dopiero w drodze.",
      fields: [
        s("media_prad", "Prąd", ["W granicy działki", "Na działce", "W drodze", "Brak"]),
        s("media_gaz", "Gaz", ["W granicy działki", "Na działce", "W drodze", "Brak"]),
        s("media_woda", "Woda", ["W granicy działki", "Na działce", "Studnia", "W drodze", "Brak"]),
        s("media_kanalizacja", "Kanalizacja", ["W granicy działki", "Na działce", "Szambo", "Oczyszczalnia", "W drodze", "Brak"]),
        s("media_internet", "Internet", ["Światłowód", "Kablowy", "Radiowy", "Brak"]),
        n("media_moc_kw", "Moc przyłącza", { unit: "kW" }),
        b("media_sila", "Siła (3-fazowa)"),
        t("media_uwagi", "Uwagi o mediach", { placeholder: "Prąd 12 kW w skrzynce przy bramie", wide: true }),
      ],
    },
    {
      title: "Dojazd",
      icon: "dojazd",
      fields: [
        s("droga_dojazdowa", "Droga dojazdowa", DROGA),
        n("szerokosc_drogi_m", "Szerokość drogi", { unit: "m", placeholder: "6" }),
        s("dostep_do_drogi", "Dostęp do drogi publicznej", ["Bezpośredni", "Przez służebność", "Przez drogę wewnętrzną", "Brak - do ustalenia"]),
        s("wlasciciel_drogi", "Właściciel drogi", ["Gmina", "Powiat", "Skarb Państwa", "Współwłasność", "Prywatny"]),
        b("udzial_w_drodze", "Udział w drodze w cenie"),
        n("odleglosc_droga_glowna_km", "Odległość od drogi głównej", { unit: "km" }),
      ],
    },
    sekcjaOtoczenie(["Jezioro", "Morze", "Góry", "Pola uprawne", "Zabudowa jednorodzinna", "Zabudowa wielorodzinna", "Strefa przemysłowa", "Linia wysokiego napięcia", "Tory kolejowe", "Gazociąg"], true),
    {
      title: "Koszty i opłaty",
      icon: "koszty",
      fields: [
        n("podatek_nieruchomosc_pln", "Podatek od nieruchomości", { unit: "zł/rok" }),
        n("oplata_uzytkowanie_pln", "Opłata za użytkowanie wieczyste", { unit: "zł/rok" }),
        n("cena_za_m2", "Cena za m²", { unit: "zł/m²", hint: "Policzymy sami, jeśli zostawisz puste" }),
      ],
    },
    sekcjaNajem([s("najem_cel", "Cel dzierżawy", ["Rolniczy", "Handlowy", "Reklama", "Parking", "Magazynowanie", "Inny"])]),
    sekcjaPrawne([
      b("dzierzawa_trwa", "Działka jest w dzierżawie"),
      d("dzierzawa_do", "Dzierżawa do"),
      b("kuz", "Wpis do rejestru zabytków lub ochrona konserwatorska"),
      b("obszar_natura2000", "Obszar Natura 2000 lub ochrona przyrody"),
      b("strefa_zalewowa", "Strefa zalewowa"),
    ]),
  ],
};

// ── LOKAL / KOMERCJA ────────────────────────────────────────────────────
const LOKAL: TypeSchema = {
  features: true,
  sections: [
    {
      title: "Podstawowe",
      icon: "podstawy",
      open: true,
      fields: [
        n("price", "Cena", { unit: "zł", column: true, placeholder: "890000" }),
        n("cena_za_m2_mc", "Stawka najmu za m²", { unit: "zł/m²/mc", only: "wynajem", placeholder: "65" }),
        area("area", "Powierzchnia całkowita", { column: true, placeholder: "120" }),
        area("pow_biurowa_m2", "Powierzchnia biurowa"),
        area("pow_handlowa_m2", "Powierzchnia handlowa"),
        area("pow_magazynowa_m2", "Powierzchnia magazynowa"),
        area("pow_socjalna_m2", "Powierzchnia socjalna"),
        n("pomieszczenia_liczba", "Liczba pomieszczeń", { placeholder: "4" }),
        n("floor", "Piętro", { column: true, hint: "0 = parter", placeholder: "0" }),
        n("floors_total", "Pięter w budynku", { column: true }),
      ],
    },
    {
      title: "Przeznaczenie lokalu",
      icon: "przeznaczenie",
      open: true,
      fields: [
        s("rodzaj_lokalu", "Rodzaj lokalu", [
          "Biurowy", "Handlowy", "Usługowy", "Gastronomiczny", "Magazynowy", "Produkcyjny",
          "Medyczny", "Gabinet", "Apteka", "Salon beauty lub fryzjerski", "Fitness lub siłownia",
          "Przedszkole lub żłobek", "Hotelowy", "Warsztat", "Salon samochodowy", "Biuro z magazynem", "Coworking", "Inny",
        ]),
        t("aktualne_wykorzystanie", "Obecnie działa jako", { placeholder: "Kawiarnia" }),
        m("mozliwe_przeznaczenie", "Możliwe przeznaczenie", [
          "Biuro", "Handel", "Usługi", "Gastronomia", "Medycyna", "Beauty", "Edukacja",
          "Fitness", "Magazyn", "Produkcja lekka", "Mieszkanie po przekształceniu",
        ]),
        b("dzialalnosc_gastro", "Zgoda na gastronomię"),
        b("koncesja_alkohol", "Koncesja na alkohol"),
        b("wyciag_gastro", "Wyciąg lub kanał wentylacyjny do gastronomii"),
      ],
    },
    {
      title: "Opis budynku",
      icon: "budynek",
      fields: [
        t("nazwa_budynku", "Nazwa budynku", { placeholder: "Kraków Business Park" }),
        s("building_type", "Rodzaj budynku", [
          "Budynek biurowy", "Biurowo-handlowy", "Mieszkalno-usługowy", "Kamienica", "Apartamentowiec",
          "Apartamentowo-handlowy", "Blok", "Niski blok", "Wysoki blok", "Plomba", "Pawilon",
          "Centrum handlowe", "Galeria handlowa", "Magazynowo-biurowy", "Hala", "Hotel", "Loft", "Willa", "Dom", "Garaż",
        ], { column: true }),
        s("klasa_budynku", "Klasa budynku", ["A+", "A", "B+", "B", "C", "D", "Nie określono"]),
        s("stan_budynku", "Stan budynku", STAN_BUD),
        n("year_built", "Rok budowy", { column: true }),
        d("ostatni_remont", "Ostatni remont"),
        s("winda", "Winda", ["Tak", "Nie", "Dwie i więcej", "Winda towarowa"]),
        m("certyfikaty", "Certyfikaty budynku", ["BREEAM", "LEED", "WELL", "Brak"]),
        b("recepcja_budynku", "Recepcja w budynku"),
      ],
    },
    {
      title: "Standard lokalu",
      icon: "instalacje",
      fields: [
        s("condition_std", "Stan lokalu", [
          "Gotowy do wejścia", "Wysoki standard", "Po remoncie", "Do odświeżenia", "Do remontu",
          "Stan deweloperski", "Shell and core", "Do wykończenia pod najemcę",
        ], { column: true }),
        n("wysokosc_pomieszczen_m", "Wysokość pomieszczeń", { unit: "m", placeholder: "3,2" }),
        m("standard", "Wyposażenie i instalacje", [
          "Klimatyzacja", "Wentylacja mechaniczna", "Światłowód", "Okablowanie strukturalne",
          "Okablowanie telefoniczne", "Okablowanie elektryczne", "Sieć komputerowa",
          "Podwieszane sufity", "Podnoszone podłogi", "Wykładzina", "Recepcja", "Kontrola dostępu",
          "Ochrona", "Monitoring", "Alarm", "Czujniki dymu", "Tryskacze", "Okna otwieralne",
          "Rolety lub żaluzje", "Zaplecze socjalne", "Aneks kuchenny", "Szatnia", "Serwerownia",
          "Sala konferencyjna", "Przystosowanie dla osób z niepełnosprawnością",
        ]),
        n("wc_liczba", "Liczba toalet", { placeholder: "2" }),
        s("heating", "Ogrzewanie", OGRZEWANIE, { column: true }),
        s("podlogi", "Podłogi", PODLOGI),
        b("osobne_wejscie", "Oddzielne wejście"),
        b("moznosc_podzialu", "Możliwość podziału lokalu"),
        n("min_pow_najmu_m2", "Minimalna powierzchnia do wynajęcia", { unit: "m²", only: "wynajem" }),
      ],
    },
    {
      title: "Ekspozycja i handel",
      icon: "handel",
      fields: [
        n("witryna_szerokosc_m", "Szerokość witryny", { unit: "m", placeholder: "6" }),
        n("witryny_liczba", "Liczba witryn"),
        s("lokalizacja_handlowa", "Lokalizacja", [
          "Przy głównej ulicy", "Przy ulicy lokalnej", "W centrum handlowym", "W pasażu",
          "W podwórzu", "Na osiedlu", "Przy rynku", "Przy drodze wylotowej", "Strefa przemysłowa",
        ]),
        s("ruch_pieszy", "Natężenie ruchu pieszego", ["Bardzo duże", "Duże", "Średnie", "Małe"]),
        b("reklama_zewnetrzna", "Możliwość reklamy zewnętrznej"),
        b("szyld", "Miejsce na szyld"),
        b("ogrodek_gastro", "Możliwość ogródka gastronomicznego"),
        b("witryna_rolety", "Rolety antywłamaniowe na witrynie"),
      ],
    },
    {
      title: "Parking i dostawy",
      icon: "parking",
      fields: [
        s("parking_rodzaj", "Parking", PARKING),
        n("parking_liczba", "Liczba miejsc", { placeholder: "4" }),
        n("parking_cena_pln", "Cena miejsca", { unit: "zł/mc" }),
        b("parking_dla_klientow", "Parking dla klientów"),
        b("strefa_rozladunku", "Strefa rozładunku"),
        b("dojazd_dostawczy", "Dojazd samochodem dostawczym"),
        s("strefa_platnego_parkowania", "Strefa płatnego parkowania", ["Tak", "Nie"]),
      ],
    },
    sekcjaMedia(),
    {
      title: "Koszty i opłaty",
      icon: "koszty",
      fields: [
        n("oplata_eksploatacyjna", "Opłata eksploatacyjna", { unit: "zł/m²/mc", placeholder: "18" }),
        n("admin_fee_pln", "Czynsz administracyjny", { unit: "zł/mc", column: true }),
        n("koszty_media_pln", "Media", { unit: "zł/mc" }),
        n("podatek_nieruchomosc_pln", "Podatek od nieruchomości", { unit: "zł/rok" }),
        n("deposit_pln", "Kaucja", { unit: "zł", column: true, only: "wynajem" }),
      ],
    },
    sekcjaNajem([
      t("najem_okres_max", "Maksymalny okres najmu"),
      s("najem_indeksacja", "Indeksacja czynszu", ["Brak", "GUS - inflacja", "HICP", "Stała stawka roczna"]),
      s("fit_out", "Wykończenie pod najemcę", ["Po stronie wynajmującego", "Po stronie najemcy", "Do negocjacji", "Budżet od wynajmującego"]),
      t("wakacje_czynszowe", "Wakacje czynszowe", { placeholder: "2 miesiące" }),
    ]),
    sekcjaOtoczenie(),
    sekcjaBezpieczenstwo(),
    sekcjaPrawne(),
    sekcjaEnergia(),
  ],
};

// ── MAGAZYN / HALA ──────────────────────────────────────────────────────
const MAGAZYN: TypeSchema = {
  features: false,
  sections: [
    {
      title: "Podstawowe",
      icon: "podstawy",
      open: true,
      fields: [
        n("price", "Cena", { unit: "zł", column: true }),
        n("cena_za_m2_mc", "Stawka najmu za m²", { unit: "zł/m²/mc", only: "wynajem", placeholder: "22" }),
        area("area", "Powierzchnia całkowita", { column: true, placeholder: "2000" }),
        area("pow_magazynowa_m2", "Powierzchnia magazynowa"),
        area("pow_biurowa_m2", "Powierzchnia biurowa"),
        area("pow_socjalna_m2", "Powierzchnia socjalna"),
        area("pow_produkcyjna_m2", "Powierzchnia produkcyjna"),
        area("plot_area_m2", "Powierzchnia działki", { column: true }),
        n("year_built", "Rok budowy", { column: true }),
      ],
    },
    {
      title: "Parametry techniczne",
      icon: "technika",
      open: true,
      fields: [
        n("wysokosc_w_swietle_m", "Wysokość w świetle", { unit: "m", placeholder: "10" }),
        n("wysokosc_pod_suwnica_m", "Wysokość pod suwnicą", { unit: "m" }),
        n("nosnosc_posadzki", "Nośność posadzki", { unit: "kg/m²", placeholder: "5000" }),
        s("rodzaj_posadzki", "Rodzaj posadzki", ["Beton zbrojony", "Posadzka przemysłowa", "Posadzka antyścieralna", "Epoksydowa", "Utwardzona", "Kostka", "Gruntowa"]),
        s("konstrukcja", "Konstrukcja", ["Stalowa", "Żelbetowa", "Murowana", "Prefabrykowana", "Blaszana", "Namiotowa", "Mieszana"]),
        t("siatka_slupow", "Siatka słupów", { placeholder: "12 x 24 m" }),
        s("dach_pokrycie", "Pokrycie dachu", ["Płyta warstwowa", "Membrana PVC", "Papa", "Blacha trapezowa", "Blachodachówka", "Eternit"]),
        b("swietliki", "Świetliki dachowe"),
        b("klapy_dymowe", "Klapy dymowe"),
        b("ocieplona", "Hala ocieplona"),
        n("kondygnacje", "Liczba kondygnacji"),
      ],
    },
    {
      title: "Bramy, doki i plac",
      icon: "logistyka",
      open: true,
      fields: [
        n("bramy_liczba", "Liczba bram wjazdowych", { placeholder: "4" }),
        s("bramy_rodzaj", "Rodzaj bram", ["Segmentowe", "Przesuwne", "Roletowe", "Dwuskrzydłowe", "Szybkobieżne"]),
        t("bramy_wymiary", "Wymiary bram", { placeholder: "4 x 4,5 m" }),
        n("doki_liczba", "Liczba doków przeładunkowych", { placeholder: "6" }),
        s("rampa", "Rampa", ["Brak", "Rampa najazdowa", "Poziom zero", "Rampa i poziom zero", "Rampa ruchoma"]),
        n("wysokosc_rampy_m", "Wysokość rampy", { unit: "m", placeholder: "1,2" }),
        area("plac_manewrowy_m2", "Plac manewrowy"),
        s("plac_nawierzchnia", "Nawierzchnia placu", ["Beton", "Asfalt", "Kostka", "Płyty", "Utwardzona", "Gruntowa"]),
        b("waga_samochodowa", "Waga samochodowa"),
        b("dostep_tir", "Dojazd dla TIR"),
      ],
    },
    {
      title: "Instalacje",
      icon: "instalacje",
      fields: [
        s("ogrzewanie_hali", "Ogrzewanie hali", ["Nagrzewnice gazowe", "Nagrzewnice wodne", "Promienniki", "Podłogowe", "Pompa ciepła", "Brak"]),
        n("temperatura_utrzymywana", "Utrzymywana temperatura", { unit: "°C", placeholder: "16" }),
        s("chlodnia", "Chłodnia lub mroźnia", ["Brak", "Chłodnia", "Mroźnia", "Chłodnia i mroźnia"]),
        t("chlodnia_temperatura", "Temperatura chłodni", { placeholder: "od -22 do +4 °C" }),
        s("oswietlenie", "Oświetlenie", ["LED", "Przemysłowe metalohalogenkowe", "Świetlówki", "Mieszane"]),
        b("sprezone_powietrze", "Sprężone powietrze"),
        m("ppoz", "Ochrona przeciwpożarowa", ["Tryskacze (SUG)", "Hydranty wewnętrzne", "Hydranty zewnętrzne", "Oddymianie", "SSP - system sygnalizacji pożaru", "Zbiornik ppoż", "Gaśnice"]),
        b("wentylacja", "Wentylacja mechaniczna"),
        n("suwnica_t", "Suwnica - nośność", { unit: "t", placeholder: "5" }),
        n("miejsca_paletowe", "Miejsca paletowe w regałach", { placeholder: "2400" }),
        b("regaly_w_cenie", "Regały w cenie"),
      ],
    },
    {
      title: "Dojazd i lokalizacja",
      icon: "dojazd",
      fields: [
        n("odleglosc_autostrada_km", "Odległość od autostrady lub S", { unit: "km", placeholder: "3" }),
        n("odleglosc_dk_km", "Odległość od drogi krajowej", { unit: "km" }),
        n("odleglosc_centrum_km", "Odległość od centrum miasta", { unit: "km" }),
        b("bocznica_kolejowa", "Bocznica kolejowa"),
        n("parking_osobowe", "Parking - miejsca osobowe", { placeholder: "30" }),
        n("parking_tir", "Parking - miejsca TIR", { placeholder: "6" }),
        s("droga_dojazdowa", "Droga dojazdowa", DROGA),
      ],
    },
    sekcjaMedia(true),
    {
      title: "Koszty i opłaty",
      icon: "koszty",
      fields: [
        n("oplata_eksploatacyjna", "Opłata eksploatacyjna", { unit: "zł/m²/mc", placeholder: "4" }),
        n("koszty_media_pln", "Media", { unit: "zł/mc" }),
        n("podatek_nieruchomosc_pln", "Podatek od nieruchomości", { unit: "zł/rok" }),
        n("deposit_pln", "Kaucja", { unit: "zł", column: true, only: "wynajem" }),
      ],
    },
    sekcjaNajem([
      n("min_pow_najmu_m2", "Minimalna powierzchnia do wynajęcia", { unit: "m²" }),
      s("najem_indeksacja", "Indeksacja czynszu", ["Brak", "GUS - inflacja", "HICP", "Stała stawka roczna"]),
    ]),
    sekcjaBezpieczenstwo(),
    sekcjaPrawne(),
    sekcjaEnergia(),
  ],
};

// ── OBIEKT ──────────────────────────────────────────────────────────────
const OBIEKT: TypeSchema = {
  features: true,
  sections: [
    {
      title: "Podstawowe",
      icon: "podstawy",
      open: true,
      fields: [
        n("price", "Cena", { unit: "zł", column: true }),
        area("area", "Powierzchnia użytkowa", { column: true }),
        area("pow_calkowita_m2", "Powierzchnia całkowita"),
        area("pow_zabudowy_m2", "Powierzchnia zabudowy"),
        area("plot_area_m2", "Powierzchnia działki", { column: true }),
        n("kondygnacje", "Liczba kondygnacji"),
        n("year_built", "Rok budowy", { column: true }),
      ],
    },
    {
      title: "Rodzaj obiektu",
      icon: "przeznaczenie",
      open: true,
      fields: [
        s("rodzaj_obiektu", "Rodzaj obiektu", [
          "Hotel", "Pensjonat", "Motel", "Hostel", "Apartamenty na wynajem", "Ośrodek wypoczynkowy",
          "Restauracja", "Obiekt gastronomiczny", "Dom opieki", "Klinika lub przychodnia",
          "Przedszkole lub szkoła", "Akademik", "Obiekt sportowy", "Stacja paliw", "Myjnia",
          "Warsztat", "Zakład produkcyjny", "Pawilon handlowy", "Centrum handlowe", "Biurowiec",
          "Kamienica pod inwestycję", "Obiekt zabytkowy", "Obiekt sakralny", "Gospodarstwo rolne",
          "Stajnia lub ośrodek jeździecki", "Ferma", "Kemping", "Inny",
        ]),
        s("obiekt_dziala", "Obiekt obecnie działa", ["Tak, z obsadą", "Tak, sezonowo", "Nie, zamknięty", "Nowy, przed otwarciem"]),
        b("wyposazenie_w_cenie", "Wyposażenie w cenie"),
        b("pracownicy_przejmowani", "Możliwość przejęcia zespołu"),
        m("koncesje", "Koncesje i pozwolenia", ["Alkohol", "Sanepid", "Hotelowa kategoryzacja", "Opieka - zezwolenie wojewody", "Placówka oświatowa", "Środowiskowe", "Brak"]),
      ],
    },
    {
      title: "Obiekt noclegowy i gastronomiczny",
      icon: "noclegi",
      hint: "Uzupełnij, jeśli obiekt przyjmuje gości.",
      fields: [
        n("pokoi_liczba", "Liczba pokoi", { placeholder: "24" }),
        n("miejsc_noclegowych", "Liczba miejsc noclegowych", { placeholder: "52" }),
        n("apartamentow_liczba", "Liczba apartamentów"),
        s("kategoria_gwiazdki", "Kategoria", ["Bez kategorii", "1 gwiazdka", "2 gwiazdki", "3 gwiazdki", "4 gwiazdki", "5 gwiazdek"]),
        n("restauracja_miejsca", "Restauracja - liczba miejsc", { placeholder: "80" }),
        n("sale_konferencyjne", "Liczba sal konferencyjnych"),
        n("sale_pojemnosc", "Pojemność największej sali", { placeholder: "120" }),
        m("udogodnienia_obiektu", "Udogodnienia", [
          "Basen", "Basen zewnętrzny", "SPA", "Sauna", "Jacuzzi", "Siłownia", "Kręgielnia",
          "Plac zabaw", "Boisko", "Kort tenisowy", "Wypożyczalnia sprzętu", "Grota solna",
          "Bar", "Kawiarnia", "Ogród", "Taras widokowy", "Winda", "Pokoje dla osób z niepełnosprawnością",
        ]),
        n("oblozenie_proc", "Średnie obłożenie", { unit: "%", placeholder: "62" }),
      ],
    },
    {
      title: "Stan i konstrukcja",
      icon: "zabudowa",
      fields: [
        s("stan_budynku", "Stan budynku", STAN_BUD),
        s("condition_std", "Stan wykończenia", ["Do wprowadzenia", "Wysoki standard", "Po remoncie", "Do odświeżenia", "Do remontu", "Stan surowy", "W budowie"], { column: true }),
        s("material_scian", "Materiał ścian", ["Cegła", "Pustak", "Beton komórkowy", "Żelbet", "Prefabrykat", "Drewno", "Kamień", "Konstrukcja stalowa"]),
        s("dach_pokrycie", "Pokrycie dachu", ["Dachówka", "Blachodachówka", "Blacha", "Papa", "Membrana", "Gont", "Łupek", "Eternit"]),
        d("ostatni_remont", "Ostatni remont"),
        s("zabytek", "Ochrona konserwatorska", ["Brak", "Gminna ewidencja zabytków", "Rejestr zabytków", "Strefa ochrony konserwatorskiej"]),
        s("winda", "Winda", ["Tak", "Nie", "Dwie i więcej", "Winda towarowa"]),
      ],
    },
    {
      title: "Ekonomia obiektu",
      icon: "ekonomia",
      hint: "Kupujący komercję liczy zwrot, nie metry. Te liczby najbardziej przyspieszają decyzję.",
      fields: [
        n("przychod_rok_pln", "Przychód roczny", { unit: "zł" }),
        n("koszty_rok_pln", "Koszty roczne", { unit: "zł" }),
        n("noi_pln", "Dochód operacyjny netto (NOI)", { unit: "zł/rok" }),
        n("yield_proc", "Stopa kapitalizacji", { unit: "%", placeholder: "7,5" }),
        n("najemcy_liczba", "Liczba najemców"),
        t("najemcy_umowy_do", "Umowy najmu do", { placeholder: "2029, średnio 4 lata" }),
        area("pow_wynajeta_m2", "Powierzchnia wynajęta"),
        n("pustostany_proc", "Pustostany", { unit: "%" }),
        t("potencjal", "Potencjał po modernizacji", { wide: true, placeholder: "Adaptacja poddasza na 6 apartamentów" }),
      ],
    },
    sekcjaParking(),
    sekcjaMedia(true),
    sekcjaKoszty(),
    sekcjaNajem(),
    sekcjaOtoczenie(["Jezioro", "Morze", "Góry", "Szlak turystyczny", "Uzdrowisko", "Strefa przemysłowa"]),
    sekcjaBezpieczenstwo(),
    sekcjaPrawne(),
    sekcjaEnergia(),
  ],
};

// ── POKÓJ ───────────────────────────────────────────────────────────────
const POKOJ: TypeSchema = {
  features: true,
  sections: [
    {
      title: "Podstawowe",
      icon: "podstawy",
      open: true,
      fields: [
        n("price", "Cena najmu", { unit: "zł/mc", column: true, placeholder: "1400" }),
        area("area", "Powierzchnia pokoju", { column: true, placeholder: "14" }),
        n("miejsc_w_pokoju", "Liczba miejsc w pokoju", { placeholder: "1" }),
        n("floor", "Piętro", { column: true, hint: "0 = parter" }),
        n("floors_total", "Pięter w budynku", { column: true }),
      ],
    },
    {
      title: "Mieszkanie, w którym jest pokój",
      icon: "pokoje",
      open: true,
      fields: [
        area("pow_mieszkania_m2", "Powierzchnia całego mieszkania", { placeholder: "62" }),
        n("rooms", "Liczba wszystkich pokoi", { column: true, placeholder: "3" }),
        n("lazienki", "Liczba łazienek"),
        s("kuchnia", "Kuchnia", ["Wspólna osobna", "Wspólny aneks", "Osobna dla najemcy"]),
        s("building_type", "Rodzaj budynku", ["Blok", "Kamienica", "Apartamentowiec", "Dom", "Akademik"], { column: true }),
        s("winda", "Winda", ["Tak", "Nie"]),
        s("condition_std", "Stan mieszkania", ["Do wprowadzenia", "Wysoki standard", "Po remoncie", "Do odświeżenia"], { column: true }),
      ],
    },
    {
      title: "Wyposażenie pokoju",
      icon: "pokoje",
      open: true,
      fields: [
        m("pokoj_wyposazenie", "W pokoju", [
          "Łóżko pojedyncze", "Łóżko podwójne", "Łóżko piętrowe", "Materac", "Biurko", "Krzesło",
          "Szafa", "Komoda", "Regał", "Lampka", "Telewizor", "Lustro", "Zasłony lub rolety",
        ]),
        b("wlasna_lazienka", "Własna łazienka"),
        b("balkon_w_pokoju", "Balkon w pokoju"),
        b("zamykany_na_klucz", "Pokój zamykany na klucz"),
        s("okno_na", "Okno na", ["Podwórze", "Ulicę", "Ogród", "Zieleń", "Podwórze studnię"]),
        b("internet_w_cenie", "Internet w cenie"),
        m("wspolne", "Do wspólnego użytku", ["Salon", "Pralka", "Zmywarka", "Suszarnia", "Balkon", "Taras", "Piwnica", "Rowerownia", "Miejsce parkingowe"]),
      ],
    },
    {
      title: "Współlokatorzy",
      icon: "ludzie",
      fields: [
        n("wspollokatorzy_liczba", "Liczba współlokatorów", { placeholder: "2" }),
        s("wspollokatorzy_plec", "Płeć współlokatorów", ["Mieszana", "Kobiety", "Mężczyźni", "Nikt jeszcze nie mieszka"]),
        s("wspollokatorzy_kto", "Kto mieszka", ["Studenci", "Osoby pracujące", "Mieszane", "Rodzina"]),
        t("wspollokatorzy_wiek", "Wiek współlokatorów", { placeholder: "23-27 lat" }),
        s("wlasciciel_mieszka", "Właściciel mieszka w lokalu", ["Nie", "Tak", "Czasem"]),
      ],
    },
    {
      title: "Warunki najmu",
      icon: "najem",
      open: true,
      fields: [
        d("available_from", "Dostępne od", { column: true }),
        n("deposit_pln", "Kaucja", { unit: "zł", column: true, placeholder: "1400" }),
        s("rachunki", "Rachunki", ["W cenie", "Doliczane osobno", "Ryczałt", "Podział po równo"]),
        n("rachunki_pln", "Rachunki - kwota", { unit: "zł/mc", placeholder: "250" }),
        n("admin_fee_pln", "Czynsz administracyjny", { unit: "zł/mc", column: true }),
        s("najem_okres_min", "Minimalny okres najmu", ["Dowolny", "1 miesiąc", "3 miesiące", "Rok akademicki", "6 miesięcy", "12 miesięcy"]),
        m("najem_dla", "Preferencje", ["Bez preferencji", "Student", "Osoba pracująca", "Kobieta", "Mężczyzna", "Para", "Osoba niepaląca", "Cicha osoba"]),
        s("najem_zwierzeta", "Zwierzęta", ["Dozwolone", "Do ustalenia", "Niedozwolone"]),
        s("najem_palenie", "Palenie", ["Dozwolone", "Tylko na balkonie", "Niedozwolone"]),
        s("imprezy", "Imprezy", ["Dozwolone", "Sporadycznie", "Niedozwolone"]),
        t("cisza_nocna", "Cisza nocna", { placeholder: "22:00-6:00" }),
      ],
    },
    {
      title: "Okolica",
      icon: "otoczenie",
      fields: [
        m("otoczenie", "W pobliżu", [...OTOCZENIE]),
        t("uczelnia", "Uczelnia w pobliżu", { placeholder: "AGH - 10 min tramwajem" }),
        n("odleglosc_centrum_km", "Odległość od centrum", { unit: "km" }),
        t("dzielnica", "Dzielnica", { placeholder: "Krowodrza" }),
      ],
    },
    sekcjaBezpieczenstwo(),
  ],
};

// ── INWESTYCJA ──────────────────────────────────────────────────────────
const INWESTYCJA: TypeSchema = {
  features: false,
  sections: [
    {
      title: "Podstawowe",
      icon: "podstawy",
      open: true,
      fields: [
        t("nazwa_inwestycji", "Nazwa inwestycji", { placeholder: "Osiedle Zielone Tarasy", wide: true }),
        t("deweloper", "Deweloper", { placeholder: "Nazwa spółki" }),
        n("price", "Cena od", { unit: "zł", column: true, placeholder: "450000" }),
        n("cena_do_pln", "Cena do", { unit: "zł", placeholder: "1200000" }),
        n("cena_m2_od", "Cena za m² od", { unit: "zł/m²", placeholder: "12500" }),
        n("cena_m2_do", "Cena za m² do", { unit: "zł/m²" }),
        n("lokali_liczba", "Liczba lokali", { placeholder: "120" }),
        n("lokali_dostepnych", "Dostępnych lokali", { placeholder: "34" }),
        n("budynkow_liczba", "Liczba budynków", { placeholder: "3" }),
        n("etapow_liczba", "Liczba etapów"),
      ],
    },
    {
      title: "Oferta lokali",
      icon: "pokoje",
      open: true,
      fields: [
        area("area", "Metraż od", { column: true, placeholder: "32" }),
        area("metraz_do_m2", "Metraż do", { placeholder: "95" }),
        n("rooms", "Pokoi od", { column: true, placeholder: "1" }),
        n("pokoi_do", "Pokoi do", { placeholder: "4" }),
        s("rodzaj_zabudowy", "Rodzaj zabudowy", ["Wielorodzinna", "Apartamentowa", "Jednorodzinna", "Szeregowa", "Bliźniaki", "Mieszana", "Loftowa", "Condohotel", "Apartamenty inwestycyjne"]),
        s("standard_wykonczenia", "Standard wydania", ["Stan deweloperski", "Pod klucz", "Wykończenie w opcji", "Do wyboru"]),
        n("floors_total", "Liczba kondygnacji", { column: true }),
        m("typy_lokali", "Typy lokali", ["Mieszkania", "Apartamenty", "Lokale usługowe", "Domy", "Segmenty", "Penthouse", "Mieszkania z ogródkiem", "Kawalerki"]),
      ],
    },
    {
      title: "Terminy i etap",
      icon: "terminy",
      open: true,
      fields: [
        s("etap_realizacji", "Etap realizacji", ["Planowana", "W przygotowaniu", "W budowie", "Na ukończeniu", "Gotowa do odbioru", "Zakończona"]),
        d("start_budowy", "Rozpoczęcie budowy"),
        d("termin_oddania", "Planowane oddanie"),
        d("termin_przeniesienia", "Przeniesienie własności"),
        s("pozwolenie_budowa", "Pozwolenie na budowę", ["Jest", "W toku", "Brak"]),
        s("pozwolenie_uzytkowanie", "Pozwolenie na użytkowanie", ["Jest", "W toku", "Brak"]),
        n("year_built", "Rok oddania", { column: true, placeholder: "2027" }),
      ],
    },
    {
      title: "Osiedle i budynek",
      icon: "budynek",
      fields: [
        s("winda", "Winda", ["Tak", "Nie", "Dwie i więcej"]),
        n("garaz_miejsca", "Miejsca w garażu podziemnym", { placeholder: "140" }),
        n("parking_cena_pln", "Cena miejsca postojowego", { unit: "zł", placeholder: "45000" }),
        n("komorka_cena_pln", "Cena komórki lokatorskiej", { unit: "zł", placeholder: "18000" }),
        m("osiedle_udogodnienia", "Na osiedlu", [
          "Teren zamknięty", "Ochrona", "Monitoring", "Kontrola dostępu", "Plac zabaw", "Siłownia",
          "Sala fitness", "Rowerownia", "Wózkownia", "Concierge", "Paczkomat", "Myjnia dla psów",
          "Strefa coworkingowa", "Zieleń wewnętrzna", "Fontanna", "Ładowarki do auta elektrycznych", "Sauna", "Basen",
        ]),
        area("zielen_m2", "Powierzchnia zieleni"),
        s("heating", "Ogrzewanie", OGRZEWANIE, { column: true }),
        b("rekuperacja", "Rekuperacja"),
        b("smart_home", "Smart home w standardzie"),
      ],
    },
    {
      title: "Finansowanie i zakup",
      icon: "koszty",
      fields: [
        n("wklad_wlasny_proc", "Wymagany wkład własny", { unit: "%", placeholder: "10" }),
        t("harmonogram_plat", "Harmonogram płatności", { placeholder: "20 / 30 / 30 / 20", wide: true }),
        s("rachunek_powierniczy", "Rachunek powierniczy", ["Otwarty", "Otwarty z gwarancją", "Zamknięty", "Brak"]),
        b("kredytowanie", "Inwestycja kredytowana przez banki"),
        t("gwarancja", "Gwarancja dewelopera", { placeholder: "5 lat na konstrukcję" }),
        b("prospekt", "Prospekt informacyjny dostępny"),
        n("prowizja_proc", "Prowizja od dewelopera", { unit: "%", placeholder: "3" }),
        s("vat", "VAT", ["Cena brutto z 8% VAT", "Cena brutto z 23% VAT", "Cena netto + VAT"]),
      ],
    },
    sekcjaMedia(),
    sekcjaOtoczenie(),
    {
      title: "Stan prawny",
      icon: "prawne",
      fields: [
        s("ownership", "Forma własności", ["Pełna własność (KW)", "Użytkowanie wieczyste", "Własność z udziałem w gruncie"], { column: true }),
        s("market", "Rynek", ["Pierwotny", "Wtórny"], { column: true }),
        t("kw_numer", "Numer księgi wieczystej"),
        t("deweloper_nip", "NIP dewelopera"),
        s("umowa_typ", "Umowa pośrednictwa", UMOWA),
      ],
    },
    sekcjaEnergia(),
  ],
};

// ── BUDYNEK (cała kamienica, budynek na sprzedaż) ───────────────────────
const BUDYNEK: TypeSchema = {
  features: true,
  sections: [
    {
      title: "Podstawowe",
      icon: "podstawy",
      open: true,
      fields: [
        n("price", "Cena", { unit: "zł", column: true }),
        area("area", "Powierzchnia użytkowa (PUM)", { column: true }),
        area("pow_calkowita_m2", "Powierzchnia całkowita"),
        area("pow_zabudowy_m2", "Powierzchnia zabudowy"),
        area("plot_area_m2", "Powierzchnia działki", { column: true }),
        n("kondygnacje", "Liczba kondygnacji", { placeholder: "4" }),
        n("lokali_liczba", "Liczba lokali", { placeholder: "12" }),
        n("year_built", "Rok budowy", { column: true, placeholder: "1908" }),
      ],
    },
    {
      title: "Rodzaj budynku",
      icon: "budynek",
      open: true,
      fields: [
        s("building_type", "Rodzaj budynku", [
          "Kamienica", "Budynek mieszkalny wielolokalowy", "Budynek biurowy", "Biurowo-usługowy",
          "Mieszkalno-usługowy", "Budynek magazynowy", "Magazynowo-biurowy", "Hotel", "Akademik",
          "Plomba", "Willa miejska", "Dom wielolokalowy", "Pawilon", "Budynek mieszany", "Loft",
        ], { column: true }),
        s("zabytek", "Ochrona konserwatorska", ["Brak", "Gminna ewidencja zabytków", "Rejestr zabytków", "Strefa ochrony konserwatorskiej"]),
        b("karta_ewidencyjna", "Karta ewidencyjna zabytku"),
      ],
    },
    {
      title: "Struktura lokali",
      icon: "pokoje",
      open: true,
      fields: [
        n("mieszkan_liczba", "Liczba mieszkań", { placeholder: "10" }),
        n("lokali_uzytkowych", "Liczba lokali użytkowych", { placeholder: "2" }),
        n("garazy_liczba", "Liczba garaży"),
        area("pow_mieszkalna_m2", "Powierzchnia mieszkalna"),
        area("pow_uzytkowa_komercja_m2", "Powierzchnia komercyjna"),
        n("wynajetych_lokali", "Lokali wynajętych", { placeholder: "9" }),
        n("pustostany_liczba", "Pustostany"),
        n("najemcy_liczba", "Liczba najemców"),
        n("lokatorzy_kwaterunkowi", "Lokatorzy kwaterunkowi", { hint: "Najem na czas nieokreślony z dawnego przydziału" }),
        n("umowy_bezterminowe", "Umowy na czas nieokreślony"),
      ],
    },
    {
      title: "Stan i konstrukcja",
      icon: "zabudowa",
      fields: [
        s("stan_budynku", "Stan budynku", STAN_BUD),
        s("condition_std", "Stan wykończenia", ["Po generalnym remoncie", "Dobry", "Do odświeżenia", "Do remontu", "Do generalnego remontu", "Stan surowy"], { column: true }),
        s("material_scian", "Materiał ścian", ["Cegła", "Cegła pełna", "Pustak", "Żelbet", "Wielka płyta", "Prefabrykat", "Kamień", "Mieszany"]),
        s("dach_pokrycie", "Pokrycie dachu", ["Dachówka", "Blachodachówka", "Blacha", "Papa", "Membrana", "Łupek", "Eternit"]),
        s("stropy", "Stropy", ["Drewniane", "Ceglane odcinkowe", "Kleina", "Żelbetowe", "Mieszane"]),
        s("elewacja", "Elewacja", ["Po renowacji", "Dobra", "Do odświeżenia", "Do renowacji", "Zabytkowa - wymaga konserwatora"]),
        s("klatka_schodowa", "Klatka schodowa", ["Po remoncie", "Dobra", "Do odświeżenia", "Do remontu", "Zabytkowa"]),
        s("winda", "Winda", ["Tak", "Nie", "Możliwość dobudowy", "Dwie i więcej"]),
        t("instalacje_lata", "Instalacje - lata wymiany", { placeholder: "Elektryka 2015, woda 2018, gaz 2005", wide: true }),
        d("ostatni_remont", "Ostatni remont"),
      ],
    },
    {
      title: "Potencjał",
      icon: "potencjal",
      fields: [
        area("poddasze_do_adaptacji_m2", "Poddasze do adaptacji"),
        b("mozliwosc_nadbudowy", "Możliwość nadbudowy"),
        b("mozliwosc_podzialu_lokali", "Możliwość podziału na lokale"),
        n("lokali_po_podziale", "Możliwa liczba lokali po zmianach"),
        b("mozliwosc_zmiany_funkcji", "Możliwość zmiany funkcji"),
        t("potencjal", "Opis potencjału", { wide: true, placeholder: "Adaptacja strychu na 4 apartamenty, podwórze pod garaże" }),
      ],
    },
    {
      title: "Ekonomia budynku",
      icon: "ekonomia",
      hint: "Budynek kupuje się pod zwrot. Te liczby sprzedają ofertę najszybciej.",
      fields: [
        n("przychod_rok_pln", "Przychód z najmu", { unit: "zł/rok" }),
        n("koszty_rok_pln", "Koszty roczne", { unit: "zł/rok" }),
        n("noi_pln", "Dochód operacyjny netto (NOI)", { unit: "zł/rok" }),
        n("yield_proc", "Stopa kapitalizacji", { unit: "%", placeholder: "6,5" }),
        n("przychod_potencjalny_pln", "Przychód po modernizacji", { unit: "zł/rok" }),
        n("fundusz_remontowy_pln", "Fundusz remontowy", { unit: "zł/mc" }),
      ],
    },
    sekcjaParking(),
    sekcjaMedia(true),
    sekcjaKoszty(),
    sekcjaOtoczenie(),
    sekcjaBezpieczenstwo(),
    sekcjaPrawne([
      b("roszczenia", "Roszczenia lub sprawy sądowe"),
      n("oplata_uzytkowanie_pln", "Opłata za użytkowanie wieczyste", { unit: "zł/rok" }),
      b("wspolnota", "Wyodrębniona wspólnota mieszkaniowa"),
    ]),
    sekcjaEnergia(),
  ],
};

// ── INNE (minimum wspólne) ──────────────────────────────────────────────
const INNE: TypeSchema = {
  features: true,
  sections: [
    {
      title: "Podstawowe",
      icon: "podstawy",
      open: true,
      fields: [
        n("price", "Cena", { unit: "zł", column: true }),
        area("area", "Powierzchnia", { column: true }),
        area("plot_area_m2", "Powierzchnia działki", { column: true }),
        n("rooms", "Liczba pomieszczeń", { column: true }),
        n("floor", "Piętro", { column: true }),
        n("floors_total", "Liczba kondygnacji", { column: true }),
        n("year_built", "Rok budowy", { column: true }),
        t("czym_jest", "Czego dotyczy oferta", { wide: true, placeholder: "Garaż podziemny, miejsce postojowe, strych do adaptacji..." }),
      ],
    },
    {
      title: "Stan i standard",
      icon: "podstawy",
      fields: [
        s("condition_std", "Stan", ["Do wprowadzenia", "Dobry", "Do odświeżenia", "Do remontu", "Stan surowy", "W budowie"], { column: true }),
        s("heating", "Ogrzewanie", OGRZEWANIE, { column: true }),
        s("building_type", "Rodzaj budynku", ["Blok", "Kamienica", "Apartamentowiec", "Dom", "Hala", "Pawilon", "Garaż", "Inny"], { column: true }),
      ],
    },
    sekcjaMedia(),
    sekcjaKoszty(),
    sekcjaNajem(),
    sekcjaOtoczenie(),
    sekcjaPrawne(),
    sekcjaEnergia(),
  ],
};

export const PROPERTY_SCHEMAS: Record<PropertyType, TypeSchema> = {
  mieszkanie: MIESZKANIE,
  dom: DOM,
  dzialka: DZIALKA,
  lokal: LOKAL,
  magazyn: MAGAZYN,
  obiekt: OBIEKT,
  pokoj: POKOJ,
  inwestycja: INWESTYCJA,
  budynek: BUDYNEK,
  inne: INNE,
};

/** Prefiks pól trzymanych w kolumnie details (jsonb). */
export const DETAIL_PREFIX = "d_";

/** Sekcje dla typu i rodzaju transakcji, z odsianiem pól tylko-najem / tylko-sprzedaż. */
export function sectionsFor(type: PropertyType, dealKind: PropertyDealKind): PropertySection[] {
  const schema = PROPERTY_SCHEMAS[type] ?? INNE;
  return schema.sections
    .filter((sec) => !sec.only || sec.only === dealKind)
    .map((sec) => ({ ...sec, fields: sec.fields.filter((f) => !f.only || f.only === dealKind) }))
    .filter((sec) => sec.fields.length > 0);
}

export function hasFeatureChips(type: PropertyType): boolean {
  return (PROPERTY_SCHEMAS[type] ?? INNE).features;
}

/** Pola spoza kolumn dla danego typu - potrzebne serwerowi, żeby wiedzieć, co przyjąć. */
export function detailFieldsFor(type: PropertyType, dealKind: PropertyDealKind): PropertyField[] {
  return sectionsFor(type, dealKind)
    .flatMap((sec) => sec.fields)
    .filter((f) => !f.column);
}

/** Etykiety i sekcje do wyświetlenia zapisanych details na karcie oferty. */
export function describeDetails(
  type: PropertyType,
  dealKind: PropertyDealKind,
  details: Record<string, unknown> | null | undefined,
): { title: string; icon: SectionIcon; items: { label: string; value: string; unit?: string }[] }[] {
  if (!details) return [];
  const out: { title: string; icon: SectionIcon; items: { label: string; value: string; unit?: string }[] }[] = [];
  for (const sec of sectionsFor(type, dealKind)) {
    const items: { label: string; value: string; unit?: string }[] = [];
    for (const f of sec.fields) {
      if (f.column) continue;
      const raw = details[f.key];
      if (raw == null || raw === "" || raw === false) continue;
      if (Array.isArray(raw)) {
        if (!raw.length) continue;
        items.push({ label: f.label, value: raw.join(", ") });
      } else if (raw === true) {
        items.push({ label: f.label, value: "Tak" });
      } else {
        items.push({ label: f.label, value: String(raw), unit: f.unit });
      }
    }
    if (items.length) out.push({ title: sec.title, icon: sec.icon, items });
  }
  return out;
}
