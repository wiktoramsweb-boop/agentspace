import {
  data,
  kwota,
  imiona,
  numeruj,
  opisBiura,
  opisStron,
  strony,
  tekst,
  type Dane,
  type Kontekst,
  type Wzor,
} from "./silnik";

function miejscowosc(d: Dane, k: Kontekst): string {
  return String(d.miasto ?? "").trim() || k.miasto.trim() || "[miejscowość]";
}

// ── Potwierdzenie prezentacji ──────────────────────────────

const potwierdzeniePrezentacji: Wzor = {
  id: "potwierdzenie-prezentacji",
  nazwa: "Potwierdzenie prezentacji nieruchomości",
  kategoria: "Pośrednictwo",
  opis: "Klient podpisuje, że ofertę pokazało mu Twoje biuro. Najczęstszy dowód w sporze o prowizję, gdy kupujący próbuje dogadać się z właścicielem bez pośrednika.",
  poleKlienta: "ogladajacy",
  zOferty: { adres: "adres", cena: "cena" },
  grupy: [
    { tytul: "Prezentacja", pola: [
      { k: "data", e: "Data prezentacji", typ: "data", dom: "dzis" },
      { k: "godzina", e: "Godzina", typ: "tekst", placeholder: "17:30" },
      { k: "miasto", e: "Miejscowość", typ: "tekst" },
      { k: "adres", e: "Adres nieruchomości", typ: "tekst", szer: "cala" },
      { k: "cena", e: "Cena ofertowa (zł)", typ: "kwota" },
      { k: "numerOferty", e: "Numer oferty", typ: "tekst" },
    ] },
    { tytul: "Oglądający", pola: [{ k: "ogladajacy", e: "Osoby oglądające", typ: "strony", rola: "Oglądający" }] },
  ],
  buduj(d, k) {
    const O = strony(d, "ogladajacy");
    return {
      tytul: "Potwierdzenie prezentacji nieruchomości",
      wstep: [`${miejscowosc(d, k)}, dnia ${data(d, "data")} r.${d.godzina ? `, godz. ${tekst(d, "godzina")}` : ""}`],
      paragrafy: [
        { ustepy: numeruj([
          `${opisStron(O, "Oglądający")} potwierdza, że w dniu ${data(d, "data")} r. ${opisBiura(k)} (dalej: „Pośrednik”) przedstawił mu nieruchomość położoną pod adresem **${tekst(d, "adres", "adres nieruchomości")}**${d.numerOferty ? `, oferta nr ${tekst(d, "numerOferty")}` : ""}, oferowaną${d.cena ? ` w cenie ${kwota(d, "cena")}` : ""}.`,
          "Oglądający oświadcza, że przed dniem prezentacji nie znał tej nieruchomości jako oferty sprzedaży lub najmu ani jej właściciela w związku z tą ofertą, chyba że zaznaczył to poniżej.",
          "Oglądający przyjmuje do wiadomości, że informacje o nieruchomości i jej właścicielu uzyskał od Pośrednika, a zawarcie umowy dotyczącej tej nieruchomości z jej właścicielem w okresie 12 miesięcy od prezentacji, z pominięciem Pośrednika, może rodzić obowiązek zapłaty wynagrodzenia zgodnie z zawartą umową pośrednictwa.",
          "Uwagi Oglądającego: …………………………………………………………………………………………………………",
        ]) },
      ],
      podpisy: [{ rola: "Pośrednik", osoby: k.agent.imie ? [k.agent.imie] : [] }, { rola: "Oglądający", osoby: imiona(O) }],
      uwagi: ["Ten dokument wzmacnia pozycję biura, ale prowizja od kupującego należy się tylko wtedy, gdy kupujący podpisał z biurem umowę pośrednictwa. Bez niej potwierdzenie jest dowodem, a nie podstawą roszczenia."],
    };
  },
};

// ── Pełnomocnictwo ─────────────────────────────────────────

