/**
 * Dane demonstracyjne dla wzorów stron biur nieruchomości.
 *
 * W prawdziwej stronie klienta te oferty przychodzą z AgentSpace (te same
 * rekordy, które agent wpisuje w CRM). Tutaj są wpisane na sztywno, żeby wzór
 * dało się obejrzeć bez logowania i bez bazy.
 */

export type DemoDeal = "sprzedaz" | "wynajem";
export type DemoKind = "mieszkanie" | "dom" | "dzialka" | "lokal" | "biuro";

export type DemoOffer = {
  id: string;
  no: string;
  title: string;
  deal: DemoDeal;
  kind: DemoKind;
  city: string;
  district: string;
  street: string;
  price: number;
  area: number;
  rooms: number | null;
  floor: string | null;
  year: number | null;
  lat: number;
  lng: number;
  photos: string[];
  lead: string;
  description: string[];
  features: string[];
  agentId: string;
  featured?: boolean;
  fresh?: boolean;
  energy?: string;
};

export type DemoAgent = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  photo: string;
  bio: string;
  areas: string[];
  deals: number;
};

export const DEMO_AGENTS: DemoAgent[] = [
  {
    id: "a1",
    name: "Marta Lewandowska",
    role: "Doradca, rynek premium",
    phone: "+48 600 100 200",
    email: "marta@przyklad.pl",
    photo: "/wzory/salon-widok.jpg",
    bio: "Od dziewięciu lat sprzedaje apartamenty w Starym Mieście i na Zabłociu. Prowadzi transakcje po polsku i angielsku.",
    areas: ["Stare Miasto", "Kazimierz", "Zabłocie"],
    deals: 187,
  },
  {
    id: "a2",
    name: "Paweł Zieliński",
    role: "Doradca, domy i działki",
    phone: "+48 600 100 201",
    email: "pawel@przyklad.pl",
    photo: "/wzory/dom.jpg",
    bio: "Zna okolice Krakowa na pamięć. Wie, gdzie kanalizacja jest już w drodze, a gdzie tylko w planach.",
    areas: ["Wola Justowska", "Zielonki", "Modlniczka"],
    deals: 143,
  },
  {
    id: "a3",
    name: "Karolina Mazur",
    role: "Doradca, najem długoterminowy",
    phone: "+48 600 100 202",
    email: "karolina@przyklad.pl",
    photo: "/wzory/kuchnia.jpg",
    bio: "Obsługuje właścicieli, którzy nie chcą zajmować się najmem sami. Od wyceny po protokół zdawczy.",
    areas: ["Grzegórzki", "Podgórze", "Krowodrza"],
    deals: 264,
  },
  {
    id: "a4",
    name: "Tomasz Bąk",
    role: "Doradca, lokale i inwestycje",
    phone: "+48 600 100 203",
    email: "tomasz@przyklad.pl",
    photo: "/wzory/hala.jpg",
    bio: "Liczy rentowność, zanim pokaże lokal. Pracuje z inwestorami kupującymi pod wynajem.",
    areas: ["Śródmieście", "Nowa Huta", "Bronowice"],
    deals: 96,
  },
];

