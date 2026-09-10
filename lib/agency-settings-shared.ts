/**
 * Typy i stałe ustawień biura, bezpieczne do użycia w przeglądarce.
 * Odczyt i zapis w bazie jest w lib/agency-settings.ts (tylko serwer).
 */

export type MarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export const MARK_POSITIONS: { value: MarkPosition; label: string }[] = [
  { value: "center", label: "Środek" },
  { value: "top-left", label: "Lewy górny róg" },
  { value: "top-right", label: "Prawy górny róg" },
  { value: "bottom-left", label: "Lewy dolny róg" },
  { value: "bottom-right", label: "Prawy dolny róg" },
];

export const PHOTO_SIZES = [
  { value: "1280x960", label: "1280 × 960 (lżejsze pliki)" },
  { value: "1600x1200", label: "1600 × 1200 (zalecane, jak w portalach)" },
  { value: "1920x1440", label: "1920 × 1440" },
  { value: "2560x1920", label: "2560 × 1920 (najwyższa jakość)" },
] as const;

export type PhotoSize = (typeof PHOTO_SIZES)[number]["value"];

export type CompanyData = {
  name?: string;
  street?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  voivodeship?: string;
  phone?: string;
  email?: string;
  nip?: string;
  www?: string;
  corr_name?: string;
  corr_street?: string;
  corr_postal_code?: string;
  corr_city?: string;
};

export type WatermarkConfig = {
  path: string | null;
  /** Krycie 0-1. Domyślnie delikatnie, żeby nie zasłaniać wnętrza. */
  opacity: number;
  /** Szerokość znaku jako ułamek szerokości zdjęcia. */
  scale: number;
  position: MarkPosition;
  enabled: boolean;
};

export type StampConfig = {
  path: string | null;
  scale: number;
  position: MarkPosition;
};

export type AgencyOptions = {
  photo_max: PhotoSize;
  /** Agent nie widzi telefonów i e-maili cudzych klientów na listach. */
  hide_contacts: boolean;
  /** Nowe działanie ma domyślnie zaznaczone „Uwzględnij w raporcie aktywności". */
  report_default: boolean;
  auto_numbering: boolean;
  /** Prefiks numeru oferty: SP → SP/2026/001. */
  offer_prefix: string;
  /** Zakres „prawie pasuje" w kojarzeniu ofert z poszukiwaniami (w %). */
  match_price_minus: number;
  match_price_plus: number;
  match_area_minus: number;
  match_area_plus: number;
};

export type AgencySettings = {
  /** false = brak tabeli (nieuruchomiona migracja v22). */
  ready: boolean;
  company: CompanyData;
  logo_path: string | null;
  logoUrl: string | null;
  watermark: WatermarkConfig;
  watermarkUrl: string | null;
  stamp: StampConfig;
  stampUrl: string | null;
  options: AgencyOptions;
};

/** Konfiguracja potrzebna przeglądarce do obróbki zdjęć przy wgrywaniu. */
export type PhotoConfig = {
  maxWidth: number;
  maxHeight: number;
  watermark: { url: string; opacity: number; scale: number; position: MarkPosition } | null;
  stamp: { url: string; scale: number; position: MarkPosition } | null;
};

export const DEFAULT_WATERMARK: WatermarkConfig = {
  path: null,
  opacity: 0.3,
  scale: 0.3,
  position: "center",
  enabled: true,
};

export const DEFAULT_STAMP: StampConfig = {
  path: null,
  scale: 0.22,
  position: "top-left",
};

/**
 * Prefiks numeru oferty z nazwy biura: „Spectra Nieruchomości" → „SP".
 * Pomijamy słowa, które ma każde biuro, bo inaczej wszyscy byliby „AN".
 */
export function prefixFromName(name: string | null | undefined): string {
  const skip = /^(agencja|biuro|nieruchomo[sś]ci|nieruchomo[sś]ciami|s\.?c\.?|sp\.?|z|o\.?o\.?|sp[oó][lł]ka)$/i;
  const word = (name ?? "")
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}]/gu, ""))
    .find((w) => w && !skip.test(w));
  const letters = (word ?? "OF").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/gi, "L");
  return letters.slice(0, 2).toUpperCase() || "OF";
}