const pelnomocnictwo: Wzor = {
  id: "pelnomocnictwo-dokumenty",
  nazwa: "Pełnomocnictwo do uzyskania dokumentów",
  kategoria: "Sprzedaż i transakcja",
  opis: "Właściciel upoważnia agenta do odebrania zaświadczeń: o braku zaległości, o osobach zameldowanych, wypisu z rejestru gruntów, dokumentów ze spółdzielni.",
  poleKlienta: "mocodawca",
  zOferty: { adres: "adres", kw: "kw" },
  grupy: [
    { tytul: "Pełnomocnictwo", pola: [
      { k: "data", e: "Data", typ: "data", dom: "dzis" },
      { k: "miasto", e: "Miejscowość", typ: "tekst" },
      { k: "adres", e: "Adres nieruchomości", typ: "tekst", szer: "cala" },
      { k: "kw", e: "Numer księgi wieczystej", typ: "tekst" },
    ] },
    { tytul: "Mocodawca (właściciel)", pola: [{ k: "mocodawca", e: "Mocodawca", typ: "strony", rola: "Mocodawca" }] },
    { tytul: "Pełnomocnik", pola: [
      { k: "pelnomocnik", e: "Pełnomocnik", typ: "strony", rola: "Pełnomocnik", podp: "Zwykle agent prowadzący ofertę." },
    ] },
    { tytul: "Zakres", pola: [
      { k: "zakres", e: "Dokumenty i sprawy", typ: "opis", dom: "zaświadczenia o braku osób zameldowanych w lokalu; zaświadczenia o braku zaległości w opłatach eksploatacyjnych od zarządcy, wspólnoty mieszkaniowej lub spółdzielni; zaświadczenia ze spółdzielni o przysługującym prawie do lokalu; wypisu i wyrysu z rejestru gruntów; zaświadczenia o przeznaczeniu nieruchomości w miejscowym planie zagospodarowania przestrzennego; kopii dokumentów z akt księgi wieczystej" },
    ] },
  ],
  buduj(d, k) {
    const M = strony(d, "mocodawca");
    const P = strony(d, "pelnomocnik");
    return {
      tytul: "Pełnomocnictwo",
      wstep: [`${miejscowosc(d, k)}, dnia ${data(d, "data")} r.`],
      paragrafy: [
        { ustepy: numeruj([
          `${opisStron(M, "Mocodawca")} udziela ${opisStron(P, "Pełnomocnik")} pełnomocnictwa do reprezentowania Mocodawcy przed organami administracji publicznej, sądami wieczystoksięgowymi, zarządcami nieruchomości, wspólnotami mieszkaniowymi i spółdzielniami mieszkaniowymi w sprawach dotyczących nieruchomości położonej pod adresem **${tekst(d, "adres", "adres nieruchomości")}**${d.kw ? `, dla której prowadzona jest księga wieczysta nr ${tekst(d, "kw")}` : ""}.`,
          `Pełnomocnictwo obejmuje składanie wniosków o wydanie i odbiór w imieniu Mocodawcy: ${tekst(d, "zakres", "zakres dokumentów")}.`,
          "Pełnomocnictwo nie obejmuje rozporządzania nieruchomością ani zaciągania zobowiązań w imieniu Mocodawcy.",
          "Pełnomocnictwo jest ważne do odwołania, nie dłużej jednak niż przez 12 miesięcy od dnia jego udzielenia.",
        ]) },
      ],
      podpisy: [{ rola: "", osoby: [] }, { rola: "Mocodawca", osoby: imiona(M) }],
      uwagi: ["Złożenie pełnomocnictwa w urzędzie wymaga zwykle opłaty skarbowej 17 zł (z wyjątkami, np. dla najbliższej rodziny)."],
    };
  },
};

// ── Oświadczenie sprzedającego o stanie prawnym ────────────

