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

/** Polski segment adresu -> angielski odpowiednik. */
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

/** Angielski segment -> polski (do przepisania adresu w middleware). */
export const SEGMENTS_REVERSED: Record<string, string> = Object.fromEntries(
  Object.entries(SEGMENTS).map(([pl, en]) => [en, pl]),
);

/** Pierwsze segmenty, które należą do strony marketingowej. */
export const MARKETING_SEGMENTS = Object.keys(SEGMENTS);

/**
 * Adres tej samej strony w danym języku.
 * Na wejściu zawsze polska ścieżka, np. `/cennik` albo `/produkt/crm`.
 */
export function localeHref(lang: Locale, plPath: string): string {
  const [pathOnly, hash] = plPath.split("#");
  const clean = pathOnly === "/" ? "" : pathOnly;

  if (lang === "pl") return `${clean || "/"}${hash ? `#${hash}` : ""}`;

  const parts = clean.split("/").filter(Boolean);
  if (parts.length > 0 && SEGMENTS[parts[0]]) parts[0] = SEGMENTS[parts[0]];

  const path = parts.length ? `/en/${parts.join("/")}` : "/en";
  return `${path}${hash ? `#${hash}` : ""}`;
}

/** Ta sama strona w drugim języku - dla przełącznika w nawigacji. */
export function switchLocaleHref(current: string, to: Locale): string {
  const withoutEn = current.startsWith("/en/")
    ? current.slice(3)
    : current === "/en"
      ? "/"
      : current;

  const parts = withoutEn.split("/").filter(Boolean);
  if (parts.length > 0 && SEGMENTS_REVERSED[parts[0]]) {
    parts[0] = SEGMENTS_REVERSED[parts[0]];
  }

  return localeHref(to, parts.length ? `/${parts.join("/")}` : "/");
}
