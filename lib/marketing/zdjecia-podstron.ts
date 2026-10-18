// Zdjęcia podstron marketingu. Z tej listy powstaje też plik z promptami do
// Nano Banana (prompty/podstrony.md), więc opis sceny i nazwa pliku są w jednym miejscu.
// Dopóki zdjęcia nie ma w public/strona/podstrony, strona pokazuje `zapas`.
// Po wgraniu pliku dopisz jego klucz do GOTOWE.

export type Zdjecie = {
  klucz: string;
  gdzie: string;
  proporcje: "16:9" | "4:3" | "3:4" | "21:9" | "1:1";
  scena: string;
  zapas: string;
};

/** Klucze zdjęć, które już leżą w public/strona/podstrony/<klucz>.webp. */
const GOTOWE = new Set<string>([
  "naglowek-produkt",
  "naglowek-cennik",
  "naglowek-blog",
  "naglowek-kontakt",
  "naglowek-demo",
  "naglowek-dla-agentow",
  "naglowek-dla-wlascicieli",
  "naglowek-integracje",
  "naglowek-wzory",
  "naglowek-crm",
  "naglowek-cele",
  "naglowek-prowizje",
  "naglowek-ai-coach",
  "naglowek-panel-wlasciciela",
  "naglowek-nieruchomosci",
  "naglowek-leady",
  "naglowek-dzialania",
  "naglowek-poszukiwania",
  "naglowek-dokumenty",
  "naglowek-ofertowka",
  "naglowek-kalkulatory",
  "naglowek-faktury",
  "naglowek-raporty",
  "naglowek-role-i-uprawnienia",
  "naglowek-umowa-najmu-okazjonalnego",
  "naglowek-tablica-transakcji",
  "naglowek-czat-zespolu",
  "naglowek-urlopy-i-zastepstwa",
  "naglowek-automatyzacje",
  "naglowek-kalkulator-remontu",
  "naglowek-rodo",
  "naglowek-koszty-i-wynik",
  "naglowek-wycena-rcn",
  "naglowek-dyzur-ai",
  "naglowek-swiadectwa-energetyczne",
  "naglowek-biblioteka-technik",
  "scena-crm",
  "scena-cele",
  "scena-prowizje",
  "scena-ai-coach",
  "scena-nieruchomosci",
  "scena-leady",
  "scena-dzialania",
  "scena-poszukiwania",
  "scena-dokumenty",
  "scena-ofertowka",
  "scena-kalkulatory",
  "scena-faktury",
  "scena-raporty",
  "scena-role-i-uprawnienia",
  "scena-umowa-najmu-okazjonalnego",
  "scena-tablica-transakcji",
  "scena-czat-zespolu",
  "scena-urlopy-i-zastepstwa",
  "scena-automatyzacje",
  "scena-rodo",
  "scena-kalkulator-remontu",
  "scena-koszty-i-wynik",
  "scena-wycena-rcn",
  "scena-panel-wlasciciela",
]);

const N = (klucz: string, gdzie: string, scena: string, zapas: string): Zdjecie => ({ klucz, gdzie, proporcje: "16:9", scena, zapas });
const S = (klucz: string, gdzie: string, scena: string, zapas: string): Zdjecie => ({ klucz, gdzie, proporcje: "4:3", scena, zapas });

