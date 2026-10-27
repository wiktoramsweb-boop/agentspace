// Rozgałęzione wersje skryptów: agent mówi, klient odpowiada na kilka
// sposobów, a każda odpowiedź prowadzi rozmowę inną drogą. Kwestie agenta to
// punkt wyjścia do powiedzenia własnymi słowami, a nie tekst do czytania.

export type Wynik = "sukces" | "pozniej" | "stop";

export type WezelRozmowy = {
  /** Co mówi agent w tym miejscu rozmowy. */
  agent: string;
  /** Wskazówka: dlaczego tak, jaka technika, na co uważać. */
  uwaga?: string;
  technika?: string;
  opcje?: { klient: string; dalej: string }[];
  koniec?: { wynik: Wynik; tekst: string };
};

export type RozmowaDrzewo = { start: string; wezly: Record<string, WezelRozmowy> };

export const WYNIKI: Record<Wynik, { nazwa: string; opis: string }> = {
  sukces: { nazwa: "Cel osiągnięty", opis: "Rozmowa skończyła się konkretnym następnym krokiem z datą." },
  pozniej: { nazwa: "Furtka otwarta", opis: "Bez terminu dziś, ale z ustalonym powodem i dniem kolejnego kontaktu." },
  stop: { nazwa: "Uczciwe zamknięcie", opis: "Klient nie jest dziś Twoim klientem. Zostawiasz dobre wrażenie i kontakt." },
};

