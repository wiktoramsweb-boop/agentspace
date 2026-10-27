// Akademia: ścieżka nauki dla nowych agentów. Moduły od najprostszych rzeczy
// (jak wygląda dobra rozmowa) do negocjacji, w każdym kilka lekcji z biblioteki
// i krótki sprawdzian. Następny moduł otwiera się po zaliczeniu sprawdzianu.
// Bez importów, żeby zasady zaliczania dało się sprawdzić testem.

export type KolorModulu = "zielony" | "turkus" | "fiolet" | "zloto";

export type Lekcja = {
  id: string;
  rodzaj: "technika" | "skrypt" | "struktura" | "obiekcje";
  /** Slug techniki albo skryptu. Dla struktury i banku obiekcji puste. */
  slug: string;
  tytul: string;
  minut: number;
  /** Co konkretnie zrobić w tej lekcji. */
  zadanie: string;
};

export type Pytanie = {
  pytanie: string;
  odpowiedzi: string[];
  poprawna: number;
  wyjasnienie: string;
  technika?: string;
};

export type Sprawdzian = { id: string; tytul: string; prog: number; pytania: Pytanie[] };

export type ModulAkademii = {
  nr: number;
  nazwa: string;
  opis: string;
  kolor: KolorModulu;
  lekcje: Lekcja[];
  sprawdzian: Sprawdzian;
};

/* ── Sprawdziany ─────────────────────────────────────────────
   Złe odpowiedzi to błędy, które agenci naprawdę popełniają i które brzmią
   rozsądnie, a wszystkie mają podobną długość: dobrej nie da się zgadnąć po
   tym, że jest najdłuższa. Test (`npm run test:techniki`) tego pilnuje. */

const SPRAWDZIAN_1: Sprawdzian = {
  id: "sprawdzian-1",
  tytul: "Sprawdzian: dobra rozmowa",
  prog: 5,
  pytania: [
    {
      pytanie: "Który etap rozmowy powinien zajmować najwięcej czasu?",
      odpowiedzi: ["Wartość, czyli argumenty za współpracą", "Diagnoza, czyli pytania i słuchanie", "Obiekcje, czyli rozwiewanie wątpliwości", "Otwarcie, czyli budowanie relacji"],
      poprawna: 1,
      wyjasnienie: "Diagnoza to około jednej trzeciej rozmowy. Argumenty bez diagnozy trafiają w potrzeby, których klient nie ma.",
    },
    {
      pytanie: "Które pytanie najlepiej otwiera rozmowę z kupującym?",
      odpowiedzi: ["Czy szukają Państwo trzech pokoi w tej okolicy?", "Jaki budżet przeznaczają Państwo na zakup?", "Co sprawiło, że zainteresowało Państwa to ogłoszenie?", "Czy macie już decyzję kredytową z banku?"],
      poprawna: 2,
      wyjasnienie: "Pytanie otwarte o motywację daje najwięcej informacji. Budżet i kredyt to pytania na później, z lejka.",
      technika: "pytania-otwarte",
    },
    {
      pytanie: "Klient mówi: „Szukamy czegoś blisko szkoły córki”. Co jest najlepszą reakcją?",
      odpowiedzi: ["Pokazujesz od razu trzy oferty przy tej szkole", "Pytasz, jak wygląda ich dzień, że to tak ważne", "Mówisz, że okolica szkoły jest raczej droga", "Notujesz i przechodzisz do pytania o budżet"],
      poprawna: 1,
      wyjasnienie: "Dopytanie o szczegół z odpowiedzi pokazuje, że słuchasz, i odkrywa prawdziwą potrzebę za deklaracją.",
      technika: "aktywne-sluchanie",
    },
    {
      pytanie: "Która wypowiedź jest parafrazą?",
      odpowiedzi: ["„Rozumiem, wiele osób ma podobną sytuację”", "„Czyli liczy się termin, a cena jest drugorzędna?”", "„Szukają Państwo czegoś blisko szkoły córki”", "„To bardzo ważne, żeby dobrze to przemyśleć”"],
      poprawna: 1,
      wyjasnienie: "Parafraza to Twoja wersja słów klienta zakończona pytaniem o potwierdzenie. Powtórzenie słowo w słowo to jeszcze nie parafraza.",
      technika: "parafraza",
    },
    {
      pytanie: "Kiedy w rozmowie lepiej zadać pytanie zamknięte niż otwarte?",
      odpowiedzi: ["Na samym początku, żeby szybko rozgrzać klienta", "Gdy klient mówi zdawkowo i trzeba go ośmielić", "Gdy potwierdzasz konkret: termin, kwotę, ustalenie", "Gdy chcesz poznać motywację sprzedaży mieszkania"],
      poprawna: 2,
      wyjasnienie: "Pytanie zamknięte służy do potwierdzenia ustaleń. Do poznania motywacji i ośmielenia klienta używasz otwartych.",
      technika: "lejek-pytan",
    },
    {
      pytanie: "Klient przez minutę opowiada o przeprowadzce. Czego nie robisz?",
      odpowiedzi: ["Nie przerywasz, nawet gdy wiesz, co chcesz dodać", "Nie notujesz, żeby nie wyglądało to jak przesłuchanie", "Nie dopytujesz o szczegół, który właśnie padł", "Nie potakujesz, żeby nie sugerować odpowiedzi"],
      poprawna: 0,
      wyjasnienie: "Przerywanie to najczęstszy błąd słuchania. Notowanie, dopytywanie i potakiwanie pomagają klientowi mówić.",
      technika: "aktywne-sluchanie",
    },
    {
      pytanie: "Które zakończenie rozmowy najlepiej posuwa sprawę do przodu?",
      odpowiedzi: ["„Wyślę ofertę mailem, proszę ją spokojnie przejrzeć”", "„Zadzwonię w przyszłym tygodniu, jak coś się pojawi”", "„W czwartek o 17 pokażę dwa mieszkania, zgoda?”", "„Proszę dać znać, kiedy będą Państwo gotowi”"],
      poprawna: 2,
      wyjasnienie: "Konkretny krok z datą i godziną, potwierdzony przez klienta. Pozostałe zostawiają decyzję o kolejnym kontakcie w zawieszeniu.",
      technika: "nastepny-krok",
    },
  ],
};

