// Banki udzielające kredytów w Polsce i statusy wniosku. Bez importów: czyta to
// serwer i przeglądarka. Kafelek banku to nasz znak w kolorze banku, nie jego logo.

export type Bank = { id: string; nazwa: string; skrot: string; tlo: string; tekst: string };

export const BANKI: Bank[] = [
  { id: "pko", nazwa: "PKO Bank Polski", skrot: "PKO", tlo: "#003574", tekst: "#ffffff" },
  { id: "pekao", nazwa: "Bank Pekao", skrot: "Pekao", tlo: "#c8102e", tekst: "#ffffff" },
  { id: "santander", nazwa: "Santander", skrot: "San", tlo: "#ec0000", tekst: "#ffffff" },
  { id: "mbank", nazwa: "mBank", skrot: "mB", tlo: "#ffffff", tekst: "#d6006e" },
  { id: "ing", nazwa: "ING Bank Śląski", skrot: "ING", tlo: "#ff6200", tekst: "#ffffff" },
  { id: "bnp", nazwa: "BNP Paribas", skrot: "BNP", tlo: "#00915a", tekst: "#ffffff" },
  { id: "millennium", nazwa: "Bank Millennium", skrot: "Mil", tlo: "#b5006e", tekst: "#ffffff" },
  { id: "alior", nazwa: "Alior Bank", skrot: "Alior", tlo: "#7a003c", tekst: "#ffffff" },
  { id: "ca", nazwa: "Credit Agricole", skrot: "CA", tlo: "#007a6e", tekst: "#ffffff" },
  { id: "velo", nazwa: "VeloBank", skrot: "Velo", tlo: "#00c389", tekst: "#04352a" },
  { id: "bos", nazwa: "BOŚ Bank", skrot: "BOŚ", tlo: "#00843d", tekst: "#ffffff" },
  { id: "bps", nazwa: "Bank BPS", skrot: "BPS", tlo: "#004b93", tekst: "#ffffff" },
];

export const bankPoId = (id: string): Bank => BANKI.find((b) => b.id === id) ?? { id, nazwa: id, skrot: id.slice(0, 4), tlo: "#475569", tekst: "#ffffff" };

export type StatusWniosku = "przygotowanie" | "zlozony" | "analiza" | "dosylka" | "pozytywna" | "negatywna" | "wycofany";

export const STATUSY_WNIOSKU: { id: StatusWniosku; nazwa: string; kolor: string }[] = [
  { id: "przygotowanie", nazwa: "W przygotowaniu", kolor: "bg-slate-100 text-slate-700" },
  { id: "zlozony", nazwa: "Złożony", kolor: "bg-sky-100 text-sky-800" },
  { id: "analiza", nazwa: "Analiza w banku", kolor: "bg-violet-100 text-violet-800" },
  { id: "dosylka", nazwa: "Bank prosi o dokumenty", kolor: "bg-amber-100 text-amber-800" },
  { id: "pozytywna", nazwa: "Decyzja pozytywna", kolor: "bg-emerald-100 text-emerald-800" },
  { id: "negatywna", nazwa: "Decyzja negatywna", kolor: "bg-rose-100 text-rose-800" },
  { id: "wycofany", nazwa: "Wycofany", kolor: "bg-slate-200 text-slate-600" },
];

export const statusWniosku = (id: string) => STATUSY_WNIOSKU.find((s) => s.id === id) ?? STATUSY_WNIOSKU[0];

export type Finanse = { cena?: number | null; wklad?: number | null; dochod?: number | null; zobowiazania?: number | null; lat?: number | null; oprocentowanie?: number | null };

/** Rata równa (annuitet). */
export function rataKredytu(kwota: number, oprocentowaniePct: number, lat: number): number {
  const n = lat * 12;
  const r = oprocentowaniePct / 100 / 12;
  if (n <= 0) return 0;
  if (r === 0) return kwota / n;
  return (kwota * r) / (1 - (1 + r) ** -n);
}

export type Analiza = { rata: number | null; ltv: number | null; dti: number | null; uwagi: { tekst: string; ton: "dobrze" | "uwaga" | "zle" }[] };

/**
 * Szybki obraz sprawy. To orientacja dla doradcy przed wyborem banków, nie
 * decyzja: każdy bank liczy zdolność po swojemu. Progi: LTV 80% (powyżej
 * zwykle wymagane dodatkowe zabezpieczenie), LTV 90% (typowy limit wkładu 10%),
 * DTI 40% i 50% (typowe granice przy niższych i wyższych dochodach).
 */
export function analizaFinansow(kwota: number | null, f: Finanse): Analiza {
  const lat = f.lat || 25;
  const opr = f.oprocentowanie || 7;
  const rata = kwota ? Math.round(rataKredytu(kwota, opr, lat)) : null;
  const ltv = kwota && f.cena ? Math.round((kwota / f.cena) * 100) : null;
  const dti = rata && f.dochod ? Math.round(((rata + (f.zobowiazania ?? 0)) / f.dochod) * 100) : null;
  const uwagi: Analiza["uwagi"] = [];
  if (ltv != null) {
    if (ltv > 90) uwagi.push({ tekst: `LTV ${ltv}%: wkład poniżej 10%, większość banków odmówi.`, ton: "zle" });
    else if (ltv > 80) uwagi.push({ tekst: `LTV ${ltv}%: zwykle potrzebne dodatkowe zabezpieczenie wkładu.`, ton: "uwaga" });
    else uwagi.push({ tekst: `LTV ${ltv}%: wkład własny w normie.`, ton: "dobrze" });
  }
  if (dti != null) {
    if (dti > 50) uwagi.push({ tekst: `Raty to ${dti}% dochodu: zdolność zagrożona.`, ton: "zle" });
    else if (dti > 40) uwagi.push({ tekst: `Raty to ${dti}% dochodu: na granicy w wielu bankach.`, ton: "uwaga" });
    else uwagi.push({ tekst: `Raty to ${dti}% dochodu: bezpieczny poziom.`, ton: "dobrze" });
  }
  return { rata, ltv, dti, uwagi };
}

/** Podpowiedź następnego kroku. Kolejność: to, co blokuje sprawę, przed tym, co ją popycha. */
export function nastepnyKrok(etap: string, brakDokumentow: number, wnioski: { status: string }[]): string {
  if (etap === "umowa" || etap === "odrzucone") return "Sprawa zakończona.";
  if (wnioski.some((w) => w.status === "dosylka")) return "Bank czeka na dokumenty: doślij je, zanim wniosek się przeterminuje.";
  if (wnioski.some((w) => w.status === "pozytywna")) return "Jest decyzja pozytywna: omów warunki z klientem i umów podpisanie umowy.";
  if (etap === "nowe") return "Zadzwoń do klienta i uzupełnij jego sytuację finansową.";
  if (etap === "analiza") return wnioski.length ? "Wybierz bank i przygotuj wniosek." : "Porównaj oferty i wybierz banki poniżej.";
  if (brakDokumentow > 0) return `Zbierz brakujące dokumenty: ${brakDokumentow}.`;
  if (!wnioski.length) return "Dokumenty są komplet: złóż wniosek w wybranym banku.";
  if (wnioski.every((w) => w.status === "negatywna" || w.status === "wycofany")) return "Wszystkie banki odmówiły: spróbuj innego banku albo zmień konstrukcję kredytu.";
  return "Wniosek w banku: sprawdź status i daj znać klientowi.";
}