export const DEMO_OFFERS: DemoOffer[] = [
  {
    id: "o1",
    no: "SN/2026/041",
    title: "Apartament z widokiem na Wawel",
    deal: "sprzedaz",
    kind: "mieszkanie",
    city: "Kraków",
    district: "Zabłocie",
    street: "ul. Nadwiślańska",
    price: 1_690_000,
    area: 84,
    rooms: 3,
    floor: "19 / 28",
    year: 2021,
    lat: 50.0466,
    lng: 19.9573,
    photos: ["/wzory/salon-widok.jpg", "/wzory/widok.jpg", "/wzory/sypialnia.jpg", "/wzory/lobby.jpg"],
    lead: "Narożny salon z dwiema ekspozycjami, taras 14 m² i widok, którego nikt nie zasłoni.",
    description: [
      "Mieszkanie na 19. piętrze budynku przy bulwarach. Salon połączony z kuchnią ma okna od podłogi do sufitu i wyjście na taras z widokiem na Wawel i Stare Miasto.",
      "Dwie sypialnie z własnymi szafami, łazienka z oknem, osobna toaleta i pralnia. W cenie miejsce postojowe w hali garażowej i komórka lokatorska.",
      "Budynek z recepcją czynną całą dobę, basenem na dachu i strefą lounge dla mieszkańców. Czynsz 940 zł miesięcznie razem z funduszem remontowym.",
    ],
    features: ["Taras 14 m²", "Miejsce w garażu", "Komórka lokatorska", "Recepcja 24/7", "Klimatyzacja", "Winda"],
    agentId: "a1",
    featured: true,
    energy: "A",
  },
  {
    id: "o2",
    no: "SN/2026/038",
    title: "Loft w dawnej fabryce",
    deal: "sprzedaz",
    kind: "mieszkanie",
    city: "Kraków",
    district: "Podgórze",
    street: "ul. Solna",
    price: 1_240_000,
    area: 96,
    rooms: 2,
    floor: "2 / 3",
    year: 1928,
    lat: 50.0405,
    lng: 19.9576,
    photos: ["/wzory/loft.jpg", "/wzory/cegla.jpg", "/wzory/schody.jpg", "/wzory/dziedziniec.jpg"],
    lead: "Cztery metry wysokości, oryginalna cegła i stalowe okna po renowacji.",
    description: [
      "Loft w odrestaurowanej hali z 1928 roku. Ściany z oryginalnej cegły, sufit na wysokości czterech metrów, stolarka stalowa odtworzona według archiwalnych rysunków.",
      "Otwarta przestrzeń dzienna, antresola z sypialnią, łazienka z wanną wolnostojącą. Ogrzewanie podłogowe w całym mieszkaniu.",
      "Kameralna wspólnota: dwanaście lokali, zamknięty dziedziniec z zielenią i miejscami postojowymi.",
    ],
    features: ["Antresola", "Cegła po renowacji", "Ogrzewanie podłogowe", "Zamknięty dziedziniec", "Miejsce postojowe"],
    agentId: "a1",
    featured: true,
    energy: "C",
  },
  {
    id: "o3",
    no: "SN/2026/055",
    title: "Dom przy lesie, gotowy do wejścia",
    deal: "sprzedaz",
    kind: "dom",
    city: "Zielonki",
    district: "Zielonki",
    street: "ul. Leśna",
    price: 2_150_000,
    area: 214,
    rooms: 6,
    floor: null,
    year: 2022,
    lat: 50.1206,
    lng: 19.9022,
    photos: ["/wzory/dom-las.jpg", "/wzory/salon.jpg", "/wzory/kuchnia.jpg", "/wzory/szklo.jpg", "/wzory/las.jpg"],
    lead: "Piętnaście minut od Bronowic, a z tarasu widać tylko drzewa.",
    description: [
      "Dom wolnostojący na działce 1100 m², oddany w 2022 roku. Parter otwarty na ogród przeszkleniem na całą ścianę salonu.",
      "Na parterze kuchnia z wyspą, spiżarnia, gabinet i łazienka. Na piętrze cztery sypialnie, dwie łazienki i garderoba.",
      "Pompa ciepła, fotowoltaika 8 kWp, rekuperacja. Rachunki za ogrzewanie w zeszłym sezonie: 2 400 zł za cały rok.",
    ],
    features: ["Działka 1100 m²", "Pompa ciepła", "Fotowoltaika 8 kWp", "Rekuperacja", "Garaż dwustanowiskowy", "Taras 40 m²"],
    agentId: "a2",
    featured: true,
    fresh: true,
    energy: "A+",
  },
  {
    id: "o4",
    no: "SN/2026/060",
    title: "Dwa pokoje przy Rynku Podgórskim",
    deal: "sprzedaz",
    kind: "mieszkanie",
    city: "Kraków",
    district: "Podgórze",
    street: "ul. Kalwaryjska",
    price: 789_000,
    area: 48,
    rooms: 2,
    floor: "3 / 4",
    year: 1936,
    lat: 50.0447,
    lng: 19.9498,
    photos: ["/wzory/wnetrze-slonce.jpg", "/wzory/sypialnia.jpg", "/wzory/kuchnia.jpg"],
    lead: "Kamienica po remoncie dachu i klatki, mieszkanie z oknami na południe.",
    description: [
      "Mieszkanie w przedwojennej kamienicy, po generalnym remoncie w 2023 roku. Zachowane drzwi płycinowe i podłoga z dębu po cyklinowaniu.",
      "Salon z aneksem, osobna sypialnia, łazienka z pralką. Okna na południe, przez cały dzień jest słońce.",
      "Wspólnota po remoncie dachu, klatki i instalacji elektrycznej. Czynsz 460 zł.",
    ],
    features: ["Po remoncie", "Okna południowe", "Piwnica", "Cicha oficyna"],
    agentId: "a3",
    fresh: true,
    energy: "D",
  },
  {
    id: "o5",
    no: "SN/2026/061",
    title: "Apartament do wynajęcia przy Plantach",
    deal: "wynajem",
    kind: "mieszkanie",
    city: "Kraków",
    district: "Stare Miasto",
    street: "ul. Karmelicka",
    price: 5_400,
    area: 62,
    rooms: 2,
    floor: "1 / 4",
    year: 1912,
    lat: 50.0641,
    lng: 19.9296,
    photos: ["/wzory/salon.jpg", "/wzory/kuchnia.jpg", "/wzory/sypialnia.jpg"],
    lead: "Umeblowany, z miejscem postojowym w podwórzu. Wolny od zaraz.",
    description: [
      "Mieszkanie w kamienicy sto metrów od Plant. W pełni umeblowane i wyposażone, wystarczy wprowadzić walizkę.",
      "Salon z aneksem kuchennym, sypialnia z podwójnym łóżkiem, łazienka z prysznicem walk-in. Zmywarka, pralka, klimatyzacja.",
      "Czynsz administracyjny i media po stronie najemcy, kaucja w wysokości jednego czynszu.",
    ],
    features: ["Umeblowane", "Klimatyzacja", "Miejsce postojowe", "Wolne od zaraz"],
    agentId: "a3",
    energy: "E",
  },
  {
    id: "o6",
    no: "SN/2026/044",
    title: "Lokal usługowy z witryną",
    deal: "wynajem",
    kind: "lokal",
    city: "Kraków",
    district: "Kazimierz",
    street: "ul. Józefa",
    price: 9_800,
    area: 78,
    rooms: null,
    floor: "parter",
    year: 1890,
    lat: 50.0513,
    lng: 19.9457,
    photos: ["/wzory/hala.jpg", "/wzory/cegla.jpg", "/wzory/schody.jpg"],
    lead: "Sześć metrów witryny na ruchliwej ulicy, zaplecze i osobne wejście dostaw.",
    description: [
      "Lokal na parterze kamienicy w sercu Kazimierza. Sala sprzedaży 58 m², zaplecze socjalne i magazyn.",
      "Instalacja wodna i elektryczna wymieniona, moc przyłączeniowa 22 kW. Wentylacja przygotowana pod gastronomię.",
      "Zgoda wspólnoty na koncesję alkoholową. Możliwy ogródek na sześć stolików od maja do września.",
    ],
    features: ["Witryna 6 m", "Moc 22 kW", "Zaplecze", "Zgoda na ogródek"],
    agentId: "a4",
    featured: true,
  },
  {
    id: "o7",
    no: "SN/2026/029",
    title: "Działka budowlana z warunkami zabudowy",
    deal: "sprzedaz",
    kind: "dzialka",
    city: "Modlniczka",
    district: "Modlniczka",
    street: "ul. Graniczna",
    price: 640_000,
    area: 1450,
    rooms: null,
    floor: null,
    year: null,
    lat: 50.0982,
    lng: 19.8504,
    photos: ["/wzory/las.jpg", "/wzory/park.jpg"],
    lead: "Prostokąt 29 x 50 m, media w drodze, warunki zabudowy prawomocne.",
    description: [
      "Działka o regularnym kształcie, z dostępem do drogi asfaltowej. Warunki zabudowy na dom jednorodzinny do 220 m² powierzchni użytkowej.",
      "Prąd i woda w granicy działki, gaz w drodze. Kanalizacja planowana na 2027 rok, obecnie zbiorniki bezodpływowe.",
      "Osiem kilometrów do węzła autostrady A4, dwadzieścia minut do centrum Krakowa poza godzinami szczytu.",
    ],
    features: ["Warunki zabudowy", "Media w granicy", "Droga asfaltowa", "Bez służebności"],
    agentId: "a2",
  },
  {
    id: "o8",
    no: "SN/2026/052",
    title: "Penthouse z tarasem na dachu",
    deal: "sprzedaz",
    kind: "mieszkanie",
    city: "Kraków",
    district: "Grzegórzki",
    street: "ul. Mogilska",
    price: 2_890_000,
    area: 132,
    rooms: 4,
    floor: "8 / 8",
    year: 2019,
    lat: 50.0662,
    lng: 19.9673,
    photos: ["/wzory/taras.jpg", "/wzory/salon-widok.jpg", "/wzory/basen.jpg", "/wzory/lounge.jpg"],
    lead: "Osiemdziesiąt metrów tarasu na wyłączność i panorama od Kopca Kościuszki po Nową Hutę.",
    description: [
      "Ostatnie piętro budynku z 2019 roku. Salon z kominkiem, otwarta kuchnia, trzy sypialnie, dwie łazienki i gabinet.",
      "Taras na dachu 80 m² z instalacją wodną i elektryczną, przygotowany pod kuchnię letnią i jacuzzi.",
      "Dwa miejsca postojowe, komórka, winda bezpośrednio na piętro. Budynek z ochroną i monitoringiem.",
    ],
    features: ["Taras 80 m²", "Kominek", "Dwa miejsca postojowe", "Winda na piętro", "Ochrona"],
    agentId: "a1",
    energy: "B",
  },
  {
    id: "o9",
    no: "SN/2026/058",
    title: "Kawalerka pod wynajem inwestycyjny",
    deal: "sprzedaz",
    kind: "mieszkanie",
    city: "Kraków",
    district: "Nowa Huta",
    street: "os. Centrum B",
    price: 415_000,
    area: 31,
    rooms: 1,
    floor: "4 / 5",
    year: 1957,
    lat: 50.0724,
    lng: 20.0367,
    photos: ["/wzory/wnetrze-slonce.jpg", "/wzory/kuchnia.jpg"],
    lead: "Wynajęta na 4 200 zł miesięcznie, umowa do końca roku. Rentowność 8,1 procent.",
    description: [
      "Mieszkanie w kwartale objętym ochroną konserwatorską, po remoncie w 2024 roku. Kupujesz z najemcą i czynną umową.",
      "Salon z aneksem, osobna łazienka, przedpokój z zabudową. Wysokość 3,1 m pozwoliła zrobić antresolę do spania.",
      "Do przystanku tramwajowego dwieście metrów, do centrum dwadzieścia minut tramwajem.",
    ],
    features: ["Wynajęte", "Rentowność 8,1%", "Po remoncie", "Antresola"],
    agentId: "a4",
    fresh: true,
    energy: "D",
  },
  {
    id: "o10",
    no: "SN/2026/047",
    title: "Dom w zabudowie bliźniaczej",
    deal: "sprzedaz",
    kind: "dom",
    city: "Kraków",
    district: "Wola Justowska",
    street: "ul. Junacka",
    price: 1_780_000,
    area: 148,
    rooms: 5,
    floor: null,
    year: 2015,
    lat: 50.0611,
    lng: 19.8842,
    photos: ["/wzory/dom.jpg", "/wzory/salon.jpg", "/wzory/sypialnia.jpg", "/wzory/park.jpg"],
    lead: "Ogród od południa, las w zasięgu spaceru, szkoła trzysta metrów dalej.",
    description: [
      "Bliźniak z 2015 roku na działce 380 m². Salon z wyjściem na taras, kuchnia z oknem, gabinet na parterze.",
      "Na piętrze trzy sypialnie i dwie łazienki. Poddasze użytkowe przygotowane pod czwarty pokój.",
      "Ogrzewanie gazowe z kondensacją, kominek z płaszczem wodnym, rolety zewnętrzne sterowane aplikacją.",
    ],
    features: ["Ogród 380 m²", "Garaż", "Kominek", "Rolety zewnętrzne", "Poddasze do adaptacji"],
    agentId: "a2",
    energy: "C",
  },
  {
    id: "o11",
    no: "SN/2026/063",
    title: "Powierzchnia biurowa w kamienicy",
    deal: "wynajem",
    kind: "biuro",
    city: "Kraków",
    district: "Stare Miasto",
    street: "ul. Długa",
    price: 12_400,
    area: 164,
    rooms: 6,
    floor: "1 / 3",
    year: 1905,
    lat: 50.0693,
    lng: 19.9375,
    photos: ["/wzory/schody.jpg", "/wzory/dziedziniec.jpg", "/wzory/cegla.jpg"],
    lead: "Sześć gabinetów, sala konferencyjna i światłowód. Wejście od frontu.",
    description: [
      "Pierwsze piętro kamienicy po pełnej renowacji. Wysokie pomieszczenia, sztukateria, okna na ulicę i na cichy dziedziniec.",
      "Sześć gabinetów, open space na osiem stanowisk, sala konferencyjna, kuchnia i dwie łazienki.",
      "Światłowód 1 Gb/s, klimatyzacja, alarm. Dwa miejsca postojowe w podwórzu w cenie najmu.",
    ],
    features: ["Sala konferencyjna", "Światłowód", "Klimatyzacja", "Dwa miejsca postojowe"],
    agentId: "a4",
  },
  {
    id: "o12",
    no: "SN/2026/066",
    title: "Trzy pokoje z ogródkiem",
    deal: "sprzedaz",
    kind: "mieszkanie",
    city: "Kraków",
    district: "Bronowice",
    street: "ul. Zarzecze",
    price: 1_050_000,
    area: 71,
    rooms: 3,
    floor: "parter / 4",
    year: 2018,
    lat: 50.0785,
    lng: 19.8998,
    photos: ["/wzory/szklo.jpg", "/wzory/salon.jpg", "/wzory/park.jpg"],
    lead: "Parter z ogródkiem 60 m², wyjście prosto na zieleń osiedla.",
    description: [
      "Mieszkanie na parterze z własnym ogródkiem od strony zamkniętego dziedzińca. Bezpieczne dla dzieci, żadnego ruchu samochodów.",
      "Salon z wyjściem na taras, dwie sypialnie, łazienka i osobna toaleta. Miejsce postojowe w hali w cenie.",
      "Osiedle z placem zabaw, siłownią plenerową i sklepem na parterze budynku obok.",
    ],
    features: ["Ogródek 60 m²", "Taras", "Miejsce w hali", "Osiedle zamknięte", "Plac zabaw"],
    agentId: "a3",
    fresh: true,
    energy: "B",
  },
];

