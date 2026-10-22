// Zamówienia świadectw charakterystyki energetycznej: cennik, listy wyboru i walidacja.
// Bez importów aplikacji, żeby formularz (przeglądarka) i serwer liczyły to samo.

export type TypObiektu = "mieszkanie" | "dom" | "lokal";
export type Tryb = "standard" | "express";

/** Ceny netto w złotych. Zmieniasz cenę? Tylko tutaj. */
export const CENY_OBIEKTU: Record<TypObiektu, { nazwa: string; opis: string; cena: number }> = {
  mieszkanie: { nazwa: "Mieszkanie", opis: "W bloku albo kamienicy", cena: 300 },
  dom: { nazwa: "Dom jednorodzinny", opis: "Wolnostojący albo segment", cena: 450 },
  lokal: { nazwa: "Lokal użytkowy", opis: "Sklep, biuro, gastronomia", cena: 450 },
};

export const TRYBY: Record<Tryb, { nazwa: string; opis: string; doplata: number }> = {
  standard: { nazwa: "Standard", opis: "do 2 dni roboczych", doplata: 0 },
  express: { nazwa: "Express", opis: "24 godziny", doplata: 100 },
};

export const VAT = 0.23;

export function cenaZamowienia(typ: TypObiektu, tryb: Tryb): { netto: number; brutto: number } {
  const netto = CENY_OBIEKTU[typ].cena + TRYBY[tryb].doplata;
  return { netto, brutto: Math.round(netto * (1 + VAT)) };
}

export const OPCJE = {
  ogrzewanie: ["Sieć ciepłownicza (miejskie)", "Kocioł gazowy", "Kocioł na paliwo stałe", "Pompa ciepła", "Ogrzewanie elektryczne", "Kocioł olejowy", "Kominek lub piec", "Nie wiem"],
  cwu: ["Z sieci ciepłowniczej", "Kocioł gazowy dwufunkcyjny", "Gazowy podgrzewacz przepływowy", "Bojler elektryczny", "Pompa ciepła", "Kolektory słoneczne", "Nie wiem"],
  grzejniki: ["Płytowe stalowe", "Żeliwne żeberkowe", "Ogrzewanie podłogowe", "Konwektorowe", "Mieszane", "Nie wiem"],
  wentylacja: ["Grawitacyjna", "Mechaniczna wywiewna", "Mechaniczna z rekuperacją", "Nie wiem"],
  sciany: ["Cegła pełna", "Ceramika poryzowana (pustak)", "Beton komórkowy", "Wielka płyta (beton)", "Pustak żużlobetonowy", "Silikat", "Drewno", "Nie wiem"],
  izolacja: ["Styropian", "Styropian grafitowy", "Wełna mineralna", "Pianka PIR/PUR", "Brak izolacji", "Nie wiem"],
} as const;

export const DODATKI = {
  klimatyzacja: "Budynek ma klimatyzację",
  fotowoltaika: "Budynek ma fotowoltaikę",
  balkon: "Jest balkon lub taras",
  parter: "Mieszkanie na parterze",
  ostatnie: "Mieszkanie na ostatnim piętrze",
} as const;

export type GrupaPlikow = "budynek" | "rzut" | "swiadectwo_budynku";
export const GRUPY_PLIKOW: Record<GrupaPlikow, { nazwa: string; wymagane: boolean; opis: string }> = {
  budynek: { nazwa: "Zdjęcie budynku z zewnątrz", wymagane: true, opis: "Obowiązkowe. PDF, JPG, PNG lub HEIC, maks. 20 plików." },
  rzut: { nazwa: "Rzut nieruchomości", wymagane: false, opis: "Opcjonalnie. Przyspiesza i uściśla wycenę przegród." },
  swiadectwo_budynku: { nazwa: "Świadectwo całego budynku", wymagane: false, opis: "Opcjonalnie, jeśli wspólnota je ma." },
};

export type Zamowienie = {
  typ: TypObiektu;
  tryb: Tryb;
  propertyId: string | null;
  ulica: string;
  nrBudynku: string;
  nrLokalu: string;
  kod: string;
  miasto: string;
  powierzchnia: string;
  wysokosc: string;
  scianyZewn: string;
  imie: string;
  email: string;
  telefon: string;
  zgoda: boolean;
  ogrzewanie: string;
  cwu: string;
  grzejniki: string;
  wentylacja: string;
  sciany: string;
  gruboscSciany: string;
  izolacja: string;
  gruboscIzolacji: string;
  rokOddania: string;
  rokTermo: string;
  dodatki: (keyof typeof DODATKI)[];
  komentarz: string;
};

export const PUSTE: Zamowienie = {
  typ: "mieszkanie",
  tryb: "standard",
  propertyId: null,
  ulica: "",
  nrBudynku: "",
  nrLokalu: "",
  kod: "",
  miasto: "",
  powierzchnia: "",
  wysokosc: "",
  scianyZewn: "",
  imie: "",
  email: "",
  telefon: "",
  zgoda: false,
  ogrzewanie: "",
  cwu: "",
  grzejniki: "",
  wentylacja: "",
  sciany: "",
  gruboscSciany: "",
  izolacja: "",
  gruboscIzolacji: "",
  rokOddania: "",
  rokTermo: "",
  dodatki: [],
  komentarz: "",
};

