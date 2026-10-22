// Statystyki rozmowy treningowej liczone z transkryptu, bez AI.
// Bez importów: czyta to ekran wyników i test (`npm run test:metryki`).

export type Wypowiedz = { role: "agent" | "client"; content: string; t?: number };

export type Metryki = {
  slowaAgent: number;
  slowaKlient: number;
  /** Udział agenta w słowach rozmowy, 0-100. */
  udzialAgenta: number;
  pytania: number;
  /** Pytania otwarte (co, jak, dlaczego...), lepsze niż „czy". */
  pytaniaOtwarte: number;
  /** Sekundy do pierwszego pytania agenta, gdy znamy czasy wypowiedzi. */
  doPierwszegoPytaniaS: number | null;
  /** Numer wypowiedzi agenta z pierwszym pytaniem (1 = pierwsza), gdy brak czasów. */
  doPierwszegoPytaniaTura: number | null;
  najdluzszaWypowiedzSlow: number;
  wypelniacze: number;
  /** Czy agent podał konkretną liczbę: cenę, metraż, procent, liczbę transakcji. */
  konkretnaLiczba: boolean;
  /** Czy agent zaproponował konkretny termin (dzień albo godzinę). */
  konkretnyTermin: boolean;
  /** Czy agent zwrócił się do klienta po imieniu albo „Panie/Pani + imię". */
  poImieniu: boolean;
  /** Długość rozmowy w sekundach, gdy znamy czasy. */
  czasS: number | null;
  turyAgenta: number;
};

const slowa = (t: string) => (t.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).length;

// \b w JS działa tylko dla liter ASCII, więc granice słowa sprawdzamy ręcznie (ł, ą, ę).
const WYPELNIACZE = /(?<!\p{L})(e{2,}|y{2,}|hm+|no wiesz|no wie pan|tak jakby|jakby|generalnie|w sumie|w zasadzie|szczerze mówiąc|że tak powiem)(?!\p{L})/giu;
const OTWARTE = /(?<!\p{L})(co|jak|jaki|jaka|jakie|dlaczego|czemu|skąd|kiedy|ile|gdzie|w jaki sposób|proszę opowiedzieć|co sprawiło)(?!\p{L})/iu;
const LICZBA = /(?<!\p{L})\d[\d\s.,]*\s?(zł|złotych|tys\.?|tysięcy|mln|milion\w*|%|procent\w*|m2|m²|metr\w*|transakcj\w*|mieszka\w*|dni|tygodni\w*|miesi\w*)/iu;
const TERMIN = /(?<!\p{L})(poniedziałek|wtorek|środ[ęa]|czwartek|piątek|sobot[ęa]|niedziel[ęa]|jutro|pojutrze|o\s?\d{1,2}(:\d{2})?|\d{1,2}:\d{2}|godzin[ęa]\s?\d|rano|po południu|wieczorem)(?!\p{L})/iu;

/** Zdania pytające agenta. Liczymy znaki zapytania, bo transkrypcja mowy je stawia. */
function pytaniaW(tekst: string): string[] {
  return tekst.split(/(?<=[.!?])\s+/).filter((z) => z.trim().endsWith("?"));
}

export function metrykiRozmowy(wypowiedzi: Wypowiedz[], imieKlienta?: string | null): Metryki {
  const agent = wypowiedzi.filter((w) => w.role === "agent");
  const klient = wypowiedzi.filter((w) => w.role === "client");
  const slowaAgent = agent.reduce((s, w) => s + slowa(w.content), 0);
  const slowaKlient = klient.reduce((s, w) => s + slowa(w.content), 0);
  const razem = slowaAgent + slowaKlient;

  let pytania = 0;
  let otwarte = 0;
  let pierwszaTura: number | null = null;
  let pierwszaS: number | null = null;
  agent.forEach((w, i) => {
    const p = pytaniaW(w.content);
    pytania += p.length;
    otwarte += p.filter((z) => OTWARTE.test(z)).length;
    if (p.length && pierwszaTura === null) {
      pierwszaTura = i + 1;
      if (typeof w.t === "number") pierwszaS = w.t;
    }
  });

  const czasy = wypowiedzi.map((w) => w.t).filter((t): t is number => typeof t === "number");
  const imie = (imieKlienta ?? "").trim().toLowerCase();
  const tekstAgenta = agent.map((w) => w.content).join(" ");

  return {
    slowaAgent,
    slowaKlient,
    udzialAgenta: razem ? Math.round((slowaAgent / razem) * 100) : 0,
    pytania,
    pytaniaOtwarte: otwarte,
    doPierwszegoPytaniaS: pierwszaS,
    doPierwszegoPytaniaTura: pierwszaTura,
    najdluzszaWypowiedzSlow: agent.reduce((m, w) => Math.max(m, slowa(w.content)), 0),
    wypelniacze: (tekstAgenta.match(WYPELNIACZE) ?? []).length,
    konkretnaLiczba: LICZBA.test(tekstAgenta),
    konkretnyTermin: TERMIN.test(tekstAgenta),
    poImieniu: imie.length >= 3 && tekstAgenta.toLowerCase().includes(imie.slice(0, Math.max(3, imie.length - 2))),
    czasS: czasy.length ? Math.max(...czasy) : null,
    turyAgenta: agent.length,
  };
}

/** Ocena udziału w rozmowie: agent powinien słuchać więcej, niż mówi. */
export function ocenaUdzialu(udzial: number): "dobrze" | "za_duzo" | "za_malo" {
  if (udzial > 60) return "za_duzo";
  if (udzial < 20) return "za_malo";
  return "dobrze";
}

/**
 * Znajduje wypowiedź, z której pochodzi cytat podany przez ocenę AI.
 * Szukamy najpierw dosłownie, potem po najdłuższym wspólnym fragmencie słów,
 * bo model potrafi poprawić interpunkcję albo uciąć cytat.
 */
export function indeksCytatu(wypowiedzi: Wypowiedz[], cytat: string): number | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  const c = norm(cytat);
  if (!c) return null;
  let najlepszy: number | null = null;
  let wynik = 0;
  wypowiedzi.forEach((w, i) => {
    const t = norm(w.content);
    if (t.includes(c)) {
      if (wynik < 1000) {
        wynik = 1000;
        najlepszy = i;
      }
      return;
    }
    const sl = c.split(" ");
    let trafione = 0;
    for (const s of sl) if (s.length > 2 && t.includes(s)) trafione++;
    const ocena = trafione / Math.max(1, sl.length);
    if (ocena > wynik && ocena >= 0.5) {
      wynik = ocena;
      najlepszy = i;
    }
  });
  return najlepszy;
}

export function formatCzasu(s: number): string {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(Math.round(s % 60)).padStart(2, "0")}`;
}