const SPRAWDZIAN_2: Sprawdzian = {
  id: "sprawdzian-2",
  tytul: "Sprawdzian: pierwszy telefon",
  prog: 5,
  pytania: [
    {
      pytanie: "Lead z portalu przyszedł o 10:05. Kiedy dzwonisz?",
      odpowiedzi: ["Po południu, gdy klient wróci z pracy", "Do 10:20, póki pamięta ogłoszenie", "Następnego dnia, żeby nie być nachalnym", "Gdy zbierze się kilka leadów naraz"],
      poprawna: 1,
      wyjasnienie: "Telefon w ciągu kwadransa łapie klienta, póki pamięta ogłoszenie. Każda godzina obniża szansę kontaktu.",
    },
    {
      pytanie: "Klient: „Nie mam teraz czasu”. Która odpowiedź jest najlepsza?",
      odpowiedzi: ["„Rozumiem, zajmę dosłownie jedną minutę”", "„Dobrze, a kiedy mogę zadzwonić ponownie?”", "„Nie zatrzymuję. Dziś po 18 czy jutro rano?”", "„Jasne, wyślę wszystko SMS-em i poczekam”"],
      poprawna: 2,
      wyjasnienie: "Dwie konkretne godziny sprawdzają, czy to brak czasu, czy odmowa. „Kiedy mogę?” zostawia decyzję klientowi i zwykle kończy się niczym.",
      technika: "umow-oddzwonienie",
    },
    {
      pytanie: "Który powód telefonu do właściciela jest najsilniejszy?",
      odpowiedzi: ["Mamy wielu klientów szukających w Pani okolicy", "Podobne mieszkanie w budynku poszło za 712 tys.", "Rozszerzamy działalność biura na Pani dzielnicę", "Chciałbym przedstawić nasze biuro i usługi"],
      poprawna: 1,
      wyjasnienie: "Najsilniejszy powód jest konkretny, prawdziwy i dotyczy rozmówcy. Ogólnik o „wielu klientach” brzmi jak każdy agent.",
      technika: "konkretny-powod-telefonu",
    },
    {
      pytanie: "Zapytałeś „Ma Pani dwie minuty?”. Co robisz w tej sekundzie?",
      odpowiedzi: ["Dodajesz, że naprawdę nie zajmiesz więcej", "Zadajesz pierwsze pytanie, żeby nie tracić czasu", "Milczysz i czekasz na odpowiedź rozmówczyni", "Mówisz krótko, z jakiego jesteś biura i od kiedy"],
      poprawna: 2,
      wyjasnienie: "Po pytaniu o zgodę milczysz. Zgoda wypowiedziana przez rozmówcę sprawia, że słucha dalej uważniej.",
      technika: "otwarcie-z-pozwoleniem",
    },
    {
      pytanie: "Lead nie odebrał. Który SMS wysyłasz?",
      odpowiedzi: ["Proszę o kontakt w sprawie ogłoszenia, pozdrawiam", "Oferta aktualna, mogę pokazać jutro 17:30 lub w sobotę", "Zapraszam na naszą stronę, tam są wszystkie oferty", "Dzwoniłem, proszę oddzwonić, kiedy będzie Pan mógł"],
      poprawna: 1,
      wyjasnienie: "SMS z konkretem i dwiema propozycjami pozwala odpisać jednym słowem. „Proszę o kontakt” przerzuca całą pracę na klienta.",
      technika: "wiadomosc-po-nieodebranym",
    },
    {
      pytanie: "Kupujący nie był jeszcze w banku i chce od razu oglądać. Co robisz?",
      odpowiedzi: ["Umawiasz oglądanie, kredyt załatwi się po drodze", "Odmawiasz prezentacji do czasu decyzji kredytowej", "Proponujesz doradcę, który policzy zdolność od ręki", "Prosisz o zaświadczenie o dochodach przed spotkaniem"],
      poprawna: 2,
      wyjasnienie: "Kupujący z policzoną zdolnością jest poważniej traktowany przez właściciela, a Ty nie pokazujesz mieszkań poza zasięgiem klienta.",
    },
    {
      pytanie: "Kupujący chce tylko podać cenę „do negocjacji”. Co odpowiadasz?",
      odpowiedzi: ["Podajesz kwotę, do której właściciel może zejść", "Mówisz, że cena jest ostateczna i nie podlega zmianom", "Mówisz, że o cenie rozmawiacie po obejrzeniu mieszkania", "Prosisz, żeby najpierw złożył ofertę mailem"],
      poprawna: 2,
      wyjasnienie: "Właściciel rozmawia o cenie z kupującym, który obejrzał mieszkanie i ma finansowanie. Podanie kwoty w ciemno osłabia właściciela.",
      technika: "zaangazowanie-konsekwencja",
    },
  ],
};

const SPRAWDZIAN_3: Sprawdzian = {
  id: "sprawdzian-3",
  tytul: "Sprawdzian: zimne telefony",
  prog: 5,
  pytania: [
    {
      pytanie: "Co jest celem zimnego telefonu do właściciela, który sprzedaje sam?",
      odpowiedzi: ["Wysłanie wzoru umowy i cennika usług", "Krótkie spotkanie z raportem cen przy mieszkaniu", "Przekonanie właściciela do niższej ceny", "Ustalenie wysokości prowizji przez telefon"],
      poprawna: 1,
      wyjasnienie: "Przez telefon sprzedajesz spotkanie, nie umowę. Wzór umowy i prowizja przez telefon dają tylko kolejne powody do odmowy.",
      technika: "sprzedaj-spotkanie",
    },
    {
      pytanie: "Które zdanie to audyt oskarżeń?",
      odpowiedzi: ["„Nie jestem typowym agentem, obiecuję”", "„Pewnie ma Pani dość telefonów od agentów”", "„Nie zajmę dużo czasu, proszę o chwilę”", "„Wiem, że sprzedaż sama bywa trudna”"],
      poprawna: 1,
      wyjasnienie: "Audyt oskarżeń nazywa wprost to, co rozmówca myśli o Tobie. „Nie jestem typowym agentem” mówi każdy agent, więc nie działa.",
      technika: "audyt-oskarzen",
    },
    {
      pytanie: "„Nie współpracuję z biurami”. Jaki jest najlepszy pierwszy ruch?",
      odpowiedzi: ["Wymieniasz trzy największe zalety swojego biura", "Pytasz, co sprawiło, że podjął taką decyzję", "Proponujesz niższą prowizję na początek", "Mówisz, że prywatnie sprzeda dużo taniej"],
      poprawna: 1,
      wyjasnienie: "Pytanie o powód zamienia formułkę w informację. Rabat na starcie uczy właściciela, że wystarczy odmówić, żeby było taniej.",
      technika: "pytanie-o-powod",
    },
    {
      pytanie: "Jak najlepiej zaproponować termin spotkania?",
      odpowiedzi: ["„Kiedy znalazłaby Pani dla mnie chwilę?”", "„Czwartek o 17 czy sobota o 11?”", "„Może w tym tygodniu, jak Pani pasuje?”", "„Proszę dać znać, a ja się dopasuję”"],
      poprawna: 1,
      wyjasnienie: "Dwie konkretne opcje przenoszą rozmowę z „czy” na „kiedy”. Otwarte pytanie o termin oddaje decyzję i często kończy się „odezwę się”.",
      technika: "zamkniecie-alternatywne",
    },
    {
      pytanie: "Właściciel zaczyna wypytywać o szczegóły umowy. Co robisz?",
      odpowiedzi: ["Czytasz najważniejsze punkty umowy przez telefon", "Wysyłasz wzór umowy mailem jeszcze dziś", "Mówisz, że pokażesz to na miejscu, i dajesz dwa terminy", "Odpowiadasz na wszystko, żeby zbudować zaufanie"],
      poprawna: 2,
      wyjasnienie: "Każda minuta tłumaczenia umowy przez telefon to nowy powód do odmowy. Szczegóły zostawiasz na spotkanie.",
      technika: "sprzedaj-spotkanie",
    },
    {
      pytanie: "Właściciel ma kupca i w piątek podpisuje przedwstępną. Co robisz?",
      odpowiedzi: ["Sugerujesz, że kupiec może się jeszcze wycofać", "Gratulujesz i zostawiasz numer na wypadek problemów", "Proponujesz, że sprawdzisz kupującego za darmo", "Pytasz o cenę i mówisz, że mógł dostać więcej"],
      poprawna: 1,
      wyjasnienie: "Nie podważasz cudzej transakcji. Dobre wrażenie wraca, gdy przedwstępna rozpadnie się na kredycie.",
      technika: "wzajemnosc",
    },
    {
      pytanie: "Które otwarcie najlepiej przerywa schemat „kolejny agent”?",
      odpowiedzi: ["„Dzień dobry, mam dla Pani wyjątkową ofertę”", "„Pewnie to dziś trzeci agent, więc będę krótko”", "„Dzień dobry, czy rozmawiam z właścicielem?”", "„Nasze biuro jest liderem na Pani osiedlu”"],
      poprawna: 1,
      wyjasnienie: "Szczere zdanie, którego rozmówca się nie spodziewa, daje kilka sekund prawdziwej uwagi. Zachwalanie biura brzmi jak każdy telefon.",
      technika: "przerwanie-schematu",
    },
  ],
};

