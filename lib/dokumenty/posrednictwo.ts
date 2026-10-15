import {
  data,
  imiona,
  kwota,
  liczba,
  numeruj,
  opisBiura,
  opisStron,
  strony,
  tekst,
  wMiescie,
  type Dane,
  type Dokument,
  type Kontekst,
  type Wzor,
} from "./silnik";

/**
 * Umowy pośrednictwa. Podstawa: art. 179b i 180 ustawy o gospodarce
 * nieruchomościami (zakres czynności określa umowa, forma pisemna lub
 * elektroniczna pod rygorem nieważności) oraz, gdy zamawiający jest
 * konsumentem, ustawa o prawach konsumenta: przy umowie zawartej poza
 * lokalem biura klient ma 14 dni na odstąpienie i trzeba go o tym pouczyć.
 */

type Rodzaj = "sprzedaz" | "kupno" | "najem";

const OPIS: Record<Rodzaj, { tytul: string; rolaKlienta: string; cel: string; czynnosci: string[] }> = {
  sprzedaz: {
    tytul: "Umowa pośrednictwa w sprzedaży nieruchomości",
    rolaKlienta: "Zamawiający",
    cel: "zawarcia przez Zamawiającego umowy sprzedaży nieruchomości opisanej w § 1 (dalej: „Nieruchomość”)",
    czynnosci: [
      "przygotowanie oferty, w tym opisu i dokumentacji zdjęciowej Nieruchomości",
      "publikację oferty w internetowych serwisach ogłoszeniowych i na stronie internetowej Pośrednika",
      "pozyskiwanie i weryfikację osób zainteresowanych nabyciem Nieruchomości",
      "organizowanie i przeprowadzanie prezentacji Nieruchomości",
      "uczestnictwo w negocjacjach warunków transakcji na rzecz Zamawiającego",
      "pomoc w kompletowaniu dokumentów niezbędnych do zawarcia umowy przedwstępnej i umowy przenoszącej własność",
      "pomoc w przygotowaniu i organizacji umów u notariusza",
    ],
  },
  kupno: {
    tytul: "Umowa pośrednictwa w kupnie nieruchomości",
    rolaKlienta: "Zamawiający",
    cel: "zawarcia przez Zamawiającego umowy nabycia nieruchomości spełniającej kryteria opisane w § 1",
    czynnosci: [
      "wyszukiwanie ofert odpowiadających kryteriom Zamawiającego",
      "weryfikację stanu prawnego proponowanych nieruchomości na podstawie dostępnych dokumentów",
      "organizowanie i udział w prezentacjach nieruchomości",
      "uczestnictwo w negocjacjach warunków transakcji na rzecz Zamawiającego",
      "pomoc w kompletowaniu dokumentów oraz w organizacji umów u notariusza",
    ],
  },
  najem: {
    tytul: "Umowa pośrednictwa w najmie nieruchomości",
    rolaKlienta: "Zamawiający",
    cel: "zawarcia przez Zamawiającego umowy najmu lokalu opisanego w § 1 (dalej: „Lokal”)",
    czynnosci: [
      "przygotowanie i publikację oferty najmu",
      "pozyskiwanie i wstępną weryfikację kandydatów na najemców",
      "organizowanie i przeprowadzanie prezentacji Lokalu",
      "pomoc w przygotowaniu umowy najmu i protokołu zdawczo-odbiorczego",
      "udział w przekazaniu Lokalu najemcy",
    ],
  },
};

