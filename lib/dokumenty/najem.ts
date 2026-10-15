import {
  data,
  dataPL,
  imiona,
  kwota,
  liczba,
  numeruj,
  opisStron,
  strony,
  tekst,
  wMiescie,
  type Dane,
  type Dokument,
  type Wzor,
} from "./silnik";

const USTAWA =
  "ustawy z dnia 21 czerwca 2001 r. o ochronie praw lokatorów, mieszkaniowym zasobie gminy i o zmianie Kodeksu cywilnego";

/** Miejscowość w mianowniku, do nagłówka pisma: „Kraków, dnia …”. */
function miejscowosc(d: Dane, k: { miasto: string }): string {
  const m = String(d.miasto ?? "").trim() || k.miasto.trim();
  return m || "[miejscowość]";
}

function lata(od: string, doK: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(od) || !/^\d{4}-\d{2}-\d{2}$/.test(doK)) return null;
  return (Date.parse(doK) - Date.parse(od)) / (365.25 * 86_400_000);
}

const POLA_STRON_NAJMU = {
  tytul: "Strony",
  pola: [
    { k: "wynajmujacy", e: "Wynajmujący (właściciel)", typ: "strony" as const, rola: "Wynajmujący" },
    { k: "najemca", e: "Najemca", typ: "strony" as const, rola: "Najemca" },
  ],
};

const POLA_LOKALU = {
  tytul: "Lokal",
  pola: [
    { k: "adres", e: "Adres lokalu", typ: "tekst" as const, szer: "cala" as const, placeholder: "ul. Zbożowa 2/1, 30-002 Kraków" },
    { k: "metraz", e: "Powierzchnia (m²)", typ: "liczba" as const },
    { k: "pokoje", e: "Liczba pokoi", typ: "liczba" as const },
    { k: "kw", e: "Numer księgi wieczystej", typ: "tekst" as const, placeholder: "KR1P/00012345/6" },
    { k: "osoby", e: "Osoby zamieszkujące z najemcą", typ: "opis" as const, podp: "Imiona i nazwiska, np. małżonek, dzieci. Puste, jeśli nikt." },
    { k: "wyposazenie", e: "Wyposażenie", typ: "opis" as const, podp: "Krótko. Szczegóły i stan liczników idą do protokołu zdawczo-odbiorczego." },
  ],
};

// ── 1. Umowa najmu okazjonalnego ───────────────────────────