const SPRAWDZIAN_4: Sprawdzian = {
  id: "sprawdzian-4",
  tytul: "Sprawdzian: obiekcje",
  prog: 5,
  pytania: [
    {
      pytanie: "Co najczęściej kryje się za „muszę to przemyśleć”?",
      odpowiedzi: ["Potrzeba spokojnego czasu na decyzję", "Konkretna wątpliwość, której nie powiedział", "Grzeczny sposób, żeby odmówić na zawsze", "Chęć porównania z ofertą innego biura"],
      poprawna: 1,
      wyjasnienie: "Zwykle chodzi o konkret: cenę, prowizję, zaufanie albo drugą osobę decyzyjną. Dlatego pytasz, co dokładnie chce przemyśleć.",
      technika: "izolacja-obiekcji",
    },
    {
      pytanie: "Po co pytasz: „Jeśli ustalimy prowizję, czy coś jeszcze stoi na przeszkodzie?”",
      odpowiedzi: ["Żeby pokazać, że prowizja jest do negocjacji", "Żeby sprawdzić, czy to jedyna prawdziwa przeszkoda", "Żeby przejść do podpisania umowy jeszcze dziś", "Żeby klient sam zaproponował swoją stawkę"],
      poprawna: 1,
      wyjasnienie: "Izolacja pokazuje, czy rozmawiasz o prawdziwej przeszkodzie. Nie warto ustępować w prowizji, jeśli problem leży gdzie indziej.",
      technika: "izolacja-obiekcji",
    },
    {
      pytanie: "Która odpowiedź to dobra zgoda częściowa?",
      odpowiedzi: ["„Tak, ale nasze biuro działa zupełnie inaczej”", "„Ma Pan rację i właśnie dlatego raportuję co tydzień”", "„Rozumiem, każdy klient ma prawo tak myśleć”", "„Zgadzam się, choć nie do końca z tym wszystkim”"],
      poprawna: 1,
      wyjasnienie: "Przyznajesz rację w prawdziwej części obiekcji i przechodzisz do argumentu przez „i właśnie dlatego”. Słowo „ale” kasuje zgodę.",
      technika: "zgoda-czesciowa",
    },
    {
      pytanie: "„Nie dam 20 tysięcy prowizji”. Jak zamienić to w pytanie?",
      odpowiedzi: ["„Czy 15 tysięcy byłoby dla Pana do przyjęcia?”", "„Czyli pytanie brzmi, czy na tym Pan zarobi?”", "„A ile byłby Pan w stanie zapłacić za usługę?”", "„Dlaczego uważa Pan, że to za duża kwota?”"],
      poprawna: 1,
      wyjasnienie: "Przeformułowanie zmienia wyrok w problem do policzenia razem. Proponowanie kwot to już negocjacja, a nie odpowiedź na obiekcję.",
      technika: "obiekcja-w-pytanie",
    },
    {
      pytanie: "Który błąd przy obiekcji jest najczęstszy?",
      odpowiedzi: ["Dopytanie, skąd się wzięła ta wątpliwość", "Natychmiastowe ustępstwo albo spór z klientem", "Krótka pauza przed odpowiedzią na obiekcję", "Sprawdzenie, czy to jedyna przeszkoda"],
      poprawna: 1,
      wyjasnienie: "Kłótnia i ustępstwo od razu to dwa najczęstsze błędy. Pauza, dopytanie i izolacja to dobre ruchy.",
    },
    {
      pytanie: "„Sąsiad wystawił za 950, ja też chcę tyle”. Co działa najlepiej?",
      odpowiedzi: ["Zgadzasz się, a obniżkę zaproponujesz za miesiąc", "Pokazujesz ceny z aktów i od kiedy wisi jego ogłoszenie", "Mówisz, że Twoim zdaniem to zdecydowanie za dużo", "Proponujesz cenę w połowie między 950 a rynkiem"],
      poprawna: 1,
      wyjasnienie: "Ogłoszenie to nie transakcja. Dane z aktów kończą spór o opinie. Cena „po połowie” nie ma żadnego uzasadnienia.",
      technika: "obiektywne-kryteria",
    },
    {
      pytanie: "Klient: „Agenci tylko wstawiają ogłoszenie”. Najlepsza odpowiedź?",
      odpowiedzi: ["„To nieprawda, my robimy dużo więcej niż inni”", "„Wielu tak robi, dlatego pokażę Panu plan na 30 dni”", "„Zależy, na jakie biuro Pan wcześniej trafił”", "„Mogę obniżyć prowizję, jeśli to Pana przekona”"],
      poprawna: 1,
      wyjasnienie: "Zgoda z prawdziwą częścią i konkretny dowód zamiast zaprzeczania. Rabat nie odpowiada na zarzut, że nic nie robisz.",
      technika: "zgoda-czesciowa",
    },
  ],
};

