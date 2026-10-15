/**
 * Kosztorys remontu mieszkania.
 *
 * Agent liczy go przy kupującym („ile trzeba dołożyć do tej ceny") albo przy
 * sprzedającym („remont się nie opłaci, lepiej zejść z ceny"). Nie musi być
 * dokładny co do złotówki, ale musi być uczciwy i dać się obronić: każda
 * pozycja ma jednostkę, ilość wyliczoną z metrażu i cenę, którą można zmienić.
 *
 * Ceny domyślne to netto, robocizna i materiał osobno, dla dużego miasta
 * w 2026 r. (średnie z cenników ekip i marketów budowlanych). Plik bez
 * importów, żeby liczenie dało się sprawdzić w gołym node.
 */

export type TypPomieszczenia = "pokoj" | "kuchnia" | "lazienka" | "przedpokoj" | "aneks" | "balkon";
export type Standard = "ekonomiczny" | "standard" | "premium";
export type Zakres = "odswiezenie" | "sredni" | "generalny";

export type Pozycja = {
  id: string;
  nazwa: string;
  jedn: "m²" | "mb" | "szt." | "kpl." | "pkt";
  /** Cena netto za jednostkę: robocizna i materiał. */
  r: number;
  m: number;
  /** W jakich pomieszczeniach ma sens i od jakiego zakresu jest domyślnie włączona. */
  gdzie: TypPomieszczenia[];
  od: Zakres;
  ilosc: (p: Geometria, typ: TypPomieszczenia) => number;
};

export type Geometria = { podloga: number; sciany: number; sufit: number; obwod: number };

export const TYPY: { v: TypPomieszczenia; l: string }[] = [
  { v: "pokoj", l: "Pokój" },
  { v: "kuchnia", l: "Kuchnia" },
  { v: "aneks", l: "Salon z aneksem" },
  { v: "lazienka", l: "Łazienka" },
  { v: "przedpokoj", l: "Przedpokój" },
  { v: "balkon", l: "Balkon" },
];

export const STANDARDY: { v: Standard; l: string; opis: string; m: number; r: number }[] = [
  { v: "ekonomiczny", l: "Ekonomiczny", opis: "Pod wynajem, materiały z marketu", m: 0.7, r: 0.9 },
  { v: "standard", l: "Standard", opis: "Solidnie, do zamieszkania", m: 1, r: 1 },
  { v: "premium", l: "Premium", opis: "Deska, wielki format, armatura z wyższej półki", m: 1.8, r: 1.25 },
];

export const ZAKRESY: { v: Zakres; l: string; opis: string }[] = [
  { v: "odswiezenie", l: "Odświeżenie", opis: "Malowanie, listwy, drobne poprawki" },
  { v: "sredni", l: "Średni", opis: "Gładzie, nowe podłogi, drzwi, łazienka bez ruszania instalacji" },
  { v: "generalny", l: "Generalny", opis: "Wszystko od nowa: elektryka, hydraulika, łazienka, kuchnia" },
];

const POZIOM: Record<Zakres, number> = { odswiezenie: 0, sredni: 1, generalny: 2 };
const SUCHE: TypPomieszczenia[] = ["pokoj", "przedpokoj", "aneks"];
const WSZYSTKIE: TypPomieszczenia[] = ["pokoj", "kuchnia", "lazienka", "przedpokoj", "aneks"];