const oswiadczenieSprzedajacego: Wzor = {
  id: "oswiadczenie-sprzedajacego",
  nazwa: "Oświadczenie sprzedającego o stanie nieruchomości",
  kategoria: "Sprzedaż i transakcja",
  opis: "Właściciel potwierdza na piśmie to, co mówi przy przyjęciu oferty: obciążenia, zameldowanie, zaległości, wady. Chroni biuro, gdy później wyjdzie coś, o czym nie powiedział.",
  poleKlienta: "sprzedajacy",
  zOferty: { adres: "adres", kw: "kw" },
  grupy: [
    { tytul: "Nieruchomość", pola: [
      { k: "data", e: "Data", typ: "data", dom: "dzis" },
      { k: "miasto", e: "Miejscowość", typ: "tekst" },
      { k: "adres", e: "Adres", typ: "tekst", szer: "cala" },
      { k: "kw", e: "Numer księgi wieczystej", typ: "tekst" },
      { k: "tytul", e: "Tytuł prawny", typ: "wybor", dom: "wlasnosc", opcje: [
        { v: "wlasnosc", l: "Odrębna własność lokalu" },
        { v: "spoldzielcze", l: "Spółdzielcze własnościowe prawo do lokalu" },
        { v: "grunt", l: "Własność gruntu (dom, działka)" },
        { v: "uzytkowanie", l: "Użytkowanie wieczyste" },
      ] },
    ] },
    { tytul: "Sprzedający", pola: [{ k: "sprzedajacy", e: "Sprzedający", typ: "strony", rola: "Sprzedający" }] },
    { tytul: "Stan prawny i faktyczny", opis: "Wpisz „brak”, jeśli nie dotyczy.", pola: [
      { k: "hipoteka", e: "Hipoteki i obciążenia", typ: "opis", dom: "brak" },
      { k: "zameldowani", e: "Osoby zameldowane", typ: "opis", dom: "brak" },
      { k: "zaleglosci", e: "Zaległości w opłatach", typ: "opis", dom: "brak" },
      { k: "lokatorzy", e: "Najemcy, lokatorzy, użytkownicy", typ: "opis", dom: "brak" },
      { k: "wady", e: "Znane wady techniczne", typ: "opis", dom: "brak" },
      { k: "spory", e: "Toczące się postępowania i spory", typ: "opis", dom: "brak" },
    ] },
  ],
  buduj(d, k) {
    const S = strony(d, "sprzedajacy");
    const TYTULY: Record<string, string> = {
      wlasnosc: "odrębnej własności lokalu",
      spoldzielcze: "spółdzielczego własnościowego prawa do lokalu",
      grunt: "własności nieruchomości gruntowej",
      uzytkowanie: "prawa użytkowania wieczystego",
    };
    return {
      tytul: "Oświadczenie sprzedającego o stanie nieruchomości",
      wstep: [`${miejscowosc(d, k)}, dnia ${data(d, "data")} r.`],
      paragrafy: [
        { ustepy: numeruj([
          `${opisStron(S, "Sprzedający")} oświadcza, że przysługuje mu prawo ${TYTULY[String(d.tytul)] ?? TYTULY.wlasnosc} do nieruchomości położonej pod adresem **${tekst(d, "adres", "adres")}**${d.kw ? `, księga wieczysta nr ${tekst(d, "kw")}` : ""}.`,
          `Hipoteki i inne obciążenia: ${tekst(d, "hipoteka", "brak")}.`,
          `Osoby zameldowane: ${tekst(d, "zameldowani", "brak")}.`,
          `Zaległości w opłatach eksploatacyjnych, podatkach i mediach: ${tekst(d, "zaleglosci", "brak")}.`,
          `Najemcy, lokatorzy i inni użytkownicy: ${tekst(d, "lokatorzy", "brak")}.`,
          `Znane wady techniczne i prawne: ${tekst(d, "wady", "brak")}.`,
          `Toczące się postępowania sądowe, administracyjne i egzekucyjne dotyczące nieruchomości: ${tekst(d, "spory", "brak")}.`,
          `Sprzedający oświadcza, że powyższe informacje są zgodne z prawdą i zobowiązuje się niezwłocznie poinformować ${opisBiura(k)} (dalej: „Pośrednik”) o każdej ich zmianie. Sprzedający przyjmuje do wiadomości, że Pośrednik przekazuje te informacje osobom zainteresowanym nabyciem nieruchomości.`,
        ]) },
      ],
      podpisy: [{ rola: "", osoby: [] }, { rola: "Sprzedający", osoby: imiona(S) }],
    };
  },
};

export const WZORY_INNE: Wzor[] = [potwierdzeniePrezentacji, pelnomocnictwo, oswiadczenieSprzedajacego];
