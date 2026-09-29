import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Import średnich cen transakcyjnych z Banku Danych Lokalnych GUS.
 *
 * GUS publikuje rzeczywiste ceny lokali mieszkalnych sprzedanych w ramach
 * transakcji rynkowych, w podziale na powiaty (miasta na prawach powiatu,
 * czyli Kraków, Warszawa i reszta, są osobnymi jednostkami). To nie zastąpi
 * RCN z adresami, ale daje uczciwy punkt odniesienia dla każdego miasta.
 *
 * Nazwy zmiennych w BDL potrafią się zmieniać, dlatego nie zaszywamy
 * identyfikatorów, tylko szukamy po nazwie i raportujemy, co znaleźliśmy.
 *
 * Limit bez klucza to 100 zapytań na 15 minut. Darmowy klucz z
 * bdl.stat.gov.pl/api/home podnosi limit; wystarczy wpisać go do
 * zmiennej BDL_API_KEY.
 */

const API = "https://bdl.stat.gov.pl/api/v1";
/** Dział „RYNEK NIERUCHOMOŚCI" i jego grupy. */
const SUBJECTS = ["G597", "G596"];
/** Poziom 5 w BDL to powiaty, razem z miastami na prawach powiatu. */
const UNIT_LEVEL = 5;

export type GusImportResult = {
  ok: boolean;
  message: string;
  variablesFound: { id: number; name: string }[];
  imported: number;
  cities: number;
  errors: string[];
};

function headers(): HeadersInit {
  const key = process.env.BDL_API_KEY;
  return key ? { Accept: "application/json", "X-ClientId": key } : { Accept: "application/json" };
}

async function api<T>(path: string): Promise<T | { errorResult: string }> {
  const res = await fetch(`${API}${path}`, { headers: headers(), next: { revalidate: 86400 } });
  if (!res.ok) return { errorResult: `HTTP ${res.status}` };
  return (await res.json()) as T;
}

type VariableRow = { id: number; n1?: string; n2?: string; n3?: string; n4?: string; measureUnitName?: string };
type VariablesResponse = { results?: VariableRow[]; totalRecords?: number };
type DataRow = { id: string; name: string; values?: { year: string; val: number | null }[] };
type DataResponse = { results?: DataRow[] };

function variableName(v: VariableRow): string {
  return [v.n1, v.n2, v.n3, v.n4].filter(Boolean).join(" / ");
}

/** Szukamy zmiennej opisującej cenę za metr kwadratowy lokalu. */
function looksLikePricePerM2(v: VariableRow): boolean {
  const name = variableName(v).toLowerCase();
  const unit = (v.measureUnitName ?? "").toLowerCase();
  const isPrice = name.includes("cena") || name.includes("wartość") || unit.includes("zł");
  const isPerM2 = /m2|m²/.test(name) || /m2|m²/.test(unit);
  return isPrice && isPerM2;
}

/** Rynek, którego dotyczy zmienna, o ile GUS go rozróżnia. */
function marketOf(v: VariableRow): string | null {
  const name = variableName(v).toLowerCase();
  if (name.includes("pierwotn")) return "pierwotny";
  if (name.includes("wtórn") || name.includes("wtorn")) return "wtorny";
  return null;
}

/** „Powiat m. Kraków" -> „Kraków". Nazwy jednostek w BDL bywają rozwlekłe. */
function cityFromUnit(name: string): string {
  return name
    .replace(/^powiat\s+/i, "")
    .replace(/^m(iasto)?\.?\s+/i, "")
    .replace(/\s+na prawach powiatu$/i, "")
    .trim();
}

export async function importGusPriceLevels(years: number[]): Promise<GusImportResult> {
  const errors: string[] = [];
  const variables: VariableRow[] = [];

  for (const subject of SUBJECTS) {
    const res = await api<VariablesResponse>(`/variables?subject-id=${subject}&page-size=100&format=json`);
    if ("errorResult" in res) {
      errors.push(`Zmienne ${subject}: ${res.errorResult}`);
      continue;
    }
    variables.push(...(res.results ?? []));
  }

  const priceVars = variables.filter(looksLikePricePerM2);
  const found = priceVars.map((v) => ({ id: v.id, name: variableName(v) }));

  if (priceVars.length === 0) {
    return {
      ok: false,
      message:
        variables.length === 0
          ? "GUS nie zwrócił żadnych zmiennych. Najczęściej to limit zapytań (100 na 15 minut) albo chwilowa niedostępność API."
          : `Znaleziono ${variables.length} zmiennych, ale żadna nie wygląda na cenę za metr. Nazwy w BDL mogły się zmienić.`,
      variablesFound: variables.slice(0, 10).map((v) => ({ id: v.id, name: variableName(v) })),
      imported: 0,
      cities: 0,
      errors,
    };
  }

  const yearParams = years.map((y) => `year=${y}`).join("&");
  const payload: Record<string, unknown>[] = [];

  for (const v of priceVars) {
    const res = await api<DataResponse>(
      `/data/by-variable/${v.id}?format=json&unit-level=${UNIT_LEVEL}&page-size=400&${yearParams}`,
    );
    if ("errorResult" in res) {
      errors.push(`Dane zmiennej ${v.id}: ${res.errorResult}`);
      continue;
    }

    const market = marketOf(v);
    for (const unit of res.results ?? []) {
      for (const point of unit.values ?? []) {
        if (point.val == null || point.val <= 0) continue;
        const city = cityFromUnit(unit.name);
        if (!city) continue;

        payload.push({
          source: "gus",
          source_ref: `${v.id}:${unit.id}:${point.year}`,
          city,
          teryt: unit.id,
          property_type: "mieszkanie",
          market,
          period: String(point.year),
          period_end: `${point.year}-12-31`,
          price_per_m2: point.val,
          raw: { variable: variableName(v), unit: unit.name },
        });
      }
    }
  }

  if (payload.length === 0) {
    return {
      ok: false,
      message: "Znaleziono zmienne cenowe, ale GUS nie zwrócił dla nich wartości w wybranych latach.",
      variablesFound: found,
      imported: 0,
      cities: 0,
      errors,
    };
  }

  const admin = createSupabaseAdmin();
  let imported = 0;
  for (let i = 0; i < payload.length; i += 500) {
    const chunk = payload.slice(i, i + 500);
    const { error } = await admin
      .from("market_price_levels")
      .upsert(chunk, { onConflict: "source,city,property_type,market,period", ignoreDuplicates: false });
    if (error) errors.push(`Zapis porcji ${Math.floor(i / 500) + 1}: ${error.message}`);
    else imported += chunk.length;
  }

  const cities = new Set(payload.map((p) => p.city as string)).size;

  return {
    ok: imported > 0,
    message:
      imported > 0
        ? `Zaimportowano ${imported} wartości dla ${cities} miast i powiatów.`
        : "Nie udało się zapisać żadnej wartości.",
    variablesFound: found,
    imported,
    cities,
    errors,
  };
}
