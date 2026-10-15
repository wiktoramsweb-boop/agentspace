/**
 * Płeć klienta w AI Coachu.
 *
 * Scenariusz ma postać z imieniem („Pan Krzysztof”), a agent może wybrać głos
 * drugiej płci. Wtedy cała postać musi się zmienić: imię, „Pan” na „Pani”
 * i odmiana. Bez tego agent mówił „Dzień dobry Pani”, a kobiecy głos
 * odpowiadał „mam na imię Krzysztof”.
 *
 * Imiona zamieniamy na odpowiedniki z tej samej litery, z pełną odmianą
 * (mianownik, dopełniacz, celownik, biernik, narzędnik, miejscownik, wołacz).
 * Plik bez importów, żeby dało się go sprawdzić testem w gołym node.
 */

export type Plec = "k" | "m";

type Odmiana = [string, string, string, string, string, string, string];

/** Pary [męskie, żeńskie]. Kolejność przypadków jak w Odmiana. */
const PARY: [Odmiana, Odmiana][] = [
  [["Krzysztof", "Krzysztofa", "Krzysztofowi", "Krzysztofa", "Krzysztofem", "Krzysztofie", "Krzysztofie"], ["Krystyna", "Krystyny", "Krystynie", "Krystynę", "Krystyną", "Krystynie", "Krystyno"]],
  [["Piotr", "Piotra", "Piotrowi", "Piotra", "Piotrem", "Piotrze", "Piotrze"], ["Paulina", "Pauliny", "Paulinie", "Paulinę", "Pauliną", "Paulinie", "Paulino"]],
  [["Tomasz", "Tomasza", "Tomaszowi", "Tomasza", "Tomaszem", "Tomaszu", "Tomaszu"], ["Teresa", "Teresy", "Teresie", "Teresę", "Teresą", "Teresie", "Tereso"]],
  [["Tadeusz", "Tadeusza", "Tadeuszowi", "Tadeusza", "Tadeuszem", "Tadeuszu", "Tadeuszu"], ["Danuta", "Danuty", "Danucie", "Danutę", "Danutą", "Danucie", "Danuto"]],
  [["Robert", "Roberta", "Robertowi", "Roberta", "Robertem", "Robercie", "Robercie"], ["Renata", "Renaty", "Renacie", "Renatę", "Renatą", "Renacie", "Renato"]],
  [["Marek", "Marka", "Markowi", "Marka", "Markiem", "Marku", "Marku"], ["Marta", "Marty", "Marcie", "Martę", "Martą", "Marcie", "Marto"]],
  [["Adam", "Adama", "Adamowi", "Adama", "Adamem", "Adamie", "Adamie"], ["Agata", "Agaty", "Agacie", "Agatę", "Agatą", "Agacie", "Agato"]],
  [["Bartosz", "Bartosza", "Bartoszowi", "Bartosza", "Bartoszem", "Bartoszu", "Bartoszu"], ["Barbara", "Barbary", "Barbarze", "Barbarę", "Barbarą", "Barbarze", "Barbaro"]],
  [["Emil", "Emila", "Emilowi", "Emila", "Emilem", "Emilu", "Emilu"], ["Ewa", "Ewy", "Ewie", "Ewę", "Ewą", "Ewie", "Ewo"]],
  [["Karol", "Karola", "Karolowi", "Karola", "Karolem", "Karolu", "Karolu"], ["Karolina", "Karoliny", "Karolinie", "Karolinę", "Karoliną", "Karolinie", "Karolino"]],
  [["Maciej", "Macieja", "Maciejowi", "Macieja", "Maciejem", "Macieju", "Macieju"], ["Magda", "Magdy", "Magdzie", "Magdę", "Magdą", "Magdzie", "Magdo"]],
  [["Norbert", "Norberta", "Norbertowi", "Norberta", "Norbertem", "Norbercie", "Norbercie"], ["Natalia", "Natalii", "Natalii", "Natalię", "Natalią", "Natalii", "Natalio"]],
  [["Henryk", "Henryka", "Henrykowi", "Henryka", "Henrykiem", "Henryku", "Henryku"], ["Hanna", "Hanny", "Hannie", "Hannę", "Hanną", "Hannie", "Hanno"]],
  [["Andrzej", "Andrzeja", "Andrzejowi", "Andrzeja", "Andrzejem", "Andrzeju", "Andrzeju"], ["Anna", "Anny", "Annie", "Annę", "Anną", "Annie", "Anno"]],
  [["Olek", "Olka", "Olkowi", "Olka", "Olkiem", "Olku", "Olku"], ["Ola", "Oli", "Oli", "Olę", "Olą", "Oli", "Olu"]],
];

const PAN: Odmiana = ["Pan", "Pana", "Panu", "Pana", "Panem", "Panu", "Panie"];
const PANI: Odmiana = ["Pani", "Pani", "Pani", "Panią", "Panią", "Pani", "Pani"];

