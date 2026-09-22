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

export type DemoArticle = { slug: string; title: string; lead: string; date: string; read: number; photo: string };

export const DEMO_ARTICLES: DemoArticle[] = [
  {
    slug: "ile-trwa-sprzedaz-mieszkania-w-krakowie",
    title: "Ile naprawdę trwa sprzedaż mieszkania w Krakowie",
    lead: "Mediana z naszych 128 transakcji z zeszłego roku, w rozbiciu na dzielnice i przedziały cenowe.",
    date: "12 marca 2026",
    read: 6,
    photo: "/wzory/miasto-noc.jpg",
  },
  {
    slug: "co-sprawdzic-przed-podpisaniem-umowy-przedwstepnej",
    title: "Co sprawdzić przed podpisaniem umowy przedwstępnej",
    lead: "Księga wieczysta to dopiero początek. Lista dziewięciu rzeczy, które sprawdzamy przy każdej transakcji.",
    date: "27 lutego 2026",
    read: 8,
    photo: "/wzory/schody.jpg",
  },
  {
    slug: "swiadectwo-energetyczne-bez-nerwow",
    title: "Świadectwo energetyczne bez nerwów",
    lead: "Kiedy jest obowiązkowe, ile kosztuje i dlaczego warto je zrobić przed pierwszą prezentacją.",
    date: "9 lutego 2026",
    read: 4,
    photo: "/wzory/szklo.jpg",
  },
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
