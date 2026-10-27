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
    sprawdzian: {
      id: "sprawdzian-1",
      tytul: "Sprawdzian: dobra rozmowa",
      prog: 4,
      pytania: [
        {
          pytanie: "Który etap rozmowy powinien trwać najdłużej?",
          odpowiedzi: ["Otwarcie", "Diagnoza, czyli pytania i słuchanie", "Prezentacja biura", "Zamknięcie"],
          poprawna: 1,
          wyjasnienie: "Diagnoza zajmuje około jednej trzeciej rozmowy. Bez niej nie wiesz, co klientowi zaproponować.",
        },
        {
          pytanie: "Które pytanie jest pytaniem otwartym?",
          odpowiedzi: ["Czy szuka Pan trzech pokoi?", "Czy budżet to 600 tysięcy?", "Co sprawiło, że zatrzymał się Pan przy tym mieszkaniu?", "Czy ma Pan kredyt?"],
          poprawna: 2,
          wyjasnienie: "Pytanie otwarte zaczyna się od „co”, „jak”, „dlaczego” i nie da się na nie odpowiedzieć jednym słowem.",
          technika: "pytania-otwarte",
        },
        {
          pytanie: "Klient mówi: „Szukamy czegoś blisko szkoły córki”. Co robisz?",
          odpowiedzi: ["Od razu podajesz trzy oferty", "Dopytujesz: „Jak wygląda Wasz dzień, że ta odległość jest tak ważna?”", "Mówisz, że w tej okolicy jest drogo", "Pytasz o budżet"],
          poprawna: 1,
          wyjasnienie: "Dopytanie o szczegół z odpowiedzi pokazuje, że słuchasz, i daje Ci więcej informacji o prawdziwej potrzebie.",
          technika: "aktywne-sluchanie",
        },
        {
          pytanie: "Na czym polega parafraza?",
          odpowiedzi: ["Powtarzasz słowo w słowo, co powiedział klient", "Mówisz swoimi słowami, co zrozumiałeś, i pytasz, czy dobrze", "Zmieniasz temat na swoją ofertę", "Zadajesz pytanie zamknięte"],
          poprawna: 1,
          wyjasnienie: "Parafraza to Twoja wersja słów klienta zakończona pytaniem o potwierdzenie. Klient czuje się zrozumiany.",
          technika: "parafraza",
        },
        {
          pytanie: "Jaki jest typowy błąd na otwarciu rozmowy?",
          odpowiedzi: ["Przedstawienie się imieniem", "Długi monolog o biurze, zanim klient powie słowo", "Pytanie o zgodę na rozmowę", "Podanie powodu telefonu"],
          poprawna: 1,
          wyjasnienie: "Monolog o biurze to najczęstsza pułapka otwarcia. Klient wyłącza się, zanim usłyszy, po co dzwonisz.",
        },
        {
          pytanie: "Jak powinna kończyć się każda rozmowa?",
          odpowiedzi: ["„To ja się odezwę”", "Konkretnym następnym krokiem z datą i godziną", "Wysłaniem oferty mailem", "Podziękowaniem za rozmowę"],
          poprawna: 1,
          wyjasnienie: "Rozmowa bez ustalonego następnego kroku to rozmowa, która nie posunęła sprawy do przodu.",
          technika: "nastepny-krok",
        },
      ],
    },
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
    sprawdzian: {
      id: "sprawdzian-2",
      tytul: "Sprawdzian: pierwszy telefon",
      prog: 4,
      pytania: [
        {
          pytanie: "Kiedy najlepiej oddzwonić do osoby, która zapytała o ofertę na portalu?",
          odpowiedzi: ["Następnego dnia rano", "W ciągu 15 minut", "Pod koniec tygodnia, zbiorczo", "Gdy sama zadzwoni drugi raz"],
          poprawna: 1,
          wyjasnienie: "Szybki telefon łapie klienta, póki pamięta ogłoszenie. Każda godzina zwłoki obniża szansę kontaktu.",
        },
        {
          pytanie: "Klient mówi: „Nie mam teraz czasu”. Co odpowiadasz?",
          odpowiedzi: ["„To zajmie tylko minutę”", "„Jasne, nie zatrzymuję. Dziś po 18 czy jutro przed 10?”", "„To kiedy mogę zadzwonić?”", "Rozłączasz się bez słowa"],
          poprawna: 1,
          wyjasnienie: "Nie przekonujesz, tylko proponujesz dwie konkretne godziny. Kto naprawdę jest zajęty, wybierze jedną z nich.",
          technika: "umow-oddzwonienie",
        },
        {
          pytanie: "Który powód telefonu jest najlepszy?",
          odpowiedzi: ["„Dzwonię, bo szukamy mieszkań do sprzedaży”", "„Rozszerzamy działalność na Pani dzielnicę”", "„W Pani budynku sprzedało się mieszkanie za 712 tysięcy, a Pani jest wystawiona za 789”", "„Chciałem się przedstawić”"],
          poprawna: 2,
          wyjasnienie: "Dobry powód dotyczy rozmówcy i ma konkret z liczbą. Powód o biurze nikogo nie interesuje.",
          technika: "konkretny-powod-telefonu",
        },
        {
          pytanie: "Co robisz zaraz po pytaniu „Ma Pani dwie minuty?”",
          odpowiedzi: ["Mówisz dalej, żeby nie było ciszy", "Milczysz i czekasz na odpowiedź", "Dodajesz, że to naprawdę krótko", "Od razu zadajesz pierwsze pytanie"],
          poprawna: 1,
          wyjasnienie: "Po pytaniu o zgodę zamilknij. Rozmówca, który sam powiedział „dobrze”, słucha dalej uważniej.",
          technika: "otwarcie-z-pozwoleniem",
        },
        {
          pytanie: "Lead nie odbiera. Jaki SMS wysyłasz?",
          odpowiedzi: ["„Proszę o kontakt”", "Długi opis biura z linkiem do strony", "Imię, biuro, powód i propozycja dwóch godzin", "Nic, dzwonisz co godzinę"],
          poprawna: 2,
          wyjasnienie: "Krótki SMS z imieniem, powodem i konkretem sprawia, że przestajesz być nieznanym numerem.",
          technika: "wiadomosc-po-nieodebranym",
        },
        {
          pytanie: "Kupujący bez policzonej zdolności kredytowej chce oglądać. Co proponujesz?",
          odpowiedzi: ["Od razu umawiasz prezentację", "Odmawiasz pokazania mieszkania", "Proponujesz rozmowę z doradcą kredytowym przed oglądaniem", "Każesz wrócić za pół roku"],
          poprawna: 2,
          wyjasnienie: "Kupujący z policzonym kredytem to kupujący, którego właściciel traktuje poważnie. Oszczędzasz czas wszystkim.",
        },
      ],
    },
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
    sprawdzian: {
      id: "sprawdzian-3",
      tytul: "Sprawdzian: zimne telefony",
      prog: 4,
      pytania: [
        {
          pytanie: "Jaki jest cel zimnego telefonu do właściciela?",
          odpowiedzi: ["Podpisanie umowy przez telefon", "Umówienie krótkiego spotkania przy mieszkaniu", "Wysłanie wzoru umowy mailem", "Podanie wysokości prowizji"],
          poprawna: 1,
          wyjasnienie: "Przez telefon nie sprzedasz umowy. Sprzedajesz 20 minut z raportem cen, resztę robisz na miejscu.",
          technika: "sprzedaj-spotkanie",
        },
        {
          pytanie: "Które zdanie to audyt oskarżeń?",
          odpowiedzi: ["„Nie jestem typowym agentem”", "„Pewnie pomyśli Pani, że to kolejny agent, który będzie namawiał na umowę”", "„Nasze biuro jest najlepsze w mieście”", "„Proszę się nie rozłączać”"],
          poprawna: 1,
          wyjasnienie: "Audyt oskarżeń nazywa na głos to, co rozmówca myśli o Tobie. „Nie jestem typowym agentem” mówi każdy agent.",
          technika: "audyt-oskarzen",
        },
        {
          pytanie: "Właściciel mówi: „Nie współpracuję z biurami”. Co jest najlepszym pierwszym krokiem?",
          odpowiedzi: ["Wymienić wszystkie zalety biura", "Zapytać, co sprawiło, że podjął taką decyzję", "Powiedzieć, że bez biura nie sprzeda", "Od razu się pożegnać"],
          poprawna: 1,
          wyjasnienie: "Pytanie o powód zamienia ścianę w informację. Często słyszysz złe doświadczenie, na które można odpowiedzieć.",
          technika: "pytanie-o-powod",
        },
        {
          pytanie: "Jak proponujesz termin spotkania?",
          odpowiedzi: ["„Kiedy Pani może?”", "„Może kiedyś się spotkamy?”", "„Pasuje bardziej czwartek o 17 czy sobota o 11?”", "„Proszę dać znać, jak Pani znajdzie czas”"],
          poprawna: 2,
          wyjasnienie: "Dwie konkretne opcje przenoszą rozmowę z „czy” na „kiedy”.",
          technika: "zamkniecie-alternatywne",
        },
        {
          pytanie: "Właściciel prosi: „Proszę wysłać ofertę mailem”. Co odpowiadasz?",
          odpowiedzi: ["Wysyłasz i czekasz na odpowiedź", "Wysyłasz i umawiasz telefon w konkretnym dniu, albo proponujesz 20 minut na miejscu", "Mówisz, że nie wysyłasz maili", "Wysyłasz pięć maili w tygodniu"],
          poprawna: 1,
          wyjasnienie: "Mail bez umówionego kolejnego kontaktu to koniec znajomości. Mail z terminem telefonu to otwarta furtka.",
        },
        {
          pytanie: "Właściciel ma już kupca i podpisuje przedwstępną w piątek. Co robisz?",
          odpowiedzi: ["Przekonujesz, że kupiec się wycofa", "Gratulujesz, zostawiasz numer i propozycję pomocy, gdyby coś się posypało", "Rozłączasz się", "Proponujesz niższą prowizję"],
          poprawna: 1,
          wyjasnienie: "Nie walczysz o klienta, który ma kupca. Dobre wrażenie wraca, gdy przedwstępna rozpadnie się na kredycie.",
          technika: "wzajemnosc",
        },
      ],
    },
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
    sprawdzian: {
      id: "sprawdzian-4",
      tytul: "Sprawdzian: obiekcje",
      prog: 4,
      pytania: [
        {
          pytanie: "Klient mówi „muszę to przemyśleć”. Co najczęściej to znaczy?",
          odpowiedzi: ["Naprawdę potrzebuje czasu i nic więcej", "Ma konkretną wątpliwość, której nie powiedział", "Na pewno odmówi", "Chce niższej prowizji i nic więcej"],
          poprawna: 1,
          wyjasnienie: "„Muszę pomyśleć” zwykle przykrywa konkretną wątpliwość: cenę, prowizję, zaufanie albo drugą osobę decyzyjną.",
          technika: "izolacja-obiekcji",
        },
        {
          pytanie: "Do czego służy pytanie „Jeśli ustalimy kwestię prowizji, czy coś jeszcze stoi na przeszkodzie?”",
          odpowiedzi: ["Do zakończenia rozmowy", "Do sprawdzenia, czy prowizja to jedyna przeszkoda", "Do podniesienia prowizji", "Do zmiany tematu"],
          poprawna: 1,
          wyjasnienie: "Izolacja pokazuje, czy rozmawiasz o prawdziwej przeszkodzie. Nie ma sensu ustępować w prowizji, jeśli klient i tak nie jest gotowy.",
          technika: "izolacja-obiekcji",
        },
        {
          pytanie: "Które zdanie to dobra zgoda częściowa?",
          odpowiedzi: ["„Tak, ale się Pan myli”", "„Ma Pan rację, że wielu agentów tylko wstawia ogłoszenie. I właśnie dlatego co tydzień dostaje Pan raport”", "„Nie ma Pan racji”", "„Każdy tak mówi”"],
          poprawna: 1,
          wyjasnienie: "Przyznajesz rację w tym, co prawdziwe, i od tego przechodzisz do argumentu. Słowo „ale” kasuje całą zgodę.",
          technika: "zgoda-czesciowa",
        },
        {
          pytanie: "Klient: „Nie dam 20 tysięcy prowizji”. Jak zamienić to w pytanie?",
          odpowiedzi: ["„Czyli pytanie brzmi, czy z biurem dostanie Pan na koncie więcej niż sam?”", "„Czemu Pan jest taki skąpy?”", "„Dobrze, to 10 tysięcy”", "„Czy na pewno?”"],
          poprawna: 0,
          wyjasnienie: "Przeformułowana obiekcja staje się problemem do policzenia wspólnie, a nie wyrokiem.",
          technika: "obiekcja-w-pytanie",
        },
        {
          pytanie: "Czego NIE robić po usłyszeniu obiekcji?",
          odpowiedzi: ["Dopytać o powód", "Od razu ustąpić albo się kłócić", "Wysłuchać do końca", "Sprawdzić, czy to jedyna przeszkoda"],
          poprawna: 1,
          wyjasnienie: "Kłótnia i natychmiastowe ustępstwo to dwa najczęstsze błędy przy obiekcjach.",
        },
        {
          pytanie: "Właściciel: „Sąsiad wystawił za 950, ja też chcę tyle”. Najlepsza odpowiedź?",
          odpowiedzi: ["„Ma Pan rację, wystawmy za 950”", "„To za dużo, nikt nie kupi”", "Pokazujesz ceny z aktów notarialnych i to, od kiedy wisi ogłoszenie sąsiada", "Zmieniasz temat"],
          poprawna: 2,
          wyjasnienie: "Cena z ogłoszenia to nie cena transakcji. Obiektywne dane kończą spór o opinie.",
          technika: "obiektywne-kryteria",
        },
      ],
    },
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
    sprawdzian: {
      id: "sprawdzian-5",
      tytul: "Sprawdzian: spotkanie z właścicielem",
      prog: 4,
      pytania: [
        {
          pytanie: "W jakiej kolejności zadajesz pytania w lejku?",
          odpowiedzi: ["Od budżetu do marzeń", "Od szerokich, przez szczegóły, do zamkniętego potwierdzenia", "Same pytania zamknięte", "Losowo"],
          poprawna: 1,
          wyjasnienie: "Najpierw łatwe, szerokie pytania o sytuację, potem szczegóły, a na końcu zamknięte potwierdzenie ustaleń.",
          technika: "lejek-pytan",
        },
        {
          pytanie: "Co oznacza „I” w SPIN?",
          odpowiedzi: ["Informacja o biurze", "Implikacja: co się stanie, jeśli problem nie zostanie rozwiązany", "Inwestycja", "Izolacja obiekcji"],
          poprawna: 1,
          wyjasnienie: "Pytanie o implikację sprawia, że klient sam mówi, ile kosztuje czekanie. Nie musisz niczego udowadniać.",
          technika: "spin",
        },
        {
          pytanie: "Na czym opierasz propozycję ceny ofertowej?",
          odpowiedzi: ["Na cenach z ogłoszeń w okolicy", "Na cenach transakcyjnych z aktów notarialnych", "Na tym, ile chce właściciel", "Na intuicji"],
          poprawna: 1,
          wyjasnienie: "Ceny z aktów to fakty, a nie opinia. Z danymi nie kłócisz się z właścicielem, tylko razem patrzycie na rynek.",
          technika: "obiektywne-kryteria",
        },
        {
          pytanie: "Właściciel chce wystartować z ceną wyraźnie powyżej rynku. Co proponujesz?",
          odpowiedzi: ["Zgadzasz się bez warunków", "Odchodzisz od razu", "Start wyżej z umówionym z góry terminem i kwotą korekty, jeśli nie będzie prezentacji", "Wpisujesz niższą cenę bez pytania"],
          poprawna: 2,
          wyjasnienie: "Ustalenie korekty z góry chroni pierwsze tygodnie ogłoszenia, a właściciel trzyma się słowa, które sam dał.",
          technika: "zaangazowanie-konsekwencja",
        },
        {
          pytanie: "Właściciel: „Musimy porozmawiać z innym biurem”. Najlepsza odpowiedź?",
          odpowiedzi: ["„Inne biura są słabe”", "„To rozsądne. Zapytajcie ich o ceny z aktów, plan na pierwszy tydzień i raporty. Zadzwonię w czwartek”", "„Dobrze, do widzenia”", "„Obniżę prowizję, jeśli podpiszecie dziś”"],
          poprawna: 1,
          wyjasnienie: "Dajesz klientowi kryteria porównania, które Ty spełniasz, i ustalasz kolejny kontakt.",
        },
        {
          pytanie: "Kiedy proponujesz podpisanie umowy?",
          odpowiedzi: ["Na samym początku spotkania", "Po diagnozie, cenie z danych i planie sprzedaży, gdy obiekcje są wyjaśnione", "Nigdy, klient sam zaproponuje", "Po tygodniu mailem"],
          poprawna: 1,
          wyjasnienie: "Umowa jest naturalnym następnym krokiem dopiero wtedy, gdy klient zna cenę, plan i ma odpowiedzi na wątpliwości.",
        },
      ],
    },
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
    sprawdzian: {
      id: "sprawdzian-6",
      tytul: "Sprawdzian: negocjacje",
      prog: 4,
      pytania: [
        {
          pytanie: "Właściciel prosi o niższą prowizję. Co robisz w pierwszej kolejności?",
          odpowiedzi: ["Od razu się zgadzasz", "Pytasz, z czym ją porównuje, i nie bronisz się od razu", "Mówisz, że stawka jest sztywna", "Kończysz rozmowę"],
          poprawna: 1,
          wyjasnienie: "Najpierw zrozum, skąd bierze się obiekcja. Bez tego nie wiesz, czy rozmawiasz o cenie, czy o wartości.",
          technika: "etykietowanie",
        },
        {
          pytanie: "Które ustępstwo jest dobre?",
          odpowiedzi: ["„Dobrze, niech będzie 2 procent”", "„Mogę zejść do 2,2 procent, jeśli podpiszemy wyłączność na cztery miesiące”", "„Dam rabat, jeśli Pani zapłaci od razu”", "Ustępujesz po każdym pytaniu"],
          poprawna: 1,
          wyjasnienie: "Ustępstwo tylko w zamian za coś, co ma dla Ciebie wartość. Nigdy za darmo i nigdy od razu.",
          technika: "strategia-ustepstw",
        },
        {
          pytanie: "Które pytanie jest pytaniem kalibrowanym?",
          odpowiedzi: ["„Czy zgadza się Pani?”", "„Co musiałoby się wydarzyć, żeby ta decyzja była łatwa?”", "„Podpisujemy?”", "„Prawda, że to dobra cena?”"],
          poprawna: 1,
          wyjasnienie: "Pytania „co” i „jak” zapraszają rozmówcę do szukania rozwiązania razem z Tobą.",
          technika: "pytania-kalibrowane",
        },
        {
          pytanie: "Co robisz po podaniu ceny albo propozycji?",
          odpowiedzi: ["Od razu ją uzasadniasz", "Milczysz i czekasz na reakcję", "Od razu proponujesz rabat", "Zmieniasz temat"],
          poprawna: 1,
          wyjasnienie: "Cisza po propozycji daje rozmówcy czas. Kto pierwszy przerywa ciszę, ten zwykle ustępuje.",
          technika: "milczenie",
        },
        {
          pytanie: "Klient upiera się przy prowizji, przy której nie zrobisz dobrze swojej pracy. Co robisz?",
          odpowiedzi: ["Zgadzasz się, żeby nie stracić klienta", "Spokojnie mówisz o swojej granicy i jesteś gotów odejść", "Obiecujesz więcej, niż możesz zrobić", "Obrażasz się"],
          poprawna: 1,
          wyjasnienie: "Agent, który nie umie odejść, zawsze negocjuje w dół. Twoja granica i plan B to Twoja siła.",
          technika: "plan-b",
        },
        {
          pytanie: "Które zakończenie rozmowy jest najlepsze?",
          odpowiedzi: ["„To się zdzwonimy”", "„Dam znać”", "„Przygotuję raport do środy, w czwartek o 17 spotykamy się na 20 minut”", "„Proszę się zastanowić”"],
          poprawna: 2,
          wyjasnienie: "Konkretny krok z datą i godziną. Wszystko inne to rozmowa, która nie posunęła sprawy do przodu.",
          technika: "nastepny-krok",
        },
      ],
    },
  },
];

