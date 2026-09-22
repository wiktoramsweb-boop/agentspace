/**
 * Katalog wzorów stron. Każdy wzór to osobny projekt graficzny, a nie inny
 * kolor tego samego szablonu: inne fonty, inna siatka, inny rytm sekcji.
 */

export type WzorSlug = "kamienica" | "nokturn" | "siatka" | "przystan";

export type Wzor = {
  slug: WzorSlug;
  /** Nazwa handlowa wzoru (tak nazywamy go w cenniku). */
  name: string;
  /** Nazwa fikcyjnego biura użyta w demo. */
  office: string;
  tagline: string;
  forWhom: string;
  /** Trzy rzeczy, które ten wzór robi inaczej niż pozostałe. */
  highlights: string[];
  /** Kolory do podglądu w galerii. */
  swatch: [string, string, string];
  /** Zdjęcie na kartę w galerii wzorów. */
  preview: string;
  /** Klasa CSS motywu na elemencie głównym. */
  root: string;
  dark: boolean;
  fonts: string;
  /* Dane fikcyjnego biura, żeby wzór wyglądał jak działająca strona. */
  sub: string;
  phone: string;
  email: string;
  address: string[];
  nip: string;
  navCta?: string;
};

export const WZORY: Wzor[] = [
  {
    slug: "kamienica",
    name: "Kamienica",
    office: "Kamienica Nieruchomości",
    tagline: "Redakcyjny, spokojny, z dużą fotografią. Dla biur, które sprzedają drogo i bez krzyku.",
    forWhom: "Biuro premium, rynek wtórny, kamienice i apartamenty",
    highlights: [
      "Układ jak w magazynie: duże zdjęcia, szeryfowy nagłówek, dużo powietrza",
      "Wyszukiwarka schowana w nagłówku, żeby pierwsze wrażenie robiła oferta",
      "Sekcja historii transakcji zamiast pustych haseł o profesjonalizmie",
    ],
    swatch: ["#F7F4EF", "#171310", "#B4543A"],
    preview: "/wzory/kamienica.jpg",
    root: "wz-kam",
    dark: false,
    fonts: "Fraunces + Manrope",
    sub: "Kraków",
    phone: "12 430 10 20",
    email: "biuro@kamienica-wzor.pl",
    address: ["ul. Starowiślna 18/3", "31-032 Kraków"],
    nip: "NIP 676 000 00 00",
    navCta: "Umów rozmowę",
  },
  {
    slug: "nokturn",
    name: "Nokturn",
    office: "Nokturn Estates",
    tagline: "Ciemny, filmowy, ze złotym akcentem. Dla ofert, które ogląda się wieczorem na telefonie.",
    forWhom: "Apartamenty premium, rynek luksusowy, klient zagraniczny",
    highlights: [
      "Kinowy nagłówek z powolnym najazdem na zdjęcie",
      "Karty ofert ze szkłem i złotem, czytelne na ciemnym tle",
      "Sekcja dla klienta zagranicznego z tłumaczeniem obsługi",
    ],
    swatch: ["#0B0B0D", "#F2EFE9", "#D9B679"],
    preview: "/wzory/miasto-noc.jpg",
    root: "wz-nok",
    dark: true,
    fonts: "Cormorant Garamond + Jost",
    sub: "Estates",
    phone: "12 430 20 30",
    email: "office@nokturn-wzor.pl",
    address: ["Rynek Główny 4", "31-042 Kraków"],
    nip: "NIP 676 000 00 01",
    navCta: "Prywatna prezentacja",
  },
  {
    slug: "siatka",
    name: "Siatka",
    office: "Siatka Nieruchomości",
    tagline: "Szwajcarski porządek i wyszukiwarka na pierwszym planie. Dla biur z dużą bazą ofert.",
    forWhom: "Biuro z setkami ofert, dużo najmu, klient szukający konkretu",
    highlights: [
      "Wyszukiwarka od razu w nagłówku, z filtrami i liczbą wyników na żywo",
      "Lista ofert z mapą obok, przełączana jednym kliknięciem",
      "Tabela danych zamiast marketingowych opisów",
    ],
    swatch: ["#FFFFFF", "#0E0F12", "#2F5BFF"],
    preview: "/wzory/szklo.jpg",
    root: "wz-sia",
    dark: false,
    fonts: "Space Grotesk + Inter Tight",
    sub: "Nieruchomości",
    phone: "12 430 30 40",
    email: "kontakt@siatka-wzor.pl",
    address: ["ul. Mogilska 43", "31-545 Kraków"],
    nip: "NIP 676 000 00 02",
    navCta: "Wyceń nieruchomość",
  },
  {
    slug: "przystan",
    name: "Przystań",
    office: "Przystań Nieruchomości",
    tagline: "Ciepły, ludzki, z twarzami agentów. Dla biur lokalnych, które żyją z poleceń.",
    forWhom: "Biuro lokalne, obsługa rodzin, domy i mieszkania na własne potrzeby",
    highlights: [
      "Agent z imienia i nazwiska w każdej sekcji, nie tylko w zakładce zespół",
      "Miękkie kształty, ciepła paleta, duże przyciski kontaktu",
      "Kalkulator raty i sekcja pierwszych kroków dla kupujących",
    ],
    swatch: ["#FBF7F1", "#23302A", "#C9603F"],
    preview: "/wzory/dom.jpg",
    root: "wz-prz",
    dark: false,
    fonts: "Sora + Plus Jakarta Sans",
    sub: "Biuro rodzinne",
    phone: "12 430 40 50",
    email: "dzien-dobry@przystan-wzor.pl",
    address: ["ul. Zamoyskiego 27", "30-523 Kraków"],
    nip: "NIP 676 000 00 03",
    navCta: "Porozmawiajmy",
  },
];

export function getWzor(slug: string): Wzor | undefined {
  return WZORY.find((w) => w.slug === slug);
}