const SPRAWDZIAN_5: Sprawdzian = {
  id: "sprawdzian-5",
  tytul: "Sprawdzian: spotkanie z właścicielem",
  prog: 5,
  pytania: [
    {
      pytanie: "Jaka jest właściwa kolejność pytań w lejku?",
      odpowiedzi: ["Od budżetu, przez potrzeby, do terminu i potwierdzenia", "Szerokie, szczegóły, wąskie, zamknięte potwierdzenie", "Od zamkniętych, przez otwarte, do szerokiego podsumowania", "Termin, budżet, potrzeby, motywacja sprzedaży"],
      poprawna: 1,
      wyjasnienie: "Od łatwych, szerokich pytań do szczegółów, a na końcu zamknięte potwierdzenie. Zaczynanie od budżetu brzmi jak przesłuchanie.",
      technika: "lejek-pytan",
    },
    {
      pytanie: "Które pytanie to pytanie o implikację (I w SPIN)?",
      odpowiedzi: ["„Ile metrów ma mieszkanie i na którym piętrze?”", "„Co się stanie, jeśli nie sprzeda Pani do marca?”", "„Co najbardziej przeszkadza Pani w sprzedaży?”", "„Czy chciałaby Pani sprzedać szybciej i drożej?”"],
      poprawna: 1,
      wyjasnienie: "Implikacja to skutek nierozwiązanego problemu. Pierwsze to sytuacja, trzecie problem, czwarte pytanie o potrzebę.",
      technika: "spin",
    },
    {
      pytanie: "Na czym opierasz propozycję ceny ofertowej?",
      odpowiedzi: ["Na średniej cen z ogłoszeń w tej okolicy", "Na cenach transakcyjnych z aktów notarialnych", "Na cenie, której oczekuje właściciel", "Na swoim doświadczeniu z podobnymi mieszkaniami"],
      poprawna: 1,
      wyjasnienie: "Akty notarialne pokazują, za ile ludzie naprawdę kupili. Ceny z ogłoszeń mówią tylko, ile ktoś chciałby dostać.",
      technika: "obiektywne-kryteria",
    },
    {
      pytanie: "Właściciel chce startować wyraźnie powyżej rynku. Co proponujesz?",
      odpowiedzi: ["Wystawiasz za tyle, ile chce, a potem obniżysz", "Odmawiasz przyjęcia oferty w tej cenie", "Start wyżej z ustaloną już dziś datą i kwotą korekty", "Wpisujesz niższą cenę i tłumaczysz to po fakcie"],
      poprawna: 2,
      wyjasnienie: "Korekta ustalona z góry chroni pierwsze tygodnie ogłoszenia, a właściciel dotrzymuje słowa, które sam dał.",
      technika: "zaangazowanie-konsekwencja",
    },
    {
      pytanie: "„Porozmawiamy jeszcze z innym biurem”. Najlepsza odpowiedź?",
      odpowiedzi: ["„Proszę bardzo, choć inne biura biorą więcej, a robią mniej”", "„Zapytajcie ich o ceny z aktów i plan. Dzwonię w czwartek”", "„Jeśli podpiszecie dziś, obniżę prowizję o pół procenta”", "„Dobrze, czekam na sygnał, kiedy już podejmiecie decyzję”"],
      poprawna: 1,
      wyjasnienie: "Dajesz kryteria porównania, które Ty spełniasz, i ustalasz kolejny kontakt. Krytyka konkurencji i rabat pod presją osłabiają pozycję.",
    },
    {
      pytanie: "Które „małe tak” jest uczciwe?",
      odpowiedzi: ["„Chce Pani sprzedać jak najdrożej, prawda?”", "„Czyli termin jest ważniejszy niż ostatni tysiąc, tak?”", "„Każdy chciałby szybko sprzedać, zgodzi się Pani?”", "„Zależy Pani na dobrym biurze, mam rację?”"],
      poprawna: 1,
      wyjasnienie: "Uczciwe potwierdzenie powtarza to, co klient sam powiedział. Pytania z oczywistą odpowiedzią to manipulacja, którą klient czuje.",
      technika: "male-tak",
    },
    {
      pytanie: "Kiedy na spotkaniu proponujesz podpisanie umowy?",
      odpowiedzi: ["Na początku, żeby od razu ustalić zasady", "Po diagnozie, cenie z danych i planie sprzedaży", "Po spotkaniu, mailem z wzorem do przeczytania", "Dopiero gdy właściciel sam o to zapyta"],
      poprawna: 1,
      wyjasnienie: "Umowa jest naturalnym krokiem, gdy klient zna cenę, plan i ma odpowiedzi na wątpliwości. Wcześniej jest naciskiem.",
    },
  ],
};