/** Po tych słowach męskie „Krzysztofa” to dopełniacz, w innych miejscach biernik. */
const PRZYIMKI_DOPELNIACZA = new Set(["do", "od", "dla", "u", "bez", "z", "ze", "koło", "obok", "wokół", "według", "zamiast", "oprócz", "spod", "znad", "sprzed"]);
/** Po tych słowach żeńskie „Ewie” to miejscownik, w innych celownik. */
const PRZYIMKI_MIEJSCOWNIKA = new Set(["o", "w", "we", "przy", "na", "po"]);

type Forma = { para: number; plec: Plec; przypadki: number[] };

const FORMY = new Map<string, Forma>();
PARY.forEach(([m, k], para) => {
  for (const [plec, odm] of [["m", m], ["k", k]] as const) {
    odm.forEach((f, i) => {
      const było = FORMY.get(f);
      if (było && było.para === para && było.plec === plec) było.przypadki.push(i);
      else if (!było) FORMY.set(f, { para, plec, przypadki: [i] });
    });
  }
});

const IMIONA_RE = [...FORMY.keys()].sort((a, b) => b.length - a.length).join("|");
const WZOR = new RegExp(`(?:\\b(Panią|Panem|Panie|Pani|Pana|Panu|Pan)\\s+)?\\b(${IMIONA_RE})(?![a-ząćęłńóśźż])`, "g");

/** Który przypadek, gdy forma pasuje do kilku (Krzysztofa = D. i B.). */
function wybierzPrzypadek(f: Forma, honor: string | undefined, poprzednie: string): number {
  const p = f.przypadki;
  if (p.length === 1) return p[0];
  if (honor === "Panią") return p.includes(3) ? 3 : p.includes(4) ? 4 : p[0];
  if (honor === "Panem") return 4;
  if (honor === "Panu") return p.includes(2) ? 2 : 5;
  if (p.includes(1) && p.includes(3)) return PRZYIMKI_DOPELNIACZA.has(poprzednie) ? 1 : 3;
  if (p.includes(1) && PRZYIMKI_DOPELNIACZA.has(poprzednie)) return 1;
  if (p.includes(2) && p.includes(5)) return PRZYIMKI_MIEJSCOWNIKA.has(poprzednie) ? 5 : 2;
  if (p.includes(5) && p.includes(6)) return 5;
  return p[0];
}

/** Zamienia postać scenariusza na wskazaną płeć: imiona, „Pan/Pani” i odmianę. */
export function zmienPlecTekstu(tekst: string, docelowa: Plec): string {
  return tekst.replace(WZOR, (cale, honor: string | undefined, imie: string, offset: number) => {
    const f = FORMY.get(imie);
    if (!f || f.plec === docelowa) return cale;
    const przed = tekst.slice(Math.max(0, offset - 20), offset).trim().split(/\s+/).pop()?.toLowerCase() ?? "";
    const przypadek = wybierzPrzypadek(f, honor, przed);
    const [m, k] = PARY[f.para];
    const noweImie = (docelowa === "k" ? k : m)[przypadek];
    if (!honor) return noweImie;
    return `${(docelowa === "k" ? PANI : PAN)[przypadek]} ${noweImie}`;
  });
}

/** Imię postaci w mianowniku po zamianie, np. „Krystyna”. Pusty, gdy postać bez imienia. */
export function imiePostaci(tekst: string): string {
  WZOR.lastIndex = 0;
  const m = WZOR.exec(tekst);
  WZOR.lastIndex = 0;
  if (!m) return "";
  const f = FORMY.get(m[2]);
  if (!f) return "";
  const [mesk, zen] = PARY[f.para];
  return (f.plec === "m" ? mesk : zen)[0];
}

/**
 * Instrukcja dla klienta AI, gdy jego płeć różni się od opisu scenariusza.
 * Zamiana imion w opisie załatwia większość, ale przymiotniki („zmęczona”)
 * i czasowniki zostają w opisie, więc model musi wiedzieć, że ma je odwrócić.
 */
export function instrukcjaPlci(docelowa: Plec, imie: string): string {
  const kto = docelowa === "k" ? "KOBIETĘ" : "MĘŻCZYZNĘ";
  const formy = docelowa === "k" ? "żeńskich (byłam, chciałabym, jestem zainteresowana)" : "męskich (byłem, chciałbym, jestem zainteresowany)";
  const zwrot = docelowa === "k" ? "„Pani”" : "„Pan”";
  return `\n\nPŁEĆ POSTACI (ważniejsze niż reszta opisu): grasz ${kto}${imie ? ` o imieniu ${imie}` : ""}. O sobie mów wyłącznie w formach ${formy}. Jeśli w opisie postaci zostały formy drugiej płci, traktuj je jako pomyłkę i ich nie powtarzaj. Agent powinien zwracać się do Ciebie ${zwrot}; jeśli użyje złej formy, możesz go spokojnie poprawić, jak zrobiłby to prawdziwy klient.`;
}