const najemOkazjonalny: Wzor = {
  id: "umowa-najmu-okazjonalnego",
  nazwa: "Umowa najmu okazjonalnego",
  kategoria: "Najem",
  opis: "Z załącznikami z art. 19a: wskazaniem lokalu zastępczego i oświadczeniem jego właściciela. Dla właściciela, który jest osobą fizyczną i nie prowadzi działalności w zakresie najmu.",
  poleKlienta: "wynajmujacy",
  zOferty: { adres: "adres", metraz: "metraz", pokoje: "pokoje", czynsz: "czynsz", kaucja: "kaucja" },
  grupy: [
    { tytul: "Umowa", pola: [
      { k: "data", e: "Data zawarcia", typ: "data", dom: "dzis" },
      { k: "miasto", e: "Miejscowość", typ: "tekst" },
    ] },
    POLA_STRON_NAJMU,
    POLA_LOKALU,
    { tytul: "Okres najmu", opis: "Najem okazjonalny jest zawsze na czas oznaczony, najwyżej 10 lat.", pola: [
      { k: "od", e: "Najem od", typ: "data" },
      { k: "do", e: "Najem do", typ: "data" },
      { k: "wydanie", e: "Wydanie lokalu", typ: "data" },
    ] },
    { tytul: "Czynsz, opłaty i kaucja", pola: [
      { k: "czynsz", e: "Czynsz miesięczny (zł)", typ: "kwota" },
      { k: "dzien", e: "Płatny do dnia miesiąca", typ: "liczba", dom: "10" },
      { k: "konto", e: "Numer rachunku wynajmującego", typ: "tekst", szer: "cala" },
      { k: "oplaty", e: "Opłaty poza czynszem", typ: "opis", dom: "zaliczki na rzecz wspólnoty mieszkaniowej lub spółdzielni w wysokości wynikającej z ich bieżących rozliczeń" },
      { k: "kaucja", e: "Kaucja (zł)", typ: "kwota", podp: "Najwyżej sześciokrotność miesięcznego czynszu." },
    ] },
    { tytul: "Wypowiedzenie", pola: [
      { k: "wypowiedzenie", e: "Okres wypowiedzenia", typ: "wybor", dom: "1 miesiąca", opcje: [
        { v: "1 miesiąca", l: "1 miesiąc" },
        { v: "2 miesięcy", l: "2 miesiące" },
        { v: "3 miesięcy", l: "3 miesiące" },
      ] },
    ] },
    { tytul: "Lokal zastępczy", opis: "Lokal, do którego najemca się wyprowadzi w razie eksmisji, i właściciel, który zgadza się go przyjąć.", pola: [
      { k: "zastepczy", e: "Adres lokalu zastępczego", typ: "tekst", szer: "cala" },
      { k: "wlascicielZastepczego", e: "Właściciel lokalu zastępczego", typ: "tekst", podp: "Imię i nazwisko osoby, która podpisze oświadczenie o zgodzie." },
      { k: "notarialnie", e: "Podpis właściciela lokalu zastępczego", typ: "wybor", dom: "tak", opcje: [
        { v: "tak", l: "Wynajmujący żąda notarialnego poświadczenia" },
        { v: "nie", l: "Bez poświadczenia" },
      ] },
    ] },
  ],
  buduj(d, k): Dokument {
    const W = strony(d, "wynajmujacy");
    const N = strony(d, "najemca");
    const czynsz = liczba(d, "czynsz");
    const kaucja = liczba(d, "kaucja");
    const okres = lata(String(d.od ?? ""), String(d.do ?? ""));
    const uwagi = [
      "Najem okazjonalny jest dostępny tylko dla właściciela, który jest osobą fizyczną i nie prowadzi działalności gospodarczej w zakresie wynajmowania lokali (art. 19a ust. 1). Dla firmy właściwy jest najem instytucjonalny.",
      "Oświadczenie najemcy o poddaniu się egzekucji sporządza notariusz w formie aktu notarialnego. Maksymalna taksa to jedna dziesiąta minimalnego wynagrodzenia.",
      "Właściciel musi zgłosić umowę naczelnikowi urzędu skarbowego w ciągu 14 dni od rozpoczęcia najmu (art. 19b). Bez zgłoszenia nie skorzysta z szybkiej ścieżki opróżnienia lokalu. Pismo zgłoszenia masz w tych samych wzorach.",
    ];
    if (czynsz > 0 && kaucja > czynsz * 6) uwagi.unshift(`Kaucja ${kaucja} zł przekracza sześciokrotność czynszu (${czynsz * 6} zł). Ustawa na to nie pozwala.`);
    if (okres != null && okres > 10) uwagi.unshift("Okres najmu przekracza 10 lat. Najem okazjonalny może trwać najwyżej 10 lat.");
    if (okres != null && okres <= 0) uwagi.unshift("Data końca najmu jest wcześniejsza niż data początku.");
    const osoby = tekst(d, "osoby", "").replace(/^\[\]$/, "");
    const notarialnie = d.notarialnie !== "nie";

    return {
      tytul: "Umowa najmu okazjonalnego lokalu",
      wstep: [`zawarta w dniu **${data(d, "data")} r.** w ${wMiescie(String(d.miasto || k.miasto))} pomiędzy:`, opisStron(W, "Wynajmujący"), "a", opisStron(N, "Najemca")],
      paragrafy: [
        { tytul: "§ 1. Przedmiot najmu", ustepy: numeruj([
          `Wynajmujący oświadcza, że jest właścicielem lokalu mieszkalnego położonego pod adresem: **${tekst(d, "adres", "adres lokalu")}**, o powierzchni użytkowej ${tekst(d, "metraz", "…")} m², składającego się z ${tekst(d, "pokoje", "…")} pokoi, dla którego prowadzona jest księga wieczysta nr ${tekst(d, "kw", "numer księgi wieczystej")} (dalej: „Lokal”).`,
          `Wynajmujący oświadcza, że jest osobą fizyczną i nie prowadzi działalności gospodarczej w zakresie wynajmowania lokali, a Strony zawierają umowę najmu okazjonalnego lokalu w rozumieniu art. 19a ${USTAWA} (dalej: „Ustawa”).`,
          `Wynajmujący oddaje Najemcy Lokal do używania, a Najemca Lokal przyjmuje. Lokal służy zaspokajaniu potrzeb mieszkaniowych Najemcy${osoby ? ` oraz zamieszkujących z nim osób: ${osoby}` : ""}.`,
          d.wyposazenie ? `Lokal wydawany jest z wyposażeniem: ${tekst(d, "wyposazenie")}. Stan Lokalu, wyposażenia i liczników Strony opiszą w protokole zdawczo-odbiorczym.` : "Stan Lokalu, wyposażenia i liczników Strony opiszą w protokole zdawczo-odbiorczym.",
        ]) },
        { tytul: "§ 2. Czas trwania najmu", ustepy: numeruj([
          `Umowa zostaje zawarta na czas oznaczony od dnia **${data(d, "od")} r.** do dnia **${data(d, "do")} r.**`,
          `Wydanie Lokalu nastąpi w dniu ${data(d, "wydanie")} r. na podstawie protokołu zdawczo-odbiorczego podpisanego przez obie Strony.`,
        ]) },
        { tytul: "§ 3. Czynsz i opłaty", ustepy: numeruj([
          `Najemca będzie płacił Wynajmującemu czynsz w wysokości **${kwota(d, "czynsz")}** miesięcznie, z góry, do ${tekst(d, "dzien", "10")}. dnia każdego miesiąca, na rachunek bankowy nr ${tekst(d, "konto", "numer rachunku")}.`,
          `Niezależnie od czynszu Najemca ponosi: ${tekst(d, "oplaty", "opłaty dodatkowe")}.`,
          "Opłaty za media zużywane w Lokalu, w szczególności energię elektryczną, gaz i dostęp do internetu, Najemca ponosi według rzeczywistego zużycia, na podstawie rachunków dostawców lub wskazań liczników.",
        ]) },
        { tytul: "§ 4. Kaucja", ustepy: numeruj([
          `Najemca wpłaca Wynajmującemu kaucję w wysokości **${kwota(d, "kaucja")}**, zabezpieczającą pokrycie należności z tytułu najmu Lokalu przysługujących Wynajmującemu w dniu opróżnienia Lokalu oraz ewentualnych kosztów egzekucji obowiązku opróżnienia Lokalu. Kaucja nie przekracza sześciokrotności miesięcznego czynszu.`,
          "Kaucja podlega zwrotowi w terminie miesiąca od dnia opróżnienia Lokalu, po potrąceniu należności, o których mowa w ust. 1.",
        ]) },
        { tytul: "§ 5. Obowiązki Stron", ustepy: numeruj([
          "Najemca zobowiązuje się używać Lokalu zgodnie z jego przeznaczeniem, dbać o jego stan techniczny, dokonywać drobnych napraw i konserwacji obciążających najemcę z mocy przepisów oraz przestrzegać porządku domowego.",
          "Najemca nie może bez pisemnej zgody Wynajmującego oddać Lokalu w podnajem ani do bezpłatnego używania osobom trzecim, ani dokonywać w Lokalu zmian naruszających jego substancję.",
          "Wynajmujący zobowiązuje się wydać Lokal w stanie przydatnym do umówionego użytku i utrzymywać go w takim stanie przez czas trwania najmu.",
          "Najemca zobowiązuje się udostępnić Lokal Wynajmującemu w celu kontroli jego stanu lub wykonania niezbędnych napraw, po uprzednim uzgodnieniu terminu, z wyjątkiem sytuacji awaryjnych.",
        ]) },
        { tytul: "§ 6. Rozwiązanie umowy", ustepy: numeruj([
          "Umowa wygasa z upływem okresu, na który została zawarta.",
          `Wynajmujący może wypowiedzieć umowę przed upływem tego okresu, z zachowaniem ${tekst(d, "wypowiedzenie", "1 miesiąca")} okresu wypowiedzenia, ze skutkiem na koniec miesiąca kalendarzowego, jeżeli Najemca: a) zalega z zapłatą czynszu lub innych opłat za co najmniej dwa pełne okresy płatności, po uprzednim uprzedzeniu go na piśmie i wyznaczeniu dodatkowego, miesięcznego terminu do zapłaty zaległych i bieżących należności; b) mimo pisemnego upomnienia używa Lokalu w sposób sprzeczny z umową lub z jego przeznaczeniem albo zaniedbuje Lokal w stopniu narażającym go na uszkodzenie; c) bez zgody Wynajmującego oddał Lokal lub jego część w podnajem albo do bezpłatnego używania.`,
          `Najemca może wypowiedzieć umowę przed upływem okresu, na który została zawarta, z zachowaniem ${tekst(d, "wypowiedzenie", "1 miesiąca")} okresu wypowiedzenia, ze skutkiem na koniec miesiąca kalendarzowego, jeżeli Lokal ma wady uniemożliwiające jego używanie zgodnie z przeznaczeniem, których Wynajmujący nie usunął w odpowiednim terminie.`,
          "Wypowiedzenie wymaga formy pisemnej pod rygorem nieważności.",
        ]) },
        { tytul: "§ 7. Oświadczenie o poddaniu się egzekucji i lokal zastępczy", ustepy: numeruj([
          `Do umowy załącza się: a) oświadczenie Najemcy w formie aktu notarialnego, w którym Najemca poddał się egzekucji i zobowiązał się do opróżnienia i wydania Lokalu w terminie wskazanym w żądaniu, o którym mowa w art. 19d ust. 2 Ustawy (załącznik nr 1); b) wskazanie przez Najemcę innego lokalu, w którym będzie mógł zamieszkać w przypadku wykonania egzekucji obowiązku opróżnienia Lokalu (załącznik nr 2); c) oświadczenie właściciela lokalu, o którym mowa w lit. b, lub osoby posiadającej tytuł prawny do tego lokalu, o wyrażeniu zgody na zamieszkanie Najemcy i osób z nim zamieszkujących w tym lokalu (załącznik nr 3)${notarialnie ? ", z podpisem notarialnie poświadczonym, którego Wynajmujący żąda na podstawie art. 19a ust. 3 Ustawy" : ""}.`,
          `Najemca wskazuje jako lokal, o którym mowa w ust. 1 lit. b, lokal położony pod adresem: **${tekst(d, "zastepczy", "adres lokalu zastępczego")}**.`,
          "W przypadku utraty możliwości zamieszkania w lokalu, o którym mowa w ust. 2, Najemca jest obowiązany w terminie 21 dni od dnia otrzymania żądania Wynajmującego wskazać inny lokal oraz przedstawić oświadczenie jego właściciela lub osoby posiadającej tytuł prawny do tego lokalu, o którym mowa w ust. 1 lit. c.",
        ]) },
        { tytul: "§ 8. Zgłoszenie umowy", ustepy: [
          "Wynajmujący zgłosi zawarcie umowy naczelnikowi urzędu skarbowego właściwemu ze względu na swoje miejsce zamieszkania w terminie 14 dni od dnia rozpoczęcia najmu, zgodnie z art. 19b ust. 1 Ustawy.",
        ] },
        { tytul: "§ 9. Postanowienia końcowe", ustepy: numeruj([
          "Zmiany umowy wymagają formy pisemnej pod rygorem nieważności.",
          "W sprawach nieuregulowanych umową zastosowanie mają przepisy Ustawy oraz Kodeksu cywilnego.",
          "Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.",
        ]) },
      ],
      podpisy: [{ rola: "Wynajmujący", osoby: imiona(W) }, { rola: "Najemca", osoby: imiona(N) }],
      dodatki: [
        {
          tytul: "Załącznik nr 2. Wskazanie lokalu zastępczego",
          akapity: [
            `Ja, niżej podpisany/a ${imiona(N).join(", ") || "[imię i nazwisko najemcy]"}, jako Najemca w umowie najmu okazjonalnego lokalu położonego pod adresem ${tekst(d, "adres", "adres lokalu")}, zawartej w dniu ${data(d, "data")} r., wskazuję jako lokal, w którym będę mógł/mogła zamieszkać w przypadku wykonania egzekucji obowiązku opróżnienia lokalu, lokal położony pod adresem: **${tekst(d, "zastepczy", "adres lokalu zastępczego")}**.`,
          ],
          podpisy: [{ rola: "Data", osoby: [] }, { rola: "Najemca", osoby: imiona(N) }],
        },
        {
          tytul: "Załącznik nr 3. Oświadczenie właściciela lokalu zastępczego",
          akapity: [
            `Ja, niżej podpisany/a **${tekst(d, "wlascicielZastepczego", "imię i nazwisko właściciela lokalu zastępczego")}**, PESEL ………………………, legitymujący/a się dowodem osobistym nr ………………………, oświadczam, że jestem właścicielem (lub posiadam tytuł prawny do) lokalu położonego pod adresem: **${tekst(d, "zastepczy", "adres lokalu zastępczego")}**.`,
            `Wyrażam zgodę na zamieszkanie w tym lokalu ${imiona(N).join(", ") || "[najemcy]"}${osoby ? ` oraz osób z nim zamieszkujących: ${osoby}` : " oraz osób z nim zamieszkujących"} w przypadku wykonania egzekucji obowiązku opróżnienia lokalu położonego pod adresem ${tekst(d, "adres", "adres lokalu")}, używanego na podstawie umowy najmu okazjonalnego zawartej w dniu ${data(d, "data")} r.`,
            notarialnie ? "**Podpis pod tym oświadczeniem wymaga poświadczenia przez notariusza.**" : "",
          ].filter(Boolean),
          podpisy: [{ rola: "Data", osoby: [] }, { rola: "Właściciel lokalu", osoby: [] }],
        },
      ],
      uwagi,
    };
  },
};

