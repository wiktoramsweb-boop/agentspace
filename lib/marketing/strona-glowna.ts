/**
 * Treści strony głównej (przebudowa 2026-10).
 *
 * Zasady pisania: konkret zamiast przymiotników, jedno zdanie = jedna myśl,
 * żadnych obietnic funkcji, których nie ma (np. eksportu na portale), żadnych
 * wymyślonych liczb klientów ani opinii. Myślników długich nie używamy.
 */

export type TrescStronyGlownej = {
  meta: { title: string; description: string };
  hero: {
    tytul: string;
    lead: string;
    pole: string;
    przycisk: string;
    podPolem: string;
    albo: string;
    alboLink: string;
    fakty: { tytul: string; tekst: string }[];
  };
  dzien: {
    etykieta: string;
    tytul: string;
    lead: string;
    momenty: { pora: string; tytul: string; tekst: string; punkty: string[]; zdjecie: string }[];
  };
  srodek: { etykieta: string; tytul: string; lead: string };
  wlasciciel: {
    etykieta: string;
    tytul: string;
    lead: string;
    punkty: { tytul: string; tekst: string; href: string }[];
  };
  coach: { etykieta: string; tytul: string; lead: string; nowosci: string[] };
  moduly: { etykieta: string; tytul: string; lead: string };
  nowosci: {
    etykieta: string;
    tytul: string;
    lead: string;
    pozycje: { tytul: string; tekst: string; href: string }[];
  };
  przejscie: {
    etykieta: string;
    tytul: string;
    lead: string;
    kroki: { tytul: string; tekst: string }[];
  };
  opinie: { etykieta: string; tytul: string; lead: string; brak: string; zalozyciel: { cytat: string; kto: string; rola: string } };
  cennik: { etykieta: string; tytul: string; lead: string };
  faq: { etykieta: string; tytul: string; pozycje: { q: string; a: string }[] };
  koniec: { tytul: string; lead: string };
};

export function trescStronyGlownej(lang: string, dniProbne: number): TrescStronyGlownej {
  return lang === "en" ? en(dniProbne) : pl(dniProbne);
}