export type DemoArticle = {
  slug: string;
  title: string;
  lead: string;
  date: string;
  read: number;
  photo: string;
  tag: string;
  author: string;
  body: { h?: string; p: string[] }[];
};

export const DEMO_ARTICLES: DemoArticle[] = [
  {
    slug: "ile-trwa-sprzedaz-mieszkania-w-krakowie",
    title: "Ile naprawdę trwa sprzedaż mieszkania w Krakowie",
    lead: "Mediana z naszych 128 transakcji z zeszłego roku, w rozbiciu na dzielnice i przedziały cenowe.",
    date: "12 marca 2026",
    read: 6,
    photo: "/wzory/miasto-noc.jpg",
    tag: "Rynek",
    author: "Marta Lewandowska",
    body: [
      {
        p: [
          "Najczęstsze pytanie przy pierwszej rozmowie brzmi: ile to potrwa. Odpowiedź z portali, czyli średnia dla całego miasta, nic nie mówi, bo kawalerka na Kazimierzu i dom w Zielonkach to dwa różne światy.",
          "Poniżej mediany z naszych 128 transakcji zamkniętych w zeszłym roku, liczone od dnia publikacji do podpisania umowy przedwstępnej.",
        ],
      },
      {
        h: "Mieszkania do 60 metrów",
        p: [
          "Mediana 19 dni. To najpłynniejszy segment rynku, bo kupują go zarówno pary na start, jak i inwestorzy pod wynajem. Przy cenie ustawionej na poziomie transakcyjnym pierwsze prezentacje są zwykle w ciągu trzech dni.",
          "Co wydłuża sprzedaż: parter bez ogródka, kuchnia bez okna i czynsz powyżej 1000 zł. Każda z tych rzeczy to średnio dwa tygodnie więcej.",
        ],
      },
      {
        h: "Mieszkania powyżej 80 metrów",
        p: [
          "Mediana 47 dni. Kupujących jest mniej, za to decyzja zapada wolniej i częściej zależy od kredytu. Tutaj naprawdę opłaca się home staging, bo zdjęcia decydują, czy ktoś w ogóle zadzwoni.",
        ],
      },
      {
        h: "Domy i działki",
        p: [
          "Mediana 74 dni dla domów i 96 dni dla działek. Sezonowość jest wyraźna: od marca do czerwca ruch jest dwa razy większy niż zimą.",
          "Jeśli planujesz sprzedaż domu, przygotowania zacznij w styczniu, żeby wejść na rynek z pierwszym ciepłym tygodniem.",
        ],
      },
      {
        h: "Co z tego wynika dla Ciebie",
        p: [
          "Cena ofertowa ustawiona 10 procent powyżej rynku wydłuża sprzedaż średnio o 41 dni i najczęściej kończy się obniżką poniżej poziomu, który dałoby się uzyskać od razu.",
          "Zanim ustalimy cenę, pokazujemy akty notarialne z Twojego budynku i sąsiednich ulic. To jedyna twarda podstawa, jaką ma ten rynek.",
        ],
      },
    ],
  },
  {
    slug: "co-sprawdzic-przed-podpisaniem-umowy-przedwstepnej",
    title: "Co sprawdzić przed podpisaniem umowy przedwstępnej",
    lead: "Księga wieczysta to dopiero początek. Lista dziewięciu rzeczy, które sprawdzamy przy każdej transakcji.",
    date: "27 lutego 2026",
    read: 8,
    photo: "/wzory/schody.jpg",
    tag: "Bezpieczeństwo",
    author: "Paweł Zieliński",
    body: [
      {
        p: [
          "Umowa przedwstępna to moment, w którym pieniądze zaczynają realnie zmieniać właściciela. Zadatek przepada albo wraca w podwójnej wysokości, więc każdy zapis ma cenę.",
          "Oto lista, którą przechodzimy przy każdej transakcji, zanim ktokolwiek cokolwiek podpisze.",
        ],
      },
      {
        h: "Dziewięć rzeczy do sprawdzenia",
        p: [
          "Księga wieczysta: dział III i IV, czyli roszczenia i hipoteki. Hipoteka nie blokuje sprzedaży, ale musi być rozliczona w akcie.",
          "Podstawa nabycia: skąd właściciel ma tę nieruchomość. Spadek i darowizna wymagają zaświadczenia z urzędu skarbowego.",
          "Zaświadczenie o braku zameldowanych osób i o braku zaległości w czynszu.",
          "Uchwały wspólnoty: planowane remonty i fundusz remontowy. Nowa elewacja potrafi kosztować kilkanaście tysięcy na lokal.",
          "Świadectwo energetyczne: obowiązkowe przy sprzedaży, wymagane przez notariusza.",
          "Stan prawny gruntu przy domach: własność czy użytkowanie wieczyste, oraz dostęp do drogi publicznej.",
          "Decyzje administracyjne: pozwolenie na budowę, zgłoszenie zakończenia, ewentualne samowole.",
          "Zadatek czy zaliczka: to nie synonimy, różnica bywa warta kilkadziesiąt tysięcy.",
          "Termin i warunek kredytowy: jeśli kupujący bierze kredyt, umowa musi opisywać, co się dzieje przy odmowie banku.",
        ],
      },
      {
        h: "Najczęstszy błąd",
        p: [
          "Podpisywanie umowy w formie zwykłej pisemnej przy transakcji z kredytem. Bank zwykle wymaga aktu notarialnego, a poprawianie tego po fakcie kosztuje czas i nerwy obu stron.",
        ],
      },
    ],
  },
  {
    slug: "swiadectwo-energetyczne-bez-nerwow",
    title: "Świadectwo energetyczne bez nerwów",
    lead: "Kiedy jest obowiązkowe, ile kosztuje i dlaczego warto je zrobić przed pierwszą prezentacją.",
    date: "9 lutego 2026",
    read: 4,
    photo: "/wzory/szklo.jpg",
    tag: "Formalności",
    author: "Karolina Mazur",
    body: [
      {
        p: [
          "Świadectwo charakterystyki energetycznej jest obowiązkowe przy sprzedaży i przy wynajmie na czas dłuższy niż rok. Notariusz zapyta o nie przy akcie, a jego brak potrafi przesunąć podpisanie o tydzień.",
        ],
      },
      {
        h: "Ile to kosztuje i jak długo trwa",
        p: [
          "Dla mieszkania: zwykle od 350 do 600 zł i dwa do czterech dni roboczych. Dla domu: od 600 do 1200 zł, bo potrzebna jest wizja lokalna i dokumentacja techniczna.",
          "Świadectwo jest ważne dziesięć lat, chyba że zmienisz coś istotnego, na przykład wymienisz źródło ciepła albo docieplisz budynek.",
        ],
      },
      {
        h: "Dlaczego warto zrobić je przed sesją zdjęciową",
        p: [
          "Klasa energetyczna trafia do ogłoszenia i coraz więcej kupujących filtruje po niej oferty. Jeśli budynek wypada dobrze, to argument w negocjacjach. Jeśli słabo, lepiej wiedzieć wcześniej i przygotować odpowiedź niż tłumaczyć się przy trzeciej prezentacji.",
        ],
      },
    ],
  },
  {
    slug: "home-staging-co-naprawde-dziala",
    title: "Home staging: co naprawdę działa, a co jest stratą pieniędzy",
    lead: "Pięć zmian, które podnoszą cenę, i trzy, na które szkoda budżetu tuż przed sprzedażą.",
    date: "22 stycznia 2026",
    read: 5,
    photo: "/wzory/salon.jpg",
    tag: "Sprzedaż",
    author: "Marta Lewandowska",
    body: [
      {
        p: [
          "Home staging nie polega na remoncie. Polega na tym, żeby kupujący w pierwszych sekundach zobaczył przestrzeń, a nie cudze życie.",
        ],
      },
      {
        h: "Co działa",
        p: [
          "Wyniesienie połowy rzeczy. Puste blaty i szafy robią większe wrażenie niż nowa kanapa.",
          "Jednolite światło: wymiana wszystkich żarówek na ciepłe białe o tej samej barwie.",
          "Neutralna ściana za łóżkiem i w salonie, jeśli obecny kolor jest mocny.",
          "Mycie okien przed sesją. Na zdjęciach robi większą różnicę, niż ktokolwiek się spodziewa.",
          "Zieleń: dwie duże rośliny zamiast dziesięciu doniczek.",
        ],
      },
      {
        h: "Czego nie warto robić przed sprzedażą",
        p: [
          "Wymiany kuchni. Kupujący i tak zrobi po swojemu, a koszt rzadko wraca w cenie.",
          "Kładzenia nowych paneli na całość, jeśli stare są tylko zużyte, a nie zniszczone.",
          "Kupowania mebli pod sesję, które potem trzeba wywieźć.",
        ],
      },
    ],
  },
  {
    slug: "wynajem-okazjonalny-krok-po-kroku",
    title: "Najem okazjonalny krok po kroku",
    lead: "Dlaczego warto, ile kosztuje i jakie dokumenty musi dostarczyć najemca.",
    date: "8 stycznia 2026",
    read: 7,
    photo: "/wzory/sypialnia.jpg",
    tag: "Najem",
    author: "Karolina Mazur",
    body: [
      {
        p: [
          "Najem okazjonalny to jedyna forma, która realnie pozwala odzyskać mieszkanie, gdy najemca przestaje płacić i nie chce się wyprowadzić.",
        ],
      },
      {
        h: "Co jest potrzebne",
        p: [
          "Oświadczenie najemcy w formie aktu notarialnego o poddaniu się egzekucji.",
          "Wskazanie innego lokalu, do którego najemca może się wyprowadzić, oraz zgoda właściciela tego lokalu.",
          "Zgłoszenie umowy do urzędu skarbowego w ciągu czternastu dni od rozpoczęcia najmu.",
        ],
      },
      {
        h: "Koszty i terminy",
        p: [
          "Taksa notarialna to zwykle od 250 do 400 zł i najczęściej płaci ją najemca. Cała procedura zajmuje dwa do czterech dni roboczych.",
          "Brak zgłoszenia do urzędu skarbowego w terminie powoduje, że umowa traci charakter okazjonalny i zostaje zwykłym najmem.",
        ],
      },
    ],
  },
  {
    slug: "kupno-mieszkania-z-najemca",
    title: "Kupno mieszkania z najemcą w środku",
    lead: "Kiedy to okazja, a kiedy kupujesz cudzy problem razem z metrami.",
    date: "19 grudnia 2025",
    read: 6,
    photo: "/wzory/wnetrze-slonce.jpg",
    tag: "Inwestycje",
    author: "Tomasz Bąk",
    body: [
      {
        p: [
          "Mieszkanie z czynną umową najmu potrafi być dobrym zakupem: masz przychód od pierwszego dnia i nie tracisz miesiąca na szukanie najemcy. Pod warunkiem, że wiesz, co kupujesz.",
        ],
      },
      {
        h: "Co sprawdzić w umowie",
        p: [
          "Okres wypowiedzenia i to, czy umowa jest na czas określony. Przy czasie określonym nie wypowiesz jej bez powodu wskazanego w umowie.",
          "Wysokość kaucji i to, czy faktycznie została wpłacona oraz komu zostanie zwrócona.",
          "Zapisy o podwyżkach czynszu i o tym, kto płaci za media i fundusz remontowy.",
          "Protokół zdawczy: jego brak oznacza, że przy końcu najmu nie udowodnisz, w jakim stanie było mieszkanie.",
        ],
      },
      {
        h: "Jak liczyć rentowność",
        p: [
          "Od rocznego czynszu odejmij czynsz administracyjny, podatek, ubezpieczenie, koszt drobnych napraw i przynajmniej jeden miesiąc pustostanu. Dopiero ta liczba podzielona przez cenę zakupu to realna stopa zwrotu.",
        ],
      },
    ],
  },
];

