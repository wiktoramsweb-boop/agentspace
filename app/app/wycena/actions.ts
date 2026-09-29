"use server";

import { requireUser } from "@/lib/auth";
import { comparablePool } from "@/lib/wycena/data";
import { estimate, type Estimate, type Subject } from "@/lib/wycena/model";
import { geocodePl } from "@/lib/geocode";
import { getPriceAnchor } from "@/lib/wycena/poziomy";

/**
 * Analiza porównawcza cen dla podanych parametrów nieruchomości.
 *
 * Pula porównań jest zawsze zawężona do biura zalogowanego użytkownika
 * (plus wspólne dane publiczne z RCN). Nie przyjmujemy agency_id z formularza,
 * bo to pozwoliłoby podejrzeć transakcje cudzego biura.
 */
const EMPTY: Omit<Estimate, "reason"> = {
  ok: false,
  method: "brak",
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

  const address = str("address");
  let city = str("city");
  let lat = num("lat");
  let lng = num("lng");

  // Agent mógł wpisać adres z ręki i nie kliknąć podpowiedzi. Wtedy nie mamy
  // ani współrzędnych, ani miasta, a bez nich nie ma czego porównywać.
  // Dopytujemy geokoder po stronie serwera, zamiast zwracać pusty wynik.
  if ((lat == null || lng == null) && address) {
    const [hit] = await geocodePl(address, 1);
    if (hit) {
      lat = hit.lat;
      lng = hit.lng;
      city = city ?? hit.city;
    }
  }

  const subject: Subject = {
    propertyType: str("property_type") ?? "mieszkanie",
    city,
    lat,
    lng,
    areaM2,
    rooms: num("rooms"),
    floor: num("floor"),
    floorsTotal: num("floors_total"),
    yearBuilt: num("year_built"),
    condition: str("condition_std"),
    market: str("market"),
  };

  if (!city && lat == null) {
    return {
      ...EMPTY,
      reason: "Podaj adres albo miasto. Bez lokalizacji nie ma czego porównywać.",
    };
  }

  const [pool, anchor] = await Promise.all([
    comparablePool(user.agency_id, subject),
    getPriceAnchor(subject.city, subject.propertyType, subject.market),
  ]);
  const result = estimate(subject, pool, { anchor });

  // Promień i okno czasu ustala model (dobiera je stopniowo), my dokładamy
  // tylko adres, bo tego model nie zna.
  return { ...result, usedAddress: address ?? city };
}
