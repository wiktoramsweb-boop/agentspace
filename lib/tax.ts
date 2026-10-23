// Kalkulator podatkowy dla biura nieruchomości: forma opodatkowania JDG, ZUS,
// VAT, sp. z o.o., koszt zatrudnienia agenta i podatki przy sprzedaży mieszkania.
//
// UWAGA: To narzędzie do modelowania i porównań, NIE porada podatkowa.
// Domyślne kwoty to obowiązujące w 2026 r. (ZUS, zdrowotna, limity PIT).
// Wszystkie stałe są edytowalne w zakładce „Założenia", bo zmieniają się co rok.
// Bez importów: liczy to przeglądarka i test (`npm run test:podatki`).

export type TaxForm = "skala" | "liniowy" | "ryczalt";
export type ZusStage = "ulga_start" | "preferencyjny" | "maly_plus" | "duzy";

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
  ulga_start: "Ulga na start (6 mies., 0 zł społecznych)",
  preferencyjny: "Mały ZUS, preferencyjny (24 mies.)",
  maly_plus: "Mały ZUS Plus (od dochodu)",
  duzy: "Duży ZUS (pełne składki)",
};

// ── Stałe (edytowalne w UI) ─────────────────────────────────────────────────
export type TaxConstants = {
  // PIT - skala
  kwotaWolna: number;
  progSkali: number;
  stawkaSkala1: number;
  stawkaSkala2: number;
  kwotaZmniejszajaca: number;
  // PIT - liniowy
  stawkaLiniowy: number;
  liniowyZdrowotnaOdliczenieLimit: number;
  // PIT - ryczałt (pośrednictwo w obrocie nieruchomościami)
  stawkaRyczalt: number;
  // Danina solidarnościowa (4% od dochodu > 1 mln)
  daninaProg: number;
  daninaStawka: number;
  // Składka zdrowotna
  zdrowotnaSkalaStawka: number;
  zdrowotnaLiniowyStawka: number;
  zdrowotnaMinMies: number;
  ryczaltProg1: number;
  ryczaltProg2: number;
  zdrowotnaRyczalt1Mies: number;
  zdrowotnaRyczalt2Mies: number;
  zdrowotnaRyczalt3Mies: number;
  // ZUS społeczny: podstawy i stawki
  placaMinimalna: number;
  podstawaDuzyZus: number;
  podstawaMalyZus: number;
  limitMalyZusPlus: number;
  stawkaEmerytalna: number;
  stawkaRentowa: number;
  stawkaWypadkowa: number;
  stawkaChorobowa: number;
  stawkaFP: number;
  // VAT
  limitVat: number;
  stawkaVat: number;
  // CIT (sp. z o.o.)
  citMaly: number;
  citStandard: number;
  stawkaDywidendy: number;
  // Etat i zlecenie (koszt agenta)
  pracownikSpoleczne: number;
  pracodawcaSkladki: number;
  kupEtatMies: number;
  kwotaZmniejszajacaMies: number;
  // Sprzedaż nieruchomości
  stawkaPitSprzedaz: number;
  stawkaPcc: number;
};

export const DEFAULT_CONSTANTS: TaxConstants = {
  kwotaWolna: 30000,
  progSkali: 120000,
  stawkaSkala1: 0.12,
  stawkaSkala2: 0.32,
  kwotaZmniejszajaca: 3600,
  stawkaLiniowy: 0.19,
  liniowyZdrowotnaOdliczenieLimit: 14100,
  stawkaRyczalt: 0.15,
  daninaProg: 1000000,
  daninaStawka: 0.04,
  zdrowotnaSkalaStawka: 0.09,
  zdrowotnaLiniowyStawka: 0.049,
  zdrowotnaMinMies: 432.54,
  ryczaltProg1: 60000,
  ryczaltProg2: 300000,
  zdrowotnaRyczalt1Mies: 498.35,
  zdrowotnaRyczalt2Mies: 830.58,
  zdrowotnaRyczalt3Mies: 1495.04,
  placaMinimalna: 4806,
  podstawaDuzyZus: 5652,
  podstawaMalyZus: 1441.8,
  limitMalyZusPlus: 120000,
  stawkaEmerytalna: 0.1952,
  stawkaRentowa: 0.08,
  stawkaWypadkowa: 0.0167,
  stawkaChorobowa: 0.0245,
  stawkaFP: 0.0245,
  limitVat: 240000,
  stawkaVat: 0.23,
  citMaly: 0.09,
  citStandard: 0.19,
  stawkaDywidendy: 0.19,
  pracownikSpoleczne: 0.1371,
  pracodawcaSkladki: 0.2048,
  kupEtatMies: 250,
  kwotaZmniejszajacaMies: 300,
  stawkaPitSprzedaz: 0.19,
  stawkaPcc: 0.02,
};