/* ───────── opinie, portale i pytania ───────── */

export type DemoReview = { text: string; who: string; what: string; initials: string };

export const DEMO_REVIEWS: DemoReview[] = [
  { text: "Sprzedali mieszkanie po mamie w trzy tygodnie, a ja mieszkam w Anglii i wszystko poszło zdalnie. Dostawałem raport co tydzień, bez dopytywania.", who: "Tomasz K.", what: "sprzedaż mieszkania, Podgórze", initials: "TK" },
  { text: "Pierwszy raz kupowaliśmy nieruchomość. Agent wytłumaczył każdy papierek dwa razy i ani razu nie dał odczuć, że pytamy o oczywistości.", who: "Ewelina i Michał", what: "zakup mieszkania, Bronowice", initials: "EM" },
  { text: "Wynajmuję dwa mieszkania i po roku współpracy nie pamiętam, kiedy ostatnio sam odbierałem telefon od najemcy.", who: "Piotr W.", what: "obsługa najmu, Grzegórzki", initials: "PW" },
  { text: "Cena wyjściowa była o 40 tysięcy wyższa, niż sam bym ustawił, a mieszkanie sprzedało się w miesiąc. Do dziś się zastanawiam, jak to policzyli.", who: "Andrzej M.", what: "sprzedaż mieszkania, Stare Miasto", initials: "AM" },
  { text: "Znaleźli nam dom poza ofertą publiczną, zanim w ogóle trafił na portale. Dokładnie to, czego szukaliśmy przez pół roku.", who: "Rodzina Nowaków", what: "zakup domu, Zielonki", initials: "RN" },
  { text: "Profesjonalne zdjęcia, rzut i film. Pierwszy raz widziałem swoje mieszkanie na ogłoszeniu i pomyślałem, że sam bym je kupił.", who: "Karolina S.", what: "sprzedaż mieszkania, Nowa Huta", initials: "KS" },
];