const SPRAWDZIAN_6: Sprawdzian = {
  id: "sprawdzian-6",
  tytul: "Sprawdzian: negocjacje",
  prog: 5,
  pytania: [
    {
      pytanie: "Właściciel prosi o niższą prowizję. Od czego zaczynasz?",
      odpowiedzi: ["Od pokazania, ile pracy wymaga sprzedaż", "Od pytania, z czym porównuje Twoją stawkę", "Od propozycji niewielkiego rabatu na start", "Od informacji, że stawka jest stała dla wszystkich"],
      poprawna: 1,
      wyjasnienie: "Najpierw zrozum, skąd bierze się prośba. Bez tego nie wiesz, czy rozmawiasz o cenie, czy o wartości usługi.",
      technika: "etykietowanie",
    },
    {
      pytanie: "Które ustępstwo jest dobrze poprowadzone?",
      odpowiedzi: ["„Dobrze, dla Pani zrobię wyjątek: 2 procent”", "„2,2 procent przy wyłączności na cztery miesiące”", "„Obniżę, jeśli poleci mnie Pani znajomym”", "„Zejdę o pół procenta, ale tylko dzisiaj”"],
      poprawna: 1,
      wyjasnienie: "Ustępstwo w zamian za coś konkretnego, co ma dla Ciebie wartość od razu. Obietnica poleceń i presja „tylko dziś” to słabe wymiany.",
      technika: "strategia-ustepstw",
    },
    {
      pytanie: "Które pytanie jest pytaniem kalibrowanym?",
      odpowiedzi: ["„Czy możemy się dziś dogadać w sprawie ceny?”", "„Co musiałoby się stać, żeby to miało sens?”", "„Dlaczego nie chce Pani zejść z tej ceny?”", "„Prawda, że to uczciwa propozycja?”"],
      poprawna: 1,
      wyjasnienie: "Pytania „co” i „jak” zapraszają do szukania rozwiązania. „Dlaczego” brzmi jak oskarżenie, a „czy” daje łatwe „nie”.",
      technika: "pytania-kalibrowane",
    },
    {
      pytanie: "Podałeś cenę. Co robisz w kolejnych sekundach?",
      odpowiedzi: ["Od razu uzasadniasz, skąd wzięła się kwota", "Milczysz i czekasz na reakcję rozmówcy", "Dodajesz, że jest jeszcze pole do rozmowy", "Pytasz, czy cena wydaje się w porządku"],
      poprawna: 1,
      wyjasnienie: "Cisza po propozycji daje drugiej stronie czas. Kto pierwszy przerywa ciszę, ten zwykle ustępuje.",
      technika: "milczenie",
    },
    {
      pytanie: "Klient upiera się przy stawce, przy której nie zrobisz dobrze pracy. Co robisz?",
      odpowiedzi: ["Zgadzasz się, żeby nie stracić zlecenia", "Mówisz o swojej granicy i jesteś gotów odejść", "Zgadzasz się, ale ograniczasz działania", "Prosisz szefa, żeby zdecydował za Ciebie"],
      poprawna: 1,
      wyjasnienie: "Agent, który nie umie odejść, zawsze negocjuje w dół. Ograniczanie działań po cichu niszczy zaufanie.",
      technika: "plan-b",
    },
    {
      pytanie: "Klient mówi zdenerwowanym głosem o poprzednim agencie. Co mówisz?",
      odpowiedzi: ["„Proszę się nie martwić, ze mną to wygląda zupełnie inaczej”", "„Wygląda na to, że tamta sprzedaż mocno Panią zawiodła”", "„Niestety w branży zdarzają się różni ludzie”", "„Wróćmy może do tematu sprzedaży Pani mieszkania”"],
      poprawna: 1,
      wyjasnienie: "Etykieta nazywa emocję i obniża napięcie. Zapewnienia i zmiana tematu sprawiają, że klient czuje się niewysłuchany.",
      technika: "etykietowanie",
    },
    {
      pytanie: "Które zakończenie negocjacji jest najlepsze?",
      odpowiedzi: ["„To wszystko przemyślimy i się zdzwonimy”", "„Spiszę ustalenia, wyślę dziś, akt we wtorek”", "„Super, to w razie czego proszę dzwonić”", "„Dziękuję, myślę, że się porozumiemy”"],
      poprawna: 1,
      wyjasnienie: "Ustalenia na piśmie i konkretny następny krok. Między „tak” a podpisem nie może być pustego tygodnia.",
      technika: "nastepny-krok",
    },
  ],
};