export const POZYCJE: Pozycja[] = [
  { id: "demontaz", nazwa: "Demontaż starych okładzin i wywóz gruzu", jedn: "m²", r: 50, m: 5, gdzie: WSZYSTKIE, od: "generalny", ilosc: (g) => g.podloga },
  { id: "tynki", nazwa: "Naprawa i wyrównanie tynków, bruzdy po instalacjach", jedn: "m²", r: 45, m: 14, gdzie: WSZYSTKIE, od: "generalny", ilosc: (g) => g.sciany },
  { id: "elektryka", nazwa: "Nowa instalacja elektryczna (punkty)", jedn: "pkt", r: 210, m: 80, gdzie: WSZYSTKIE, od: "generalny", ilosc: (g, t) => Math.ceil(g.podloga / (t === "kuchnia" || t === "aneks" ? 2 : 3.5)) + 1 },
  { id: "hydraulika", nazwa: "Instalacja wodno-kanalizacyjna (punkty)", jedn: "pkt", r: 420, m: 180, gdzie: ["kuchnia", "lazienka", "aneks"], od: "generalny", ilosc: (_g, t) => (t === "lazienka" ? 6 : 3) },
  { id: "wylewka", nazwa: "Wylewka samopoziomująca", jedn: "m²", r: 35, m: 30, gdzie: WSZYSTKIE, od: "generalny", ilosc: (g) => g.podloga },
  { id: "gladzie", nazwa: "Gładzie gipsowe ścian i sufitu", jedn: "m²", r: 38, m: 10, gdzie: [...SUCHE, "kuchnia"], od: "sredni", ilosc: (g) => g.sciany + g.sufit },
  { id: "malowanie", nazwa: "Malowanie ścian i sufitu (2 warstwy)", jedn: "m²", r: 23, m: 8, gdzie: [...SUCHE, "kuchnia"], od: "odswiezenie", ilosc: (g) => g.sciany + g.sufit },
  { id: "sufit-lazienka", nazwa: "Sufit podwieszany z farbą łazienkową", jedn: "m²", r: 120, m: 60, gdzie: ["lazienka"], od: "sredni", ilosc: (g) => g.sufit },
  { id: "panele", nazwa: "Podłoga: panele lub deska z podkładem", jedn: "m²", r: 55, m: 100, gdzie: SUCHE, od: "sredni", ilosc: (g) => g.podloga * 1.07 },
  { id: "plytki-podloga", nazwa: "Płytki na podłodze", jedn: "m²", r: 170, m: 130, gdzie: ["kuchnia", "lazienka"], od: "sredni", ilosc: (g) => g.podloga * 1.1 },
  { id: "plytki-sciany", nazwa: "Płytki na ścianach", jedn: "m²", r: 180, m: 130, gdzie: ["lazienka", "kuchnia", "aneks"], od: "sredni", ilosc: (g, t) => (t === "lazienka" ? g.sciany * 0.95 : 3.5) },
  { id: "hydroizolacja", nazwa: "Hydroizolacja", jedn: "m²", r: 30, m: 25, gdzie: ["lazienka"], od: "sredni", ilosc: (g) => g.podloga + 4 },
  { id: "bialy-montaz", nazwa: "Biały montaż: WC podwieszane, umywalka, prysznic, baterie", jedn: "kpl.", r: 2200, m: 6500, gdzie: ["lazienka"], od: "sredni", ilosc: () => 1 },
  { id: "zabudowa", nazwa: "Zabudowa kuchenna z montażem", jedn: "mb", r: 0, m: 3200, gdzie: ["kuchnia", "aneks"], od: "generalny", ilosc: (g, t) => (t === "aneks" ? 3 : Math.max(2.4, Math.min(5, g.obwod * 0.35))) },
  { id: "drzwi", nazwa: "Drzwi wewnętrzne z ościeżnicą", jedn: "szt.", r: 400, m: 1100, gdzie: ["pokoj", "lazienka", "kuchnia"], od: "sredni", ilosc: () => 1 },
  { id: "listwy", nazwa: "Listwy przypodłogowe", jedn: "mb", r: 16, m: 22, gdzie: SUCHE, od: "odswiezenie", ilosc: (g) => g.obwod },
  { id: "drobne", nazwa: "Drobne naprawy, gniazdka, oświetlenie", jedn: "kpl.", r: 250, m: 200, gdzie: WSZYSTKIE, od: "odswiezenie", ilosc: () => 1 },
  { id: "balkon-plytki", nazwa: "Płytki mrozoodporne na balkonie", jedn: "m²", r: 160, m: 130, gdzie: ["balkon"], od: "sredni", ilosc: (g) => g.podloga },
  { id: "balkon-malowanie", nazwa: "Malowanie balustrady i ścian balkonu", jedn: "kpl.", r: 450, m: 150, gdzie: ["balkon"], od: "odswiezenie", ilosc: () => 1 },
];

export type Pomieszczenie = {
  id: string;
  typ: TypPomieszczenia;
  nazwa: string;
  metraz: number;
  /** Pozycje włączone ręcznie (true) albo wyłączone (false). Brak = według zakresu. */
  wybor: Record<string, boolean>;
  /** Ilość wpisana ręcznie. Brak = wyliczona z metrażu. */
  ilosci: Record<string, number>;
};