function grupy(rodzaj: Rodzaj) {
  const przedmiot =
    rodzaj === "kupno"
      ? {
          tytul: "Czego szuka klient",
          pola: [
            { k: "kryteria", e: "Kryteria nieruchomości", typ: "opis" as const, podp: "Np. mieszkanie 3-pokojowe, Kraków Bronowice lub Krowodrza, do 850 000 zł." },
          ],
        }
      : {
          tytul: rodzaj === "najem" ? "Lokal" : "Nieruchomość",
          pola: [
            { k: "adres", e: "Adres", typ: "tekst" as const, szer: "cala" as const },
            { k: "opisNieruchomosci", e: "Opis", typ: "tekst" as const, szer: "cala" as const, placeholder: "lokal mieszkalny, 3 pokoje, 64 m², 2 piętro" },
            { k: "kw", e: "Numer księgi wieczystej", typ: "tekst" as const },
            { k: "cena", e: rodzaj === "najem" ? "Czynsz ofertowy (zł/mc)" : "Cena ofertowa (zł)", typ: "kwota" as const },
          ],
        };
  return [
    { tytul: "Umowa", pola: [
      { k: "data", e: "Data zawarcia", typ: "data" as const, dom: "dzis" },
      { k: "miasto", e: "Miejscowość", typ: "tekst" as const },
      { k: "numer", e: "Numer umowy", typ: "tekst" as const, placeholder: "12/10/2026" },
      { k: "gdzie", e: "Gdzie zawarta", typ: "wybor" as const, dom: "biuro", opcje: [
        { v: "biuro", l: "W biurze" },
        { v: "poza", l: "Poza biurem (np. u klienta)" },
        { v: "odleglosc", l: "Na odległość (mail z podpisem kwalifikowanym)" },
      ], podp: "Poza biurem i na odległość konsument ma 14 dni na odstąpienie. Dołączamy pouczenie i formularz." },
      { k: "konsument", e: "Klient", typ: "wybor" as const, dom: "tak", opcje: [
        { v: "tak", l: "Osoba prywatna (konsument)" },
        { v: "nie", l: "Firma, w ramach działalności" },
      ] },
      { k: "odRazu", e: "Rozpoczęcie usług", typ: "wybor" as const, dom: "tak", opcje: [
        { v: "tak", l: "Od razu, na żądanie klienta" },
        { v: "nie", l: "Po upływie 14 dni na odstąpienie" },
      ], podp: "Dotyczy umowy z konsumentem poza biurem. Bez wyraźnego żądania klienta biuro, które działa w ciągu 14 dni, ryzykuje utratę wynagrodzenia." },
    ] },
    { tytul: "Zamawiający", pola: [{ k: "zamawiajacy", e: "Zamawiający", typ: "strony" as const, rola: "Zamawiający" }] },
    przedmiot,
    { tytul: "Warunki", pola: [
      { k: "wylacznosc", e: "Rodzaj umowy", typ: "wybor" as const, dom: "otwarta", opcje: [
        { v: "otwarta", l: "Otwarta" },
        { v: "wylaczna", l: "Na wyłączność" },
      ] },
      { k: "prowizjaTyp", e: "Wynagrodzenie", typ: "wybor" as const, dom: "procent", opcje: [
        { v: "procent", l: "Procent od ceny" },
        { v: "kwota", l: "Stała kwota" },
      ] },
      { k: "prowizja", e: "Procent (np. 2) albo kwota netto (zł)", typ: "liczba" as const },
      { k: "vat", e: "VAT", typ: "wybor" as const, dom: "plus", opcje: [
        { v: "plus", l: "Powiększone o VAT 23%" },
        { v: "zw", l: "Biuro zwolnione z VAT" },
      ] },
      { k: "doKiedy", e: "Umowa obowiązuje do", typ: "data" as const, podp: "Puste: na czas nieokreślony z miesięcznym wypowiedzeniem." },
    ] },
  ];
}

function wynagrodzenie(d: Dane, rodzaj: Rodzaj): string {
  const n = liczba(d, "prowizja");
  const vat = d.vat === "zw" ? "" : ", powiększone o należny podatek VAT";
  if (d.prowizjaTyp === "kwota") {
    return `Za dokonanie czynności pośrednictwa, których skutkiem będzie zawarcie umowy, o której mowa w § 2, Zamawiający zapłaci Pośrednikowi wynagrodzenie w wysokości ${kwota(d, "prowizja")} netto${vat}.`;
  }
  const podstawa = rodzaj === "najem" ? "miesięcznego czynszu najmu określonego w zawartej umowie najmu" : "ceny określonej w zawartej umowie";
  return `Za dokonanie czynności pośrednictwa, których skutkiem będzie zawarcie umowy, o której mowa w § 2, Zamawiający zapłaci Pośrednikowi wynagrodzenie w wysokości **${n > 0 ? n.toLocaleString("pl-PL") : "[…]"}%** ${rodzaj === "najem" ? "" : "netto "}${podstawa}${vat}.`;
}