export const EGZAMIN: Sprawdzian = {
  id: "egzamin",
  tytul: "Egzamin końcowy Akademii",
  prog: 9,
  pytania: [
    {
      pytanie: "Właściciel odbiera i mówi: „Pewnie znowu agent”. Najlepsza reakcja?",
      odpowiedzi: ["„Nie, jestem innym agentem”", "„Tak, i pewnie ma Pani dość takich telefonów. Mam jedno pytanie o cenę, dwie minuty?”", "Rozłączasz się", "„Proszę mnie wysłuchać do końca”"],
      poprawna: 1,
      wyjasnienie: "Przyznanie się i nazwanie jego myśli (audyt oskarżeń) połączone z prośbą o krótką zgodę rozbraja nieufność.",
      technika: "audyt-oskarzen",
    },
    {
      pytanie: "Kupujący pyta: „Ile da się zejść z ceny?”. Co odpowiadasz?",
      odpowiedzi: ["Podajesz kwotę, o którą właściciel może zejść", "Prosisz o ofertę na piśmie z warunkami finansowania i zanosisz ją właścicielowi", "Mówisz, że cena jest sztywna", "Pytasz, ile ma oszczędności"],
      poprawna: 1,
      wyjasnienie: "Nie negocjujesz w ciemno. Oferta na piśmie z finansowaniem to konkret, który można przekazać.",
      technika: "ograniczony-mandat",
    },
    {
      pytanie: "Właściciel: „Muszę porozmawiać z mężem”. Najlepsza odpowiedź?",
      odpowiedzi: ["„Dobrze, proszę dać znać”", "„Najlepiej spotkajmy się we trójkę na 20 minut. Sobota rano pasuje?”", "„Mąż na pewno się zgodzi”", "„Proszę podpisać, a mężowi powie Pani później”"],
      poprawna: 1,
      wyjasnienie: "Druga osoba decyzyjna powinna być przy rozmowie, a nie słuchać relacji z drugiej ręki.",
      technika: "ograniczony-mandat",
    },
    {
      pytanie: "Ile argumentów najlepiej podać klientowi na koniec prezentacji?",
      odpowiedzi: ["Jeden", "Trzy", "Dziesięć", "Wszystkie, jakie masz"],
      poprawna: 1,
      wyjasnienie: "Trzy argumenty klient zapamiętuje najlepiej. Lista dziesięciu zalet ginie w pamięci.",
      technika: "regula-trzech",
    },
    {
      pytanie: "Oferta wisi 8 tygodni bez ofert kupna. Jak zaczynasz rozmowę o obniżce?",
      odpowiedzi: ["„Musimy obniżyć, bo nikt nie chce”", "Liczbami: wyświetlenia, telefony, prezentacje i ceny transakcji obok", "Czekasz, aż właściciel sam zaproponuje", "Obniżasz bez pytania"],
      poprawna: 1,
      wyjasnienie: "Fakty zamiast opinii. Liczby rozmawiają za Ciebie, a właściciel sam widzi, gdzie jest problem.",
      technika: "obiektywne-kryteria",
    },
    {
      pytanie: "Kupujący po prezentacji mówi: „Zastanowimy się i damy znać”. Co robisz?",
      odpowiedzi: ["„Dobrze, czekam”", "Pytasz, nad czym konkretnie, i proponujesz konkretny następny krok z terminem", "Naciskasz na decyzję od razu", "Obniżasz cenę"],
      poprawna: 1,
      wyjasnienie: "„Damy znać” bez terminu zwykle znaczy „nie”. Konkretny krok utrzymuje sprawę przy życiu.",
      technika: "nastepny-krok",
    },
    {
      pytanie: "Który powód telefonu do wygasłej oferty jest najlepszy?",
      odpowiedzi: ["„Dzwonię, bo szukamy mieszkań”", "„Widziałem, że ogłoszenie zniknęło. Zrezygnowała Pani ze sprzedaży czy tylko zrobiła przerwę?”", "„Mamy najlepszą ofertę w mieście”", "„Chciałem zapytać, czy coś się zmieniło”"],
      poprawna: 1,
      wyjasnienie: "Pokazujesz, że wiesz, co się stało, i zadajesz pytanie o sytuację rozmówcy.",
      technika: "konkretny-powod-telefonu",
    },
    {
      pytanie: "Klient: „Prowizja jest za wysoka”. Która odpowiedź łączy zgodę częściową z argumentem?",
      odpowiedzi: ["„Zgadzam się, że to duża kwota. Dlatego płaci ją Pani dopiero przy akcie”", "„Nie jest wysoka”", "„Wszyscy tyle biorą”", "„Dobrze, obniżę”"],
      poprawna: 0,
      wyjasnienie: "Przyznajesz rację w prawdziwej części obiekcji i od niej przechodzisz do argumentu.",
      technika: "zgoda-czesciowa",
    },
    {
      pytanie: "Po czym poznasz, że diagnoza była dobra?",
      odpowiedzi: ["Klient dużo słuchał", "Znasz motywację, termin, budżet i osobę decyzyjną", "Opowiedziałeś całą ofertę biura", "Rozmowa trwała krótko"],
      poprawna: 1,
      wyjasnienie: "Dobra diagnoza daje cztery rzeczy: dlaczego, do kiedy, za ile i kto decyduje.",
      technika: "lejek-pytan",
    },
    {
      pytanie: "Kolejny telefon do właściciela, który powiedział „nie teraz”. Od czego zaczynasz?",
      odpowiedzi: ["„Dzwonię zapytać, czy coś się zmieniło”", "Od nowej informacji: transakcji w okolicy albo kupującego z bazy", "Od przypomnienia, że czekasz na decyzję", "Od propozycji niższej prowizji"],
      poprawna: 1,
      wyjasnienie: "Każdy kolejny kontakt przynosi coś nowego. Dzwonisz jako ekspert, a nie jako natręt.",
      technika: "telefon-z-wartoscia",
    },
    {
      pytanie: "Czym jest „małe tak”?",
      odpowiedzi: ["Seria podchwytliwych pytań z oczywistą odpowiedzią", "Kilka prawdziwych potwierdzeń sytuacji klienta przed propozycją", "Zgoda na niższą prowizję", "Podpis na umowie"],
      poprawna: 1,
      wyjasnienie: "Prawdziwe potwierdzenia budują kierunek rozmowy. Pytania podchwytliwe to manipulacja, którą klient czuje.",
      technika: "male-tak",
    },
    {
      pytanie: "Klient przekazuje ofertę 742 tysiące. Jak przekazujesz ją właścicielowi?",
      odpowiedzi: ["Najpierw kwota, potem reszta", "Najpierw jakość kupującego (finansowanie, termin), potem kwota", "Mailem bez komentarza", "Mówisz, że oferta jest słaba"],
      poprawna: 1,
      wyjasnienie: "Pewne finansowanie i szybki termin są warte pieniędzy. Właściciel ocenia ofertę lepiej, znając cały kontekst.",
      technika: "kotwiczenie",
    },
  ],
};

export const WSZYSTKIE_SPRAWDZIANY: Sprawdzian[] = [...MODULY_AKADEMII.map((m) => m.sprawdzian), EGZAMIN];
export const WSZYSTKIE_LEKCJE: Lekcja[] = MODULY_AKADEMII.flatMap((m) => m.lekcje);

export function sprawdzian(id: string): Sprawdzian | undefined {
  return WSZYSTKIE_SPRAWDZIANY.find((s) => s.id === id);
}

/** Adres materiału do lekcji. */
export function adresLekcji(l: Lekcja): string {
  if (l.rodzaj === "technika") return `/app/techniki/${l.slug}`;
  if (l.rodzaj === "skrypt") return `/app/techniki/skrypty/${l.slug}`;
  if (l.rodzaj === "obiekcje") return "/app/techniki?widok=obiekcje";
  return "/app/techniki?widok=struktura";
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
