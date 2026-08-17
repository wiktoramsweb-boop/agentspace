// Kalkulator podatkowy dla biura (JDG: skala / liniowy / ryczałt, ZUS, VAT, sp. z o.o.).
//
// UWAGA: To narzędzie do modelowania i porównań, NIE porada podatkowa.
// Stawki i kwoty ZUS na 2026 to szacunki (oficjalne kwoty ZUS 2026 ogłaszane są
// pod koniec roku) - dlatego wszystkie stałe są edytowalne w panelu „Założenia".
// Przed realną decyzją (zmiana formy, VAT, spółka) potwierdź u księgowej/doradcy.

export type TaxForm = "skala" | "liniowy" | "ryczalt";
export type ZusStage = "ulga_start" | "preferencyjny" | "duzy";

export const FORM_LABELS: Record<TaxForm, string> = {
  skala: "Skala podatkowa (12% / 32%)",
  liniowy: "Podatek liniowy (19%)",
  ryczalt: "Ryczałt (od przychodu)",
};

export const FORM_SHORT: Record<TaxForm, string> = {
  skala: "Skala",
  liniowy: "Liniowy",
  ryczalt: "Ryczałt",
};

export const ZUS_STAGE_LABELS: Record<ZusStage, string> = {
  ulga_start: "Ulga na start (0 zł społecznych, tylko zdrowotna)",
  preferencyjny: "Mały ZUS / preferencyjny (24 mies.)",
  duzy: "Duży ZUS (pełne składki)",
};

// ── Stałe (edytowalne w UI) ─────────────────────────────────────────────────
// Domyślne wartości: reguły PIT są stabilne (2022→), kwoty ZUS/zdrowotnej to
// szacunki na 2026 na bazie prognozowanego wzrostu wynagrodzeń.
export type TaxConstants = {
  // PIT - skala
  kwotaWolna: number; // 30 000
  progSkali: number; // 120 000 - granica 12%/32%
  stawkaSkala1: number; // 0.12
  stawkaSkala2: number; // 0.32
  kwotaZmniejszajaca: number; // 3 600 (12% z kwoty wolnej)
  // PIT - liniowy
  stawkaLiniowy: number; // 0.19
  liniowyZdrowotnaOdliczenieLimit: number; // roczny limit odliczenia zdrowotnej od dochodu
  // PIT - ryczałt (pośrednictwo w obrocie nieruchomościami = 15%)
  stawkaRyczalt: number; // 0.15
  // Danina solidarnościowa (4% od dochodu > 1 mln)
  daninaProg: number; // 1 000 000
  daninaStawka: number; // 0.04
  // Składka zdrowotna
  zdrowotnaSkalaStawka: number; // 0.09 od dochodu (skala)
  zdrowotnaLiniowyStawka: number; // 0.049 od dochodu (liniowy)
  zdrowotnaMinMies: number; // minimalna miesięczna (9% płacy min.) - dla skali/liniowego
  // Ryczałt - składka zdrowotna wg progów rocznego przychodu (miesięcznie)
  ryczaltProg1: number; // 60 000 przychodu
  ryczaltProg2: number; // 300 000 przychodu
  zdrowotnaRyczalt1Mies: number; // przychód ≤ prog1
  zdrowotnaRyczalt2Mies: number; // prog1 < przychód ≤ prog2
  zdrowotnaRyczalt3Mies: number; // przychód > prog2
  // ZUS społeczny (miesięcznie, z chorobowym; duży zawiera Fundusz Pracy)
  zusPreferencyjnyMies: number;
  zusDuzyMies: number;
  // VAT
  limitVat: number; // 240 000 (od 2026)
  stawkaVat: number; // 0.23
  // CIT (sp. z o.o.)
  citMaly: number; // 0.09 (mały podatnik)
  citStandard: number; // 0.19
  stawkaDywidendy: number; // 0.19
};