const EGZAMIN_KONCOWY: Sprawdzian = {
  id: "egzamin",
  tytul: "Egzamin końcowy",
  prog: 12,
  pytania: [
    {
      pytanie: "Właściciel odbiera i mówi: „Pewnie znowu agent”. Najlepsza reakcja?",
      odpowiedzi: ["„Tak, ale z zupełnie inną propozycją niż reszta”", "„Tak, pewnie ma Pani dość. Jedno pytanie o cenę?”", "„Dzwonię, bo mam kupca na Pani mieszkanie”", "„Proszę mnie wysłuchać, to zajmie minutę”"],
      poprawna: 1,
      wyjasnienie: "Przyznanie się i nazwanie myśli rozmówcy rozbraja nieufność. Zmyślony kupiec wychodzi przy pierwszym pytaniu.",
      technika: "audyt-oskarzen",
    },
    {
      pytanie: "Kupujący pyta: „Ile da się zejść z ceny?”. Co robisz?",
      odpowiedzi: ["Podajesz realną kwotę, żeby nie tracić czasu", "Prosisz o ofertę na piśmie z finansowaniem", "Mówisz, że cena jest sztywna i ostateczna", "Pytasz, ile ma oszczędności na wkład"],
      poprawna: 1,
      wyjasnienie: "Nie negocjujesz w ciemno w imieniu właściciela. Oferta na piśmie z finansowaniem to konkret do przekazania.",
      technika: "ograniczony-mandat",
    },
    {
      pytanie: "„Muszę porozmawiać z mężem”. Najlepsza odpowiedź?",
      odpowiedzi: ["„Oczywiście, zostawię materiały dla męża”", "„Spotkajmy się we trójkę, sobota rano pasuje?”", "„Mąż na pewno się zgodzi, to dobra oferta”", "„Proszę podpisać, mąż może dołączyć później”"],
      poprawna: 1,
      wyjasnienie: "Druga osoba decyzyjna powinna być przy rozmowie, a nie słuchać relacji. Materiały bez rozmowy rzadko przekonują.",
      technika: "ograniczony-mandat",
    },
    {
      pytanie: "Ile argumentów podajesz na koniec prezentacji usługi?",
      odpowiedzi: ["Jeden najmocniejszy, żeby nie rozmywać przekazu", "Trzy, dopasowane do tego, co mówił klient", "Pięć, żeby pokryć wszystkie obawy", "Wszystkie, które pasują do sytuacji"],
      poprawna: 1,
      wyjasnienie: "Trzy argumenty zapamiętuje się najlepiej. Jeden bywa za słaby, pięć i więcej ginie w pamięci.",
      technika: "regula-trzech",
    },
    {
      pytanie: "Oferta wisi 8 tygodni bez ofert kupna. Jak zaczynasz rozmowę o cenie?",
      odpowiedzi: ["Od Twojej opinii, że mieszkanie jest za drogie", "Od liczb: wyświetlenia, telefony, prezentacje", "Od propozycji większego budżetu na reklamę", "Od pytania, czy właściciel nadal chce sprzedać"],
      poprawna: 1,
      wyjasnienie: "Fakty zamiast opinii. Właściciel sam widzi problem w liczbach, a więcej reklamy pokazuje zbyt wysoką cenę większej grupie.",
      technika: "obiektywne-kryteria",
    },
    {
      pytanie: "Po prezentacji kupujący: „Zastanowimy się i damy znać”. Co robisz?",
      odpowiedzi: ["Dziękujesz i czekasz na ich telefon", "Pytasz, nad czym konkretnie, i ustalasz termin", "Mówisz, że jest drugi chętny na mieszkanie", "Proponujesz od razu obniżkę od właściciela"],
      poprawna: 1,
      wyjasnienie: "„Damy znać” bez terminu zwykle znaczy „nie”. Wymyślony drugi chętny i obniżka bez oferty to błędy.",
      technika: "nastepny-krok",
    },
    {
      pytanie: "Najlepszy powód telefonu do właściciela wygasłej oferty?",
      odpowiedzi: ["„Mamy klientów na mieszkania w Pani okolicy”", "„Ogłoszenie zniknęło. Przerwa czy rezygnacja?”", "„Chciałem zapytać, czy coś się u Pani zmieniło”", "„Możemy sprzedać szybciej niż poprzednie biuro”"],
      poprawna: 1,
      wyjasnienie: "Pokazujesz, że wiesz, co się stało, i pytasz o sytuację rozmówcy. Obietnica „szybciej” bez danych nic nie znaczy.",
      technika: "konkretny-powod-telefonu",
    },
    {
      pytanie: "„Prowizja jest za wysoka”. Która odpowiedź to zgoda częściowa?",
      odpowiedzi: ["„To duża kwota, dlatego płaci ją Pani przy akcie”", "„Rozumiem, ale u konkurencji jest podobnie”", "„Mogę zrobić wyjątek i trochę zejść”", "„Wysoka, bo dajemy najwyższą jakość”"],
      poprawna: 0,
      wyjasnienie: "Przyznajesz rację w prawdziwej części i od niej przechodzisz do argumentu. „Ale” i natychmiastowy rabat to błędy.",
      technika: "zgoda-czesciowa",
    },
    {
      pytanie: "Po czym poznasz, że diagnoza z właścicielem była kompletna?",
      odpowiedzi: ["Znasz metraż, piętro, stan mieszkania i rok budowy budynku", "Znasz motywację, termin, oczekiwaną cenę i kto decyduje", "Właściciel przez większość spotkania mówił dłużej niż Ty", "Właściciel zgodził się na kolejne spotkanie"],
      poprawna: 1,
      wyjasnienie: "Parametry mieszkania to oględziny, a nie diagnoza. Dobra diagnoza daje: dlaczego, do kiedy, za ile i kto decyduje.",
      technika: "lejek-pytan",
    },
    {
      pytanie: "Trzeci telefon do właściciela, który mówił „nie teraz”. Od czego zaczynasz?",
      odpowiedzi: ["„Dzwonię zapytać, czy coś się zmieniło”", "„W Pani budynku coś się sprzedało, mam cenę”", "„Przypominam się, bo minęły dwa tygodnie”", "„Mam dla Pani nową, lepszą ofertę biura”"],
      poprawna: 1,
      wyjasnienie: "Każdy kolejny kontakt przynosi nową informację. Wtedy dzwonisz jako ekspert, a nie jako natręt.",
      technika: "telefon-z-wartoscia",
    },
    {
      pytanie: "Przekazujesz właścicielowi ofertę 742 tysiące. Od czego zaczynasz?",
      odpowiedzi: ["Od kwoty, bo to najważniejsza informacja", "Od kupującego: kredyt, wkład, termin aktu", "Od Twojej rekomendacji, czy ją przyjąć", "Od tego, że oferta jest niższa od ceny"],
      poprawna: 1,
      wyjasnienie: "Pewne finansowanie i szybki termin są warte pieniędzy. Kontekst przed kwotą pozwala ocenić ofertę uczciwie.",
      technika: "kotwiczenie",
    },
    {
      pytanie: "Lead z portalu nie spełnia czterech warunków klienta. Co robisz?",
      odpowiedzi: ["I tak umawiasz prezentację, może się spodoba", "Mówisz uczciwie i proponujesz inne oferty", "Kończysz rozmowę, bo nie masz nic dla niego", "Mówisz, że reszta ofert jest jeszcze droższa"],
      poprawna: 1,
      wyjasnienie: "Uczciwe dopasowanie buduje zaufanie. Klient, który dostał lepsze propozycje albo trafił do poszukiwań, wraca do Ciebie.",
    },
    {
      pytanie: "W jakiej sytuacji NIE używasz zamknięcia alternatywnego?",
      odpowiedzi: ["Gdy umawiasz termin prezentacji mieszkania", "Gdy klient nie ma jeszcze żadnego zamiaru", "Gdy ustalasz długość umowy pośrednictwa", "Gdy umawiasz termin sesji zdjęciowej"],
      poprawna: 1,
      wyjasnienie: "Wybór między dwoma terminami działa, gdy decyzja o kroku już zapadła. Przy braku zamiaru jest naciskiem.",
      technika: "zamkniecie-alternatywne",
    },
    {
      pytanie: "Właściciel najmu boi się złego najemcy. Co jest najmocniejszym argumentem?",
      odpowiedzi: ["„Nasi najemcy to zawsze sprawdzeni i porządni ludzie”", "„Dokumenty dochodu i najem okazjonalny u notariusza”", "„Mamy wieloletnie doświadczenie w najmie mieszkań”", "„Wynagrodzenie płaci najemca, nie Pan”"],
      poprawna: 1,
      wyjasnienie: "Obawę o najemcę rozwiązuje procedura, nie zapewnienie. To, kto płaci wynagrodzenie, nie odpowiada na tę obawę.",
      technika: "obiektywne-kryteria",
    },
    {
      pytanie: "Klient zgadza się na kontrofertę, ale chce „pomyśleć nad terminem aktu”. Co robisz?",
      odpowiedzi: ["Zostawiasz to, termin ustalicie później", "Proponujesz dwa konkretne terminy aktu", "Mówisz, że bez terminu oferta przepada", "Ustalasz termin sam i informujesz SMS-em"],
      poprawna: 1,
      wyjasnienie: "Dwie konkretne daty domykają ustalenie bez presji. Grożenie i decydowanie za klienta niszczą zaufanie na finiszu.",
      technika: "zamkniecie-alternatywne",
    },
    {
      pytanie: "Która rozmowa skończyła się „furtką otwartą”, a nie porażką?",
      odpowiedzi: ["„Dobrze, to się kiedyś odezwę, do usłyszenia”", "„Wyślę raport dziś i dzwonię w czwartek o 10”", "„Rozumiem, nie będę już przeszkadzał”", "„Proszę o telefon, gdyby Pani zmieniła zdanie”"],
      poprawna: 1,
      wyjasnienie: "Furtka to konkretny powód i termin kolejnego kontaktu. „Kiedyś” i „proszę dzwonić” zostawiają relację bez następnego kroku.",
      technika: "nastepny-krok",
    },
  ],
};

const T = (slug: string, tytul: string, minut: number, zadanie: string): Lekcja => ({ id: `l-${slug}`, rodzaj: "technika", slug, tytul, minut, zadanie });
const S = (slug: string, tytul: string, minut: number, zadanie: string): Lekcja => ({ id: `s-${slug}`, rodzaj: "skrypt", slug, tytul, minut, zadanie });

