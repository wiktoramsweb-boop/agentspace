// Bank obiekcji: najczęstsze zdania, które agent słyszy w telefonie i na
// spotkaniu, z tym, co zwykle się za nimi kryje, i trzema wersjami odpowiedzi.
// Odpowiedzi to punkt wyjścia: agent mówi je własnymi słowami.

export type GrupaObiekcji = "zimny-telefon" | "pozyskanie" | "prowizja" | "kupujacy" | "najem";
export type Styl = "lagodnie" | "pewnie" | "pytaniem";

export type Obiekcja = {
  id: string;
  grupa: GrupaObiekcji;
  obiekcja: string;
  /** Co zwykle znaczy naprawdę. */
  coZnaczy: string;
  odpowiedzi: { styl: Styl; tekst: string }[];
  technika: string;
};

export const GRUPY_OBIEKCJI: Record<GrupaObiekcji, string> = {
  "zimny-telefon": "Zimny telefon",
  pozyskanie: "Spotkanie z właścicielem",
  prowizja: "Prowizja i umowa",
  kupujacy: "Kupujący",
  najem: "Najem",
};

export const STYLE: Record<Styl, string> = { lagodnie: "Łagodnie", pewnie: "Pewnie", pytaniem: "Pytaniem" };

export const OBIEKCJE: Obiekcja[] = [
  {
    id: "nie-wspolpracuje",
    grupa: "zimny-telefon",
    obiekcja: "Nie współpracuję z biurami.",
    coZnaczy: "Zwykle złe doświadczenie albo strach przed prowizją. Rzadko twarda zasada.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Rozumiem, wielu właścicieli tak mówi. Nie dzwonię z umową, tylko z cenami z ostatnich transakcji w Pani budynku." },
      { styl: "pewnie", tekst: "Szanuję to. Proponuję 20 minut z raportem cen, bez żadnych zobowiązań. Jeśli nie zobaczy Pani w nim nic nowego, więcej nie zadzwonię." },
      { styl: "pytaniem", tekst: "Mogę zapytać, co sprawiło, że podjęła Pani taką decyzję?" },
    ],
    technika: "pytanie-o-powod",
  },
  {
    id: "nie-mam-czasu",
    grupa: "zimny-telefon",
    obiekcja: "Nie mam teraz czasu.",
    coZnaczy: "Albo naprawdę zły moment, albo grzeczna odmowa. Konkretna godzina sprawdza, która to wersja.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Jasne, przepraszam. Kiedy mogę oddzwonić?" },
      { styl: "pewnie", tekst: "Nie zatrzymuję. Pasuje dziś po 18 czy jutro przed 10?" },
      { styl: "pytaniem", tekst: "Rozumiem. Wolałaby Pani SMS z jedną informacją czy krótki telefon wieczorem?" },
    ],
    technika: "umow-oddzwonienie",
  },
  {
    id: "skad-numer",
    grupa: "zimny-telefon",
    obiekcja: "Skąd ma Pan mój numer?",
    coZnaczy: "Nieufność. Odpowiedź ma być szczera i natychmiastowa.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Z Pani ogłoszenia na [portal], dzwonię w sprawie mieszkania na [ulica]." },
      { styl: "pewnie", tekst: "Z ogłoszenia na [portal]. Jeśli woli Pani, żebym nie dzwonił, usunę numer od razu." },
      { styl: "pytaniem", tekst: "Z ogłoszenia na [portal]. Czy mieszkanie jest jeszcze aktualne?" },
    ],
    technika: "konkretny-powod-telefonu",
  },
  {
    id: "wyslij-maila",
    grupa: "zimny-telefon",
    obiekcja: "Proszę przysłać ofertę mailem.",
    coZnaczy: "Najczęściej sposób na zakończenie rozmowy. Czasem prawdziwa chęć zapoznania się w spokoju.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Chętnie wyślę. Zadzwonię w czwartek zapytać, czy coś Panią zaskoczyło, dobrze?" },
      { styl: "pewnie", tekst: "Mail bez omówienia to tabelka cen. Wolę pokazać ją w 20 minut przy mieszkaniu. Czwartek o 17 pasuje?" },
      { styl: "pytaniem", tekst: "Wyślę. Żeby nie był ogólnikiem: co jest dla Pani ważniejsze, termin czy cena?" },
    ],
    technika: "sprzedaj-spotkanie",
  },
  {
    id: "mam-juz-agenta",
    grupa: "zimny-telefon",
    obiekcja: "Mam już agenta.",
    coZnaczy: "Może być umowa otwarta, może wyłączność. Ważne, od kiedy i z jakim efektem.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Rozumiem, nie będę przeszkadzał. Życzę szybkiej sprzedaży." },
      { styl: "pewnie", tekst: "W porządku. Gdyby umowa się kończyła, mam w bazie kupujących z kredytem na taki metraż. Zostawię numer." },
      { styl: "pytaniem", tekst: "Rozumiem. Jak długo już trwa sprzedaż i ile było prezentacji?" },
    ],
    technika: "telefon-z-wartoscia",
  },
  {
    id: "sam-sprzedam",
    grupa: "pozyskanie",
    obiekcja: "Sprzedam sam, to nic trudnego.",
    coZnaczy: "Wiara, że ogłoszenie wystarczy. Prawdziwy problem pojawia się przy prezentacjach, negocjacji i papierach.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Ma Pan rację, że wystawić ogłoszenie jest łatwo. Trudniej wybrać kupującego, który ma kredyt, i dowieźć go do aktu." },
      { styl: "pewnie", tekst: "Część właścicieli sprzedaje sama. Z danych z aktów wynika, że ci z biurem dostają średnio więcej, niż płacą prowizji. Pokażę to na liczbach." },
      { styl: "pytaniem", tekst: "Jak Pan planuje sprawdzać, czy kupujący ma finansowanie, zanim przyjdzie oglądać?" },
    ],
    technika: "zgoda-czesciowa",
  },
  {
    id: "musze-pomyslec",
    grupa: "pozyskanie",
    obiekcja: "Muszę to przemyśleć.",
    coZnaczy: "Prawie zawsze konkretna wątpliwość, której klient nie wypowiedział: cena, prowizja, zaufanie, druga osoba.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Jasne, to ważna decyzja. Kiedy mogę zadzwonić, żeby odpowiedzieć na pytania?" },
      { styl: "pewnie", tekst: "Rozumiem. Żebyśmy nie tracili czasu: co dokładnie chce Pani przemyśleć, cenę, prowizję czy mnie?" },
      { styl: "pytaniem", tekst: "Co musiałoby się wydarzyć, żeby decyzja była dla Pani łatwa?" },
    ],
    technika: "izolacja-obiekcji",
  },
  {
    id: "porozmawiam-z-mezem",
    grupa: "pozyskanie",
    obiekcja: "Muszę porozmawiać z mężem.",
    coZnaczy: "Druga osoba decyzyjna. Najlepiej, żeby była przy kolejnej rozmowie, a nie słuchała relacji.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Oczywiście, to wspólna decyzja. Mogę zostawić materiały." },
      { styl: "pewnie", tekst: "Najlepiej spotkajmy się we trójkę na 20 minut, żeby mąż mógł zadać swoje pytania. Sobota rano pasuje?" },
      { styl: "pytaniem", tekst: "Co według Pani będzie dla męża najważniejsze, cena czy termin?" },
    ],
    technika: "ograniczony-mandat",
  },
  {
    id: "sasiad-drozej",
    grupa: "pozyskanie",
    obiekcja: "Sąsiad wystawił za więcej, ja też chcę tyle.",
    coZnaczy: "Porównanie z ceną ogłoszeniową, a nie transakcyjną. Potrzebne dane, nie opinia.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Rozumiem, to naturalny punkt odniesienia. Sprawdźmy, za ile mieszkania w budynku naprawdę się sprzedały." },
      { styl: "pewnie", tekst: "Sąsiad wystawił, czyli to cena z ogłoszenia. Z aktów notarialnych wychodzi 790 do 840 tysięcy, a jego ogłoszenie wisi od czterech miesięcy." },
      { styl: "pytaniem", tekst: "Wie Pani, od kiedy wisi ogłoszenie sąsiada i ile było prezentacji?" },
    ],
    technika: "obiektywne-kryteria",
  },
  {
    id: "inne-biuro-wyzej",
    grupa: "pozyskanie",
    obiekcja: "Inne biuro wyceniło moje mieszkanie wyżej.",
    coZnaczy: "Agent, który kupuje zlecenie wyższą ceną. Klient chce wierzyć w wyższą kwotę.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Rozumiem, że wyższa kwota brzmi lepiej. Pokażę, na czym opieram swoją, a Pani oceni." },
      { styl: "pewnie", tekst: "Mogę wpisać każdą kwotę do umowy. Ważne, za ile ktoś naprawdę kupi. Moja wycena jest z aktów notarialnych, a nie z ogłoszeń." },
      { styl: "pytaniem", tekst: "Na jakich transakcjach opierało się tamto biuro?" },
    ],
    technika: "kontrast",
  },
  {
    id: "nie-wylacznosc",
    grupa: "prowizja",
    obiekcja: "Nie podpiszę wyłączności.",
    coZnaczy: "Strach przed uwiązaniem się z agentem, który nic nie zrobi.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Rozumiem obawę, że zostanie Pani z agentem, który nic nie robi. Dlatego proponuję prawo wypowiedzenia po miesiącu." },
      { styl: "pewnie", tekst: "Przy wyłączności inwestuję w Pani mieszkanie: sesję, wideo, reklamę i dzień otwarty. Przy otwartej umowie żadne biuro tego nie zrobi." },
      { styl: "pytaniem", tekst: "Co musiałoby być w umowie, żeby wyłączność była dla Pani bezpieczna?" },
    ],
    technika: "audyt-oskarzen",
  },
  {
    id: "za-wysoka-prowizja",
    grupa: "prowizja",
    obiekcja: "Prowizja jest za wysoka.",
    coZnaczy: "Kwota bez widocznej wartości. Albo prawdziwy brak zamiaru, schowany za ceną.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Zgadzam się, że to duża kwota. Dlatego płaci ją Pani dopiero przy akcie." },
      { styl: "pewnie", tekst: "Policzmy w złotówkach: jedna dobrze poprowadzona negocjacja ceny zwraca prowizję z nawiązką. Pokażę na ostatnich transakcjach." },
      { styl: "pytaniem", tekst: "Czyli pytanie brzmi, czy z biurem dostanie Pani na koncie więcej niż sama. Dobrze rozumiem?" },
    ],
    technika: "obiekcja-w-pytanie",
  },
  {
    id: "inne-biuro-taniej",
    grupa: "prowizja",
    obiekcja: "Inne biuro bierze 1,5 procent.",
    coZnaczy: "Porównanie ceny bez porównania usługi.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Rozumiem. Warto porównać, co dokładnie jest w tej cenie." },
      { styl: "pewnie", tekst: "Mogę zejść, jeśli z czegoś zrezygnujemy w planie. Wolę zostawić stawkę i dołożyć home staging na mój koszt." },
      { styl: "pytaniem", tekst: "Co dokładnie dostaje Pani za 1,5 procent: zdjęcia, rzut, kupujących z kredytem, raporty?" },
    ],
    technika: "strategia-ustepstw",
  },
  {
    id: "nie-place-kupujacy",
    grupa: "prowizja",
    obiekcja: "Nie zapłacę prowizji jako kupujący.",
    coZnaczy: "Kupujący nie widzi, za co płaci. Często szuka ofert bez prowizji.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Rozumiem. Prowizja płatna jest dopiero przy akcie, nie wcześniej." },
      { styl: "pewnie", tekst: "Za to dostaje Pan sprawdzony stan prawny, negocjację ceny i komplet papierów do kredytu. To zwykle więcej niż prowizja." },
      { styl: "pytaniem", tekst: "Co musiałoby się wydarzyć, żeby ta usługa była dla Pana warta swojej ceny?" },
    ],
    technika: "pytania-kalibrowane",
  },
  {
    id: "za-drogie-mieszkanie",
    grupa: "kupujacy",
    obiekcja: "To mieszkanie jest za drogie.",
    coZnaczy: "Za drogie w porównaniu z czymś. Trzeba wiedzieć, z czym.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Rozumiem. Z czym je Pan porównuje?" },
      { styl: "pewnie", tekst: "Pokażę ceny transakcyjne z tego budynku z ostatniego pół roku. Wtedy zobaczymy, czy to drogo, czy rynek." },
      { styl: "pytaniem", tekst: "Jaka kwota byłaby w porządku, biorąc pod uwagę to, co Pan zobaczył?" },
    ],
    technika: "obiektywne-kryteria",
  },
  {
    id: "jeszcze-ogladamy",
    grupa: "kupujacy",
    obiekcja: "Jeszcze oglądamy inne mieszkania.",
    coZnaczy: "Brak przekonania albo prawdziwe porównywanie. Warto wiedzieć, co jest na liście.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "To rozsądne. Dajcie znać, jak wypada porównanie." },
      { styl: "pewnie", tekst: "Dobrze porównać. Uczciwie powiem: na to mieszkanie były w tym tygodniu dwie prezentacje, więc decyzja może przyjść szybko." },
      { styl: "pytaniem", tekst: "Co ma tamto mieszkanie, czego brakuje temu?" },
    ],
    technika: "pytania-otwarte",
  },
  {
    id: "zastanowimy-sie",
    grupa: "kupujacy",
    obiekcja: "Zastanowimy się i damy znać.",
    coZnaczy: "Bez terminu „damy znać” zwykle znaczy „nie”. Potrzebny konkretny następny krok.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Jasne. Zadzwonię jutro po 18 zapytać, jak poszła rozmowa, dobrze?" },
      { styl: "pewnie", tekst: "Rozumiem. Ustalmy jedno: jeśli chcecie wrócić z rodzicami, mam sobotę o 11. Zapisać?" },
      { styl: "pytaniem", tekst: "Nad czym konkretnie chcecie się zastanowić: cena, lokalizacja czy kredyt?" },
    ],
    technika: "nastepny-krok",
  },
  {
    id: "najpierw-bank",
    grupa: "kupujacy",
    obiekcja: "Najpierw musimy iść do banku.",
    coZnaczy: "Brak policzonej zdolności. Kupujący bez kredytu to ryzyko dla właściciela.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Bardzo rozsądnie. Dajcie znać, jak tylko będziecie wiedzieć." },
      { styl: "pewnie", tekst: "Nasz doradca policzy zdolność do jutra, bez opłat. Mam go poprosić o telefon dziś?" },
      { styl: "pytaniem", tekst: "Kiedy macie termin w banku? Zapiszę i zadzwonię dzień później." },
    ],
    technika: "nastepny-krok",
  },
  {
    id: "cena-negocjowalna",
    grupa: "kupujacy",
    obiekcja: "Ile da się zejść z ceny?",
    coZnaczy: "Kupujący sprawdza, jak bardzo właściciel jest elastyczny. Nie podawaj kwoty bez oferty na piśmie.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Właściciel jest otwarty na rozmowę z kupującym, który ma finansowanie." },
      { styl: "pewnie", tekst: "Nie mogę negocjować w ciemno. Proszę złożyć ofertę na piśmie, a ja zaniosę ją właścicielowi jeszcze dziś." },
      { styl: "pytaniem", tekst: "Jaką kwotę Pan by zaproponował i na jakich warunkach finansowania?" },
    ],
    technika: "ograniczony-mandat",
  },
  {
    id: "najem-zle-najemcy",
    grupa: "najem",
    obiekcja: "Boję się, że najemca zniszczy mieszkanie albo przestanie płacić.",
    coZnaczy: "Najważniejsza obawa właściciela przy najmie. Odpowiedź to procedura, nie zapewnienie.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "To najczęstsza obawa i bardzo zrozumiała. Pokażę, jak sprawdzamy najemców." },
      { styl: "pewnie", tekst: "Najemca pokazuje dokumenty dochodu przed oglądaniem, podpisujemy najem okazjonalny z oświadczeniem u notariusza i kaucję w wysokości dwóch czynszów." },
      { styl: "pytaniem", tekst: "Co byłoby dla Pana wystarczającym zabezpieczeniem?" },
    ],
    technika: "obiektywne-kryteria",
  },
  {
    id: "najem-sam-wynajme",
    grupa: "najem",
    obiekcja: "Wynajmę sam, po co mi biuro.",
    coZnaczy: "Właściciel nie wie, że wynagrodzenie płaci najemca, albo nie zna ryzyka.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Można, wielu właścicieli tak robi. Pomagamy przede wszystkim w sprawdzeniu najemcy." },
      { styl: "pewnie", tekst: "Wynagrodzenie płaci najemca, a Pan dostaje sprawdzonego najemcę i umowę okazjonalną. Nie ma Pan nic do stracenia." },
      { styl: "pytaniem", tekst: "Jak planuje Pan sprawdzić, czy najemca ma stałe dochody?" },
    ],
    technika: "zgoda-czesciowa",
  },
  {
    id: "najem-za-drogo",
    grupa: "najem",
    obiekcja: "Czynsz jest za wysoki (najemca).",
    coZnaczy: "Porównanie z innymi ofertami albo budżet mniejszy niż deklarowany.",
    odpowiedzi: [
      { styl: "lagodnie", tekst: "Rozumiem. Jaki budżet był dla Pani założeniem?" },
      { styl: "pewnie", tekst: "W tej cenie są media w zaliczce i miejsce postojowe. Podobne mieszkania bez miejsca wynajmują się za 200 zł mniej." },
      { styl: "pytaniem", tekst: "Co musiałoby być w ofercie, żeby ta kwota była dla Pani w porządku?" },
    ],
    technika: "kontrast",
  },
];