// ── 2. Zgłoszenie najmu okazjonalnego do urzędu skarbowego ─

const zgloszenieUS: Wzor = {
  id: "zgloszenie-najmu-okazjonalnego",
  nazwa: "Zgłoszenie najmu okazjonalnego do urzędu skarbowego",
  kategoria: "Najem",
  opis: "Pismo z art. 19b. Właściciel składa je w ciągu 14 dni od rozpoczęcia najmu, w urzędzie właściwym dla swojego miejsca zamieszkania.",
  poleKlienta: "wlasciciel",
  zOferty: { adres: "adres" },
  grupy: [
    { tytul: "Pismo", pola: [
      { k: "data", e: "Data pisma", typ: "data", dom: "dzis" },
      { k: "miasto", e: "Miejscowość", typ: "tekst" },
      { k: "urzad", e: "Urząd skarbowy", typ: "tekst", szer: "cala", placeholder: "Naczelnik Urzędu Skarbowego Kraków-Krowodrza" },
    ] },
    { tytul: "Właściciel", pola: [{ k: "wlasciciel", e: "Właściciel lokalu", typ: "strony", rola: "Właściciel" }] },
    { tytul: "Najem", pola: [
      { k: "najemca", e: "Najemca (imię i nazwisko)", typ: "tekst" },
      { k: "adres", e: "Adres lokalu", typ: "tekst", szer: "cala" },
      { k: "zawarcie", e: "Data zawarcia umowy", typ: "data" },
      { k: "rozpoczecie", e: "Data rozpoczęcia najmu", typ: "data" },
      { k: "do", e: "Najem do", typ: "data" },
    ] },
  ],
  buduj(d, k) {
    const W = strony(d, "wlasciciel");
    const w = W[0];
    const rozp = String(d.rozpoczecie ?? "");
    const termin = /^\d{4}-\d{2}-\d{2}$/.test(rozp)
      ? dataPL(new Date(Date.parse(rozp) + 14 * 86_400_000).toISOString().slice(0, 10))
      : null;
    return {
      tytul: "Zgłoszenie zawarcia umowy najmu okazjonalnego lokalu",
      wstep: [
        `${miejscowosc(d, k)}, dnia ${data(d, "data")} r.`,
        `**${w.imie.trim() || "[imię i nazwisko właściciela]"}**\nPESEL: ${w.pesel.trim() || "[PESEL]"}\n${w.adres.trim() || "[adres zamieszkania]"}`,
        `**${tekst(d, "urzad", "Naczelnik Urzędu Skarbowego")}**`,
      ],
      paragrafy: [
        { ustepy: [
          `Na podstawie art. 19b ust. 1 ${USTAWA} zgłaszam zawarcie w dniu **${data(d, "zawarcie")} r.** umowy najmu okazjonalnego lokalu mieszkalnego położonego pod adresem **${tekst(d, "adres", "adres lokalu")}**, z najemcą **${tekst(d, "najemca", "imię i nazwisko najemcy")}**.`,
          `Najem rozpoczął się w dniu **${data(d, "rozpoczecie")} r.** i został zawarty na czas oznaczony do dnia ${data(d, "do")} r.`,
          "Proszę o potwierdzenie przyjęcia zgłoszenia, które będzie potrzebne w razie złożenia wniosku o nadanie klauzuli wykonalności oświadczeniu najemcy o poddaniu się egzekucji.",
        ] },
      ],
      podpisy: [{ rola: "", osoby: [] }, { rola: "Podpis właściciela", osoby: imiona(W) }],
      uwagi: termin ? [`Termin na złożenie zgłoszenia mija ${termin} r. (14 dni od rozpoczęcia najmu).`] : [],
    };
  },
};

