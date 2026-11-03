// Teoria dla agenta: krótka ścieżka z prawa nieruchomości, przygotowująca do
// egzaminu po szkoleniu Spectry. Tylko dla biura Spectra. Bez importów, żeby
// test (`npm run test:techniki`) sprawdzał pytania bez uruchamiania aplikacji.
//
// Treść oparta na materiale „Teoria dla początkującego agenta”, z poprawkami
// tam, gdzie materiał rozminął się z obowiązującymi przepisami (stawki podatku
// od darowizn, najem okazjonalny, hipoteka, termin 5 lat przy spadku).

export type Blok =
  | { t: "p"; tekst: string }
  | { t: "lista"; tytul?: string; pozycje: string[] }
  | { t: "wazne"; tekst: string };

export type Rozdzial = { id: string; tytul: string; minut: number; bloki: Blok[] };

export type PytanieTeorii = { id: string; rozdzial: string; pytanie: string; odpowiedzi: string[]; poprawna: number; wyjasnienie: string };

export type ModulTeorii = { nr: number; id: "m1" | "m2" | "m3"; nazwa: string; opis: string; kolor: "zielony" | "turkus" | "fiolet"; rozdzialy: Rozdzial[]; pytania: PytanieTeorii[] };

const SPECTRA = "fe78fb77-98e3-4e3e-831b-067c2fc4cc9e";

/** Ścieżka teorii jest tylko dla Spectry: to jej szkolenie i jej egzamin. */
export const maTeorie = (agencyId: string | null | undefined) => agencyId === SPECTRA;

const p = (tekst: string): Blok => ({ t: "p", tekst });
const lista = (pozycje: string[], tytul?: string): Blok => ({ t: "lista", pozycje, tytul });
const wazne = (tekst: string): Blok => ({ t: "wazne", tekst });

/* ═══════════════ MODUŁ I ═══════════════ */

