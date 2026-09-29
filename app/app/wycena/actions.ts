"use server";

import { requireUser } from "@/lib/auth";
import { comparablePool } from "@/lib/wycena/data";
import { estimate, type Estimate, type Subject } from "@/lib/wycena/model";

/**
 * Analiza porównawcza cen dla podanych parametrów nieruchomości.
 *
 * Pula porównań jest zawsze zawężona do biura zalogowanego użytkownika
 * (plus wspólne dane publiczne z RCN). Nie przyjmujemy agency_id z formularza,
 * bo to pozwoliłoby podejrzeć transakcje cudzego biura.
 */
const EMPTY: Omit<Estimate, "reason"> = {
  ok: false,
  pricePerM2: 0,
  low: 0,
  mid: 0,
  high: 0,
  confidence: "niska",
  comparables: [],
  usedCount: 0,
  droppedCount: 0,
  spreadPct: 0,
};

export async function runValuation(formData: FormData): Promise<Estimate> {
  const user = await requireUser();
  if (!user.agency_id) {
    return { ...EMPTY, reason: "Twoje konto nie jest przypisane do biura." };
  }

  const num = (key: string): number | null => {
    const raw = String(formData.get(key) ?? "").replace(",", ".").trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  const str = (key: string): string | null => {
    const v = String(formData.get(key) ?? "").trim();
    return v || null;
  };

  const areaM2 = num("area_m2");
  if (!areaM2 || areaM2 <= 0) {
    return { ...EMPTY, reason: "Podaj powierzchnię w metrach kwadratowych." };
  }

  const subject: Subject = {
    propertyType: str("property_type") ?? "mieszkanie",
    city: str("city"),
    lat: num("lat"),
    lng: num("lng"),
    areaM2,
    rooms: num("rooms"),
    floor: num("floor"),
    floorsTotal: num("floors_total"),
    yearBuilt: num("year_built"),
    condition: str("condition_std"),
    market: str("market"),
  };

  const pool = await comparablePool(user.agency_id, subject);
  return estimate(subject, pool);
}