function pouczenie(k: Kontekst): { tytul: string; akapity: string[] } {
  return {
    tytul: "Pouczenie o prawie odstąpienia od umowy",
    akapity: [
      "Mają Państwo prawo odstąpić od niniejszej umowy w terminie 14 dni bez podania jakiejkolwiek przyczyny. Termin do odstąpienia od umowy wygasa po upływie 14 dni od dnia zawarcia umowy.",
      `Aby skorzystać z prawa odstąpienia od umowy, muszą Państwo poinformować nas (${opisBiura(k)}${k.firma.email ? `, e-mail: ${k.firma.email}` : ""}${k.firma.telefon ? `, tel. ${k.firma.telefon}` : ""}) o swojej decyzji w drodze jednoznacznego oświadczenia, na przykład pismem wysłanym pocztą lub pocztą elektroniczną. Mogą Państwo skorzystać z wzoru formularza odstąpienia od umowy, jednak nie jest to obowiązkowe. Aby zachować termin, wystarczy wysłać informację przed jego upływem.`,
      "W przypadku odstąpienia od niniejszej umowy zwracamy wszystkie otrzymane od Państwa płatności niezwłocznie, nie później niż 14 dni od dnia, w którym zostaliśmy poinformowani o Państwa decyzji.",
      "Jeżeli zażądali Państwo rozpoczęcia świadczenia usług przed upływem terminu do odstąpienia od umowy, zapłacą nam Państwo kwotę proporcjonalną do zakresu świadczeń spełnionych do chwili, w której poinformowali nas Państwo o odstąpieniu. Jeżeli usługa zostanie w pełni wykonana przed upływem tego terminu na Państwa wyraźne żądanie, a Państwo przyjęli do wiadomości, że utracą prawo odstąpienia, prawo to nie przysługuje.",
      "**Wzór formularza odstąpienia od umowy** (formularz ten należy wypełnić i odesłać tylko w przypadku chęci odstąpienia od umowy):",
      `Adresat: ${opisBiura(k)}`,
      "Ja/My(*) niniejszym informuję/informujemy(*) o moim/naszym odstąpieniu od umowy o świadczenie następującej usługi: pośrednictwo w obrocie nieruchomościami.",
      "Data zawarcia umowy: ……………………………………",
      "Imię i nazwisko konsumenta(-ów): ……………………………………………………………………",
      "Adres konsumenta(-ów): ……………………………………………………………………………………………",
      "Podpis konsumenta(-ów) (tylko jeżeli formularz jest przesyłany w wersji papierowej): ……………………………",
      "Data: ……………………………………",
      "(*) Niepotrzebne skreślić.",
    ],
  };
}

