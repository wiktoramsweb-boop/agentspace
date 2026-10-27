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
  /**
   * Ilustracja modułu, jeśli powstała. Ma pierwszeństwo przed zdjęciem, bo
   * mówi o samym module, a nie buduje tylko nastroju. Przezroczyste PNG,
   * więc działa też w ciemnym motywie.
   */
  ilustracja?: string;
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
    ilustracja: "/ilustracje/crm.png",
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
    ilustracja: "/ilustracje/cele.png",
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
      {
        title: "Wypłaty dla agentów",
        body: "Księgowa albo właściciel oznacza wypłatę prowizji z kwotą i datą. Zaległe wypłaty z poprzednich miesięcy nie znikają z listy.",
      },
      {
        title: "Progi, menedżer i sieć",
        body: "Udział agenta rośnie z jego wynikiem od początku roku, menedżer dostaje nadprowizję z transakcji swoich ludzi, a biuro we franczyzie widzi opłatę dla sieci.",
      },
      {
        title: "Rozliczenie miesiąca",
        body: "Z każdej transakcji: ile dostaje agent, współagent, menedżer i sieć, a ile zostaje biuru. Jednym kliknięciem do CSV dla księgowej.",
      },
    ],
    forWhom:
      "Dla właściciela: kontrola nad rozliczeniami. Dla agenta: pewność, że prowizja jest policzona uczciwie.",
    ilustracja: "/ilustracje/prowizje.png",
    photo: "/wzory/szklo.jpg",
    shot: "ShotProwizje",
    faq: [
      {
        q: "Czy obsługujecie podział prowizji między agentów?",
        a: "Tak. Prowadzący agent ma swój udział, a do transakcji dopiszesz współagenta, agenta drugiej strony albo osobę, która poleciła klienta, każdego z własnym procentem.",
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
    lead: "24 scenariusze z polskiego rynku, 15 charakterów klienta, rozmowa głosem, scoring i feedback po polsku.",
    seoTitle: "Szkolenie agentów nieruchomości z AI Coachem | AgentSpace",
    seoDescription:
      "Trening cold calli i spotkań pozyskowych z klientem AI. 24 scenariusze, 15 charakterów klienta, rozmowa głosem, scoring w czterech kategoriach i feedback po polsku.",
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
      {
        title: "Trening na własnej ofercie",
        body: "Agent wybiera swoją ofertę, a klient AI pyta o to konkretne mieszkanie: cenę, metraż, to, czego nie ma w opisie. Ocena sprawdza też, czy agent zna swoją ofertę.",
      },
      {
        title: "Zadania od menedżera",
        body: "Menedżer zleca konkretną rozmowę z progiem zaliczenia i terminem. Gdy agent zaliczy, menedżer dostaje powiadomienie.",
      },
      {
        title: "Kluczowe momenty",
        body: "Po rozmowie agent widzi swoje dosłowne zdania: co zadziałało i co poprawić, z gotową lepszą wersją do powtórzenia.",
      },
    ],
    forWhom:
      "Dla nowych agentów jako onboarding, dla doświadczonych jako rozgrzewka przed trudną rozmową.",
    ilustracja: "/ilustracje/ai-coach.png",
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
      {
        title: "Biuro w skrócie i poniedziałkowy mail",
        body: "Na pulpicie i w mailu co poniedziałek: prowizje, transakcje w toku i lista spraw, które się palą. Nie musisz wchodzić w moduły, żeby wiedzieć, co się dzieje.",
      },
      {
        title: "Oddziały",
        body: "Zespół podzielony na oddziały z kierownikami. Porównanie wyników oddziałów, pula leadów oddziału i podsumowanie tygodnia dla każdego kierownika.",
      },
    ],
    forWhom:
      "Dla właściciela i menedżerów zespołów. Agenci nie widzą cudzych danych.",
    ilustracja: "/ilustracje/panel-wlasciciela.png",
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
      {
        title: "Historia zmian ceny",
        body: "Każda zmiana ceny zapisuje się z datą i osobą. Na karcie oferty widać, ile razy i o ile cena spadła, co pomaga w rozmowie z właścicielem.",
      },
    ],
    forWhom:
      "Dla całego zespołu: im większe biuro, tym więcej transakcji wewnętrznych ta baza generuje.",
    ilustracja: "/ilustracje/nieruchomosci.png",
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
    ilustracja: "/ilustracje/leady.png",
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
      "Kalendarz, zadania i przypomnienia o kontakcie. Pulpit „Priorytety na dziś” ocenia każdego klienta od 0 do 100 i pokazuje, do kogo zadzwonić najpierw.",
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
    ilustracja: "/ilustracje/dzialania.png",
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
      {
        title: "Ranking AI według rozmów",
        body: "AI czyta notatki z rozmów z klientem i układa pasujące oferty według tego, co klient naprawdę mówił, z jednym zdaniem uzasadnienia i pytaniem, które warto zadać przed prezentacją.",
      },
    ],
    forWhom:
      "Dla biur z kilkoma agentami, w których oferty i kupujący dotąd nie spotykali się na czas.",
    ilustracja: "/ilustracje/poszukiwania.png",
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
      {
        title: "Generator umów z wzorów",
        body: "Umowy pośrednictwa, najmu i najmu okazjonalnego, pełnomocnictwo, potwierdzenie prezentacji i oświadczenie sprzedającego. Dane z karty klienta i oferty, podgląd na żywo i PDF zapisany od razu w karcie.",
      },
    ],
    forWhom:
      "Dla agentów i asystentek biura, które dziś przepisują te same dokumenty ręcznie.",
    ilustracja: "/ilustracje/dokumenty.png",
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
    ilustracja: "/ilustracje/ofertowka.png",
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
      {
        title: "Kalkulator remontu",
        body: "Kosztorys remontu z metrażu i standardu, z VAT 8% albo 23% i czasem prac. PDF dla kupującego w minutę.",
      },
    ],
    forWhom:
      "Dla agentów przy stole z klientem i dla biur współpracujących z doradcami kredytowymi.",
    ilustracja: "/ilustracje/kalkulatory.png",
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
    ilustracja: "/ilustracje/faktury.png",
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
    ilustracja: "/ilustracje/raporty.png",
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
    lead: "Dziewięć stanowisk z gotowymi zestawami dostępów i możliwość dołożenia albo odebrania pojedynczego modułu konkretnej osobie.",
    seoTitle: "Role i uprawnienia w systemie dla biura nieruchomości | AgentSpace",
    seoDescription:
      "CEO, dyrektor, menedżer, agent, asystent biura, księgowość, koordynator ofert i stażysta. Dostęp nadawany per osoba i per moduł.",
    problem:
      "W większości systemów są trzy role, więc księgowa dostaje dostęp do bazy klientów, a stażysta widzi prowizje kolegów. Albo odwrotnie: ktoś nie może wejść tam, gdzie pracuje codziennie.",
    capabilities: [
      {
        title: "Dziewięć stanowisk z biura, nie z instrukcji",
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
      {
        title: "Dziennik zdarzeń",
        body: "Właściciel widzi, kto usunął klienta, kto przepisał ofertę, kto pobrał eksport bazy i kto zmienił komuś rolę. Wpisów nie da się usunąć z aplikacji.",
      },
    ],
    forWhom:
      "Dla biur z rozbudowaną strukturą i dla tych, które zatrudniają księgowość albo asystentkę na część etatu.",
    ilustracja: "/ilustracje/role-i-uprawnienia.png",
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
    ilustracja: "/ilustracje/strona-www.png",
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
  {
    slug: "umowa-najmu-okazjonalnego",
    name: "Umowy i dokumenty najmu",
    headline: "Umowa najmu okazjonalnego bez szukania wzoru w internecie",
    lead: "Umowa z załącznikami, zgłoszenie do urzędu skarbowego, żądanie opróżnienia lokalu i potwierdzenie kaucji. Dane wchodzą z karty klienta i oferty, a program pilnuje terminów i limitów z ustawy.",
    seoTitle: "Umowa najmu okazjonalnego: generator wzoru z załącznikami | AgentSpace",
    seoDescription:
      "Generator umowy najmu okazjonalnego z załącznikami (art. 19a), zgłoszeniem do US w 14 dni i żądaniem opróżnienia lokalu. Pilnuje kaucji do 6-krotności czynszu. PDF w minutę.",
    problem:
      "Agent szuka wzoru umowy najmu okazjonalnego w internecie, dostaje wersję sprzed lat bez załączników i kaucją wyższą, niż pozwala ustawa. Właściciel orientuje się dopiero wtedy, gdy najemca przestaje płacić, a szybka ścieżka eksmisji nie działa, bo umowy nie zgłoszono w urzędzie skarbowym.",
    capabilities: [
      {
        title: "Komplet do najmu okazjonalnego",
        body: "Umowa z oświadczeniem o poddaniu się egzekucji, wskazaniem lokalu zastępczego i zgodą jego właściciela. Program przypomina, że oświadczenie najemcy robi notariusz, a zgodę właściciela lokalu zastępczego można podpisać notarialnie na żądanie wynajmującego.",
      },
      {
        title: "Pilnuje przepisów",
        body: "Ostrzega, gdy kaucja przekracza sześciokrotność czynszu, gdy umowa jest dłuższa niż 10 lat albo gdy termin w żądaniu opróżnienia jest krótszy niż 7 dni. Ostrzeżenia widzi agent, na wydruk nie trafiają.",
      },
      {
        title: "Pisma po podpisaniu",
        body: "Zgłoszenie zawarcia umowy do naczelnika urzędu skarbowego z wyliczonym terminem 14 dni, potwierdzenie przyjęcia kaucji i żądanie opróżnienia lokalu. Wszystko z tych samych danych, bez przepisywania.",
      },
      {
        title: "Umowy pośrednictwa i pisma sprzedażowe",
        body: "Umowy pośrednictwa w sprzedaży, kupnie i najmie (z pouczeniem konsumenta i formularzem odstąpienia przy umowie poza biurem), potwierdzenie prezentacji, pełnomocnictwo i oświadczenie sprzedającego.",
      },
    ],
    forWhom: "Dla agentów najmu i biur, które obsługują właścicieli mieszkań na wynajem, a także dla każdego, kto podpisuje umowy pośrednictwa poza biurem.",
    photo: "/zdjecia/transakcja.jpg",
    shot: "ShotDokumenty",
    faq: [
      { q: "Czy umowa najmu okazjonalnego musi być u notariusza?", a: "Sama umowa nie. U notariusza najemca składa oświadczenie o poddaniu się egzekucji. Wynajmujący może dodatkowo zażądać, żeby podpis właściciela lokalu zastępczego był notarialnie poświadczony. Program to opisuje i pyta, czy takie żądanie ma się znaleźć w umowie." },
      { q: "Jaka kaucja jest dozwolona przy najmie okazjonalnym?", a: "Najwyżej sześciokrotność miesięcznego czynszu. Kaucja wraca do najemcy w ciągu miesiąca od opróżnienia lokalu, po potrąceniu należności. Program ostrzega, gdy wpisana kaucja jest wyższa." },
      { q: "Co jeśli właściciel nie zgłosi umowy do urzędu skarbowego?", a: "Ma na to 14 dni od rozpoczęcia najmu. Bez zgłoszenia umowa nie korzysta z ochrony najmu okazjonalnego, więc szybka ścieżka opróżnienia lokalu nie zadziała. Program przygotowuje gotowe zgłoszenie z wyliczonym terminem." },
      { q: "Czy mogę zapisać umowę przy kliencie?", a: "Tak. Gotowy PDF zapisuje się jednym kliknięciem w karcie klienta albo oferty, razem z danymi formularza, żeby później dało się go poprawić." },
    ],
  },
  {
    slug: "tablica-transakcji",
    name: "Tablica transakcji",
    headline: "Wszyscy klienci i oferty na jednej tablicy",
    lead: "Kolumny to etapy, karty to klienci albo oferty. Przeciągasz kartę, a etap zmienia się od razu, razem z zadaniami z automatyzacji.",
    seoTitle: "Pipeline kanban dla biura nieruchomości: tablica klientów i ofert | AgentSpace",
    seoDescription: "Tablica kanban z przeciąganiem dla biura nieruchomości: etapy klientów i ofert, filtr opiekuna, oznaczenie obniżek ceny. Widać, gdzie utykają transakcje.",
    problem: "Lista klientów pokazuje, kto jest w bazie, ale nie pokazuje, gdzie utknął. Dopiero na tablicy widać, że w negocjacjach leży osiem transakcji, a w umowie żadna.",
    capabilities: [
      { title: "Przeciągnij i upuść", body: "Na komputerze myszką, na telefonie za uchwyt karty. Etap zapisuje się od razu, a pozostali widzą zmianę." },
      { title: "Klienci i oferty", body: "Osobna tablica dla klientów (etapy pipeline) i dla ofert (etapy obsługi). Przełączasz widok listy i tablicy jednym kliknięciem." },
      { title: "Filtr opiekuna", body: "Menedżer patrzy na tablicę swojego zespołu albo jednego agenta, właściciel na całe biuro." },
      { title: "Sygnały na kartach", body: "Karta oferty pokazuje obniżkę ceny, karta klienta termin następnego kontaktu. Nie trzeba otwierać, żeby wiedzieć, co się dzieje." },
    ],
    forWhom: "Dla agentów, którzy prowadzą kilkanaście transakcji naraz, i menedżerów, którzy chcą widzieć, gdzie zespół utyka.",
    photo: "/zdjecia/plan-dnia.jpg",
    shot: "ShotTablica",
    faq: [
      { q: "Czy tablica działa na telefonie?", a: "Tak. Na telefonie kartę przesuwasz za uchwyt albo wybierasz etap z menu na karcie, bo przeciąganie palcem po przewijanej stronie bywa niewygodne." },
      { q: "Czy zmiana etapu na tablicy uruchamia automatyzacje?", a: "Tak, tak samo jak zmiana na karcie klienta. Jeśli masz regułę „etap zmieniony, utwórz zadanie”, zadanie powstanie." },
    ],
  },
  {
    slug: "czat-zespolu",
    name: "Czat zespołu",
    headline: "Rozmowy biura w biurze, a nie na prywatnym WhatsAppie",
    lead: "Kanały, rozmowy prywatne i grupy. Do wiadomości dołączasz kartę klienta albo oferty, a rozmowa zostaje w biurze, gdy agent odchodzi.",
    seoTitle: "Czat dla zespołu biura nieruchomości z odnośnikami do ofert | AgentSpace",
    seoDescription: "Komunikator zespołu w systemie biura nieruchomości: kanały, rozmowy prywatne, załączniki, odnośniki do klientów i ofert, powiadomienia na telefon.",
    problem: "Zespół rozmawia na prywatnych komunikatorach. Numer klienta, zdjęcie umowy i ustalenia z właścicielem lądują w telefonie agenta i znikają razem z nim.",
    capabilities: [
      { title: "Kanały i rozmowy prywatne", body: "Kanał całego biura, grupy (np. najem, kupujący) i rozmowy jeden na jeden. Wyciszasz to, co Cię nie dotyczy." },
      { title: "Karta klienta w wiadomości", body: "Wyszukujesz klienta albo ofertę i wklejasz jako kartę. Kolega klika i jest na właściwej stronie, bez przepisywania numerów." },
      { title: "Załączniki i powiadomienia", body: "Zdjęcia i pliki w rozmowie, licznik nieprzeczytanych w menu i powiadomienia na telefon." },
      { title: "Zostaje w biurze", body: "Historia rozmów należy do biura i zostaje w programie, gdy agent odchodzi. Nowa osoba w zespole czyta ustalenia, zamiast pytać od nowa." },
    ],
    forWhom: "Dla biur od trzech osób w górę, w których połowa ustaleń dzieje się dziś poza systemem.",
    photo: "/zdjecia/zespol.jpg",
    shot: "ShotCzat",
    faq: [
      { q: "Czy to zastąpi WhatsAppa?", a: "W sprawach biura tak. Prywatne rozmowy zostaną tam, gdzie są, ale wszystko, co dotyczy klientów i ofert, ma sens tylko w miejscu, które zostaje w biurze." },
      { q: "Czy czat działa na żywo?", a: "Tak, wiadomości pojawiają się od razu u wszystkich uczestników rozmowy, także na telefonie." },
    ],
  },
  {
    slug: "urlopy-i-zastepstwa",
    name: "Urlopy i zastępstwa",
    headline: "Agent na urlopie, a klienci dalej obsłużeni",
    lead: "Nieobecność z datami i zastępcą. Zastępca widzi klientów nieobecnego, a zadania z automatyzacji trafiają do niego, a nie w próżnię.",
    seoTitle: "Urlopy i zastępstwa agentów w biurze nieruchomości | AgentSpace",
    seoDescription: "Planowanie urlopów agentów nieruchomości z zastępcą: dostęp do klientów nieobecnego, przekierowanie zadań, informacja na karcie klienta.",
    problem: "Agent wyjeżdża na dwa tygodnie. Klient dzwoni, nikt nie wie, na czym stanęło, a jeśli biuro ukrywa kontakty, kolega nawet nie może oddzwonić.",
    capabilities: [
      { title: "Nieobecność z zastępcą", body: "Urlop, L4 albo szkolenie z datami i wskazaną osobą zastępującą. Zespół widzi, kto jest dziś nieobecny." },
      { title: "Dostęp na czas zastępstwa", body: "Zastępca widzi kontakty klientów nieobecnego tylko w dniach zastępstwa. Po powrocie wszystko wraca do normy." },
      { title: "Zadania nie giną", body: "Automatyzacje, które utworzyłyby zadanie dla nieobecnego, kierują je do zastępcy." },
      { title: "Informacja na karcie klienta", body: "Kto otworzy kartę klienta, zobaczy, że opiekun jest na urlopie i do kogo się zwrócić." },
    ],
    forWhom: "Dla biur, w których urlop agenta oznacza dziś dwa tygodnie zawieszonych transakcji.",
    photo: "/zdjecia/wnetrze-biura.jpg",
    shot: "ShotKalendarz",
    faq: [
      { q: "Czy zastępca widzi wszystkich klientów nieobecnego na stałe?", a: "Nie, tylko w dniach zastępstwa. Uprawnienie wynika z wpisu o nieobecności i wygasa samo." },
      { q: "Kto może wpisać urlop?", a: "Agent swój, a właściciel i menedżer dowolnej osoby z zespołu." },
    ],
  },
  {
    slug: "automatyzacje",
    name: "Automatyzacje",
    headline: "Rzeczy, które dzieją się same, kiedy coś się zmienia",
    lead: "Reguła to zdanie: kiedy coś się stanie, zrób to. Zmiana etapu, cena, nowy lead albo klient bez kontaktu tworzą zadanie, powiadomienie, przydział albo mail.",
    seoTitle: "Automatyzacje w CRM dla biura nieruchomości | AgentSpace",
    seoDescription: "Automatyzacje dla biura nieruchomości: zadania po zmianie etapu, przydział leadów, przypomnienia o klientach bez kontaktu, maile z szablonów.",
    problem: "Biuro ma zasady (oddzwoń w godzinę, zadzwoń po prezentacji, odśwież ofertę po miesiącu), ale pilnuje ich pamięć agentów. Pamięć zawodzi akurat wtedy, gdy jest najwięcej pracy.",
    capabilities: [
      { title: "11 wyzwalaczy", body: "Nowy klient, lead i oferta, zmiana etapu i ceny, prezentacja, dopasowanie oferty do poszukiwania, klient bez kontaktu, oferta bez prezentacji, zamknięta transakcja." },
      { title: "Kilka akcji w jednej regule", body: "Zadanie dla opiekuna i powiadomienie dla właściciela naraz. Przydział leada najmniej obciążonej osobie. Mail do klienta z szablonu." },
      { title: "Gotowe przepisy", body: "Zaczynasz od sprawdzonych reguł i zmieniasz terminy pod siebie, zamiast budować wszystko od zera." },
      { title: "Bez dubli", body: "Każde zdarzenie uruchamia regułę raz. Automatyzacje nie wywołują się nawzajem w kółko." },
    ],
    forWhom: "Dla właścicieli, którzy chcą, żeby standard obsługi klienta działał także wtedy, gdy nikt go nie pilnuje.",
    photo: "/zdjecia/plan-dnia.jpg",
    shot: "ShotAutomatyzacje",
    faq: [
      { q: "Czy automatyzacja może wysłać mail do klienta?", a: "Tak, z szablonu i z poczty biura, z kopią w korespondencji przy kliencie. Odpowiedź klienta trafia do agenta." },
      { q: "Co jeśli agent jest na urlopie?", a: "Zadanie trafia do zastępcy wskazanego przy nieobecności." },
    ],
  },
  {
    slug: "kalkulator-remontu",
    name: "Kalkulator remontu",
    headline: "Ile kosztuje doprowadzenie mieszkania do stanu",
    lead: "Kosztorys z metrażu i liczby pokoi: zakres prac, standard wykończenia, VAT 8% albo 23%, rezerwa i czas trwania. PDF dla kupującego w minutę.",
    seoTitle: "Kalkulator remontu mieszkania 2026: kosztorys z VAT i PDF | AgentSpace",
    seoDescription: "Kalkulator kosztów remontu mieszkania: odświeżenie, średni i generalny remont, trzy standardy, VAT 8% i 23%, koszt za m², czas prac i PDF dla klienta.",
    problem: "Kupujący pyta przy oglądaniu, ile będzie kosztował remont. Agent mówi „ze sto tysięcy”, a klient wychodzi z poczuciem, że nikt tego naprawdę nie policzył.",
    capabilities: [
      { title: "Z metrażu do kosztorysu", body: "Program rozkłada mieszkanie na pomieszczenia i liczy ilości: ściany, sufity, podłogi, punkty elektryczne. Każdą ilość możesz poprawić." },
      { title: "Zakres i standard", body: "Odświeżenie, średni albo generalny remont, w standardzie ekonomicznym, zwykłym lub premium. Wynik zmienia się od razu." },
      { title: "Uczciwy VAT", body: "8% przy remoncie lokalu mieszkalnego do 150 m², 23% na materiały kupione samodzielnie i powyżej 150 m²." },
      { title: "Twoje stawki", body: "Ceny domyślne to średnie rynkowe dla dużego miasta w 2026 r. Wpisujesz stawki znajomych ekip, a kosztorys liczy już po Twojemu." },
    ],
    forWhom: "Dla agentów sprzedających mieszkania do remontu i dla doradców, którzy pomagają kupującemu policzyć cały budżet.",
    photo: "/zdjecia/odbior-kluczy.jpg",
    shot: "ShotRemont",
    faq: [
      { q: "Ile kosztuje generalny remont mieszkania w 2026 roku?", a: "W dużym mieście zwykle od około 1 700 do 2 500 zł brutto za metr w standardzie średnim, z materiałami. Kalkulator pokazuje to dla konkretnego układu mieszkania." },
      { q: "Czy kosztorys można zapisać przy ofercie?", a: "Tak, kosztorys zapisuje się w programie z odnośnikiem do oferty, a PDF wysyłasz klientowi." },
    ],
  },
  {
    slug: "rodo",
    name: "Zgody RODO",
    headline: "Zgody klientów z datą, źródłem i historią",
    lead: "Przy każdym kliencie wiesz, na co się zgodził, kiedy i skąd. Obowiązek informacyjny drukujesz jako PDF, a wycofanie zgody zostaje w historii.",
    seoTitle: "Zgody RODO w biurze nieruchomości: rejestr zgód klientów | AgentSpace",
    seoDescription: "Rejestr zgód RODO przy kliencie biura nieruchomości: marketing, kontakt, udostępnianie danych, historia zmian, obowiązek informacyjny w PDF.",
    problem: "Klient pisze, że nie zgadzał się na wysyłkę ofert. Biuro ma podpis gdzieś w segregatorze albo nie ma go wcale, i nie potrafi pokazać, kiedy zgoda została udzielona.",
    capabilities: [
      { title: "Rejestr zgód", body: "Klauzula informacyjna, przetwarzanie w celu obsługi, marketing mailem, telefonem i SMS-em oraz udostępnienie danych biurom współpracującym. Każda pozycja z datą, źródłem i osobą, która ją odnotowała." },
      { title: "Historia zmian", body: "Wycofanie zgody nie kasuje wpisu, tylko dopisuje nowy. W razie kontroli pokazujesz pełną historię." },
      { title: "Obowiązek informacyjny", body: "Gotowa klauzula informacyjna z danymi biura jako PDF do podpisu albo wysłania." },
      { title: "Umowa powierzenia", body: "Dane biura przetwarzamy na serwerach w UE, na podstawie umowy powierzenia zawieranej przy założeniu konta." },
    ],
    forWhom: "Dla właścicieli biur, którzy chcą mieć porządek w zgodach, zanim ktoś o nie zapyta.",
    photo: "/zdjecia/rozmowa-audyt.jpg",
    shot: "ShotKlient",
    faq: [
      { q: "Czy zgoda na kontakt jest potrzebna, żeby zadzwonić do klienta?", a: "Zależy od sytuacji: przy obsłudze umowy podstawą jest umowa, przy marketingu potrzebna jest zgoda. Program pozwala odnotować obie sytuacje i jej podstawę." },
      { q: "Gdzie są przechowywane dane?", a: "Na serwerach w Unii Europejskiej (Frankfurt)." },
    ],
  },
  {
    slug: "koszty-i-wynik",
    name: "Koszty i wynik",
    headline: "Ile biuro zarobiło w tym miesiącu, naprawdę",
    lead: "Prowizje z transakcji, wypłaty dla agentów i koszty biura w jednym widoku. Stałe opłaty dopisują się same, a paczkę dla księgowej pobierasz jednym kliknięciem.",
    seoTitle: "Koszty biura nieruchomości i wynik miesiąca: panel dla właściciela | AgentSpace",
    seoDescription: "Koszty biura nieruchomości, stałe opłaty, wypłaty prowizji agentów i wynik miesiąca. Eksport CSV dla księgowej: koszty, wypłaty, ewidencja sprzedaży.",
    problem: "Właściciel zna przychód z prowizji, ale wynik poznaje dopiero od księgowej, kilka tygodni po fakcie. Koszty są w mailach z fakturami, a wypłaty dla agentów w osobnym Excelu.",
    capabilities: [
      { title: "Koszty z kategoriami", body: "Czynsz, portale, oprogramowanie, reklama, samochód. Kwota netto albo brutto, VAT, kontrahent, numer faktury i status zapłaty." },
      { title: "Stałe opłaty", body: "Czynsz i abonamenty wpisujesz raz, a co miesiąc w dniu płatności dopisują się do kosztów." },
      { title: "Wypłaty prowizji", body: "Kto ma dostać ile i za którą transakcję. Zaległe wypłaty z poprzednich miesięcy są zawsze na górze listy." },
      { title: "Paczka dla księgowej", body: "Koszty, wypłaty i ewidencja sprzedaży z faktur w plikach, które otwierają się w Excelu dwuklikiem." },
    ],
    forWhom: "Dla właściciela biura i księgowej. Rola „Księgowość” widzi finanse, ale nie bazę klientów.",
    photo: "/zdjecia/pierwsze-wnioski.jpg",
    shot: "ShotKoszty",
    faq: [
      { q: "Czy to zastępuje księgowość?", a: "Nie. To widok zarządczy dla właściciela. Księgi prowadzi księgowa, a program daje jej uporządkowane dane co miesiąc." },
      { q: "Czy agent widzi koszty biura?", a: "Nie. Finanse widzi właściciel, dyrektor i księgowa. Agent widzi swoje prowizje." },
    ],
  },
  {
    slug: "wycena-rcn",
    name: "Wycena z aktów notarialnych",
    headline: "Cena mieszkania z transakcji, a nie z ogłoszeń",
    lead: "Wycena oparta na Rejestrze Cen Nieruchomości: ceny z aktów notarialnych w promieniu do 3,5 km, dopasowane do piętra, stanu i budynku. Raport PDF na spotkanie z właścicielem w minutę.",
    seoTitle: "Wycena mieszkania z Rejestru Cen Nieruchomości (RCN) dla agenta | AgentSpace",
    seoDescription: "Wycena mieszkania na podstawie cen transakcyjnych z RCN: porównania w okolicy, trend cen, korekty za piętro, stan i budynek, raport PDF dla właściciela.",
    problem: "Właściciel wycenia mieszkanie po ogłoszeniu sąsiada, a ogłoszenie to cena, za którą ktoś chce sprzedać. Bez cen z aktów agent przegrywa rozmowę o cenie, zanim ją zacznie, a oferta wisi miesiącami.",
    capabilities: [
      { title: "Ceny z aktów notarialnych", body: "Transakcje lokali mieszkalnych z publicznego Rejestru Cen Nieruchomości. Program sam szuka w coraz szerszym promieniu, aż zbierze wystarczająco porównań." },
      { title: "Korekty za to, co widać na oględzinach", body: "Piętro i winda, stan wykończenia, rodzaj i wiek budynku, balkon, taras, ogród, piwnica i miejsce parkingowe. Każda korekta jest pokazana osobno, bez czarnej skrzynki." },
      { title: "Trend i widełki", body: "Ceny porównań przeliczone na dziś według trendu z kwartalnych median. Wynik to cena transakcyjna, widełki i sugerowana cena ofertowa z marginesem na negocjacje." },
      { title: "Raport PDF dla właściciela", body: "Trzy strony: wynik i parametry, mapa i tabela porównań, wykres cen w okolicy z opisem metody. Gotowy do wysłania albo wydruku przed spotkaniem." },
    ],
    forWhom: "Dla agenta przed spotkaniem pozyskowym i przy rozmowie o obniżce ceny. Dla właściciela biura, który chce, żeby zespół rozmawiał o cenie na danych.",
    photo: "/wzory/kamienica.jpg",
    shot: "/strona/zrzuty/wycena.webp",
    faq: [
      { q: "Skąd są dane?", a: "Z Rejestru Cen Nieruchomości udostępnianego publicznie przez geoportal. To ceny z aktów notarialnych. Zasięg zależy od powiatu: nie każdy starosta publikuje rejestr w tej usłudze, w dużych miastach dane zwykle są." },
      { q: "Czy to operat szacunkowy?", a: "Nie. To analiza porównawcza dla agenta i właściciela. Operat do banku albo sądu sporządza rzeczoznawca majątkowy." },
      { q: "Ile porównań bierze pod uwagę?", a: "Zbiera do kilkuset aktów z okolicy, odrzuca skrajne ceny i przypisuje wagi według odległości, daty, metrażu, liczby pokoi, rynku i piętra. W raporcie widać najbliższe porównania z adresem i ceną za metr." },
    ],
  },
  {
    slug: "portal-klienta",
    name: "Portal klienta",
    headline: "Klient widzi postęp sprzedaży, zamiast dzwonić z pytaniem „co słychać”",
    lead: "Każdy sprzedający i kupujący dostaje własny portal z logo Twojego biura: status oferty, zaplanowane prezentacje, wiadomości z opiekunem i powiadomienia na telefon.",
    seoTitle: "Portal klienta dla biura nieruchomości: status sprzedaży i wiadomości | AgentSpace",
    seoDescription: "Portal dla klientów biura nieruchomości: status oferty, prezentacje, czat z agentem i powiadomienia push. Dostęp linkiem albo kodem QR, bez zakładania konta.",
    problem: "Sprzedający nie widzi, co agent robi z jego mieszkaniem, więc dzwoni, pisze i po trzech tygodniach ciszy myśli o innym biurze. Agent traci godziny na relacjonowanie tego samego przez telefon, a i tak zostaje wrażenie, że nic się nie dzieje.",
    capabilities: [
      { title: "Wejście bez konta i hasła", body: "Klient dostaje link albo kod QR. Portal zapisuje się na ekranie telefonu jak aplikacja, z ikoną z logo Twojego biura." },
      { title: "Działania, które widać", body: "Prezentacje, telefony i zrobione kroki pokazujesz klientowi jednym kliknięciem. Planujesz termin, a po wszystkim oznaczasz jako zrobione." },
      { title: "Wiadomości w dwie strony", body: "Klient pisze z portalu, agent odpowiada ze skrzynki w aplikacji. Cała rozmowa zostaje w biurze, nie w prywatnym komunikatorze agenta." },
      { title: "Powiadomienia na telefon", body: "Klient dostaje powiadomienie o nowej wiadomości i ważnym kroku, agent o wiadomości od klienta. Do tego podpowiedzi, co zrobić po prezentacji albo przy negocjacji ceny." },
    ],
    forWhom: "Dla agentów z umowami na wyłączność, którzy chcą pokazać pracę, i dla właściciela biura, który chce mniej rezygnacji i więcej poleceń od zadowolonych klientów.",
    photo: "/zdjecia/odbior-kluczy.jpg",
    shot: "/strona/zrzuty/portal.webp",
    faq: [
      { q: "Czy klient musi zakładać konto?", a: "Nie. Wchodzi przez osobisty link albo kod QR. Dostęp możesz w każdej chwili wyłączyć." },
      { q: "Co klient widzi, a czego nie?", a: "Tylko to, co mu udostępnisz: swoją ofertę, działania oznaczone jako widoczne dla klienta i rozmowę z opiekunem. Notatki wewnętrzne biura zostają w CRM." },
      { q: "Czy działa na telefonie?", a: "Tak, portal jest zrobiony przede wszystkim pod telefon. Na iPhonie i Androidzie można go dodać do ekranu głównego i włączyć powiadomienia." },
    ],
  },
  {
    slug: "kredyty",
    name: "Doradca kredytowy",
    headline: "Klient z kredytem przekazany doradcy jednym kliknięciem",
    lead: "Agent przekazuje klienta doradcy kredytowemu prosto z karty klienta. Doradca prowadzi sprawę etapami, a agent i klient widzą, na czym stoi finansowanie.",
    seoTitle: "Doradca kredytowy w biurze nieruchomości: sprawy kredytowe w CRM | AgentSpace",
    seoDescription: "Moduł dla doradcy kredytowego w biurze nieruchomości: przekazanie klienta z CRM, etapy od analizy do umowy, lista dokumentów, prowizje i status kredytu w portalu klienta.",
    problem: "Transakcja upada najczęściej na finansowaniu, a agent dowiaduje się o tym ostatni. Doradca kredytowy pracuje w swoim Excelu, kupujący nie wie, jakich dokumentów brakuje, a biuro nie widzi, ile spraw wnosi współpraca z doradcą.",
    capabilities: [
      { title: "Przekazanie z karty klienta", body: "Agent wybiera doradcę, wpisuje kwotę i krótką notatkę. Doradca dostaje powiadomienie i sprawę z kontaktem do klienta." },
      { title: "Tablica etapów", body: "Nowe, analiza, dokumenty, wniosek, decyzja i umowa. Doradca przesuwa sprawę dalej, a agent widzi zmianę u siebie." },
      { title: "Lista dokumentów", body: "Gotowa lista do kredytu hipotecznego, którą doradca odhacza. Widać od razu, czego brakuje do złożenia wniosku." },
      { title: "Status w portalu klienta", body: "Kupujący widzi w swoim portalu etap kredytu i brakujące dokumenty. Zamiast dzwonić, sprawdza w telefonie." },
    ],
    forWhom: "Dla biur, które współpracują z doradcą kredytowym na miejscu albo z zewnątrz. Doradca dostaje osobną rolę i widzi tylko swoje sprawy, bez reszty CRM.",
    photo: "/zdjecia/transakcja.jpg",
    shot: "/strona/zrzuty/kredyty.webp",
    faq: [
      { q: "Czy doradca widzi całą bazę klientów?", a: "Nie. Rola doradcy kredytowego widzi tylko sprawy, które prowadzi. Agent widzi sprawy swoich klientów, właściciel wszystkie." },
      { q: "Czy to porównywarka ofert banków?", a: "Nie. To prowadzenie sprawy i współpraca z agentem. Wyliczenia i wnioski doradca robi w swoich narzędziach, a w AgentSpace zapisuje bank, kwotę i etap." },
      { q: "Czy można zapisać prowizje?", a: "Tak, przy sprawie są pola na prowizję z banku i wynagrodzenie za polecenie dla agenta." },
    ],
  },
  {
    slug: "swiadectwa-energetyczne",
    name: "Świadectwa energetyczne",
    headline: "Świadectwo energetyczne zamówione z karty oferty",
    lead: "Formularz zamówienia świadectwa charakterystyki energetycznej wypełnia się danymi oferty. Dodajesz zdjęcia budynku, wybierasz termin, a uprawniony audytor dostaje komplet od razu.",
    seoTitle: "Zamówienie świadectwa charakterystyki energetycznej dla agenta | AgentSpace",
    seoDescription: "Zamów świadectwo energetyczne mieszkania, domu albo lokalu prosto z CRM: formularz wypełniony danymi oferty, zdjęcia budynku, termin od 24 godzin.",
    problem: "Bez świadectwa nie sprzedasz ani nie wynajmiesz mieszkania, a ogłoszenie musi podawać wskaźnik energii. Agent przepisuje dane z oferty do formularza audytora, dosyła zdjęcia mailem i dzwoni pytać, na jakim etapie jest zamówienie.",
    capabilities: [
      { title: "Dane z oferty, nie z pamięci", body: "Adres, metraż i rok budowy wskakują z karty nieruchomości. Agent dopisuje tylko to, czego oferta nie ma: ogrzewanie, wentylację, materiał ścian i izolację." },
      { title: "Zdjęcia i rzuty w zamówieniu", body: "Zdjęcie budynku z zewnątrz, rzut mieszkania i świadectwo całego budynku, jeśli wspólnota je ma. Pliki idą razem z zamówieniem." },
      { title: "Termin do wyboru", body: "Standard do 2 dni roboczych albo Express w 24 godziny. Cenę netto i brutto widać przed wysłaniem." },
      { title: "Historia zamówień", body: "Lista zamówień biura z kartą PDF każdego z nich. Agent widzi swoje, właściciel wszystkie." },
    ],
    forWhom: "Dla agentów przy każdej nowej ofercie bez świadectwa. Dla właściciela, który chce jednego sprawdzonego wykonawcy zamiast szukania audytora przy każdej transakcji.",
    photo: "/wzory/dziedziniec.jpg",
    shot: "/strona/zrzuty/swiadectwa.webp",
    faq: [
      { q: "Kto sporządza świadectwo?", a: "Osoba z uprawnieniami wpisana do centralnego rejestru charakterystyki energetycznej budynków. Świadectwo jest ważne 10 lat." },
      { q: "Ile to kosztuje?", a: "Mieszkanie od 300 zł netto, dom i lokal użytkowy od 450 zł netto. Tryb Express to dopłata, widoczna w formularzu przed zamówieniem." },
      { q: "Czy muszę mieć świadectwo przy sprzedaży?", a: "Tak, przy sprzedaży i najmie właściciel przekazuje świadectwo nabywcy albo najemcy, a ogłoszenie podaje wskaźnik zapotrzebowania na energię." },
    ],
  },
  {
    slug: "biblioteka-technik",
    name: "Biblioteka technik",
    headline: "Techniki rozmowy i skrypty, które od razu przećwiczysz",
    lead: "Czterdzieści sześć technik cold callingu, negocjacji, perswazji i odpowiadania na obiekcje z przykładami z polskiego rynku, dziesięć skryptów rozmów krok po kroku i struktura dobrej rozmowy. Każdą technikę trenujesz z klientem AI jednym kliknięciem.",
    seoTitle: "Techniki sprzedaży i skrypty rozmów dla agenta nieruchomości | AgentSpace",
    seoDescription: "Biblioteka technik rozmowy dla agentów nieruchomości: SPIN, kotwiczenie, izolacja obiekcji, Voss, Cialdini. Skrypty zimnego telefonu, spotkania pozyskowego i negocjacji prowizji.",
    problem: "Szkolenie sprzedażowe kończy się po dwóch dniach, a w poniedziałek agent dzwoni tak samo jak przed nim. Wiedza z książek nie zamienia się w nawyk bez przećwiczenia na konkretnej, trudnej rozmowie.",
    capabilities: [
      { title: "Techniki z przykładami z rynku", body: "Każda technika ma opis, kiedy działa i kiedy nie, kroki, dialogi z rozmów o mieszkaniach, najczęstsze błędy i sygnały, że ktoś używa jej na Tobie." },
      { title: "Skrypty rozmów etap po etapie", body: "Zimny telefon do właściciela, oddzwonienie do leada, spotkanie pozyskowe, obniżka ceny, negocjacja prowizji. Kwestie, pytania i odpowiedzi na obiekcje." },
      { title: "Trening jednym kliknięciem", body: "Przy technice wybierasz rozmowę z AI Coachem. Kroki techniki widzisz przez cały trening, a po rozmowie dostajesz ocenę." },
      { title: "Struktura dobrej rozmowy", body: "Sześć etapów od otwarcia do zamknięcia, z typową pułapką każdego z nich. Wspólny język dla całego zespołu." },
      { title: "Rozmowy z rozgałęzieniami", body: "W każdym skrypcie wybierasz, co mówi klient, i widzisz, jak poprowadzić dalej. Każda droga kończy się terminem, furtką na później albo uczciwym zamknięciem." },
      { title: "Bank obiekcji", body: "Najczęstsze zdania klientów, od „nie współpracuję z biurami” po „ile da się zejść z ceny”, każde z trzema wersjami odpowiedzi: łagodnie, pewnie i pytaniem." },
      { title: "Akademia dla nowych", body: "Sześć modułów od pierwszej rozmowy do negocjacji, krótkie sprawdziany między nimi i egzamin końcowy. Właściciel widzi postęp i wyniki każdej osoby." },
    ],
    forWhom: "Dla agentów, którzy chcą lepiej rozmawiać, i dla właściciela, który wdraża nowe osoby: nowa osoba przechodzi Akademię krok po kroku, a Ty widzisz, gdzie jest. Część modułu AI Coach.",
    photo: "/zdjecia/rozmowa-audyt.jpg",
    shot: "/strona/zrzuty/techniki.webp",
    faq: [
      { q: "Czy techniki są etyczne?", a: "Tak. Przy technikach, które łatwo nadużyć, piszemy wprost, jak używać ich uczciwie. Uczymy też rozpoznawać manipulację po drugiej stronie." },
      { q: "Czy trening kosztuje dodatkowo?", a: "Biblioteka jest w AI Coachu. Rozmowa treningowa zużywa kredyty AI z pakietu biura, tak jak każdy trening." },
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
  return translated
    ? { slug, shot: base.shot, photo: base.photo, ilustracja: base.ilustracja, ...translated }
    : base;
}

/** Lista modułów w danym języku - do list i map strony. */
export function listModules(lang: string = "pl"): ProductModule[] {
  return MODULES.map((m) => getModule(m.slug, lang) ?? m);
}

/**
 * Podział modułów na cztery grupy.
 *
 * Szesnaście kafelków jeden pod drugim robiło ze strony głównej listę bez
 * końca. Grupy pozwalają pokazać naraz cztery pozycje zamiast szesnastu, a
 * ten sam podział obsługuje rozwijane menu „Produkt”, więc nazwy grup są
 * w jednym miejscu.
 *
 * Kolejność slugów w grupie = kolejność na stronie.
 */
export type KategoriaModulow = {
  id: string;
  label: string;
  labelEn: string;
  /** Jedno zdanie, po co ta grupa istnieje. */
  opis: string;
  opisEn: string;
  slugs: string[];
};

export const KATEGORIE_MODULOW: KategoriaModulow[] = [
  {
    id: "sprzedaz",
    label: "Sprzedaż i klienci",
    labelEn: "Sales and clients",
    opis: "Wszystko, co dzieje się między pierwszym telefonem a podpisaną umową.",
    opisEn: "Everything between the first phone call and a signed contract.",
    slugs: ["crm", "leady", "portal-klienta", "poszukiwania", "dzialania", "tablica-transakcji", "kredyty", "automatyzacje"],
  },
  {
    id: "oferty",
    label: "Oferty i marketing",
    labelEn: "Listings and marketing",
    opis: "Oferta biura w jednym miejscu i wszędzie tam, gdzie widzi ją klient.",
    opisEn: "Your listings in one place and everywhere the client sees them.",
    slugs: ["nieruchomosci", "wycena-rcn", "ofertowka", "strona-www", "swiadectwa-energetyczne", "kalkulatory", "kalkulator-remontu"],
  },
  {
    id: "rozliczenia",
    label: "Rozliczenia i dokumenty",
    labelEn: "Settlements and documents",
    opis: "Prowizje, faktury i papiery, których nikt nie chce pisać ręcznie.",
    opisEn: "Commissions, invoices and the paperwork nobody wants to retype.",
    slugs: ["prowizje", "faktury", "koszty-i-wynik", "dokumenty", "umowa-najmu-okazjonalnego", "rodo"],
  },
  {
    id: "zespol",
    label: "Zespół i wyniki",
    labelEn: "Team and results",
    opis: "Co robi zespół, ile dowozi i kto ma do czego dostęp.",
    opisEn: "What the team does, what it delivers and who can see what.",
    slugs: ["cele", "panel-wlasciciela", "raporty", "ai-coach", "biblioteka-technik", "role-i-uprawnienia", "czat-zespolu", "urlopy-i-zastepstwa"],
  },
];

/** Kategorie z gotowymi modułami w danym języku. */
export function kategorieZModulami(lang: string = "pl") {
  return KATEGORIE_MODULOW.map((k) => ({
    id: k.id,
    label: lang === "en" ? k.labelEn : k.label,
    opis: lang === "en" ? k.opisEn : k.opis,
    moduly: k.slugs.map((s) => getModule(s, lang)).filter((m): m is ProductModule => Boolean(m)),
  }));
}

/** Grupa, do której należy moduł - do okruszków i sekcji „podobne”. */
export function kategoriaModulu(slug: string, lang: string = "pl") {
  const k = KATEGORIE_MODULOW.find((x) => x.slugs.includes(slug));
  if (!k) return undefined;
  return {
    id: k.id,
    label: lang === "en" ? k.labelEn : k.label,
    opis: lang === "en" ? k.opisEn : k.opis,
    /** Pozostałe moduły z tej samej grupy. */
    sasiedzi: k.slugs
      .filter((s) => s !== slug)
      .map((s) => getModule(s, lang))
      .filter((m): m is ProductModule => Boolean(m)),
  };
}
