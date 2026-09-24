/**
 * Dwa języki strony marketingowej: polski i angielski.
 *
 * Polski jest domyślny i zostaje na gołych adresach (`/cennik`), żeby nie
 * psuć istniejących linków i pozycji w Google. Angielski siedzi pod `/en`
 * i ma własne, angielskie adresy (`/en/pricing`). Pliki stron leżą raz,
 * pod polskimi nazwami - middleware tłumaczy adres na ścieżkę pliku.
 */

export const LOCALES = ["pl", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pl";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Sekcje przetłumaczone razem z podstronami: `/produkt/crm` ma swój
 * odpowiednik pod `/en/product/crm`.
 */
export const SEGMENTS: Record<string, string> = {
  cennik: "pricing",
  "o-nas": "about",
  kontakt: "contact",
  demo: "demo",
  "dla-agentow": "for-agents",
  "dla-wlascicieli": "for-owners",
  integracje: "integrations",
  produkt: "product",
  oferta: "offer",
  blog: "blog",
  "polityka-prywatnosci": "privacy",
  regulamin: "terms",
};

/**
 * Sekcje przetłumaczone tylko na pierwszym poziomie.
 *
 * `/wzory` to galeria i ma wersję angielską, ale same wzory stron pod
 * `/wzory/kamienica` są demami polskich biur, z polskimi ofertami, i
 * zostają po polsku. Dlatego ich adresy nie dostają przedrostka `/en`.
 */
export const EXACT_SEGMENTS: Record<string, string> = {
  wzory: "website-templates",
};

const SEGMENTS_REVERSED: Record<string, string> = Object.fromEntries(
  Object.entries(SEGMENTS).map(([pl, en]) => [en, pl]),
);

const EXACT_REVERSED: Record<string, string> = Object.fromEntries(
  Object.entries(EXACT_SEGMENTS).map(([pl, en]) => [en, pl]),
);

export const MARKETING_SEGMENTS = Object.keys(SEGMENTS);
export const MARKETING_EXACT = Object.keys(EXACT_SEGMENTS);

function split(path: string): string[] {
  return path.split("/").filter(Boolean);
}

/**
 * Adres tej samej strony w danym języku. Na wejściu zawsze polska ścieżka.
 *
 * Ścieżka, która nie ma angielskiej wersji, wraca bez zmian - bez tego
 * nawigacja robiłaby linki w stylu `/en/wzory`, pod którymi nic nie ma.
 */
export function localeHref(lang: Locale, plPath: string): string {
  const [pathOnly, hash] = plPath.split("#");
  const suffix = hash ? `#${hash}` : "";
  const parts = split(pathOnly);

  if (lang === "pl") return `${pathOnly === "" ? "/" : pathOnly}${suffix}`;
  if (parts.length === 0) return `/en${suffix}`;

  if (parts.length === 1 && EXACT_SEGMENTS[parts[0]]) {
    return `/en/${EXACT_SEGMENTS[parts[0]]}${suffix}`;
  }

  if (SEGMENTS[parts[0]]) {
    const rest = [SEGMENTS[parts[0]], ...parts.slice(1)];
    return `/en/${rest.join("/")}${suffix}`;
  }

  // Brak angielskiej wersji: zostawiamy polski adres, zamiast prowadzić w 404.
  return `${pathOnly}${suffix}`;
}

/** Angielski adres z paska -> polska ścieżka pliku strony. */
export function toPolishPath(enPath: string): string {
  const parts = split(enPath);
  if (parts.length === 0) return "/";

  if (parts.length === 1 && EXACT_REVERSED[parts[0]]) return `/${EXACT_REVERSED[parts[0]]}`;
  if (SEGMENTS_REVERSED[parts[0]]) return `/${[SEGMENTS_REVERSED[parts[0]], ...parts.slice(1)].join("/")}`;

  return `/${parts.join("/")}`;
}

/** Ta sama strona w drugim języku - dla przełącznika w nawigacji. */
export function switchLocaleHref(current: string, to: Locale): string {
  const plPath = current.startsWith("/en/")
    ? toPolishPath(current.slice(3))
    : current === "/en"
      ? "/"
      : current;

  return localeHref(to, plPath);
}