export const DEFAULT_CONSTANTS: TaxConstants = {
  kwotaWolna: 30000,
  progSkali: 120000,
  stawkaSkala1: 0.12,
  stawkaSkala2: 0.32,
  kwotaZmniejszajaca: 3600,
  stawkaLiniowy: 0.19,
  liniowyZdrowotnaOdliczenieLimit: 12900,
  stawkaRyczalt: 0.15,
  daninaProg: 1000000,
  daninaStawka: 0.04,
  zdrowotnaSkalaStawka: 0.09,
  zdrowotnaLiniowyStawka: 0.049,
  zdrowotnaMinMies: 433, // ~9% z płacy minimalnej 2026 (szac. ~4806 zł)
  ryczaltProg1: 60000,
  ryczaltProg2: 300000,
  zdrowotnaRyczalt1Mies: 485,
  zdrowotnaRyczalt2Mies: 808,
  zdrowotnaRyczalt3Mies: 1454,
  zusPreferencyjnyMies: 456, // szac. 2026, z chorobowym
  zusDuzyMies: 1930, // szac. 2026, z chorobowym + Fundusz Pracy
  limitVat: 240000,
  stawkaVat: 0.23,
  citMaly: 0.09,
  citStandard: 0.19,
  stawkaDywidendy: 0.19,
};

// ── Pomocnicze ──────────────────────────────────────────────────────────────
function zusSpolecznyRoczny(stage: ZusStage, c: TaxConstants): number {
  if (stage === "ulga_start") return 0;
  if (stage === "preferencyjny") return c.zusPreferencyjnyMies * 12;
  return c.zusDuzyMies * 12;
}

function zdrowotnaRyczaltRoczna(przychod: number, c: TaxConstants): number {
  const mies =
    przychod <= c.ryczaltProg1
      ? c.zdrowotnaRyczalt1Mies
      : przychod <= c.ryczaltProg2
        ? c.zdrowotnaRyczalt2Mies
        : c.zdrowotnaRyczalt3Mies;
  return mies * 12;
}

function pitSkala(podstawa: number, c: TaxConstants): number {
  const p = Math.max(0, podstawa);
  if (p <= c.progSkali) return Math.max(0, p * c.stawkaSkala1 - c.kwotaZmniejszajaca);
  const doProgu = c.progSkali * c.stawkaSkala1 - c.kwotaZmniejszajaca;
  return doProgu + (p - c.progSkali) * c.stawkaSkala2;
}

// ── Wynik dla jednej formy ──────────────────────────────────────────────────
export type FormResult = {
  form: TaxForm;
  przychod: number;
  koszty: number;
  dochod: number; // przychód − koszty (przed ZUS)
  zusSpoleczny: number;
  zdrowotna: number;
  podatek: number; // PIT lub ryczałt
  danina: number; // danina solidarnościowa
  podstawaOpodatkowania: number;
  daniny: number; // podatek + zdrowotna + zus + danina (łączne obciążenie)
  netto: number; // co zostaje „do kieszeni"
  efektywna: number; // daniny / dochod
};

export type FormInput = {
  przychod: number;
  koszty: number;
  zusStage: ZusStage;
};

