/**
 * Treści nowej strony głównej (przebudowa 2026-10, druga).
 *
 * Każda liczba jest sprawdzona w kodzie albo w bazie: 24 aktywne scenariusze
 * AI Coacha, 15 charakterów klienta (PERSONALITIES), 11 wzorów dokumentów
 * (WZORY), 8 stanowisk (ROLE). Zmieniasz liczbę w produkcie, zmień ją tutaj.
 * Opinii nie dopisujemy, dopóki nie ma prawdziwych (lib/marketing/opinie.ts).
 */

type Krok = { tytul: string; tekst: string; cytat?: { kto: string; tresc: string }; dopisek?: string };
type Moment = { pora: string; tytul: string; tekst: string; punkty: string[]; obraz: string };
type Karta = { tytul: string; tekst: string; zrzut: string; href: string };
type Modul = { nazwa: string; tytul: string; tekst: string; zrzut: string };
type Wiersz = { cecha: string; wartosci: [string, string, string] };

export type NowaStrona = {
  meta: { title: string; description: string };
  nav: { linki: { label: string; href: string }[]; login: string; cta: string; menu: string; zamknij: string };
  hero: {
    linie: [string, string];
    pod: string;
    lead: string;
    cta: string;
    cta2: string;
    podCta: string;
    rozmowa: { etykieta: string; czas: string; kto: string; gdzie: string };
    ocena: { tytul: string; wynik: string; obszary: [string, number][] };
    /** Karty „Dziś rano” w hero: przykładowy widok pulpitu, nie dane klientów. */
    priorytety: { tytul: string; karty: { wynik: number; temp: "goracy" | "cieply" | "zimny"; tempNazwa: string; kto: string; powod: string }[] };
  };
  rozdzialy: [string, string, string, string, string];
  pulpit: { etykieta: string; tytul: string; lead: string; punkty: { tytul: string; tekst: string }[] };
  wszystko: { etykieta: string; tytul: string; lead: string; rzedy: [string[], string[]]; punkty: { tytul: string; tekst: string }[] };
  manifest: string;
  coach: {
    etykieta: string;
    tytul: string;
    lead: string;
    kroki: Krok[];
    liczby: { wartosc: string; opis: string }[];
    telefon: { pora: string; typ: string; kto: string; gdzie: string; odrzuc: string; odbierz: string };
    transkrypt: { tytul: string; linie: { kto: "ai" | "agent"; tekst: string }[] };
  };
  dzien: { etykieta: string; tytul: string; lead: string; momenty: Moment[] };
  rozszerzenie: { tytul: string; lead: string };
  wlasciciel: { etykieta: string; tytul: string; lead: string; karty: Karta[]; lista: { tytul: string; tekst: string }[] };
  moduly: { etykieta: string; tytul: string; lista: Modul[] };
  liczby: { etykieta: string; slajdy: { wartosc: string; opis: string }[] };
  dlaKogo: { tytul: string; lead: string; karty: { tytul: string; tekst: string; obraz: string }[] };
  porownanie: { etykieta: string; tytul: string; lead: string; kolumny: [string, string, string]; wiersze: Wiersz[]; nota: string };
  cennik: { etykieta: string; tytul: string; lead: string; miesiac: string; od: string; polecany: string; wybierz: string; pelny: string };
  start: { etykieta: string; tytul: string; lead: string; kroki: { tytul: string; tekst: string }[]; cta: string };
  faq: { tytul: string };
  koniec: { tytul: string; lead: string; pole: string; przycisk: string; alt: string; altLink: string };
  stopka: { gora: string };
};

export function nowaStrona(lang: string, dni: number): NowaStrona {
  return lang === "en" ? en(dni) : pl(dni);
}

