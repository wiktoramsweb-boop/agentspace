import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Poziomy cen rynkowych, czyli średnia cena transakcyjna za metr w mieście.
 *
 * To nie jest zamiennik RCN z adresami. Średnia dla Krakowa nie odróżni
 * Starego Miasta od Nowej Huty i nigdy nie odróżni. Ale jest oparta na
 * prawdziwych transakcjach i pochodzi z publicznego źródła, więc daje
 * uczciwy rząd wielkości wszędzie tam, gdzie nie mamy danych z okolicy.
 *
 * Alternatywą było liczenie z kilkunastu własnych ofert biura, co przy
 * wycenie mieszkania na Starym Mieście dawało cenę z Nowej Huty.
 */

export type PriceAnchor = {
  pricePerM2: number;
  city: string;
  period: string;
  source: string;
  market: string | null;
  sampleSize: number | null;
};

/** Normalizacja nazwy miasta: „Kraków", „m. Kraków", „Powiat m. Kraków". */
export function normalizeCity(city: string): string {
  return city
    .replace(/^powiat\s+/i, "")
    .replace(/^m(iasto)?\.?\s+/i, "")
    .replace(/\s+na prawach powiatu$/i, "")
    .trim();
}

/**
 * Najświeższy poziom cen dla miasta. Preferujemy dopasowanie rynku
 * (wtórny/pierwotny), ale gdy źródło go nie rozróżnia, bierzemy co jest.
 */
export async function getPriceAnchor(
  city: string | null,
  propertyType: string,
  market: string | null,
): Promise<PriceAnchor | null> {
  if (!city) return null;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("market_price_levels")
    .select("city, period, price_per_m2, source, market, sample_size")
    .ilike("city", normalizeCity(city))
    .eq("property_type", propertyType)
    .order("period_end", { ascending: false })
    .limit(8);

  // Brak tabeli oznacza nieuruchomioną migrację v29. Wycena ma wtedy nadal
  // działać na porównaniach, a nie wywalać się w całości.
  if (error || !data || data.length === 0) return null;

  type Row = {
    city: string;
    period: string;
    price_per_m2: number;
    source: string;
    market: string | null;
    sample_size: number | null;
  };
  const rows = data as Row[];
  const exact = market ? rows.find((r) => r.market === market) : undefined;
  const row = exact ?? rows.find((r) => r.market == null) ?? rows[0];

  return {
    pricePerM2: Number(row.price_per_m2),
    city: row.city,
    period: row.period,
    source: row.source,
    market: row.market,
    sampleSize: row.sample_size,
  };
}