export function computeForm(form: TaxForm, input: FormInput, c: TaxConstants): FormResult {
  const przychod = Math.max(0, input.przychod);
  const koszty = Math.max(0, input.koszty);
  const dochod = przychod - koszty;
  const zusSpoleczny = zusSpolecznyRoczny(input.zusStage, c);
  const minZdrowotna = c.zdrowotnaMinMies * 12;

  let zdrowotna = 0;
  let podatek = 0;
  let podstawaOpodatkowania = 0;
  let danina = 0;

  if (form === "skala") {
    // Zdrowotna 9% od dochodu, NIE odliczana od podatku.
    zdrowotna = Math.max(minZdrowotna, Math.max(0, dochod) * c.zdrowotnaSkalaStawka);
    // Składki społeczne ZUS odliczane od dochodu.
    podstawaOpodatkowania = Math.max(0, dochod - zusSpoleczny);
    podatek = pitSkala(podstawaOpodatkowania, c);
  } else if (form === "liniowy") {
    zdrowotna = Math.max(minZdrowotna, Math.max(0, dochod) * c.zdrowotnaLiniowyStawka);
    const zdrowotnaOdliczenie = Math.min(zdrowotna, c.liniowyZdrowotnaOdliczenieLimit);
    podstawaOpodatkowania = Math.max(0, dochod - zusSpoleczny - zdrowotnaOdliczenie);
    podatek = podstawaOpodatkowania * c.stawkaLiniowy;
  } else {
    // Ryczałt - podatek od przychodu (koszty nie obniżają podatku).
    zdrowotna = zdrowotnaRyczaltRoczna(przychod, c);
    // Podstawę (przychód) pomniejsza się o składki społeczne i 50% zdrowotnej.
    podstawaOpodatkowania = Math.max(0, przychod - zusSpoleczny - 0.5 * zdrowotna);
    podatek = podstawaOpodatkowania * c.stawkaRyczalt;
  }

  // Danina solidarnościowa - od dochodu (skala/liniowy) ponad próg.
  if (form !== "ryczalt" && dochod > c.daninaProg) {
    danina = (dochod - c.daninaProg) * c.daninaStawka;
  }

  const daniny = podatek + zdrowotna + zusSpoleczny + danina;
  const netto = dochod - podatek - zdrowotna - zusSpoleczny - danina;
  const efektywna = dochod > 0 ? daniny / dochod : 0;

  return {
    form,
    przychod,
    koszty,
    dochod,
    zusSpoleczny,
    zdrowotna,
    podatek,
    danina,
    podstawaOpodatkowania,
    daniny,
    netto,
    efektywna,
  };
}

// Porównanie wszystkich trzech form + wskazanie najtańszej.
export function compareForms(input: FormInput, c: TaxConstants) {
  const forms: TaxForm[] = ["skala", "liniowy", "ryczalt"];
  const results = forms.map((f) => computeForm(f, input, c));
  const best = results.reduce((a, b) => (b.netto > a.netto ? b : a));
  return { results, best };
}

// Punkt przełamania skala↔liniowy: dochód, przy którym liniowy zaczyna wygrywać.
// Szukamy binarnie na dochodzie (dla ustalonych kosztów=0, zusStage).
export function progSkalaLiniowy(zusStage: ZusStage, c: TaxConstants): number {
  let lo = c.progSkali; // poniżej progu skala prawie zawsze wygrywa
  let hi = 600000;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const skala = computeForm("skala", { przychod: mid, koszty: 0, zusStage }, c);
    const liniowy = computeForm("liniowy", { przychod: mid, koszty: 0, zusStage }, c);
    if (liniowy.netto >= skala.netto) hi = mid;
    else lo = mid;
  }
  return Math.round((lo + hi) / 2);
}

// ── ZUS - oś czasu (kiedy kończy się mały ZUS) ──────────────────────────────
export type ZusTimeline = {
  ulgaStartDo: Date | null;
  preferencyjnyOd: Date;
  preferencyjnyDo: Date; // koniec małego ZUS
  monthsLeft: number; // ile miesięcy do końca małego ZUS (od dziś)
  skokMies: number; // wzrost składki po przejściu na duży (na osobę)
  skokRoczny: number; // roczny skok na osobę
};

export function zusTimeline(
  dataZalozenia: Date,
  ulgaNaStart: boolean,
  c: TaxConstants,
  now = new Date(),
): ZusTimeline {
  const start = new Date(dataZalozenia);
  let ulgaStartDo: Date | null = null;
  let preferencyjnyOd: Date;

  if (ulgaNaStart) {
    // Ulga na start: pełne 6 miesięcy po miesiącu rozpoczęcia.
    ulgaStartDo = addMonths(start, 6);
    preferencyjnyOd = ulgaStartDo;
  } else {
    preferencyjnyOd = start;
  }
  const preferencyjnyDo = addMonths(preferencyjnyOd, 24);

  const monthsLeft = monthsBetween(now, preferencyjnyDo);
  const skokMies = c.zusDuzyMies - c.zusPreferencyjnyMies;

  return {
    ulgaStartDo,
    preferencyjnyOd,
    preferencyjnyDo,
    monthsLeft,
    skokMies,
    skokRoczny: skokMies * 12,
  };
}