const M1: ModulTeorii = {
  nr: 1,
  id: "m1",
  nazwa: "Prawo nieruchomości i formy własności",
  opis: "Czym jest nieruchomość, jakie są jej rodzaje i co tak naprawdę ma sprzedający: własność czy tylko prawo do lokalu.",
  kolor: "zielony",
  rozdzialy: [
    {
      id: "pojecie",
      tytul: "Pojęcie i rodzaje nieruchomości",
      minut: 4,
      bloki: [
        p("Nieruchomość to grunt i wszystko, co jest z nim trwale związane: budynki, domy, lokale. Kluczowa cecha to trwały związek z miejscem. Tym różni się od ruchomości, czyli mebli, samochodu czy sprzętu."),
        lista(["ma granice, prawne (ewidencja gruntów) albo fizyczne (płot, mur)", "ma swój numer ewidencyjny", "podlega ochronie prawnej"], "Każda nieruchomość"),
        lista(["korzystanie i zamieszkiwanie", "wynajem", "sprzedaż", "darowizna i dziedziczenie"], "Własność daje prawo do"),
        p("Własność nie jest absolutna. Ograniczają ją plany zagospodarowania przestrzennego, prawo budowlane, ochrona środowiska i prawa osób trzecich, np. służebności."),
        lista(["mieszkalne: mieszkania, domy, lokale mieszkalne", "gruntowe: działki zabudowane i niezabudowane", "lokalowe: wyodrębnione części budynków, mieszkalne albo użytkowe", "użytkowe: sklepy, biura, magazyny, hale"], "Rodzaje nieruchomości"),
        wazne("Każdy rodzaj ma inne przepisy. Inaczej wynajmuje się lokal mieszkalny, inaczej użytkowy, inaczej grunt. Złe zakwalifikowanie nieruchomości to realne ryzyko prawne."),
      ],
    },
    {
      id: "formy",
      tytul: "Formy własności",
      minut: 5,
      bloki: [
        p("Forma własności mówi, jakie prawa ma osoba, która „ma mieszkanie”, i co może z nim zrobić. Sprawdzasz ją jako pierwszą, przed ceną, lokalizacją i standardem."),
        lista([
          "Odrębna własność lokalu: najpełniejsze prawo. Właściciel ma lokal i udział w nieruchomości wspólnej (grunt, dach, klatki, instalacje).",
          "Spółdzielcze własnościowe prawo do lokalu: ograniczone prawo rzeczowe. Budynek i grunt należą do spółdzielni, ale prawo można sprzedać, darować, odziedziczyć i wynająć.",
          "Spółdzielcze lokatorskie prawo do lokalu: najsłabsze, zbliżone do najmu. Nie można go sprzedać, darować ani zapisać w spadku.",
        ]),
        lista(["sprzedaż", "dostęp do kredytu hipotecznego", "dziedziczenie", "ustanowienie hipoteki"], "Forma własności decyduje o"),
        wazne("Najczęstszy błąd początkującego: utożsamianie spółdzielczego prawa z własnością. Zakres praw zależy od rodzaju prawa, a nie od tego, że ktoś w lokalu mieszka."),
      ],
    },
    {
      id: "odrebna",
      tytul: "Odrębna własność lokalu",
      minut: 3,
      bloki: [
        p("Lokal prawnie wyodrębniony z budynku jest samodzielną nieruchomością i może być przedmiotem obrotu niezależnie od reszty budynku."),
        lista(["własną księgę wieczystą", "być sprzedany, darowany, odziedziczony", "być obciążony hipoteką"], "Taki lokal może mieć i może"),
        p("To najbezpieczniejsza i najbardziej przejrzysta forma. Banki ją preferują przy kredycie, a sprzedaż jest zwykle prostsza i szybsza."),
        lista(["rozpoznać, czy lokal ma odrębną własność", "sprawdzić księgę wieczystą", "wyjaśnić klientowi różnicę względem praw spółdzielczych"], "Agent musi umieć"),
      ],
    },
    {
      id: "spoldzielcze",
      tytul: "Prawa spółdzielcze i przekształcenie",
      minut: 5,
      bloki: [
        p("W zasobach spółdzielni właścicielem budynku i gruntu jest spółdzielnia. Lokator ma jedno z dwóch praw."),
        lista(["można je sprzedać, darować i odziedziczyć", "jest przedmiotem obrotu rynkowego", "może zabezpieczać kredyt", "może mieć własną księgę wieczystą"], "Spółdzielcze własnościowe prawo"),
        lista(["jest niezbywalne", "nie można go sprzedać ani darować", "wygasa z ustaniem członkostwa w spółdzielni"], "Spółdzielcze lokatorskie prawo"),
        p("Przekształcenie to uzyskanie odrębnej własności lokalu. Wymaga uregulowania zobowiązań wobec spółdzielni, uregulowanego stanu prawnego gruntu i aktu notarialnego."),
        lista(["lokal staje się samodzielną nieruchomością z księgą wieczystą", "właściciel ma pełnię praw", "rośnie wartość i łatwiej o kredyt i kupującego"], "Po przekształceniu"),
        lista(["Wkład mieszkaniowy: wnoszony przy prawie lokatorskim, nie odpowiada pełnej wartości lokalu.", "Wkład budowlany: dotyczy prawa własnościowego, odpowiada kosztom budowy lokalu."], "Wkłady"),
      ],
    },
    {
      id: "komunalne",
      tytul: "Lokale komunalne i socjalne",
      minut: 3,
      bloki: [
        p("Lokal komunalny należy do gminy. Mieszkający w nim jest najemcą, a nie właścicielem. Lokal socjalny to odmiana komunalnego: niższy standard, dla osób w najtrudniejszej sytuacji, ściśle regulowany przydział."),
        lista(["podlega szczególnym przepisom", "ogranicza rozporządzanie lokalem", "nie daje prawa własności"], "Najem lokalu komunalnego"),
        p("Najemca może czasem wykupić lokal komunalny, często z bonifikatą. Decyduje gmina i jej uchwały."),
        wazne("Rozróżniaj najem od własności i prawa lokatora od praw właściciela. Najemca lokalu komunalnego nie może go sprzedać."),
      ],
    },
  ],
  pytania: [
    { id: "m1-01", rozdzial: "pojecie", pytanie: "Co odróżnia nieruchomość od ruchomości?", odpowiedzi: ["Trwały związek z określonym miejscem", "Wartość powyżej określonej kwoty", "Obowiązek wpisu do ewidencji podatkowej", "Możliwość obciążenia jej zastawem"], poprawna: 0, wyjasnienie: "Nieruchomości nie da się przenieść bez naruszenia jej istoty. Wartość czy podatki niczego tu nie rozstrzygają." },
    { id: "m1-02", rozdzial: "pojecie", pytanie: "Co ogranicza sposób korzystania z własnej działki?", odpowiedzi: ["Tylko decyzja wspólnoty sąsiadów", "Plan miejscowy i prawa osób trzecich", "Wyłącznie umowa z gminą o użytkowanie", "Nic, jeśli działka jest w pełni opłacona"], poprawna: 1, wyjasnienie: "Własność nie jest absolutna: ograniczają ją m.in. plan zagospodarowania, prawo budowlane, ochrona środowiska i służebności." },
    { id: "m1-03", rozdzial: "pojecie", pytanie: "Do jakiej grupy należy lokal z biurem w kamienicy?", odpowiedzi: ["Nieruchomości gruntowe zabudowane", "Nieruchomości mieszkalne wielorodzinne", "Nieruchomości lokalowe użytkowe", "Nieruchomości rolne przekształcone"], poprawna: 2, wyjasnienie: "Wyodrębniona część budynku to nieruchomość lokalowa, a biuro nadaje jej charakter użytkowy." },
    { id: "m1-04", rozdzial: "formy", pytanie: "Które prawo do lokalu jest najsilniejsze?", odpowiedzi: ["Spółdzielcze własnościowe prawo", "Odrębna własność lokalu", "Spółdzielcze lokatorskie prawo", "Najem lokalu komunalnego"], poprawna: 1, wyjasnienie: "Odrębna własność to pełne prawo do lokalu razem z udziałem w nieruchomości wspólnej." },
    { id: "m1-05", rozdzial: "formy", pytanie: "Klient chce sprzedać mieszkanie z prawem lokatorskim. Co mu mówisz?", odpowiedzi: ["Sprzedaż przejdzie, tylko taniej o kilka procent", "Może sprzedać, ale wyłącznie członkowi spółdzielni", "Tego prawa nie da się sprzedać ani darować", "Musi najpierw spłacić wkład budowlany do banku"], poprawna: 2, wyjasnienie: "Prawo lokatorskie jest niezbywalne. Najpierw trzeba je przekształcić, np. we własność." },
    { id: "m1-06", rozdzial: "formy", pytanie: "Co sprawdzasz jako pierwsze, gdy dostajesz nową ofertę?", odpowiedzi: ["Cenę za metr w porównaniu z okolicą", "Stan techniczny i standard wykończenia", "Formę własności nieruchomości", "Odległość od komunikacji miejskiej"], poprawna: 2, wyjasnienie: "Forma własności decyduje, czy i jak można sprzedać lokal, wziąć kredyt i ustanowić hipotekę. Cena jest później." },
    { id: "m1-07", rozdzial: "odrebna", pytanie: "Co ma właściciel lokalu poza samym lokalem?", odpowiedzi: ["Udział w nieruchomości wspólnej", "Prawo pierwokupu sąsiednich lokali", "Członkostwo w spółdzielni mieszkaniowej", "Służebność przejazdu przez cały grunt"], poprawna: 0, wyjasnienie: "Odrębna własność to lokal plus udział w gruncie i częściach wspólnych budynku." },
    { id: "m1-08", rozdzial: "odrebna", pytanie: "Dlaczego banki chętniej kredytują lokale z odrębną własnością?", odpowiedzi: ["Bo są zwolnione z podatku od nieruchomości", "Bo mają księgę wieczystą i jasny stan prawny", "Bo ich cena jest zawsze niższa od rynkowej", "Bo nie wymagają aktu notarialnego przy zakupie"], poprawna: 1, wyjasnienie: "Przejrzysty stan prawny i księga wieczysta pozwalają bankowi bezpiecznie wpisać hipotekę." },
    { id: "m1-09", rozdzial: "spoldzielcze", pytanie: "Kto jest właścicielem budynku przy spółdzielczym własnościowym prawie?", odpowiedzi: ["Osoba posiadająca prawo do lokalu", "Gmina, na której terenie stoi budynek", "Spółdzielnia mieszkaniowa", "Wspólnota mieszkaniowa lokatorów"], poprawna: 2, wyjasnienie: "Przy prawach spółdzielczych budynek i grunt należą do spółdzielni." },
    { id: "m1-10", rozdzial: "spoldzielcze", pytanie: "Co jest potrzebne do przekształcenia prawa w odrębną własność?", odpowiedzi: ["Zgoda wszystkich sąsiadów z klatki", "Akt notarialny i rozliczenie ze spółdzielnią", "Wyłącznie wniosek złożony w urzędzie gminy", "Decyzja banku, który udzielił kredytu"], poprawna: 1, wyjasnienie: "Trzeba uregulować zobowiązania wobec spółdzielni, mieć uregulowany grunt i zawrzeć akt notarialny." },
    { id: "m1-11", rozdzial: "spoldzielcze", pytanie: "Czym różni się wkład budowlany od mieszkaniowego?", odpowiedzi: ["Budowlany odpowiada kosztom budowy lokalu", "Mieszkaniowy płaci się tylko przy zakupie", "Budowlany dotyczy wyłącznie lokali komunalnych", "Mieszkaniowy jest zawsze zwracany w całości"], poprawna: 0, wyjasnienie: "Wkład budowlany (prawo własnościowe) odpowiada kosztom budowy. Mieszkaniowy (prawo lokatorskie) nie pokrywa pełnej wartości lokalu." },
    { id: "m1-12", rozdzial: "spoldzielcze", pytanie: "Jak przekształcenie wpływa zwykle na lokal?", odpowiedzi: ["Obniża wartość przez wyższe podatki", "Podnosi wartość i ułatwia kredyt", "Nie zmienia niczego poza nazwą prawa", "Wymusza wyprowadzkę na czas wpisu"], poprawna: 1, wyjasnienie: "Lokal staje się samodzielną nieruchomością z księgą wieczystą, więc łatwiej go sprzedać i sfinansować." },
    { id: "m1-13", rozdzial: "komunalne", pytanie: "Kim jest osoba mieszkająca w lokalu komunalnym?", odpowiedzi: ["Właścicielem z ograniczonym prawem", "Członkiem spółdzielni gminnej", "Najemcą lokalu należącego do gminy", "Użytkownikiem wieczystym lokalu"], poprawna: 2, wyjasnienie: "Lokal komunalny jest własnością gminy, a mieszkaniec go wynajmuje." },
    { id: "m1-14", rozdzial: "komunalne", pytanie: "Najemca komunalnego mieszkania chce je sprzedać. Co jest prawdą?", odpowiedzi: ["Może je sprzedać po 5 latach najmu", "Musi najpierw wykupić lokal od gminy", "Może sprzedać sam udział w gruncie", "Sprzedaje je za zgodą zarządcy budynku"], poprawna: 1, wyjasnienie: "Najem nie daje własności. Najpierw wykup od gminy (często z bonifikatą), dopiero potem sprzedaż." },
    { id: "m1-15", rozdzial: "komunalne", pytanie: "Czym wyróżnia się lokal socjalny?", odpowiedzi: ["Niższym standardem i ścisłymi zasadami", "Tym, że należy do spółdzielni mieszkaniowej", "Brakiem opłat za media dla najemcy", "Możliwością wykupu za symboliczną złotówkę"], poprawna: 0, wyjasnienie: "To lokal komunalny o niższym standardzie, dla osób w najtrudniejszej sytuacji, ze ściśle regulowanym przydziałem." },
  ],
};

