// Kalkulatory dla klienta (szacunki — nie stanowią oferty).

export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  const n = Math.max(1, Math.round(years * 12));
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export type MortgageResult = { rata: number; total: number; interest: number; months: number };

export function mortgage(principal: number, rate: number, years: number): MortgageResult {
  const rata = monthlyPayment(principal, rate, years);
  const months = Math.round(years * 12);
  const total = rata * months;
  return { rata, total, interest: total - principal, months };
}

/** Maksymalna taksa notarialna (netto) wg rozporządzenia. */
export function taksaNotarialnaNetto(value: number): number {
  let t: number;
  if (value <= 3000) t = 100;
  else if (value <= 10000) t = 100 + 0.03 * (value - 3000);
  else if (value <= 30000) t = 310 + 0.02 * (value - 10000);
  else if (value <= 60000) t = 710 + 0.01 * (value - 30000);
  else if (value <= 1000000) t = 1010 + 0.004 * (value - 60000);
  else if (value <= 2000000) t = 4770 + 0.002 * (value - 1000000);
  else t = 6770 + 0.0025 * (value - 2000000);
  return Math.min(t, 10000);
}

export type Rynek = "wtorny" | "wtorny_bez_pcc" | "pierwotny";

// Stałe opłaty (brutto)
export const OPLATA_SADOWA = 200; // wpis prawa własności do KW
export const WNIOSEK_KW = 246; // opłata za wniosek wieczystoksięgowy (brutto)
export const HIPOTEKA = 615; // ustanowienie hipoteki (brutto)

export type PurchaseCosts = {
  pcc: number;
  taksaMaksBrutto: number;
  taksaFinal: number;
  taksaSave: number;
  oplataSadowa: number;
  wniosekKW: number;
  hipoteka: number;
  feesTotal: number;
  prowizjaStd: number;
  prowizjaFinal: number;
  prowizjaSave: number;
  total: number;
  totalSave: number;
};

export function purchaseCosts(opts: {
  price: number;
  rynek: Rynek;
  naKredyt: boolean;
  prowizjaStdPct: number;
  prowizjaFinalPct: number;
  taksaFinalBrutto: number | null; // null → maksymalna taksa
}): PurchaseCosts {
  const pcc = opts.rynek === "wtorny" ? opts.price * 0.02 : 0;

  const taksaMaksBrutto = taksaNotarialnaNetto(opts.price) * 1.23;
  const taksaFinal = opts.taksaFinalBrutto != null ? opts.taksaFinalBrutto : taksaMaksBrutto;
  const taksaSave = Math.max(0, taksaMaksBrutto - taksaFinal);

  const hipoteka = opts.naKredyt ? HIPOTEKA : 0;
  const feesTotal = OPLATA_SADOWA + WNIOSEK_KW + hipoteka;

  const prowizjaStd = (opts.prowizjaStdPct / 100) * opts.price;
  const prowizjaFinal = (opts.prowizjaFinalPct / 100) * opts.price;
  const prowizjaSave = Math.max(0, prowizjaStd - prowizjaFinal);

  const total = pcc + taksaFinal + feesTotal + prowizjaFinal;
  const totalSave = taksaSave + prowizjaSave;

  return {
    pcc,
    taksaMaksBrutto,
    taksaFinal,
    taksaSave,
    oplataSadowa: OPLATA_SADOWA,
    wniosekKW: WNIOSEK_KW,
    hipoteka,
    feesTotal,
    prowizjaStd,
    prowizjaFinal,
    prowizjaSave,
    total,
    totalSave,
  };
}

export type YieldResult = { gross: number; net: number; paybackYears: number; annualNet: number };

export function rentalYield(opts: {
  price: number;
  monthlyRent: number;
  monthlyCost: number;
}): YieldResult {
  const annualGross = opts.monthlyRent * 12;
  const annualNet = (opts.monthlyRent - opts.monthlyCost) * 12;
  const gross = opts.price > 0 ? (annualGross / opts.price) * 100 : 0;
  const net = opts.price > 0 ? (annualNet / opts.price) * 100 : 0;
  const paybackYears = annualNet > 0 ? opts.price / annualNet : 0;
  return { gross, net, paybackYears, annualNet };
}