export const DEMO_PORTALS = [
  "Otodom",
  "OLX",
  "Nieruchomosci-online",
  "Morizon",
  "Gratka",
  "Domiporta",
  "Facebook Marketplace",
  "Google Maps",
];

export const FAQ_SPRZEDAZ: [string, string][] = [
  ["Ile kosztuje obsługa sprzedaży?", "Jedno wynagrodzenie płatne dopiero po podpisaniu aktu notarialnego. Obejmuje wycenę, sesję zdjęciową, rzut, publikację na portalach, prezentacje, negocjacje i obsługę u notariusza. Nie ma dopłat po drodze."],
  ["Czy muszę podpisywać umowę na wyłączność?", "Nie musisz, ale przy wyłączności bierzemy na siebie koszty marketingu i pokazujemy ofertę także innym biurom w systemie wymiany. Statystycznie kończy się to wyższą ceną, bo kupujący konkurują ze sobą zamiast z innymi ogłoszeniami tej samej nieruchomości."],
  ["Jak ustalacie cenę wyjściową?", "Na podstawie aktów notarialnych z Twojej okolicy z ostatnich dwunastu miesięcy, a nie cen z ogłoszeń. Różnica między jednym a drugim potrafi sięgać dziesięciu procent."],
  ["Co, jeśli mieszkanie jest wynajęte?", "Prowadzimy sprzedaż z najemcą w środku. Ustalamy godziny prezentacji, informujemy najemcę na piśmie i pilnujemy terminów wypowiedzenia, jeśli kupujący chce lokal pusty."],
  ["Ile trwa przygotowanie oferty?", "Jeden dzień roboczy od podpisania umowy do publikacji. Sesja zdjęciowa zwykle następnego dnia rano, bo wtedy jest najlepsze światło."],
];

