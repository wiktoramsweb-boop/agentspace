/**
 * Karta rozmowy: do kogo dzwonisz i czego dotyczy sprawa.
 *
 * Wyciągana z opisu scenariusza, a nie z osobnych pól w bazie. Opisy są pisane
 * jednym stylem („Dzwonisz do Pana Krzysztofa... 3 pokoje, 65 m², Ruczaj,
 * 890 tys."), więc da się to odczytać, a autor scenariusza nie musi wypełniać
 * drugiego zestawu pól i pilnować, żeby się nie rozjechał z treścią.
 *
 * Plik celowo BEZ importów - jest objęty testem w gołym node
 * (`npm run test:karta`), bo odmiana polskich imion ma tyle wyjątków,
 * że bez niego cicho zepsułoby się przy pierwszym nowym scenariuszu.
 */

export type KartaRozmowy = {
  /** „Pan Krzysztof", „Pani Magda" albo „Właściciel", gdy scenariusz nie podaje imienia. */
  kto: string;
  /** Drobiazgi do paska pod nazwiskiem: metraż, pokoje, dzielnica, cena. */
  szczegoly: string[];
};

/**
 * Mianownik z przypadka zależnego.
 *
 * Kolejność reguł ma znaczenie: „Markiem" musi trafić na „kiem" wcześniej niż
 * na „em", bo inaczej wyjdzie „Marki". To jest ruchome e i nie da się go
 * wyliczyć z samej końcówki.
 *
 * Funkcja zakłada formę odmienioną, bo w opisach scenariuszy imię zawsze stoi
 * po „Pana" albo „Panią". Podane w mianowniku zostanie przycięte i to jest
 * świadomy kompromis, nie przeoczenie.
 */
export function mianownikImienia(odmienione: string): string {
  const w = odmienione;
  // Krótsze niż trzy litery to nie imię. „Oli" ma dokładnie trzy i musi przejść
  // przez reguły, więc próg nie może być wyżej.
  if (w.length < 3) return w;
  if (w.endsWith("kiem")) return `${w.slice(0, -4)}ek`;
  if (w.endsWith("owi")) return w.slice(0, -3);
  if (w.endsWith("em")) return w.slice(0, -2);
  if (w.endsWith("ą")) return `${w.slice(0, -1)}a`;
  if (w.endsWith("ii")) return `${w.slice(0, -2)}ia`;
  if (w.endsWith("ki")) return `${w.slice(0, -2)}ka`;
  if (w.endsWith("i")) return `${w.slice(0, -1)}a`;
  if (w.endsWith("ka")) return `${w.slice(0, -2)}ek`;
  if (w.endsWith("y")) return `${w.slice(0, -1)}a`;
  if (w.endsWith("a")) return w.slice(0, -1);
  return w;
}

/** Dzielnice, które padają w scenariuszach. Lista zamknięta, żeby nie łapać przypadkowych słów. */
const DZIELNICE = [
  "Ruczaj", "Krowodrza", "Bronowice", "Zabłocie", "Kazimierz", "Czyżyny",
  "Podgórze", "Nowa Huta", "Dębniki", "Prądnik", "Grzegórzki", "Stare Miasto",
  "Salwator", "Azory", "Bieżanów", "Kurdwanów", "Wola Duchacka", "Mistrzejowice",
  "Bieńczyce", "Łagiewniki", "Olsza", "Zwierzyniec",
];

function tytul(slowo: string): "Pan" | "Pani" {
  return slowo.toLowerCase().startsWith("pan") && !slowo.toLowerCase().startsWith("pani")
    ? "Pan"
    : "Pani";
}

/**
 * Czy imię trzeba odmienić, czy stoi już w mianowniku.
 *
 * Opisy scenariuszy mieszają przypadki: „Dzwonisz do Pana Krzysztofa", ale też
 * „Pani Ewa jest przekonana". Przy męskich rozstrzyga sam tytuł, bo „Pan"
 * występuje tylko w mianowniku. Przy żeńskich tytuł brzmi tak samo w obu
 * przypadkach, więc patrzymy na końcówkę: polskie imiona żeńskie kończą się
 * w mianowniku na „a", a w dopełniaczu na „y" albo „i".
 */
function trzebaOdmienic(tytulSlowo: string, imie: string): boolean {
  const t = tytulSlowo.toLowerCase();
  if (t === "pan") return false;
  if (t === "pani") return !imie.endsWith("a");
  return true;
}

/**
 * Płeć rozmówcy, do wyboru głosu.
 *
 * Bierzemy ją ze scenariusza, a nie z osobowości klienta. Na ekranie telefonu
 * stoi „Pani Anna" i głos musi się z tym zgadzać, bo inaczej pierwsza rozmowa
 * na pokazie handlowym kompromituje całą funkcję.
 */
export function plecRozmowcy(brief: string): "k" | "m" {
  const { kto } = kartaRozmowy(brief);
  if (kto.startsWith("Pani")) return "k";
  if (kto.startsWith("Pan")) return "m";
  // Role bez imienia (Właściciel, Najemca, Kupujący) idą na głos męski.
  return "m";
}

export function kartaRozmowy(brief: string, zapasowyTytul = "Klient"): KartaRozmowy {
  const tekst = brief ?? "";

  /* ── Kto ── */
  let kto = "";
  // „Pana Krzysztofa", „Pani Magdy", „Panem Markiem", „u Pana Tadeusza".
  // Dłuższe formy przed krótszymi, żeby „Panem" nie dopasowało się jako „Pan".
  const osoba = /\b(Panią|Panem|Pani|Pana|Panu|Pan)\s+([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)/.exec(tekst);
  if (osoba) {
    const imie = trzebaOdmienic(osoba[1], osoba[2]) ? mianownikImienia(osoba[2]) : osoba[2];
    kto = `${tytul(osoba[1])} ${imie}`;
  } else if (/w[łl]a[śs]cicie/i.test(tekst)) {
    kto = "Właściciel";
  } else if (/najemc/i.test(tekst)) {
    kto = "Najemca";
  } else if (/kupuj[ąa]c/i.test(tekst)) {
    kto = "Kupujący";
  } else {
    kto = zapasowyTytul;
  }

  /* ── Szczegóły ── */
  const szczegoly: string[] = [];

  const pokoje = /(\d+)\s*pok/i.exec(tekst);
  if (pokoje) {
    const n = Number(pokoje[1]);
    szczegoly.push(`${n} ${n === 1 ? "pokój" : n < 5 ? "pokoje" : "pokoi"}`);
  }

  const metraz = /(\d+)\s*m[²2]/i.exec(tekst);
  if (metraz) szczegoly.push(`${metraz[1]} m²`);

  const dzielnica = DZIELNICE.find((d) => tekst.includes(d));
  if (dzielnica) szczegoly.push(dzielnica);

  // Czynsz ma pierwszeństwo przed ceną: przy najmie to on jest tą liczbą,
  // o której się rozmawia.
  const czynsz = /(\d[\d\s]*)\s*z[łl]\s*\/\s*m(?:c|ies)/i.exec(tekst);
  const cena = /(\d+(?:[.,]\d+)?)\s*(tys\.|mln)/i.exec(tekst);
  if (czynsz) szczegoly.push(`${czynsz[1].replace(/\s+/g, " ").trim()} zł/mc`);
  else if (cena) szczegoly.push(`${cena[1].replace(".", ",")} ${cena[2]} zł`);

  return { kto, szczegoly };
}
