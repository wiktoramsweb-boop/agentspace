/**
 * Aneks do umowy pośrednictwa.
 *
 * Najczęstszy przypadek to przedłużenie czasu współpracy i on jest domyślny,
 * ale ten sam dokument obsługuje zmianę prowizji, zmianę ceny ofertowej
 * i zmianę dowolnego paragrafu wpisanego z ręki. Inaczej za miesiąc trzeba by
 * robić drugi generator na zmianę prowizji.
 */

export type RodzajAneksu = "termin" | "prowizja" | "cena" | "wlasny";

export const RODZAJE_ANEKSU: { value: RodzajAneksu; label: string; paragraf: string }[] = [
  { value: "termin", label: "Przedłużenie czasu współpracy", paragraf: "§6.1" },
  { value: "prowizja", label: "Zmiana wynagrodzenia", paragraf: "§4.1" },
  { value: "cena", label: "Zmiana ceny ofertowej", paragraf: "§2.2" },
  { value: "wlasny", label: "Inna zmiana", paragraf: "" },
];

export type Zleceniodawca = {
  name: string;
  pesel: string;
  docNumber: string;
  address: string;
};

export type AneksData = {
  rodzaj: RodzajAneksu;
  /** Pełne dane przedsiębiorcy, z możliwością poprawienia przed wydrukiem. */
  przedsiebiorca: string;
  /**
   * Kto podpisuje w imieniu biura. Umowy przedłuża zwykle agent prowadzący,
   * a nie wspólnicy, więc na dokumencie musi stać jego nazwisko.
   */
  reprezentant: string;
  /** Rodzaj umowy w tytule: sprzedaży albo najmu. */
  przedmiot: string;
  umowaNr: string;
  umowaData: string;
  aneksData: string;
  city: string;
  zleceniodawcy: Zleceniodawca[];
  /** Tylko dla rodzaju „termin". */
  terminOd: string;
  terminDo: string;
  /** Tylko dla „prowizja" i „cena". */
  nowaWartosc: string;
  /** Dla rodzaju „wlasny": który paragraf i jego nowe brzmienie. */
  wlasnyParagraf: string;
  wlasnaTresc: string;
  /** Dodatkowe postanowienia, każde jako osobny paragraf. */
  dodatkowe: string[];
};

export function pustyZleceniodawca(): Zleceniodawca {
  return { name: "", pesel: "", docNumber: "", address: "" };
}

export function domyslnyAneks(city: string): AneksData {
  const dzis = new Date().toISOString().slice(0, 10);
  return {
    rodzaj: "termin",
    przedsiebiorca: "",
    reprezentant: "",
    przedmiot: "sprzedaży nieruchomości",
    umowaNr: "",
    umowaData: "",
    aneksData: dzis,
    city,
    zleceniodawcy: [pustyZleceniodawca()],
    terminOd: dzis,
    terminDo: "",
    nowaWartosc: "",
    wlasnyParagraf: "",
    wlasnaTresc: "",
    dodatkowe: [],
  };
}

export function dataPL(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "…………………";
  const [r, m, d] = iso.split("-");
  return `${d}.${m}.${r}`;
}

/** Który paragraf zmieniamy i jakie dostaje brzmienie. */
export function zmianaAneksu(d: AneksData): { paragraf: string; tresc: string } {
  if (d.rodzaj === "termin") {
    return {
      paragraf: "§6.1",
      tresc: `Umowa zostaje zawarta na czas oznaczony: od ${dataPL(d.terminOd)} r. do ${dataPL(d.terminDo)} r.`,
    };
  }
  if (d.rodzaj === "prowizja") {
    return {
      paragraf: "§4.1",
      tresc: `Z tytułu wykonania niniejszej Umowy Przedsiębiorcy przysługuje wynagrodzenie w wysokości ${d.nowaWartosc || "…………………"}.`,
    };
  }
  if (d.rodzaj === "cena") {
    return {
      paragraf: "§2.2",
      tresc: `Strony ustalają cenę ofertową nieruchomości na kwotę ${d.nowaWartosc || "…………………"}.`,
    };
  }
  return {
    paragraf: d.wlasnyParagraf.trim() || "…………",
    tresc: d.wlasnaTresc.trim() || "…………………………………",
  };
}

export function wierszZleceniodawcy(z: Zleceniodawca): string {
  const dane: string[] = [];
  if (z.pesel.trim()) dane.push(`PESEL: ${z.pesel.trim()}`);
  if (z.docNumber.trim()) dane.push(`dokument tożsamości nr ${z.docNumber.trim()}`);
  const adres = z.address.trim() ? `zamieszkały(a) pod adresem: ${z.address.trim()}` : "";
  return [`**${z.name.trim() || "…………………………………"}**`, dane.join(", "), adres]
    .filter(Boolean)
    .join(", ");
}