export const FAQ_NAJEM: [string, string][] = [
  ["Jak sprawdzacie najemcę?", "Weryfikacja tożsamości, potwierdzenie zatrudnienia albo działalności, sprawdzenie w rejestrze dłużników i rozmowa z poprzednim wynajmującym. Właściciel dostaje komplet dokumentów przed podpisaniem."],
  ["Czy przygotowujecie umowę najmu okazjonalnego?", "Tak. Kompletujemy dokumenty, umawiamy notariusza i pilnujemy zgłoszenia do urzędu skarbowego w terminie czternastu dni."],
  ["Co z rozliczaniem mediów?", "Prowadzimy rozliczenie liczników i czynszu administracyjnego. Właściciel dostaje raz w miesiącu jedno zestawienie i jeden przelew."],
  ["Co, jeśli najemca przestanie płacić?", "Działamy od pierwszego dnia opóźnienia: kontakt, wezwanie, a przy najmie okazjonalnym procedura opuszczenia lokalu. Właściciel nie musi prowadzić tego sam."],
];

export const FAQ_ZAKUP: [string, string][] = [
  ["Czy kupujący płaci za Waszą pomoc?", "Nie. Wynagrodzenie płaci strona sprzedająca, a my reprezentujemy interes kupującego przy negocjacjach i dokumentach."],
  ["Czy pokażecie ofertę, której nie ma na portalach?", "Tak. Około jedna trzecia naszych transakcji zamyka się przed publikacją, wśród klientów z aktywnym zleceniem poszukiwania."],
  ["Pomożecie z kredytem?", "Współpracujemy z niezależnym doradcą, który porównuje oferty banków. Badanie zdolności jest bezpłatne i niezobowiązujące."],
  ["Sprawdzicie stan prawny przed zakupem?", "Zawsze. Księga wieczysta, podstawa nabycia, zaległości, uchwały wspólnoty i decyzje administracyjne. Raport dostajesz przed umową przedwstępną."],
];

