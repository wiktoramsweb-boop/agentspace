import { createSupabaseAdmin } from "./supabase/admin";
import { publicAssetUrl } from "./storage";
import {
  MARK_POSITIONS,
  PHOTO_SIZES,
  DEFAULT_WATERMARK,
  DEFAULT_STAMP,
  prefixFromName,
  type MarkPosition,
  type PhotoSize,
  type CompanyData,
  type WatermarkConfig,
  type StampConfig,
  type AgencyOptions,
  type AgencySettings,
  type PhotoConfig,
} from "./agency-settings-shared";

export {
  MARK_POSITIONS,
  PHOTO_SIZES,
  DEFAULT_WATERMARK,
  DEFAULT_STAMP,
  prefixFromName,
};
export type {
  MarkPosition,
  PhotoSize,
  CompanyData,
  WatermarkConfig,
  StampConfig,
  AgencyOptions,
  AgencySettings,
  PhotoConfig,
};

/**
 * Ustawienia biura: dane firmy, logo, znak wodny, stempel i opcje.
 *
 * Wszystko ma wartości domyślne, więc aplikacja działa także przed
 * uruchomieniem migracji v22 - wtedy tylko zapis ustawień zwraca komunikat.
 */

function defaultOptions(agencyName: string | null | undefined): AgencyOptions {
  return {
    photo_max: "1600x1200",
    hide_contacts: false,
    report_default: false,
    auto_numbering: true,
    offer_prefix: prefixFromName(agencyName),
    match_price_minus: 10,
    match_price_plus: 10,
    match_area_minus: 10,
    match_area_plus: 10,
  };
}

function num(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function position(v: unknown, fallback: MarkPosition): MarkPosition {
  return MARK_POSITIONS.some((p) => p.value === v) ? (v as MarkPosition) : fallback;
}

export async function getAgencySettings(
  agencyId: string | null,
  agencyName?: string | null,
): Promise<AgencySettings> {
  const base: AgencySettings = {
    ready: false,
    company: { name: agencyName ?? undefined, country: "Polska" },
    logo_path: null,
    logoUrl: null,
    watermark: { ...DEFAULT_WATERMARK },
    watermarkUrl: null,
    stamp: { ...DEFAULT_STAMP },
    stampUrl: null,
    options: defaultOptions(agencyName),
  };
  if (!agencyId) return base;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("agency_settings")
    .select("*")
    .eq("agency_id", agencyId)
    .maybeSingle();

  if (error) return base; // brak tabeli = migracja v22 nieuruchomiona
  if (!data) return { ...base, ready: true };

  const wm = (data.watermark ?? {}) as Partial<WatermarkConfig>;
  const st = (data.stamp ?? {}) as Partial<StampConfig>;
  const op = (data.options ?? {}) as Partial<AgencyOptions>;
  const defaults = defaultOptions(agencyName);

  const watermark: WatermarkConfig = {
    path: wm.path ?? null,
    opacity: num(wm.opacity, DEFAULT_WATERMARK.opacity, 0.05, 1),
    scale: num(wm.scale, DEFAULT_WATERMARK.scale, 0.05, 0.9),
    position: position(wm.position, DEFAULT_WATERMARK.position),
    enabled: wm.enabled ?? true,
  };
  const stamp: StampConfig = {
    path: st.path ?? null,
    scale: num(st.scale, DEFAULT_STAMP.scale, 0.05, 0.6),
    position: position(st.position, DEFAULT_STAMP.position),
  };

  return {
    ready: true,
    company: { ...base.company, ...(data.company ?? {}) },
    logo_path: data.logo_path ?? null,
    logoUrl: data.logo_path ? publicAssetUrl("agency-assets", data.logo_path) : null,
    watermark,
    watermarkUrl: watermark.path ? publicAssetUrl("agency-assets", watermark.path) : null,
    stamp,
    stampUrl: stamp.path ? publicAssetUrl("agency-assets", stamp.path) : null,
    options: {
      photo_max: PHOTO_SIZES.some((s) => s.value === op.photo_max)
        ? (op.photo_max as PhotoSize)
        : defaults.photo_max,
      hide_contacts: op.hide_contacts ?? defaults.hide_contacts,
      report_default: op.report_default ?? defaults.report_default,
      auto_numbering: op.auto_numbering ?? defaults.auto_numbering,
      offer_prefix: (op.offer_prefix ?? "").trim() || defaults.offer_prefix,
      match_price_minus: num(op.match_price_minus, 10, 0, 100),
      match_price_plus: num(op.match_price_plus, 10, 0, 100),
      match_area_minus: num(op.match_area_minus, 10, 0, 100),
      match_area_plus: num(op.match_area_plus, 10, 0, 100),
    },
  };
}

/** Konfiguracja dla przeglądarki: rozmiar, znak wodny i stempel. */
export function photoConfigFrom(s: AgencySettings): PhotoConfig {
  const [w, h] = s.options.photo_max.split("x").map(Number);
  return {
    maxWidth: w || 1600,
    maxHeight: h || 1200,
    watermark:
      s.watermark.enabled && s.watermarkUrl
        ? {
            url: s.watermarkUrl,
            opacity: s.watermark.opacity,
            scale: s.watermark.scale,
            position: s.watermark.position,
          }
        : null,
    stamp: s.stampUrl ? { url: s.stampUrl, scale: s.stamp.scale, position: s.stamp.position } : null,
  };
}

/** Tolerancje kojarzenia jako ułamki, w formacie oczekiwanym przez lib/matching. */
export function matchTolerance(s: AgencySettings) {
  return {
    priceMinus: s.options.match_price_minus / 100,
    pricePlus: s.options.match_price_plus / 100,
    areaMinus: s.options.match_area_minus / 100,
    areaPlus: s.options.match_area_plus / 100,
  };
}

/**
 * Zapis części ustawień (upsert po agency_id). Zwraca komunikat błędu albo null.
 */
export async function saveAgencySettings(
  agencyId: string,
  patch: Partial<{
    company: CompanyData;
    logo_path: string | null;
    watermark: WatermarkConfig;
    stamp: StampConfig;
    options: AgencyOptions;
  }>,
): Promise<string | null> {
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("agency_settings")
    .upsert(
      { agency_id: agencyId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "agency_id" },
    );
  if (!error) return null;
  if (/agency_settings/.test(error.message) || error.code === "42P01" || error.code === "PGRST205") {
    return "Brak tabeli ustawień. Uruchom w Supabase plik lib/SETUP-v22-ustawienia-firmy.sql.";
  }
  return `Nie udało się zapisać: ${error.message}`;
}