/* ═══════════════ MODUŁ II ═══════════════ */

const M2: ModulTeorii = {
  nr: 2,
  id: "m2",
  nazwa: "Obrót nieruchomościami i bezpieczeństwo",
  opis: "Jak przechodzi własność: kupno, darowizna, spadek, bonifikata. Umowa przedwstępna, zadatek, podatki i obowiązki nowego właściciela.",
  kolor: "turkus",
  rozdzialy: [
    {
      id: "nabycie",
      tytul: "Sposoby nabycia nieruchomości",
      minut: 5,
      bloki: [
        lista([
          "Kupno: wyłącznie w formie aktu notarialnego, inaczej umowa jest nieważna. Właściciela w księdze wieczystej zmienia wydział ksiąg wieczystych sądu rejonowego.",
          "Darowizna: nieodpłatne przekazanie, także osobie niespokrewnionej. Wymaga aktu notarialnego, a notariusz zgłasza ją do urzędu skarbowego.",
          "Spadek: przechodzi z mocy prawa w chwili śmierci właściciela. Spadkobierca może spadek przyjąć albo odrzucić.",
          "Bonifikata: gmina sprzedająca lokal komunalny najemcy może obniżyć cenę, w praktyce często o 90%.",
        ]),
        wazne("Bonifikata ma haczyk: gdy nabywca sprzeda lokal albo użyje go na inne cele przed upływem 5 lat, gmina może żądać zwrotu bonifikaty po waloryzacji. Są wyjątki, np. sprzedaż osobie bliskiej."),
      ],
    },
    {
      id: "sprzedaz",
      tytul: "Umowa sprzedaży",
      minut: 4,
      bloki: [
        p("Umowa sprzedaży przenosi własność ze sprzedającego na kupującego. Wymaga aktu notarialnego."),
        lista([
          "Własność przechodzi w chwili zawarcia aktu. Wpis do księgi wieczystej to potwierdzenie, które daje skuteczność wobec osób trzecich.",
          "Kupujący na rynku wtórnym płaci PCC 2%. Pierwsze mieszkanie lub dom kupowane przez osobę fizyczną bywa z PCC zwolnione.",
          "Sprzedający odpowiada za wady fizyczne i prawne, kupujący za zapłatę ceny.",
        ]),
        lista(["sprawdź księgę wieczystą", "sprawdź, czy sprzedający jest właścicielem i nie ma ograniczeń", "koordynuj akt z notariuszem", "wyjaśnij klientowi podatki i opłaty", "dopilnuj wpisu do księgi po akcie"], "Twoja procedura"),
      ],
    },
    {
      id: "przedwstepna",
      tytul: "Umowa przedwstępna, zadatek i zaliczka",
      minut: 6,
      bloki: [
        p("Umowa przedwstępna to zobowiązanie do zawarcia w przyszłości umowy sprzedaży. Określa nieruchomość, cenę i termin umowy przyrzeczonej."),
        lista([
          "Forma pisemna: gdy druga strona się wycofa, możesz żądać odszkodowania, ale nie zmusisz jej do sprzedaży.",
          "Forma aktu notarialnego: możesz w sądzie żądać zawarcia umowy przyrzeczonej. Dlatego przy dużej transakcji polecasz akt.",
        ], "Forma ma znaczenie"),
        lista([
          "Zadatek: zabezpiecza umowę. Gdy nie wykona jej kupujący, sprzedający zatrzymuje zadatek. Gdy nie wykona sprzedający, oddaje zadatek w podwójnej wysokości (art. 394 Kodeksu cywilnego).",
          "Zaliczka: zwykła przedpłata na poczet ceny. Gdy umowa nie dojdzie do skutku, wraca w całości i nic więcej z niej nie wynika.",
        ], "Zadatek a zaliczka"),
        wazne("Klient musi wiedzieć, co wpłaca. Każdą wpłatę dokumentuj na piśmie albo w akcie, z kwotą, terminem i warunkami utraty."),
      ],
    },
    {
      id: "darowizna",
      tytul: "Darowizna i podatek",
      minut: 6,
      bloki: [
        p("Darowizna nieruchomości to nieodpłatne przeniesienie własności w formie aktu notarialnego. Wysokość podatku zależy od grupy podatkowej obdarowanego i wartości."),
        lista([
          "Najbliższa rodzina (małżonek, dzieci i wnuki, rodzice i dziadkowie, pasierb, rodzeństwo, ojczym, macocha): całkowite zwolnienie, jeśli zgłosi się nabycie do urzędu skarbowego w 6 miesięcy. Przy akcie notarialnym zgłoszenia zwykle dokonuje notariusz.",
          "Grupa I (m.in. powyższa rodzina bez zgłoszenia, a także teściowie, zięć, synowa): 3%, 5%, 7%.",
          "Grupa II (m.in. siostrzeńcy i bratankowie, wujostwo, małżonkowie rodzeństwa): 7%, 9%, 12%.",
          "Grupa III (pozostali, także osoby obce): 12%, 16%, 20%.",
        ], "Grupy podatkowe"),
        p("Stawki rosną progowo z wartością nadwyżki ponad kwotę wolną. Darowizna liczy się też przy zachowku. Cofnąć ją można tylko wyjątkowo, np. przy rażącej niewdzięczności."),
        wazne("Przy dużych kwotach nie wyliczaj klientowi podatku sam: pokaż grupę i stawki, a dokładne wyliczenie zostaw doradcy podatkowemu albo notariuszowi."),
      ],
    },
    {
      id: "spadek",
      tytul: "Dziedziczenie i sprzedaż ze spadku",
      minut: 6,
      bloki: [
        lista([
          "Ustawowe: bez testamentu, według kolejności z Kodeksu cywilnego (dzieci i małżonek, potem rodzice i rodzeństwo).",
          "Testamentowe: spadkodawca wskazuje spadkobierców.",
        ], "Rodzaje dziedziczenia"),
        p("Kilku spadkobierców to współwłasność ułamkowa. Nabycie potwierdza akt poświadczenia dziedziczenia u notariusza albo postanowienie sądu. Potem trzeba wpisać właścicieli do księgi wieczystej."),
        p("Podatek od spadku liczy się według tych samych grup co darowizna. Najbliższa rodzina jest zwolniona po zgłoszeniu w 6 miesięcy od uprawomocnienia postanowienia sądu albo zarejestrowania aktu poświadczenia dziedziczenia."),
        wazne("Sprzedaż mieszkania ze spadku: PIT 19% od dochodu, jeśli sprzedaż jest przed upływem 5 lat. Od 2023 roku te 5 lat liczy się od końca roku, w którym nieruchomość nabył zmarły, a nie spadkobierca. Często więc sprzedaż od razu po spadku jest już bez podatku."),
        p("Spadkobiercy przejmują też długi związane z nieruchomością, np. hipotekę."),
      ],
    },
    {
      id: "obowiazki",
      tytul: "Obowiązki nowego właściciela",
      minut: 3,
      bloki: [
        lista([
          "wpis do księgi wieczystej",
          "zgłoszenie nieruchomości do podatku od nieruchomości w gminie",
          "zgłoszenie spadku albo darowizny do urzędu skarbowego w terminie",
          "przejęcie hipotek, służebności i umów najmu, które obciążają nieruchomość",
          "przy współwłasności: udział w kosztach i decyzjach",
          "aktualizacja ewidencji gruntów i budynków, a w razie potrzeby meldunku",
        ]),
      ],
    },
  ],
  pytania: [
    { id: "m2-01", rozdzial: "nabycie", pytanie: "W jakiej formie musi być zawarta sprzedaż mieszkania?", odpowiedzi: ["Pisemnej z podpisami poświadczonymi", "Aktu notarialnego", "Pisemnej z datą pewną z urzędu", "Dowolnej, jeśli cena jest zapłacona"], poprawna: 1, wyjasnienie: "Bez aktu notarialnego umowa sprzedaży nieruchomości jest nieważna." },
    { id: "m2-02", rozdzial: "nabycie", pytanie: "Kiedy spadkobierca nabywa spadek?", odpowiedzi: ["Z chwilą śmierci spadkodawcy", "Z chwilą wpisu do księgi wieczystej", "Po zapłacie podatku od spadku", "Po odczytaniu testamentu u notariusza"], poprawna: 0, wyjasnienie: "Spadek przechodzi z mocy prawa w chwili śmierci. Akt notarialny lub postanowienie sądu to potwierdzenie." },
    { id: "m2-03", rozdzial: "nabycie", pytanie: "Klient kupił lokal komunalny z bonifikatą 3 lata temu i chce sprzedać. Co go czeka?", odpowiedzi: ["Nic, bonifikata jest bezwarunkowa", "Gmina może żądać zwrotu bonifikaty", "Dopłata 2% PCC do ceny z bonifikatą", "Obowiązek sprzedaży z powrotem gminie"], poprawna: 1, wyjasnienie: "Przed upływem 5 lat gmina może żądać zwrotu zwaloryzowanej bonifikaty (z wyjątkami, np. dla osób bliskich)." },
    { id: "m2-04", rozdzial: "sprzedaz", pytanie: "Kiedy kupujący staje się właścicielem mieszkania?", odpowiedzi: ["W chwili podpisania aktu notarialnego", "Dopiero po wpisie do księgi wieczystej", "Po przekazaniu kluczy i protokole", "Po zapłacie podatku PCC w urzędzie"], poprawna: 0, wyjasnienie: "Własność lokalu przechodzi z aktem. Wpis do księgi daje skuteczność wobec osób trzecich, ale nie tworzy własności." },
    { id: "m2-05", rozdzial: "sprzedaz", pytanie: "Ile wynosi PCC przy zakupie mieszkania z rynku wtórnego?", odpowiedzi: ["1% ceny", "2% ceny", "8% ceny", "23% ceny"], poprawna: 1, wyjasnienie: "Standardowo 2%. Pierwsze mieszkanie kupowane przez osobę fizyczną może być zwolnione." },
    { id: "m2-06", rozdzial: "sprzedaz", pytanie: "Kto odpowiada za wady prawne sprzedanej nieruchomości?", odpowiedzi: ["Notariusz, który sporządził akt", "Pośrednik, który znalazł kupującego", "Sprzedający", "Sąd prowadzący księgę wieczystą"], poprawna: 2, wyjasnienie: "Za wady fizyczne i prawne odpowiada sprzedający. Dlatego tak ważne jest sprawdzenie księgi przed aktem." },
    { id: "m2-07", rozdzial: "przedwstepna", pytanie: "Sprzedający wycofuje się z przedwstępnej zawartej u notariusza. Co może kupujący?", odpowiedzi: ["Wyłącznie odzyskać wpłaconą zaliczkę", "Żądać w sądzie zawarcia umowy sprzedaży", "Tylko zawiadomić rzecznika konsumentów", "Nic, przedwstępna nie zobowiązuje"], poprawna: 1, wyjasnienie: "Forma notarialna daje tzw. skutek silniejszy: sąd może zastąpić oświadczenie sprzedającego." },
    { id: "m2-08", rozdzial: "przedwstepna", pytanie: "Przy przedwstępnej w zwykłej formie pisemnej druga strona się wycofuje. Co przysługuje?", odpowiedzi: ["Żądanie przeniesienia własności w sądzie", "Odszkodowanie za poniesione straty", "Automatyczny wpis do księgi wieczystej", "Prawo do zamieszkania w lokalu"], poprawna: 1, wyjasnienie: "Forma pisemna daje tylko skutek słabszy, czyli odszkodowanie. Zmusić do sprzedaży nie można." },
    { id: "m2-09", rozdzial: "przedwstepna", pytanie: "Kupujący nie przystąpił do aktu z własnej winy. Co z zadatkiem?", odpowiedzi: ["Sprzedający go zatrzymuje", "Wraca do kupującego w całości", "Wraca do kupującego w podwójnej wysokości", "Trafia do depozytu notarialnego"], poprawna: 0, wyjasnienie: "Gdy umowy nie wykona strona, która dała zadatek, druga strona może go zatrzymać." },
    { id: "m2-10", rozdzial: "przedwstepna", pytanie: "Sprzedający nie przystąpił do aktu z własnej winy. Co z zadatkiem?", odpowiedzi: ["Zatrzymuje go jako rekompensatę", "Oddaje go w podwójnej wysokości", "Oddaje go bez odsetek", "Przekazuje go pośrednikowi"], poprawna: 1, wyjasnienie: "Strona, która otrzymała zadatek i nie wykonała umowy, oddaje go w podwójnej wysokości." },
    { id: "m2-11", rozdzial: "przedwstepna", pytanie: "Czym zaliczka różni się od zadatku?", odpowiedzi: ["Zaliczka jest wyższa i płacona u notariusza", "Zaliczka wraca, gdy umowa nie dojdzie do skutku", "Zaliczka przepada, gdy wycofa się kupujący", "Zaliczka jest możliwa tylko przy najmie"], poprawna: 1, wyjasnienie: "Zaliczka to zwykła przedpłata. Nie zabezpiecza umowy i wraca w całości." },
    { id: "m2-12", rozdzial: "darowizna", pytanie: "Ojciec daruje synowi mieszkanie. Kiedy syn nie zapłaci podatku?", odpowiedzi: ["Zawsze, darowizna w rodzinie jest bez podatku", "Gdy nabycie zostanie zgłoszone w 6 miesięcy", "Gdy mieszkanie jest warte mniej niż 500 tys. zł", "Gdy syn zamieszka w nim na stałe przez rok"], poprawna: 1, wyjasnienie: "Najbliższa rodzina jest zwolniona pod warunkiem zgłoszenia w 6 miesięcy. Przy akcie zwykle robi to notariusz." },
    { id: "m2-13", rozdzial: "darowizna", pytanie: "W której grupie podatkowej jest osoba niespokrewniona?", odpowiedzi: ["Grupa 0", "Grupa I", "Grupa II", "Grupa III"], poprawna: 3, wyjasnienie: "Osoby obce są w grupie III: stawki 12%, 16% i 20%." },
    { id: "m2-14", rozdzial: "darowizna", pytanie: "Jakie są stawki podatku od darowizny dla grupy III?", odpowiedzi: ["3%, 5% i 7%", "7%, 9% i 12%", "12%, 16% i 20%", "20%, 24% i 32%"], poprawna: 2, wyjasnienie: "Grupa I: 3, 5, 7%. Grupa II: 7, 9, 12%. Grupa III: 12, 16, 20%." },
    { id: "m2-15", rozdzial: "spadek", pytanie: "Babcia kupiła mieszkanie w 2010 r., wnuk odziedziczył je w 2026 r. Sprzedaje od razu. PIT?", odpowiedzi: ["19% od całej ceny sprzedaży", "19% od dochodu, bo minęło mniej niż 5 lat", "Bez PIT, liczy się nabycie przez babcię", "Bez PIT tylko po zameldowaniu na rok"], poprawna: 2, wyjasnienie: "Od 2023 r. 5 lat przy spadku liczy się od końca roku nabycia przez spadkodawcę. Tu minęło dużo więcej." },
    { id: "m2-16", rozdzial: "spadek", pytanie: "Trzech spadkobierców dziedziczy jedno mieszkanie. Jaka to sytuacja?", odpowiedzi: ["Każdy dostaje osobny pokój z mocy prawa", "Współwłasność ułamkowa całego mieszkania", "Własność przechodzi na najstarszego", "Mieszkanie przejmuje gmina do podziału"], poprawna: 1, wyjasnienie: "Wspólne dziedziczenie tworzy współwłasność ułamkową. Do sprzedaży całości potrzebna jest zgoda wszystkich." },
    { id: "m2-17", rozdzial: "obowiazki", pytanie: "Co musi zrobić nowy właściciel w gminie?", odpowiedzi: ["Złożyć informację do podatku od nieruchomości", "Zarejestrować umowę sprzedaży w urzędzie", "Uzyskać zgodę na zamieszkanie", "Opłacić podatek PCC w kasie gminy"], poprawna: 0, wyjasnienie: "Właściciel zgłasza nieruchomość do podatku od nieruchomości. PCC płaci się do urzędu skarbowego (przy akcie pobiera go notariusz)." },
  ],
};