export const MODULY_AKADEMII: ModulAkademii[] = [
  {
    nr: 1,
    nazwa: "Jak wygląda dobra rozmowa",
    opis: "Zanim zadzwonisz do pierwszego klienta: z czego składa się rozmowa i dlaczego więcej słuchasz, niż mówisz.",
    kolor: "zielony",
    lekcje: [
      { id: "struktura", rodzaj: "struktura", slug: "", tytul: "Sześć etapów rozmowy", minut: 5, zadanie: "Przeczytaj, jakie etapy ma każda rozmowa, i zapamiętaj pułapkę każdego z nich." },
      T("pytania-otwarte", "Pytania otwarte", 5, "Przeczytaj technikę i zapisz trzy pytania otwarte, które zadasz kupującemu."),
      T("aktywne-sluchanie", "Aktywne słuchanie", 5, "Przeczytaj technikę. W najbliższej rozmowie (także prywatnej) nie przerywaj ani razu."),
      T("parafraza", "Parafraza", 4, "Przeczytaj technikę i przećwicz podsumowanie słów klienta jednym zdaniem."),
    ],
    sprawdzian: SPRAWDZIAN_1,
  },
  {
    nr: 2,
    nazwa: "Pierwszy telefon",
    opis: "Telefon do kupującego z portalu i pierwsze sekundy każdej rozmowy: zgoda, powód i oddzwonienie z godziną.",
    kolor: "turkus",
    lekcje: [
      T("otwarcie-z-pozwoleniem", "Otwarcie z prośbą o pozwolenie", 5, "Przeczytaj technikę i nagraj swoje otwarcie: najwyżej 10 sekund."),
      T("konkretny-powod-telefonu", "Konkretny powód telefonu", 5, "Przeczytaj technikę. Do trzech ogłoszeń dopisz po jednym fakcie z liczbą."),
      T("umow-oddzwonienie", "„Nie mam czasu”: oddzwonienie z godziną", 4, "Przeczytaj technikę i naucz się na pamięć jednego zdania z dwiema godzinami."),
      T("wiadomosc-po-nieodebranym", "SMS po nieodebranym telefonie", 4, "Przeczytaj technikę i napisz swój szablon SMS do leada z portalu."),
      S("lead-z-portalu", "Skrypt: oddzwonienie do kupującego z portalu", 8, "Przejdź rozmowę z rozgałęzieniami przynajmniej dwiema różnymi drogami."),
    ],
    sprawdzian: SPRAWDZIAN_2,
  },
  {
    nr: 3,
    nazwa: "Zimne telefony do właścicieli",
    opis: "Telefon do kogoś, kto sprzedaje sam i nie czeka na agenta. Jak przebić się przez formułkę i umówić spotkanie.",
    kolor: "fiolet",
    lekcje: [
      T("audyt-oskarzen", "Audyt oskarżeń", 5, "Przeczytaj technikę i wypisz trzy rzeczy, które właściciel myśli o agentach."),
      T("przerwanie-schematu", "Przerwanie schematu", 5, "Przeczytaj technikę i przygotuj jedno zdanie, które wyprzedza „nie współpracuję z biurami”."),
      T("sprzedaj-spotkanie", "Sprzedaj spotkanie, nie usługę", 5, "Przeczytaj technikę. Twój cel w telefonie to 20 minut przy mieszkaniu."),
      T("zamkniecie-alternatywne", "Zamknięcie alternatywne", 4, "Przeczytaj technikę i zawsze proponuj dwa terminy zamiast pytać „kiedy Pani może”."),
      S("zimny-telefon-fsbo", "Skrypt: zimny telefon do właściciela", 10, "Przejdź rozmowę z rozgałęzieniami do każdego z trzech rodzajów zakończenia."),
    ],
    sprawdzian: SPRAWDZIAN_3,
  },
  {
    nr: 4,
    nazwa: "Obiekcje",
    opis: "„Za drogo”, „muszę pomyśleć”, „sprzedam sam”. Jak odpowiadać, nie wchodząc w kłótnię i nie ustępując od razu.",
    kolor: "zloto",
    lekcje: [
      T("pytanie-o-powod", "Pytanie o powód", 4, "Przeczytaj technikę. Na każdą obiekcję w tym tygodniu odpowiadaj najpierw pytaniem."),
      T("izolacja-obiekcji", "Izolacja obiekcji", 5, "Przeczytaj technikę i naucz się pytania „czy coś jeszcze stoi na przeszkodzie?”."),
      T("zgoda-czesciowa", "Zgoda częściowa", 4, "Przeczytaj technikę. Zamień w głowie „tak, ale” na „i właśnie dlatego”."),
      T("obiekcja-w-pytanie", "Zamiana obiekcji w pytanie", 5, "Przeczytaj technikę i przećwicz zdanie „czyli pytanie brzmi...”."),
      { id: "bank-obiekcji", rodzaj: "obiekcje", slug: "", tytul: "Bank obiekcji", minut: 10, zadanie: "Przejrzyj obiekcje z grup Zimny telefon i Spotkanie z właścicielem. Przy każdej przeczytaj wszystkie trzy style odpowiedzi." },
    ],
    sprawdzian: SPRAWDZIAN_4,
  },
  {
    nr: 5,
    nazwa: "Spotkanie z właścicielem",
    opis: "Od oględzin do umowy pośrednictwa: diagnoza, cena z danych i plan sprzedaży.",
    kolor: "zielony",
    lekcje: [
      T("lejek-pytan", "Lejek pytań", 5, "Przeczytaj technikę i rozpisz swój lejek: 2 pytania szerokie, 2 średnie, 2 wąskie, 1 zamknięte."),
      T("spin", "SPIN", 7, "Przeczytaj technikę. Do jednego właściciela zadaj pytanie o implikację: co się stanie, jeśli nie sprzeda."),
      T("obiektywne-kryteria", "Obiektywne kryteria", 5, "Przeczytaj technikę. Przygotuj ceny z aktów notarialnych dla jednej dzielnicy."),
      T("male-tak", "Małe „tak” po drodze", 4, "Przeczytaj technikę. Przed propozycją zbierz dwa prawdziwe potwierdzenia."),
      S("spotkanie-pozyskowe", "Skrypt: spotkanie pozyskowe", 12, "Przejdź rozmowę z rozgałęzieniami: raz do podpisu, raz do uczciwego „nie”."),
    ],
    sprawdzian: SPRAWDZIAN_5,
  },
  {
    nr: 6,
    nazwa: "Negocjacje i domykanie",
    opis: "Cena, prowizja i warunki: jak ustępować mądrze, trzymać pozycję i kończyć każdą rozmowę konkretem.",
    kolor: "turkus",
    lekcje: [
      T("etykietowanie", "Etykietowanie emocji", 5, "Przeczytaj technikę i przygotuj trzy zdania zaczynające się od „wygląda na to, że...”."),
      T("pytania-kalibrowane", "Pytania kalibrowane", 5, "Przeczytaj technikę. Zamień trzy swoje pytania „czy” na „co” albo „jak”."),
      T("strategia-ustepstw", "Strategia ustępstw", 6, "Przeczytaj technikę i zapisz, co możesz dać w zamian za każde ustępstwo."),
      T("milczenie", "Milczenie", 3, "Przeczytaj technikę. Po podaniu ceny policz w myślach do pięciu."),
      T("nastepny-krok", "Następny krok", 4, "Przeczytaj technikę. Każdą rozmowę w tym tygodniu kończ datą i godziną."),
      S("negocjacja-prowizji", "Skrypt: negocjacja prowizji", 10, "Przejdź rozmowę z rozgałęzieniami do obrony stawki i do odejścia od stołu."),
    ],
    sprawdzian: SPRAWDZIAN_6,
  },
];

