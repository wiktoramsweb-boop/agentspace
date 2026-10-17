// Skrypty rozmów i uniwersalna struktura rozmowy. Kwestie to punkty wyjścia,
// nie tekst do recytowania: agent ma je powiedzieć własnymi słowami.

export type Etap = {
  nazwa: string;
  cel: string;
  czas: string;
  kwestie: string[];
  pytania?: string[];
  uwaga?: string;
};

export type Skrypt = {
  slug: string;
  nazwa: string;
  rodzaj: "telefon" | "spotkanie";
  dlaKogo: string;
  cel: string;
  czas: string;
  etapy: Etap[];
  obiekcje: { obiekcja: string; odpowiedz: string; technika: string }[];
  techniki: string[];
  scenariusze: string[];
};

/** Sześć etapów, które ma każda dobra rozmowa sprzedażowa w nieruchomościach. */
export const STRUKTURA: { nazwa: string; cel: string; procent: number; pulapka: string }[] = [
  { nazwa: "Otwarcie", cel: "Przedstaw się, podaj powód i uzyskaj zgodę na rozmowę.", procent: 10, pulapka: "Długi monolog o biurze, zanim klient powie słowo." },
  { nazwa: "Powód i kontekst", cel: "Wyjaśnij, dlaczego dzwonisz akurat do tej osoby, z korzyścią dla niej.", procent: 10, pulapka: "„Dzwonię, bo szukamy mieszkań” zamiast konkretu o kliencie." },
  { nazwa: "Diagnoza", cel: "Pytaniami odkryj sytuację, motywację, termin, budżet i osobę decyzyjną.", procent: 35, pulapka: "Przeskok do oferty po pierwszym pytaniu." },
  { nazwa: "Wartość", cel: "Pokaż, jak rozwiązujesz to, co klient sam powiedział. Maksymalnie trzy argumenty.", procent: 20, pulapka: "Lista wszystkich zalet biura, niezwiązana z potrzebami." },
  { nazwa: "Obiekcje", cel: "Wysłuchaj, dopytaj o powód, izoluj i odpowiedz na prawdziwą przeszkodę.", procent: 15, pulapka: "Kłótnia albo natychmiastowe ustępstwo." },
  { nazwa: "Zamknięcie", cel: "Konkretny następny krok z datą i godziną, potwierdzony na koniec.", procent: 10, pulapka: "„To ja się odezwę” bez terminu." },
];