export const ZDJECIA: Zdjecie[] = [
  /* ── Nagłówki stron ogólnych ── */
  N("naglowek-produkt", "/produkt, tło nagłówka", "Szeroki kadr nowoczesnego biura nieruchomości nocą, wysoko nad miastem. Długi stół, na nim laptop z jasnym ekranem i telefon. Za szybą rozmyte światła Krakowa. Nikogo przy stole, miejsce czeka na pracę.", "/wzory/miasto-noc.jpg"),
  N("naglowek-cennik", "/cennik, tło nagłówka", "Spokojny kadr z góry na jasny dębowy stół: otwarty notes z odręcznymi liczbami, kubek kawy, klucze do mieszkania z zielonym brelokiem, telefon ekranem w dół. Miękkie poranne światło z okna, długie cienie.", "/zdjecia/poranek-przy-kawie.jpg"),
  N("naglowek-o-nas", "/o-nas, tło nagłówka (zostaje zdjęcie bramy biura, bez generowania)", "Brama krakowskiej kamienicy o zmierzchu, ciepłe światło z klatki schodowej, mokry bruk po deszczu odbija latarnie. Kadr z poziomu oczu, lekko z boku.", "/biuro/brama-szer.jpg"),
  N("naglowek-blog", "/blog, tło nagłówka", "Biurko przy oknie w mieszkaniu w kamienicy, stos wydrukowanych umów, okulary, ołówek, tablet z wykresem. Wieczorne niebieskie światło z zewnątrz i ciepła lampka.", "/zdjecia/plan-dnia.jpg"),
  N("naglowek-kontakt", "/kontakt, tło nagłówka", "Dwie filiżanki kawy na marmurowym stoliku w kawiarni na krakowskim Kazimierzu, w tle rozmyte okno na ulicę i rower. Ktoś właśnie wstał, krzesło odsunięte.", "/zdjecia/miedzy-spotkaniami.jpg"),
  N("naglowek-demo", "/demo, tło nagłówka", "Dłoń trzymająca smartfon nad stołem, na ekranie rozmyty interfejs aplikacji w granacie i zieleni. W tle rozmyty salon mieszkania na sprzedaż w dziennym świetle.", "/zdjecia/nowe/dzien-teren.jpg"),
  N("naglowek-dla-agentow", "/dla-agentow, tło nagłówka", "Agentka nieruchomości (ok. 30 lat) idzie szybkim krokiem chodnikiem przy kamienicach, telefon przy uchu, teczka pod pachą. Rano, słońce nisko, ruch na ulicy rozmyty.", "/zdjecia/nowe/hero-teren.jpg"),
  N("naglowek-dla-wlascicieli", "/dla-wlascicieli, tło nagłówka", "Właściciel biura (ok. 45 lat) stoi przy szybie w swoim biurze i patrzy na zespół przy biurkach za szklaną ścianą. Wieczór, w biurze ciepłe światło. Widziany od tyłu, z boku.", "/zdjecia/nowe/wlasciciel.jpg"),
  N("naglowek-integracje", "/integracje, tło nagłówka", "Abstrakcyjne zbliżenie kabli światłowodowych i złączy w ciemności, punkty światła w zieleni i turkusie, mała głębia ostrości. Bez napisów i logotypów.", "/wzory/szklo.jpg"),
  N("naglowek-wzory", "/wzory (strony www dla biur), tło nagłówka", "Biurko projektanta: duży monitor z rozmytą stroną internetową biura nieruchomości ze zdjęciem salonu, obok próbki papieru i tablet z rysikiem. Wieczór, światło monitora na twarzy nieobecnej osoby.", "/wzory/salon-widok.jpg"),

  /* ── Nagłówki modułów ── */
  N("naglowek-crm", "/produkt/crm", "Ręka agenta przewija na tablecie kartę klienta (rozmyty interfejs), obok segregator z ofertami i wizytówki. Stół w jasnym biurze.", "/wzory/lounge.jpg"),
  N("naglowek-cele", "/produkt/cele", "Biegaczka na pustym bulwarze nad Wisłą o świcie, Wawel w oddali we mgle. Szeroki kadr, dużo nieba.", "/wzory/zachod.jpg"),
  N("naglowek-prowizje", "/produkt/prowizje", "Podpisany akt notarialny i dwa długopisy na stole w kancelarii, obok klucze. Ciepłe, eleganckie wnętrze, mała głębia ostrości.", "/zdjecia/transakcja.jpg"),
  N("naglowek-ai-coach", "/produkt/ai-coach", "Agent w słuchawkach z mikrofonem siedzi w pustej sali konferencyjnej nocą i mówi, gestykulując. Przed nim laptop, na ścianie delikatna poświata turkusu. Kadr kinowy.", "/strona/ilustracje/coach-telefon-tlo.webp"),
  N("naglowek-panel-wlasciciela", "/produkt/panel-wlasciciela", "Duży ekran w sali narad z rozmytymi wykresami słupkowymi w zieleni, dwie osoby rozmawiają przy nim w półmroku. Widok zza ich pleców.", "/zdjecia/nowe/zespol-odprawa.jpg"),
  N("naglowek-nieruchomosci", "/produkt/nieruchomosci", "Jasny, pusty salon w odnowionej kamienicy, wysokie okna, drewniana podłoga, statyw fotografa z aparatem na środku.", "/wzory/wnetrze-slonce.jpg"),
  N("naglowek-leady", "/produkt/leady", "Telefon leżący na stole świeci powiadomieniem, obok kawa i notes. Wieczór, ciemne tło, ekran jedynym źródłem światła.", "/wzory/miasto-noc.jpg"),
  N("naglowek-dzialania", "/produkt/dzialania", "Odręczna lista zadań w notesie z kilkoma odhaczonymi pozycjami, obok kalendarz biurkowy i smartfon. Ostre poranne światło.", "/zdjecia/plan-dnia.jpg"),
  N("naglowek-poszukiwania", "/produkt/poszukiwania", "Para (ok. 35 lat) ogląda mieszkanie, kobieta patrzy przez okno na podwórko, mężczyzna trzyma wydruk planu. Naturalne światło, ujęcie z głębi pokoju.", "/zdjecia/prezentacja.jpg"),
  N("naglowek-dokumenty", "/produkt/dokumenty", "Stos umów z zieloną zakładką, pióro wieczne i pieczątka na skórzanym podkładzie. Elegancko, chłodne światło.", "/zdjecia/pozyskanie.jpg"),
  N("naglowek-ofertowka", "/produkt/ofertowka", "Wydrukowana broszura oferty mieszkania z dużym zdjęciem salonu leży otwarta na stole obok tabletu z tą samą ofertą.", "/wzory/salon.jpg"),
  N("naglowek-kalkulatory", "/produkt/kalkulatory", "Zbliżenie: kalkulator, wydruk harmonogramu kredytu, ołówek i okulary. Ciepłe światło lampki, reszta w ciemności.", "/wzory/kuchnia.jpg"),
  N("naglowek-faktury", "/produkt/faktury", "Segregator z fakturami i laptop z rozmytą tabelą, obok kubek. Porządne, minimalistyczne biuro, dzień.", "/zdjecia/wnetrze-biura.jpg"),
  N("naglowek-raporty", "/produkt/raporty", "Wydrukowany raport z wykresami leży na stole obok tabletu, ręka zaznacza zakreślaczem jedną liczbę.", "/zdjecia/pierwsze-wnioski.jpg"),
  N("naglowek-role-i-uprawnienia", "/produkt/role-i-uprawnienia", "Pęk kluczy różnej wielkości na drewnianym blacie, jeden klucz z zieloną etykietą wysunięty na pierwszy plan. Mocny kontrast.", "/biuro/wejscie.jpg"),
  N("naglowek-umowa-najmu-okazjonalnego", "/produkt/umowa-najmu-okazjonalnego", "Przekazanie kluczy w drzwiach mieszkania: dłoń właściciela podaje klucze najemcy, w tle kartony przeprowadzkowe.", "/zdjecia/odbior-kluczy.jpg"),
  N("naglowek-tablica-transakcji", "/produkt/tablica-transakcji", "Ściana w biurze z rzędami żółtych i zielonych karteczek ułożonych w kolumny, ktoś przesuwa jedną. Rozmyty ruch dłoni.", "/zdjecia/zespol.jpg"),
  N("naglowek-czat-zespolu", "/produkt/czat-zespolu", "Trzy telefony leżą obok siebie na stole w biurze, na każdym świeci rozmyta rozmowa. Wieczór.", "/zdjecia/zespol.jpg"),
  N("naglowek-urlopy-i-zastepstwa", "/produkt/urlopy-i-zastepstwa", "Walizka przy drzwiach mieszkania i kurtka na wieszaku, przez okno widać słoneczne podwórko. Spokojny, wakacyjny nastrój.", "/wzory/taras.jpg"),
  N("naglowek-automatyzacje", "/produkt/automatyzacje", "Długa ekspozycja: smugi świateł samochodów na moście nocą, miasto w tle. Ruch, który dzieje się sam.", "/wzory/wieza.jpg"),
  N("naglowek-kalkulator-remontu", "/produkt/kalkulator-remontu", "Mieszkanie w trakcie remontu: drabina, wałek do farby, folia na podłodze, światło dnia przez okno.", "/wzory/loft.jpg"),
  N("naglowek-rodo", "/produkt/rodo", "Zamknięta na klucz szafa na dokumenty w biurze, mosiężny zamek w ostrości, reszta rozmyta.", "/wzory/schody.jpg"),
  N("naglowek-koszty-i-wynik", "/produkt/koszty-i-wynik", "Zbliżenie na wykres liniowy na ekranie laptopa (rozmyty), obok paragon i długopis. Granatowe tło, zielona linia.", "/zdjecia/wnetrze-biura.jpg"),
  N("naglowek-wycena-rcn", "/produkt/wycena-rcn", "Widok z góry (dron) na kwartał krakowskich kamienic i nowego budynku, miękkie wieczorne światło, wyraźne dachy i podwórka.", "/wzory/kamienica.jpg"),
  N("naglowek-dyzur-ai", "/produkt/dyzur-ai", "Telefon biurowy na pustym biurku wieczorem, ekran świeci przychodzącym połączeniem, krzesło puste. Za oknem ciemne miasto.", "/wzory/miasto-noc.jpg"),
  N("naglowek-swiadectwa-energetyczne", "/produkt/swiadectwa-energetyczne", "Elewacja ocieplonego bloku z nowymi oknami w słońcu, kadr od dołu, czyste niebo, energooszczędny charakter.", "/wzory/dziedziniec.jpg"),
  N("naglowek-biblioteka-technik", "/produkt/biblioteka-technik", "Półka z kilkoma książkami o negocjacjach (grzbiety bez czytelnych napisów), na niej słuchawki i karteczki z notatkami. Ciepłe światło.", "/zdjecia/rozmowa-audyt.jpg"),

  /* ── Sceny w treści modułów (sekcja „Dlaczego to boli”) ── */
  S("scena-crm", "/produkt/crm, sekcja problemu", "Biurko agenta zawalone karteczkami z numerami telefonów, dwa telefony i otwarty Excel na laptopie. Chaos, ale realistyczny.", "/zdjecia/wnetrze-biura.jpg"),
  S("scena-cele", "/produkt/cele, sekcja problemu", "Tablica korkowa z kalendarzem miesiąca, kilka dni przekreślonych, karteczka „cel” bez liczby. Biuro, dzień.", "/zdjecia/plan-dnia.jpg"),
  S("scena-prowizje", "/produkt/prowizje, sekcja problemu", "Dwie osoby nad wydrukiem arkusza z liczbami, jedna wskazuje palcem pozycję, druga ma założone ręce.", "/zdjecia/rozmowa-audyt.jpg"),
  S("scena-ai-coach", "/produkt/ai-coach, sekcja problemu", "Młody agent siedzi w samochodzie z telefonem w dłoni, waha się przed wybraniem numeru. Przez szybę ulica osiedla.", "/zdjecia/nowe/dzien-trening.jpg"),
  S("scena-panel-wlasciciela", "/produkt/panel-wlasciciela, sekcja problemu", "Właściciel biura przegląda wieczorem stos kartek i trzy różne aplikacje na telefonie, zmęczony, w ciepłym świetle lampy.", "/zdjecia/nowe/wlasciciel.jpg"),
  S("scena-nieruchomosci", "/produkt/nieruchomosci, sekcja problemu", "Ekran laptopa z wieloma rozmytymi folderami zdjęć, obok aparat fotograficzny i karta pamięci.", "/wzory/salon.jpg"),
  S("scena-leady", "/produkt/leady, sekcja problemu", "Telefon z kilkoma nieodebranymi połączeniami na ekranie (bez czytelnych numerów), leży na siedzeniu samochodu.", "/zdjecia/miedzy-spotkaniami.jpg"),
  S("scena-dzialania", "/produkt/dzialania, sekcja problemu", "Agentka patrzy na zegarek na ulicy, w drugiej ręce teczka i telefon, późne popołudnie.", "/zdjecia/nowe/dzien-rano.jpg"),
  S("scena-poszukiwania", "/produkt/poszukiwania, sekcja problemu", "Para przy kuchennym stole przegląda portal z mieszkaniami na laptopie, znudzona, wieczór.", "/wzory/kuchnia.jpg"),
  S("scena-dokumenty", "/produkt/dokumenty, sekcja problemu", "Drukarka wydaje kolejną kartkę, obok stos umów z poprawkami długopisem.", "/zdjecia/pozyskanie.jpg"),
  S("scena-ofertowka", "/produkt/ofertowka, sekcja problemu", "Agent robi zdjęcie salonu telefonem, lekko krzywo, w pokoju bałagan po właścicielu.", "/wzory/salon-widok.jpg"),
  S("scena-kalkulatory", "/produkt/kalkulatory, sekcja problemu", "Klient i agent przy stole liczą na kartce koszty zakupu, kartka pełna skreśleń.", "/zdjecia/prezentacja.jpg"),
  S("scena-faktury", "/produkt/faktury, sekcja problemu", "Pudełko po butach pełne paragonów i faktur na biurku księgowej.", "/zdjecia/wnetrze-biura.jpg"),
  S("scena-raporty", "/produkt/raporty, sekcja problemu", "Ktoś klei wydruki tabel taśmą w jeden długi raport na podłodze biura.", "/zdjecia/pierwsze-wnioski.jpg"),
  S("scena-role-i-uprawnienia", "/produkt/role-i-uprawnienia, sekcja problemu", "Kartka z hasłem przyklejona do monitora w biurze (hasło rozmyte).", "/zdjecia/wnetrze-biura.jpg"),
  S("scena-umowa-najmu-okazjonalnego", "/produkt/umowa-najmu-okazjonalnego, sekcja problemu", "Kancelaria notarialna, na stole teczka z dokumentami najmu i dowód osobisty odwrócony rewersem.", "/zdjecia/transakcja.jpg"),
  S("scena-tablica-transakcji", "/produkt/tablica-transakcji, sekcja problemu", "Biała tablica z rozmazanym schematem transakcji i strzałkami, marker bez skuwki.", "/zdjecia/zespol.jpg"),
  S("scena-czat-zespolu", "/produkt/czat-zespolu, sekcja problemu", "Telefon z dziesiątkami powiadomień z różnych komunikatorów (rozmyte ikony), leżący obok laptopa.", "/zdjecia/miedzy-spotkaniami.jpg"),
  S("scena-urlopy-i-zastepstwa", "/produkt/urlopy-i-zastepstwa, sekcja problemu", "Agent na plaży odbiera telefon służbowy z miną zrezygnowania.", "/wzory/basen.jpg"),
  S("scena-automatyzacje", "/produkt/automatyzacje, sekcja problemu", "Ręka przepisuje dane z jednego ekranu na drugi, dwa monitory, późny wieczór.", "/zdjecia/wnetrze-biura.jpg"),
  S("scena-kalkulator-remontu", "/produkt/kalkulator-remontu, sekcja problemu", "Kupujący z miarką w zniszczonej kuchni, patrzy na stare szafki.", "/wzory/loft.jpg"),
  S("scena-rodo", "/produkt/rodo, sekcja problemu", "Pendrive leżący na ławce w parku, obok kubek kawy na wynos.", "/wzory/park.jpg"),
  S("scena-koszty-i-wynik", "/produkt/koszty-i-wynik, sekcja problemu", "Właściciel biura liczy na kalkulatorze przy stole z rachunkami za najem, prąd i reklamy.", "/zdjecia/plan-dnia.jpg"),
  S("scena-wycena-rcn", "/produkt/wycena-rcn, sekcja problemu", "Właścicielka mieszkania pokazuje agentowi na telefonie ogłoszenie sąsiada z wysoką ceną, agent trzyma teczkę.", "/zdjecia/rozmowa-audyt.jpg"),
  S("scena-dyzur-ai", "/produkt/dyzur-ai, sekcja problemu", "Agent na prezentacji mieszkania, w kieszeni wibruje telefon, którego nie może odebrać.", "/zdjecia/prezentacja.jpg"),
  S("scena-swiadectwa-energetyczne", "/produkt/swiadectwa-energetyczne, sekcja problemu", "Agent fotografuje elewację bloku telefonem, w drugiej ręce kartka z listą danych budynku.", "/biuro/budynek.jpg"),
  S("scena-biblioteka-technik", "/produkt/biblioteka-technik, sekcja problemu", "Dwie osoby przy stole negocjują, jedna przesuwa kartkę z liczbą w stronę drugiej. Kadr na dłonie.", "/zdjecia/pozyskanie.jpg"),

  /* ── Efekty rozwijanego zdjęcia (każdy inny) ── */
  { klucz: "rozwin-cennik", gdzie: "/cennik, zdjęcie rozwijane z okna do pełnego ekranu", proporcje: "21:9", scena: "Panorama Krakowa o zmierzchu z wysokiego tarasu: dachy Starego Miasta, Wawel, pierwsze światła. Na pierwszym planie barierka tarasu i dwa krzesła.", zapas: "/strona/ilustracje/miasto-zmierzch.webp" },
  { klucz: "rozwin-o-nas", gdzie: "/o-nas, zdjęcie odsłaniane kołem", proporcje: "16:9", scena: "Zespół biura nieruchomości (5 osób, różny wiek) śmieje się przy wspólnym stole w biurze w kamienicy, kawa, laptopy, naturalne popołudniowe światło. Bez pozowania do aparatu.", zapas: "/zdjecia/zespol.jpg" },
  { klucz: "o-nas-poczatek", gdzie: "/o-nas, historia: początek", proporcje: "3:4", scena: "Małe biuro nieruchomości na parterze kamienicy, witryna z ofertami (bez czytelnych napisów), wieczór, światło w środku.", zapas: "/biuro/wejscie.jpg" },
  { klucz: "o-nas-dzis", gdzie: "/o-nas, historia: dziś", proporcje: "3:4", scena: "Agent pokazuje klientce na tablecie aplikację w granacie i zieleni, stoją w jasnym salonie mieszkania na sprzedaż.", zapas: "/zdjecia/nowe/dzien-umowa.jpg" },
];

export function zdjecie(klucz: string): string {
  const z = ZDJECIA.find((x) => x.klucz === klucz);
  if (!z) return "/wzory/miasto-noc.jpg";
  return GOTOWE.has(klucz) ? `/strona/podstrony/${klucz}.webp` : z.zapas;
}