// ── 3. Żądanie opróżnienia lokalu ──────────────────────────

const zadanieOproznienia: Wzor = {
  id: "zadanie-oproznienia-lokalu",
  nazwa: "Żądanie opróżnienia lokalu (najem okazjonalny)",
  kategoria: "Najem",
  opis: "Pismo z art. 19d ust. 2 po wygaśnięciu albo rozwiązaniu umowy, gdy najemca nie opuścił lokalu. Podpis właściciela musi być urzędowo poświadczony.",
  poleKlienta: "wlasciciel",
  zOferty: { adres: "adres" },
  grupy: [
    { tytul: "Pismo", pola: [
      { k: "data", e: "Data pisma", typ: "data", dom: "dzis" },
      { k: "miasto", e: "Miejscowość", typ: "tekst" },
    ] },
    { tytul: "Strony", pola: [
      { k: "wlasciciel", e: "Właściciel", typ: "strony", rola: "Właściciel" },
      { k: "najemca", e: "Najemca", typ: "strony", rola: "Najemca" },
    ] },
    { tytul: "Umowa i termin", pola: [
      { k: "adres", e: "Adres lokalu", typ: "tekst", szer: "cala" },
      { k: "zawarcie", e: "Data zawarcia umowy", typ: "data" },
      { k: "przyczyna", e: "Przyczyna ustania najmu", typ: "wybor", dom: "wygaśnięcie", opcje: [
        { v: "wygaśnięcie", l: "Wygaśnięcie z upływem okresu" },
        { v: "wypowiedzenie", l: "Rozwiązanie przez wypowiedzenie" },
        { v: "porozumienie", l: "Rozwiązanie za porozumieniem stron" },
      ] },
      { k: "ustanie", e: "Data ustania najmu", typ: "data" },
      { k: "dni", e: "Termin opróżnienia (dni od doręczenia)", typ: "liczba", dom: "7", podp: "Nie krócej niż 7 dni." },
    ] },
  ],
  buduj(d, k) {
    const W = strony(d, "wlasciciel");
    const N = strony(d, "najemca");
    const dni = Math.max(7, Math.round(liczba(d, "dni") || 7));
    const przyczyna =
      d.przyczyna === "wypowiedzenie"
        ? `rozwiązania umowy na skutek wypowiedzenia, ze skutkiem na dzień ${data(d, "ustanie")} r.`
        : d.przyczyna === "porozumienie"
          ? `rozwiązania umowy za porozumieniem stron z dniem ${data(d, "ustanie")} r.`
          : `wygaśnięcia umowy z upływem okresu, na który została zawarta, w dniu ${data(d, "ustanie")} r.`;
    const uwagi = [
      "Podpis właściciela pod żądaniem musi być urzędowo poświadczony (art. 19d ust. 2). Bez tego sąd nie nada klauzuli wykonalności.",
      "Żądanie trzeba doręczyć najemcy. Zachowaj dowód doręczenia albo nadania listem poleconym, bo dołącza się go do wniosku do sądu.",
    ];
    if (liczba(d, "dni") > 0 && liczba(d, "dni") < 7) uwagi.unshift("Termin opróżnienia nie może być krótszy niż 7 dni. W piśmie wstawiłem 7.");
    return {
      tytul: "Żądanie opróżnienia lokalu",
      wstep: [
        `${miejscowosc(d, k)}, dnia ${data(d, "data")} r.`,
        `Właściciel: ${opisStron(W, "Właściciel")}`,
        `Najemca: ${opisStron(N, "Najemca")}`,
      ],
      paragrafy: [
        { ustepy: [
          `Działając na podstawie art. 19d ust. 2 ${USTAWA}, w związku z umową najmu okazjonalnego lokalu położonego pod adresem **${tekst(d, "adres", "adres lokalu")}**, zawartą w dniu ${data(d, "zawarcie")} r., wobec ${przyczyna}`,
          `**żądam opróżnienia lokalu** i wydania go Właścicielowi w terminie **${dni} dni** od dnia doręczenia niniejszego żądania.`,
          "W przypadku bezskutecznego upływu tego terminu Właściciel złoży do sądu wniosek o nadanie klauzuli wykonalności aktowi notarialnemu, w którym Najemca poddał się egzekucji i zobowiązał się do opróżnienia i wydania lokalu.",
        ] },
      ],
      podpisy: [{ rola: "", osoby: [] }, { rola: "Podpis właściciela (urzędowo poświadczony)", osoby: imiona(W) }],
      uwagi,
    };
  },
};

