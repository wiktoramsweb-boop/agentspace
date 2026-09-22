/**
 * Katalog wzorów stron. Każdy wzór to osobny projekt graficzny, a nie inny
 * kolor tego samego szablonu: inne fonty, inna siatka, inny rytm sekcji.
 */

export type WzorSlug =
  | "kamienica"
  | "nokturn"
  | "siatka"
  | "przystan"
  | "strategia"
  | "beton"
  | "ogrod"
  | "horyzont";

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
  {
    slug: "strategia",
    name: "Strategia",
    office: "Strategia Nieruchomości",
    tagline: "Ciemny nagłówek, cztery drogi dla klienta i twarde liczby zamiast haseł. Najbardziej sprzedażowy z całej ósemki.",
    forWhom: "Biuro, które żyje z wyników i chce je pokazać wprost",
    highlights: [
      "Nagłówek z wyszukiwarką na zdjęciu miasta, jak w najlepszych biurach",
      "Cztery kafelki celu: sprzedaję, wynajmuję, kupuję, wyceniam",
      "Sekcja kredytowa i pasek portali, na których publikujecie oferty",
    ],
    swatch: ["#0E1420", "#F5F3EF", "#E2703A"],
    preview: "/wzory/wieza.jpg",
    root: "wz-str",
    dark: false,
    fonts: "Outfit + Karla",
    sub: "Kraków",
    phone: "12 430 50 60",
    email: "biuro@strategia-wzor.pl",
    address: ["ul. Zabłocie 23", "30-701 Kraków"],
    nip: "NIP 676 000 00 04",
    navCta: "Bezpłatna wycena",
  },
  {
    slug: "beton",
    name: "Beton",
    office: "Beton Nieruchomości",
    tagline: "Brutalistyczny, głośny, z ogromną typografią i żółtym akcentem. Dla biura, które chce być zapamiętane.",
    forWhom: "Młode biuro, lofty i inwestycje, klient z miasta",
    highlights: [
      "Wielkie napisy, grube ramki i zero zaokrągleń",
      "Przewijany pasek z hasłem zamiast grzecznego nagłówka",
      "Oferty w siatce jak w katalogu aukcyjnym, z numeracją",
    ],
    swatch: ["#F2F0EB", "#0A0A0A", "#D7FF3E"],
    preview: "/wzory/hala.jpg",
    root: "wz-bet",
    dark: false,
    fonts: "Anton + DM Sans",
    sub: "Kraków",
    phone: "12 430 60 70",
    email: "hey@beton-wzor.pl",
    address: ["ul. Wadowicka 8A", "30-415 Kraków"],
    nip: "NIP 676 000 00 05",
    navCta: "Napisz do nas",
  },
  {
    slug: "ogrod",
    name: "Ogród",
    office: "Ogród Nieruchomości",
    tagline: "Miękki, zielony, z dużą ilością powietrza. Dla domów, działek i nieruchomości poza miastem.",
    forWhom: "Biuro specjalizujące się w domach i działkach pod miastem",
    highlights: [
      "Organiczne kształty i zdjęcia w owalach zamiast prostokątów",
      "Mapa okolic z dojazdem do centrum zamiast samych pinezek",
      "Sekcja o okolicy: szkoły, sklepy, komunikacja",
    ],
    swatch: ["#F7F5EF", "#1F3D2B", "#7C9A5C"],
    preview: "/wzory/las.jpg",
    root: "wz-ogr",
    dark: false,
    fonts: "Lora + Nunito Sans",
    sub: "Domy i działki",
    phone: "12 430 70 80",
    email: "kontakt@ogrod-wzor.pl",
    address: ["ul. Modrzewiowa 4", "32-087 Zielonki"],
    nip: "NIP 676 000 00 06",
    navCta: "Umów spacer",
  },
  {
    slug: "horyzont",
    name: "Horyzont",
    office: "Horyzont Deweloper",
    tagline: "Dla dewelopera i jednej inwestycji: tabela mieszkań z cenami, etap budowy i harmonogram.",
    forWhom: "Deweloper, inwestycja mieszkaniowa, sprzedaż z rzutów",
    highlights: [
      "Tabela mieszkań z filtrem po liczbie pokoi i piętrze",
      "Jawne ceny i status każdego lokalu, bez pytania o cennik",
      "Pasek postępu budowy i harmonogram odbiorów",
    ],
    swatch: ["#070B18", "#EAF0FF", "#5B8CFF"],
    preview: "/wzory/szklo.jpg",
    root: "wz-hor",
    dark: true,
    fonts: "Unbounded + Figtree",
    sub: "Etap II",
    phone: "12 430 80 90",
    email: "sprzedaz@horyzont-wzor.pl",
    address: ["ul. Nadwiślańska 11", "30-527 Kraków"],
    nip: "NIP 676 000 00 07",
    navCta: "Zapytaj o mieszkanie",
  },
];

export function getWzor(slug: string): Wzor | undefined {
  return WZORY.find((w) => w.slug === slug);
}
