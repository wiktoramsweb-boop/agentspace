/**
 * Protokół zdawczo-odbiorczy lokalu.
 *
 * Odwzorowany z protokołu, którego Spectra używa na papierze, ale liczniki
 * i klucze są listami, a nie sztywnymi wierszami: w jednym mieszkaniu jest
 * licznik gazu, w drugim ciepłomierz, a kluczy bywa osiem.
 */

export type Strona = {
  name: string;
  address: string;
  docNumber: string;
  pesel: string;
};

export type Licznik = {
  rodzaj: string;
  numer: string;
  stan: string;
  jednostka: string;
};

export type Klucz = {
  nazwa: string;
  ilosc: string;
};

export type Kierunek = "wydanie" | "zwrot";

export type ProtokolData = {
  kierunek: Kierunek;
  city: string;
  date: string;
  lokalAdres: string;
  umowaData: string;
  umowaRodzaj: string;
  zdajacy: Strona[];
  przejmujacy: Strona[];
  liczniki: Licznik[];
  klucze: Klucz[];
  klauzulaFoto: boolean;
  uwagi: string[];
  pustychUwag: number;
};

export const JEDNOSTKI = ["kWh", "m³", "GJ", "MWh", "szt.", "impuls"] as const;

/** Liczniki, które są prawie zawsze. Resztę agent dokłada sam. */
export const LICZNIKI_DOMYSLNE: Licznik[] = [
  { rodzaj: "Energia elektryczna", numer: "", stan: "", jednostka: "kWh" },
  { rodzaj: "Woda zimna", numer: "", stan: "", jednostka: "m³" },
  { rodzaj: "Woda ciepła", numer: "", stan: "", jednostka: "m³" },
];

export const LICZNIKI_PODPOWIEDZI = [
  "Energia elektryczna", "Energia elektryczna (taryfa nocna)", "Woda zimna", "Woda ciepła",
  "Gaz", "Ciepłomierz", "Ogrzewanie (podzielnik)", "Licznik ciepłej wody - kuchnia",
  "Licznik ciepłej wody - łazienka",
];

export const KLUCZE_DOMYSLNE: Klucz[] = [
  { nazwa: "Główny klucz do lokalu", ilosc: "" },
  { nazwa: "Klucz do śmietnika", ilosc: "" },
  { nazwa: "Klucz do skrzynki pocztowej", ilosc: "" },
  { nazwa: "Klucz do klatki schodowej", ilosc: "" },
  { nazwa: "Klucz do piwnicy", ilosc: "" },
];

export const KLUCZE_PODPOWIEDZI = [
  "Główny klucz do lokalu", "Klucz do śmietnika", "Klucz do skrzynki pocztowej",
  "Klucz do klatki schodowej", "Klucz do piwnicy", "Klucz do bramy", "Pilot do bramy",
  "Karta/brelok do domofonu", "Klucz do garażu", "Pilot do garażu", "Klucz do komórki lokatorskiej",
  "Klucz do rowerowni", "Klucz do skrzynki licznikowej",
];

export const KLAUZULA_FOTO =
  "Strony zgodnie oświadczają, że integralną częścią niniejszego protokołu jest dokumentacja " +
  "fotograficzna przedstawiająca stan lokalu oraz wyposażenia w dniu jego wydania. Dokumentacja " +
  "została sporządzona w obecności obu Stron i zostanie przesłana przez Wynajmującą na adres e-mail " +
  "Najemców wskazany w Umowie w terminie do końca dnia dzisiejszego. Najemcy zobowiązują się " +
  "potwierdzić otrzymanie wiadomości e-mail wraz z załącznikami w ciągu 24 godzin od jej otrzymania " +
  "pod rygorem uznania, że nie wnoszą zastrzeżeń do przesłanej dokumentacji.";

export function pustaStrona(): Strona {
  return { name: "", address: "", docNumber: "", pesel: "" };
}

export function domyslneDane(city: string): ProtokolData {
  return {
    kierunek: "wydanie",
    city,
    date: new Date().toISOString().slice(0, 10),
    lokalAdres: "",
    umowaData: "",
    umowaRodzaj: "najmu okazjonalnego",
    zdajacy: [pustaStrona()],
    przejmujacy: [pustaStrona()],
    liczniki: LICZNIKI_DOMYSLNE.map((l) => ({ ...l })),
    klucze: KLUCZE_DOMYSLNE.map((k) => ({ ...k })),
    klauzulaFoto: true,
    uwagi: [],
    pustychUwag: 3,
  };
}

export function dataPL(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "…………………";
  const [r, m, d] = iso.split("-");
  return `${d}.${m}.${r}`;
}

/**
 * Rodzaj gramatyczny z imienia. Polskie imiona żeńskie prawie zawsze kończą się
 * na „a", więc to działa w zdecydowanej większości przypadków, a tam gdzie nie
 * zadziała, agent i tak poprawi dokument ręcznie. Lepsze to niż „Zdający/Zdająca"
 * nad każdym podpisem.
 */
function zenskie(name: string): boolean {
  const imie = name.trim().split(/\s+/)[0] ?? "";
  return /a$/i.test(imie) && !/^(kuba|barnaba|bonawentura)$/i.test(imie);
}

/** Podpis pod kreską: mianownik, odmieniony przez liczbę i rodzaj. */
export function rolaPodpisu(osoby: Strona[], rola: "zdajacy" | "przejmujacy"): string {
  const nazwane = osoby.map((o) => o.name.trim()).filter(Boolean);
  const wiele = nazwane.length > 1;
  if (rola === "zdajacy") {
    if (wiele) return "Zdający";
    return zenskie(nazwane[0] ?? "") ? "Zdająca" : "Zdający";
  }
  if (wiele) return "Przejmujący";
  return zenskie(nazwane[0] ?? "") ? "Przejmująca" : "Przejmujący";
}

export function wierszStrony(s: Strona): string {
  const czesci = [
    `**${s.name.trim() || "…………………………………"}**`,
    s.address.trim() ? `zamieszkał(a) przy ${s.address.trim()}` : "zamieszkał(a) przy …………………………………",
  ];
  const dok: string[] = [];
  if (s.docNumber.trim()) dok.push(`seria i numer dowodu osobistego: ${s.docNumber.trim()}`);
  if (s.pesel.trim()) dok.push(`PESEL: ${s.pesel.trim()}`);
  return [czesci.join(", "), dok.join(", ")].filter(Boolean).join(", ");
}