export type Kosztorys = {
  tytul: string;
  adres: string;
  standard: Standard;
  zakres: Zakres;
  wysokosc: number;
  /** Kto kupuje materiały: od tego zależy stawka VAT na materiały. */
  materialy: "wykonawca" | "inwestor";
  rezerwaProc: number;
  pomieszczenia: Pomieszczenie[];
  /** Ceny jednostkowe zmienione przez biuro: id → { r, m } netto. */
  ceny: Record<string, { r: number; m: number }>;
};

export const zaokr = (n: number) => Math.round(n * 100) / 100;

export function geometria(metraz: number, wysokosc: number, typ: TypPomieszczenia): Geometria {
  const a = Math.max(0, metraz);
  // Pomieszczenie liczymy jak prostokąt 1:1,3 (typowy pokój). Okna i drzwi
  // zabierają ok. 12% ścian. Balkon nie ma ścian do malowania w tym modelu.
  const bok = Math.sqrt(a / 1.3);
  const obwod = 2 * (bok + bok * 1.3);
  const sciany = typ === "balkon" ? 0 : obwod * wysokosc * 0.88;
  return { podloga: a, sciany: zaokr(sciany), sufit: typ === "balkon" ? 0 : a, obwod: zaokr(obwod) };
}

export function pozycjeDla(typ: TypPomieszczenia): Pozycja[] {
  return POZYCJE.filter((p) => p.gdzie.includes(typ));
}

export function wlaczona(p: Pozycja, pom: Pomieszczenie, zakres: Zakres): boolean {
  if (pom.wybor[p.id] !== undefined) return pom.wybor[p.id];
  return POZIOM[p.od] <= POZIOM[zakres];
}

export type WierszKosztorysu = {
  pomId: string;
  pozId: string;
  nazwa: string;
  jedn: string;
  ilosc: number;
  cenaR: number;
  cenaM: number;
  robocizna: number;
  material: number;
};

export type Wynik = {
  wiersze: WierszKosztorysu[];
  pomieszczenia: { id: string; nazwa: string; netto: number }[];
  robociznaNetto: number;
  materialyNetto: number;
  netto: number;
  vatRobocizna: number;
  vatMaterialy: number;
  stawkaRobocizna: number;
  stawkaMaterialy: number;
  rezerwa: number;
  brutto: number;
  metrazRazem: number;
  naMetr: number;
  dniRobocze: number;
  tygodnie: number;
};

/**
 * VAT 8% obejmuje remont lokalu mieszkalnego do 150 m² (budownictwo objęte
 * społecznym programem mieszkaniowym). Materiały kupione przez wykonawcę
 * w ramach usługi idą na tej samej stawce, kupione przez inwestora w sklepie
 * mają 23%. Powyżej 150 m² jest 23% na całość.
 */
export function stawkiVat(k: Pick<Kosztorys, "materialy">, metraz: number): { r: number; m: number } {
  if (metraz > 150) return { r: 0.23, m: 0.23 };
  return { r: 0.08, m: k.materialy === "wykonawca" ? 0.08 : 0.23 };
}

/** Wydajność ekipy dwuosobowej: ok. 1 500 zł netto robocizny dziennie. */
const ROBOCIZNA_NA_DZIEN = 1500;