function zbuduj(rodzaj: Rodzaj, d: Dane, k: Kontekst): Dokument {
  const o = OPIS[rodzaj];
  const Z = strony(d, "zamawiajacy");
  const wylaczna = d.wylacznosc === "wylaczna";
  const konsument = d.konsument !== "nie";
  const pozaBiurem = d.gdzie === "poza" || d.gdzie === "odleglosc";
  const odRazu = d.odRazu !== "nie";
  const naCzas = typeof d.doKiedy === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.doKiedy);
  const uwagi: string[] = [];
  if (!liczba(d, "prowizja")) uwagi.push("Nie podano wysokości wynagrodzenia. W umowie zostanie puste miejsce.");
  if (konsument && pozaBiurem) uwagi.push("Umowa zawierana poza biurem z konsumentem: do wydruku dołączamy pouczenie o odstąpieniu i formularz. Klient musi je dostać przed podpisaniem.");
  if (wylaczna && konsument) uwagi.push("Przy wyłączności z konsumentem zapis o karze lub wynagrodzeniu za sprzedaż z pominięciem biura musi być jednoznaczny i wyraźnie omówiony, inaczej może zostać uznany za niedozwolony.");

  const przedmiot =
    rodzaj === "kupno"
      ? [`Zamawiający poszukuje nieruchomości o następujących cechach: ${tekst(d, "kryteria", "kryteria poszukiwanej nieruchomości")}.`]
      : [
          `Przedmiotem umowy jest ${rodzaj === "najem" ? "lokal" : "nieruchomość"} położon${rodzaj === "najem" ? "y" : "a"} pod adresem **${tekst(d, "adres", "adres")}**: ${tekst(d, "opisNieruchomosci", "opis")}${d.kw ? `, księga wieczysta nr ${tekst(d, "kw")}` : ""}.`,
          `Zamawiający oświadcza, że jest uprawniony do dysponowania ${rodzaj === "najem" ? "Lokalem" : "Nieruchomością"} w zakresie niezbędnym do wykonania umowy.`,
          `${rodzaj === "najem" ? "Czynsz ofertowy" : "Cena ofertowa"} wynosi ${kwota(d, "cena")}${rodzaj === "najem" ? " miesięcznie" : ""}. Zmiana ceny ofertowej nie wymaga aneksu, wystarczy pisemna lub mailowa informacja Zamawiającego.`,
        ];

  return {
    tytul: `${o.tytul}${d.numer ? ` nr ${tekst(d, "numer")}` : ""}${wylaczna ? " (na wyłączność)" : ""}`,
    wstep: [
      `zawarta w dniu **${data(d, "data")} r.** w ${wMiescie(String(d.miasto || k.miasto))} pomiędzy:`,
      `${opisBiura(k)} (dalej: **„Pośrednik”**),`,
      "a",
      opisStron(Z, o.rolaKlienta),
    ],
    paragrafy: [
      { tytul: "§ 1. Przedmiot umowy", ustepy: numeruj(przedmiot) },
      { tytul: "§ 2. Zakres czynności", ustepy: numeruj([
        `Pośrednik zobowiązuje się do dokonywania czynności zmierzających do ${o.cel}.`,
        `Zakres czynności pośrednictwa obejmuje w szczególności: ${o.czynnosci.join("; ")}.`,
        "Pośrednik wykonuje czynności z należytą starannością, zgodnie z przepisami ustawy o gospodarce nieruchomościami, i oświadcza, że posiada ubezpieczenie od odpowiedzialności cywilnej za szkody wyrządzone w związku z wykonywaniem czynności pośrednictwa.",
      ]) },
      { tytul: "§ 3. Wyłączność", ustepy: wylaczna
        ? numeruj([
            `Zamawiający powierza Pośrednikowi wyłączne prawo do pośredniczenia ${rodzaj === "kupno" ? "w nabyciu nieruchomości" : `w ${rodzaj === "najem" ? "najmie Lokalu" : "sprzedaży Nieruchomości"}`} w okresie obowiązywania umowy.`,
            `W okresie obowiązywania umowy Zamawiający nie będzie korzystał z usług innych pośredników w tym zakresie${rodzaj === "kupno" ? "" : " ani samodzielnie ogłaszał oferty"}.`,
            `Jeżeli w okresie obowiązywania umowy Zamawiający zawrze umowę, o której mowa w § 2, z pominięciem Pośrednika, Pośrednikowi przysługuje wynagrodzenie w wysokości określonej w § 4, tak jakby umowa została zawarta przy jego udziale.`,
          ])
        : ["Umowa jest umową otwartą. Zamawiający może korzystać z usług innych pośredników i samodzielnie poszukiwać kontrahentów."] },
      { tytul: "§ 4. Wynagrodzenie", ustepy: numeruj([
        wynagrodzenie(d, rodzaj),
        "Wynagrodzenie jest należne, jeżeli umowa, o której mowa w § 2, zostanie zawarta z osobą, z którą Pośrednik skontaktował Zamawiającego lub której przedstawił ofertę w okresie obowiązywania umowy, także jeśli zawarcie nastąpi w ciągu 12 miesięcy od jej rozwiązania lub wygaśnięcia.",
        "Wynagrodzenie płatne jest w dniu zawarcia umowy przedwstępnej albo, gdy jej nie zawarto, umowy przenoszącej własność lub umowy najmu, na podstawie faktury wystawionej przez Pośrednika.",
      ]) },
      { tytul: "§ 5. Czas trwania umowy", ustepy: numeruj([
        naCzas
          ? `Umowa zostaje zawarta na czas oznaczony do dnia **${data(d, "doKiedy")} r.**${wylaczna ? "" : " Każda ze Stron może ją wypowiedzieć z zachowaniem miesięcznego okresu wypowiedzenia."}`
          : "Umowa zostaje zawarta na czas nieoznaczony. Każda ze Stron może ją wypowiedzieć z zachowaniem miesięcznego okresu wypowiedzenia.",
        "Wypowiedzenie wymaga formy pisemnej lub elektronicznej.",
      ]) },
      { tytul: "§ 6. Postanowienia końcowe", ustepy: numeruj([
        "Zmiany umowy wymagają formy pisemnej lub elektronicznej pod rygorem nieważności.",
        "W sprawach nieuregulowanych zastosowanie mają przepisy ustawy o gospodarce nieruchomościami oraz Kodeksu cywilnego.",
        konsument && pozaBiurem
          ? "Zamawiający oświadcza, że przed zawarciem umowy otrzymał pouczenie o prawie odstąpienia od umowy wraz ze wzorem formularza odstąpienia, stanowiące załącznik do umowy."
          : null,
        konsument && pozaBiurem && odRazu
          ? "**Zamawiający wyraźnie żąda rozpoczęcia świadczenia usług przed upływem terminu do odstąpienia od umowy** i przyjmuje do wiadomości, że w razie odstąpienia zapłaci Pośrednikowi kwotę proporcjonalną do zakresu świadczeń spełnionych do chwili odstąpienia, a po pełnym wykonaniu usługi przez Pośrednika przed upływem tego terminu utraci prawo odstąpienia od umowy, zgodnie z ustawą z dnia 30 maja 2014 r. o prawach konsumenta."
          : null,
        konsument && pozaBiurem && !odRazu
          ? "Pośrednik rozpocznie wykonywanie czynności po upływie terminu do odstąpienia od umowy."
          : null,
        "Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.",
      ]) },
    ],
    podpisy: [{ rola: "Pośrednik", osoby: k.agent.imie ? [k.agent.imie] : [] }, { rola: o.rolaKlienta, osoby: imiona(Z) }],
    dodatki: konsument && pozaBiurem ? [pouczenie(k)] : [],
    uwagi,
  };
}

function wzor(rodzaj: Rodzaj, id: string, nazwa: string, opis: string): Wzor {
  return {
    id,
    nazwa,
    kategoria: "Pośrednictwo",
    opis,
    poleKlienta: "zamawiajacy",
    zOferty: rodzaj === "kupno" ? undefined : { adres: "adres", cena: "cena" },
    grupy: grupy(rodzaj),
    buduj: (d, k) => zbuduj(rodzaj, d, k),
  };
}

export const WZORY_POSREDNICTWA: Wzor[] = [
  wzor("sprzedaz", "umowa-posrednictwa-sprzedazy", "Umowa pośrednictwa w sprzedaży", "Otwarta albo na wyłączność, z wynagrodzeniem procentowym lub kwotowym. Przy umowie zawieranej poza biurem z pouczeniem i formularzem odstąpienia."),
  wzor("kupno", "umowa-posrednictwa-kupna", "Umowa pośrednictwa w kupnie", "Dla kupującego: kryteria poszukiwań, zakres czynności i wynagrodzenie."),
  wzor("najem", "umowa-posrednictwa-najmu", "Umowa pośrednictwa w najmie", "Dla właściciela lokalu na wynajem, z wynagrodzeniem liczonym od czynszu."),
];