// ── 4. Umowa najmu lokalu mieszkalnego (zwykła) ────────────

const najemZwykly: Wzor = {
  id: "umowa-najmu",
  nazwa: "Umowa najmu lokalu mieszkalnego",
  kategoria: "Najem",
  opis: "Zwykła umowa najmu na czas oznaczony, bez notarialnego oświadczenia najemcy. Dla właścicieli, którzy nie chcą formalności najmu okazjonalnego.",
  poleKlienta: "wynajmujacy",
  zOferty: { adres: "adres", metraz: "metraz", pokoje: "pokoje", czynsz: "czynsz", kaucja: "kaucja" },
  grupy: [
    { tytul: "Umowa", pola: [
      { k: "data", e: "Data zawarcia", typ: "data", dom: "dzis" },
      { k: "miasto", e: "Miejscowość", typ: "tekst" },
    ] },
    POLA_STRON_NAJMU,
    POLA_LOKALU,
    { tytul: "Okres najmu", pola: [
      { k: "od", e: "Najem od", typ: "data" },
      { k: "do", e: "Najem do", typ: "data" },
    ] },
    { tytul: "Czynsz, opłaty i kaucja", pola: [
      { k: "czynsz", e: "Czynsz miesięczny (zł)", typ: "kwota" },
      { k: "dzien", e: "Płatny do dnia miesiąca", typ: "liczba", dom: "10" },
      { k: "konto", e: "Numer rachunku wynajmującego", typ: "tekst", szer: "cala" },
      { k: "oplaty", e: "Opłaty poza czynszem", typ: "opis", dom: "zaliczki na rzecz wspólnoty mieszkaniowej lub spółdzielni w wysokości wynikającej z ich bieżących rozliczeń" },
      { k: "kaucja", e: "Kaucja (zł)", typ: "kwota", podp: "Przy zwykłym najmie do dwunastokrotności czynszu." },
    ] },
    { tytul: "Wypowiedzenie", pola: [
      { k: "wypowiedzenie", e: "Okres wypowiedzenia", typ: "wybor", dom: "1 miesiąca", opcje: [
        { v: "1 miesiąca", l: "1 miesiąc" },
        { v: "3 miesięcy", l: "3 miesiące" },
      ] },
    ] },
  ],
  buduj(d, k) {
    const W = strony(d, "wynajmujacy");
    const N = strony(d, "najemca");
    const czynsz = liczba(d, "czynsz");
    const kaucja = liczba(d, "kaucja");
    const uwagi: string[] = [];
    if (czynsz > 0 && kaucja > czynsz * 12) uwagi.push("Kaucja przekracza dwunastokrotność czynszu, czego ustawa nie dopuszcza (art. 6 ust. 1).");
    const osoby = tekst(d, "osoby", "").replace(/^\[\]$/, "");
    return {
      tytul: "Umowa najmu lokalu mieszkalnego",
      wstep: [`zawarta w dniu **${data(d, "data")} r.** w ${wMiescie(String(d.miasto || k.miasto))} pomiędzy:`, opisStron(W, "Wynajmujący"), "a", opisStron(N, "Najemca")],
      paragrafy: [
        { tytul: "§ 1. Przedmiot najmu", ustepy: numeruj([
          `Wynajmujący oświadcza, że jest właścicielem lokalu mieszkalnego położonego pod adresem **${tekst(d, "adres", "adres lokalu")}**, o powierzchni ${tekst(d, "metraz", "…")} m², składającego się z ${tekst(d, "pokoje", "…")} pokoi${d.kw ? `, dla którego prowadzona jest księga wieczysta nr ${tekst(d, "kw")}` : ""} (dalej: „Lokal”).`,
          `Wynajmujący oddaje Najemcy Lokal do używania na cele mieszkaniowe Najemcy${osoby ? ` oraz zamieszkujących z nim osób: ${osoby}` : ""}, a Najemca Lokal przyjmuje.`,
          "Stan Lokalu, wyposażenia i liczników Strony opiszą w protokole zdawczo-odbiorczym, który stanowi załącznik do umowy.",
        ]) },
        { tytul: "§ 2. Czas trwania", ustepy: [`Umowa zostaje zawarta na czas oznaczony od dnia **${data(d, "od")} r.** do dnia **${data(d, "do")} r.**`] },
        { tytul: "§ 3. Czynsz i opłaty", ustepy: numeruj([
          `Najemca będzie płacił czynsz w wysokości **${kwota(d, "czynsz")}** miesięcznie, z góry, do ${tekst(d, "dzien", "10")}. dnia każdego miesiąca, na rachunek nr ${tekst(d, "konto", "numer rachunku")}.`,
          `Niezależnie od czynszu Najemca ponosi: ${tekst(d, "oplaty", "opłaty dodatkowe")}.`,
          "Opłaty za media zużywane w Lokalu Najemca ponosi według rzeczywistego zużycia.",
        ]) },
        { tytul: "§ 4. Kaucja", ustepy: numeruj([
          `Najemca wpłaca kaucję w wysokości **${kwota(d, "kaucja")}**, zabezpieczającą pokrycie należności z tytułu najmu przysługujących Wynajmującemu w dniu opróżnienia Lokalu.`,
          "Kaucja podlega zwrotowi w terminie miesiąca od dnia opróżnienia Lokalu, po potrąceniu należności Wynajmującego.",
        ]) },
        { tytul: "§ 5. Obowiązki Stron", ustepy: numeruj([
          "Najemca używa Lokalu zgodnie z przeznaczeniem, dba o jego stan, dokonuje drobnych napraw obciążających najemcę z mocy przepisów i przestrzega porządku domowego.",
          "Podnajem lub oddanie Lokalu do bezpłatnego używania wymaga pisemnej zgody Wynajmującego.",
          "Wynajmujący utrzymuje Lokal w stanie przydatnym do umówionego użytku.",
        ]) },
        { tytul: "§ 6. Rozwiązanie umowy", ustepy: numeruj([
          "Umowa wygasa z upływem okresu, na który została zawarta.",
          `Każda ze Stron może wypowiedzieć umowę przed upływem tego okresu z zachowaniem ${tekst(d, "wypowiedzenie", "1 miesiąca")} okresu wypowiedzenia, ze skutkiem na koniec miesiąca kalendarzowego, w przypadkach określonych w przepisach ustawy o ochronie praw lokatorów oraz Kodeksu cywilnego, w szczególności przy zaległości w zapłacie czynszu lub innych opłat za co najmniej trzy pełne okresy płatności, po uprzednim pisemnym uprzedzeniu Najemcy i wyznaczeniu dodatkowego, miesięcznego terminu do zapłaty.`,
          "Wypowiedzenie wymaga formy pisemnej pod rygorem nieważności.",
        ]) },
        { tytul: "§ 7. Postanowienia końcowe", ustepy: numeruj([
          "Zmiany umowy wymagają formy pisemnej pod rygorem nieważności.",
          `W sprawach nieuregulowanych zastosowanie mają przepisy ${USTAWA} oraz Kodeksu cywilnego.`,
          "Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.",
        ]) },
      ],
      podpisy: [{ rola: "Wynajmujący", osoby: imiona(W) }, { rola: "Najemca", osoby: imiona(N) }],
      uwagi,
    };
  },
};

