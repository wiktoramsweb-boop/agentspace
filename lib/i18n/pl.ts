import { SITE_ADDON } from "@/lib/site/addon";

/**
 * Polska wersja tekstów strony marketingowej.
 *
 * To jest źródło prawdy: kształt tego obiektu wyznacza typ `Dict`, więc
 * angielski słownik musi mieć dokładnie te same klucze. Dopisujesz tekst po
 * polsku, TypeScript sam upomni się o angielski odpowiednik.
 *
 * Nagłówki z akcentem trzymamy jako `{ a, b }` - `b` dostaje gradient.
 */
export const pl = {
  nav: {
    links: [
      { href: "/#moduly", label: "Produkt" },
      { href: "/wzory", label: "Strony www" },
      { href: "/integracje", label: "Integracje" },
      { href: "/cennik", label: "Cennik" },
      { href: "/blog", label: "Blog" },
      { href: "/o-nas", label: "O nas" },
    ],
    login: "Zaloguj",
    loginLong: "Zaloguj się",
    cta: "Umów rozmowę",
    menu: "Menu",
    closeMenu: "Zamknij menu",
    language: "Język",
  },

  footer: {
    tagline: "Polski system operacyjny dla biur nieruchomości. Zbudowany w działającym biurze w Krakowie.",
    madeIn: { before: "Powstaje w biurze ", company: "Spectra Nieruchomości", after: ", Kraków" },
    sections: [
      {
        title: "Produkt",
        links: [
          { href: "/", label: "Strona główna" },
          { href: "/cennik", label: "Cennik" },
          { href: "/demo", label: "Demo" },
          { href: "/dla-agentow", label: "Dla agentów" },
          { href: "/dla-wlascicieli", label: "Dla właścicieli biur" },
        ],
      },
      {
        title: "Wiedza",
        links: [
          { href: "/blog", label: "Blog" },
          { href: "/o-nas", label: "O AgentSpace" },
          { href: "/kontakt", label: "Kontakt" },
        ],
      },
      {
        title: "Prawne",
        links: [
          { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
          { href: "/regulamin", label: "Regulamin" },
        ],
      },
    ],
    operator: "Operator:",
    contact: "Kontakt:",
  },

  common: {
    bookCall: "Umów rozmowę",
    seeModule: "Zobacz moduł",
    priceSuffix: "zł / mc",
    from: "od",
  },

  home: {
    meta: {
      title: "AgentSpace | System operacyjny dla biura nieruchomości",
      description:
        "Jedno miejsce pracy całego biura: CRM klientów, wspólna baza nieruchomości, cele i lejek sprzedaży, rozliczanie prowizji, AI Coach do treningu rozmów i panel właściciela. Polski produkt, działa od pierwszego dnia.",
    },
    hero: {
      eyebrow: "Dla biur nieruchomości w Polsce",
      title: { a: "Całe biuro ", b: "w jednym miejscu" },
      lead: {
        a: "Klienci, oferty, cele, prowizje i strona internetowa biura. Agenci pracują w jednym systemie, a Ty ",
        strong: "pierwszy raz widzisz biuro w liczbach",
        b: ".",
      },
      ctaPrimary: "Umów rozmowę",
      ctaGhost: "Zobacz, jak to wygląda",
      note: "Wdrożenie w jeden dzień · Bez umowy na czas określony · Polski produkt",
      facts: [
        { value: 6, suffix: "", label: "modułów w jednym systemie" },
        { value: 1, suffix: " dzień", label: "wdrożenia razem z importem bazy" },
        { value: 30, suffix: " dni", label: "do pierwszych wniosków z danych" },
      ],
    },
    marquee: ["Klienci", "Nieruchomości", "Cele", "Prowizje", "Kalendarz", "Dokumenty", "AI Coach", "Strona www"],
    values: {
      eyebrow: "Po co to biuru",
      title: { a: "Trzy rzeczy, które zmieniają się ", b: "od pierwszego miesiąca" },
      items: [
        {
          title: "Więcej domkniętych transakcji",
          body: "Żaden lead nie ginie w Excelu ani w telefonie agenta. Follow-upy przypominają się same, a agent wie codziennie, co jest dziś najważniejsze.",
        },
        {
          title: "Mniej chaosu w biurze",
          body: "Klienci, nieruchomości, zadania, prowizje i dokumenty w jednym miejscu. Koniec z bazą rozrzuconą po arkuszach, WhatsAppie i notesach.",
        },
        {
          title: "Widzisz, kto naprawdę pracuje",
          body: "Cele dzienne, realizacja lejka i ranking zespołu liczone z prawdziwych danych. Decydujesz na liczbach, nie na przeczuciu.",
        },
      ],
    },
    modules: {
      eyebrow: "Moduły",
      title: { a: "Sześć modułów, ", b: "jeden system" },
      lead: "Nie musisz wdrażać wszystkiego naraz. Większość biur zaczyna od CRM i celów, resztę włącza w kolejnych tygodniach.",
      items: [
        {
          slug: "crm",
          name: "CRM klientów",
          body: "Karty klientów z historią, notatkami i pipeline. Osobne typy: sprzedający, kupujący, wynajmujący, najemca. Baza zostaje w biurze, nie w telefonie agenta.",
        },
        {
          slug: "nieruchomosci",
          name: "Wspólna baza nieruchomości",
          body: "Oferty widoczne dla całego zespołu, ze zdjęciami i statusem. Agent od kupującego widzi, co ma kolega od sprzedającego.",
        },
        {
          slug: "cele",
          name: "Cele i lejek sprzedaży",
          body: "Cel roczny rozbity na dzienny: telefony → spotkania → umowy → sprzedaże. Dzienny tracker, plan tygodnia i historia realizacji.",
        },
        {
          slug: "prowizje",
          name: "Prowizje i transakcje",
          body: "Karta transakcji z pięcioma etapami i dokumentami. Prowizje liczą się same, cel miesięczny widać na bieżąco. Umowa rezerwacyjna generuje się do PDF.",
        },
        {
          slug: "ai-coach",
          name: "AI Coach",
          body: "Agent trenuje rozmowy z klientem AI: cold call, spotkanie pozyskowe, najem. 13 scenariuszy, 9 osobowości klienta, głos, scoring i feedback po polsku.",
        },
        {
          slug: "panel-wlasciciela",
          name: "Panel właściciela",
          body: "Ranking, mocne i słabe obszary zespołu, prowizje per agent, drill-down do pojedynczej osoby. Raport miesięczny przychodzi na e-mail.",
        },
      ],
    },
    inside: {
      eyebrow: "Tak to wygląda w środku",
      title: "Cały dzień biura w jednym systemie",
      lead: "Od porannego planu, przez oferty i prezentacje, po prowizje i dokumenty u notariusza. Poniżej osiem ekranów, z których zespół korzysta codziennie. Kliknij, żeby zobaczyć każdy z nich.",
      tabs: [
        {
          key: "pulpit",
          label: "Pulpit agenta",
          note: "Cele dnia, zadania i prowizja w jednym widoku. Agent wie, co ma zrobić dziś, zanim wypije kawę.",
        },
        {
          key: "nieruchomosci",
          label: "Oferty",
          note: "Wspólna baza ofert ze zdjęciami po obróbce i znakiem wodnym biura. Jedno zaznaczenie publikuje ofertę na stronie biura i na portalach.",
        },
        {
          key: "klienci",
          label: "Karta klienta",
          note: "Cała historia kontaktu w jednym miejscu: telefony, prezentacje i ustalenia. Kolejna rozmowa dopina się do tej samej historii, zamiast tworzyć drugi kontakt.",
        },
        {
          key: "cele",
          label: "Cele",
          note: "Cel roczny rozbity aż do dziennego: telefony, rozmowy, spotkania, umowy. Agent widzi, ile mu zostało dziś, a nie w abstrakcyjnym kwartale.",
        },
        {
          key: "kalendarz",
          label: "Kalendarz",
          note: "Spotkania, prezentacje i telefony w jednym widoku, razem z rytmem dnia: o której zespół faktycznie dzwoni i kiedy odbiera najwięcej osób.",
        },
        {
          key: "prowizje",
          label: "Transakcje",
          note: "Pięć etapów transakcji, komplet dokumentów i prowizja licząca się sama, razem z podziałem między agentów.",
        },
        {
          key: "dokumenty",
          label: "Dokumenty",
          note: "Umowy, odpisy i świadectwa leżą przy ofercie i przy kliencie naraz. Linki do pobrania wygasają, więc nie krążą po WhatsAppie.",
        },
        {
          key: "zespol",
          label: "Panel właściciela",
          note: "Prowizje, telefony i oferty w rozbiciu na ludzi. System sam podpowiada, kto wymaga rozmowy, zanim zrobi się problem.",
        },
      ],
    },
    field: {
      eyebrow: "Dzień w biurze",
      title: { a: "Robota dzieje się ", b: "w terenie", c: ", nie w tabelkach" },
      lead: "System ma być z boku, a nie zamiast pracy. Dlatego wszystko, co agent robi w ciągu dnia, zapisuje się jednym kliknięciem z telefonu.",
      tiles: [
        {
          alt: "Kamienica w centrum",
          title: "Pozyskanie",
          body: "Telefon do właściciela zapisuje się jako kontakt i od razu liczy do celu dziennego. Kolejna rozmowa z tym numerem dopina się do tej samej historii.",
        },
        {
          alt: "Salon w mieszkaniu",
          title: "Prezentacja",
          body: "Zdjęcia z sesji wrzucasz z telefonu, a system sam dokłada znak wodny biura i wysyła ofertę na stronę oraz na portale.",
        },
        {
          alt: "Klatka schodowa",
          title: "Transakcja",
          body: "Umowa, zaświadczenia i prowizja w jednym miejscu. Rozliczenie z agentem liczy się samo, razem z podziałem i podatkiem.",
        },
      ],
    },
    steps: {
      eyebrow: "Krok po kroku",
      title: { a: "Od rozmowy do pierwszych wniosków - ", b: "30 dni" },
      items: [
        {
          n: "01",
          title: "Rozmowa i audyt biura",
          body: "30 minut. Sprawdzamy, jak dziś wygląda obieg leada w Twoim biurze i gdzie realnie tracisz transakcje. Dostajesz wnioski niezależnie od tego, czy zaczniemy współpracę.",
        },
        {
          n: "02",
          title: "Wdrożenie w jeden dzień",
          body: "Zakładamy konto biura, wgrywamy bazę klientów i nieruchomości, zapraszamy agentów. Konfigurujemy cele i lejek pod Twój model pracy. Bez instalacji, bez działu IT.",
        },
        {
          n: "03",
          title: "Pierwsze wnioski w 30 dni",
          body: "Po miesiącu masz komplet danych: kto realizuje cele, gdzie zespół traci leady, jak wyglądają rozmowy. Od tego momentu zarządzasz liczbami, nie wrażeniem.",
        },
      ],
    },
    problems: {
      eyebrow: "Znasz to",
      title: { a: "Trzy rzeczy, które kosztują biuro ", b: "najwięcej" },
      lead: "Żadnej z nich nie widać w rachunku wyników. Wszystkie widać w liczbie transakcji.",
      items: [
        {
          title: "Baza biura jest w telefonach agentów",
          body: "Agent odchodzi i zabiera ze sobą kontakty, historię rozmów i relacje. Zostaje Ci arkusz, który nikt nie uzupełniał od pół roku.",
        },
        {
          title: "Nie wiesz, co się dzieje między odprawami",
          body: "Wiesz, ile było transakcji. Nie wiesz, ile było telefonów, ile spotkań i który agent utknął dwa tygodnie temu - dopóki nie jest za późno.",
        },
        {
          title: "Nowy agent uczy się na Twoich klientach",
          body: "Pierwsze rozmowy nowej osoby to spalone leady. Bez miejsca do trenowania każdy błąd kosztuje realną prowizję.",
        },
      ],
    },
    compare: {
      eyebrow: "Porównanie",
      title: { a: "Ten sam dzień w biurze, ", b: "dwa scenariusze" },
      withLabel: "Z AgentSpace",
      withoutLabel: "Bez systemu",
      rows: [
        { label: "Baza klientów", with: "Jedna wspólna karta klienta z historią i notatkami", without: "Excel, notes, WhatsApp i głowa agenta" },
        { label: "Kontakt do właściciela", with: "Wpisany w system, zostaje w biurze", without: "W telefonie agenta - odchodzi razem z nim" },
        { label: "Wiesz co robi zespół", with: "Ranking, cele dzienne, realizacja lejka", without: "Tyle, ile powie na porannej odprawie" },
        { label: "Rozliczenie prowizji", with: "Liczy się samo z transakcji", without: "Arkusz, który ktoś musi domknąć ręcznie" },
        { label: "Nowy agent", with: "Trenuje na AI od pierwszego dnia", without: "Uczy się na prawdziwych klientach" },
        { label: "Raport miesięczny", with: "Przychodzi na e-mail 1. dnia miesiąca", without: "Robisz go sam w niedzielę wieczorem" },
      ],
    },
    onboarding: {
      eyebrow: "Wdrożenie",
      title: { a: "Zaczynacie pracę ", b: "następnego dnia" },
      body: "Wdrożenie prowadzimy sami, od początku do końca. Importujemy bazę klientów i ofert, ustawiamy cele oraz podział prowizji pod Wasz model i szkolimy zespół na Waszych danych.",
      items: [
        "Import bazy klientów i ofert z obecnego systemu",
        "Szkolenie zespołu na Waszych danych, nie na przykładach",
        "Opiekun, który odbiera telefon, a nie system zgłoszeń",
        "Cena zamrożona na 24 miesiące przy umowie rocznej",
      ],
      cta: "Umów wdrożenie",
    },
    manifest: {
      eyebrow: "Po ludzku",
      text: "Nie sprzedajemy oprogramowania. Sprzedajemy spokojniejszy poniedziałek: wiesz, kto do kogo dzwoni, która oferta stoi i skąd realnie biorą się transakcje w Twoim biurze.",
      points: [
        { title: "Polski produkt", body: "Piszemy go w Krakowie, dla polskich biur i polskich umów." },
        { title: "Człowiek odbiera", body: "Piszesz do mnie, nie do systemu zgłoszeń. Odpowiadam tego samego dnia." },
        { title: "Zero lock-inu", body: "Twoje dane eksportujesz do Excela w każdej chwili, bez proszenia." },
      ],
      photos: [
        { alt: "Wnętrze mieszkania", caption: "Prezentacja, Podgórze" },
        { alt: "Dom", caption: "Odbiór kluczy" },
        { alt: "Taras", caption: "Sesja zdjęciowa" },
      ],
    },
    origin: {
      eyebrow: "Skąd to się wzięło",
      title: "System napisany w biurze nieruchomości",
      quote: {
        a: "Prowadzę biuro nieruchomości ",
        company: "Spectra",
        b: " w Krakowie. Znam ten moment, w którym dobry agent odchodzi i zabiera ze sobą pół bazy - i wiem, ile to kosztuje biuro. ",
        accent: "AgentSpace to system, którego sam potrzebowałem od lat.",
        c: " Buduję go dla swojego biura i udostępniam biurom, które mierzą się z tym samym.",
      },
      author: "Wiktor Szostek",
      role: "Założyciel · Spectra Nieruchomości, Kraków",
    },
    sites: {
      eyebrow: "Dodatek",
      title: { a: "Strona biura, która ", b: "sama się aktualizuje" },
      lead: `Osiem gotowych wzorów. Oferta dodana w systemie jest na stronie w tej samej minucie, a zapytanie ze strony wraca do CRM jako kontakt i zadanie dla agenta. Osobna usługa, ${SITE_ADDON.monthly} zł miesięcznie.`,
      cta: "Zobacz wszystkie osiem wzorów",
      priceLink: "Ile to kosztuje",
    },
    pricing: {
      eyebrow: "Cennik",
      title: { a: "Płacisz za wielkość biura, ", b: "nie za moduły" },
      lead: "Każdy pakiet zawiera komplet funkcji ze swojego poziomu. Bez dopłat za użytkownika w trakcie miesiąca.",
    },
    notFor: {
      eyebrow: "Szczerze",
      title: "AgentSpace nie jest dla każdego biura",
      lead: "Lepiej powiedzieć to teraz niż po trzech miesiącach.",
      items: [
        {
          title: "Pracujesz solo lub we dwójkę",
          body: "Ranking, panel właściciela i raporty zespołowe nie mają wtedy sensu. Zapłacisz za funkcje, których nie użyjesz.",
        },
        {
          title: "Nie chcesz prowadzić zespołu",
          body: "AgentSpace pokazuje dane i daje narzędzia, ale nie zarządza za Ciebie. Jeśli nikt nie spojrzy w panel raz w tygodniu i nie porozmawia z agentem, który słabnie - żaden system tego nie naprawi.",
        },
        {
          title: "Szukasz portalu z eksportem ofert",
          body: "Nie jesteśmy systemem do masowego wystawiania na portale. Eksport do OtoDom jest na mapie drogowej, ale dziś AgentSpace jest systemem pracy biura, nie wystawiarką ogłoszeń.",
        },
      ],
    },
    faq: {
      eyebrow: "Pytania",
      title: "Najczęściej pytają o to",
      items: [
        {
          question: "Czy AgentSpace działa już dziś?",
          answer:
            "Tak. System działa na produkcji i jest codziennie używany w biurach nieruchomości, między innymi w Spectrze w Krakowie, gdzie powstaje. Wdrożenie nowego biura zajmuje jeden dzień roboczy.",
        },
        {
          question: "Czy AgentSpace zastąpi mój obecny system?",
          answer:
            "W większości biur tak - AgentSpace obejmuje CRM klientów, wspólną bazę nieruchomości, cele, prowizje, zadania i dokumenty. Jeśli korzystasz z systemu do masowego eksportu ofert na portale, na razie warto zostawić go obok. Na rozmowie sprawdzamy to konkretnie na Twoim przypadku.",
        },
        {
          question: "Ile trwa wdrożenie i kto je robi?",
          answer:
            "Jeden dzień roboczy. Zakładamy konto, wgrywamy bazę klientów i nieruchomości, zapraszamy agentów i konfigurujemy cele pod Twój model pracy. Robimy to razem z Tobą - nie zostawiamy Cię z pustym systemem.",
        },
        {
          question: "Czy agenci to zaakceptują?",
          answer:
            "Agenci przyjmują narzędzia, które im pomagają, i odrzucają te, które ich kontrolują. Dlatego AgentSpace zaczyna od tego, co daje agentowi: plan dnia, gotowe follow-upy pisane przez AI, widoczny postęp celu i trening przed trudną rozmową. Panel właściciela jest efektem ubocznym ich codziennej pracy, a nie osobnym raportowaniem.",
        },
        {
          question: "Czy musimy nagrywać rozmowy z prawdziwymi klientami?",
          answer:
            "Nie. AI Coach to symulacje - agent ćwiczy z klientem AI, nie z prawdziwym. Zero ryzyka RODO po stronie Twoich klientów. Analiza prawdziwych nagrań jest na mapie drogowej i będzie opcjonalna.",
        },
        {
          question: "Gdzie są przechowywane dane biura?",
          answer:
            "Na serwerach w Unii Europejskiej (Frankfurt). Dane Twojego biura są odseparowane od danych innych biur, a dostęp do nich mają wyłącznie zaproszeni przez Ciebie użytkownicy, zgodnie z rolą: CEO, menedżer, agent.",
        },
        {
          question: "Czy jest umowa na czas określony?",
          answer:
            "Nie. Rozliczenie miesięczne, rezygnujesz kiedy chcesz. Nie chcemy trzymać biura umową - jeśli system nie daje wartości, powinieneś móc odejść.",
        },
      ],
    },
    cta: {
      title: { a: "Gotowy ", b: "uporządkować biuro", c: "?" },
      lead: "30 minut rozmowy. Sprawdzimy, gdzie Twoje biuro traci transakcje - wnioski dostajesz niezależnie od tego, czy zaczniemy współpracę.",
      button: "Umów rozmowę",
    },
  },

  coach: {
    eyebrow: "AI Coach",
    title: { a: "Agent trenuje rozmowę, ", b: "zanim zadzwoni do klienta" },
    lead: "Klient jest sztuczny, obiekcje prawdziwe. Rozmowa idzie głosem albo tekstem, a po jej zakończeniu agent dostaje ocenę i jedną konkretną rzecz do poprawy. Bez oceniania przy całym zespole.",
    pick: "Wybierz obiekcję, którą trenujesz",
    scoreTitle: "Ocena rozmowy",
    points: [
      { title: "13 scenariuszy", body: "Cold call, pozyskanie, prezentacja, najem i negocjacja prowizji." },
      { title: "9 typów klienta", body: "Od zdawkowego po agresywnego. Każdy reaguje inaczej na ten sam argument." },
      { title: "Ocena i wskazówka", body: "Punkty za otwarcie, kwalifikację, obiekcje i domknięcie, plus jedna rzecz do poprawy." },
    ],
    scenarios: [
      {
        key: "za-drogo",
        chip: "Za wysoka prowizja",
        title: "Obiekcja cenowa",
        person: "Krzysztof, właściciel mieszkania",
        lines: [
          { who: "klient", text: "Trzy procent? Konkurencja robi to za półtora.", tag: "obiekcja cenowa" },
          { who: "agent", text: "Rozumiem. Mogę zapytać, co dokładnie jest w tych półtora procent?", tag: "" },
          { who: "klient", text: "No... ogłoszenie na portalu i tyle chyba.", tag: "" },
          { who: "agent", text: "Właśnie dlatego pytam. U nas w tej cenie jest fotograf, rzut, home staging i prowadzenie negocjacji. Ostatnie trzy mieszkania z tej ulicy sprzedaliśmy średnio 4 procent powyżej ceny wyjściowej sąsiadów.", tag: "" },
          { who: "klient", text: "Hm. A ile realnie to trwa?", tag: "sygnał zainteresowania" },
        ],
        scores: [
          { label: "Reakcja na obiekcję", value: 9 },
          { label: "Pytania otwarte", value: 8 },
          { label: "Argument z danych", value: 9 },
          { label: "Domknięcie", value: 6 },
        ],
        tip: "Dobrze, że nie broniłeś ceny od razu. Zamknij jeszcze pytaniem o termin spotkania, zanim klient sam skończy rozmowę.",
      },
      {
        key: "mam-biuro",
        chip: "Mam już biuro",
        title: "Zimny telefon",
        person: "Pani Anna, ogłoszenie z portalu",
        lines: [
          { who: "klient", text: "Dziękuję, współpracuję już z biurem.", tag: "zbycie" },
          { who: "agent", text: "Jasne, nie namawiam do zmiany. Jedno pytanie: mieszkanie wisi od sześciu tygodni, było już obniżane?", tag: "" },
          { who: "klient", text: "Raz, o dwadzieścia tysięcy. Ruchu nie ma.", tag: "" },
          { who: "agent", text: "To typowe, gdy zdjęcia nie pokazują metrażu. Mogę Pani wysłać bezpłatnie zestawienie cen transakcyjnych z Pani ulicy? Bez zobowiązań, sama Pani oceni.", tag: "" },
          { who: "klient", text: "Dobrze, proszę wysłać na maila.", tag: "zgoda na kontakt" },
        ],
        scores: [
          { label: "Otwarcie", value: 8 },
          { label: "Kwalifikacja", value: 9 },
          { label: "Obiekcje", value: 8 },
          { label: "Umówienie kroku", value: 9 },
        ],
        tip: "Świetne przejście z odmowy na konkret. Następnym razem dopytaj o termin wysyłki, żeby umówić powód do kolejnego telefonu.",
      },
      {
        key: "sam-sprzedam",
        chip: "Sprzedam sam",
        title: "Pozyskanie oferty",
        person: "Marek, ogłoszenie prywatne",
        lines: [
          { who: "klient", text: "Po co mi pośrednik? Sam sobie wystawię.", tag: "obiekcja wartości" },
          { who: "agent", text: "Może się udać. Ile telefonów odebrał Pan w tym tygodniu?", tag: "" },
          { who: "klient", text: "Ze czternaście. Połowa to biura, reszta pyta o cenę i znika.", tag: "" },
          { who: "agent", text: "Czyli traci Pan czas na rozmowy, z których nic nie wynika. My tę część bierzemy na siebie i pokazujemy mieszkanie tylko sprawdzonym kupującym. Pan pojawia się dopiero u notariusza.", tag: "" },
          { who: "klient", text: "A jak wygląda umowa?", tag: "pytanie o warunki" },
        ],
        scores: [
          { label: "Otwarcie", value: 7 },
          { label: "Zbieranie faktów", value: 9 },
          { label: "Pokazanie wartości", value: 9 },
          { label: "Domknięcie", value: 7 },
        ],
        tip: "Pytanie o liczbę telefonów zrobiło całą robotę. Przy pytaniu o umowę od razu proponuj spotkanie, zamiast tłumaczyć warunki przez telefon.",
      },
    ],
  },

  coachFlow: {
    scenarios: ["Zimny telefon", "Follow-up", "Obiekcje cenowe", "Negocjacja prowizji", "Muszę pomyśleć"],
    personalities: ["Agresywny", "Wahający", "Cenowy", "Emocjonalny", "Biznesowy"],
    scores: ["Otwarcie", "Kwalifikacja", "Obiekcje", "Zamknięcie"],
    steps: [
      { title: "Wybierz scenariusz", body: "Pięć sytuacji z codziennej pracy biura: od zimnego telefonu po negocjację prowizji." },
      { title: "Wybierz osobowość klienta", body: "AI gra klienta z konkretną postawą - od agresywnego po biznesowego." },
      { title: "Rozmawiasz głosem", body: "Mikrofon w przeglądarce. Mówisz jak do prawdziwego klienta, w naturalnym tempie." },
      { title: "AI odpowiada głosem", body: "Naturalny ton, kontruje argumenty. To nie czat z asystentem, tylko symulacja klienta." },
      { title: "Ocena i wskazówki", body: "Po sesji: wynik 1-10 w czterech kategoriach plus konkretne sugestie poprawy." },
    ],
  },

  form: {
    topics: [
      { value: "wdrozenie", label: "Chcę wdrożyć AgentSpace" },
      { value: "demo", label: "Pokażcie mi demo" },
      { value: "wspolpraca", label: "Propozycja współpracy" },
      { value: "media", label: "Kontakt mediowy" },
      { value: "inne", label: "Inny temat" },
    ],
    successTitle: "Dziękujemy!",
    successBody: "Otrzymaliśmy wiadomość. Odpowiemy w ciągu 24 godzin w dni robocze.",
    honeypot: "Zostaw puste",
    name: "Imię i nazwisko",
    namePlaceholder: "Jan Kowalski",
    email: "Adres e-mail",
    emailPlaceholder: "jan@biuro.pl",
    agency: "Nazwa biura nieruchomości",
    optional: "(opcjonalnie)",
    agencyPlaceholder: "Np. Spectra Nieruchomości",
    topic: "Temat",
    topicPlaceholder: "Wybierz temat...",
    message: "Wiadomość",
    messagePlaceholder: "W czym możemy pomóc?",
    submit: "Wyślij wiadomość",
    submitting: "Wysyłam...",
    genericError: "Coś poszło nie tak. Spróbuj za chwilę.",
    offlineError: "Brak połączenia. Sprawdź internet i spróbuj ponownie.",
    consentBefore: "Klikając wysyłam akceptujesz ",
    consentLink: "politykę prywatności",
    consentAfter: ".",
  },

  pages: {
    cennik: {
      meta: {
        title: "Cennik | AgentSpace dla biur nieruchomości",
        description:
          "Trzy pakiety: Start 499 zł, Pro 899 zł, Biuro od 1490 zł miesięcznie. Cena zależy od liczby agentów, nie od liczby modułów. Bez umowy na czas określony.",
      },
      eyebrow: "Cennik",
      title: "Płacisz za wielkość biura, nie za moduły",
      lead: "Każdy pakiet zawiera komplet funkcji ze swojego poziomu. Bez dopłat za użytkownika w trakcie miesiąca i bez umowy na czas określony.",
      addon: {
        eyebrow: "Dodatek",
        title: "Strona internetowa biura",
        lead: "Osobna usługa, poza abonamentem za system. Bierzecie ją tylko wtedy, gdy chcecie mieć stronę połączoną z bazą ofert. Jeśli macie już własną, system działa bez zmian.",
        includes: [
          { title: "Osiem wzorów do wyboru", body: "Każdy z kompletem podstron: oferty, zespół, poradnik, kalkulator, formularze." },
          { title: "Oferty prosto z CRM", body: "Zaznaczasz ofertę w systemie i jest na stronie. Bez przepisywania i bez wgrywania zdjęć drugi raz." },
          { title: "Zapytania wracają do CRM", body: "Formularz ze strony tworzy kontakt i zadanie dla agenta, zamiast maila, który ginie." },
          { title: "Własna domena i SEO", body: "Podpinamy Waszą domenę, mapę strony i dane strukturalne pod Google. Certyfikat i kopie po naszej stronie." },
        ],
        subscription: "Abonament",
        perMonth: "/mc",
        yearNote: "albo {yearly} zł za rok, czyli dwa miesiące gratis",
        setupNote:
          "Wdrożenie {setup} zł jednorazowo: przeniesienie treści, zdjęcia, podpięcie Waszej domeny i ustawienie wszystkiego pod biuro. Hosting, certyfikat i kopie w abonamencie.",
        ctaTemplates: "Zobacz osiem wzorów",
        ctaPreview: "Zamów podgląd na swoich ofertach",
      },
      faq: {
        eyebrow: "Pytania o rozliczenia",
        title: "Zanim zapytasz",
        items: [
          {
            q: "Co się dzieje, gdy zatrudnię kolejnego agenta?",
            a: "Nic w trakcie miesiąca - nie doliczamy opłat za użytkownika. Jeśli zespół przekroczy limit pakietu na stałe, przy kolejnym rozliczeniu przechodzimy na wyższy pakiet. Odzywamy się wcześniej, nie robimy tego po cichu.",
          },
          {
            q: "Czy jest okres próbny?",
            a: "Zamiast klasycznego triala robimy wdrożenie pilotażowe: pierwszy miesiąc pracujemy razem na Twoich danych. Jeśli po nim uznasz, że system nie daje wartości - kończymy bez faktury za kolejny okres.",
          },
          {
            q: "Czy mogę zapłacić za rok z góry?",
            a: "Tak, przy rozliczeniu rocznym dwa miesiące są gratis, a cena jest zamrożona na 24 miesiące.",
          },
          {
            q: "Czy są koszty wdrożenia?",
            a: "W pakietach Start i Pro nie ma opłaty wdrożeniowej. W pakiecie Biuro wdrożenie 1:1 i szkolenie zespołu wyceniamy indywidualnie, w zależności od liczby oddziałów.",
          },
          {
            q: "Czy strona internetowa jest w cenie systemu?",
            a: "Nie. Strona www to osobna usługa za {monthly} zł miesięcznie plus jednorazowe wdrożenie {setup} zł. System działa bez niej normalnie, a jeśli macie już własną stronę, nic nie musicie zmieniać.",
          },
          {
            q: "Co z danymi, jeśli zrezygnuję?",
            a: "Eksportujemy całą bazę klientów, nieruchomości i transakcji do plików, które otworzysz w Excelu. Dane są Twoje - nie trzymamy biura zakładnikiem bazy.",
          },
        ],
      },
      cta: { title: "Nie wiesz, który pakiet?", lead: "Napisz, ilu masz agentów i jak dziś pracujecie. Powiem wprost, czy AgentSpace ma u Ciebie sens.", button: "Umów rozmowę" },
    },

    onas: {
      meta: {
        title: "O AgentSpace | Polski system dla biur nieruchomości",
        description: "Kto i po co zbudował AgentSpace. System dla biur nieruchomości, napisany w działającym biurze w Krakowie.",
      },
      hero: {
        eyebrow: "O AgentSpace",
        title: "Polski produkt dla polskich biur - bez kompromisów",
        description:
          "AgentSpace nie jest kolejnym SaaS-em „dla nieruchomości” tłumaczonym z angielskiego. Jest budowany w Krakowie, dla biur w Polsce, przez kogoś kto na co dzień prowadzi biuro nieruchomości i wie, co konkretnie boli.",
        photoAlt: "Kraków nocą",
        photoCaption: "Kraków, nasze podwórko",
      },
      founderLabel: "Founder",
      founderName: "Wiktor Szostek",
      founderParagraphs: [
        "Prowadzę biuro nieruchomości Spectra w Krakowie. Codziennie pracuję z agentami, klientami sprzedającymi, kupującymi, doradcami kredytowymi, prawnikami. Widzę dokładnie to, czego nie widać ze świata software house’ów: ile czasu agent traci, jak wygląda zła rozmowa z klientem, gdzie pęka konwersja.",
        "Przez ostatnie lata próbowałem różnych rozwiązań - szkolenia stacjonarne, mentoring, książki, podcasty. Większość kosztuje, mało co rzeczywiście zmienia codzienność agenta. Najlepsi w branży uczą się w bólu, przez setki spalonych leadów. Najsłabsi odchodzą po sześciu miesiącach.",
        "AgentSpace to system, którego sam potrzebowałem od dawna. Buduję go dla mojego biura - i otwieram go dla innych biur, które mają ten sam problem.",
      ],
      principles: {
        eyebrow: "Filozofia produktu",
        title: "Cztery rzeczy, w które wierzymy",
        items: [
          { number: "01", title: "Polski produkt, polski język", body: "Nie tłumaczymy z angielskiego. Skrypty, scenariusze, obiekcje, feedback - wszystko po polsku, z polską specyfiką. Bo Twój klient nie mówi „I’d like to make an offer”." },
          { number: "02", title: "Codzienność > eventy", body: "Lepsze 15 minut treningu dziennie niż 4-godzinne szkolenie raz na kwartał. Mózg uczy się przez powtarzanie, nie przez intensywność." },
          { number: "03", title: "Dane > intuicja", body: "Decyzje o rozwoju zespołu mają być oparte o liczby - kto rośnie, gdzie są luki. Nie o przeczucia, kto „wygląda na obiecującego”." },
          { number: "04", title: "Najpierw rynek, potem kod", body: "Każda funkcja jest najpierw sprawdzana w działającym biurze. Jeśli nie pomaga agentom w codziennej pracy, nie wchodzi do produktu." },
        ],
      },
      roadmap: {
        eyebrow: "Co dalej",
        title: "Roadmap najbliższych 12 miesięcy",
        items: [
          { period: "Działa dziś", title: "CRM, oferty, cele i prowizje", body: "Wspólna baza klientów i nieruchomości, lejek celów od rocznego do dziennego, rozliczanie prowizji i panel właściciela." },
          { period: "Działa dziś", title: "AI Coach i strony www biur", body: "Trening rozmów z klientem AI w trzech kategoriach oraz strona internetowa biura połączona z bazą ofert." },
          { period: "W drodze", title: "Synchronizacja z kalendarzem Google", body: "Plan dnia agenta zgrany ze spotkaniami w obie strony, bez przepisywania terminów." },
          { period: "W drodze", title: "Eksport na portale i import z systemów ofertowych", body: "Jedno kliknięcie zamiast wklejania tej samej oferty w pięciu miejscach." },
        ],
      },
      cta: { title: "Porozmawiajmy o Waszym biurze", lead: "Pokażemy system na Waszych danych i powiemy wprost, czy ma u Was sens. Wdrożenie zajmuje jeden dzień roboczy.", button: "Umów rozmowę →" },
    },

    kontakt: {
      meta: {
        title: "Kontakt | AgentSpace",
        description: "Skontaktuj się z zespołem AgentSpace. Pytania o system dla biura nieruchomości, AI Coach, wdrożenie. Odpowiadamy w 24h.",
      },
      hero: {
        eyebrow: "Kontakt",
        title: "Porozmawiajmy o Twoim biurze",
        description: "Pytanie o AgentSpace, prośba o demo, współpraca? Napisz - odpowiadamy w 24h w dni robocze.",
        photoAlt: "Dziedziniec kamienicy",
        photoCaption: "Odpowiadamy w 24 godziny",
      },
      topics: [
        { title: "Wdrożenie", body: "Chcesz wiedzieć, jak wygląda uruchomienie systemu w Twoim biurze?", cta: "Wybierz w formularzu temat „Wdrożenie”" },
        { title: "Demo", body: "Pokażemy konkretnie, jak AgentSpace zadziała u Was - 30 min.", cta: "Wybierz w formularzu temat „Demo”" },
        { title: "Inne", body: "Współpraca, media, pomysł, krytyka - wszystko czytamy.", cta: "Napisz po prostu - odpowiemy" },
      ],
      findUs: "Jak nas znaleźć",
      labelEmail: "Email",
      labelAddress: "Adres",
      labelResponse: "Czas odpowiedzi",
      responseTime: "do 24h w dni robocze",
      operatorTitle: "Operator AgentSpace",
      founderLabel: "Founder:",
      formTitle: "Napisz do nas",
    },

    demo: {
      meta: {
        title: "Demo AgentSpace | Zobacz, jak działa system",
        description: "Demo platformy AgentSpace: AI Coach do treningu rozmów, pulpit agenta, panel właściciela biura. Interaktywne makiety i pełny przebieg sesji treningowej.",
      },
      hero: {
        eyebrow: "Demo",
        title: "Zobacz, jak wygląda AgentSpace od środka",
        description: "Główne ekrany systemu. Chcesz zobaczyć go na żywo, na danych swojego biura - umów rozmowę.",
        photoAlt: "Nowoczesny budynek",
        photoCaption: "Zobacz system na żywo",
      },
      screens: [
        { eyebrow: "Ekran 1", title: "AI Coach w działaniu", body: "Agent wybiera scenariusz, wybiera osobowość klienta, klika start. Mikrofon się aktywuje, AI mówi pierwsze zdanie po polsku. Rozmowa toczy się jak prawdziwa - z przerwami, obiekcjami, zaskakującymi pytaniami." },
        { eyebrow: "Ekran 2", title: "Codzienny pulpit agenta", body: "Każdy agent ma własne miejsce pracy. Plan dnia, tracking prowizji, statystyki, ranking w biurze. Mniej Excela, więcej skupienia na zamknięciach." },
        { eyebrow: "Ekran 3", title: "Panel właściciela: pełen obraz zespołu", body: "Średni wynik sesji, ranking agentów, najsłabsze obszary zespołu, alerty (na przykład agent, który nie trenuje). Decyzje oparte o dane, nie przeczucia." },
      ],
      flowEyebrow: "Pełen przebieg",
      flowTitle: "Jak wygląda jedna sesja treningowa krok po kroku",
      cta: { title: "Chcesz zobaczyć demo na żywo w swoim biurze?", lead: "Zaplanuj 30-minutową rozmowę. Pokażemy konkretnie, jak AgentSpace zadziała u Was.", primary: "Umów rozmowę", secondary: "Napisz po demo" },
    },

    agenci: {
      meta: {
        title: "Dla agentów nieruchomości | Co zyskasz z AgentSpace",
        description: "AgentSpace z perspektywy agenta nieruchomości. Trening rozmów z AI, plan dnia, tracking prowizji, ranking. Mniej stresu, więcej zamknięć, wyższa prowizja.",
      },
      hero: {
        eyebrow: "Dla agentów nieruchomości",
        title: "Mniej stresu, więcej zamknięć, wyższa prowizja",
        description: "AgentSpace to nie kolejny system kontroli „dla szefa”. To Twoje codzienne narzędzie - żeby ćwiczyć trudne rozmowy bez ryzyka, widzieć swój postęp, zarabiać więcej.",
        photoAlt: "Wnętrze mieszkania",
        photoCaption: "Prezentacja oferty",
      },
      benefitsTitle: "Co konkretnie zyskasz",
      benefits: [
        { title: "Ćwicz najtrudniejsze rozmowy bez ryzyka", body: "Nie musisz uczyć się na prawdziwych klientach. AI Coach gra klienta z różnymi osobowościami. Po sesji wiesz dokładnie, co poprawić. Po 30 dniach Twoje rozmowy z prawdziwymi klientami są pewniejsze, krótsze, skuteczniejsze." },
        { title: "15 minut dziennie zamiast szkolenia raz na kwartał", body: "Mózg uczy się przez powtarzanie. 15 minut treningu codziennie przez miesiąc to 7,5 godziny wprawki - i każdą z nich pamiętasz. Warsztat raz na kwartał zapomnisz w dwa tygodnie." },
        { title: "Konkretny feedback, nie „ogólnie nieźle”", body: "Po każdej sesji ocena 1-10 w czterech kategoriach (otwarcie, kwalifikacja, obsługa obiekcji, zamknięcie) plus dwie, trzy konkretne wskazówki: „nie zapytałeś o termin”, „za wcześnie zaproponowałeś prowizję”." },
        { title: "Plan dnia i tracking prowizji zamiast Excela", body: "Codzienne miejsce pracy: lista zadań, statystyki dnia, postęp do celu miesięcznego, prowizja na bieżąco. Wszystko w jednym, nie w siedmiu zakładkach." },
        { title: "Widzisz, że rośniesz", body: "Po 30 dniach widzisz swoją krzywą: wyniki sesji, zamknięcia, prowizja. Konkretne dane, nie „czuję, że jest lepiej”. To motywuje i ułatwia rozmowy o awansie." },
      ],
      faqTitle: "Pytania, które agenci zadają najczęściej",
      faq: [
        { q: "Czy mój szef będzie widział, ile zarabiam i ile rozmów odbyłem?", a: "Tak, w zakresie wyników biura. Ale to działa w obie strony: lepsze wyniki to silniejsza pozycja do negocjacji prowizji, awansu i lepszych leadów. Najlepsi agenci lubią widoczność, bo z nią wygrywają." },
        { q: "Czy muszę nagrywać prawdziwych klientów?", a: "Nie. AI Coach to symulacje z klientem AI, nie nagrywanie prawdziwych rozmów. Pełna prywatność." },
        { q: "Ile to mi zajmie dziennie?", a: "15 minut. W aucie między prezentacjami, w biurze przed pierwszym telefonem, w domu po pracy. Wybierz moment, który Ci pasuje." },
        { q: "Co jeśli słabo idzie? Czy szef zobaczy moją porażkę?", a: "Szef widzi Twoje wyniki w zespole - średni wynik, liczbę sesji, trend. Nie widzi treści Twoich rozmów ani konkretnych pomyłek. Sesje są prywatne." },
      ],
      cta: { title: "Powiedz szefowi o AgentSpace", lead: "Jeśli pracujesz w biurze, które chciałbyś, żeby wdrożyło AgentSpace - wyślij szefowi link do strony.", button: "Umów rozmowę →" },
    },

    wlasciciele: {
      meta: {
        title: "Dla właścicieli biur nieruchomości | AgentSpace",
        description: "AgentSpace dla właścicieli biur nieruchomości. Niższa rotacja agentów, szybszy onboarding, decyzje oparte o dane. Pakiety od 499 zł/mc.",
      },
      hero: {
        eyebrow: "Dla właścicieli biur nieruchomości",
        title: "Zespół który rośnie. Niższa rotacja. Decyzje oparte o dane.",
        description: "AgentSpace nie jest kolejnym CRM. To system rozwoju zespołu - codzienny dryl, tracking, ranking. Robione przez właściciela biura w Krakowie, dla właścicieli biur w Polsce.",
        photoAlt: "Budynek mieszkalny",
        photoCaption: "Biuro w liczbach, nie w przeczuciach",
      },
      problemsTitle: "Co Cię prawdopodobnie dziś boli",
      problems: [
        { stat: "60%", title: "agentów odpada w 6 mc", body: "Bez systemu szkolenia: chaotyczny start, brak feedbacku. Najlepsi odchodzą, słabi nie wiedzą czego im brakuje. Koszt: 15-30 tys. zł na nieudanego agenta." },
        { stat: "8h", title: "tygodniowo na mentoring 1-na-1", body: "Mentorowanie kosztuje czas. Senior agenci nie chcą tego robić - chcą sprzedawać. Wewnętrzne szkolenia raz na kwartał to za rzadko, żeby zmienić nawyk." },
        { stat: "0", title: "obiektywnych danych o pracy", body: "Wiesz kto zamknął ile. Nie wiesz czemu Tomek konwertuje 1/8 a Asia 1/3. Decydujesz na intuicji." },
      ],
      benefitsTitle: "Co konkretnie dostajesz",
      benefits: [
        { eyebrow: "Niższa rotacja agentów", title: "Z 60% wypadalności do 30% w 6 miesięcy", body: "Systematyczny trening i widoczność postępu sprawiają, że nowy agent czuje, że rośnie i ma wsparcie. Każde uratowane miejsce w zespole to 20-30 tys. zł oszczędności." },
        { eyebrow: "Szybszy onboarding", title: "Z 3 miesięcy do 4 tygodni do pierwszej transakcji", body: "AI Coach robi to, czego Ty nie masz czasu: codzienne dryle obiekcji, scenariusze, technikę zamykania. Nowy agent przychodzi do prawdziwego klienta przygotowany." },
        { eyebrow: "Decyzje oparte o dane", title: "Widzisz kto rośnie, kto stoi, gdzie zespół ma lukę", body: "Ranking sesji, średnie wyniki zespołu, najsłabsze obszary, alerty. Konkretne dane to konkretne decyzje rekrutacyjne i menedżerskie." },
        { eyebrow: "Wyższa konwersja zespołu", title: "Średnio 25-40% lepsza obsługa obiekcji", body: "Po 30 dniach treningu agenci znają konkretne odpowiedzi na pięć najczęstszych obiekcji. To przekłada się na więcej zamkniętych umów." },
      ],
      roiTitle: "Prosta matematyka",
      roi: [
        { label: "Koszt AgentSpace", value: "od 499 zł", suffix: "/ mc", accent: false },
        { label: "Średnia prowizja z transakcji", value: "~8 000 zł", suffix: "", accent: false },
        { label: "Próg opłacalności", value: "+1 transakcja", suffix: "/ mc", accent: true },
        { label: "Średnio zespół 8-osobowy daje (po 30 dniach)", value: "+3-5 transakcji", suffix: "/ mc", accent: true },
      ],
      cta: { title: "Zobacz swoje biuro w liczbach", lead: "Wdrożenie razem z importem bazy zajmuje jeden dzień roboczy, a cena jest zamrożona na 24 miesiące przy umowie rocznej. Bez umowy na czas określony.", primary: "Umów rozmowę", secondary: "Porozmawiajmy" },
    },

    integracje: {
      meta: {
        title: "Integracje z systemami dla biur nieruchomości | AgentSpace",
        description: "AgentSpace łączy się z systemami, których biura nieruchomości używają na co dzień: Asari, Galactica, IMO, Estiman. Zachowujesz obieg ofert, zyskujesz zarządzanie zespołem.",
      },
      hero: {
        eyebrow: "Integracje",
        title: "Nie musisz porzucać systemu, który działa",
        description: "Większość biur ma już gdzieś swoje oferty. AgentSpace nie każe migrować wszystkiego na start - łączymy się z systemami ofertowymi, żeby nie wpisywać tych samych danych dwa razy.",
      },
      listEyebrow: "Systemy",
      listTitle: "Z czym łączymy AgentSpace",
      listLead: "Status aktualizujemy na bieżąco. Jeśli Twojego systemu nie ma na liście - napisz, sprawdzimy możliwość połączenia.",
      seeDetails: "Zobacz szczegóły",
      otherSystemTitle: "Pracujesz na innym systemie?",
      otherSystemLead: "Napisz, z czego korzysta Twoje biuro. Sprawdzimy, czy da się je połączyć z AgentSpace - a jeśli nie, powiem wprost.",
      otherSystemCta: "Zapytaj o swój system",
      detail: {
        label: "Integracja",
        metaTitle: "AgentSpace + {name} - integracja dla biur nieruchomości",
        metaDescription: "Jak połączyć {fullName} z AgentSpace: co się synchronizuje, dla kogo ma to sens i jak wygląda wdrożenie. Status: {status}.",
        notLive: "Ta integracja jest {status}.",
        notLiveBody: "Kolejność prac ustalamy według zgłoszeń od biur - jeśli pracujesz na {name}, daj znać. Biura, które zgłoszą się teraz, wdrażamy jako pierwsze i konsultujemy z nimi zakres synchronizacji.",
        scopeEyebrow: "Zakres",
        scopeTitleLive: "Co się synchronizuje",
        scopeTitlePlanned: "Co będzie się synchronizować",
        whyEyebrow: "Po co",
        whyTitle: "Dlaczego biura to łączą",
        splitEyebrow: "Podział ról",
        splitTitle: "Co robi {name}, a co AgentSpace",
        splitLead: "Systemy się nie dublują - każdy odpowiada za inny etap pracy biura.",
        theirSide: ["Baza ofert i ich prezentacja", "Eksport na portale ogłoszeniowe", "Dokumentacja oferty"],
        ourSide: [
          "Praca zespołu: cele, lejek, zadania dnia",
          "Rozliczanie prowizji i karta transakcji",
          "Trening rozmów z AI Coachem",
          "Panel właściciela i raporty",
        ],
        ctaTitle: "Pracujesz na {name}",
        ctaLead: "Napisz, jak dziś wygląda u Ciebie obieg oferty i klienta. Powiem wprost, czy połączenie z AgentSpace ma w Twoim biurze sens.",
        ctaButton: "Umów rozmowę",
        othersEyebrow: "Pozostałe",
        othersTitle: "Inne integracje",
      },
    },

    produkt: {
      moduleLabel: "Moduł",
      cta: "Umów rozmowę",
      problemEyebrow: "Problem",
      problemTitle: "Dlaczego to boli",
      capabilitiesEyebrow: "Możliwości",
      capabilitiesTitle: "Co robi {name}",
      forWhom: "Dla kogo",
      restEyebrow: "Reszta systemu",
      restTitle: "Pozostałe moduły",
      restLead: "AgentSpace działa jako całość, ale wdrażasz go stopniowo - w tempie, które wytrzyma zespół.",
      ctaTitle: "Zobacz to na swoich danych",
      ctaLead: "30 minut rozmowy. Pokażę, jak {name} wyglądałby w Twoim biurze - na Twoich klientach i Twoim modelu prowizji.",
    },

    integracjaSzczegoly: {
      label: "Integracja",
      aboutEyebrow: "System",
      aboutTitle: "Czym jest {name}",
      syncsEyebrow: "Wymiana danych",
      syncsTitle: "Co przepływa między systemami",
      whyEyebrow: "Po co",
      whyTitle: "Dlaczego biura łączą te dwa systemy",
      backToList: "Wszystkie integracje",
      cta: "Zapytaj o tę integrację",
    },

    wzory: {
      meta: {
        title: "Strony internetowe dla biur nieruchomości | wzory | AgentSpace",
        description:
          "Gotowe wzory stron dla biur nieruchomości i deweloperów. Oferty z CRM trafiają na stronę automatycznie, a formularze ze strony wracają do systemu jako kontakty i poszukiwania.",
      },
      hero: {
        eyebrow: "Strony internetowe",
        title: "Strona biura połączona z systemem, a nie obok niego",
        description:
          "Wybieracie wzór, my podłączamy Waszą bazę ofert i domenę. Oferta dodana w AgentSpace jest na stronie od razu, a zapytanie ze strony ląduje u konkretnego agenta.",
      },
      demoNotice: "",
      gallery: {
        eyebrow: "Wzory",
        title: "Osiem projektów, osiem różnych biur",
        lead: "To nie są warianty kolorystyczne tego samego szablonu. Każdy ma własną typografię, siatkę i rytm, bo biuro premium, biuro z setkami mieszkań na wynajem i deweloper potrzebują czegoś zupełnie innego. Każdy wzór ma komplet podstron: oferty z filtrami i mapą, karty ofert, usługi, zespół, poradnik, kalkulator i formularze.",
        previewAlt: "Podgląd wzoru",
        forWhom: "Dla kogo:",
        see: "Zobacz wzór",
        listings: "Lista ofert",
      },
      custom: {
        eyebrow: "Projekt indywidualny",
        title: "Żaden wzór nie pasuje? Zaprojektujemy stronę od zera",
        body: "Wzory są po to, żeby ruszyć w tydzień i za rozsądne pieniądze. Jeśli macie własną identyfikację, mocny pomysł albo stronę, która już działa i chcecie ją tylko podnieść na wyższy poziom, robimy projekt indywidualny: makieta, konsultacje i strona napisana pod Was, nadal połączona z AgentSpace.",
        points: [
          { title: "Makieta przed kodem", body: "Najpierw widzicie projekt strony głównej i karty oferty. Dopiero po akceptacji piszemy kod." },
          { title: "Wasza identyfikacja", body: "Logo, kolory, kroje i sposób mówienia. Jeśli tego nie macie, pomagamy to ułożyć." },
          { title: "Ten sam silnik", body: "Oferty, formularze i zespół działają tak samo jak we wzorach, bo pod spodem jest ten sam system." },
        ],
        cta: "Porozmawiajmy o projekcie indywidualnym",
      },
      how: {
        eyebrow: "Jak to działa",
        title: "Od wyboru wzoru do działającej strony",
        steps: [
          { n: "01", title: "Wybieracie wzór", body: "Osiem projektów, każdy inny: od redakcyjnego premium, przez brutalistyczny, po stronę jednej inwestycji dewelopera. Kolory, kroje i teksty dopasowujemy do Waszego logo." },
          { n: "02", title: "Podłączamy Waszą bazę", body: "Strona czyta oferty prosto z AgentSpace. Agent zaznacza w ofercie „publikuj” i po chwili jest ona na stronie, ze zdjęciami po obróbce i znakiem wodnym biura." },
          { n: "03", title: "Treści zmieniacie sami", body: "W AgentSpace jest zakładka Strona www: logo, kolory, teksty sekcji, zespół i wpisy do poradnika. Bez dzwonienia do nas i bez dopłat za każdą zmianę przecinka." },
          { n: "04", title: "Formularze wracają do CRM", body: "Zapytanie o ofertę, zgłoszenie nieruchomości i zlecenie poszukiwania tworzą w systemie kontakt, zadanie i przypisanie do agenta. Nic nie ginie w skrzynce." },
          { n: "05", title: "Domena i hosting po naszej stronie", body: "Podpinamy Waszą domenę, certyfikat i kopie zapasowe. Strona działa tak długo, jak trwa abonament, bez osobnego serwera i bez aktualizowania wtyczek." },
        ],
      },
      diff: {
        eyebrow: "Czym się różnimy",
        title: "Dlaczego nie robimy tego na WordPressie",
        lead: "Większość stron dla biur to WordPress z wtyczką do ofert. Działa, dopóki ktoś pilnuje aktualizacji, kopii i wydajności. My poszliśmy inną drogą.",
        items: [
          { title: "Bez WordPressa i wtyczek", body: "Nie ma czego łatać ani co się nie zaktualizuje. Strona to część systemu, nie kolejne oprogramowanie do pilnowania." },
          { title: "Oferty zawsze aktualne", body: "Zmiana ceny w CRM zmienia cenę na stronie. Sprzedana oferta znika ze strony sama." },
          { title: "Zdjęcia raz, wszędzie", body: "Ten sam zestaw zdjęć ze znakiem wodnym idzie na stronę, do PDF dla klienta i na portale." },
          { title: "Szybkość i Google", body: "Strony budujemy statycznie, więc ładują się w ułamku sekundy, co Google traktuje jako sygnał rankingowy." },
          { title: "Ulubione i historia", body: "Odwiedzający odkłada oferty do ulubionych, a agent widzi przy kontakcie, co ten człowiek oglądał." },
          { title: "Jeden abonament", body: "Strona, CRM i obsługa w jednej cenie. Bez faktur od trzech różnych firm co miesiąc." },
        ],
      },
      cta: {
        title: "Chcecie zobaczyć swoje oferty w tym wzorze?",
        body: "Przygotujemy podgląd na Waszych ofertach i logo, zanim cokolwiek podpiszecie. Wystarczy nam eksport z obecnego systemu albo link do Waszej strony.",
        price: "Strona to osobna usługa: {monthly} zł miesięcznie plus {setup} zł wdrożenia. Nie musicie jej brać razem z systemem, a system działa bez niej normalnie.",
        button: "Zamów podgląd na swoich ofertach",
      },
    },

    blog: {
      meta: {
        title: "Blog | AgentSpace",
        description: "Praktyczne materiały dla biur nieruchomości: rozmowy z klientem, obiekcje, szkolenie agentów, narzędzia AI.",
      },
      hero: {
        eyebrow: "Blog",
        title: "Wiedza dla biur nieruchomości",
        description: "Konkretne materiały o rozmowach z klientem, obiekcjach i prowadzeniu zespołu. Bez lania wody.",
      },
      languageNotice: "",
    },

    legal: {
      notice: "",
    },
  },

  pricingWidget: {
    question: "Ilu agentów pracuje w Twoim biurze?",
    less: "Mniej agentów",
    more: "Więcej agentów",
    forYou: "Dla Ciebie",
    note: "Ceny netto, rozliczenie miesięczne. Bez umowy na czas określony - rezygnujesz kiedy chcesz.",
    plans: [
      {
        id: "start",
        name: "Start",
        tagline: "Dla biur, które porządkują podstawy",
        features: [
          "Do 5 agentów",
          "CRM klientów - karty, notatki, pipeline",
          "Wspólna baza nieruchomości",
          "Zadania i pulpit dnia",
          "Cele i lejek sprzedażowy",
          "Rozliczanie prowizji",
        ],
      },
      {
        id: "pro",
        name: "Pro",
        tagline: "Dla biur, które chcą rozwijać zespół",
        features: [
          "Do 15 agentów",
          "Wszystko ze Start",
          "AI Coach - 13+ scenariuszy, 9 osobowości klienta",
          "Panel właściciela - ranking, mocne i słabe obszary",
          "AI Asystent Dnia i pisanie follow-upów",
          "Raporty miesięczne na e-mail",
          "Karta transakcji i umowy rezerwacyjne (PDF)",
        ],
      },
      {
        id: "biuro",
        name: "Biuro",
        tagline: "Dla sieci i biur wielooddziałowych",
        features: [
          "Bez limitu agentów",
          "Wszystko z Pro",
          "Role: CEO, menedżer, agent",
          "Wielooddziałowość i podział zespołów",
          "Wdrożenie 1:1 i szkolenie zespołu",
          "Priorytetowe wsparcie",
        ],
      },
    ],
  },
};

/** Kształt słownika - angielski musi mieć dokładnie te same klucze. */
export type Dict = typeof pl;