const r2 = (n: number) => Math.round(n * 100) / 100;

// ── ZUS społeczny ───────────────────────────────────────────────────────────

export type OpcjeZus = { chorobowe?: boolean; dochodPoprzedni?: number };

/** Podstawa Małego ZUS Plus: połowa średniego miesięcznego dochodu z zeszłego roku, w widełkach. */
export function podstawaMalyZusPlus(dochodPoprzedni: number, c: TaxConstants): number {
  const polowa = Math.max(0, dochodPoprzedni) / 12 / 2;
  return r2(Math.min(c.podstawaDuzyZus, Math.max(c.podstawaMalyZus, polowa)));
}

export function podstawaZus(stage: ZusStage, c: TaxConstants, o: OpcjeZus = {}): number {
  if (stage === "ulga_start") return 0;
  if (stage === "preferencyjny") return c.podstawaMalyZus;
  if (stage === "maly_plus") return podstawaMalyZusPlus(o.dochodPoprzedni ?? 0, c);
  return c.podstawaDuzyZus;
}

export type ZusMies = { podstawa: number; emerytalna: number; rentowa: number; wypadkowa: number; chorobowa: number; fp: number; razem: number };

/**
 * Miesięczne składki społeczne przedsiębiorcy. Każdą składkę zaokrąglamy
 * osobno, jak ZUS. Fundusz Pracy jest należny dopiero od podstawy
 * co najmniej płacy minimalnej, więc przy małym ZUS go nie ma.
 */
export function zusMies(stage: ZusStage, c: TaxConstants, o: OpcjeZus = {}): ZusMies {
  const podstawa = podstawaZus(stage, c, o);
  const emerytalna = r2(podstawa * c.stawkaEmerytalna);
  const rentowa = r2(podstawa * c.stawkaRentowa);
  const wypadkowa = r2(podstawa * c.stawkaWypadkowa);
  const chorobowa = o.chorobowe === false ? 0 : r2(podstawa * c.stawkaChorobowa);
  const fp = podstawa >= c.placaMinimalna ? r2(podstawa * c.stawkaFP) : 0;
  return { podstawa, emerytalna, rentowa, wypadkowa, chorobowa, fp, razem: r2(emerytalna + rentowa + wypadkowa + chorobowa + fp) };
}

/** Roczne składki społeczne. Fundusz Pracy nie obniża podatku, reszta tak. */
function zusRoczny(stage: ZusStage, c: TaxConstants, o: OpcjeZus) {
  const m = zusMies(stage, c, o);
  return { razem: m.razem * 12, doOdliczenia: (m.razem - m.fp) * 12 };
}

function zdrowotnaRyczaltRoczna(przychodPoZus: number, c: TaxConstants): number {
  const mies =
    przychodPoZus <= c.ryczaltProg1
      ? c.zdrowotnaRyczalt1Mies
      : przychodPoZus <= c.ryczaltProg2
        ? c.zdrowotnaRyczalt2Mies
        : c.zdrowotnaRyczalt3Mies;
  return mies * 12;
}

export function pitSkala(podstawa: number, c: TaxConstants): number {
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
  dochod: number;
  zusSpoleczny: number;
  zdrowotna: number;
  podatek: number;
  danina: number;
  podstawaOpodatkowania: number;
  daniny: number;
  netto: number;
  nettoMies: number;
  efektywna: number;
};

export type FormInput = {
  przychod: number;
  koszty: number;
  zusStage: ZusStage;
  chorobowe?: boolean;
  /** Dochód z zeszłego roku: podstawa Małego ZUS Plus. */
  dochodPoprzedni?: number;
  /** Dochód małżonka przy wspólnym rozliczeniu (tylko skala). */
  dochodMalzonka?: number | null;
};