function addMonths(d: Date, m: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + m);
  return r;
}

function monthsBetween(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  );
}

// ── VAT - pojemność 3 podmiotów + koszt utraty statusu ──────────────────────
export type VatSubject = { name: string; przychod: number };
export type VatResult = {
  subjects: { name: string; przychod: number; doLimitu: number; nadLimit: boolean }[];
  limit: number;
  pojemnosc: number; // łączna pojemność bez VAT (liczba podmiotów × limit)
  sumaPrzychodow: number;
  nadPojemnosc: number; // ile ponad łączną pojemność (jeśli >0 → VAT nieunikniony)
  // koszt utraty nie-VAT: VAT należny od prowizji minus VAT do odliczenia z kosztów
  kosztUtratyNetto: number;
};

export function computeVat(
  subjects: VatSubject[],
  kosztyZVat: number, // roczne koszty z których można odliczyć VAT (netto podstawy)
  c: TaxConstants,
): VatResult {
  const rows = subjects.map((s) => ({
    name: s.name,
    przychod: s.przychod,
    doLimitu: c.limitVat - s.przychod,
    nadLimit: s.przychod > c.limitVat,
  }));
  const sumaPrzychodow = subjects.reduce((a, s) => a + s.przychod, 0);
  const pojemnosc = c.limitVat * subjects.length;
  // VAT należny (metoda „w stu" - prowizja brutto zawiera VAT po wejściu w VAT):
  const vatNalezny = (sumaPrzychodow * c.stawkaVat) / (1 + c.stawkaVat);
  const vatOdliczony = (kosztyZVat * c.stawkaVat) / (1 + c.stawkaVat);
  return {
    subjects: rows,
    limit: c.limitVat,
    pojemnosc,
    sumaPrzychodow,
    nadPojemnosc: Math.max(0, sumaPrzychodow - pojemnosc),
    kosztUtratyNetto: Math.max(0, vatNalezny - vatOdliczony),
  };
}

// ── JDG (2× liniowy) vs sp. z o.o. ──────────────────────────────────────────
export type SpzooResult = {
  zyskFirmy: number;
  // Sp. z o.o.
  cit: number;
  poCit: number;
  dywidenda: number;
  spzooNetto: number; // do podziału między wspólników po CIT i dywidendzie
  spzooEfektywna: number;
  citStawka: number;
  // JDG - 2 wspólników na wybranej formie
  jdgNetto: number;
  jdgDaniny: number;
  jdgEfektywna: number;
  // Różnica (dodatnia = spółka lepsza)
  roznica: number;
};

// Wypłata ze spółki przez wynagrodzenie z powołania (skala, bez ZUS społecznego,
// ale ze składką zdrowotną 9%). Wynagrodzenie to KOSZT spółki → obniża CIT.
// Reszta zysku (po wynagrodzeniach) idzie przez CIT → dywidendę.
export type SpzooPayout = {
  zyskBrutto: number; // zysk firmy przed wynagrodzeniem zarządu
  powolaniePerOsoba: number;
  powolanieRazem: number;
  pitPowolaniePerOsoba: number; // PIT skala
  zdrowotnaPowolaniePerOsoba: number; // 9%
  nettoPowolanieRazem: number; // to trafia do prywatnej kieszeni
  zyskPoWynagrodzeniach: number; // podstawa CIT
  cit: number;
  poCit: number; // zysk po CIT
  wyplacDywidende: boolean;
  dywidendaPodatek: number; // 0 gdy zysk zostaje w spółce
  nettoDywidenda: number; // wypłacona dywidenda netto (0 gdy zatrzymany)
  zatrzymaneWSpolce: number; // zysk po CIT zostający w firmie (gdy bez dywidendy)
  doKieszeni: number; // powołanie netto + ew. dywidenda netto
  wartoscPoOpodatkowaniu: number; // do kieszeni + zatrzymane w spółce
  daninyRazem: number; // wszystkie podatki/składki
  efektywna: number; // daniny / zysk brutto
};