/* ═══════════════ MODUŁ III ═══════════════ */

const M3: ModulTeorii = {
  nr: 3,
  id: "m3",
  nazwa: "Praktyka prawna agenta",
  opis: "Współwłasność, księgi wieczyste, hipoteka i ograniczone prawa rzeczowe, najem okazjonalny, koszty transakcji i umowa na wyłączność.",
  kolor: "fiolet",
  rozdzialy: [
    {
      id: "wspolwlasnosc",
      tytul: "Współwłasność, quoad usum, zniesienie",
      minut: 6,
      bloki: [
        lista([
          "Ułamkowa: każdy ma określony udział (np. 1/2) i może nim sam rozporządzać, np. sprzedać swój udział.",
          "Łączna: najczęściej małżeńska, bez udziałów. Decyzje wymagają zgody obojga.",
        ], "Rodzaje współwłasności"),
        p("Współwłaściciel może rozporządzać tylko swoim udziałem. Całość sprzedaje się za zgodą wszystkich. Koszty i podatki ponoszą wspólnie."),
        p("Podział do korzystania (quoad usum) ustala, kto z której części korzysta, np. który pokój albo kawałek działki. Nie zmienia udziałów ani nie znosi współwłasności."),
        lista(["fizyczny podział (osobne lokale albo działki)", "przyznanie całości jednemu ze spłatą pozostałych", "sprzedaż i podział pieniędzy"], "Zniesienie współwłasności: umową albo przez sąd"),
        wazne("Każdy współwłaściciel może żądać zniesienia współwłasności. Gdy nie ma zgody, decyduje sąd."),
      ],
    },
    {
      id: "ksiegi",
      tytul: "Księgi wieczyste",
      minut: 6,
      bloki: [
        p("Księgi wieczyste prowadzą sądy rejonowe. Są jawne: każdy może je sprawdzić po numerze. Wpis cieszy się rękojmią wiary publicznej, czyli chroni tego, kto w dobrej wierze kupił od osoby wpisanej jako właściciel."),
        lista([
          "Dział I-O: oznaczenie nieruchomości (położenie, działki, powierzchnia).",
          "Dział I-Sp: spis praw związanych z własnością, np. udział w nieruchomości wspólnej, służebność na rzecz tej nieruchomości.",
          "Dział II: właściciele (albo użytkownicy wieczyści) i ich udziały.",
          "Dział III: prawa, roszczenia i ograniczenia, np. służebności, prawo pierwokupu, wzmianki o egzekucji.",
          "Dział IV: hipoteki.",
        ], "Cztery działy"),
        wazne("Przed każdą transakcją czytasz wszystkie działy. Dział III i IV mówią, czy coś obciąża nieruchomość."),
      ],
    },
    {
      id: "prawa",
      tytul: "Ograniczone prawa rzeczowe i hipoteka",
      minut: 7,
      bloki: [
        p("Ograniczone prawo rzeczowe to prawo innej osoby do cudzej nieruchomości. Jest skuteczne wobec każdego kolejnego właściciela."),
        lista([
          "Służebność gruntowa: np. prawo przejścia albo przejazdu przez działkę sąsiada.",
          "Służebność osobista: np. dożywotnie prawo mieszkania dla konkretnej osoby.",
          "Spółdzielcze własnościowe prawo do lokalu.",
          "Hipoteka: zabezpieczenie długu na nieruchomości.",
        ], "Najważniejsze"),
        p("Użytkowanie wieczyste gruntu to osobne prawo, na 40 do 99 lat, z opłatą roczną dla Skarbu Państwa albo gminy. Grunty pod budynkami mieszkalnymi przekształciły się we własność z mocy prawa od 2019 roku. Prawo pierwokupu (np. gminy) daje pierwszeństwo kupna."),
        lista([
          "Umowna: najczęściej przy kredycie hipotecznym.",
          "Przymusowa: wpisywana na wniosek wierzyciela, np. z wyroku albo decyzji urzędu skarbowego.",
          "Łączna: jedna hipoteka na kilku nieruchomościach.",
        ], "Rodzaje hipoteki"),
        wazne("Mieszkanie z hipoteką można sprzedać: hipoteka idzie za nieruchomością. W praktyce bank wydaje zaświadczenie o kwocie spłaty, kupujący płaci tę część prosto do banku, a sprzedający dostaje promesę wykreślenia hipoteki."),
        p("Hipoteka powstaje dopiero z wpisem do działu IV. To jeden z wyjątków, w których wpis tworzy prawo."),
      ],
    },
    {
      id: "okazjonalny",
      tytul: "Najem okazjonalny",
      minut: 5,
      bloki: [
        p("Najem okazjonalny to najem lokalu mieszkalnego, który daje właścicielowi szybką drogę do odzyskania lokalu."),
        lista([
          "Właściciel jest osobą fizyczną, która nie prowadzi działalności w zakresie wynajmu lokali.",
          "Umowa na piśmie i na czas oznaczony, najwyżej 10 lat.",
          "Najemca składa u notariusza oświadczenie o poddaniu się egzekucji i opróżnieniu lokalu.",
          "Najemca wskazuje lokal zastępczy, a jego właściciel pisemnie się zgadza (z podpisem poświadczonym notarialnie).",
          "Właściciel zgłasza najem do urzędu skarbowego w 14 dni od początku najmu.",
        ], "Warunki"),
        p("Po zakończeniu umowy, gdy najemca nie wychodzi, właściciel uzyskuje klauzulę wykonalności do oświadczenia notarialnego i eksmisja jest dużo szybsza niż przy zwykłym najmie."),
        wazne("Brak zgłoszenia do urzędu skarbowego w 14 dni odbiera ochronę najmu okazjonalnego. To najczęstszy błąd."),
      ],
    },
    {
      id: "koszty",
      tytul: "Koszty transakcji",
      minut: 5,
      bloki: [
        lista([
          "Taksa notarialna: zależy od wartości, ma ustawowe maksimum (dla 500 tys. zł to około 2 770 zł netto), do tego VAT i wypisy.",
          "Wpis własności do księgi wieczystej: 200 zł. Wpis hipoteki: 200 zł.",
          "PCC: 2% przy zakupie z rynku wtórnego (bywa zwolnienie przy pierwszym mieszkaniu).",
          "PIT 19% od dochodu przy sprzedaży przed upływem 5 lat od końca roku nabycia.",
          "Podatek od spadków i darowizn według grupy.",
          "Prowizja pośrednika, zwykle 1 do 3%, oraz koszty kredytu (prowizja, ubezpieczenia, wycena).",
        ]),
        wazne("Łącznie koszty to zwykle od 3 do 7% wartości. Klient ma je znać przed podpisaniem umowy, nie przy notariuszu."),
      ],
    },
    {
      id: "wylacznosc",
      tytul: "Zalety umowy na wyłączność",
      minut: 3,
      bloki: [
        lista([
          "pełne zaangażowanie jednego pośrednika",
          "spójny marketing i jedna strategia negocjacji",
          "kontrola nad tym, kto ogląda nieruchomość",
          "obsługa formalności od dokumentów do aktu",
          "rzetelna analiza rynku i właściwa cena",
          "szybsza transakcja bez chaosu kilku biur",
        ]),
        wazne("Argument dla klienta: przy wyłączności pośrednik inwestuje w jego nieruchomość, bo wie, że ta praca nie przepadnie."),
      ],
    },
  ],
  pytania: [
    { id: "m3-01", rozdzial: "wspolwlasnosc", pytanie: "Współwłaściciel ma 1/2 mieszkania. Co może sprzedać bez zgody drugiego?", odpowiedzi: ["Całe mieszkanie po wycenie biegłego", "Wyłącznie swój udział 1/2", "Nic, potrzebna jest zawsze zgoda", "Połowę pokoi według swojego wyboru"], poprawna: 1, wyjasnienie: "Przy współwłasności ułamkowej każdy rozporządza tylko swoim udziałem." },
    { id: "m3-02", rozdzial: "wspolwlasnosc", pytanie: "Czym jest podział quoad usum?", odpowiedzi: ["Fizycznym podziałem lokalu na dwa", "Ustaleniem, kto z której części korzysta", "Sprzedażą udziałów jednemu z właścicieli", "Wpisem nowych udziałów do księgi"], poprawna: 1, wyjasnienie: "Quoad usum ustala sposób korzystania. Udziały i współwłasność zostają bez zmian." },
    { id: "m3-03", rozdzial: "wspolwlasnosc", pytanie: "Rodzeństwo nie może dogadać się co do wspólnego mieszkania. Co można zrobić?", odpowiedzi: ["Każde może żądać zniesienia współwłasności", "Mieszkanie przejmuje gmina do sprzedaży", "Trzeba czekać 10 lat na zasiedzenie", "Decyzję podejmuje wspólnota mieszkaniowa"], poprawna: 0, wyjasnienie: "Każdy współwłaściciel może żądać zniesienia. Bez porozumienia rozstrzyga sąd." },
    { id: "m3-04", rozdzial: "ksiegi", pytanie: "W którym dziale księgi wieczystej są hipoteki?", odpowiedzi: ["Dział I-O", "Dział II", "Dział III", "Dział IV"], poprawna: 3, wyjasnienie: "Dział IV to hipoteki. Dział III to inne prawa, roszczenia i ograniczenia." },
    { id: "m3-05", rozdzial: "ksiegi", pytanie: "Gdzie sprawdzisz, kto jest właścicielem?", odpowiedzi: ["Dział I-Sp", "Dział II", "Dział III", "Dział IV"], poprawna: 1, wyjasnienie: "Dział II wymienia właścicieli i ich udziały." },
    { id: "m3-06", rozdzial: "ksiegi", pytanie: "Gdzie szukasz służebności przejazdu obciążającej działkę?", odpowiedzi: ["Dział I-O", "Dział II", "Dział III", "Dział IV"], poprawna: 2, wyjasnienie: "Obciążenia, np. służebności i prawo pierwokupu, są w dziale III." },
    { id: "m3-07", rozdzial: "ksiegi", pytanie: "Co daje rękojmia wiary publicznej ksiąg wieczystych?", odpowiedzi: ["Chroni kupującego w dobrej wierze", "Zwalnia z obowiązku aktu notarialnego", "Gwarantuje stan techniczny budynku", "Zastępuje wycenę rzeczoznawcy"], poprawna: 0, wyjasnienie: "Kto w dobrej wierze kupił od osoby wpisanej jako właściciel, jest chroniony, nawet gdy wpis był niezgodny z rzeczywistością." },
    { id: "m3-08", rozdzial: "prawa", pytanie: "Klient ma mieszkanie z hipoteką i chce sprzedać. Co mówisz?", odpowiedzi: ["Najpierw musi spłacić kredyt z oszczędności", "Może sprzedać, część ceny idzie na spłatę banku", "Nie może sprzedać do końca okresu kredytu", "Musi przenieść kredyt na kupującego"], poprawna: 1, wyjasnienie: "Hipoteka nie blokuje sprzedaży. Bank podaje kwotę spłaty, kupujący przelewa ją do banku, a hipoteka zostaje wykreślona." },
    { id: "m3-09", rozdzial: "prawa", pytanie: "Kiedy powstaje hipoteka?", odpowiedzi: ["Z podpisaniem umowy kredytu", "Z wpisem do działu IV księgi", "Z wypłatą pierwszej transzy", "Z podpisaniem aktu kupna mieszkania"], poprawna: 1, wyjasnienie: "Wpis hipoteki jest konstytutywny: bez wpisu hipoteki nie ma." },
    { id: "m3-10", rozdzial: "prawa", pytanie: "Babcia ma dożywotnie prawo mieszkania w lokalu, który kupuje Twój klient. Co to?", odpowiedzi: ["Służebność osobista, która zostaje", "Najem, który wygasa przy sprzedaży", "Prawo pierwokupu dla babci", "Hipoteka przymusowa na rzecz babci"], poprawna: 0, wyjasnienie: "Służebność osobista mieszkania obciąża lokal i przechodzi na nowego właściciela. Klient musi o niej wiedzieć." },
    { id: "m3-11", rozdzial: "prawa", pytanie: "Na jaki czas ustanawia się użytkowanie wieczyste?", odpowiedzi: ["Od 5 do 25 lat", "Od 40 do 99 lat", "Bezterminowo", "Na czas życia użytkownika"], poprawna: 1, wyjasnienie: "Użytkowanie wieczyste trwa od 40 do 99 lat i można je przedłużyć." },
    { id: "m3-12", rozdzial: "okazjonalny", pytanie: "Na jaki okres zawiera się najem okazjonalny?", odpowiedzi: ["Na czas oznaczony, najwyżej 10 lat", "Na czas nieokreślony z wypowiedzeniem", "Na czas oznaczony, najwyżej 3 lata", "Dowolny, byle w akcie notarialnym"], poprawna: 0, wyjasnienie: "Najem okazjonalny jest zawsze na czas oznaczony, nie dłuższy niż 10 lat." },
    { id: "m3-13", rozdzial: "okazjonalny", pytanie: "W jakim terminie zgłasza się najem okazjonalny do urzędu skarbowego?", odpowiedzi: ["7 dni od podpisania umowy", "14 dni od początku najmu", "30 dni od wpłaty kaucji", "Do końca roku podatkowego"], poprawna: 1, wyjasnienie: "14 dni od rozpoczęcia najmu. Bez zgłoszenia umowa traci ochronę najmu okazjonalnego." },
    { id: "m3-14", rozdzial: "okazjonalny", pytanie: "Co najemca podpisuje u notariusza przy najmie okazjonalnym?", odpowiedzi: ["Umowę najmu w formie aktu", "Oświadczenie o poddaniu się egzekucji", "Weksel na kwotę rocznego czynszu", "Zgodę na wpis do księgi wieczystej"], poprawna: 1, wyjasnienie: "Najemca składa oświadczenie o poddaniu się egzekucji i opróżnieniu lokalu. Sama umowa jest pisemna." },
    { id: "m3-15", rozdzial: "okazjonalny", pytanie: "Kto może zawrzeć najem okazjonalny jako wynajmujący?", odpowiedzi: ["Każda spółka z o.o. z lokalami", "Osoba fizyczna bez działalności w najmie", "Wyłącznie spółdzielnia mieszkaniowa", "Gmina wynajmująca lokale komunalne"], poprawna: 1, wyjasnienie: "Najem okazjonalny jest dla osób fizycznych, które nie prowadzą działalności w zakresie wynajmu lokali." },
    { id: "m3-16", rozdzial: "koszty", pytanie: "Ile kosztuje wpis prawa własności do księgi wieczystej?", odpowiedzi: ["50 zł", "200 zł", "2% ceny", "1 000 zł"], poprawna: 1, wyjasnienie: "Opłata sądowa za wpis własności to 200 zł. Tyle samo za wpis hipoteki." },
    { id: "m3-17", rozdzial: "koszty", pytanie: "Ile zwykle wynoszą łączne koszty okołotransakcyjne?", odpowiedzi: ["Poniżej 1% wartości", "Od 3 do 7% wartości", "Od 10 do 15% wartości", "Zawsze stałe 5 tys. zł"], poprawna: 1, wyjasnienie: "Taksa, opłaty, PCC, prowizja i koszty kredytu dają zwykle od 3 do 7%." },
    { id: "m3-18", rozdzial: "wylacznosc", pytanie: "Który argument za wyłącznością najlepiej trafia do sprzedającego?", odpowiedzi: ["Wyłączność jest wymagana przez przepisy prawa", "Pośrednik inwestuje w ofertę, bo praca nie przepadnie", "Bez wyłączności nie można dać ogłoszenia na portal", "Wyłączność obniża podatek od sprzedaży mieszkania"], poprawna: 1, wyjasnienie: "Wyłączność nie jest obowiązkiem prawnym. Jej siła to zaangażowanie i jedna, spójna strategia sprzedaży." },
  ],
};