function pl(dni: number): NowaStrona {
  return {
    meta: {
      title: "AgentSpace | Program dla biura nieruchomości z treningiem rozmów AI",
      description: `Trening rozmów z klientem AI, CRM, oferty na mapie, umowy z PDF, prowizje i wynik biura w jednym programie. ${dni} dni za darmo, bez karty.`,
    },
    nav: {
      linki: [
        { label: "AI Coach", href: "#coach" },
        { label: "Dzień agenta", href: "#dzien" },
        { label: "Właściciel", href: "#wlasciciel" },
        { label: "Moduły", href: "#moduly" },
        { label: "Cennik", href: "#cennik" },
        { label: "Pytania", href: "#pytania" },
      ],
      login: "Zaloguj się",
      cta: "Wypróbuj za darmo",
      menu: "Otwórz menu",
      zamknij: "Zamknij menu",
    },
    hero: {
      linie: ["Przygotowany agent", "sprzedaje więcej."],
      pod: "CRM dla biur nieruchomości. Cała codzienna praca w jednym programie.",
      lead: "Klienci, oferty, kalendarz, umowy, prowizje, wyceny z aktów notarialnych i trening rozmów z klientem AI. Agent nie skacze między pięcioma aplikacjami, a właściciel widzi całe biuro w jednym miejscu.",
      cta: `Wypróbuj ${dni} dni za darmo`,
      cta2: "Wejdź do demo",
      podCta: "Bez karty płatniczej. Pełny dostęp do wszystkich modułów.",
      rozmowa: { etykieta: "Trening z klientem AI", czas: "02:41", kto: "Właścicielka mieszkania", gdzie: "Podgórze, 3 pokoje" },
      ocena: {
        tytul: "Ocena rozmowy",
        wynik: "7,8",
        obszary: [
          ["Otwarcie", 8],
          ["Kwalifikacja", 7],
          ["Obiekcje", 8],
          ["Zamknięcie", 8],
        ],
      },
      priorytety: {
        tytul: "Dziś rano",
        karty: [
          { wynik: 82, temp: "goracy", tempNazwa: "Gorący", kto: "Pani Krystyna", powod: "Spotkanie dziś o 15:30" },
          { wynik: 64, temp: "cieply", tempNazwa: "Ciepły", kto: "Pan Marek", powod: "Kontakt zaplanowany 2 dni temu" },
          { wynik: 41, temp: "zimny", tempNazwa: "Zimny", kto: "Pani Ewa", powod: "Nowy kontakt z ogłoszenia" },
        ],
      },
    },
    rozdzialy: ["Pulpit", "AI Coach", "Teren", "Biuro", "Start"],
    pulpit: {
      etykieta: "Pulpit",
      tytul: "Rano wiesz, do kogo dzwonić.",
      lead: "Program sam układa sprawy dnia. Każdy klient dostaje ocenę od 0 do 100 z etapu, terminów i historii kontaktu, a obok powód, dlaczego akurat dziś.",
      punkty: [
        { tytul: "Ocena klienta", tekst: "Gorący, ciepły albo zimny, liczony z tego, co już jest w CRM." },
        { tytul: "Kroki etapu", tekst: "Następny odblokowuje się po zrobieniu poprzedniego. Po domknięciu etapu program proponuje kolejny." },
        { tytul: "Bez zmiany ekranu", tekst: "Telefon, WhatsApp, notatka, przypomnienie za 3, 7 albo 14 dni i spotkanie prosto z pulpitu." },
      ],
    },
    wszystko: {
      etykieta: "Jeden program",
      tytul: "CRM, w którym jest wszystko. Nie potrzebujesz pięciu programów.",
      lead: "AgentSpace to CRM dla biur nieruchomości zbudowany wokół codziennej pracy agenta: od pierwszego telefonu, przez prezentację i umowę, po prowizję i wynik biura. Bez Excela, bez kartek, bez dokupowania osobnych narzędzi.",
      rzedy: [
        ["CRM klientów", "Priorytety na dziś", "Oferty na mapie", "Kalendarz", "Leady z reklam", "Poszukiwania", "Szybki wpis głosem", "Czat zespołu", "Asystent AI"],
        ["AI Coach", "Biblioteka technik", "Umowy i PDF", "Świadectwa energetyczne", "Prowizje", "Wycena z RCN", "Dyżur AI", "Faktury", "Koszty i wynik", "Strona www biura"],
      ],
      punkty: [
        { tytul: "Jedna baza", tekst: "Klient, oferta, rozmowa, umowa i prowizja są połączone. Nic nie przepisujesz dwa razy." },
        { tytul: "Codzienna praca", tekst: "Pulpit mówi, do kogo dzwonić, kalendarz pilnuje terminów, a AI pisze i podpowiada." },
        { tytul: "Całe biuro", tekst: "Role, uprawnienia, dziennik zdarzeń, koszty i wynik. Właściciel widzi wszystko na żywo." },
      ],
    },
    manifest:
      "Agent, który nie ćwiczy rozmów, uczy się na prawdziwych klientach. Każda przegrana rozmowa to oferta, która trafia do biura obok. AgentSpace daje zespołowi trening z AI, plan dnia i porządek w dokumentach, zanim zadzwoni telefon.",
    coach: {
      etykieta: "AI Coach",
      tytul: "Trening rozmów, zanim zadzwoni prawdziwy klient.",
      lead: "Rozmowa głosowa z klientem, który ma charakter, obiekcje i prawo powiedzieć nie.",
      kroki: [
        {
          tytul: "Dzwoni klient, który potrafi odmówić.",
          tekst: "Agent wybiera scenariusz: zimny telefon do właściciela, rozmowa o wyłączności, negocjacja prowizji. Klient AI odbiera głosem, przerywa, wątpi i zgłasza te same obiekcje, które agent słyszy w terenie.",
          cytat: { kto: "Klient AI", tresc: "Proszę Pana, sprzedam sama. Po co mi pośrednik i jego prowizja?" },
          dopisek: "Wolisz pisać? Ten sam trening działa na czacie, np. w tramwaju.",
        },
        {
          tytul: "Ocena w czterech obszarach.",
          tekst: "Po rozłączeniu przychodzi ocena: otwarcie rozmowy, kwalifikacja klienta, obsługa obiekcji i zamknięcie z następnym krokiem. Agent widzi, w którym miejscu traci klienta, a nie tylko to, że go stracił.",
        },
        {
          tytul: "Twoje zdania, poprawione.",
          tekst: "Kluczowe momenty to dosłowne zdania agenta z rozmowy, a obok lepsza wersja do powtórzenia. Przy następnym telefonie mówi już inaczej.",
        },
        {
          tytul: "Menedżer zadaje trening.",
          tekst: "Zadanie z progiem zaliczenia i terminem, np. trzy rozmowy o wyłączności do piątku. Menedżer dostaje powiadomienie, gdy agent zaliczy.",
        },
      ],
      liczby: [
        { wartosc: "24", opis: "scenariusze rozmów" },
        { wartosc: "15", opis: "charakterów klienta" },
        { wartosc: "2", opis: "tryby: głos albo czat" },
      ],
      telefon: { pora: "wtorek, 18:05", typ: "Trening z klientem AI", kto: "Pani Krystyna", gdzie: "sprzedaje sama, Podgórze", odrzuc: "później", odbierz: "rozmawiaj" },
      transkrypt: {
        tytul: "Rozmowa na żywo",
        linie: [
          { kto: "agent", tekst: "Dzień dobry, dzwonię w sprawie ogłoszenia mieszkania na Podgórzu." },
          { kto: "ai", tekst: "Od razu mówię: nie współpracuję z biurami. Sprzedam sama." },
          { kto: "agent", tekst: "Rozumiem. Mogę zadać dwa pytania o cenę, zanim się rozłączymy?" },
          { kto: "ai", tekst: "No dobrze, ale krótko. Mam dziś jeszcze trzy telefony od takich jak Pan." },
        ],
      },
    },
    dzien: {
      etykieta: "Dzień agenta",
      tytul: "Od pierwszej kawy do podpisanej umowy.",
      lead: "Program ma sens tylko wtedy, gdy agent otwiera go sam, bez przypominania. Dlatego zaczęliśmy od tego, jak naprawdę wygląda jego dzień.",
      momenty: [
        {
          pora: "8:30",
          tytul: "Wie, od czego zacząć.",
          tekst: "Pulpit pokazuje plan dnia: telefony do oddzwonienia, prezentacje i klientów, którzy czekają za długo. Cel dzienny wynika z rocznego, więc agent widzi, ile mu zostało dziś.",
          punkty: ["Plan dnia i zadania", "Cel rozpisany na dziś", "Powiadomienia na telefon"],
          obraz: "dzien-0830",
        },
        {
          pora: "12:10",
          tytul: "Notatka, zanim zapomni.",
          tekst: "Po prezentacji agent nagrywa głosówkę w samochodzie. Program zamienia ją na notatkę przy kliencie, termin kolejnego kontaktu i zadanie.",
          punkty: ["Szybki wpis głosem", "Historia kontaktu przy kliencie", "Tablica transakcji"],
          obraz: "dzien-1210",
        },
        {
          pora: "15:40",
          tytul: "Umowa w kilka minut.",
          tekst: "Umowa najmu okazjonalnego, pośrednictwa albo rezerwacyjna wypełnia się danymi z karty klienta i oferty. Program pilnuje kaucji, terminów i pouczeń, a PDF trafia od razu do karty.",
          punkty: ["11 wzorów umów i pism", "Zgody RODO z historią", "PDF prosto do karty"],
          obraz: "dzien-1540",
        },
        {
          pora: "18:00",
          tytul: "Jutro zadzwoni lepiej.",
          tekst: "Dziesięć minut rozmowy z klientem AI, który zgłasza te same obiekcje co prawdziwi. Agent dostaje ocenę i swoje zdania z poprawioną wersją.",
          punkty: ["Rozmowa głosem albo na czacie", "Trening na własnej ofercie", "Zadania od menedżera"],
          obraz: "dzien-1800",
        },
      ],
    },
    rozszerzenie: {
      tytul: "Wiesz, co dzieje się w biurze, także gdy Cię w nim nie ma.",
      lead: "Wyniki, koszty, prowizje i praca każdego agenta w jednym widoku właściciela.",
    },
    wlasciciel: {
      etykieta: "Dla właściciela",
      tytul: "Biuro w liczbach, nie w przeczuciach.",
      lead: "Większość programów dla biur pisze się dla agenta, a właściciel dostaje tabelkę ofert. Tu dostajesz to, czego potrzebujesz do prowadzenia firmy.",
      karty: [
        { tytul: "Koszty i wynik miesiąca", tekst: "Koszty biura, stałe opłaty dopisujące się same i wynik po wypłatach dla agentów. Paczka dla księgowej jednym kliknięciem.", zrzut: "finanse", href: "/produkt/koszty-i-wynik" },
        { tytul: "Prowizje i wypłaty", tekst: "Kto, za którą transakcję i ile. Mapa transakcji, a zaległe wypłaty nie znikają w kolejnym miesiącu.", zrzut: "prowizje", href: "/produkt/prowizje" },
        { tytul: "Zespół w jednym widoku", tekst: "Wyniki każdego agenta, średnia ocena z treningów i aktywność z ostatnich dni.", zrzut: "zespol", href: "/produkt/panel-wlasciciela" },
        { tytul: "Raporty bez Excela", tekst: "Ile zarobimy, gdzie sypie się lejek i skąd przychodzą pieniądze. Gotowy PDF na zebranie zespołu.", zrzut: "raporty", href: "/produkt/raporty" },
      ],
      lista: [
        { tytul: "Dziennik zdarzeń", tekst: "Kto usunął klienta, kto przepisał ofertę, kto pobrał eksport. Wpisów nie da się skasować z aplikacji." },
        { tytul: "Uprawnienia i ukryte kontakty", tekst: "Osiem stanowisk, od stażysty po księgową. Agent nie spisze numerów cudzych klientów przed odejściem." },
        { tytul: "Urlopy i zastępstwa", tekst: "Zastępca widzi klientów nieobecnego, a zadania z automatyzacji trafiają do niego, nie w próżnię." },
      ],
    },
    moduly: {
      etykieta: "Cały program",
      tytul: "I wszystko, czego biuro używa na co dzień.",
      lista: [
        { nazwa: "Pulpit", tytul: "Rano wiesz, do kogo dzwonić.", tekst: "Priorytety na dziś: ocena każdego klienta od 0 do 100, powód, dlaczego dziś, i kroki etapu. Notatka, przypomnienie i spotkanie bez zmiany ekranu.", zrzut: "pulpit" },
        { nazwa: "Klienci", tytul: "Klienci na tablicy etapów.", tekst: "Przeciągasz kartę, gdy klient idzie dalej. Historia kontaktu, zgody RODO i zadania są przy kliencie.", zrzut: "tablica" },
        { nazwa: "Oferty", tytul: "Oferty biura na mapie.", tekst: "Wspólna baza ofert ze zdjęciami, ceną i etapem sprzedaży. Każdą widać na mapie miasta.", zrzut: "oferty" },
        { nazwa: "Kalendarz", tytul: "Tydzień agenta na jednym ekranie.", tekst: "Telefony, prezentacje i zadania na osi czasu. Przeciągasz wpis, żeby zmienić termin.", zrzut: "kalendarz" },
        { nazwa: "Umowy", tytul: "Umowa wypełnia się sama.", tekst: "11 wzorów umów i pism, w tym najem okazjonalny. Dane z karty klienta i oferty, podgląd na żywo i PDF.", zrzut: "umowa" },
        { nazwa: "Leady", tytul: "Leady w jednej kolejce.", tekst: "Zgłoszenia z reklam, z widżetu wyceny i z rozmów. Widać, kto nie dostał jeszcze telefonu.", zrzut: "leady" },
        { nazwa: "Prowizje", tytul: "Prowizje z mapą transakcji.", tekst: "Transakcje w toku, zamknięte i przepadłe. Formularz podpowiada ofertę i klienta, a zarobek liczy się sam.", zrzut: "prowizje" },
        { nazwa: "Cele", tytul: "Cel roczny rozpisany na dziś.", tekst: "Ile telefonów, spotkań i umów potrzeba dziś, żeby dowieźć wynik roku.", zrzut: "cele" },
        { nazwa: "Wycena z RCN", tytul: "Cena z aktów notarialnych, nie z ogłoszeń.", tekst: "Transakcje z Rejestru Cen Nieruchomości w okolicy, korekty za piętro, stan i budynek, a na koniec raport PDF dla właściciela.", zrzut: "wycena" },
        { nazwa: "Biblioteka technik", tytul: "Techniki i skrypty z treningiem.", tekst: "36 technik rozmowy z przykładami z rynku i 10 skryptów krok po kroku. Każdą przećwiczysz z klientem AI jednym kliknięciem.", zrzut: "techniki" },
        { nazwa: "Dyżur AI", tytul: "Telefon odebrany w czasie prezentacji.", tekst: "Asystentka głosowa odbiera połączenia, których agent nie odebrał, i zapisuje lead z notatką z rozmowy.", zrzut: "dyzur" },
        { nazwa: "Świadectwa", tytul: "Świadectwo energetyczne z karty oferty.", tekst: "Formularz wypełnia się danymi nieruchomości, dodajesz zdjęcia budynku i wybierasz termin, nawet 6 godzin.", zrzut: "swiadectwa" },
      ],
    },
    liczby: {
      etykieta: "Konkretnie, bez obietnic",
      slajdy: [
        { wartosc: "24", opis: "scenariusze rozmów w AI Coachu, od zimnego telefonu po negocjację prowizji" },
        { wartosc: "11", opis: "wzorów umów i pism, w tym najem okazjonalny z pouczeniami" },
        { wartosc: "8", opis: "stanowisk z osobnymi uprawnieniami, od stażysty po księgową" },
        { wartosc: "0 zł", opis: "za eksport całej bazy biura do Excela, w każdej chwili" },
      ],
    },
    dlaKogo: {
      tytul: "Dla kogo jest AgentSpace",
      lead: "Od agenta, który pracuje sam, po biuro z kilkoma zespołami.",
      karty: [
        { tytul: "Biura z zespołem", tekst: "Wspólna baza klientów i ofert, tablica transakcji i trening rozmów dla każdego agenta.", obraz: "kogo-biuro" },
        { tytul: "Właściciele biur", tekst: "Koszty, prowizje, wynik miesiąca i dziennik zdarzeń. Widzisz biuro, a nie tylko listę ofert.", obraz: "kogo-wlasciciel" },
        { tytul: "Agenci pracujący sami", tekst: "Plan dnia, umowy w kilka minut i trening, po którym kolejny telefon idzie lepiej.", obraz: "kogo-agent" },
      ],
    },
    porownanie: {
      etykieta: "Na tle innych",
      tytul: "Jeden program zamiast pięciu.",
      lead: "Typowy CRM prowadzi bazę. Resztę biuro robi w Excelu, Wordzie i na kartce. U nas to jedno miejsce.",
      kolumny: ["Typowy CRM", "Excel, Word, kartka", "AgentSpace"],
      wiersze: [
        { cecha: "Baza klientów i etapy sprzedaży", wartosci: ["tak", "częściowo", "tak"] },
        { cecha: "Wspólna baza ofert z mapą", wartosci: ["tak", "nie", "tak"] },
        { cecha: "Umowy wypełniane danymi klienta (PDF)", wartosci: ["rzadko", "ręcznie", "tak"] },
        { cecha: "Prowizje i wypłaty agentów", wartosci: ["rzadko", "ręcznie", "tak"] },
        { cecha: "Koszty i wynik biura", wartosci: ["nie", "ręcznie", "tak"] },
        { cecha: "Trening rozmów głosem z AI", wartosci: ["nie", "nie", "tak"] },
        { cecha: "Role, uprawnienia i dziennik zdarzeń", wartosci: ["częściowo", "nie", "tak"] },
        { cecha: "Ceny podane na stronie", wartosci: ["rzadko", "nie dotyczy", "tak"] },
      ],
      nota: "Porównanie dotyczy typowych kategorii narzędzi, nie konkretnych firm.",
    },
    cennik: {
      etykieta: "Cennik",
      tytul: "Jeden abonament. Cały program.",
      lead: `${dni} dni pełnego dostępu za darmo, bez karty. Wybierz okres płatności i zobacz, ile oszczędzasz przy płatności za pół roku albo za rok. Ceny netto.`,
      miesiac: "zł netto / mc",
      od: "od",
      polecany: "Najczęściej wybierany",
      wybierz: "Zacznij od tego",
      pelny: "Pełny cennik i dodatki",
    },
    start: {
      etykieta: "Start",
      tytul: "Zaczynasz w trzech krokach.",
      lead: "Program działa w przeglądarce i na telefonie. Nic nie instalujesz na komputerach biura.",
      kroki: [
        { tytul: "Załóż konto biura", tekst: `E-mail, hasło i nazwa biura. ${dni} dni pełnego dostępu, bez karty płatniczej.` },
        { tytul: "Przenieś bazę", tekst: "Klienci i oferty z Excela albo poprzedniego programu. Kolumny dopasujesz przy imporcie, a we wdrożeniu pomożemy." },
        { tytul: "Zaproś zespół", tekst: "Każdy dostaje własne konto i stanowisko. Agent widzi swoich klientów, Ty widzisz całe biuro." },
      ],
      cta: "Załóż konto biura",
    },
    faq: { tytul: "Pytania, które słyszymy najczęściej" },
    koniec: {
      tytul: "Sprawdź na swoim biurze.",
      lead: `${dni} dni pełnego dostępu. Jeśli nie zostaniesz, eksportujesz całą bazę jednym kliknięciem.`,
      pole: "Twój e-mail służbowy",
      przycisk: "Załóż konto",
      alt: "Wolisz, żeby ktoś pokazał?",
      altLink: "Umów 20 minut pokazu",
    },
    stopka: { gora: "Wróć na górę strony" },
  };
}