export function computeSpzooPayout(
  zyskBrutto: number,
  powolaniePerOsoba: number,
  malyPodatnikCit: boolean,
  wyplacDywidende: boolean,
  c: TaxConstants,
): SpzooPayout {
  const zysk = Math.max(0, zyskBrutto);
  // Nie da się wypłacić więcej wynagrodzeń niż jest zysku.
  const powPerOsoba = Math.max(0, Math.min(powolaniePerOsoba, zysk / 2));
  const powolanieRazem = powPerOsoba * 2;

  // Powołanie: PIT skala + zdrowotna 9% (bez odliczeń, bez ZUS społ.).
  const pitPow = pitSkala(powPerOsoba, c);
  const zdrowotnaPow = powPerOsoba * c.zdrowotnaSkalaStawka;
  const nettoPowPerOsoba = powPerOsoba - pitPow - zdrowotnaPow;
  const nettoPowolanieRazem = nettoPowPerOsoba * 2;

  // Reszta zysku przez spółkę → CIT. Dywidenda tylko jeśli wypłacamy.
  const zyskPoWynagrodzeniach = zysk - powolanieRazem;
  const citStawka = malyPodatnikCit ? c.citMaly : c.citStandard;
  const cit = Math.max(0, zyskPoWynagrodzeniach) * citStawka;
  const poCit = zyskPoWynagrodzeniach - cit;
  const dywidendaPodatek = wyplacDywidende ? Math.max(0, poCit) * c.stawkaDywidendy : 0;
  const nettoDywidenda = wyplacDywidende ? poCit - dywidendaPodatek : 0;
  const zatrzymaneWSpolce = wyplacDywidende ? 0 : poCit;

  const doKieszeni = nettoPowolanieRazem + nettoDywidenda;
  const wartoscPoOpodatkowaniu = doKieszeni + zatrzymaneWSpolce;
  const daninyRazem = (pitPow + zdrowotnaPow) * 2 + cit + dywidendaPodatek;

  return {
    zyskBrutto: zysk,
    powolaniePerOsoba: powPerOsoba,
    powolanieRazem,
    pitPowolaniePerOsoba: pitPow,
    zdrowotnaPowolaniePerOsoba: zdrowotnaPow,
    nettoPowolanieRazem,
    zyskPoWynagrodzeniach,
    cit,
    poCit,
    wyplacDywidende,
    dywidendaPodatek,
    nettoDywidenda,
    zatrzymaneWSpolce,
    doKieszeni,
    wartoscPoOpodatkowaniu,
    daninyRazem,
    efektywna: zysk > 0 ? daninyRazem / zysk : 0,
  };
}

export function compareSpzoo(
  zyskFirmy: number,
  jdgForma: TaxForm,
  zusStage: ZusStage,
  malyPodatnikCit: boolean,
  c: TaxConstants,
): SpzooResult {
  // Sp. z o.o. - zysk → CIT → dywidenda (19%). 2-osobowa: brak ZUS wspólników.
  const citStawka = malyPodatnikCit ? c.citMaly : c.citStandard;
  const cit = Math.max(0, zyskFirmy) * citStawka;
  const poCit = zyskFirmy - cit;
  const dywidenda = Math.max(0, poCit) * c.stawkaDywidendy;
  const spzooNetto = poCit - dywidenda;
  const spzooEfektywna = zyskFirmy > 0 ? (cit + dywidenda) / zyskFirmy : 0;

  // JDG - zysk dzielony 50/50 na 2 wspólników, każdy rozlicza wybraną formą.
  const perOsoba = zyskFirmy / 2;
  const r = computeForm(jdgForma, { przychod: perOsoba, koszty: 0, zusStage }, c);
  const jdgNetto = r.netto * 2;
  const jdgDaniny = r.daniny * 2;
  const jdgEfektywna = zyskFirmy > 0 ? jdgDaniny / zyskFirmy : 0;

  return {
    zyskFirmy,
    cit,
    poCit,
    dywidenda,
    spzooNetto,
    spzooEfektywna,
    citStawka,
    jdgNetto,
    jdgDaniny,
    jdgEfektywna,
    roznica: spzooNetto - jdgNetto,
  };
}
