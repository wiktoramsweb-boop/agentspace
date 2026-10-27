/**
 * Zasady prowizji biura i rozliczenie jednej transakcji (v54).
 *
 * Bez importów, bo to są pieniądze ludzi i mają test (`npm run test:prowizje`).
 * Wszystko liczymy od prowizji NETTO biura (brutto / 1,23), tak jak udział
 * agenta w formularzu transakcji.
 */

export type Prog = { od: number; pct: number };

export type ZasadyProwizji = {
  progi: Prog[];
  /** Procent netto biura z transakcji agentów menedżera (kierownika oddziału). */
  nadprowizjaMenedzera: number;
  /** Opłata dla sieci / franczyzodawcy, procent netto biura. */
  oplataSieci: number;
  nazwaSieci: string | null;
};

export const ZASADY_PUSTE: ZasadyProwizji = { progi: [], nadprowizjaMenedzera: 0, oplataSieci: 0, nazwaSieci: null };

export const VAT = 1.23;

export function netto(brutto: number): number {
  return brutto / VAT;
}

/** Progi posortowane rosnąco, bez śmieci z formularza. */
export function oczyscProgi(surowe: unknown): Prog[] {
  if (!Array.isArray(surowe)) return [];
  return surowe
    .map((p) => ({ od: Math.max(0, Math.round(Number((p as Prog)?.od) || 0)), pct: Math.round(Number((p as Prog)?.pct) || 0) }))
    .filter((p) => p.pct > 0 && p.pct <= 100)
    .sort((a, b) => a.od - b.od)
    .filter((p, i, t) => i === 0 || p.od !== t[i - 1].od);
}

/**
 * Udział agenta wynikający z progów: obowiązuje najwyższy próg, który agent
 * już przekroczył prowizją netto biura od początku roku. `null`, gdy biuro
 * nie ustawiło progów albo agent nie doszedł nawet do pierwszego.
 */
export function udzialZProgow(progi: Prog[], netoOdPoczatkuRoku: number): number | null {
  let wynik: number | null = null;
  for (const p of oczyscProgi(progi)) if (netoOdPoczatkuRoku >= p.od) wynik = p.pct;
  return wynik;
}

/** Ile brakuje do następnego progu (do podpowiedzi na ekranie agenta). */
export function nastepnyProg(progi: Prog[], netoOdPoczatkuRoku: number): { brakuje: number; pct: number } | null {
  const nast = oczyscProgi(progi).find((p) => p.od > netoOdPoczatkuRoku);
  return nast ? { brakuje: Math.ceil(nast.od - netoOdPoczatkuRoku), pct: nast.pct } : null;
}

export type Podzial = { profileId: string; rola: string; pct: number };

export type RozliczenieTransakcji = {
  brutto: number;
  netto: number;
  agent: number;
  wspolni: { profileId: string; rola: string; kwota: number }[];
  menedzer: number;
  siec: number;
  /** Co zostaje biuru po wszystkich wypłatach (netto, z dodatkami). */
  biuro: number;
};

/**
 * Rozliczenie transakcji: agent prowadzący, współagenci, nadprowizja
 * menedżera, opłata dla sieci i to, co zostaje biuru.
 *
 * `agentZarobek` to zapisany zarobek agenta (udział + dodatki), bo tak go
 * już widzi agent. `dodatki` wchodzą do przychodu biura, żeby wypłata
 * dodatku agentowi nie wyglądała jak strata.
 */
export function rozliczTransakcje(p: {
  brutto: number;
  dodatki: number;
  agentZarobek: number;
  podzialy: Podzial[];
  zasady: ZasadyProwizji;
  maMenedzera: boolean;
}): RozliczenieTransakcji {
  const n = netto(Math.max(0, p.brutto));
  const wspolni = p.podzialy.map((s) => ({ profileId: s.profileId, rola: s.rola, kwota: Math.round((n * s.pct) / 100) }));
  const menedzer = p.maMenedzera ? Math.round((n * p.zasady.nadprowizjaMenedzera) / 100) : 0;
  const siec = Math.round((n * p.zasady.oplataSieci) / 100);
  const wyplaty = p.agentZarobek + wspolni.reduce((a, w) => a + w.kwota, 0) + menedzer + siec;
  return {
    brutto: p.brutto,
    netto: Math.round(n),
    agent: p.agentZarobek,
    wspolni,
    menedzer,
    siec,
    biuro: Math.round(n + p.dodatki - wyplaty),
  };
}

/** Suma procentów współagentów nie może razem z agentem przekroczyć 100% netto. */
export function podzialMiesciSie(udzialAgenta: number, podzialy: { pct: number }[]): boolean {
  return udzialAgenta + podzialy.reduce((a, s) => a + s.pct, 0) <= 100;
}