function pl(dni: number): TrescStronyGlownej {
  return {
    meta: {
      title: "AgentSpace | Program dla biura nieruchomości: CRM, umowy, prowizje, AI",
      description: `System dla biur nieruchomości: CRM klientów, baza ofert, tablica transakcji, umowy (w tym najem okazjonalny), prowizje, koszty biura, czat zespołu i trening rozmów z AI. ${dni} dni za darmo, bez karty.`,
    },
    hero: {
      tytul: "Program dla biura nieruchomości, w którym agenci naprawdę pracują",
      lead: "Klienci, oferty, umowy, prowizje i trening rozmów z AI w jednym miejscu. Agent wie rano, co ma zrobić, a Ty wieczorem widzisz, co się wydarzyło.",
      pole: "Twój e-mail służbowy",
      przycisk: `Wypróbuj ${dni} dni za darmo`,
      podPolem: "Bez karty płatniczej. Pełny dostęp do wszystkich modułów. Po okresie próbnym sam decydujesz.",
      albo: "Wolisz, żeby ktoś pokazał?",
      alboLink: "Umów 20-minutowy pokaz",
      fakty: [
        { tytul: "Twoje dane są Twoje", tekst: "Eksport całej bazy do Excela w każdej chwili, za darmo. Bez opłat za „wydanie danych”." },
        { tytul: "Przeniesiemy bazę", tekst: "Import klientów i ofert z Excela lub poprzedniego systemu w ramach wdrożenia." },
        { tytul: "Zrobione w biurze", tekst: "Powstaje w działającym biurze Spectra Nieruchomości w Krakowie, na prawdziwych transakcjach." },
      ],
    },
    dzien: {
      etykieta: "Dzień agenta",
      tytul: "Od pierwszej kawy do podpisanej umowy",
      lead: "Program ma sens tylko wtedy, gdy agent otwiera go sam, bez przypominania. Dlatego zaczęliśmy od tego, jak naprawdę wygląda jego dzień.",
      momenty: [
        {
          pora: "8:30",
          tytul: "Wie, od czego zacząć",
          tekst: "Pulpit pokazuje plan dnia: telefony do oddzwonienia, prezentacje, klientów, którzy czekają za długo. Cel dzienny wynika z rocznego, więc agent widzi, ile mu zostało dziś.",
          punkty: ["Plan dnia i zadania", "Cele rozbite do dnia", "Powiadomienia na telefon"],
          zdjecie: "dzien-rano",
        },
        {
          pora: "12:10",
          tytul: "Notatka zanim zapomni",
          tekst: "Po prezentacji agent nagrywa głosówkę w samochodzie. System zamienia ją na notatkę przy kliencie, termin kolejnego kontaktu i zadanie.",
          punkty: ["Szybki wpis głosem", "Historia kontaktu przy kliencie", "Tablica transakcji z przeciąganiem"],
          zdjecie: "dzien-teren",
        },
        {
          pora: "15:40",
          tytul: "Umowa w kilka minut",
          tekst: "Umowa najmu okazjonalnego, pośrednictwa albo rezerwacyjna wypełnia się danymi z karty klienta i oferty. Program pilnuje kaucji, terminów i pouczeń, a PDF trafia od razu do karty.",
          punkty: ["11 wzorów umów i pism", "Zgody RODO z historią", "Wysyłka maili z karty klienta"],
          zdjecie: "dzien-umowa",
        },
        {
          pora: "18:00",
          tytul: "Jutro zadzwoni lepiej",
          tekst: "Dziesięć minut rozmowy z klientem AI, który zgłasza te same obiekcje co prawdziwi. Agent dostaje ocenę i swoje własne zdania z poprawioną wersją.",
          punkty: ["Rozmowa głosowa albo pisana", "Trening na własnej ofercie", "Zadania od menedżera"],
          zdjecie: "dzien-trening",
        },
      ],
    },
    srodek: {
      etykieta: "W środku",
      tytul: "Zobacz ekrany, na których pracuje zespół",
      lead: "To nie są grafiki z prezentacji. Tak wygląda aplikacja, w której pracuje biuro, kliknij, żeby przełączyć ekran.",
    },
    wlasciciel: {
      etykieta: "Dla właściciela",
      tytul: "Biuro w liczbach, a nie w przeczuciach",
      lead: "Większość programów dla biur jest pisana dla agenta. Właściciel dostaje w nich tabelkę ofert. Tu dostajesz to, czego potrzebujesz do prowadzenia firmy.",
      punkty: [
        { tytul: "Koszty i wynik miesiąca", tekst: "Koszty biura, stałe opłaty dopisujące się same i wynik po wypłatach dla agentów. Paczka CSV dla księgowej jednym kliknięciem.", href: "/produkt/koszty-i-wynik" },
        { tytul: "Prowizje do wypłaty", tekst: "Kto, za którą transakcję i ile. Zaległe wypłaty nie znikają w kolejnym miesiącu.", href: "/produkt/prowizje" },
        { tytul: "Dziennik zdarzeń", tekst: "Kto usunął klienta, kto przepisał ofertę na siebie, kto pobrał eksport bazy. Wpisów nie da się skasować z aplikacji.", href: "/produkt/role-i-uprawnienia" },
        { tytul: "Uprawnienia i ukryte kontakty", tekst: "Osiem stanowisk, od stażysty po księgową. Agent nie spisze numerów cudzych klientów przed odejściem.", href: "/produkt/role-i-uprawnienia" },
        { tytul: "Urlopy i zastępstwa", tekst: "Gdy agent jest na urlopie, zastępca widzi jego klientów, a zadania z automatyzacji trafiają do niego, nie w próżnię.", href: "/produkt/urlopy-i-zastepstwa" },
        { tytul: "Raport miesięczny", tekst: "Pierwszego dnia miesiąca mail z wynikami biura i każdego agenta.", href: "/produkt/raporty" },
      ],
    },
    coach: {
      etykieta: "AI Coach",
      tytul: "Trening rozmów, którego nie ma nikt inny",
      lead: "Agent rozmawia z klientem AI przez telefon albo na czacie. Klient ma charakter, obiekcje i potrafi odmówić. Po rozmowie przychodzi ocena w czterech obszarach.",
      nowosci: [
        "Trening na własnej ofercie: klient pyta o konkretne mieszkanie, a ocena sprawdza, czy agent zna swoją ofertę.",
        "Zadania od menedżera z progiem zaliczenia i terminem. Menedżer dostaje powiadomienie, gdy agent zaliczy.",
        "Kluczowe momenty: dosłowne zdania agenta z rozmowy i gotowa lepsza wersja do powtórzenia.",
      ],
    },
    moduly: {
      etykieta: "Moduły",
      tytul: "Wszystko, czego biuro używa codziennie",
      lead: "Pogrupowane tak, jak pracuje biuro. Każdy moduł ma swoją stronę z opisem i pytaniami, które zadają biura.",
    },
    nowosci: {
      etykieta: "Co nowego",
      tytul: "Październik 2026",
      lead: "Program rozwija się co tydzień, a o kolejności decydują biura, które z niego korzystają. Ostatnio doszło:",
      pozycje: [
        { tytul: "Umowy najmu okazjonalnego", tekst: "Umowa z załącznikami, zgłoszenie do urzędu skarbowego, żądanie opróżnienia lokalu.", href: "/produkt/umowa-najmu-okazjonalnego" },
        { tytul: "Tablica transakcji", tekst: "Klienci i oferty w kolumnach etapów, przeciągasz kartę jak na tablicy.", href: "/produkt/tablica-transakcji" },
        { tytul: "Czat zespołu", tekst: "Rozmowy w biurze z linkiem do klienta albo oferty, zamiast prywatnego komunikatora.", href: "/produkt/czat-zespolu" },
        { tytul: "Automatyzacje", tekst: "Zmienił się etap albo cena: zadanie, mail lub powiadomienie tworzy się samo.", href: "/produkt/automatyzacje" },
        { tytul: "Kalkulator remontu", tekst: "Kosztorys z metrażu i standardu, z VAT 8% i PDF dla kupującego.", href: "/produkt/kalkulator-remontu" },
        { tytul: "Zgody RODO", tekst: "Zgody klienta z datą, źródłem i historią zmian, obowiązek informacyjny w PDF.", href: "/produkt/rodo" },
      ],
    },
    przejscie: {
      etykieta: "Zmiana systemu",
      tytul: "Przejście z Excela albo innego programu bez bólu",
      lead: "Najtrudniejsze w zmianie systemu nie jest klikanie, tylko przeniesienie bazy i przyzwyczajeń zespołu. Tym zajmujemy się my.",
      kroki: [
        { tytul: "Dzień 1: konto i import", tekst: "Zakładasz konto, przesyłasz plik z klientami i ofertami. Mapujemy kolumny na pola w programie." },
        { tytul: "Dzień 2: zespół", tekst: "Zapraszasz agentów linkiem, ustawiasz role i to, kto widzi czyje kontakty." },
        { tytul: "Tydzień 1: pierwsze nawyki", tekst: "Agenci zaczynają dzień od pulpitu, a Ty widzisz pierwsze liczby z ich pracy." },
      ],
    },
    opinie: {
      etykieta: "Opinie",
      tytul: "Co mówią biura",
      lead: "Publikujemy wyłącznie opinie prawdziwych użytkowników, z imieniem, nazwiskiem i nazwą biura, za ich zgodą. Nie kupujemy ich i nie piszemy za nikogo.",
      brak: "Zbieramy pierwsze opinie od biur, które pracują w programie. Pojawią się tutaj, gdy autorzy je zatwierdzą.",
      zalozyciel: {
        cytat: "Zbudowałem AgentSpace, bo w moim biurze żaden program nie pokazywał tego, co naprawdę dzieje się z leadami i rozmowami. Każdą funkcję najpierw sprawdzamy u nas w Spectrze, na prawdziwych klientach.",
        kto: "Wiktor Szostek",
        rola: "Właściciel Spectra Nieruchomości w Krakowie, twórca AgentSpace",
      },
    },
    cennik: {
      etykieta: "Cennik",
      tytul: "Płacisz za wielkość biura, nie za moduły",
      lead: `Każdy pakiet zaczyna się od ${dni} dni za darmo, z pełnym dostępem i bez karty.`,
    },
    faq: {
      etykieta: "Pytania",
      tytul: "O to pytają biura przed startem",
      pozycje: [
        { q: `Co dokładnie dostaję przez ${dni} dni za darmo?`, a: "Pełny dostęp do wszystkich modułów, także AI Coacha, z pulą kredytów AI na próbę. Nie podajesz karty, więc nic nie pobierzemy automatycznie. Po okresie próbnym wybierasz pakiet albo konto zostaje zatrzymane, a dane możesz pobrać." },
        { q: "Czy przeniesiecie bazę z mojego obecnego programu?", a: "Tak, w ramach wdrożenia. Potrzebujemy pliku z klientami i ofertami (Excel, CSV albo eksport z poprzedniego systemu). Mapujemy kolumny i sprawdzamy dane razem z Tobą." },
        { q: "Czy mogę zabrać dane, jeśli zrezygnuję?", a: "Tak, w każdej chwili i bez opłat. W ustawieniach jest eksport całej bazy do plików Excela. Uważamy, że opłata za wydanie własnych danych biura nie powinna istnieć." },
        { q: "Czy wzory umów są zgodne z prawem?", a: "Wzory są przygotowane według przepisów obowiązujących w 2026 r.: ustawy o gospodarce nieruchomościami, ustawy o ochronie praw lokatorów i ustawy o prawach konsumenta. Program ostrzega przed typowymi błędami, np. kaucją wyższą niż pozwala ustawa. Przy nietypowej transakcji warto dać umowę prawnikowi." },
        { q: "Gdzie są przechowywane dane i co z RODO?", a: "Na serwerach w Unii Europejskiej (Frankfurt). Podpisujemy z biurem umowę powierzenia przetwarzania danych. Zgody klientów prowadzisz w programie razem z historią zmian." },
        { q: "Czy agenci muszą mieć komputer?", a: "Nie. Aplikacja działa w przeglądarce telefonu i instaluje się jak zwykła aplikacja, z powiadomieniami. Większość pracy w terenie agent robi z telefonu." },
      ],
    },
    koniec: {
      tytul: "Sprawdź na swoim biurze, nie na prezentacji",
      lead: `${dni} dni pełnego dostępu, bez karty. Jeśli program nie przyjmie się w zespole, nic nie płacisz.`,
    },
  };
}

