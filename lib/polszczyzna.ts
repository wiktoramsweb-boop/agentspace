/**
 * Drobna pomoc językowa do dokumentów.
 *
 * Dokument, w którym stoi „zawarty w Kraków" albo „zwaną dalej" przy mężczyźnie,
 * wygląda na zrobiony automatem i agent się go wstydzi przy kliencie. To są
 * reguły przybliżone, nie słownik: pokrywają zdecydowaną większość przypadków,
 * a resztę agent poprawi w polu formularza.
 */

/** Miasta, w których odmiana nie wynika z reguły. */
const MIEJSCOWNIK: Record<string, string> = {
  kraków: "Krakowie",
  warszawa: "Warszawie",
  łódź: "Łodzi",
  wrocław: "Wrocławiu",
  poznań: "Poznaniu",
  gdańsk: "Gdańsku",
  gdynia: "Gdyni",
  szczecin: "Szczecinie",
  bydgoszcz: "Bydgoszczy",
  lublin: "Lublinie",
  katowice: "Katowicach",
  białystok: "Białymstoku",
  częstochowa: "Częstochowie",
  radom: "Radomiu",
  sosnowiec: "Sosnowcu",
  toruń: "Toruniu",
  kielce: "Kielcach",
  rzeszów: "Rzeszowie",
  gliwice: "Gliwicach",
  zabrze: "Zabrzu",
  olsztyn: "Olsztynie",
  "bielsko-biała": "Bielsku-Białej",
  "nowy sącz": "Nowym Sączu",
  tarnów: "Tarnowie",
  opole: "Opolu",
  zakopane: "Zakopanem",
  wieliczka: "Wieliczce",
  skawina: "Skawinie",
};

/** „Kraków" -> „Krakowie". Gdy nie wiemy, oddajemy nazwę bez zmian. */
export function wMiejscowniku(miasto: string): string {
  const m = miasto.trim();
  if (!m) return "…………………";
  const znane = MIEJSCOWNIK[m.toLowerCase()];
  if (znane) return znane;
  if (/ów$/i.test(m)) return m.slice(0, -2) + "owie";
  if (/[aeiouy]$/i.test(m)) return m;
  return m;
}

/**
 * Rodzaj z imienia. Polskie imiona żeńskie prawie zawsze kończą się na „a",
 * z garstką wyjątków męskich, które wypisujemy wprost.
 */
const MESKIE_NA_A = new Set(["kuba", "barnaba", "bonawentura", "jarema"]);

export function imieZenskie(name: string): boolean {
  const imie = (name.trim().split(/\s+/)[0] ?? "").toLowerCase();
  return /a$/.test(imie) && !MESKIE_NA_A.has(imie);
}

/** „zwaną" albo „zwanym", zależnie od osoby; przy wielu osobach „zwanymi". */
export function zwany(osoby: string[]): string {
  const nazwane = osoby.map((o) => o.trim()).filter(Boolean);
  if (nazwane.length > 1) return "zwanymi";
  return imieZenskie(nazwane[0] ?? "") ? "zwaną" : "zwanym";
}