/* ───────── pomocnicze ───────── */

export function pln(n: number): string {
  return new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(n) + " zł";
}

export function pricePerM2(o: DemoOffer): string {
  return new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(Math.round(o.price / o.area)) + " zł/m²";
}

export function priceLabel(o: DemoOffer): string {
  return o.deal === "wynajem" ? `${pln(o.price)}/mc` : pln(o.price);
}

export function shortPrice(o: DemoOffer): string {
  if (o.deal === "wynajem") return `${Math.round(o.price / 1000)} tys./mc`;
  if (o.price >= 1_000_000) {
    const m = o.price / 1_000_000;
    return (Number.isInteger(m) ? String(m) : m.toFixed(2).replace(".", ",")) + " mln";
  }
  return Math.round(o.price / 1000) + " tys.";
}

export const KIND_LABELS: Record<DemoKind, string> = {
  mieszkanie: "Mieszkanie",
  dom: "Dom",
  dzialka: "Działka",
  lokal: "Lokal",
  biuro: "Biuro",
};

export const DEAL_LABELS: Record<DemoDeal, string> = {
  sprzedaz: "Na sprzedaż",
  wynajem: "Na wynajem",
};

export function getOffer(id: string): DemoOffer | undefined {
  return DEMO_OFFERS.find((o) => o.id === id);
}