// ── 5. Potwierdzenie przyjęcia kaucji ──────────────────────

const potwierdzenieKaucji: Wzor = {
  id: "potwierdzenie-kaucji",
  nazwa: "Potwierdzenie przyjęcia kaucji",
  kategoria: "Najem",
  opis: "Pokwitowanie kaucji wpłaconej gotówką albo przelewem, z kwotą słownie.",
  poleKlienta: "wynajmujacy",
  grupy: [
    { tytul: "Pokwitowanie", pola: [
      { k: "data", e: "Data", typ: "data", dom: "dzis" },
      { k: "miasto", e: "Miejscowość", typ: "tekst" },
      { k: "kwota", e: "Kwota kaucji (zł)", typ: "kwota" },
      { k: "forma", e: "Forma wpłaty", typ: "wybor", dom: "gotówką", opcje: [
        { v: "gotówką", l: "Gotówka" },
        { v: "przelewem na rachunek bankowy", l: "Przelew" },
      ] },
      { k: "adres", e: "Adres lokalu", typ: "tekst", szer: "cala" },
      { k: "umowa", e: "Data umowy najmu", typ: "data" },
    ] },
    POLA_STRON_NAJMU,
  ],
  buduj(d, k) {
    const W = strony(d, "wynajmujacy");
    const N = strony(d, "najemca");
    return {
      tytul: "Potwierdzenie przyjęcia kaucji",
      wstep: [`${miejscowosc(d, k)}, dnia ${data(d, "data")} r.`],
      paragrafy: [{ ustepy: [
        `${opisStron(W, "Wynajmujący")} potwierdza przyjęcie od ${opisStron(N, "Najemca")} kaucji w kwocie **${kwota(d, "kwota")}**, wpłaconej ${tekst(d, "forma", "gotówką")}, tytułem zabezpieczenia należności z umowy najmu lokalu położonego pod adresem ${tekst(d, "adres", "adres lokalu")}, zawartej w dniu ${data(d, "umowa")} r.`,
        "Kaucja podlega zwrotowi na zasadach określonych w umowie najmu.",
      ] }],
      podpisy: [{ rola: "Najemca", osoby: imiona(N) }, { rola: "Wynajmujący", osoby: imiona(W) }],
    };
  },
};

export const WZORY_NAJMU: Wzor[] = [najemOkazjonalny, zgloszenieUS, zadanieOproznienia, najemZwykly, potwierdzenieKaucji];

export type { Dane };