const liczba = (v: string, min: number, max: number) => {
  const n = Number(v.replace(",", "."));
  return v.trim() !== "" && Number.isFinite(n) && n >= min && n <= max;
};

/** Zwraca listę błędów (pusta = można zamawiać). Te same reguły w przeglądarce i na serwerze. */
export function bledyZamowienia(z: Zamowienie, ileZdjecBudynku: number): string[] {
  const b: string[] = [];
  if (!(z.typ in CENY_OBIEKTU)) b.push("Wybierz typ obiektu.");
  if (!(z.tryb in TRYBY)) b.push("Wybierz czas realizacji.");
  if (!z.ulica.trim()) b.push("Podaj ulicę.");
  if (!z.nrBudynku.trim()) b.push("Podaj numer budynku.");
  if (!/^\d{2}-\d{3}$/.test(z.kod.trim())) b.push("Kod pocztowy w formacie 00-000.");
  if (!z.miasto.trim()) b.push("Podaj miasto.");
  if (!liczba(z.powierzchnia, 5, 5000)) b.push("Podaj powierzchnię użytkową w m².");
  if (!liczba(z.wysokosc, 180, 600)) b.push("Podaj wysokość pomieszczeń w cm (np. 260).");
  if (!liczba(z.scianyZewn, 0, 12)) b.push("Podaj liczbę ścian zewnętrznych.");
  if (!z.imie.trim()) b.push("Podaj imię osoby do kontaktu.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(z.email.trim())) b.push("Podaj poprawny e-mail.");
  if (!/^\+?[\d\s-]{9,15}$/.test(z.telefon.trim())) b.push("Podaj telefon (cyfry, spacje, myślniki, opcjonalnie +).");
  if (!z.zgoda) b.push("Zaznacz zgodę na kontakt w sprawie świadectwa.");
  for (const [pole, nazwa] of [
    ["ogrzewanie", "rodzaj ogrzewania"],
    ["cwu", "ogrzewanie ciepłej wody"],
    ["grzejniki", "rodzaj grzejników"],
    ["wentylacja", "rodzaj wentylacji"],
    ["sciany", "materiał ścian"],
    ["izolacja", "materiał izolacji"],
  ] as const) {
    if (!z[pole]) b.push(`Wybierz ${nazwa}.`);
  }
  if (!liczba(z.gruboscSciany, 5, 200)) b.push("Podaj grubość ściany bez izolacji w cm.");
  if (!liczba(z.gruboscIzolacji, 0, 60)) b.push("Podaj grubość izolacji w cm (0 = brak).");
  const rok = new Date().getFullYear() + 2;
  if (!liczba(z.rokOddania, 1800, rok)) b.push("Podaj rok oddania budynku.");
  if (!liczba(z.rokTermo, 1800, rok)) b.push("Podaj rok ostatniej termomodernizacji (albo rok oddania).");
  if (ileZdjecBudynku < 1) b.push("Dodaj zdjęcie budynku z zewnątrz.");
  return b;
}

/** Bezpieczne przycięcie tekstów przychodzących z przeglądarki. */
export function oczyscZamowienie(z: Partial<Zamowienie>): Zamowienie {
  const t = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);
  const zOpcji = (v: unknown, lista: readonly string[]) => (lista.includes(String(v)) ? String(v) : "");
  return {
    typ: (["mieszkanie", "dom", "lokal"] as const).includes(z.typ as TypObiektu) ? (z.typ as TypObiektu) : "mieszkanie",
    tryb: (["standard", "express"] as const).includes(z.tryb as Tryb) ? (z.tryb as Tryb) : "standard",
    propertyId: z.propertyId && /^[0-9a-f-]{36}$/.test(z.propertyId) ? z.propertyId : null,
    ulica: t(z.ulica),
    nrBudynku: t(z.nrBudynku, 20),
    nrLokalu: t(z.nrLokalu, 20),
    kod: t(z.kod, 6),
    miasto: t(z.miasto, 80),
    powierzchnia: t(z.powierzchnia, 10),
    wysokosc: t(z.wysokosc, 10),
    scianyZewn: t(z.scianyZewn, 4),
    imie: t(z.imie, 80),
    email: t(z.email, 160),
    telefon: t(z.telefon, 20),
    zgoda: z.zgoda === true,
    ogrzewanie: zOpcji(z.ogrzewanie, OPCJE.ogrzewanie),
    cwu: zOpcji(z.cwu, OPCJE.cwu),
    grzejniki: zOpcji(z.grzejniki, OPCJE.grzejniki),
    wentylacja: zOpcji(z.wentylacja, OPCJE.wentylacja),
    sciany: zOpcji(z.sciany, OPCJE.sciany),
    gruboscSciany: t(z.gruboscSciany, 6),
    izolacja: zOpcji(z.izolacja, OPCJE.izolacja),
    gruboscIzolacji: t(z.gruboscIzolacji, 6),
    rokOddania: t(z.rokOddania, 4),
    rokTermo: t(z.rokTermo, 4),
    dodatki: (Array.isArray(z.dodatki) ? z.dodatki : []).filter((d): d is keyof typeof DODATKI => d in DODATKI),
    komentarz: t(z.komentarz, 2000),
  };
}

export function adresZamowienia(z: Zamowienie): string {
  return `${z.ulica} ${z.nrBudynku}${z.nrLokalu ? `/${z.nrLokalu}` : ""}, ${z.kod} ${z.miasto}`.trim();
}