export function getAgent(id: string): DemoAgent {
  return DEMO_AGENTS.find((a) => a.id === id) ?? DEMO_AGENTS[0];
}

export function offerSummary(o: DemoOffer): string[] {
  return [
    `${o.area} m²`,
    o.rooms ? `${o.rooms} ${o.rooms === 1 ? "pokój" : o.rooms < 5 ? "pokoje" : "pokoi"}` : null,
    o.floor ? (o.floor === "parter" ? "parter" : `piętro ${o.floor}`) : null,
  ].filter(Boolean) as string[];
}

/** Dzielnice z ofert, do filtrów i kafelków lokalizacji. */
export function districts(): { name: string; count: number; photo: string }[] {
  const map = new Map<string, { count: number; photo: string }>();
  for (const o of DEMO_OFFERS) {
    const cur = map.get(o.district);
    if (cur) cur.count += 1;
    else map.set(o.district, { count: 1, photo: o.photos[0] });
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count);
}

/** Odmiana słowa „oferta" po liczbie (1 oferta, 2 oferty, 5 ofert, 22 oferty). */
export function plOffers(n: number): string {
  const last = n % 10;
  const twoLast = n % 100;
  if (n === 1) return "oferta";
  if (last >= 2 && last <= 4 && (twoLast < 12 || twoLast > 14)) return "oferty";
  return "ofert";
}

export function plOffersAcc(n: number): string {
  const last = n % 10;
  const twoLast = n % 100;
  if (n === 1) return "ofertę";
  if (last >= 2 && last <= 4 && (twoLast < 12 || twoLast > 14)) return "oferty";
  return "ofert";
}
