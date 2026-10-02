import { MODULES_EN } from "./modules-en";

/**
 * Dane stron modułów produktu (/produkt/[slug]).
 * Każdy moduł = osobna strona pod długi ogon fraz, np. „rozliczanie prowizji
 * w biurze nieruchomości”.
 */

export type ProductModule = {
  slug: string;
  name: string;
  /** Nagłówek H1 - korzyść, nie nazwa modułu. */
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
  /** Makieta ekranu aplikacji pokazywana na stronie modułu. */
  shot: string;
  /** Zdjęcie przy sekcji „Dlaczego to boli”, żeby długi tekst miał oddech. */
  photo: string;
  /** Pytania, które padają przy tym module. */
  faq: { q: string; a: string }[];
};

export const MODULES: ProductModule[] = [
  {
    slug: "crm",
    name: "CRM klientów",
    headline: "Baza klientów, która zostaje w biurze",
    lead: "Karty klientów z historią, notatkami i pipeline. Osobno sprzedający, kupujący, wynajmujący i najemcy - bo każdy z nich wymaga innej rozmowy.",
    seoTitle: "CRM i baza klientów dla biura nieruchomości | AgentSpace",
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
        body: "Każdy klient ma etap. Widzisz, ilu klientów utknęło na tym samym etapie dłużej, niż powinno - zanim się wypalą.",
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
    photo: "/wzory/lounge.jpg",
    shot: "ShotKlient",
    faq: [
      {
        q: "Czy przeniesiecie naszą obecną bazę klientów?",
        a: "Tak, to część wdrożenia. Wgrywamy plik z Excela albo eksport z obecnego systemu i mapujemy kolumny na pola w AgentSpace. Historia kontaktu zostaje.",
      },
      {
        q: "Co się dzieje z klientami, gdy agent odchodzi z biura?",
        a: "Zostają w bazie biura razem z notatkami i historią. Przy usuwaniu konta system pyta, komu przepisać jego klientów i oferty, i pokazuje, ile ich jest.",
      },
      {
        q: "Czy agent widzi klientów kolegów?",
        a: "To Wasza decyzja. Domyślnie agent widzi swoich, menedżer swój zespół, a CEO całe biuro. Można też włączyć ukrywanie numerów telefonu przed osobami, które nie są opiekunem.",
      },
    ],
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
      "„W tym roku robimy 40 transakcji” nie jest celem - to życzenie. Bez przeliczenia na liczbę telefonów i spotkań w tygodniu nikt nie wie, czy plan jest realizowany, dopóki nie jest za późno.",
    capabilities: [
      {
        title: "Lejek liczony wstecz",
        body: "Telefony → spotkania → umowy → klienci kupujący → sprzedaże. Podajesz cel roczny, system pokazuje, co to znaczy w skali dnia.",
      },
      {
        title: "Tracker dnia",
        body: "Agent widzi jeden pierścień: ile z dzisiejszego celu już zrobił. Domknięcie dnia jest świętowane - to działa lepiej niż tabela.",
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
      "Dla agenta: jasność, co dziś robić. Dla właściciela: wczesny sygnał, że ktoś zaczyna odpadać.",
    photo: "/wzory/wieza.jpg",
    shot: "ShotCele",
    faq: [
      {
        q: "Skąd biorą się liczby w lejku?",
        a: "Z działań, które agent i tak wprowadza: telefonów, spotkań i umów. Nikt nie wypełnia osobnego raportu.",
      },
      {
        q: "Co jeśli agent nie realizuje celu?",
        a: "Widać to od razu, a nie na koniec kwartału. System pokazuje, na którym etapie lejka jest za mało, więc rozmowa dotyczy konkretu, a nie ogólnego „trzeba więcej dzwonić”.",
      },
      {
        q: "Czy cele ustawia właściciel, czy agent?",
        a: "Obaj. Właściciel ustawia cel biura, agent swój własny. System rozbija je na tygodnie i dni.",
      },
    ],
  },
  {
    slug: "prowizje",
    name: "Prowizje i transakcje",
    headline: "Prowizje, które liczą się same",
    lead: "Karta transakcji z pięcioma etapami i dokumentami. Cel miesięczny aktualizuje się przy każdym domknięciu - bez arkusza domykanego w niedzielę.",
    seoTitle: "Rozliczanie prowizji w biurze nieruchomości | AgentSpace",
    seoDescription:
      "Rozliczanie prowizji agentów nieruchomości: karta transakcji, etapy, dokumenty, automatyczne naliczanie i cel miesięczny biura.",
    problem:
      "Rozliczenie prowizji to zwykle arkusz, który zna jedna osoba, aktualizuje się raz w miesiącu i zawsze zawiera dwa błędy - najczęściej na niekorzyść agenta, co niszczy zaufanie.",
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
      "Dla właściciela: kontrola nad rozliczeniami. Dla agenta: pewność, że prowizja jest policzona uczciwie.",
    photo: "/wzory/szklo.jpg",
    shot: "ShotProwizje",
    faq: [
      {
        q: "Czy obsługujecie podział prowizji między agentów?",
        a: "Tak. Każda transakcja ma udział procentowy agenta, a przy transakcjach wewnętrznych da się rozdzielić prowizję między dwie osoby.",
      },
      {
        q: "Czy menedżer widzi kwoty prowizji zespołu?",
        a: "Nie. Menedżer prowadzi zespół i widzi jego pracę, ale kwoty cudzych transakcji widzi tylko CEO. To ustawienie wbudowane w role.",
      },
      {
        q: "Czy można z transakcji wystawić fakturę?",
        a: "Tak, modułem Faktury. Dane nabywcy i kwota prowizji wchodzą z transakcji, więc nie trzeba ich przepisywać.",
      },
    ],
  },
  {
    slug: "ai-coach",
    name: "AI Coach",
    headline: "Agent trenuje trudne rozmowy na AI, nie na Twoich klientach",
    lead: "13 scenariuszy z polskiego rynku, 9 osobowości klienta, rozmowa głosem, scoring i feedback po polsku.",
    seoTitle: "Szkolenie agentów nieruchomości z AI Coachem | AgentSpace",
    seoDescription:
      "Trening cold calli i spotkań pozyskowych z klientem AI. 13 scenariuszy, 9 osobowości, rozmowa głosem, scoring w czterech kategoriach i feedback po polsku.",
    problem:
      "Nowy agent uczy się na prawdziwych leadach. Każda źle poprowadzona rozmowa to spalony kontakt, którego nikt już nie odzyska - a właściciel dowiaduje się o tym po fakcie.",
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
        body: "Ocena w czterech kategoriach plus konkretne wskazówki po polsku - co powiedzieć następnym razem, a czego unikać.",
      },
    ],
    forWhom:
      "Dla nowych agentów jako onboarding, dla doświadczonych jako rozgrzewka przed trudną rozmową.",
    photo: "/wzory/lobby.jpg",
    shot: "AiCoach",
    faq: [
      {
        q: "Czy agent ćwiczy na prawdziwych klientach?",
        a: "Nie. AI Coach to symulacja: agent rozmawia z klientem granym przez model. Żadne dane prawdziwych klientów nie są do tego używane.",
      },
      {
        q: "Czy to działa po polsku?",
        a: "Tak, cały trening i ocena są po polsku, z realnymi obiekcjami, które padają w polskich biurach. To nie jest tłumaczony scenariusz amerykański.",
      },
      {
        q: "Co dostaje agent po rozmowie?",
        a: "Ocenę w pięciu obszarach (otwarcie, kwalifikacja, obiekcje, zamknięcie i ogólna), podsumowanie i dwie do czterech konkretnych wskazówek na następny raz.",
      },
    ],
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
        body: "Gdzie zespół wypada dobrze, a gdzie systemowo traci - na pozyskaniu, na spotkaniu czy na domknięciu.",
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
    photo: "/wzory/miasto-noc.jpg",
    shot: "ShotPanel",
    faq: [
      {
        q: "Czy agenci muszą cokolwiek dodatkowo wypełniać?",
        a: "Nie. Panel liczy wszystko z ich codziennej pracy: transakcji, działań i celów. Raportowanie jest efektem ubocznym, a nie osobnym obowiązkiem.",
      },
      {
        q: "Czy widzę, który agent ma problem i z czym?",
        a: "Tak. Panel pokazuje mocne i słabe obszary per osoba, także z treningów AI Coach, więc widać, czy problem jest w otwarciu rozmowy, czy w zamykaniu.",
      },
      {
        q: "Czy mogę wejść w szczegóły jednej osoby?",
        a: "Tak, każdy agent ma własną kartę z wynikami, lejkiem, kalendarzem celów i historią sesji treningowych.",
      },
    ],
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
      "Oferty leżą w prywatnych folderach agentów. Klient kupujący z jednego biurka nigdy nie spotka nieruchomości z drugiego - i transakcja wewnętrzna nie ma jak powstać.",
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
      "Dla całego zespołu: im większe biuro, tym więcej transakcji wewnętrznych ta baza generuje.",
    photo: "/wzory/kamienica.jpg",
    shot: "ShotOferty",
    faq: [
      {
        q: "Czy mogę przenieść oferty z obecnego systemu?",
        a: "Tak, razem ze zdjęciami. Przy wdrożeniu wgrywamy eksport i uzupełniamy pola, których stary system nie miał.",
      },
      {
        q: "Czy pola są dopasowane do typu nieruchomości?",
        a: "Tak. Mieszkanie ma inne pola niż działka, dom czy lokal użytkowy, a oferta na wynajem inne niż na sprzedaż. Słownik pól jest zgodny z tym, czego wymagają portale.",
      },
      {
        q: "Czy da się wyeksportować oferty na portale?",
        a: "Jeszcze nie. To pierwsza rzecz na liście, ale wymaga umowy z każdym portalem osobno, a nie samego kodu. Do tego czasu warto zostawić obecny system obok.",
      },
    ],
  },
  {
    slug: "leady",
    name: "Leady z reklam",
    headline: "Lead z Facebooka trafia do agenta, a nie do arkusza",
    lead: "Wgrywasz plik z Meta Ads albo dodajesz kontakt ręcznie, a system sam rozpoznaje powtórki, przypisuje opiekuna i pilnuje etapu.",
    seoTitle: "Zarządzanie leadami z Meta Ads dla biura nieruchomości | AgentSpace",
    seoDescription:
      "Import leadów z Facebooka i Instagrama, wykrywanie duplikatów po numerze telefonu, przypisywanie agentów i etapy kontaktu. Bez przepisywania do Excela.",
    problem:
      "Biuro płaci za reklamę, leady spływają do pliku, a plik trafia na WhatsAppa. Zanim ktoś się zorientuje, kto dzwonił, połowa kontaktów jest zimna, a druga połowa dostała telefon od dwóch agentów naraz.",
    capabilities: [
      {
        title: "Plik z Meta Ads wprost do systemu",
        body: "CSV i Excel wgrywasz bez przerabiania. System sam rozpoznaje kolumny, nawet gdy formularz miał własne pytania.",
      },
      {
        title: "Koniec z dzwonieniem dwa razy",
        body: "Ten sam numer wgrany drugi raz jest wyłapywany po ostatnich dziewięciu cyfrach, niezależnie od formatu zapisu.",
      },
      {
        title: "Pula biura i opiekun",
        body: "Lead bez opiekuna czeka w puli, aż ktoś go weźmie. Widać, kto ile wziął i co z tego wyszło.",
      },
      {
        title: "Etap i przejście do klienta",
        body: "Od nowego kontaktu po umówione spotkanie. Gdy lead dojrzeje, jednym kliknięciem staje się klientem w CRM z całą historią.",
      },
    ],
    forWhom:
      "Dla biur, które wydają na reklamę. Pokazuje, która kampania przynosi transakcje, a nie tylko kliknięcia.",
    photo: "/wzory/widok.jpg",
    shot: "ShotLeady",
    faq: [
      {
        q: "Jaki plik daje Meta Ads?",
        a: "CSV albo Excel z kolumnami zależnymi od tego, o co pytał formularz. System rozpoznaje je sam, także gdy dodaliście własne pytania.",
      },
      {
        q: "Co się stanie, gdy wgram ten sam plik dwa razy?",
        a: "Nic złego. Duplikaty wyłapujemy po ostatnich dziewięciu cyfrach numeru, niezależnie od formatu zapisu, więc nikt nie zadzwoni do tej samej osoby drugi raz.",
      },
      {
        q: "Czy lead od razu trafia do bazy klientów?",
        a: "Nie. Leady są osobno, dopóki ktoś z nimi nie porozmawia. Gdy kontakt dojrzeje, jednym kliknięciem staje się klientem w CRM z całą historią.",
      },
    ],
  },
  {
    slug: "dzialania",
    name: "Plan dnia i działania",
    headline: "Agent wie, co robić dzisiaj, zanim otworzy telefon",
    lead: "Zadania, kalendarz i przypomnienia w jednym miejscu, a na górze trzy priorytety wybrane przez AI z Waszych danych.",
    seoTitle: "Plan dnia i zadania dla agenta nieruchomości | AgentSpace",
    seoDescription:
      "Kalendarz, zadania i przypomnienia o kontakcie. AI Asystent Dnia podpowiada trzy priorytety z klientów, pipeline i terminów.",
    problem:
      "Agent zaczyna dzień od przewijania telefonu i decyduje na wyczucie, do kogo zadzwonić. Klient, który czekał tydzień, czeka kolejny, bo nikt o nim nie pamiętał.",
    capabilities: [
      {
        title: "Trzy priorytety na dziś",
        body: "AI czyta pipeline, terminy kontaktu i cele, i mówi wprost, co zrobić najpierw. Z uzasadnieniem, a nie samą listą.",
      },
      {
        title: "Kalendarz z całego biura",
        body: "Spotkania, oglądania i telefony w jednym widoku. Menedżer widzi obłożenie zespołu, zanim obieca klientowi termin.",
      },
      {
        title: "Klienci do kontaktu dzisiaj",
        body: "Każdy klient ma datę następnego kontaktu. System przypomina, zanim relacja wystygnie.",
      },
      {
        title: "Szybki wpis głosem",
        body: "Po oglądaniu dyktujesz dwa zdania, a system sam rozpoznaje klienta, nieruchomość i notatkę. Bez siadania do komputera.",
      },
    ],
    forWhom:
      "Dla agentów w terenie i dla menedżerów, którzy chcą widzieć pracę zespołu bez proszenia o raporty.",
    photo: "/zdjecia/plan-dnia.jpg",
    shot: "ShotKalendarz",
    faq: [
      {
        q: "Skąd AI wie, co jest priorytetem?",
        a: "Czyta pipeline, daty następnego kontaktu, terminy zadań i postęp celu. Priorytet dostaje uzasadnienie, więc agent widzi, dlaczego akurat ta rzecz.",
      },
      {
        q: "Czy kalendarz łączy się z Google?",
        a: "Jeszcze nie, to jest na liście. Na razie kalendarz działa wewnątrz systemu i obejmuje całe biuro.",
      },
      {
        q: "Czy przypomnienia przychodzą na telefon?",
        a: "Tak, jako powiadomienia push po dodaniu aplikacji do ekranu głównego. Nie trzeba instalować nic ze sklepu.",
      },
    ],
  },
  {
    slug: "poszukiwania",
    name: "Poszukiwania kupujących",
    headline: "Kupujący zapisany raz, dopasowania liczone same",
    lead: "Zapisujesz kryteria kupującego, a system sam pokazuje, które oferty z bazy biura do niego pasują, także te dodane jutro.",
    seoTitle: "Dopasowanie ofert do kupujących w biurze nieruchomości | AgentSpace",
    seoDescription:
      "Zlecenia poszukiwania z kryteriami ceny, metrażu i lokalizacji. Automatyczne dopasowanie do bazy ofert biura i transakcje wewnętrzne.",
    problem:
      "Agent pamięta swoich kupujących, ale nie pamięta ofert kolegi z drugiego biurka. Mieszkanie, które idealnie pasowało, sprzedaje się przez portal obcemu klientowi.",
    capabilities: [
      {
        title: "Kryteria zamiast notatki",
        body: "Cena, metraż, liczba pokoi, piętro i dzielnice. Zapisane raz, działają bez przypominania.",
      },
      {
        title: "Dopasowania z całej bazy",
        body: "System porównuje poszukiwanie z każdą ofertą biura, także z tymi, których agent nigdy nie widział.",
      },
      {
        title: "Widełki pod Wasz rynek",
        body: "Tolerancję ceny i metrażu ustawiacie w ustawieniach biura, bo w Warszawie i w mniejszym mieście znaczą co innego.",
      },
      {
        title: "Więcej transakcji wewnętrznych",
        body: "Im większe biuro, tym częściej kupujący jednego agenta trafia na ofertę drugiego. Prowizja zostaje w biurze.",
      },
    ],
    forWhom:
      "Dla biur z kilkoma agentami, w których oferty i kupujący dotąd nie spotykali się na czas.",
    photo: "/wzory/salon-widok.jpg",
    shot: "ShotPoszukiwania",
    faq: [
      {
        q: "Czym to się różni od notatki przy kliencie?",
        a: "Notatkę trzeba przeczytać, żeby zadziałała. Poszukiwanie samo porównuje się z każdą nową ofertą biura i podnosi rękę, gdy coś pasuje.",
      },
      {
        q: "Czy dopasowania obejmują oferty innych agentów?",
        a: "Tak i w tym rzecz. Im większe biuro, tym częściej kupujący jednego agenta trafia na ofertę drugiego, a prowizja zostaje w biurze.",
      },
      {
        q: "Czy mogę ustawić, jak szeroko system ma szukać?",
        a: "Tak. Tolerancję ceny i metrażu ustawiacie w ustawieniach biura, bo w dużym mieście i w mniejszym znaczą co innego.",
      },
    ],
  },
  {
    slug: "dokumenty",
    name: "Umowy i protokoły",
    headline: "Dokumenty gotowe w minutę, zawsze z Waszymi danymi",
    lead: "Umowa rezerwacyjna, protokół zdawczo-odbiorczy, aneks i oferta współpracy. Generowane do pełnego PDF, nie drukowane z przeglądarki.",
    seoTitle: "Umowa rezerwacyjna i protokół zdawczo-odbiorczy dla biura | AgentSpace",
    seoDescription:
      "Generator umów rezerwacyjnych, protokołów zdawczo-odbiorczych, aneksów i ofert współpracy. Pełny PDF z danymi Waszej firmy.",
    problem:
      "Protokół powstaje w Wordzie z pliku sprzed dwóch lat, w którym zostały dane poprzedniego klienta. Ktoś zapomina zmienić jedno pole i dokument idzie do podpisu z cudzym nazwiskiem.",
    capabilities: [
      {
        title: "Cztery dokumenty, jeden standard",
        body: "Rezerwacja, protokół, aneks i oferta współpracy. Każdy z numeracją paragrafów i miejscem na uwagi.",
      },
      {
        title: "Dane firmy same się wstawiają",
        body: "Nazwa, adres, NIP i reprezentant wchodzą z ustawień biura. Nie da się wysłać dokumentu z cudzymi danymi.",
      },
      {
        title: "Najpierw plik, potem druk",
        body: "Dokument zapisuje się jako prawdziwy PDF na komputer, a dopiero z niego drukujesz. Układ nie rozjeżdża się w zależności od przeglądarki.",
      },
      {
        title: "Protokół także po sprzedaży",
        body: "Osobny wariant na przekazanie lokalu po akcie: liczniki, klucze, uwagi i podpisy na jednej stronie.",
      },
    ],
    forWhom:
      "Dla agentów i asystentek biura, które dziś przepisują te same dokumenty ręcznie.",
    photo: "/wzory/cegla.jpg",
    shot: "ShotDokumenty",
    faq: [
      {
        q: "Czy dokumenty są zgodne z polskim prawem?",
        a: "Wzory powstały na podstawie dokumentów używanych na co dzień w działającym biurze pośrednictwa. Przed wdrożeniem w swoim biurze warto dać je swojemu prawnikowi do przejrzenia, tak jak każdy wzór umowy.",
      },
      {
        q: "Czy mogę dopisać własny zapis do umowy?",
        a: "Tak, w umowie rezerwacyjnej jest miejsce na dodatkowe ustępy. Możesz je napisać sam albo poprosić AI o sformułowanie prawnicze i je poprawić.",
      },
      {
        q: "Czy dokument zapisuje się jako prawdziwy PDF?",
        a: "Tak, nie jest to druk z przeglądarki. Plik najpierw trafia na dysk, a dopiero z niego drukujesz, więc układ nie rozjeżdża się między przeglądarkami.",
      },
    ],
  },
  {
    slug: "ofertowka",
    name: "Ofertówka",
    headline: "Prezentacja oferty, którą klient chce otworzyć",
    lead: "Z danych oferty w systemie składa się gotowy dokument dla klienta: zdjęcia, opis, parametry i Wasze logo.",
    seoTitle: "Prezentacja oferty nieruchomości dla klienta w PDF | AgentSpace",
    seoDescription:
      "Ofertówka składana z bazy ofert: zdjęcia, parametry, opis i dane kontaktowe agenta. Gotowy PDF do wysłania klientowi.",
    problem:
      "Agent wysyła klientowi link do portalu albo pięć zdjęć w wiadomości. Oferta wygląda tak samo jak każda inna i nie zostaje w pamięci.",
    capabilities: [
      {
        title: "Z bazy, nie od zera",
        body: "Zdjęcia, metraż, cena i opis zaciągają się z oferty. Agent nic nie przepisuje.",
      },
      {
        title: "Wasza marka, nie nasza",
        body: "Logo biura i dane agenta na każdej stronie. Klient wie, z kim rozmawia.",
      },
      {
        title: "Znak wodny na zdjęciach",
        body: "Zdjęcia krążą dalej, niż się planuje. Znak wodny pilnuje, żeby wracały do Was.",
      },
    ],
    forWhom:
      "Dla agentów, którzy wysyłają oferty mailem i chcą, żeby wyglądały poważnie.",
    photo: "/wzory/salon.jpg",
    shot: "ShotOfertowka",
    faq: [
      {
        q: "Czy mogę wybrać, które zdjęcia trafią do prezentacji?",
        a: "Tak, wybierasz zdjęcia i kolejność. Reszta danych zaciąga się z oferty.",
      },
      {
        q: "Czy na dokumencie jest nasze logo?",
        a: "Tak, logo i dane biura wchodzą z ustawień. Jeśli logo nie jest jeszcze wgrane, w jego miejscu są inicjały biura, nigdy cudza marka.",
      },
      {
        q: "Czy zdjęcia są chronione?",
        a: "Możecie włączyć znak wodny, który nakłada się na zdjęcia przy wgrywaniu. Działa też na zdjęciach wysyłanych na stronę biura.",
      },
    ],
  },
  {
    slug: "kalkulatory",
    name: "Kalkulatory dla klienta",
    headline: "Policz przy kliencie ratę i koszty zakupu",
    lead: "Rata kredytu, pełne koszty zakupu i rentowność najmu. Z Waszym logo, do wysłania jako PDF jeszcze z samochodu.",
    seoTitle: "Kalkulator kosztów zakupu nieruchomości i raty kredytu | AgentSpace",
    seoDescription:
      "Kalkulatory dla klienta: rata kredytu, koszty zakupu z PCC i taksą notarialną, rentowność najmu. Gotowy PDF z logo biura.",
    problem:
      "Klient pyta, ile naprawdę będzie kosztował zakup. Agent odpowiada „około”, obiecuje policzyć wieczorem i zapomina, a klient idzie z tym pytaniem gdzie indziej.",
    capabilities: [
      {
        title: "Pełne koszty zakupu",
        body: "PCC, taksa notarialna, opłaty sądowe, wpis hipoteki i prowizja biura. Suma, której nikt nie musi dopytywać.",
      },
      {
        title: "Rabat widoczny dla klienta",
        body: "Pokazujesz prowizję standardową i swoją obok, z przekreśleniem. Negocjacja staje się argumentem, a nie ustępstwem.",
      },
      {
        title: "Rentowność najmu",
        body: "Dla kupujących pod wynajem: zwrot, cash flow i porównanie z lokatą.",
      },
    ],
    forWhom:
      "Dla agentów przy stole z klientem i dla biur współpracujących z doradcami kredytowymi.",
    photo: "/wzory/kuchnia.jpg",
    shot: "ShotKalkulatory",
    faq: [
      {
        q: "Czy kalkulator uwzględnia rynek pierwotny i wtórny?",
        a: "Tak. Wybierasz rynek, a PCC i pozostałe opłaty przeliczają się same. Jest też wariant rynku wtórnego bez PCC.",
      },
      {
        q: "Czy klient dostaje to na piśmie?",
        a: "Tak, jednym przyciskiem robi się PDF z logo biura i danymi agenta, do wysłania mailem jeszcze z samochodu.",
      },
      {
        q: "Czy mogę pokazać klientowi rabat na prowizji?",
        a: "Tak. Podajesz stawkę standardową i swoją, a dokument pokazuje obie z przekreśleniem i kwotą oszczędności.",
      },
    ],
  },
  {
    slug: "faktury",
    name: "Faktury i podatki",
    headline: "Faktura za pośrednictwo bez wychodzenia z systemu",
    lead: "Wystawiasz fakturę z transakcji, którą już macie w bazie, a kalkulator podatkowy pokazuje, co z tego zostaje.",
    seoTitle: "Wystawianie faktur w biurze nieruchomości | AgentSpace",
    seoDescription:
      "Faktury za pośrednictwo wystawiane z poziomu transakcji, z numeracją i danymi sprzedawcy. Kalkulator podatkowy dla form rozliczenia w Polsce.",
    problem:
      "Faktury powstają w osobnym programie, a transakcje w systemie. Pod koniec miesiąca ktoś porównuje dwie listy i szuka, czego brakuje.",
    capabilities: [
      {
        title: "Kilku sprzedawców naraz",
        body: "Spółka i jednoosobowe działalności wspólników, każdy z własnym NIP-em i rachunkiem. Wybierasz przy wystawianiu.",
      },
      {
        title: "Numeracja i historia",
        body: "Numery nadawane po kolei, faktury filtrowane po roku, status opłacenia widoczny na liście.",
      },
      {
        title: "Kalkulator podatkowy",
        body: "Skala, liniowy i ryczałt, ze składkami ZUS i ulgami. Pokazuje, ile realnie zostaje z prowizji.",
      },
    ],
    forWhom:
      "Dla właściciela i księgowości. Dostęp do tego modułu nadaje się osobno, bez wglądu w bazę klientów.",
    photo: "/wzory/loft.jpg",
    shot: "ShotFaktury",
    faq: [
      {
        q: "Czy mogę wystawiać faktury z kilku podmiotów?",
        a: "Tak. Dodajecie tylu sprzedawców, ilu potrzeba: spółkę i jednoosobowe działalności wspólników, każdy z własnym NIP-em i rachunkiem.",
      },
      {
        q: "Czy numeracja jest automatyczna?",
        a: "Tak, numery nadają się po kolei, a listę filtrujecie po roku. Status opłacenia widać przy każdej fakturze.",
      },
      {
        q: "Kto ma dostęp do faktur?",
        a: "Domyślnie CEO i księgowość. Dostęp nadaje się osobno od reszty systemu, więc księgowa nie musi widzieć bazy klientów.",
      },
    ],
  },
  {
    slug: "raporty",
    name: "Raporty dla właściciela",
    headline: "Wyniki biura bez proszenia o zestawienia",
    lead: "Przychód, lejek, źródła transakcji i wyniki zespołu liczone z codziennej pracy agentów, a nie z osobnego raportowania.",
    seoTitle: "Raporty i wyniki biura nieruchomości | AgentSpace",
    seoDescription:
      "Raport dla właściciela biura: przychód miesiącami, lejek sprzedaży, źródła transakcji, wyniki agentów i prognoza. Eksport do PDF.",
    problem:
      "Właściciel prosi o zestawienie, agenci robią je w Excelu na kolanie, a liczby nie zgadzają się między sobą. Decyzje zapadają na podstawie wrażeń.",
    capabilities: [
      {
        title: "Liczby z pracy, nie z raportów",
        body: "Wszystko liczy się z transakcji, działań i celów, które zespół i tak wprowadza. Nikt nie wypełnia nic dodatkowo.",
      },
      {
        title: "Lejek i prognoza",
        body: "Widać, ile telefonów zamienia się w spotkania, a ile spotkań w umowy, i czego spodziewać się w kolejnym miesiącu.",
      },
      {
        title: "Skąd biorą się transakcje",
        body: "Polecenia, reklama, portale czy baza własna. Z podziałem na prowizję, nie na liczbę kontaktów.",
      },
      {
        title: "Raport na e-mail i do PDF",
        body: "Podsumowanie miesiąca przychodzi automatycznie pierwszego dnia. Do pobrania jako dokument na spotkanie wspólników.",
      },
    ],
    forWhom:
      "Dla właściciela biura i dyrektora. Menedżer widzi pracę swojego zespołu, bez kwot cudzych prowizji.",
    photo: "/wzory/hala.jpg",
    shot: "ShotPanel",
    faq: [
      {
        q: "Czy raport przychodzi automatycznie?",
        a: "Tak, podsumowanie miesiąca wychodzi mailem pierwszego dnia. Można też wygenerować go w dowolnym momencie i pobrać jako PDF.",
      },
      {
        q: "Czy widzę, skąd biorą się transakcje?",
        a: "Tak, z podziałem na źródła i według prowizji, a nie liczby kontaktów. Polecenie, które dało jedną dużą transakcję, nie ginie za reklamą, która dała dwadzieścia zimnych leadów.",
      },
      {
        q: "Czy raport można pokazać wspólnikom?",
        a: "Tak, po to jest eksport do PDF: złożony dokument z wykresami, do wydruku na spotkanie.",
      },
    ],
  },
  {
    slug: "role-i-uprawnienia",
    name: "Role i uprawnienia",
    headline: "Każdy widzi dokładnie tyle, ile ma widzieć",
    lead: "Osiem stanowisk z gotowymi zestawami dostępów i możliwość dołożenia albo odebrania pojedynczego modułu konkretnej osobie.",
    seoTitle: "Role i uprawnienia w systemie dla biura nieruchomości | AgentSpace",
    seoDescription:
      "CEO, dyrektor, menedżer, agent, asystent biura, księgowość, koordynator ofert i stażysta. Dostęp nadawany per osoba i per moduł.",
    problem:
      "W większości systemów są trzy role, więc księgowa dostaje dostęp do bazy klientów, a stażysta widzi prowizje kolegów. Albo odwrotnie: ktoś nie może wejść tam, gdzie pracuje codziennie.",
    capabilities: [
      {
        title: "Osiem stanowisk z biura, nie z instrukcji",
        body: "Od CEO po stażystę, z asystentką biura i księgowością. Każde ma zestaw dostępów dobrany pod to, co ta osoba faktycznie robi.",
      },
      {
        title: "Wyjątek dla jednej osoby",
        body: "Koordynator ma wyjątkowo widzieć faktury? Włączasz mu sam ten moduł, bez awansowania go na dyrektora.",
      },
      {
        title: "Zakres danych osobno",
        body: "Tylko swoje, swój zespół albo całe biuro. Niezależnie od tego, do których modułów ktoś wchodzi.",
      },
      {
        title: "Ukrywanie kontaktów",
        body: "Numer klienta widzi jego opiekun. Działa też na kartach i w listach wyboru, nie tylko w zestawieniach.",
      },
    ],
    forWhom:
      "Dla biur z rozbudowaną strukturą i dla tych, które zatrudniają księgowość albo asystentkę na część etatu.",
    photo: "/zdjecia/zespol.jpg",
    shot: "ShotRole",
    faq: [
      {
        q: "Czy muszę używać wszystkich ośmiu stanowisk?",
        a: "Nie. Małe biuro spokojnie wystarczy CEO i agentami. Reszta czeka na moment, w którym pojawi się księgowa albo asystentka.",
      },
      {
        q: "Czy mogę zrobić wyjątek dla jednej osoby?",
        a: "Tak, to sedno tego modułu. Włączasz albo wyłączasz pojedynczy moduł konkretnej osobie, bez zmieniania jej stanowiska. Wyjątki są oznaczone, więc po pół roku wiadomo, co było zmieniane ręcznie.",
      },
      {
        q: "Czy da się ograniczyć dostęp CEO?",
        a: "Nie i to celowo. Gdyby się dało, biuro mogłoby zostać bez nikogo, kto wejdzie w ustawienia i to odkręci.",
      },
    ],
  },
  {
    slug: "strona-www",
    name: "Strona internetowa biura",
    headline: "Strona, która aktualizuje się sama z Waszej bazy",
    lead: "Osiem wzorów do wyboru. Oferty, zespół i poradnik zaciągają się z systemu, a zapytania ze strony wracają do CRM.",
    seoTitle: "Strona internetowa dla biura nieruchomości z CRM | AgentSpace",
    seoDescription:
      "Strona www biura połączona z bazą ofert: osiem wzorów, własna domena, formularze wracające do CRM jako kontakt i zadanie dla agenta.",
    problem:
      "Strona biura powstała trzy lata temu i wisi na niej oferta sprzedana w zeszłym roku. Aktualizacja wymaga maila do firmy, która ją robiła.",
    capabilities: [
      {
        title: "Oferty prosto z systemu",
        body: "Zaznaczasz ofertę w bazie i jest na stronie. Bez przepisywania i bez wgrywania zdjęć drugi raz.",
      },
      {
        title: "Zapytania wracają do CRM",
        body: "Formularz tworzy kontakt i zadanie dla agenta, zamiast maila, który ginie w skrzynce biura.",
      },
      {
        title: "Własna domena i SEO",
        body: "Podpinamy Waszą domenę, mapę strony i dane strukturalne pod Google. Certyfikat i kopie po naszej stronie.",
      },
    ],
    forWhom:
      "Dla biur bez strony i dla tych, których strona żyje osobno od bazy ofert. Osobna usługa, poza abonamentem za system.",
    photo: "/wzory/taras.jpg",
    shot: "ShotOferty",
    faq: [
      {
        q: "Czy muszę brać stronę razem z systemem?",
        a: "Nie. To osobna usługa, poza abonamentem. System działa bez niej normalnie, a jeśli macie już własną stronę, nic nie musicie zmieniać.",
      },
      {
        q: "Czy strona działa na naszej domenie?",
        a: "Tak, podpinamy Waszą domenę. Certyfikat, kopie zapasowe i hosting są po naszej stronie.",
      },
      {
        q: "Co się dzieje z zapytaniem z formularza?",
        a: "Tworzy kontakt w CRM i zadanie dla agenta, a biuro dostaje powiadomienie. Nie ląduje w skrzynce, w której ginie.",
      },
    ],
  },
];

/**
 * Moduł w danym języku. Slug jest wspólny dla obu wersji, więc adres strony
 * nie zmienia się przy przełączeniu języka - zmienia się tylko treść.
 */
export function getModule(slug: string, lang: string = "pl"): ProductModule | undefined {
  const base = MODULES.find((m) => m.slug === slug);
  if (!base) return undefined;
  if (lang !== "en") return base;

  const translated = MODULES_EN[slug];
  // Makieta ekranu jest wspólna dla obu języków, więc bierzemy ją z bazy.
  return translated ? { slug, shot: base.shot, photo: base.photo, ...translated } : base;
}

/** Lista modułów w danym języku - do list i map strony. */
export function listModules(lang: string = "pl"): ProductModule[] {
  return MODULES.map((m) => getModule(m.slug, lang) ?? m);
}