export function computeForm(form: TaxForm, input: FormInput, c: TaxConstants): FormResult {
  const przychod = Math.max(0, input.przychod);
  const koszty = Math.max(0, input.koszty);
  const dochod = przychod - koszty;
  const zus = zusRoczny(input.zusStage, c, { chorobowe: input.chorobowe, dochodPoprzedni: input.dochodPoprzedni });
  const zusSpoleczny = zus.razem;
  const minZdrowotna = c.zdrowotnaMinMies * 12;
  // Zdrowotną na skali i liniowym liczy się od dochodu pomniejszonego o składki społeczne.
  const dochodPoZus = Math.max(0, dochod - zus.doOdliczenia);

  let zdrowotna = 0;
  let podatek = 0;
  let podstawaOpodatkowania = 0;
  let danina = 0;

  if (form === "skala") {
    zdrowotna = Math.max(minZdrowotna, dochodPoZus * c.zdrowotnaSkalaStawka);
    podstawaOpodatkowania = dochodPoZus;
    const m = input.dochodMalzonka;
    if (m != null && m >= 0) {
      // Wspólne rozliczenie: podatek od połowy łącznej podstawy razy dwa.
      // Tobie przypisujemy różnicę względem tego, co małżonek zapłaciłby sam.
      podatek = Math.max(0, 2 * pitSkala((podstawaOpodatkowania + m) / 2, c) - pitSkala(m, c));
    } else {
      podatek = pitSkala(podstawaOpodatkowania, c);
    }
  } else if (form === "liniowy") {
    zdrowotna = Math.max(minZdrowotna, dochodPoZus * c.zdrowotnaLiniowyStawka);
    const zdrowotnaOdliczenie = Math.min(zdrowotna, c.liniowyZdrowotnaOdliczenieLimit);
    podstawaOpodatkowania = Math.max(0, dochodPoZus - zdrowotnaOdliczenie);
    podatek = podstawaOpodatkowania * c.stawkaLiniowy;
  } else {
    // Ryczałt od przychodu: koszty nie obniżają podatku. Próg zdrowotnej
    // liczy się od przychodu po składkach społecznych.
    zdrowotna = zdrowotnaRyczaltRoczna(Math.max(0, przychod - zus.doOdliczenia), c);
    podstawaOpodatkowania = Math.max(0, przychod - zus.doOdliczenia - 0.5 * zdrowotna);
    podatek = podstawaOpodatkowania * c.stawkaRyczalt;
  }

  if (form !== "ryczalt" && podstawaOpodatkowania > c.daninaProg) {
    danina = (podstawaOpodatkowania - c.daninaProg) * c.daninaStawka;
  }

  const daniny = podatek + zdrowotna + zusSpoleczny + danina;
  const netto = dochod - daniny;
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
    nettoMies: netto / 12,
    efektywna: dochod > 0 ? daniny / dochod : 0,
  };
}

export function compareForms(input: FormInput, c: TaxConstants) {
  const forms: TaxForm[] = ["skala", "liniowy", "ryczalt"];
  const results = forms.map((f) => computeForm(f, input, c));
  const best = results.reduce((a, b) => (b.netto > a.netto ? b : a));
  return { results, best };
}

/** Dochód, przy którym liniowy zaczyna wygrywać ze skalą (bez kosztów). */
export function progSkalaLiniowy(zusStage: ZusStage, c: TaxConstants, o: OpcjeZus = {}): number {
  let lo = 20000;
  let hi = 1000000;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const skala = computeForm("skala", { przychod: mid, koszty: 0, zusStage, ...o }, c);
    const liniowy = computeForm("liniowy", { przychod: mid, koszty: 0, zusStage, ...o }, c);
    if (liniowy.netto >= skala.netto) hi = mid;
    else lo = mid;
  }
  return Math.round((lo + hi) / 2);
}

// ── ZUS - oś czasu ──────────────────────────────────────────────────────────
export type ZusTimeline = {
  ulgaStartDo: Date | null;
  preferencyjnyOd: Date;
  preferencyjnyDo: Date;
  monthsLeft: number;
  skokMies: number;
  skokRoczny: number;
};

/**
 * Ulga na start trwa 6 pełnych miesięcy po miesiącu założenia, potem 24
 * miesiące małego ZUS. Liczymy od pierwszego dnia miesiąca po założeniu.
 */