export const EGZAMIN: Sprawdzian = EGZAMIN_KONCOWY;

export const WSZYSTKIE_SPRAWDZIANY: Sprawdzian[] = [...MODULY_AKADEMII.map((m) => m.sprawdzian), EGZAMIN];
export const WSZYSTKIE_LEKCJE: Lekcja[] = MODULY_AKADEMII.flatMap((m) => m.lekcje);

export function sprawdzian(id: string): Sprawdzian | undefined {
  return WSZYSTKIE_SPRAWDZIANY.find((s) => s.id === id);
}

/** Biuro Spectra ma własną nazwę ścieżki. Reszta biur widzi nazwę ogólną. */
const SPECTRA = "fe78fb77-98e3-4e3e-831b-067c2fc4cc9e";

export function nazwaAkademii(agencyId: string | null | undefined): { pelna: string; krotka: string } {
  return agencyId === SPECTRA ? { pelna: "Spectra Academy", krotka: "Spectra Academy" } : { pelna: "Akademia dla nowych", krotka: "Akademia" };
}

/**
 * Adres materiału do lekcji. Parametr `akademia` mówi stronie techniki albo
 * skryptu, że czytelnik przyszedł ze ścieżki: wtedy pokazuje pasek powrotu.
 */
export function adresLekcji(l: Lekcja): string {
  const z = `akademia=${l.id}`;
  if (l.rodzaj === "technika") return `/app/techniki/${l.slug}?${z}`;
  if (l.rodzaj === "skrypt") return `/app/techniki/skrypty/${l.slug}?${z}`;
  if (l.rodzaj === "obiekcje") return `/app/techniki?widok=obiekcje&${z}`;
  return `/app/techniki?widok=struktura&${z}`;
}

export function lekcja(id: string | null | undefined): Lekcja | undefined {
  return id ? WSZYSTKIE_LEKCJE.find((l) => l.id === id) : undefined;
}

export type Wpis = { item: string; passed: boolean; best: number | null; attempts: number; updated: string };

export type StanLekcjiAkademii = Lekcja & { zrobiona: boolean; dostepna: boolean };
export type StanSprawdzianu = { id: string; tytul: string; prog: number; ile: number; dostepny: boolean; zaliczony: boolean; najlepszy: number | null; podejscia: number };
export type StanModulu = {
  nr: number;
  nazwa: string;
  opis: string;
  kolor: KolorModulu;
  otwarty: boolean;
  ukonczony: boolean;
  lekcje: StanLekcjiAkademii[];
  sprawdzian: StanSprawdzianu;
};
export type StanAkademii = {
  moduly: StanModulu[];
  egzamin: StanSprawdzianu;
  lekcjiZrobionych: number;
  lekcjiWszystkich: number;
  zaliczonych: number;
  sprawdzianow: number;
  /** Średni najlepszy wynik ze zdanych podejść, w procentach. */
  srednia: number | null;
  /** Gdzie agent jest teraz: id lekcji albo sprawdzianu. */
  aktualne: string | null;
  ukonczona: boolean;
};

function stanSprawdzianu(s: Sprawdzian, dostepny: boolean, w: Map<string, Wpis>): StanSprawdzianu {
  const x = w.get(s.id);
  return { id: s.id, tytul: s.tytul, prog: s.prog, ile: s.pytania.length, dostepny, zaliczony: Boolean(x?.passed), najlepszy: x?.best ?? null, podejscia: x?.attempts ?? 0 };
}

/**
 * Stan ścieżki z wpisów postępu. Moduł 1 jest otwarty od razu, każdy kolejny
 * po zaliczeniu sprawdzianu poprzedniego. Sprawdzian modułu otwiera się po
 * przerobieniu wszystkich jego lekcji, egzamin po ostatnim sprawdzianie.
 */
export function stanAkademii(wpisy: Wpis[]): StanAkademii {
  const w = new Map(wpisy.map((x) => [x.item, x]));
  let poprzedniZaliczony = true;
  let aktualne: string | null = null;
  const moduly: StanModulu[] = MODULY_AKADEMII.map((m) => {
    const otwarty = poprzedniZaliczony;
    const lekcje = m.lekcje.map((l) => ({ ...l, zrobiona: Boolean(w.get(l.id)?.passed), dostepna: otwarty }));
    const wszystkieZrobione = lekcje.every((l) => l.zrobiona);
    const spr = stanSprawdzianu(m.sprawdzian, otwarty && wszystkieZrobione, w);
    if (otwarty && !aktualne) {
      const pierwsza = lekcje.find((l) => !l.zrobiona);
      if (pierwsza) aktualne = pierwsza.id;
      else if (!spr.zaliczony) aktualne = spr.id;
    }
    poprzedniZaliczony = otwarty && spr.zaliczony;
    return { nr: m.nr, nazwa: m.nazwa, opis: m.opis, kolor: m.kolor, otwarty, ukonczony: otwarty && spr.zaliczony, lekcje, sprawdzian: spr };
  });
  const egzamin = stanSprawdzianu(EGZAMIN, poprzedniZaliczony, w);
  if (!aktualne && poprzedniZaliczony && !egzamin.zaliczony) aktualne = egzamin.id;

  const wyniki = [...moduly.map((m) => m.sprawdzian), egzamin].filter((s) => s.najlepszy !== null);
  const lekcjiZrobionych = moduly.reduce((a, m) => a + m.lekcje.filter((l) => l.zrobiona).length, 0);
  return {
    moduly,
    egzamin,
    lekcjiZrobionych,
    lekcjiWszystkich: WSZYSTKIE_LEKCJE.length,
    zaliczonych: [...moduly.map((m) => m.sprawdzian), egzamin].filter((s) => s.zaliczony).length,
    sprawdzianow: WSZYSTKIE_SPRAWDZIANY.length,
    srednia: wyniki.length ? Math.round(wyniki.reduce((a, s) => a + (s.najlepszy! / s.ile) * 100, 0) / wyniki.length) : null,
    aktualne,
    ukonczona: egzamin.zaliczony,
  };
}

/** Ocena odpowiedzi na serwerze. Zwraca liczbę poprawnych i numery błędnych pytań. */
export function ocen(s: Sprawdzian, odpowiedzi: number[]): { wynik: number; bledne: number[]; zaliczony: boolean } {
  const bledne: number[] = [];
  s.pytania.forEach((p, i) => {
    if (odpowiedzi[i] !== p.poprawna) bledne.push(i);
  });
  const wynik = s.pytania.length - bledne.length;
  return { wynik, bledne, zaliczony: wynik >= s.prog };
}
