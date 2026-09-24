import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { pl, type Dict } from "./pl";
import { en } from "./en";

export type { Dict };
export * from "./config";

const DICTS: Record<Locale, Dict> = { pl, en };

/** Teksty dla danego języka. Nieznany kod cofa się do polskiego. */
export function getDict(lang: string): Dict {
  return isLocale(lang) ? DICTS[lang] : DICTS[DEFAULT_LOCALE];
}

/** Język z parametru trasy - z zabezpieczeniem przed byle czym w URL-u. */
export function toLocale(lang: string): Locale {
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}