export const SKRYPTY: Skrypt[] = [
  {
    slug: "zimny-telefon-fsbo",
    nazwa: "Zimny telefon do właściciela, który sprzedaje sam",
    rodzaj: "telefon",
    dlaKogo: "Właściciel z ogłoszenia prywatnego (OLX, Otodom, grupy)",
    cel: "Umówić 20-minutowe spotkanie w mieszkaniu",
    czas: "4-6 minut",
    etapy: [
      {
        nazwa: "Otwarcie",
        cel: "Rozbroić nieufność w pierwszych 15 sekundach",
        czas: "0:00-0:30",
        kwestie: [
          "Dzień dobry, [imię] z biura [nazwa]. Dzwonię w sprawie ogłoszenia mieszkania na [ulica]. Czy rozmawiam z właścicielem?",
          "Pewnie pomyśli Pani, że to kolejny agent, który będzie namawiał na umowę. Rozumiem. Mam tylko jedno pytanie, zajmie to dwie minuty. Może być?",
        ],
        uwaga: "Audyt oskarżeń zamiast „nie jestem typowym agentem”. Po pytaniu o zgodę milcz.",
      },
      {
        nazwa: "Powód",
        cel: "Dać konkretny, prawdziwy powód telefonu",
        czas: "0:30-1:00",
        kwestie: [
          "Przygotowuję zestawienie cen transakcyjnych z [dzielnica] z aktów notarialnych. Pani mieszkanie jest wystawione [powyżej / w okolicy] tych cen, więc chciałem zapytać, jak idzie sprzedaż.",
        ],
      },
      {
        nazwa: "Diagnoza",
        cel: "Odkryć motywację, termin i to, co nie działa",
        czas: "1:00-3:30",
        kwestie: ["(słuchaj, parafrazuj, używaj lustra)"],
        pytania: [
          "Jak wygląda zainteresowanie od wystawienia ogłoszenia?",
          "Co dzieje się dalej, gdy ktoś zadzwoni?",
          "Do kiedy chciałaby Pani sprzedać i co się wtedy wydarzy?",
          "Co by się stało, gdyby ogłoszenie wisiało jeszcze trzy miesiące?",
          "Kto oprócz Pani decyduje o sprzedaży?",
        ],
        uwaga: "SPIN: sytuacja, problem, implikacja. Nie mów jeszcze nic o biurze.",
      },
      {
        nazwa: "Wartość",
        cel: "Połączyć jedną potrzebę z jednym konkretem",
        czas: "3:30-4:30",
        kwestie: [
          "Powiedziała Pani, że najbardziej męczą Panią telefony od osób bez finansowania. U nas każdy kupujący przed oglądaniem ma rozmowę z doradcą kredytowym. Ogląda tylko ten, kto może kupić.",
          "Mogę przynieść raport z cen z aktów notarialnych z Pani okolicy, bez zobowiązań.",
        ],
      },
      {
        nazwa: "Zamknięcie",
        cel: "Umówić spotkanie z wyborem terminu",
        czas: "4:30-5:30",
        kwestie: [
          "Raport zajmuje 20 minut omówienia, najlepiej przy mieszkaniu, żeby uwzględnić stan i piętro. Pasuje Pani bardziej czwartek o 17 czy sobota o 11?",
          "Zapisuję: czwartek 17:00, [adres]. Wyślę SMS z potwierdzeniem i moim numerem.",
        ],
      },
    ],
    obiekcje: [
      { obiekcja: "Nie współpracuję z biurami.", odpowiedz: "Rozumiem. Co sprawiło, że podjęła Pani taką decyzję? (wysłuchaj) Nie proszę o umowę, tylko o 20 minut z raportem cen. Po nim sama Pani oceni, czy to ma sens.", technika: "pytanie-o-powod" },
      { obiekcja: "Nie zapłacę prowizji.", odpowiedz: "Jasne, nikt nie lubi płacić za nic. Gdyby okazało się, że z nami sprzeda Pani szybciej i za kwotę, która pokryje wynagrodzenie, czy byłoby o czym rozmawiać?", technika: "izolacja-obiekcji" },
      { obiekcja: "Mam już kupca.", odpowiedz: "Gratuluję! Czy podpisaliście już umowę przedwstępną? Jeśli coś się posypie, mogę zostawić raport cen, przyda się w negocjacji.", technika: "wzajemnosc" },
      { obiekcja: "Proszę przysłać ofertę mailem.", odpowiedz: "Chętnie. Żeby nie wysyłać ogólnika, jedno pytanie: co jest dla Pani ważniejsze, termin czy cena?", technika: "lejek-pytan" },
    ],
    techniki: ["audyt-oskarzen", "spin", "wzajemnosc", "zamkniecie-alternatywne"],
    scenariusze: ["zimny-telefon-fsbo", "obiekcja-zadnych-umow", "obiekcja-nie-place-prowizji"],
  },
  {
    slug: "lead-z-portalu",
    nazwa: "Oddzwonienie do kupującego z portalu",
    rodzaj: "telefon",
    dlaKogo: "Osoba, która zapytała o ofertę na Otodom lub OLX",
    cel: "Kwalifikacja i umówienie prezentacji, a jeśli oferta nie pasuje, zapis do poszukiwań",
    czas: "5-8 minut",
    etapy: [
      {
        nazwa: "Otwarcie",
        cel: "Szybki kontakt, póki klient pamięta ogłoszenie",
        czas: "0:00-0:30",
        kwestie: ["Dzień dobry, [imię] z [biuro]. Pytał Pan o mieszkanie na [ulica], trzy pokoje za [cena]. Ma Pan chwilę?"],
        uwaga: "Dzwoń w ciągu 15 minut od zapytania. Każda godzina zwłoki obniża szansę kontaktu.",
      },
      {
        nazwa: "Diagnoza (lejek)",
        cel: "Poznać potrzebę, budżet, finansowanie i termin",
        czas: "0:30-4:00",
        kwestie: ["(od szerokich do wąskich pytań)"],
        pytania: [
          "Co sprawiło, że zatrzymał się Pan akurat przy tym ogłoszeniu?",
          "Dla kogo jest mieszkanie: dla Pana, rodziny, na wynajem?",
          "Co jest absolutnie konieczne, a co miłym dodatkiem?",
          "Jak planuje Pan finansowanie: kredyt, gotówka, sprzedaż innego mieszkania?",
          "Czy ma Pan już decyzję kredytową albo rozmowę z doradcą?",
          "Od kiedy chciałby Pan mieszkać?",
        ],
      },
      {
        nazwa: "Dopasowanie",
        cel: "Uczciwie powiedzieć, czy ta oferta pasuje",
        czas: "4:00-5:30",
        kwestie: [
          "Z tego, co Pan mówi, to mieszkanie spełnia trzy z czterech warunków. Brakuje balkonu, ale jest duża loggia. Warto zobaczyć na żywo.",
          "Jeśli nie pasuje: Mam dwie inne oferty, które lepiej odpowiadają temu, co Pan opisał. Wpiszę Pana do poszukiwań, żeby dostawał Pan nowe oferty od razu.",
        ],
      },
      {
        nazwa: "Zamknięcie",
        cel: "Termin prezentacji",
        czas: "5:30-6:30",
        kwestie: ["Mam wolne jutro o 17:30 i w sobotę o 10. Co Panu bardziej pasuje?", "Wyślę SMS z adresem i moim numerem. Proszę zabrać osobę, która będzie decydować razem z Panem."],
      },
    ],
    obiekcje: [
      { obiekcja: "Chcę tylko zapytać o cenę, czy do negocjacji.", odpowiedz: "Właściciel jest otwarty na rozmowę z kupującym, który ma finansowanie i obejrzał mieszkanie. Zobaczmy je najpierw, potem porozmawiamy o konkretach.", technika: "zaangazowanie-konsekwencja" },
      { obiekcja: "Proszę podać dokładny adres, pojadę sam zobaczyć z zewnątrz.", odpowiedz: "Podam ulicę i okolicę, a dokładny adres w SMS-ie z potwierdzeniem prezentacji. Właściciel prosi o to ze względów bezpieczeństwa.", technika: "ograniczony-mandat" },
      { obiekcja: "Prowizja od kupującego? To nie dla mnie.", odpowiedz: "Rozumiem. Co by musiało się wydarzyć, żeby ta usługa była dla Pana warta swojej ceny?", technika: "pytania-kalibrowane" },
    ],
    techniki: ["lejek-pytan", "pytania-otwarte", "zamkniecie-alternatywne"],
    scenariusze: ["lead-z-otodom", "klient-gotowkowy-gdybanie"],
  },
  {
    slug: "spotkanie-pozyskowe",
    nazwa: "Spotkanie pozyskowe z właścicielem",
    rodzaj: "spotkanie",
    dlaKogo: "Właściciel, który rozważa sprzedaż z biurem",
    cel: "Podpisana umowa pośrednictwa, najlepiej na wyłączność",
    czas: "45-60 minut",
    etapy: [
      {
        nazwa: "Otwarcie i plan spotkania",
        cel: "Ustalić zasady i czas",
        czas: "0-5 min",
        kwestie: [
          "Dziękuję za zaproszenie. Proponuję taki plan: najpierw obejrzę mieszkanie i zadam kilka pytań, potem pokażę dane o cenach, a na końcu powiem, jak pracujemy. Jeśli uznamy, że to ma sens, ustalimy następne kroki. Pasuje?",
        ],
        uwaga: "Ustalenie planu na początku daje Ci prawo do zamknięcia na końcu.",
      },
      {
        nazwa: "Oględziny i diagnoza",
        cel: "Poznać motywację, termin, oczekiwania cenowe i obawy",
        czas: "5-20 min",
        kwestie: ["(oglądasz, notujesz, pytasz)"],
        pytania: [
          "Dlaczego zdecydowali się Państwo sprzedać właśnie teraz?",
          "Co chcecie zrobić z pieniędzmi ze sprzedaży: kupić coś, spłacić kredyt?",
          "Jaką kwotę macie w głowie i skąd się wzięła?",
          "Jakie macie doświadczenia z biurami?",
          "Czego najbardziej się obawiacie w tej sprzedaży?",
        ],
      },
      {
        nazwa: "Cena z danych",
        cel: "Ustalić realistyczną cenę ofertową na podstawie aktów notarialnych",
        czas: "20-30 min",
        kwestie: [
          "Przygotowałem wycenę z Rejestru Cen Nieruchomości: [liczba] transakcji w promieniu [km]. Mediana to [zł/m²], czyli dla Państwa mieszkania [kwota].",
          "Proponuję wystawić za [cena ofertowa], z przestrzenią do negocjacji do [cena minimalna].",
        ],
        uwaga: "Pokaż raport PDF z wyceny. Kotwica oparta na danych, nie na opinii.",
      },
      {
        nazwa: "Plan sprzedaży",
        cel: "Pokazać, co konkretnie zrobisz w pierwszych 30 dniach",
        czas: "30-40 min",
        kwestie: [
          "Tydzień 1: sesja zdjęciowa, rzut, opis, świadectwo energetyczne, jeśli go brakuje.",
          "Tydzień 2: publikacja, wysyłka do naszej bazy poszukujących, pierwsze prezentacje.",
          "Co dwa tygodnie raport: liczba zapytań, prezentacji i opinii kupujących.",
        ],
      },
      {
        nazwa: "Obiekcje",
        cel: "Rozwiązać prawdziwą przeszkodę",
        czas: "40-50 min",
        kwestie: ["Co z tego, co powiedziałem, budzi Państwa największe wątpliwości?"],
      },
      {
        nazwa: "Zamknięcie",
        cel: "Podpis albo konkretny termin decyzji",
        czas: "50-60 min",
        kwestie: [
          "Podsumuję: chcecie sprzedać do [termin], za co najmniej [kwota], bez prezentacji w weekendy. Wszystko to wpisuję w plan. Podpisujemy dziś, żebyśmy zdążyli z sesją w czwartek?",
        ],
      },
    ],
    obiekcje: [
      { obiekcja: "Inne biuro wyceniło wyżej.", odpowiedz: "Możliwe. Zapytajmy, na czym oparło tę kwotę. Ja pokazuję ceny z aktów notarialnych, za które ludzie naprawdę kupili. Wysoka cena na start często kończy się dłuższą sprzedażą i niższą ceną końcową.", technika: "obiektywne-kryteria" },
      { obiekcja: "Musimy się zastanowić.", odpowiedz: "Oczywiście, to duża decyzja. Co konkretnie chcielibyście jeszcze przemyśleć? (wysłuchaj) Umówmy się na telefon w czwartek o 18, dobrze?", technika: "izolacja-obiekcji" },
      { obiekcja: "Nie chcemy wyłączności.", odpowiedz: "Rozumiem obawę. Wyłączność to nasze zobowiązanie: zapisujemy w umowie, co robimy co tydzień. Jeśli nie dowozimy, możecie ją wypowiedzieć.", technika: "czuje-czuli-odkryli" },
    ],
    techniki: ["aktywne-sluchanie", "obiektywne-kryteria", "kotwiczenie", "zamkniecie-podsumowujace"],
    scenariusze: ["prezentacja-uslugi", "na-wylacznosc", "klient-gotowy-umowa"],
  },
  {
    slug: "obnizka-ceny",
    nazwa: "Rozmowa o obniżce ceny z właścicielem",
    rodzaj: "spotkanie",
    dlaKogo: "Właściciel, którego oferta długo wisi",
    cel: "Zgoda na korektę ceny o konkretną kwotę",
    czas: "15-25 minut",
    etapy: [
      {
        nazwa: "Otwarcie",
        cel: "Przygotować na trudny temat bez zaskoczenia",
        czas: "0-2 min",
        kwestie: ["Chcę z Panem uczciwie porozmawiać o tym, co mówi rynek o Pana mieszkaniu. Mam liczby z ostatnich ośmiu tygodni."],
      },
      {
        nazwa: "Fakty",
        cel: "Pokazać dane, nie opinię",
        czas: "2-8 min",
        kwestie: [
          "Wyświetlenia: [liczba]. Zapytania: [liczba]. Prezentacje: [liczba]. Oferty: zero.",
          "W tym czasie w promieniu kilometra sprzedało się [liczba] podobnych mieszkań, mediana [zł/m²].",
          "Kupujący po prezentacjach mówili głównie: [cytaty].",
        ],
      },
      {
        nazwa: "Koszt czekania",
        cel: "Pokazać, że stanie w miejscu też kosztuje",
        czas: "8-12 min",
        kwestie: ["Każdy miesiąc to [czynsz + rata + media] zł. Od wystawienia to już [suma]. Do tego oferta, która wisi długo, zaczyna wyglądać na problematyczną."],
      },
      {
        nazwa: "Propozycja",
        cel: "Konkretna kwota z uzasadnieniem",
        czas: "12-18 min",
        kwestie: ["Proponuję [nowa cena]. To wciąż [x]% powyżej mediany, ale wchodzi w filtr cenowy, w którym szuka najwięcej kupujących (do [próg])."],
        uwaga: "Progi filtrów portali (np. 699 tys. zamiast 715 tys.) to mocny argument.",
      },
      {
        nazwa: "Zamknięcie",
        cel: "Decyzja i nowy plan",
        czas: "18-25 min",
        kwestie: ["Jeśli się zgadzamy, jutro zmieniam cenę, odświeżam ogłoszenie i wysyłam informację do bazy poszukujących. Zgoda?"],
      },
    ],
    obiekcje: [
      { obiekcja: "Nie oddam za tyle, wiem, ile jest warte.", odpowiedz: "Rozumiem, że to mieszkanie ma dla Pana dużą wartość. Jak mam przekonać kupującego, który widzi obok podobne za [kwota]?", technika: "pytania-kalibrowane" },
      { obiekcja: "To Wy źle sprzedajecie.", odpowiedz: "Może Pan mieć rację, sprawdźmy. Zapytań było [liczba], prezentacji [liczba], czyli ludzie przychodzą. Odpadają po zobaczeniu ceny w porównaniu z innymi.", technika: "obiektywne-kryteria" },
    ],
    techniki: ["obiektywne-kryteria", "ramowanie", "koszt-zwloki", "pytania-kalibrowane"],
    scenariusze: ["przewartosciowane-mieszkanie", "negocjacja-oferty-wlasciciel"],
  },
  {
    slug: "negocjacja-prowizji",
    nazwa: "Negocjacja prowizji",
    rodzaj: "spotkanie",
    dlaKogo: "Właściciel, który chce niższego wynagrodzenia",
    cel: "Utrzymać stawkę albo wymienić ustępstwo na coś wartościowego",
    czas: "5-10 minut (część spotkania)",
    etapy: [
      {
        nazwa: "Przyjęcie",
        cel: "Nie bronić się od razu",
        czas: "0-1 min",
        kwestie: ["Rozumiem, prowizja to realny koszt. Dobrze, że Pan o tym mówi wprost."],
      },
      {
        nazwa: "Izolacja",
        cel: "Sprawdzić, czy to jedyna przeszkoda",
        czas: "1-2 min",
        kwestie: ["Zakładając, że ustalimy wynagrodzenie, które będzie dla Pana w porządku, czy coś jeszcze stoi na przeszkodzie, żebyśmy zaczęli?"],
      },
      {
        nazwa: "Wartość w złotówkach",
        cel: "Pokazać, za co płaci klient",
        czas: "2-5 min",
        kwestie: [
          "Różnica między 2% a 3% przy [cena] to [kwota]. Dobra negocjacja z kupującym to zwykle 2-4% ceny, czyli więcej niż ta różnica.",
          "W tej kwocie: sesja, wideo, świadectwo energetyczne, kampania, wszystkie prezentacje i obsługa aktu.",
        ],
      },
      {
        nazwa: "Ustępstwo warunkowe",
        cel: "Nic za darmo",
        czas: "5-8 min",
        kwestie: ["Mogę zaproponować [stawka], jeśli podpiszemy wyłączność na [okres] i zgodzi się Pan na cenę ofertową [kwota]."],
        uwaga: "Ustal wcześniej swoją granicę i nie schodź poniżej.",
      },
    ],
    obiekcje: [
      { obiekcja: "Inne biuro bierze 1,5%.", odpowiedz: "Zapytam wprost: co konkretnie robi za 1,5%? Porównajmy plan działań punkt po punkcie.", technika: "obiektywne-kryteria" },
      { obiekcja: "Albo 2%, albo nie podpisuję.", odpowiedz: "(cisza) Rozumiem. Przy 2% mogę zrobić publikację i prezentacje, bez sesji i kampanii. Która wersja jest dla Pana lepsza?", technika: "milczenie" },
    ],
    techniki: ["izolacja-obiekcji", "strategia-ustepstw", "milczenie", "kontrast"],
    scenariusze: ["negocjacja-prowizji", "obiekcja-nie-place-prowizji"],
  },
  {
    slug: "follow-up-po-prezentacji",
    nazwa: "Telefon po prezentacji",
    rodzaj: "telefon",
    dlaKogo: "Kupujący dzień po obejrzeniu mieszkania",
    cel: "Poznać opinię i doprowadzić do oferty albo drugiej wizyty",
    czas: "3-6 minut",
    etapy: [
      {
        nazwa: "Otwarcie",
        cel: "Wrócić do emocji z prezentacji",
        czas: "0:00-0:30",
        kwestie: ["Dzień dobry, [imię] z [biuro]. Dzwonię, jak obiecałem. Co zostało Państwu w głowie po wczorajszym oglądaniu?"],
      },
      {
        nazwa: "Opinia",
        cel: "Poznać plusy, minusy i stopień zainteresowania",
        czas: "0:30-3:00",
        kwestie: ["(słuchaj, parafrazuj)"],
        pytania: [
          "Co podobało się najbardziej?",
          "Co budzi wątpliwości?",
          "W skali od 1 do 10, gdzie jest to mieszkanie wśród tych, które oglądaliście?",
          "Co musiałoby się zmienić, żeby było 10?",
        ],
      },
      {
        nazwa: "Następny krok",
        cel: "Oferta, druga wizyta albo uczciwe zamknięcie tematu",
        czas: "3:00-5:00",
        kwestie: [
          "Jeśli 8 lub więcej: Rozmawiam z właścicielem dziś. Jaka kwota byłaby dla Państwa uczciwa?",
          "Jeśli 5-7: Proponuję drugą wizytę z [osobą decyzyjną / fachowcem od remontu]. Czwartek czy sobota?",
          "Jeśli poniżej 5: Dziękuję za szczerość. Wpisuję Państwa do poszukiwań z tymi uwagami.",
        ],
      },
    ],
    obiekcje: [
      { obiekcja: "Musimy jeszcze pooglądać inne.", odpowiedz: "Jasne. Co musiałoby być w innym mieszkaniu, żeby było lepsze od tego?", technika: "pytanie-o-powod" },
      { obiekcja: "Za drogo.", odpowiedz: "W porównaniu z czym? (wysłuchaj) Sprawdźmy razem ceny z aktów notarialnych dla tego budynku.", technika: "pytanie-o-powod" },
    ],
    techniki: ["pytania-otwarte", "regula-trzech", "niedostepnosc", "nastepny-krok"],
    scenariusze: ["follow-up-po-ogledzinach"],
  },
  {
    slug: "wygasla-oferta",
    nazwa: "Telefon do właściciela wygasłej oferty",
    rodzaj: "telefon",
    dlaKogo: "Właściciel, którego ogłoszenie zniknęło bez sprzedaży",
    cel: "Spotkanie z nowym planem sprzedaży",
    czas: "4-6 minut",
    etapy: [
      {
        nazwa: "Otwarcie",
        cel: "Pokazać, że wiesz, co się stało, bez oceniania",
        czas: "0:00-0:40",
        kwestie: ["Dzień dobry, [imię] z [biuro]. Widziałem, że ogłoszenie Pani mieszkania na [ulica] zniknęło z portali. Czy mieszkanie się sprzedało?"],
      },
      {
        nazwa: "Diagnoza",
        cel: "Zrozumieć, co nie zadziałało",
        czas: "0:40-3:00",
        kwestie: ["(etykietuj emocje, nie krytykuj poprzedniego biura)"],
        pytania: [
          "Jak Pani myśli, dlaczego się nie sprzedało?",
          "Ile było prezentacji i co mówili kupujący?",
          "Czy plan sprzedaży wciąż jest aktualny?",
          "Co musiałoby wyglądać inaczej tym razem?",
        ],
      },
      {
        nazwa: "Nowy plan",
        cel: "Jedna konkretna różnica",
        czas: "3:00-4:30",
        kwestie: ["Najczęstszy powód to cena wejściowa powyżej transakcji. Mogę przynieść wycenę z aktów notarialnych i pokazać, co zrobiłbym inaczej w pierwszych dwóch tygodniach."],
      },
      {
        nazwa: "Zamknięcie",
        cel: "Spotkanie",
        czas: "4:30-5:30",
        kwestie: ["Środa o 18 czy piątek o 16?"],
      },
    ],
    obiekcje: [
      { obiekcja: "Mam dość biur.", odpowiedz: "Brzmi, jakby poprzednia współpraca mocno Panią rozczarowała. (cisza) Co było najgorsze?", technika: "etykietowanie" },
      { obiekcja: "Poczekam do wiosny.", odpowiedz: "Rozumiem. Policzmy tylko, ile kosztuje każdy miesiąc czekania, i zdecyduje Pani na spokojnie.", technika: "koszt-zwloki" },
    ],
    techniki: ["etykietowanie", "spin", "koszt-zwloki"],
    scenariusze: ["zimny-telefon-wygasle"],
  },
  {
    slug: "polecenie",
    nazwa: "Pierwszy telefon do poleconego klienta",
    rodzaj: "telefon",
    dlaKogo: "Osoba polecona przez zadowolonego klienta",
    cel: "Spotkanie albo jasna informacja o potrzebie",
    czas: "3-5 minut",
    etapy: [
      {
        nazwa: "Otwarcie z poleceniem",
        cel: "Wykorzystać zaufanie do polecającego",
        czas: "0:00-0:30",
        kwestie: ["Dzień dobry, [imię] z [biuro]. Numer dostałem od Pana [polecający], któremu w zeszłym roku pomagałem sprzedać mieszkanie. Wspominał, że myślą Państwo o przeprowadzce."],
      },
      {
        nazwa: "Diagnoza",
        cel: "Zrozumieć, na jakim etapie jest klient",
        czas: "0:30-3:00",
        kwestie: ["(pytania otwarte, bez presji)"],
        pytania: ["Na jakim etapie są Państwa plany?", "Co jest najważniejsze w tej przeprowadzce?", "Co najbardziej Państwa martwi?"],
      },
      {
        nazwa: "Zamknięcie",
        cel: "Mały, łatwy krok",
        czas: "3:00-4:00",
        kwestie: ["Proponuję krótkie spotkanie, pokażę ceny z Państwa okolicy, bez zobowiązań. Wtorek po pracy czy sobota rano?"],
      },
    ],
    obiekcje: [{ obiekcja: "To jeszcze nie teraz.", odpowiedz: "Rozumiem. Kiedy, Pana zdaniem, będzie dobry moment? Zapiszę sobie i odezwę się wtedy z aktualnymi cenami.", technika: "nastepny-krok" }],
    techniki: ["sympatia", "pytania-otwarte", "zaangazowanie-konsekwencja"],
    scenariusze: ["polecony-klient"],
  },
  {
    slug: "najem-wlasciciel",
    nazwa: "Pozyskanie mieszkania na wynajem",
    rodzaj: "telefon",
    dlaKogo: "Właściciel mieszkania na wynajem z ogłoszenia",
    cel: "Umowa na znalezienie najemcy",
    czas: "4-6 minut",
    etapy: [
      {
        nazwa: "Otwarcie",
        cel: "Konkretny powód",
        czas: "0:00-0:30",
        kwestie: ["Dzień dobry, [imię] z [biuro]. Dzwonię w sprawie mieszkania do wynajęcia na [ulica]. Mam klientów, którzy szukają w tej okolicy. Czy mieszkanie jest aktualne?"],
        uwaga: "Mów o klientach tylko wtedy, gdy naprawdę ich masz.",
      },
      {
        nazwa: "Diagnoza",
        cel: "Poznać obawy właściciela",
        czas: "0:30-3:00",
        kwestie: ["(najczęstszy lęk: zły najemca)"],
        pytania: ["Kogo by Pan chciał jako najemcę?", "Jakie ma Pan doświadczenia z poprzednimi najemcami?", "Czy rozważał Pan najem okazjonalny?"],
      },
      {
        nazwa: "Wartość",
        cel: "Bezpieczeństwo",
        czas: "3:00-4:30",
        kwestie: ["Każdego kandydata weryfikujemy: zaświadczenie o dochodach, umowa o pracę, poprzedni wynajmujący. Przygotowujemy umowę najmu okazjonalnego z oświadczeniem notarialnym."],
      },
      {
        nazwa: "Zamknięcie",
        cel: "Termin zdjęć i pierwszej prezentacji",
        czas: "4:30-5:30",
        kwestie: ["Mogę zrobić zdjęcia jutro, a pierwszych kandydatów pokazać w piątek. Pasuje?"],
      },
    ],
    obiekcje: [{ obiekcja: "Prowizja to cały czynsz, za dużo.", odpowiedz: "Rozumiem. Ile kosztuje jeden miesiąc pustostanu i jeden zły najemca, którego trzeba eksmitować?", technika: "ramowanie" }],
    techniki: ["pytania-otwarte", "ramowanie", "autorytet"],
    scenariusze: ["najem-wlasciciel-weryfikacja", "telefon-archiwalny-najem", "lead-najem-telefon"],
  },
  {
    slug: "przekazanie-oferty-kupujacego",
    nazwa: "Przekazanie oferty kupującego właścicielowi",
    rodzaj: "telefon",
    dlaKogo: "Właściciel, któremu przedstawiasz ofertę zakupu",
    cel: "Akceptacja albo kontroferta bliżej ceny kupującego",
    czas: "5-10 minut",
    etapy: [
      {
        nazwa: "Kontekst",
        cel: "Przygotować grunt przed liczbą",
        czas: "0-2 min",
        kwestie: ["Mam dla Pana ofertę na piśmie. Zanim podam kwotę: kupujący ma decyzję kredytową, może podpisać przedwstępną w tym tygodniu i akt w 6 tygodni."],
        uwaga: "Najpierw jakość kupującego, potem kwota. Pewny kupujący jest wart ustępstwa.",
      },
      {
        nazwa: "Kwota",
        cel: "Podać liczbę i zamilknąć",
        czas: "2-3 min",
        kwestie: ["Oferta to [kwota]. (cisza)"],
      },
      {
        nazwa: "Analiza",
        cel: "Porównać z rynkiem i planem",
        czas: "3-7 min",
        kwestie: ["To [x]% poniżej ceny ofertowej i [y]% powyżej mediany z aktów notarialnych. Ofert było [liczba] w [czas]."],
      },
      {
        nazwa: "Decyzja",
        cel: "Akceptacja albo kontroferta",
        czas: "7-10 min",
        kwestie: ["Mamy trzy możliwości: przyjąć, odrzucić albo złożyć kontrofertę. Moja rekomendacja: kontroferta [kwota] z terminem aktu, który Panu pasuje. Co Pan na to?"],
      },
    ],
    obiekcje: [{ obiekcja: "To jakaś kpina, odrzucam.", odpowiedz: "Rozumiem emocje. Odrzucenie zamyka rozmowę z jedynym kupującym z finansowaniem. Kontroferta daje szansę. Jaka kwota byłaby dla Pana do przyjęcia?", technika: "plan-b" }],
    techniki: ["milczenie", "obiektywne-kryteria", "strategia-ustepstw", "ograniczony-mandat"],
    scenariusze: ["negocjacja-oferty-wlasciciel"],
  },
];

export function skrypt(slug: string): Skrypt | undefined {
  return SKRYPTY.find((s) => s.slug === slug);
}