export const MODULY_TEORII: ModulTeorii[] = [M1, M2, M3];
export const WSZYSTKIE_PYTANIA_TEORII: PytanieTeorii[] = MODULY_TEORII.flatMap((m) => m.pytania);
export const WSZYSTKIE_ROZDZIALY_TEORII = MODULY_TEORII.flatMap((m) => m.rozdzialy.map((r) => ({ ...r, modul: m })));

export const pytanieTeorii = (id: string) => WSZYSTKIE_PYTANIA_TEORII.find((q) => q.id === id);
export const rozdzialTeorii = (id: string) => WSZYSTKIE_ROZDZIALY_TEORII.find((r) => r.id === id);

/** Rodzaje testów. Egzamin próbny losuje z całej bazy, jak egzamin po szkoleniu. */
export type ZakresTestu = "m1" | "m2" | "m3" | "egzamin" | "bledy";
export const TESTY: Record<Exclude<ZakresTestu, "bledy">, { nazwa: string; ile: number; prog: number; minut: number | null }> = {
  m1: { nazwa: "Test: moduł I", ile: 10, prog: 8, minut: null },
  m2: { nazwa: "Test: moduł II", ile: 10, prog: 8, minut: null },
  m3: { nazwa: "Test: moduł III", ile: 10, prog: 8, minut: null },
  egzamin: { nazwa: "Egzamin próbny", ile: 30, prog: 24, minut: 30 },
};