export function zusTimeline(dataZalozenia: Date, ulgaNaStart: boolean, c: TaxConstants, now = new Date(), o: OpcjeZus = {}): ZusTimeline {
  const start = addMonths(new Date(dataZalozenia.getFullYear(), dataZalozenia.getMonth(), 1), 1);
  let ulgaStartDo: Date | null = null;
  let preferencyjnyOd = start;
  if (ulgaNaStart) {
    ulgaStartDo = addMonths(start, 6);
    preferencyjnyOd = ulgaStartDo;
  }
  const preferencyjnyDo = addMonths(preferencyjnyOd, 24);
  const skokMies = zusMies("duzy", c, o).razem - zusMies("preferencyjny", c, o).razem;
  return {
    ulgaStartDo,
    preferencyjnyOd,
    preferencyjnyDo,
    monthsLeft: monthsBetween(now, preferencyjnyDo),
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
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

// ── VAT ─────────────────────────────────────────────────────────────────────
export type VatSubject = { name: string; przychod: number };
export type VatResult = {
  subjects: { name: string; przychod: number; doLimitu: number; nadLimit: boolean; procent: number }[];
  limit: number;
  pojemnosc: number;
  sumaPrzychodow: number;
  nadPojemnosc: number;
  vatNalezny: number;
  vatOdliczony: number;
  kosztUtratyNetto: number;
};

/**
 * Limity zwolnienia z VAT dla podmiotów biura i koszt wejścia w VAT.
 * Klienci biura to głównie osoby prywatne, więc VAT od prowizji jest dla
 * biura kosztem: cena brutto zostaje ta sama, a 23% z niej idzie do urzędu.
 */
export function computeVat(subjects: VatSubject[], kosztyZVat: number, c: TaxConstants): VatResult {
  const rows = subjects.map((s) => ({
    name: s.name,
    przychod: s.przychod,
    doLimitu: c.limitVat - s.przychod,
    nadLimit: s.przychod > c.limitVat,
    procent: c.limitVat > 0 ? s.przychod / c.limitVat : 0,
  }));
  const sumaPrzychodow = subjects.reduce((a, s) => a + s.przychod, 0);
  const pojemnosc = c.limitVat * subjects.length;
  const vatNalezny = (sumaPrzychodow * c.stawkaVat) / (1 + c.stawkaVat);
  const vatOdliczony = (Math.max(0, kosztyZVat) * c.stawkaVat) / (1 + c.stawkaVat);
  return {
    subjects: rows,
    limit: c.limitVat,
    pojemnosc,
    sumaPrzychodow,
    nadPojemnosc: Math.max(0, sumaPrzychodow - pojemnosc),
    vatNalezny,
    vatOdliczony,
    kosztUtratyNetto: Math.max(0, vatNalezny - vatOdliczony),
  };
}

// ── JDG vs sp. z o.o. ───────────────────────────────────────────────────────
export type SpzooPayout = {
  zyskBrutto: number;
  wspolnikow: number;
  powolaniePerOsoba: number;
  powolanieRazem: number;
  pitPowolaniePerOsoba: number;
  zdrowotnaPowolaniePerOsoba: number;
  zusJedynegoWspolnika: number;
  nettoPowolanieRazem: number;
  zyskPoWynagrodzeniach: number;
  cit: number;
  citStawka: number;
  poCit: number;
  wyplacDywidende: boolean;
  dywidendaPodatek: number;
  nettoDywidenda: number;
  zatrzymaneWSpolce: number;
  doKieszeni: number;
  wartoscPoOpodatkowaniu: number;
  daninyRazem: number;
  efektywna: number;
};

/**
 * Spółka wypłaca wynagrodzenie z powołania (skala + zdrowotna 9%, bez ZUS
 * społecznego), które jest jej kosztem. Resztę zysku obciąża CIT, a przy
 * wypłacie dodatkowo dywidenda. Jedyny wspólnik płaci ZUS jak przedsiębiorca
 * (duży ZUS i zdrowotną od płacy minimalnej), dwóch i więcej już nie.
 */
export function computeSpzooPayout(
  zyskBrutto: number,
  powolaniePerOsoba: number,
  malyPodatnikCit: boolean,
  wyplacDywidende: boolean,
  c: TaxConstants,
  wspolnikow = 2,
): SpzooPayout {
  const n = Math.max(1, Math.round(wspolnikow));
  const zysk = Math.max(0, zyskBrutto);
  const zusJedynego = n === 1 ? (zusMies("duzy", c).razem + c.zdrowotnaMinMies) * 12 : 0;
  const doPodzialu = Math.max(0, zysk - zusJedynego);
  const powPerOsoba = Math.max(0, Math.min(powolaniePerOsoba, doPodzialu / n));
  const powolanieRazem = powPerOsoba * n;

  const pitPow = pitSkala(powPerOsoba, c);
  const zdrowotnaPow = powPerOsoba * c.zdrowotnaSkalaStawka;
  const nettoPowolanieRazem = (powPerOsoba - pitPow - zdrowotnaPow) * n;

  const zyskPoWynagrodzeniach = doPodzialu - powolanieRazem;
  const citStawka = malyPodatnikCit ? c.citMaly : c.citStandard;
  const cit = Math.max(0, zyskPoWynagrodzeniach) * citStawka;
  const poCit = zyskPoWynagrodzeniach - cit;
  const dywidendaPodatek = wyplacDywidende ? Math.max(0, poCit) * c.stawkaDywidendy : 0;
  const nettoDywidenda = wyplacDywidende ? poCit - dywidendaPodatek : 0;
  const zatrzymaneWSpolce = wyplacDywidende ? 0 : poCit;
  const doKieszeni = nettoPowolanieRazem + nettoDywidenda;
  const daninyRazem = (pitPow + zdrowotnaPow) * n + cit + dywidendaPodatek + zusJedynego;

  return {
    zyskBrutto: zysk,
    wspolnikow: n,
    powolaniePerOsoba: powPerOsoba,
    powolanieRazem,
    pitPowolaniePerOsoba: pitPow,
    zdrowotnaPowolaniePerOsoba: zdrowotnaPow,
    zusJedynegoWspolnika: zusJedynego,
    nettoPowolanieRazem,
    zyskPoWynagrodzeniach,
    cit,
    citStawka,
    poCit,
    wyplacDywidende,
    dywidendaPodatek,
    nettoDywidenda,
    zatrzymaneWSpolce,
    doKieszeni,
    wartoscPoOpodatkowaniu: doKieszeni + zatrzymaneWSpolce,
    daninyRazem,
    efektywna: zysk > 0 ? daninyRazem / zysk : 0,
  };
}

/** Te same pieniądze na JDG: zysk dzielony po równo, każdy na wybranej formie. */
export function jdgDlaWspolnikow(zyskFirmy: number, forma: TaxForm, zusStage: ZusStage, c: TaxConstants, wspolnikow = 2) {
  const n = Math.max(1, Math.round(wspolnikow));
  const r = computeForm(forma, { przychod: zyskFirmy / n, koszty: 0, zusStage }, c);
  return { netto: r.netto * n, daniny: r.daniny * n, efektywna: zyskFirmy > 0 ? (r.daniny * n) / zyskFirmy : 0 };
}

// ── Koszt agenta: etat, zlecenie, B2B ───────────────────────────────────────
export type Umowa = "etat" | "zlecenie" | "b2b";

export type KosztAgenta = {
  umowa: Umowa;
  brutto: number;
  kosztBiura: number;
  spoleczneAgenta: number;
  zdrowotnaAgenta: number;
  zaliczkaPit: number;
  nettoAgenta: number;
};

/**
 * Miesięczny koszt agenta dla biura i ile z tego dostaje agent.
 * Etat: składki pracownika 13,71%, zdrowotna 9% od brutto po społecznych,
 * koszty 250 zł, zaliczka 12% minus 300 zł (PIT-2). Pracodawca dokłada
 * 20,48% (emerytalna, rentowa, wypadkowa, Fundusz Pracy, FGŚP).
 * Zlecenie: te same składki (gdy to jedyny tytuł do ubezpieczeń), koszty 20%.
 * Osoba do 26 lat na etacie lub zleceniu nie płaci PIT (ulga dla młodych),
 * a student do 26 lat na zleceniu nie płaci też składek.
 * B2B: biuro płaci fakturę, agent sam opłaca podatek i ZUS.
 */
export function kosztAgenta(
  umowa: Umowa,
  kwota: number,
  c: TaxConstants,
  o: { do26?: boolean; student?: boolean; chorobowe?: boolean; b2bForma?: TaxForm; b2bZus?: ZusStage; b2bKoszty?: number } = {},
): KosztAgenta {
  const brutto = Math.max(0, kwota);
  if (umowa === "b2b") {
    const r = computeForm(o.b2bForma ?? "ryczalt", { przychod: brutto * 12, koszty: (o.b2bKoszty ?? 0) * 12, zusStage: o.b2bZus ?? "duzy", chorobowe: o.chorobowe }, c);
    return {
      umowa,
      brutto,
      kosztBiura: brutto,
      spoleczneAgenta: r.zusSpoleczny / 12,
      zdrowotnaAgenta: r.zdrowotna / 12,
      zaliczkaPit: (r.podatek + r.danina) / 12,
      nettoAgenta: r.netto / 12,
    };
  }
  const bezSkladek = umowa === "zlecenie" && o.student && o.do26;
  const chorobowaPracownika = umowa === "zlecenie" && o.chorobowe === false ? c.stawkaChorobowa : 0;
  const spoleczne = bezSkladek ? 0 : r2(brutto * (c.pracownikSpoleczne - chorobowaPracownika));
  const zdrowotna = bezSkladek ? 0 : r2((brutto - spoleczne) * c.zdrowotnaSkalaStawka);
  const kup = umowa === "etat" ? c.kupEtatMies : r2((brutto - spoleczne) * 0.2);
  const podstawa = Math.max(0, Math.round(brutto - spoleczne - kup));
  const zaliczkaPit = o.do26 ? 0 : Math.max(0, Math.round(podstawa * c.stawkaSkala1 - c.kwotaZmniejszajacaMies));
  // Fundusz Pracy pracodawca płaci dopiero od wynagrodzenia co najmniej minimalnego.
  const fp = brutto >= c.placaMinimalna ? 0 : c.stawkaFP;
  const skladkiPracodawcy = bezSkladek ? 0 : r2(brutto * (c.pracodawcaSkladki - fp));
  return {
    umowa,
    brutto,
    kosztBiura: r2(brutto + skladkiPracodawcy),
    spoleczneAgenta: spoleczne,
    zdrowotnaAgenta: zdrowotna,
    zaliczkaPit,
    nettoAgenta: r2(brutto - spoleczne - zdrowotna - zaliczkaPit),
  };
}

// ── Sprzedaż nieruchomości: PIT sprzedającego i PCC kupującego ──────────────
export type SprzedazInput = {
  rokNabycia: number;
  rokSprzedazy: number;
  cenaSprzedazy: number;
  kosztySprzedazy: number;
  kosztNabycia: number;
  naklady: number;
  wydatkiMieszkaniowe: number;
};

export type SprzedazWynik = {
  zwolnionaPo5Latach: boolean;
  rokBezPodatku: number;
  przychod: number;
  dochod: number;
  dochodZwolniony: number;
  podatek: number;
  terminWydatkow: number;
  udzialWydatkow: number;
};

/**
 * Podatek od sprzedaży mieszkania przed upływem pięciu lat.
 * Pięć lat liczy się od końca roku nabycia, więc mieszkanie kupione
 * w 2021 sprzedasz bez podatku od 1 stycznia 2027. Przy spadku liczy się
 * rok nabycia przez spadkodawcę. Ulga mieszkaniowa zwalnia dochód w takiej
 * części, w jakiej przychód wydasz na własne cele mieszkaniowe w ciągu
 * trzech lat od końca roku sprzedaży.
 */
export function podatekOdSprzedazy(i: SprzedazInput, c: TaxConstants): SprzedazWynik {
  const rokBezPodatku = i.rokNabycia + 6;
  const zwolnionaPo5Latach = i.rokSprzedazy >= rokBezPodatku;
  const przychod = Math.max(0, i.cenaSprzedazy - i.kosztySprzedazy);
  const dochod = Math.max(0, przychod - i.kosztNabycia - i.naklady);
  const udzialWydatkow = przychod > 0 ? Math.min(1, Math.max(0, i.wydatkiMieszkaniowe) / przychod) : 0;
  const dochodZwolniony = zwolnionaPo5Latach ? dochod : dochod * udzialWydatkow;
  const podatek = zwolnionaPo5Latach ? 0 : Math.round((dochod - dochodZwolniony) * c.stawkaPitSprzedaz);
  return { zwolnionaPo5Latach, rokBezPodatku, przychod, dochod, dochodZwolniony, podatek, terminWydatkow: i.rokSprzedazy + 3, udzialWydatkow };
}

/**
 * PCC płaci kupujący na rynku wtórnym. Od 2023 r. pierwsze mieszkanie
 * (kupujący nigdy nie miał mieszkania ani domu) jest zwolnione. Na rynku
 * pierwotnym w cenie jest VAT i PCC nie ma.
 */
export function pccKupujacego(cena: number, rynek: "wtorny" | "pierwotny", pierwszeMieszkanie: boolean, c: TaxConstants): number {
  if (rynek === "pierwotny" || pierwszeMieszkanie) return 0;
  return Math.round(Math.max(0, cena) * c.stawkaPcc);
}