function en(dni: number): NowaStrona {
  return {
    meta: {
      title: "AgentSpace | Real estate agency software with AI call training",
      description: `AI client call training, CRM, listings on a map, contracts as PDF, commissions and agency results in one app. ${dni} days free, no card.`,
    },
    nav: {
      linki: [
        { label: "AI Coach", href: "#coach" },
        { label: "Agent's day", href: "#dzien" },
        { label: "Owners", href: "#wlasciciel" },
        { label: "Modules", href: "#moduly" },
        { label: "Pricing", href: "#cennik" },
        { label: "FAQ", href: "#pytania" },
      ],
      login: "Log in",
      cta: "Try for free",
      menu: "Open menu",
      zamknij: "Close menu",
    },
    hero: {
      linie: ["A prepared agent", "sells more."],
      pod: "A CRM for real estate agencies. All daily work in one app.",
      lead: "Clients, listings, calendar, contracts, commissions, valuations from notarial deeds and call training with an AI client. Agents stop jumping between five apps, and owners see the whole agency in one place.",
      cta: `Try ${dni} days free`,
      cta2: "Open the demo",
      podCta: "No credit card. Full access to every module.",
      rozmowa: { etykieta: "Training with an AI client", czas: "02:41", kto: "Apartment owner", gdzie: "Podgórze, 3 rooms" },
      ocena: {
        tytul: "Call score",
        wynik: "7.8",
        obszary: [
          ["Opening", 8],
          ["Qualifying", 7],
          ["Objections", 8],
          ["Closing", 8],
        ],
      },
      priorytety: {
        tytul: "This morning",
        karty: [
          { wynik: 82, temp: "goracy", tempNazwa: "Hot", kto: "Mrs Krystyna", powod: "Meeting today at 3:30 pm" },
          { wynik: 64, temp: "cieply", tempNazwa: "Warm", kto: "Mr Marek", powod: "Follow-up due 2 days ago" },
          { wynik: 41, temp: "zimny", tempNazwa: "Cold", kto: "Mrs Ewa", powod: "New lead from a listing" },
        ],
      },
    },
    rozdzialy: ["Dashboard", "AI Coach", "Field", "Agency", "Start"],
    pulpit: {
      etykieta: "Dashboard",
      tytul: "In the morning you know who to call.",
      lead: "The app lines up the day for you. Every client gets a score from 0 to 100 based on stage, dates and contact history, with the reason it matters today.",
      punkty: [
        { tytul: "Client score", tekst: "Hot, warm or cold, calculated from what is already in the CRM." },
        { tytul: "Stage steps", tekst: "The next step unlocks after the previous one. When a stage is done, the app suggests the next." },
        { tytul: "Without leaving the screen", tekst: "Call, WhatsApp, note, reminder in 3, 7 or 14 days and meetings straight from the dashboard." },
      ],
    },
    wszystko: {
      etykieta: "One app",
      tytul: "A CRM with everything in it. You don't need five apps.",
      lead: "AgentSpace is a CRM for real estate agencies built around an agent's daily work: from the first call, through viewings and contracts, to commissions and agency results. No spreadsheets, no paper, no extra tools to buy.",
      rzedy: [
        ["Client CRM", "Today's priorities", "Listings on a map", "Calendar", "Ad leads", "Buyer searches", "Voice notes", "Team chat", "AI assistant"],
        ["AI Coach", "Technique library", "Contracts and PDF", "Commissions", "Valuation from deeds", "AI receptionist", "Invoices", "Costs and results", "Agency website"],
      ],
      punkty: [
        { tytul: "One database", tekst: "Client, listing, call, contract and commission are linked. Nothing is typed twice." },
        { tytul: "Daily work", tekst: "The dashboard tells you who to call, the calendar keeps dates, and AI writes and suggests." },
        { tytul: "The whole agency", tekst: "Roles, permissions, audit log, costs and results. The owner sees everything live." },
      ],
    },
    manifest:
      "An agent who never practices calls learns on real clients. Every lost conversation is a listing that goes to the agency next door. AgentSpace gives your team AI training, a daily plan and paperwork in order, before the phone rings.",
    coach: {
      etykieta: "AI Coach",
      tytul: "Call practice before the real client calls.",
      lead: "A voice conversation with a client who has a personality, objections and the right to say no.",
      kroki: [
        {
          tytul: "A client who can say no.",
          tekst: "The agent picks a scenario: a cold call to an owner, an exclusivity talk, a commission negotiation. The AI client answers by voice, interrupts, doubts and raises the same objections agents hear in the field.",
          cytat: { kto: "AI client", tresc: "I'll sell it myself. Why would I need an agent and their fee?" },
          dopisek: "Prefer typing? The same training works in chat, e.g. on the tram.",
        },
        {
          tytul: "A score in four areas.",
          tekst: "After hanging up, the agent gets a score: opening, qualifying the client, handling objections and closing with a next step. They see where they lose the client, not only that they lost them.",
        },
        {
          tytul: "Your sentences, improved.",
          tekst: "Key moments are the agent's exact sentences from the call, next to a better version to repeat. On the next call they already say it differently.",
        },
        {
          tytul: "The manager assigns training.",
          tekst: "A task with a pass threshold and a deadline, e.g. three exclusivity calls by Friday. The manager is notified when the agent passes.",
        },
      ],
      liczby: [
        { wartosc: "24", opis: "call scenarios" },
        { wartosc: "15", opis: "client personalities" },
        { wartosc: "2", opis: "modes: voice or chat" },
      ],
      telefon: { pora: "Tuesday, 6:05 PM", typ: "Training with an AI client", kto: "Mrs. Krystyna", gdzie: "selling alone, Podgórze", odrzuc: "later", odbierz: "talk" },
      transkrypt: {
        tytul: "Live conversation",
        linie: [
          { kto: "agent", tekst: "Good afternoon, I'm calling about your apartment listing in Podgórze." },
          { kto: "ai", tekst: "Let me stop you there: I don't work with agencies. I'm selling it myself." },
          { kto: "agent", tekst: "I understand. May I ask two questions about the price before we hang up?" },
          { kto: "ai", tekst: "Fine, but make it quick. I have three more calls like yours today." },
        ],
      },
    },
    dzien: {
      etykieta: "An agent's day",
      tytul: "From the first coffee to a signed contract.",
      lead: "Software only works if agents open it on their own, without reminders. So we started with what their day really looks like.",
      momenty: [
        {
          pora: "8:30",
          tytul: "Knows where to start.",
          tekst: "The dashboard shows the daily plan: calls to return, viewings and clients waiting too long. The daily goal comes from the yearly one, so the agent sees what is left for today.",
          punkty: ["Daily plan and tasks", "Goal broken down to today", "Phone notifications"],
          obraz: "dzien-0830",
        },
        {
          pora: "12:10",
          tytul: "A note before they forget.",
          tekst: "After a viewing the agent records a voice memo in the car. The app turns it into a note on the client, the next contact date and a task.",
          punkty: ["Quick voice entry", "Contact history on the client", "Deal board"],
          obraz: "dzien-1210",
        },
        {
          pora: "3:40 PM",
          tytul: "A contract in minutes.",
          tekst: "Occasional lease, brokerage or reservation agreements fill in with data from the client and listing cards. The app checks deposits, deadlines and notices, and the PDF lands on the card.",
          punkty: ["11 contract and letter templates", "GDPR consents with history", "PDF straight to the card"],
          obraz: "dzien-1540",
        },
        {
          pora: "6:00 PM",
          tytul: "Tomorrow's call goes better.",
          tekst: "Ten minutes with an AI client who raises the same objections as real ones. The agent gets a score and their own sentences with an improved version.",
          punkty: ["Voice or chat", "Practice on your own listing", "Tasks from the manager"],
          obraz: "dzien-1800",
        },
      ],
    },
    rozszerzenie: {
      tytul: "Know what happens in your agency, even when you're not there.",
      lead: "Results, costs, commissions and every agent's work in one owner view.",
    },
    wlasciciel: {
      etykieta: "For owners",
      tytul: "Your agency in numbers, not hunches.",
      lead: "Most agency software is built for agents, and owners get a table of listings. Here you get what you need to run the business.",
      karty: [
        { tytul: "Costs and monthly result", tekst: "Agency costs, recurring fees added automatically and the result after agent payouts. A package for your accountant in one click.", zrzut: "finanse", href: "/produkt/koszty-i-wynik" },
        { tytul: "Commissions and payouts", tekst: "Who, for which deal and how much. A deal map, and overdue payouts don't vanish next month.", zrzut: "prowizje", href: "/produkt/prowizje" },
        { tytul: "The team in one view", tekst: "Each agent's results, average training score and recent activity.", zrzut: "zespol", href: "/produkt/panel-wlasciciela" },
        { tytul: "Reports without Excel", tekst: "What we will earn, where the funnel leaks and where money comes from. A ready PDF for the team meeting.", zrzut: "raporty", href: "/produkt/raporty" },
      ],
      lista: [
        { tytul: "Event log", tekst: "Who deleted a client, who reassigned a listing, who downloaded an export. Entries can't be deleted from the app." },
        { tytul: "Permissions and hidden contacts", tekst: "Eight roles, from intern to accountant. An agent can't copy other agents' client numbers before leaving." },
        { tytul: "Leave and cover", tekst: "The covering agent sees the absent agent's clients, and automated tasks go to them, not into the void." },
      ],
    },
    moduly: {
      etykieta: "The whole app",
      tytul: "And everything an agency uses every day.",
      lista: [
        { nazwa: "Dashboard", tytul: "In the morning you know who to call.", tekst: "Today's priorities: every client scored from 0 to 100, the reason it matters today, and the steps of the stage. Note, reminder and meeting without leaving the screen.", zrzut: "pulpit" },
        { nazwa: "Clients", tytul: "Clients on a stage board.", tekst: "Drag the card when a client moves forward. Contact history, GDPR consents and tasks live on the client.", zrzut: "tablica" },
        { nazwa: "Listings", tytul: "Agency listings on a map.", tekst: "A shared listing base with photos, price and sales stage. Every listing on the city map.", zrzut: "oferty" },
        { nazwa: "Calendar", tytul: "An agent's week on one screen.", tekst: "Calls, viewings and tasks on a timeline. Drag an entry to change the date.", zrzut: "kalendarz" },
        { nazwa: "Contracts", tytul: "The contract fills itself.", tekst: "11 contract and letter templates, including occasional lease. Data from client and listing cards, live preview and PDF.", zrzut: "umowa" },
        { nazwa: "Leads", tytul: "Leads in one queue.", tekst: "Inquiries from ads, the valuation widget and calls. You see who hasn't been called yet.", zrzut: "leady" },
        { nazwa: "Commissions", tytul: "Commissions with a deal map.", tekst: "Deals in progress, closed and lost. The form suggests the listing and client, and earnings calculate themselves.", zrzut: "prowizje" },
        { nazwa: "Goals", tytul: "The yearly goal, broken down to today.", tekst: "How many calls, meetings and contracts you need today to hit the year.", zrzut: "cele" },
        { nazwa: "Valuation", tytul: "Prices from notarial deeds, not listings.", tekst: "Transactions from the public price register nearby, adjustments for floor, condition and building, and a PDF report for the owner.", zrzut: "wycena" },
        { nazwa: "Technique library", tytul: "Techniques and scripts with practice.", tekst: "36 conversation techniques with real estate examples and 10 step-by-step call scripts. Practise any of them with the AI client in one click.", zrzut: "techniki" },
        { nazwa: "AI on call", tytul: "Calls answered during viewings.", tekst: "A voice assistant picks up calls the agent missed and saves a lead with a call summary.", zrzut: "dyzur" },
        { nazwa: "Energy certificates", tytul: "Order an energy certificate from the listing.", tekst: "The form fills in from the property, you add building photos and pick a deadline, as fast as 6 hours.", zrzut: "swiadectwa" },
      ],
    },
    liczby: {
      etykieta: "Specifics, not promises",
      slajdy: [
        { wartosc: "24", opis: "AI Coach call scenarios, from cold calls to commission negotiations" },
        { wartosc: "11", opis: "contract and letter templates, including occasional lease" },
        { wartosc: "8", opis: "roles with separate permissions, from intern to accountant" },
        { wartosc: "0 zł", opis: "to export your whole agency database to Excel, any time" },
      ],
    },
    dlaKogo: {
      tytul: "Who AgentSpace is for",
      lead: "From a solo agent to an agency with several teams.",
      karty: [
        { tytul: "Agencies with a team", tekst: "A shared client and listing base, a deal board and call training for every agent.", obraz: "kogo-biuro" },
        { tytul: "Agency owners", tekst: "Costs, commissions, monthly results and an event log. You see the agency, not just a list of listings.", obraz: "kogo-wlasciciel" },
        { tytul: "Solo agents", tekst: "A daily plan, contracts in minutes and training that makes the next call better.", obraz: "kogo-agent" },
      ],
    },
    porownanie: {
      etykieta: "Compared",
      tytul: "One app instead of five.",
      lead: "A typical CRM keeps the database. The rest happens in Excel, Word and on paper. Here it is one place.",
      kolumny: ["Typical CRM", "Excel, Word, paper", "AgentSpace"],
      wiersze: [
        { cecha: "Client base and sales stages", wartosci: ["yes", "partly", "yes"] },
        { cecha: "Shared listing base with a map", wartosci: ["yes", "no", "yes"] },
        { cecha: "Contracts filled with client data (PDF)", wartosci: ["rarely", "by hand", "yes"] },
        { cecha: "Commissions and agent payouts", wartosci: ["rarely", "by hand", "yes"] },
        { cecha: "Agency costs and results", wartosci: ["no", "by hand", "yes"] },
        { cecha: "AI voice call training", wartosci: ["no", "no", "yes"] },
        { cecha: "Roles, permissions and event log", wartosci: ["partly", "no", "yes"] },
        { cecha: "Prices published on the website", wartosci: ["rarely", "n/a", "yes"] },
      ],
      nota: "The comparison covers typical tool categories, not specific companies.",
    },
    cennik: {
      etykieta: "Pricing",
      tytul: "One subscription. The whole app.",
      lead: `${dni} days of full access for free, no card. Net prices per month, cheaper when paid for six months or a year.`,
      miesiac: "PLN net / mo",
      od: "from",
      polecany: "Most popular",
      wybierz: "Start with this",
      pelny: "Full pricing and add-ons",
    },
    start: {
      etykieta: "Getting started",
      tytul: "Three steps to start.",
      lead: "The app runs in the browser and on phones. Nothing to install on agency computers.",
      kroki: [
        { tytul: "Create an agency account", tekst: `Email, password and agency name. ${dni} days of full access, no credit card.` },
        { tytul: "Move your data", tekst: "Clients and listings from Excel or your previous software. You match columns during import, and we help with onboarding." },
        { tytul: "Invite your team", tekst: "Everyone gets their own account and role. Agents see their clients, you see the whole agency." },
      ],
      cta: "Create an agency account",
    },
    faq: { tytul: "Questions we hear most often" },
    koniec: {
      tytul: "Try it on your own agency.",
      lead: `${dni} days of full access. If you don't stay, export your whole database in one click.`,
      pole: "Your work email",
      przycisk: "Create account",
      alt: "Prefer a walkthrough?",
      altLink: "Book a 20-minute demo",
    },
    stopka: { gora: "Back to top" },
  };
}
