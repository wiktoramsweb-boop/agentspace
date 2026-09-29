import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { Comparable, Subject } from "./model";

/**
 * Skąd bierzemy porównania.
 *
 * Trzy źródła, świadomie rozdzielone:
 *  1. własne transakcje biura (najcenniejsze, bo znamy cenę końcową),
 *  2. dane rynkowe z RCN, wspólne dla wszystkich biur (dane publiczne),
 *  3. aktualne oferty biura jako ceny ofertowe, z mniejszą wagą.
 *
 * WAŻNE: biuro widzi wyłącznie własne transakcje. Dane transakcyjne jednego
 * biura nie trafiają do wyceny drugiego - tak stanowi umowa powierzenia
 * i tak ma zostać. Wspólny jest tylko RCN, bo to dane publiczne.
 */

const MONTHS_BACK = 18;

function cutoffDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - MONTHS_BACK);
  return d.toISOString();
}

type PropRow = {
  id: string;
  title: string | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  property_type: string;
  area_m2: number | null;
  rooms: number | null;
  floor: number | null;
  floors_total: number | null;
  year_built: number | null;
  condition_std: string | null;
  market: string | null;
  price_pln: number | null;
  status: string;
  updated_at: string;
};

function toComparable(
  row: PropRow,
  source: Comparable["source"],
  price: number,
  transactedAt: string,
): Comparable | null {
  if (!row.area_m2 || row.area_m2 <= 0 || !price || price <= 0) return null;
  return {
    id: row.id,
    source,
    label: row.title ?? row.address ?? "Nieruchomość",
    address: row.address,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    propertyType: row.property_type,
    areaM2: row.area_m2,
    rooms: row.rooms,
    floor: row.floor,
    floorsTotal: row.floors_total,
    yearBuilt: row.year_built,
    condition: row.condition_std,
    market: row.market,
    pricePln: price,
    transactedAt,
  };
}

const PROP_COLUMNS =
  "id, title, address, city, lat, lng, property_type, area_m2, rooms, floor, floors_total, year_built, condition_std, market, price_pln, status, updated_at";

/** Transakcje zamknięte przez biuro: cena z karty transakcji, nie z oferty. */
async function ownDeals(agencyId: string, subject: Subject): Promise<Comparable[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("deals")
    .select(`transaction_value_pln, closed_at, properties!inner(${PROP_COLUMNS})`)
    .eq("agency_id", agencyId)
    .eq("status", "zamkniety")
    .not("property_id", "is", null)
    .not("transaction_value_pln", "is", null)
    .gte("closed_at", cutoffDate())
    .limit(400);

  const out: Comparable[] = [];
  for (const row of (data ?? []) as unknown as {
    transaction_value_pln: number | null;
    closed_at: string | null;
    properties: PropRow | PropRow[];
  }[]) {
    const prop = Array.isArray(row.properties) ? row.properties[0] : row.properties;
    if (!prop || prop.property_type !== subject.propertyType) continue;
    const c = toComparable(prop, "wlasna", row.transaction_value_pln ?? 0, row.closed_at ?? prop.updated_at);
    if (c) out.push(c);
  }
  return out;
}

/**
 * Oferty sfinalizowane bez karty transakcji oraz oferty aktywne.
 * Te pierwsze traktujemy jak transakcję, te drugie jak cenę ofertową.
 */
async function ownProperties(agencyId: string, subject: Subject): Promise<Comparable[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("properties")
    .select(PROP_COLUMNS)
    .eq("agency_id", agencyId)
    .eq("property_type", subject.propertyType)
    .in("status", ["sfinalizowana", "aktywna"])
    .not("price_pln", "is", null)
    .gte("updated_at", cutoffDate())
    .limit(400);

  const out: Comparable[] = [];
  for (const row of (data ?? []) as PropRow[]) {
    const source: Comparable["source"] = row.status === "sfinalizowana" ? "wlasna" : "oferta";
    const c = toComparable(row, source, row.price_pln ?? 0, row.updated_at);
    if (c) out.push(c);
  }
  return out;
}

type MarketRow = {
  id: string;
  address: string | null;
  city: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  property_type: string;
  area_m2: number;
  rooms: number | null;
  floor: number | null;
  floors_total: number | null;
  year_built: number | null;
  condition_std: string | null;
  market: string | null;
  price_pln: number;
  transacted_at: string;
};

/** Dane z Rejestru Cen Nieruchomości, wspólne dla wszystkich biur. */
async function marketTransactions(subject: Subject): Promise<Comparable[]> {
  const admin = createSupabaseAdmin();
  let q = admin
    .from("market_transactions")
    .select(
      "id, address, city, district, lat, lng, property_type, area_m2, rooms, floor, floors_total, year_built, condition_std, market, price_pln, transacted_at",
    )
    .eq("property_type", subject.propertyType)
    .gte("transacted_at", cutoffDate())
    .limit(600);

  if (subject.city) q = q.ilike("city", subject.city);

  const { data, error } = await q;
  // Brak tabeli oznacza nieuruchomioną migrację v28. Wycena ma wtedy nadal
  // działać na własnych danych biura, a nie wywalać się w całości.
  if (error) return [];

  return ((data ?? []) as MarketRow[]).map((row) => ({
    id: row.id,
    source: "rcn" as const,
    label: [row.district, row.address].filter(Boolean).join(", ") || row.city || "Transakcja",
    address: row.address,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    propertyType: row.property_type,
    areaM2: row.area_m2,
    rooms: row.rooms,
    floor: row.floor,
    floorsTotal: row.floors_total,
    yearBuilt: row.year_built,
    condition: row.condition_std,
    market: row.market,
    pricePln: row.price_pln,
    transactedAt: row.transacted_at,
  }));
}

/** Pełna pula porównań dla danego biura i danej nieruchomości. */
export async function comparablePool(agencyId: string, subject: Subject): Promise<Comparable[]> {
  const [deals, props, market] = await Promise.all([
    ownDeals(agencyId, subject),
    ownProperties(agencyId, subject),
    marketTransactions(subject),
  ]);

  // Ta sama nieruchomość mogła trafić i z karty transakcji, i z oferty.
  // Zostawiamy wersję z transakcji, bo zna cenę końcową.
  const byId = new Map<string, Comparable>();
  for (const c of [...props, ...deals, ...market]) {
    const existing = byId.get(c.id);
    if (!existing || (existing.source === "oferta" && c.source !== "oferta")) byId.set(c.id, c);
  }
  return [...byId.values()];
}