export function policz(k: Kosztorys): Wynik {
  const std = STANDARDY.find((s) => s.v === k.standard) ?? STANDARDY[1];
  const wiersze: WierszKosztorysu[] = [];
  const pomieszczenia: Wynik["pomieszczenia"] = [];

  for (const pom of k.pomieszczenia) {
    const g = geometria(pom.metraz, k.wysokosc, pom.typ);
    let suma = 0;
    for (const p of pozycjeDla(pom.typ)) {
      if (!wlaczona(p, pom, k.zakres)) continue;
      const ilosc = zaokr(pom.ilosci[p.id] ?? p.ilosc(g, pom.typ));
      if (ilosc <= 0) continue;
      const cena = k.ceny[p.id];
      const cenaR = zaokr((cena?.r ?? p.r) * (cena ? 1 : std.r));
      const cenaM = zaokr((cena?.m ?? p.m) * (cena ? 1 : std.m));
      const robocizna = zaokr(ilosc * cenaR);
      const material = zaokr(ilosc * cenaM);
      wiersze.push({ pomId: pom.id, pozId: p.id, nazwa: p.nazwa, jedn: p.jedn, ilosc, cenaR, cenaM, robocizna, material });
      suma += robocizna + material;
    }
    pomieszczenia.push({ id: pom.id, nazwa: pom.nazwa, netto: zaokr(suma) });
  }

  const robociznaNetto = zaokr(wiersze.reduce((s, w) => s + w.robocizna, 0));
  const materialyNetto = zaokr(wiersze.reduce((s, w) => s + w.material, 0));
  const metrazRazem = zaokr(k.pomieszczenia.reduce((s, p) => s + (p.typ === "balkon" ? 0 : p.metraz), 0));
  const vat = stawkiVat(k, metrazRazem);
  const vatRobocizna = zaokr(robociznaNetto * vat.r);
  const vatMaterialy = zaokr(materialyNetto * vat.m);
  const bruttoBez = robociznaNetto + materialyNetto + vatRobocizna + vatMaterialy;
  const rezerwa = zaokr(bruttoBez * Math.max(0, k.rezerwaProc) / 100);
  const brutto = zaokr(bruttoBez + rezerwa);
  const dniRobocze = robociznaNetto > 0 ? Math.max(2, Math.ceil(robociznaNetto / ROBOCIZNA_NA_DZIEN)) : 0;

  return {
    wiersze,
    pomieszczenia,
    robociznaNetto,
    materialyNetto,
    netto: zaokr(robociznaNetto + materialyNetto),
    vatRobocizna,
    vatMaterialy,
    stawkaRobocizna: vat.r,
    stawkaMaterialy: vat.m,
    rezerwa,
    brutto,
    metrazRazem,
    naMetr: metrazRazem > 0 ? Math.round(brutto / metrazRazem) : 0,
    dniRobocze,
    tygodnie: Math.ceil(dniRobocze / 5),
  };
}

let licznik = 0;
export function nowePomieszczenie(typ: TypPomieszczenia, metraz: number, nazwa?: string): Pomieszczenie {
  licznik += 1;
  return {
    id: `p${Date.now().toString(36)}${licznik}`,
    typ,
    nazwa: nazwa ?? TYPY.find((t) => t.v === typ)?.l ?? "Pomieszczenie",
    metraz,
    wybor: {},
    ilosci: {},
  };
}

/** Typowy podział mieszkania na pomieszczenia z samego metrażu i liczby pokoi. */
export function ukladMieszkania(metraz: number, pokoje: number): Pomieszczenie[] {
  const m = Math.max(20, metraz || 50);
  const n = Math.max(1, Math.min(6, Math.round(pokoje || 2)));
  const lazienka = m < 45 ? 4 : m < 80 ? 5 : 6;
  const przedpokoj = Math.round(m * 0.1);
  const kuchnia = m < 40 ? 0 : Math.round(Math.min(12, m * 0.12));
  const reszta = m - lazienka - przedpokoj - kuchnia;
  const lista: Pomieszczenie[] = [];
  if (kuchnia === 0) {
    lista.push(nowePomieszczenie("aneks", zaokr(reszta * (n === 1 ? 1 : 0.55)), "Pokój z aneksem"));
    for (let i = 1; i < n; i++) lista.push(nowePomieszczenie("pokoj", zaokr((reszta * 0.45) / (n - 1)), `Pokój ${i}`));
  } else {
    const salon = n === 1 ? reszta : reszta * (n === 2 ? 0.55 : 0.4);
    lista.push(nowePomieszczenie("pokoj", zaokr(salon), n === 1 ? "Pokój" : "Salon"));
    for (let i = 1; i < n; i++) lista.push(nowePomieszczenie("pokoj", zaokr((reszta - salon) / (n - 1)), `Pokój ${i}`));
    lista.push(nowePomieszczenie("kuchnia", kuchnia));
  }
  lista.push(nowePomieszczenie("lazienka", lazienka), nowePomieszczenie("przedpokoj", przedpokoj));
  return lista;
}

export function nowyKosztorys(metraz = 50, pokoje = 2): Kosztorys {
  return {
    tytul: "Kosztorys remontu",
    adres: "",
    standard: "standard",
    zakres: "sredni",
    wysokosc: 2.6,
    materialy: "wykonawca",
    rezerwaProc: 10,
    pomieszczenia: ukladMieszkania(metraz, pokoje),
    ceny: {},
  };
}