export const ROZMOWY: Record<string, RozmowaDrzewo> = {
  "zimny-telefon-fsbo": {
    start: "otwarcie",
    wezly: {
      otwarcie: {
        agent: "Dzień dobry, [imię] z biura [nazwa]. Dzwonię w sprawie ogłoszenia mieszkania na [ulica]. Rozmawiam z właścicielem?",
        opcje: [
          { klient: "Tak, słucham.", dalej: "zgoda" },
          { klient: "Nie współpracuję z biurami.", dalej: "bez-biur" },
          { klient: "Nie mam teraz czasu.", dalej: "brak-czasu" },
          { klient: "Ile bierzecie prowizji?", dalej: "prowizja-na-start" },
        ],
      },
      zgoda: {
        agent: "Pewnie pomyśli Pani, że to kolejny agent, który będzie namawiał na umowę. Rozumiem. Mam jedno pytanie, zajmie dwie minuty. Może być?",
        technika: "audyt-oskarzen",
        uwaga: "Po pytaniu o zgodę zamilknij. Kto pierwszy się odezwie, ten traci inicjatywę.",
        opcje: [
          { klient: "No dobrze, proszę pytać.", dalej: "powod" },
          { klient: "Tak właśnie myślę. Do widzenia.", dalej: "bez-biur" },
        ],
      },
      "brak-czasu": {
        agent: "Jasne, nie zatrzymuję. Kiedy będzie Pani miała dwie minuty: dziś po 18 czy jutro przed południem?",
        technika: "zamkniecie-alternatywne",
        uwaga: "Nie przekonuj, że to szybko. Umów oddzwonienie z konkretną godziną.",
        opcje: [
          { klient: "Jutro koło 10.", dalej: "oddzwonienie" },
          { klient: "Proszę w ogóle nie dzwonić.", dalej: "koniec-grzecznie" },
        ],
      },
      oddzwonienie: {
        agent: "Zapisuję: jutro 10:00. Zadzwonię punktualnie i zajmę najwyżej pięć minut. Do usłyszenia.",
        koniec: { wynik: "pozniej", tekst: "Oddzwonienie z godziną to mały sukces: punktualny telefon jutro buduje zaufanie lepiej niż dzisiejsze przekonywanie." },
      },
      "bez-biur": {
        agent: "Rozumiem. Mogę zapytać, co sprawiło, że podjęła Pani taką decyzję?",
        technika: "pytanie-o-powod",
        uwaga: "Nie broń zawodu. Pytanie o powód zamienia ścianę w informację.",
        opcje: [
          { klient: "Miałam złe doświadczenie, agent nic nie robił.", dalej: "zle-doswiadczenie" },
          { klient: "Nie chcę płacić prowizji.", dalej: "prowizja-na-start" },
          { klient: "Po prostu nie i już.", dalej: "koniec-grzecznie" },
        ],
      },
      "zle-doswiadczenie": {
        agent: "To brzmi jak agent, który wystawił ogłoszenie i czekał. Rozumiem, że drugi raz nie chce Pani tego przechodzić. Nie proszę o umowę. Proszę o 20 minut z raportem cen z aktów notarialnych z Pani okolicy. Po nim sama Pani oceni, czy jest o czym rozmawiać.",
        technika: "etykietowanie",
        opcje: [
          { klient: "Raport cen? Jakich cen?", dalej: "powod" },
          { klient: "Proszę wysłać mailem.", dalej: "mailem" },
        ],
      },
      "prowizja-na-start": {
        agent: "Zależy od tego, co dla Pani zrobimy, i to uczciwa odpowiedź. Zanim powiem kwotę, jedno pytanie: co jest dla Pani ważniejsze, termin sprzedaży czy cena?",
        technika: "odroczenie",
        uwaga: "Kwota bez wartości zawsze brzmi drogo. Odłóż ją do momentu, w którym wiesz, czego klient potrzebuje.",
        opcje: [
          { klient: "Cena. Chcę dostać jak najwięcej.", dalej: "diagnoza" },
          { klient: "Termin, przeprowadzam się w marcu.", dalej: "diagnoza" },
          { klient: "Proszę podać kwotę, albo kończymy.", dalej: "kwota-wprost" },
        ],
      },
      "kwota-wprost": {
        agent: "Zwykle 2 do 3 procent, płatne dopiero po sprzedaży. Jeśli sprzedamy za kwotę, która pokryje wynagrodzenie, a Pani zyska czas, czy byłoby o czym rozmawiać?",
        technika: "izolacja-obiekcji",
        opcje: [
          { klient: "Hm, może. Co musiałabym zrobić?", dalej: "zamkniecie" },
          { klient: "Nie, za drogo.", dalej: "koniec-grzecznie" },
        ],
      },
      powod: {
        agent: "Przygotowuję zestawienie cen transakcyjnych z [dzielnica] z aktów notarialnych. Pani mieszkanie jest wystawione wyżej niż te ceny, więc chciałem zapytać: jak idzie sprzedaż?",
        uwaga: "Konkretny powód telefonu, związany z klientem, a nie z Twoim biurem.",
        opcje: [
          { klient: "Dzwonią, ale nikt nie przychodzi.", dalej: "diagnoza" },
          { klient: "Dobrze, mam kilku chętnych.", dalej: "mam-chetnych" },
        ],
      },
      "mam-chetnych": {
        agent: "Gratuluję. Czy ktoś z nich ma już decyzję kredytową albo złożył konkretną ofertę?",
        technika: "pytania-otwarte",
        opcje: [
          { klient: "Jeszcze nie, ale się zastanawiają.", dalej: "diagnoza" },
          { klient: "Tak, w piątek podpisujemy przedwstępną.", dalej: "ma-kupca" },
        ],
      },
      "ma-kupca": {
        agent: "To świetnie, trzymam kciuki. Zostawię swój numer. Jeśli coś się posypie przy kredycie, mogę w dwa dni pokazać mieszkanie kupującym z decyzją kredytową.",
        technika: "wzajemnosc",
        koniec: { wynik: "stop", tekst: "Nie walczysz o klienta, który ma kupca. Zostawiasz dobre wrażenie: co trzecia przedwstępna rozpada się na kredycie." },
      },
      diagnoza: {
        agent: "Do kiedy chciałaby Pani sprzedać i co się wtedy wydarzy? A co by się stało, gdyby ogłoszenie wisiało jeszcze trzy miesiące?",
        technika: "spin",
        uwaga: "Implikacja: klient sam mówi, ile kosztuje czekanie. Ty nic nie musisz udowadniać.",
        opcje: [
          { klient: "Musiałabym płacić dwa kredyty, bo już kupiłam nowe.", dalej: "wartosc" },
          { klient: "Nic, mogę czekać.", dalej: "moze-czekac" },
        ],
      },
      "moze-czekac": {
        agent: "Rozumiem, bez presji czasu można sprzedać lepiej. Pytanie, czy cena z ogłoszenia jest tą, którą realnie dostanie Pani za trzy miesiące. Raport pokaże to w liczbach. Mam go przynieść?",
        technika: "obiektywne-kryteria",
        opcje: [
          { klient: "Dobrze, niech Pan przyniesie.", dalej: "zamkniecie" },
          { klient: "Proszę wysłać mailem.", dalej: "mailem" },
        ],
      },
      wartosc: {
        agent: "Czyli każdy miesiąc to podwójna rata. U nas mieszkanie oglądają tylko kupujący po rozmowie z doradcą kredytowym, więc nie traci Pani czasu na osoby bez finansowania. Mogę pokazać, jak to wygląda w liczbach.",
        technika: "koszt-zwloki",
        opcje: [{ klient: "No dobrze, jak to wygląda?", dalej: "zamkniecie" }],
      },
      mailem: {
        agent: "Chętnie. Raport bez omówienia to tabelka cen, a różnica robi się przy piętrze i stanie mieszkania. Proponuję 20 minut na miejscu. Wolę przyjść, niż wysłać coś, co niewiele powie.",
        technika: "ramowanie",
        opcje: [
          { klient: "Niech będzie, ale krótko.", dalej: "zamkniecie" },
          { klient: "Nie, tylko mail.", dalej: "mail-koniec" },
        ],
      },
      "mail-koniec": {
        agent: "W porządku, wyślę dziś do 18. Zadzwonię w czwartek zapytać, czy coś w nim Panią zaskoczyło. Pasuje?",
        koniec: { wynik: "pozniej", tekst: "Mail z umówionym telefonem to nadal otwarta furtka. Mail bez terminu to koniec znajomości." },
      },
      zamkniecie: {
        agent: "Omówienie zajmuje 20 minut, najlepiej przy mieszkaniu. Pasuje Pani bardziej czwartek o 17 czy sobota o 11?",
        technika: "zamkniecie-alternatywne",
        opcje: [
          { klient: "Sobota o 11.", dalej: "potwierdzenie" },
          { klient: "Muszę zapytać męża.", dalej: "maz" },
        ],
      },
      maz: {
        agent: "Jasne, to wspólna decyzja. Najlepiej, żeby był na spotkaniu. Sobota o 11 pasuje obojgu, czy szukamy innego terminu?",
        technika: "ograniczony-mandat",
        uwaga: "Druga osoba decyzyjna ma być na spotkaniu, a nie słuchać relacji z drugiej ręki.",
        opcje: [{ klient: "Sobota pasuje, będziemy oboje.", dalej: "potwierdzenie" }],
      },
      potwierdzenie: {
        agent: "Zapisuję: sobota 11:00, [adres]. Wyślę SMS z potwierdzeniem i moim numerem. Do zobaczenia.",
        koniec: { wynik: "sukces", tekst: "Spotkanie z datą, godziną i potwierdzeniem SMS. Dokładnie tyle miał dać ten telefon." },
      },
      "koniec-grzecznie": {
        agent: "Szanuję to. Życzę szybkiej sprzedaży. Gdyby coś się zmieniło, mój numer zostanie Pani w telefonie. Miłego dnia.",
        koniec: { wynik: "stop", tekst: "Krótko i bez urazy. Ten sam właściciel za dwa miesiące, gdy ogłoszenie dalej wisi, chętniej odbierze od kogoś, kto był uprzejmy." },
      },
    },
  },

  "lead-z-portalu": {
    start: "otwarcie",
    wezly: {
      otwarcie: {
        agent: "Dzień dobry, [imię] z [biuro]. Pytał Pan o mieszkanie na [ulica], trzy pokoje za [cena]. Ma Pan chwilę?",
        uwaga: "Dzwoń w ciągu 15 minut od zapytania. Klient jeszcze pamięta ogłoszenie.",
        opcje: [
          { klient: "Tak, pytałem. Jest jeszcze aktualne?", dalej: "aktualne" },
          { klient: "Chciałem tylko zapytać o cenę.", dalej: "tylko-cena" },
          { klient: "A które to było? Pytałem o kilka.", dalej: "kilka" },
        ],
      },
      kilka: {
        agent: "Na [ulica], trzecie piętro z dużą loggią, [cena]. Co sprawiło, że zapytał Pan akurat o nie?",
        technika: "pytania-otwarte",
        opcje: [{ klient: "A, tak. Blisko pracy, dobra cena.", dalej: "diagnoza" }],
      },
      aktualne: {
        agent: "Tak, aktualne. Co sprawiło, że zatrzymał się Pan akurat przy tym ogłoszeniu?",
        technika: "pytania-otwarte",
        opcje: [
          { klient: "Lokalizacja, szkoła córki jest obok.", dalej: "diagnoza" },
          { klient: "Cena, wydaje się okazją.", dalej: "diagnoza" },
        ],
      },
      "tylko-cena": {
        agent: "Właściciel jest otwarty na rozmowę z kupującym, który ma finansowanie i obejrzał mieszkanie. Żeby nie strzelać kwotami, powiem Panu, co wiem, po dwóch pytaniach. Dla kogo jest mieszkanie?",
        technika: "zaangazowanie-konsekwencja",
        opcje: [
          { klient: "Dla nas, rodzina z dzieckiem.", dalej: "diagnoza" },
          { klient: "Na wynajem, inwestycyjnie.", dalej: "inwestor" },
        ],
      },
      inwestor: {
        agent: "To liczymy rentowność. Czynsz administracyjny to [kwota], podobne mieszkania w okolicy wynajmują się za [kwota]. Kupuje Pan za gotówkę czy z kredytem?",
        opcje: [
          { klient: "Gotówka.", dalej: "termin" },
          { klient: "Kredyt, jeszcze nie pytałem banku.", dalej: "bez-kredytu" },
        ],
      },
      diagnoza: {
        agent: "Co w nowym mieszkaniu jest absolutnie konieczne, a co byłoby miłym dodatkiem?",
        technika: "lejek-pytan",
        opcje: [{ klient: "Trzy pokoje muszą być. Balkon niekoniecznie.", dalej: "finansowanie" }],
      },
      finansowanie: {
        agent: "Jak planujecie finansowanie: kredyt, gotówka, sprzedaż obecnego mieszkania?",
        opcje: [
          { klient: "Kredyt, mamy już decyzję wstępną.", dalej: "termin" },
          { klient: "Kredyt, ale jeszcze nie byliśmy w banku.", dalej: "bez-kredytu" },
          { klient: "Musimy najpierw sprzedać swoje.", dalej: "najpierw-sprzedac" },
        ],
      },
      "bez-kredytu": {
        agent: "Warto to sprawdzić przed oglądaniem, żeby nie zakochać się w czymś poza zasięgiem. Mamy doradcę kredytowego, który w jeden dzień policzy zdolność, bez opłat. Mogę go poprosić o telefon?",
        uwaga: "Kupujący z policzoną zdolnością to kupujący, którego właściciel traktuje poważnie.",
        opcje: [
          { klient: "Tak, poproszę.", dalej: "termin" },
          { klient: "Nie, sam to załatwię.", dalej: "termin" },
        ],
      },
      "najpierw-sprzedac": {
        agent: "To częsta sytuacja. Możemy zrobić obie rzeczy naraz: wycenić i wystawić Wasze mieszkanie i szukać nowego. Gdzie jest Wasze obecne mieszkanie?",
        uwaga: "Lead kupującego, który ma mieszkanie do sprzedania, to dwa zlecenia w jednej rozmowie.",
        opcje: [{ klient: "Na Kurdwanowie, dwa pokoje.", dalej: "termin" }],
      },
      termin: {
        agent: "Od kiedy chcielibyście mieszkać? I kto oprócz Pana będzie decydował?",
        opcje: [
          { klient: "Najpóźniej od wakacji. Decyduję z żoną.", dalej: "dopasowanie" },
          { klient: "Nie spieszy nam się, tak tylko patrzymy.", dalej: "tylko-patrza" },
        ],
      },
      "tylko-patrza": {
        agent: "Rozumiem, dobrze najpierw poczuć rynek. Wpiszę Pana do poszukiwań: trzy pokoje, ta okolica, do [kwota]. Nowe oferty dostanie Pan, zanim trafią na portale. Pasuje?",
        koniec: { wynik: "pozniej", tekst: "Klient bez terminu nie dostaje prezentacji na siłę, tylko trafia do poszukiwań. Wróci, gdy będzie gotowy, i wróci do Ciebie." },
      },
      dopasowanie: {
        agent: "Z tego, co Pan mówi, to mieszkanie spełnia trzy z czterech warunków. Brakuje balkonu, ale jest duża loggia. Warto zobaczyć na żywo, najlepiej z żoną.",
        technika: "zamkniecie-podsumowujace",
        opcje: [
          { klient: "Dobrze, kiedy można?", dalej: "zamkniecie" },
          { klient: "Bez balkonu nie wiem...", dalej: "inne-oferty" },
        ],
      },
      "inne-oferty": {
        agent: "Rozumiem. Mam dwie inne oferty z balkonem w podobnej cenie. Mogę pokazać wszystkie trzy jednego popołudnia, porównanie na żywo pomaga zdecydować.",
        opcje: [{ klient: "To ma sens.", dalej: "zamkniecie" }],
      },
      zamkniecie: {
        agent: "Mam wolne jutro o 17:30 i w sobotę o 10. Co Wam bardziej pasuje?",
        technika: "zamkniecie-alternatywne",
        opcje: [{ klient: "Sobota o 10.", dalej: "potwierdzenie" }],
      },
      potwierdzenie: {
        agent: "Zapisuję sobotę 10:00. Wyślę SMS z adresem i moim numerem. Do zobaczenia z żoną.",
        koniec: { wynik: "sukces", tekst: "Prezentacja z obiema osobami decyzyjnymi i znanym finansowaniem. Tak wygląda dobrze zakwalifikowany lead." },
      },
    },
  },

  "spotkanie-pozyskowe": {
    start: "plan",
    wezly: {
      plan: {
        agent: "Dziękuję za zaproszenie. Proponuję taki plan: najpierw obejrzę mieszkanie i zadam kilka pytań, potem pokażę dane o cenach, a na końcu zdecydujecie, czy chcecie współpracować. Godzina wystarczy?",
        technika: "ramowanie",
        opcje: [
          { klient: "Dobrze, zaczynajmy.", dalej: "diagnoza" },
          { klient: "Mamy pół godziny.", dalej: "krotko" },
        ],
      },
      krotko: {
        agent: "To skupmy się na najważniejszym: cena i plan sprzedaży. Oględziny zrobię szybko w trakcie rozmowy.",
        opcje: [{ klient: "Dobrze.", dalej: "diagnoza" }],
      },
      diagnoza: {
        agent: "Co się wydarzy, gdy mieszkanie już się sprzeda? I do kiedy musicie to zrobić?",
        technika: "spin",
        opcje: [
          { klient: "Kupujemy dom, mamy termin do końca kwietnia.", dalej: "cena" },
          { klient: "Nic konkretnego, sprawdzamy, ile jest warte.", dalej: "sprawdzaja" },
        ],
      },
      sprawdzaja: {
        agent: "Rozumiem. A gdyby cena była taka, jaką sobie Państwo wyobrażacie, sprzedalibyście teraz?",
        technika: "pytania-kalibrowane",
        uwaga: "Oddziel ciekawość od zamiaru. Bez zamiaru nie ma czego podpisywać.",
        opcje: [
          { klient: "Tak, za dobrą cenę od razu.", dalej: "cena" },
          { klient: "Raczej za rok, dwa.", dalej: "za-rok" },
        ],
      },
      "za-rok": {
        agent: "To zostawię raport cen i ustalmy, że odezwę się w [miesiąc] z aktualnymi danymi. Wtedy zdecydujecie na spokojnie.",
        koniec: { wynik: "pozniej", tekst: "Nie podpisuje się umowy z kimś, kto sprzedaje za rok. Za to ustala się, kto będzie pierwszym telefonem, gdy przyjdzie czas." },
      },
      cena: {
        agent: "Jakiej kwoty się Państwo spodziewacie? (wysłuchaj) Pokażę, za ile naprawdę sprzedały się podobne mieszkania w okolicy w ostatnich miesiącach, według aktów notarialnych.",
        technika: "obiektywne-kryteria",
        opcje: [
          { klient: "Sąsiad wystawił za 950 tysięcy.", dalej: "sasiad" },
          { klient: "Myśleliśmy o 820.", dalej: "plan-sprzedazy" },
        ],
      },
      sasiad: {
        agent: "Wystawił, czyli to cena z ogłoszenia, a nie z umowy. Tu są ceny z aktów: 790 do 840 tysięcy za podobny metraż. Ogłoszenie sąsiada wisi od czterech miesięcy.",
        technika: "kontrast",
        opcje: [
          { klient: "Hm, nie wiedzieliśmy.", dalej: "plan-sprzedazy" },
          { klient: "My i tak chcemy spróbować za 950.", dalej: "sprobowac-wyzej" },
        ],
      },
      "sprobowac-wyzej": {
        agent: "Możemy wystartować wyżej, pod jednym warunkiem: umawiamy się teraz, że jeśli przez trzy tygodnie nie będzie prezentacji, schodzimy do 860. Wtedy nie tracimy pierwszych tygodni, w których ogłoszenie jest najświeższe.",
        technika: "zaangazowanie-konsekwencja",
        opcje: [
          { klient: "To uczciwe, zgoda.", dalej: "plan-sprzedazy" },
          { klient: "Nie, nie schodzimy z ceny.", dalej: "stop-cena" },
        ],
      },
      "stop-cena": {
        agent: "Rozumiem. Przy tej cenie nie będę w stanie sprzedać i wolę to powiedzieć teraz, niż za trzy miesiące. Zostawiam raport, wrócę za miesiąc z danymi, ile było telefonów do ogłoszenia.",
        koniec: { wynik: "stop", tekst: "Umowa na nierealną cenę to trzy miesiące pracy bez prowizji. Uczciwe „nie” teraz często wraca jako „tak” po miesiącu ciszy." },
      },
      "plan-sprzedazy": {
        agent: "W pierwszym tygodniu: sesja zdjęciowa, rzut, wideo i dzień otwarty dla kupujących z naszej bazy z policzonym kredytem. Co tydzień raport, ile było telefonów i prezentacji. Jak to brzmi?",
        technika: "opowiesc",
        opcje: [
          { klient: "Dobrze. Ale dlaczego na wyłączność?", dalej: "wylacznosc" },
          { klient: "A jaka prowizja?", dalej: "prowizja" },
          { klient: "Musimy to przemyśleć.", dalej: "przemyslec" },
        ],
      },
      wylacznosc: {
        agent: "Bo wtedy inwestuję w Państwa mieszkanie: zdjęcia, reklamę, dzień otwarty. Przy otwartej umowie biura się ścigają, ogłoszenie pojawia się pięć razy w różnych cenach i kupujący myśli, że coś jest nie tak.",
        technika: "dowod-spoleczny",
        opcje: [
          { klient: "Na ile miesięcy?", dalej: "zamkniecie" },
          { klient: "Wolimy otwartą.", dalej: "otwarta" },
        ],
      },
      otwarta: {
        agent: "Mogę zaproponować trzy miesiące wyłączności z prawem wypowiedzenia po miesiącu, jeśli nie dowiozę planu. Ryzyko jest po mojej stronie.",
        technika: "strategia-ustepstw",
        opcje: [{ klient: "To brzmi bezpiecznie.", dalej: "zamkniecie" }],
      },
      prowizja: {
        agent: "2,5 procent plus VAT, płatne dopiero przy akcie. Za to dostajecie wszystko z planu, który pokazałem, i kupujących z decyzją kredytową. Coś jeszcze stoi na przeszkodzie poza wynagrodzeniem?",
        technika: "izolacja-obiekcji",
        opcje: [
          { klient: "Nie, tylko kwota.", dalej: "negocjacja" },
          { klient: "Nie, wszystko jasne.", dalej: "zamkniecie" },
        ],
      },
      negocjacja: {
        agent: "Jeśli zejdę ze stawki, muszę z czegoś zrezygnować w planie. Wolę zostawić stawkę i dołożyć home staging na mój koszt. Co jest dla Was cenniejsze?",
        technika: "strategia-ustepstw",
        uwaga: "Ustępstwo tylko w zamian za coś. Nigdy za darmo i nigdy od razu.",
        opcje: [{ klient: "Home staging brzmi dobrze.", dalej: "zamkniecie" }],
      },
      przemyslec: {
        agent: "Jasne. Żebym wiedział, o czym będziecie myśleć: chodzi o cenę, o mnie czy o samą decyzję o sprzedaży?",
        technika: "izolacja-obiekcji",
        opcje: [
          { klient: "O prowizję, szczerze mówiąc.", dalej: "prowizja" },
          { klient: "Chcemy porozmawiać z innym biurem.", dalej: "inne-biuro" },
        ],
      },
      "inne-biuro": {
        agent: "To rozsądne. Zapytajcie ich o trzy rzeczy: ceny z aktów, plan na pierwszy tydzień i jak raportują. Porównajcie z tym, co zostawiam. Mogę zadzwonić w czwartek?",
        technika: "obiektywne-kryteria",
        koniec: { wynik: "pozniej", tekst: "Dajesz klientowi kryteria porównania, które Ty spełniasz. W czwartek dzwonisz z przewagą, a nie z prośbą." },
      },
      zamkniecie: {
        agent: "Proponuję trzy miesiące. Mam przygotowaną umowę, możemy przejść przez nią teraz, a zdjęcia umówimy na przyszły wtorek. Pasuje?",
        technika: "proba-zamkniecia",
        opcje: [{ klient: "Dobrze, podpiszmy.", dalej: "podpis" }],
      },
      podpis: {
        agent: "Dziękuję. Zdjęcia we wtorek o 10, w piątek dostaniecie pierwszy raport. Ustawmy jeszcze, jak wolicie kontakt: telefon czy wiadomości?",
        koniec: { wynik: "sukces", tekst: "Podpisana umowa i od razu konkretny pierwszy krok. Klient wychodzi ze spotkania z planem, a nie z papierem." },
      },
    },
  },

  "obnizka-ceny": {
    start: "otwarcie",
    wezly: {
      otwarcie: {
        agent: "Dzień dobry, mam dziś mniej przyjemny temat i wolę powiedzieć go wprost. Chodzi o cenę. Ma Pan 10 minut?",
        technika: "audyt-oskarzen",
        opcje: [
          { klient: "Słucham.", dalej: "fakty" },
          { klient: "Jeśli chodzi o obniżkę, to od razu mówię, że nie.", dalej: "od-razu-nie" },
        ],
      },
      "od-razu-nie": {
        agent: "Rozumiem, to Pana pieniądze i Pana decyzja. Poproszę tylko o dwie minuty na liczby, żeby decyzja była na danych. Może być?",
        technika: "etykietowanie",
        opcje: [{ klient: "No dobrze, dwie minuty.", dalej: "fakty" }],
      },
      fakty: {
        agent: "W ciągu ośmiu tygodni: 1400 wyświetleń, 9 telefonów, 3 prezentacje, zero ofert. Dwa podobne mieszkania obok sprzedały się w tym czasie za 760 i 775 tysięcy. Nasze stoi za 849.",
        technika: "obiektywne-kryteria",
        uwaga: "Fakty, nie opinia. Mówisz liczby i milczysz.",
        opcje: [
          { klient: "Bo nikt nie docenia, ile włożyłem w remont.", dalej: "remont" },
          { klient: "Może trzeba więcej reklamy?", dalej: "reklama" },
          { klient: "Ile proponujesz?", dalej: "propozycja" },
        ],
      },
      remont: {
        agent: "Remont jest piękny i kupujący to mówią. Tylko płacą za mieszkanie, a nie za fakturę z remontu. Te dwa sprzedane też były po remoncie. Co by musiało się stać, żeby Pan był gotów sprawdzić niższą cenę?",
        technika: "pytania-kalibrowane",
        opcje: [
          { klient: "Musiałbym mieć pewność, że to nie strata czasu.", dalej: "propozycja" },
          { klient: "Nic, nie zejdę.", dalej: "koszt" },
        ],
      },
      reklama: {
        agent: "Reklama działa: 1400 osób zobaczyło ogłoszenie. Problem nie w tym, że nikt nie wie, tylko że ci, którzy wiedzą, wybierają tańsze obok. Więcej reklamy pokaże wyższą cenę jeszcze większej liczbie osób.",
        technika: "ramowanie",
        opcje: [{ klient: "No dobra. To co proponujesz?", dalej: "propozycja" }],
      },
      koszt: {
        agent: "Szanuję. Policzmy tylko koszt czekania: czynsz, kredyt i rosnąca podaż w okolicy. Każdy miesiąc to około 4 tysięcy. Za trzy miesiące obniżka będzie i tak potrzebna, a oferta będzie już stara.",
        technika: "koszt-zwloki",
        opcje: [
          { klient: "Hm. Ile byś obniżył?", dalej: "propozycja" },
          { klient: "Czekam do końca miesiąca.", dalej: "termin-decyzji" },
        ],
      },
      "termin-decyzji": {
        agent: "Dobrze. Umówmy się konkretnie: jeśli do 30. nie będzie oferty, schodzimy do 799. Zapiszę to, żebyśmy nie musieli wracać do tej rozmowy.",
        technika: "zaangazowanie-konsekwencja",
        koniec: { wynik: "pozniej", tekst: "Decyzja odłożona, ale z datą i kwotą zapisaną dziś. Za miesiąc wykonujesz ustalenie, a nie negocjujesz od nowa." },
      },
      propozycja: {
        agent: "Proponuję 799 tysięcy. To nadal powyżej ostatnich transakcji, więc zostaje miejsce na negocjację, a w filtrach portali wejdziemy w przedział do 800, gdzie szuka trzy razy więcej osób.",
        technika: "kotwiczenie",
        opcje: [
          { klient: "Zgoda na 820, nie niżej.", dalej: "820" },
          { klient: "Dobrze, 799.", dalej: "zamkniecie" },
        ],
      },
      "820": {
        agent: "820 zostaje poza filtrem do 800, a tam jest najwięcej kupujących. Jeśli 799 jest za nisko, proponuję 799 z zastrzeżeniem, że nie zejdziemy niżej niż 780 w negocjacji bez Pana zgody.",
        technika: "strategia-ustepstw",
        opcje: [
          { klient: "Dobra, 799 z tym zastrzeżeniem.", dalej: "zamkniecie" },
          { klient: "Nie, 820.", dalej: "820-zgoda" },
        ],
      },
      "820-zgoda": {
        agent: "Zgoda, zmieniam na 820. Sprawdzamy dwa tygodnie i patrzymy na liczby telefonów. Jeśli się nie ruszy, wracamy do 799.",
        koniec: { wynik: "pozniej", tekst: "Mniejsza obniżka niż proponowana, ale ruch jest. Ważne, że obie strony wiedzą, kiedy patrzycie na wyniki." },
      },
      zamkniecie: {
        agent: "Dziękuję. Zmieniam cenę dziś, odświeżam ogłoszenie i dzwonię do sześciu osób, które oglądały i odpadły na cenie. W piątek raport.",
        koniec: { wynik: "sukces", tekst: "Zgoda na konkretną kwotę i od razu plan, co zrobisz z nową ceną. Właściciel widzi, że obniżka to ruch, a nie porażka." },
      },
    },
  },

  "negocjacja-prowizji": {
    start: "przyjecie",
    wezly: {
      przyjecie: {
        agent: "Rozumiem, że prowizja to dla Pani duża kwota. Mogę zapytać, z czym ją Pani porównuje?",
        technika: "etykietowanie",
        uwaga: "Nie broń się od razu i nie ustępuj od razu. Najpierw zrozum, skąd bierze się obiekcja.",
        opcje: [
          { klient: "Inne biuro bierze 1,5 procent.", dalej: "inne-biuro" },
          { klient: "Po prostu to dużo pieniędzy.", dalej: "izolacja" },
          { klient: "Przecież tylko wstawicie ogłoszenie.", dalej: "tylko-ogloszenie" },
        ],
      },
      "inne-biuro": {
        agent: "Rozumiem. Za 1,5 procent co dokładnie Pani dostaje? Zdjęcia, rzut, kupujących z kredytem, raporty co tydzień?",
        technika: "pytania-kalibrowane",
        opcje: [
          { klient: "Nie wiem, wstawią ogłoszenie.", dalej: "wartosc" },
          { klient: "To samo co u Pana.", dalej: "to-samo" },
        ],
      },
      "to-samo": {
        agent: "Jeśli naprawdę to samo, to porównujemy też wynik. Przy ostatnich pięciu sprzedażach uzyskaliśmy średnio 3,8 procent więcej niż cena wyjściowa sąsiednich ofert. Przy Pani mieszkaniu to ponad 25 tysięcy.",
        technika: "dowod-spoleczny",
        opcje: [
          { klient: "Skąd mam wiedzieć, że to prawda?", dalej: "dowod" },
          { klient: "Hm, to inaczej wygląda.", dalej: "izolacja" },
        ],
      },
      dowod: {
        agent: "Pokażę Pani akty notarialne z tych transakcji, zanonimizowane. I dam numer do dwóch właścicieli, którzy zgodzili się na telefon.",
        technika: "autorytet",
        opcje: [{ klient: "Dobrze, to mnie przekonuje.", dalej: "izolacja" }],
      },
      "tylko-ogloszenie": {
        agent: "Gdyby to było tylko ogłoszenie, też bym nie zapłacił. Pokażę, co robimy w pierwszych 30 dniach, i policzymy, ile to Pani daje w złotówkach.",
        technika: "ramowanie",
        opcje: [{ klient: "Dobrze, proszę pokazać.", dalej: "wartosc" }],
      },
      wartosc: {
        agent: "Sesja i rzut, kupujący tylko z policzonym kredytem, negocjacja ceny w Pani imieniu i całe papiery do aktu. Jedna wygrana negocjacja zwraca prowizję z nawiązką.",
        opcje: [{ klient: "Rozumiem, ale dalej to dużo.", dalej: "izolacja" }],
      },
      izolacja: {
        agent: "Jeśli ustalimy wynagrodzenie, które będzie dla Pani w porządku, czy coś jeszcze stoi na przeszkodzie, żebyśmy zaczęli?",
        technika: "izolacja-obiekcji",
        opcje: [
          { klient: "Nie, tylko kwota.", dalej: "wymiana" },
          { klient: "Jeszcze nie wiem, czy w ogóle sprzedawać.", dalej: "prawdziwa" },
        ],
      },
      prawdziwa: {
        agent: "Dziękuję, że Pani to mówi. To w ogóle nie jest rozmowa o prowizji. Co musiałoby się wydarzyć, żeby decyzja o sprzedaży była pewna?",
        technika: "pytania-kalibrowane",
        koniec: { wynik: "pozniej", tekst: "Obiekcja „za drogo” często przykrywa „nie jestem gotowa”. Teraz wiesz, o czym naprawdę rozmawiać na kolejnym spotkaniu." },
      },
      wymiana: {
        agent: "Mogę zejść do 2,2 procent, jeśli podpiszemy wyłączność na cztery miesiące zamiast trzech. Wtedy mam czas, żeby sprzedać bez pośpiechu i za dobrą cenę.",
        technika: "strategia-ustepstw",
        uwaga: "Ustępstwo za coś, co ma dla Ciebie wartość. Nigdy „dobrze, niech będzie 2 procent” bez niczego w zamian.",
        opcje: [
          { klient: "Zgoda.", dalej: "zamkniecie" },
          { klient: "2 procent albo nic.", dalej: "granica" },
        ],
      },
      granica: {
        agent: "Przy 2 procentach nie zrobię dobrze tego, co obiecałem, a nie chcę obiecywać na wyrost. Zostaję przy 2,2. Jeśli to za dużo, zrozumiem.",
        technika: "plan-b",
        uwaga: "Masz swoją granicę i swoje BATNA. Agent, który nie umie odejść, zawsze negocjuje w dół.",
        opcje: [
          { klient: "Dobrze, 2,2.", dalej: "zamkniecie" },
          { klient: "To dziękuję.", dalej: "odejscie" },
        ],
      },
      odejscie: {
        agent: "Rozumiem i szanuję. Zostawiam raport cen, przyda się przy każdym biurze. Gdyby sprzedaż się przedłużała, chętnie wrócę do rozmowy.",
        koniec: { wynik: "stop", tekst: "Odejście od stołu to też wynik. Prowizja zbita do zera to praca bez zarobku, a klient i tak często wraca po dwóch miesiącach." },
      },
      zamkniecie: {
        agent: "Dziękuję. Wpisuję 2,2 procent i cztery miesiące. Podpiszmy teraz, a zdjęcia umówię na czwartek.",
        koniec: { wynik: "sukces", tekst: "Stawka obroniona prawie w całości, a ustępstwo wymienione na dłuższą wyłączność. Dobra negocjacja to wymiana, a nie rabat." },
      },
    },
  },

  "follow-up-po-prezentacji": {
    start: "otwarcie",
    wezly: {
      otwarcie: {
        agent: "Dzień dobry, [imię] z [biuro]. Dzwonię po wczorajszej prezentacji na [ulica]. Co Pani najbardziej zapamiętała z tego mieszkania?",
        technika: "pytania-otwarte",
        uwaga: "Pytanie o pozytyw, a nie „i jak się podobało?”. Klient najpierw opowiada o tym, co go przyciągnęło.",
        opcje: [
          { klient: "Światło i kuchnia, bardzo nam się podobało.", dalej: "zachwyt" },
          { klient: "Fajne, ale cena wysoka.", dalej: "cena" },
          { klient: "Nie, to jednak nie to.", dalej: "nie-to" },
        ],
      },
      zachwyt: {
        agent: "Słyszę, że to mieszkanie Was poruszyło. Co musiałoby się wydarzyć, żebyście złożyli ofertę?",
        technika: "pytania-kalibrowane",
        opcje: [
          { klient: "Chcemy jeszcze raz zobaczyć z rodzicami.", dalej: "druga-wizyta" },
          { klient: "Musimy policzyć z bankiem.", dalej: "bank" },
          { klient: "Chcemy złożyć ofertę.", dalej: "oferta" },
        ],
      },
      cena: {
        agent: "Rozumiem. Jaka kwota byłaby dla Was w porządku, biorąc pod uwagę to, co widzieliście?",
        technika: "pytania-kalibrowane",
        opcje: [
          { klient: "Coś koło 720, a nie 780.", dalej: "rozjazd" },
          { klient: "Nie wiem, po prostu dużo.", dalej: "obiektywnie" },
        ],
      },
      rozjazd: {
        agent: "Mogę zanieść taką ofertę właścicielowi, ale powiem uczciwie: przy 60 tysiącach różnicy szansa jest mała. Jeśli macie decyzję kredytową, oferta będzie mocniejsza. Macie?",
        technika: "obiektywne-kryteria",
        opcje: [
          { klient: "Tak, mamy.", dalej: "oferta" },
          { klient: "Jeszcze nie.", dalej: "bank" },
        ],
      },
      obiektywnie: {
        agent: "Przygotuję Wam ceny z aktów notarialnych z ostatniego pół roku w tym budynku i okolicy. Zobaczycie, czy 780 to dużo, czy rynek. Wyślę dziś i zadzwonię jutro.",
        koniec: { wynik: "pozniej", tekst: "Gdy klient czuje „za drogo”, ale nie umie powiedzieć ile, dane zamiast negocjacji. Jutro rozmawiasz o liczbach, nie o odczuciach." },
      },
      bank: {
        agent: "Dobrze to zrobić przed ofertą. Nasz doradca może policzyć zdolność do jutra, bez opłat. Mam go poprosić o telefon dziś?",
        opcje: [
          { klient: "Tak, poproszę.", dalej: "bank-zgoda" },
          { klient: "Mamy swojego doradcę.", dalej: "swoj-doradca" },
        ],
      },
      "bank-zgoda": {
        agent: "Świetnie, doradca zadzwoni dziś do 18. Ja odezwę się w czwartek i ustalimy ofertę.",
        koniec: { wynik: "pozniej", tekst: "Finansowanie w toku, termin kolejnego kroku ustalony. Kupujący nie ostygnie, bo wie, co się dzieje dalej." },
      },
      "swoj-doradca": {
        agent: "Jasne. Kiedy spodziewacie się odpowiedzi? Zapiszę sobie i zadzwonię dzień później.",
        koniec: { wynik: "pozniej", tekst: "Nie przejmujesz kredytu na siłę. Pilnujesz terminu, żeby to Ty wiedział pierwszy." },
      },
      "druga-wizyta": {
        agent: "To dobry pomysł. Mam wolną sobotę o 11 albo środę po 17. Właściciel będzie wtedy nieobecny, więc spokojnie wszystko obejrzycie.",
        technika: "zamkniecie-alternatywne",
        opcje: [{ klient: "Sobota o 11.", dalej: "sukces-wizyta" }],
      },
      "sukces-wizyta": {
        agent: "Zapisuję sobotę 11:00. Przygotuję też koszty utrzymania i rozliczenie ze wspólnoty, o które pytaliście.",
        koniec: { wynik: "sukces", tekst: "Druga wizyta z rodziną to sygnał poważnego zamiaru. Przygotuj odpowiedzi na pytania z pierwszej wizyty, zanim padną." },
      },
      oferta: {
        agent: "Spiszmy ją teraz: kwota, sposób finansowania, termin aktu i wydania. Przekażę ją właścicielowi jeszcze dziś i oddzwonię z odpowiedzią do jutra.",
        technika: "nastepny-krok",
        opcje: [{ klient: "Dobrze, 765 tysięcy, kredyt, wydanie w maju.", dalej: "sukces-oferta" }],
      },
      "sukces-oferta": {
        agent: "Mam. Wyślę Wam SMS z podsumowaniem, a właściciel dostanie ofertę dziś do 18.",
        koniec: { wynik: "sukces", tekst: "Oferta na piśmie, z warunkami i terminem odpowiedzi. Od tej chwili negocjujesz konkret, a nie wrażenia." },
      },
      "nie-to": {
        agent: "Dziękuję za szczerość, to bardzo pomaga. Co konkretnie nie pasowało? Dzięki temu nie pokażę Wam drugi raz czegoś podobnego.",
        technika: "pytanie-o-powod",
        opcje: [
          { klient: "Za ciemno i za głośno od ulicy.", dalej: "inne" },
          { klient: "Kupiliśmy już coś innego.", dalej: "kupili" },
        ],
      },
      inne: {
        agent: "Rozumiem. Mam dwa mieszkania od podwórza, w podobnej cenie, jedno na czwartym piętrze. Mogę pokazać oba w czwartek po 17?",
        opcje: [{ klient: "Tak, chętnie.", dalej: "sukces-wizyta" }],
      },
      kupili: {
        agent: "Gratuluję! Jeśli będziecie kiedyś sprzedawać obecne mieszkanie albo ktoś ze znajomych będzie szukał, będę wdzięczny za kontakt.",
        technika: "wzajemnosc",
        koniec: { wynik: "stop", tekst: "Klient kupił gdzie indziej. Zostaje prośba o polecenie i pozytywne ostatnie wrażenie." },
      },
    },
  },

  "wygasla-oferta": {
    start: "otwarcie",
    wezly: {
      otwarcie: {
        agent: "Dzień dobry, [imię] z [biuro]. Widziałem, że ogłoszenie Pani mieszkania na [ulica] zniknęło po kilku miesiącach. Pewnie ma Pani dość telefonów od agentów, więc zapytam krótko: zrezygnowała Pani ze sprzedaży, czy tylko zrobiła przerwę?",
        technika: "audyt-oskarzen",
        opcje: [
          { klient: "Przerwa, mam już dość.", dalej: "przerwa" },
          { klient: "Sprzedałam.", dalej: "sprzedala" },
          { klient: "Nie chcę rozmawiać z agentami.", dalej: "bez-agentow" },
        ],
      },
      sprzedala: {
        agent: "Gratuluję! Przepraszam za kłopot. Jeśli będzie Pani znała kogoś, kto sprzedaje, chętnie pomogę.",
        koniec: { wynik: "stop", tekst: "Mieszkanie sprzedane, rozmowa kończy się w 20 sekund i na plus." },
      },
      "bez-agentow": {
        agent: "Rozumiem po tych kilku miesiącach. Mogę zapytać, co poszło nie tak z poprzednim biurem?",
        technika: "pytanie-o-powod",
        opcje: [
          { klient: "Nic nie robili, tylko obiecywali.", dalej: "diagnoza" },
          { klient: "Nie chcę o tym mówić.", dalej: "koniec" },
        ],
      },
      przerwa: {
        agent: "Rozumiem, kilka miesięcy bez efektu męczy. Co według Pani nie zadziałało?",
        technika: "pytania-otwarte",
        opcje: [
          { klient: "Było mało oglądających.", dalej: "diagnoza" },
          { klient: "Oglądali, ale nikt nie dał oferty.", dalej: "ogladali" },
        ],
      },
      diagnoza: {
        agent: "Ile było telefonów i prezentacji? I jaka była cena na początku, a jaka na końcu?",
        uwaga: "Najczęściej powód jest jeden z trzech: cena, prezentacja oferty albo kupujący bez finansowania.",
        opcje: [{ klient: "Na początku 890, potem 860. Może pięć prezentacji.", dalej: "nowy-plan" }],
      },
      ogladali: {
        agent: "To ważna informacja. Jeśli ludzie oglądają i nie składają ofert, problem zwykle jest w tym, co zobaczyli na miejscu albo w cenie względem tego, co widzieli obok. Ma Pani informację, co mówili?",
        opcje: [{ klient: "Że ładne, ale drogie.", dalej: "nowy-plan" }],
      },
      "nowy-plan": {
        agent: "Mam jeden pomysł, który zmieni wynik: zaczynamy od ceny z aktów notarialnych, a nie z ogłoszeń, i robimy dzień otwarty dla kupujących z policzonym kredytem. Mogę pokazać to w 20 minut przy mieszkaniu.",
        technika: "kontrast",
        opcje: [
          { klient: "Dobrze, kiedy?", dalej: "zamkniecie" },
          { klient: "Nie wiem, czy chcę znowu zaczynać.", dalej: "zmeczona" },
        ],
      },
      zmeczona: {
        agent: "Rozumiem. A co się wydarzy, jeśli mieszkanie nie sprzeda się do końca roku?",
        technika: "spin",
        opcje: [
          { klient: "Nic, będę dalej płacić czynsz.", dalej: "zamkniecie" },
          { klient: "Wtedy wynajmę.", dalej: "wynajem" },
        ],
      },
      wynajem: {
        agent: "To też rozsądna opcja. Mogę policzyć obie drogi, sprzedaż i najem, żeby wybór był na liczbach. Spotkajmy się na 20 minut?",
        opcje: [{ klient: "Dobrze.", dalej: "zamkniecie" }],
      },
      zamkniecie: {
        agent: "Pasuje Pani bardziej wtorek o 18 czy czwartek o 10?",
        technika: "zamkniecie-alternatywne",
        opcje: [{ klient: "Czwartek o 10.", dalej: "potwierdzenie" }],
      },
      potwierdzenie: {
        agent: "Zapisuję czwartek 10:00. Przyniosę ceny z aktów i plan na pierwsze dwa tygodnie.",
        koniec: { wynik: "sukces", tekst: "Spotkanie z właścicielem, który już wie, co nie zadziałało. Twoja propozycja musi być odpowiedzią właśnie na to." },
      },
      koniec: {
        agent: "Szanuję. Zostawię swój numer w SMS-ie, gdyby za jakiś czas chciała Pani wrócić do tematu. Dobrego dnia.",
        koniec: { wynik: "stop", tekst: "Bez naciskania. Właściciel wygasłej oferty często wraca po kilku tygodniach, a pamięta tego, kto był w porządku." },
      },
    },
  },

  polecenie: {
    start: "otwarcie",
    wezly: {
      otwarcie: {
        agent: "Dzień dobry, [imię] z [biuro]. Dzwonię, bo [polecający] powiedział, że rozważa Pan sprzedaż mieszkania i że mogę zadzwonić. Pomagałem mu w zeszłym roku. Dobrze trafiłem?",
        technika: "sympatia",
        uwaga: "Imię polecającego w pierwszym zdaniu. To ono otwiera rozmowę, nie Twoje biuro.",
        opcje: [
          { klient: "Tak, mówił mi. Myślimy o tym.", dalej: "diagnoza" },
          { klient: "Hm, to raczej odległy temat.", dalej: "odlegly" },
        ],
      },
      odlegly: {
        agent: "Jasne, żadnej presji. Na jakim etapie Pan jest: dopiero myśli Pan o sprzedaży, czy sprawdza, ile mieszkanie jest warte?",
        technika: "pytania-otwarte",
        opcje: [
          { klient: "Ciekawi mnie, ile jest warte.", dalej: "raport" },
          { klient: "Za rok, może dwa.", dalej: "pozniej" },
        ],
      },
      diagnoza: {
        agent: "Co sprawiło, że zaczęliście o tym myśleć? I do kiedy chcielibyście to załatwić?",
        opcje: [
          { klient: "Rodzi się drugie dziecko, potrzebujemy więcej miejsca. Najlepiej do lata.", dalej: "spotkanie" },
          { klient: "Na razie tylko rozmawiamy w domu.", dalej: "raport" },
        ],
      },
      raport: {
        agent: "To mogę zrobić od razu: przygotuję ceny z aktów notarialnych z Pana okolicy. Zajmuje 20 minut omówienia, najlepiej przy mieszkaniu, ale mogę też przez telefon.",
        technika: "wzajemnosc",
        opcje: [
          { klient: "Przy mieszkaniu może być.", dalej: "spotkanie" },
          { klient: "Wolę mailem.", dalej: "mail" },
        ],
      },
      mail: {
        agent: "Dobrze, wyślę jutro. Zadzwonię w piątek zapytać, czy coś Pana zaskoczyło.",
        koniec: { wynik: "pozniej", tekst: "Polecony klient nie musi być gotowy dziś. Ma dostać wartość i wiedzieć, kiedy się odezwiesz." },
      },
      pozniej: {
        agent: "Dobrze. Zapiszę sobie i odezwę się wiosną z aktualnymi cenami. Pozdrowię [polecający].",
        koniec: { wynik: "pozniej", tekst: "Termin kolejnego kontaktu w kalendarzu, a polecający wie, że zadzwoniłeś. Dbaj o obie relacje." },
      },
      spotkanie: {
        agent: "To spotkajmy się na pół godziny przy mieszkaniu. Pasuje Panu wtorek po 18 czy sobota rano?",
        technika: "zamkniecie-alternatywne",
        opcje: [{ klient: "Sobota o 10.", dalej: "potwierdzenie" }],
      },
      potwierdzenie: {
        agent: "Zapisuję sobotę 10:00. Dam znać [polecający], że się umówiliśmy, i podziękuję za polecenie.",
        koniec: { wynik: "sukces", tekst: "Spotkanie z poleconym klientem. Podziękowanie polecającemu to Twoje najlepsze źródło kolejnych poleceń." },
      },
    },
  },

  "najem-wlasciciel": {
    start: "otwarcie",
    wezly: {
      otwarcie: {
        agent: "Dzień dobry, [imię] z [biuro]. Dzwonię w sprawie ogłoszenia mieszkania na wynajem na [ulica]. Jest jeszcze dostępne?",
        opcje: [
          { klient: "Tak. Jest Pan najemcą?", dalej: "nie-najemca" },
          { klient: "Z biurem nie chcę.", dalej: "bez-biura" },
        ],
      },
      "nie-najemca": {
        agent: "Nie, pośredniczę w najmie, ale mam pytanie, które może się Panu przydać: ile osób dzwoniło od wystawienia ogłoszenia i ilu z nich miało dokumenty dochodu?",
        technika: "pytania-otwarte",
        opcje: [
          { klient: "Dużo dzwoni, ale różni ludzie.", dalej: "rozni" },
          { klient: "Już wybrałem najemcę.", dalej: "wybrany" },
        ],
      },
      "bez-biura": {
        agent: "Rozumiem. A co jest dla Pana najważniejsze przy wyborze najemcy?",
        technika: "pytanie-o-powod",
        opcje: [
          { klient: "Żeby płacił i nie zniszczył mieszkania.", dalej: "rozni" },
          { klient: "Nic, kończmy.", dalej: "koniec" },
        ],
      },
      rozni: {
        agent: "U nas najemca przed oglądaniem pokazuje umowę o pracę albo wyciąg, podpisujemy najem okazjonalny z oświadczeniem u notariusza. Wynagrodzenie płaci najemca, nie Pan.",
        technika: "obiektywne-kryteria",
        uwaga: "W najmie właściciel boi się złego najemcy, nie prowizji. Mów o bezpieczeństwie.",
        opcje: [
          { klient: "Najemca płaci? To nie mam nic do stracenia.", dalej: "zamkniecie" },
          { klient: "A co, jak przestanie płacić?", dalej: "ryzyko" },
        ],
      },
      ryzyko: {
        agent: "Dlatego najem okazjonalny: przy zaległościach eksmisja idzie bez długiego procesu. Do tego kaucja w wysokości dwóch czynszów.",
        opcje: [{ klient: "To brzmi bezpiecznie.", dalej: "zamkniecie" }],
      },
      wybrany: {
        agent: "Świetnie. Czy będzie to najem okazjonalny? Jeśli nie, mogę podesłać wzór umowy, który zabezpiecza właściciela.",
        technika: "wzajemnosc",
        koniec: { wynik: "stop", tekst: "Najemca wybrany, ale dajesz wartość. Właściciel zapamięta, do kogo dzwonić przy następnym najmie." },
      },
      zamkniecie: {
        agent: "Przyjadę zrobić zdjęcia i spisać stan. Pasuje jutro o 17 czy w czwartek rano?",
        technika: "zamkniecie-alternatywne",
        opcje: [{ klient: "Jutro o 17.", dalej: "potwierdzenie" }],
      },
      potwierdzenie: {
        agent: "Zapisuję jutro 17:00. Proszę przygotować liczniki i klucze, spiszemy wszystko w protokole.",
        koniec: { wynik: "sukces", tekst: "Mieszkanie do najmu pozyskane. Pierwszy dobrze dobrany najemca to Twój argument przy kolejnym właścicielu." },
      },
      koniec: {
        agent: "Rozumiem, powodzenia z najmem. Zostawię swój numer, gdyby coś się zmieniło.",
        koniec: { wynik: "stop", tekst: "Krótko i grzecznie. Ogłoszenia najmu wracają co kilka miesięcy, a ten sam właściciel też." },
      },
    },
  },

  "przekazanie-oferty-kupujacego": {
    start: "otwarcie",
    wezly: {
      otwarcie: {
        agent: "Dzień dobry, mam dobrą wiadomość: mamy pisemną ofertę na Pana mieszkanie. Ma Pan chwilę, żebyśmy przeszli przez szczegóły?",
        opcje: [{ klient: "Tak! Ile?", dalej: "kwota" }],
      },
      kwota: {
        agent: "Zanim powiem kwotę, kilka faktów o kupującym: para z decyzją kredytową, wkład własny 30 procent, akt mogą podpisać w ciągu 6 tygodni. Oferują 742 tysiące.",
        technika: "kotwiczenie",
        uwaga: "Najpierw jakość kupującego, potem kwota. Pewność finansowania jest warta więcej niż kilka tysięcy.",
        opcje: [
          { klient: "To za mało, chciałem 780.", dalej: "za-malo" },
          { klient: "Hm, nie jest źle.", dalej: "dobrze" },
          { klient: "Biorę od razu!", dalej: "od-razu" },
        ],
      },
      "od-razu": {
        agent: "Cieszę się. Zanim potwierdzę, sprawdźmy jeszcze termin wydania i co zostaje w mieszkaniu, żeby nie było niespodzianek przy akcie.",
        technika: "zamkniecie-podsumowujace",
        opcje: [{ klient: "Wydanie po akcie, zostawiam kuchnię.", dalej: "akceptacja" }],
      },
      "za-malo": {
        agent: "Rozumiem. Co byłoby dla Pana kwotą, przy której zamykamy temat dziś?",
        technika: "pytania-kalibrowane",
        opcje: [
          { klient: "765.", dalej: "kontra" },
          { klient: "Nie zejdę z 780.", dalej: "twardo" },
        ],
      },
      twardo: {
        agent: "Przekażę to, ale uczciwie: od 4 miesięcy nie było innej oferty, a ta jest z pewnym finansowaniem. Przy 780 ryzykujemy, że kupujący wybierze mieszkanie obok. Proponuję kontrę 765.",
        technika: "koszt-zwloki",
        opcje: [
          { klient: "Dobrze, 765.", dalej: "kontra" },
          { klient: "780 albo nic.", dalej: "przekaze" },
        ],
      },
      przekaze: {
        agent: "Dobrze, to Pana decyzja. Przekażę 780 jeszcze dziś i oddzwonię z odpowiedzią.",
        koniec: { wynik: "pozniej", tekst: "Właściciel zdecydował świadomie, znając ryzyko. Twoja rola to rzetelna informacja, a nie decyzja za niego." },
      },
      dobrze: {
        agent: "Mamy dwie drogi: przyjąć albo złożyć kontrofertę. Przy tym kupującym rozsądna kontra to 755 do 760. Co Pan woli?",
        technika: "zamkniecie-alternatywne",
        opcje: [
          { klient: "Kontra 760.", dalej: "kontra" },
          { klient: "Przyjmujemy.", dalej: "akceptacja" },
        ],
      },
      kontra: {
        agent: "Przekażę kontrofertę dziś, z jedną dodatkową rzeczą: krótszy termin aktu, 4 tygodnie. To pokazuje, że jesteśmy poważni, i daje coś w zamian za wyższą kwotę.",
        technika: "strategia-ustepstw",
        koniec: { wynik: "pozniej", tekst: "Kontroferta z wymianą, a nie sama kwota. Kupujący dostaje coś w zamian i łatwiej mu się zgodzić." },
      },
      akceptacja: {
        agent: "Świetnie. Wysyłam akceptację na piśmie, umawiam notariusza na umowę przedwstępną w przyszłym tygodniu i dam znać o terminie.",
        koniec: { wynik: "sukces", tekst: "Oferta zaakceptowana i od razu następny krok: notariusz. Między „tak” a podpisem nie może być pustego tygodnia." },
      },
    },
  },
};

export function rozmowa(slug: string): RozmowaDrzewo | undefined {
  return ROZMOWY[slug];
}