function en(dni: number): TrescStronyGlownej {
  return {
    meta: {
      title: "AgentSpace | Software for real estate agencies: CRM, contracts, commissions, AI",
      description: `Real estate agency software: client CRM, listings, deal board, contracts, commissions, office costs, team chat and AI call training. ${dni}-day free trial, no card required.`,
    },
    hero: {
      tytul: "Real estate agency software your agents will actually use",
      lead: "Clients, listings, contracts, commissions and AI call training in one place. Agents know what to do in the morning, and you see what happened by the evening.",
      pole: "Your work email",
      przycisk: `Try it free for ${dni} days`,
      podPolem: "No credit card. Full access to every module. You decide after the trial.",
      albo: "Prefer a guided tour?",
      alboLink: "Book a 20-minute demo",
      fakty: [
        { tytul: "Your data stays yours", tekst: "Export your whole database to Excel at any time, free of charge." },
        { tytul: "We move your database", tekst: "Clients and listings imported from Excel or your previous system as part of onboarding." },
        { tytul: "Built inside an agency", tekst: "Developed in a working agency, Spectra Nieruchomości in Kraków, on real transactions." },
      ],
    },
    dzien: {
      etykieta: "An agent's day",
      tytul: "From the first coffee to a signed contract",
      lead: "Software only works if agents open it on their own. So we started from what their day really looks like.",
      momenty: [
        { pora: "8:30", tytul: "Knows where to start", tekst: "The dashboard shows the day: calls to return, viewings, clients waiting too long. The daily goal comes from the yearly one.", punkty: ["Day plan and tasks", "Goals broken down to the day", "Phone notifications"], zdjecie: "dzien-rano" },
        { pora: "12:10", tytul: "Notes before they are forgotten", tekst: "After a viewing the agent records a voice note in the car. It becomes a client note, a follow-up date and a task.", punkty: ["Voice quick entry", "Contact history per client", "Drag-and-drop deal board"], zdjecie: "dzien-teren" },
        { pora: "15:40", tytul: "A contract in minutes", tekst: "Lease, brokerage and reservation agreements fill in from the client and listing records. The PDF lands in the client file.", punkty: ["11 contract templates", "GDPR consents with history", "Email from the client file"], zdjecie: "dzien-umowa" },
        { pora: "18:00", tytul: "Tomorrow's calls go better", tekst: "Ten minutes with an AI client raising real objections. The agent gets a score and their own sentences with a better version.", punkty: ["Voice or text conversation", "Training on your own listing", "Assignments from the manager"], zdjecie: "dzien-trening" },
      ],
    },
    srodek: { etykieta: "Inside", tytul: "See the screens your team works on", lead: "These are not pitch-deck graphics. This is the app, click to switch screens." },
    wlasciciel: {
      etykieta: "For the owner",
      tytul: "Your agency in numbers, not guesses",
      lead: "Most agency software is written for agents. Here the owner gets what running a company takes.",
      punkty: [
        { tytul: "Costs and monthly result", tekst: "Office costs, recurring bills that add themselves and the result after agent payouts. A CSV pack for your accountant.", href: "/produkt/koszty-i-wynik" },
        { tytul: "Commissions to pay out", tekst: "Who, for which deal and how much. Overdue payouts never disappear.", href: "/produkt/prowizje" },
        { tytul: "Audit log", tekst: "Who deleted a client, who reassigned a listing, who downloaded an export.", href: "/produkt/role-i-uprawnienia" },
        { tytul: "Permissions and hidden contacts", tekst: "Eight roles from trainee to accountant. Agents cannot copy colleagues' client numbers.", href: "/produkt/role-i-uprawnienia" },
        { tytul: "Leave and cover", tekst: "When an agent is away, the cover sees their clients and automated tasks go to them.", href: "/produkt/urlopy-i-zastepstwa" },
        { tytul: "Monthly report", tekst: "On the first day of the month, an email with agency and per-agent results.", href: "/produkt/raporty" },
      ],
    },
    coach: {
      etykieta: "AI Coach",
      tytul: "Call training nobody else has",
      lead: "Agents talk to an AI client by phone or chat. The client has a personality, objections and can say no. A score in four areas follows.",
      nowosci: [
        "Training on your own listing: the client asks about that exact apartment.",
        "Assignments from the manager with a pass mark and a deadline.",
        "Key moments: the agent's own sentences with a better version.",
      ],
    },
    moduly: { etykieta: "Modules", tytul: "Everything an agency uses every day", lead: "Grouped the way an agency works. Each module has its own page." },
    nowosci: {
      etykieta: "What's new",
      tytul: "October 2026",
      lead: "The product ships every week. Recently added:",
      pozycje: [
        { tytul: "Occasional lease contracts", tekst: "Contract with annexes, tax office notice, notice to vacate.", href: "/produkt/umowa-najmu-okazjonalnego" },
        { tytul: "Deal board", tekst: "Clients and listings in stage columns, drag and drop.", href: "/produkt/tablica-transakcji" },
        { tytul: "Team chat", tekst: "Office conversations linked to clients and listings.", href: "/produkt/czat-zespolu" },
        { tytul: "Automations", tekst: "Stage or price changed: a task, email or notification is created.", href: "/produkt/automatyzacje" },
        { tytul: "Renovation calculator", tekst: "Estimate from area and standard, with VAT and a PDF.", href: "/produkt/kalkulator-remontu" },
        { tytul: "GDPR consents", tekst: "Client consents with date, source and history.", href: "/produkt/rodo" },
      ],
    },
    przejscie: {
      etykieta: "Switching",
      tytul: "Moving from Excel or another system",
      lead: "The hard part is moving the database and the team's habits. We handle that.",
      kroki: [
        { tytul: "Day 1: account and import", tekst: "Create the account, send the file with clients and listings, we map the columns." },
        { tytul: "Day 2: the team", tekst: "Invite agents with a link, set roles and who sees whose contacts." },
        { tytul: "Week 1: first habits", tekst: "Agents start the day from the dashboard and you see the first numbers." },
      ],
    },
    opinie: {
      etykieta: "Reviews",
      tytul: "What agencies say",
      lead: "We only publish reviews from real users, with their name and agency, with their consent.",
      brak: "We are collecting the first reviews from agencies using the product. They will appear here once their authors approve them.",
      zalozyciel: {
        cytat: "I built AgentSpace because no software in my own agency showed what really happens with leads and calls. Every feature is tested first at Spectra, on real clients.",
        kto: "Wiktor Szostek",
        rola: "Owner of Spectra Nieruchomości in Kraków, creator of AgentSpace",
      },
    },
    cennik: { etykieta: "Pricing", tytul: "You pay for agency size, not modules", lead: `Every plan starts with ${dni} free days, full access, no card.` },
    faq: {
      etykieta: "Questions",
      tytul: "What agencies ask before starting",
      pozycje: [
        { q: `What do I get in the ${dni}-day trial?`, a: "Full access to all modules including AI Coach, with a trial pool of AI credits. No card, so nothing is charged automatically." },
        { q: "Will you move our database?", a: "Yes, as part of onboarding. Send a file with clients and listings and we map the columns with you." },
        { q: "Can I take my data if I leave?", a: "Yes, at any time and free of charge. Settings include a full export to Excel files." },
        { q: "Where is the data stored?", a: "On servers in the European Union (Frankfurt). We sign a data processing agreement with your agency." },
      ],
    },
    koniec: { tytul: "Test it on your own agency", lead: `${dni} days of full access, no card. If it doesn't stick with your team, you pay nothing.` },
  };
}