export const itemTestu = (z: ZakresTestu) => `teoria-${z}`;
export const itemRozdzialu = (id: string) => `teoria-r-${id}`;
export const ITEM_BLEDOW = "teoria-bledy";

/** Losowanie pytań do testu. `los` daje liczby z [0, 1). */
export function losujPytania(zakres: ZakresTestu, los: () => number, bledy: string[] = []): PytanieTeorii[] {
  const pula = zakres === "bledy" ? WSZYSTKIE_PYTANIA_TEORII.filter((q) => bledy.includes(q.id)) : zakres === "egzamin" ? WSZYSTKIE_PYTANIA_TEORII : MODULY_TEORII.find((m) => m.id === zakres)?.pytania ?? [];
  const ile = zakres === "bledy" ? Math.min(15, pula.length) : TESTY[zakres].ile;
  const kopia = [...pula];
  for (let i = kopia.length - 1; i > 0; i--) {
    const j = Math.floor(los() * (i + 1));
    [kopia[i], kopia[j]] = [kopia[j], kopia[i]];
  }
  return kopia.slice(0, ile);
}

/** Ocena po identyfikatorach pytań: serwer zna poprawne, przeglądarka nie. */
export function ocenTeorie(odpowiedzi: { id: string; wybrana: number }[]): { wynik: number; max: number; bledne: string[]; dobre: string[] } {
  const bledne: string[] = [];
  const dobre: string[] = [];
  for (const o of odpowiedzi) {
    const q = pytanieTeorii(o.id);
    if (!q) continue;
    (o.wybrana === q.poprawna ? dobre : bledne).push(q.id);
  }
  return { wynik: dobre.length, max: dobre.length + bledne.length, bledne, dobre };
}

/** Lista pytań do powtórki: dochodzą nowe błędy, odpadają te, na które padła dobra odpowiedź. */
export function nowaListaBledow(stara: string[], bledne: string[], dobre: string[]): string[] {
  return [...new Set([...stara.filter((x) => !dobre.includes(x)), ...bledne])];
}
