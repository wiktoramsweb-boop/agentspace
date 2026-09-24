import { getDict, toLocale } from "@/lib/i18n";
import { NavClient } from "./nav-client";

/**
 * Nawigacja marketingu. Teksty i adresy bierze ze słownika, żeby strony
 * podawały tylko język, a nie cały komplet napisów.
 */
export function SiteNav({ lang = "pl" }: { lang?: string }) {
  const locale = toLocale(lang);
  return <NavClient lang={locale} t={getDict(locale).nav} />;
}
