/**
 * Gotowe wpisy do portalu klienta, pogrupowane według etapu sprawy.
 *
 * Agent po prezentacji nie ma głowy do układania zdań, a klient chce wiedzieć,
 * co się dzieje. Treści są neutralne i bezpieczne: nie obiecują niczego,
 * nie zdradzają danych kupujących, a agent i tak może je poprawić przed wysłaniem.
 * Miejsca do uzupełnienia oznaczamy [nawiasem], żeby od razu było widać, co wpisać.
 */
export type GrupaPodpowiedzi = { nazwa: string; ikona: string; dla: "sprzedajacy" | "kupujacy" | "oba"; wpisy: string[] };

export const PODPOWIEDZI: GrupaPodpowiedzi[] = [
  {
    nazwa: "Po prezentacji",
    ikona: "🔑",
    dla: "sprzedajacy",
    wpisy: [
      "Dziś odbyła się prezentacja. Kupujący byli zainteresowani i wracają z decyzją w ciągu kilku dni.",
      "Prezentacja za nami. Klienci pytali o koszty utrzymania i stan instalacji, przekazałem odpowiedzi.",
      "Kupujący chcą obejrzeć mieszkanie drugi raz, umawiamy kolejny termin.",
      "Po prezentacji klienci potrzebują czasu do namysłu. Dam znać, gdy tylko się odezwą.",
      "Prezentacja odbyła się, ale nieruchomość nie spełniła oczekiwań tych kupujących. Szukamy dalej.",
    ],
  },
  {
    nazwa: "Klient się zastanawia",
    ikona: "🤔",
    dla: "sprzedajacy",
    wpisy: [
      "Kupujący z ostatniej prezentacji wciąż się zastanawia. Odezwę się do niego [dzień], żeby poznać decyzję.",
      "Kupujący sprawdza zdolność kredytową w banku. Czekamy na odpowiedź.",
      "Kupujący porównuje jeszcze dwie inne oferty. Podkreśliłem atuty Pana/Pani nieruchomości.",
      "Kupujący poprosił o dodatkowe informacje [czego dotyczą], przygotowuję je.",
    ],
  },
  {
    nazwa: "Negocjacje ceny",
    ikona: "💬",
    dla: "sprzedajacy",
    wpisy: [
      "Otrzymaliśmy propozycję cenową od kupującego. Zadzwonię, żeby ją omówić.",
      "Trwają negocjacje ceny. Walczę o jak najlepsze warunki dla Pana/Pani.",
      "Kupujący zaproponował [kwota] zł. Moim zdaniem warto rozważyć kontrpropozycję, porozmawiajmy.",
      "Udało się wynegocjować lepszą cenę niż pierwsza propozycja kupującego. Szczegóły przekażę telefonicznie.",
    ],
  },
  {
    nazwa: "Zainteresowanie ofertą",
    ikona: "📈",
    dla: "sprzedajacy",
    wpisy: [
      "W tym tygodniu mieliśmy [liczba] zapytań o ofertę.",
      "Umówiliśmy prezentację na [dzień, godzina].",
      "Oferta przyciąga uwagę, ale część osób pyta o cenę. Warto porozmawiać o strategii.",
      "Mniej zapytań niż na starcie. Proponuję odświeżyć ogłoszenie i zdjęcia.",
    ],
  },
  {
    nazwa: "Marketing",
    ikona: "📣",
    dla: "sprzedajacy",
    wpisy: [
      "Oferta trafiła na portale ogłoszeniowe.",
      "Odświeżyliśmy ogłoszenie i wyróżniliśmy je na portalach.",
      "Zrobiliśmy nowe zdjęcia oferty.",
      "Oferta została wysłana do kupujących z naszej bazy, którzy szukają podobnej nieruchomości.",
    ],
  },
  {
    nazwa: "Formalności",
    ikona: "📄",
    dla: "sprzedajacy",
    wpisy: [
      "Kompletujemy dokumenty do umowy przedwstępnej.",
      "Umowa przedwstępna jest umówiona u notariusza na [dzień].",
      "Czekamy na zaświadczenia ze spółdzielni lub z księgi wieczystej.",
      "Bank kupującego zamówił wycenę nieruchomości. Rzeczoznawca skontaktuje się w sprawie oględzin.",
    ],
  },
  {
    nazwa: "Nowe oferty",
    ikona: "🏠",
    dla: "kupujacy",
    wpisy: [
      "Dodałem dla Pana/Pani nową ofertę, która pasuje do kryteriów. Proszę zerknąć i dać znać, czy umawiamy oglądanie.",
      "Pojawiła się oferta, której nie ma jeszcze na portalach. Warto ją zobaczyć szybko.",
      "Po naszej rozmowie zawęziłem wyszukiwanie. Nowe propozycje są w zakładce Oferty.",
    ],
  },
  {
    nazwa: "Po oglądaniu",
    ikona: "🔑",
    dla: "kupujacy",
    wpisy: [
      "Dziękuję za dzisiejsze oglądanie. Jak wrażenia? Chętnie odpowiem na pytania.",
      "Jeśli ta nieruchomość się podoba, mogę od razu sprawdzić, czy jest pole do negocjacji ceny.",
      "Rozumiem, że to nie to. Proszę napisać, czego zabrakło, a lepiej dobiorę kolejne oferty.",
    ],
  },
  {
    nazwa: "Finansowanie i decyzja",
    ikona: "🏦",
    dla: "kupujacy",
    wpisy: [
      "Mogę polecić doradcę kredytowego, który bezpłatnie sprawdzi zdolność kredytową.",
      "Sprzedający jest otwarty na rozmowę o cenie. Czy przygotować propozycję?",
      "Daję znać, że oferta ma kolejnych zainteresowanych. Jeśli myśli Pan/Pani o niej poważnie, warto nie zwlekać.",
    ],
  },
];
