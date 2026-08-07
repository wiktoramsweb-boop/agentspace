/**
 * Dane stron modułów produktu (/produkt/[slug]).
 * Każdy moduł = osobna strona pod długi ogon fraz, np. „rozliczanie prowizji
 * w biurze nieruchomości”.
 */

export type ProductModule = {
  slug: string;
  name: string;
  /** Nagłówek H1 — korzyść, nie nazwa modułu. */
  headline: string;
  /** Lead pod H1. */
  lead: string;
  /** Fraza SEO w tytule strony. */
  seoTitle: string;
  seoDescription: string;
  /** Problem, który moduł rozwiązuje. */
  problem: string;
  /** Konkretne możliwości. */
  capabilities: { title: string; body: string }[];
  /** Dla kogo w biurze. */
  forWhom: string;
};

export const MODULES: ProductModule[] = [
  {
    slug: "crm",
    name: "CRM klientów",
    headline: "Baza klientów, która zostaje w biurze",
    lead: "Karty klientów z historią, notatkami i pipeline. Osobno sprzedający, kupujący, wynajmujący i najemcy — bo każdy z nich wymaga innej rozmowy.",
    seoTitle: "CRM dla biura nieruchomości — baza klientów | AgentSpace",
    seoDescription:
      "CRM zaprojektowany dla biur nieruchomości: typy klientów, pipeline, notatki, historia kontaktu. Baza zostaje w biurze, nie w telefonie agenta.",
    problem:
      "W większości biur baza klientów żyje w trzech miejscach naraz: w Excelu, w telefonie agenta i w jego głowie. Kiedy agent odchodzi, zabiera ze sobą dwa z tych trzech.",
    capabilities: [
      {
        title: "Cztery typy klienta",
        body: "Sprzedający, kupujący, wynajmujący i najemca mają osobne karty i osobne ścieżki. Agent od kupującego widzi inne pola niż agent od sprzedającego.",
      },
      {
        title: "Pipeline, który widać",
        body: "Każdy klient ma etap. Widzisz, ilu klientów utknęło na tym samym etapie dłużej, niż powinno — zanim się wypalą.",
      },
      {
        title: "Notatki z każdego kontaktu",
        body: "Historia rozmów przy kliencie, nie w prywatnym notesie. Kiedy agent jest na urlopie, ktoś inny może przejąć rozmowę bez pytania „na czym stanęliśmy”.",
      },
      {
        title: "AI pisze follow-up",
        body: "Na karcie klienta AI proponuje treść wiadomości i pomaga rozbroić obiekcję. Agent kopiuje i wysyła, zamiast odkładać na jutro.",
      },
    ],
    forWhom:
      "Dla agentów jako codzienne miejsce pracy, dla właściciela jako gwarancja, że baza biura zostaje w biurze.",
  },
  {
    slug: "cele",
    name: "Cele i lejek",
    headline: "Cel roczny rozbity na to, co agent zrobi dzisiaj",
    lead: "Lejek od telefonu do sprzedaży, policzony wstecz. Agent wie, ile rozmów musi wykonać dziś, żeby dowieźć rok.",
    seoTitle: "Cele sprzedażowe dla agentów nieruchomości | AgentSpace",
    seoDescription:
      "Lejek sprzedażowy dla biura nieruchomości: cel roczny przeliczony na dzienne działania. Tracker dnia, plan tygodnia, historia realizacji.",
    problem:
      "„W tym roku robimy 40 transakcji” nie jest celem — to życzenie. Bez przeliczenia na liczbę telefonów i spotkań w tygodniu nikt nie wie, czy plan jest realizowany, dopóki nie jest za późno.",
    capabilities: [
      {
        title: "Lejek liczony wstecz",
        body: "Telefony → spotkania → umowy → klienci kupujący → sprzedaże. Podajesz cel roczny, system pokazuje, co to znaczy w skali dnia.",
      },
      {
        title: "Tracker dnia",
        body: "Agent widzi jeden pierścień: ile z dzisiejszego celu już zrobił. Domknięcie dnia jest świętowane — to działa lepiej niż tabela.",
      },
      {
        title: "Plan tygodnia",
        body: "Rozkład celu na dni robocze z uwzględnieniem urlopów i dni terenowych.",
      },
      {
        title: "Historia realizacji",
        body: "Sześć tygodni wstecz. Widać trend, nie pojedynczy słaby dzień.",
      },
    ],
    forWhom:
      "Dla agenta — jasność, co dziś robić. Dla właściciela — wczesny sygnał, że ktoś zaczyna odpadać.",
  },
  {
    slug: "prowizje",
    name: "Prowizje i transakcje",
    headline: "Prowizje, które liczą się same",
    lead: "Karta transakcji z pięcioma etapami i dokumentami. Cel miesięczny aktualizuje się przy każdym domknięciu — bez arkusza domykanego w niedzielę.",
    seoTitle: "Rozliczanie prowizji w biurze nieruchomości | AgentSpace",
    seoDescription:
      "Rozliczanie prowizji agentów nieruchomości: karta transakcji, etapy, dokumenty, automatyczne naliczanie i cel miesięczny biura.",
    problem:
      "Rozliczenie prowizji to zwykle arkusz, który zna jedna osoba, aktualizuje się raz w miesiącu i zawsze zawiera dwa błędy — najczęściej na niekorzyść agenta, co niszczy zaufanie.",
    capabilities: [
      {
        title: "Karta transakcji",
        body: "Pięć etapów od rezerwacji do wypłaty, komplet dokumentów w jednym miejscu. Widać, gdzie transakcja stoi i na kogo się czeka.",
      },
      {
        title: "Naliczanie automatyczne",
        body: "Prowizja liczy się z wartości transakcji i ustalonego podziału. Agent widzi swój wynik na bieżąco, nie po fakcie.",
      },
      {
        title: "Cel miesięczny biura",
        body: "Suma domkniętych i zakontraktowanych transakcji względem celu. Wiesz w połowie miesiąca, czy trzeba przyspieszyć.",
      },
      {
        title: "Umowa rezerwacyjna w PDF",
        body: "Generowana z danych transakcji, gotowa do podpisu. Bez przepisywania tych samych danych do Worda.",
      },
    ],
    forWhom:
      "Dla właściciela — kontrola nad rozliczeniami. Dla agenta — pewność, że prowizja jest policzona uczciwie.",
  },
  {
    slug: "ai-coach",
    name: "AI Coach",
    headline: "Agent trenuje trudne rozmowy na AI, nie na Twoich klientach",
    lead: "13 scenariuszy z polskiego rynku, 9 osobowości klienta, rozmowa głosem, scoring i feedback po polsku.",
    seoTitle: "Szkolenie agentów nieruchomości z AI — AI Coach | AgentSpace",
    seoDescription:
      "Trening cold calli i spotkań pozyskowych z klientem AI. 13 scenariuszy, 9 osobowości, rozmowa głosem, scoring w czterech kategoriach i feedback po polsku.",
    problem:
      "Nowy agent uczy się na prawdziwych leadach. Każda źle poprowadzona rozmowa to spalony kontakt, którego nikt już nie odzyska — a właściciel dowiaduje się o tym po fakcie.",
    capabilities: [
      {
        title: "Trzy kategorie rozmów",
        body: "Cold calling, spotkania pozyskowe i najem. Scenariusze napisane pod realia polskiego rynku, nie tłumaczone z angielskiego.",
      },
      {
        title: "Dziewięć osobowości klienta",
        body: "Od życzliwego po agresywnego i zbywającego. Agent ćwiczy z tym typem, z którym sobie nie radzi.",
      },
      {
        title: "Rozmowa głosem",
        body: "Agent mówi, nie pisze. Trening w aucie między spotkaniami działa lepiej niż kurs, na który nikt nie pojedzie.",
      },
      {
        title: "Scoring i feedback",
        body: "Ocena w czterech kategoriach plus konkretne wskazówki po polsku — co powiedzieć następnym razem, a czego unikać.",
      },
    ],
    forWhom:
      "Dla nowych agentów jako onboarding, dla doświadczonych jako rozgrzewka przed trudną rozmową.",
  },
  {
    slug: "panel-wlasciciela",
    name: "Panel właściciela",
    headline: "Pierwszy raz widzisz biuro w liczbach",
    lead: "Ranking, mocne i słabe obszary zespołu, prowizje per agent, drill-down do pojedynczej osoby. Raport miesięczny przychodzi sam.",
    seoTitle: "Zarządzanie zespołem agentów nieruchomości | AgentSpace",
    seoDescription:
      "Panel właściciela biura nieruchomości: ranking agentów, realizacja celów, mocne i słabe obszary zespołu, prowizje i raporty miesięczne.",
    problem:
      "Właściciel wie, ile było transakcji. Nie wie, ile było telefonów, gdzie zespół traci leady i który agent zaczął odpadać trzy tygodnie temu.",
    capabilities: [
      {
        title: "Ranking z realizacją celów",
        body: "Nie tylko kto sprzedał najwięcej, ale kto realizuje swój lejek. Dwie zupełnie różne informacje.",
      },
      {
        title: "Mocne i słabe obszary",
        body: "Gdzie zespół wypada dobrze, a gdzie systemowo traci — na pozyskaniu, na spotkaniu czy na domknięciu.",
      },
      {
        title: "Drill-down do agenta",
        body: "Wchodzisz w konkretną osobę i widzisz jej cele, transakcje i wyniki treningów. Materiał na rozmowę 1:1.",
      },
      {
        title: "Role w zespole",
        body: "CEO, menedżer i agent widzą różne zakresy. Menedżer prowadzi swoich ludzi, nie widząc prowizji całego biura.",
      },
    ],
    forWhom:
      "Dla właściciela i menedżerów zespołów. Agenci nie widzą cudzych danych.",
  },
  {
    slug: "nieruchomosci",
    name: "Baza nieruchomości",
    headline: "Wspólna baza ofert dla całego biura",
    lead: "Oferty widoczne dla zespołu, ze zdjęciami i statusem. Agent od kupującego widzi, co ma kolega od sprzedającego.",
    seoTitle: "Wspólna baza nieruchomości dla biura | AgentSpace",
    seoDescription:
      "Baza ofert dla całego biura nieruchomości: zdjęcia, statusy, przypisanie do agenta i widoczność dla zespołu. Koniec z ofertami w prywatnych folderach.",
    problem:
      "Oferty leżą w prywatnych folderach agentów. Klient kupujący z jednego biurka nigdy nie spotka nieruchomości z drugiego — i transakcja wewnętrzna nie ma jak powstać.",
    capabilities: [
      {
        title: "Widoczność dla zespołu",
        body: "Cała baza dostępna dla biura. Kojarzenie kupującego z ofertą kolegi przestaje zależeć od tego, kto z kim rozmawia przy kawie.",
      },
      {
        title: "Zdjęcia i status",
        body: "Komplet materiałów przy ofercie, aktualny status widoczny od razu. Bez pytania „czy to jeszcze wolne”.",
      },
      {
        title: "Przypisanie do agenta",
        body: "Wiadomo, kto prowadzi ofertę i kto odpowiada za kontakt z właścicielem.",
      },
    ],
    forWhom:
      "Dla całego zespołu — im większe biuro, tym więcej transakcji wewnętrznych ta baza generuje.",
  },
];

export function getModule(slug: string): ProductModule | undefined {
  return MODULES.find((m) => m.slug === slug);
}
