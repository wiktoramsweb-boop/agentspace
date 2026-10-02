import { getDict, toLocale } from "@/lib/i18n";
import { kategorieZModulami } from "@/lib/marketing/modules";
import { NavClient } from "./nav-client";

/**
 * Nawigacja marketingu. Teksty i adresy bierze ze słownika, żeby strony
 * podawały tylko język, a nie cały komplet napisów.
 *
 * Listę modułów do rozwijanego menu składamy tutaj, bo katalog modułów jest
 * po stronie serwera i nie ma powodu wysyłać go w całości do przeglądarki -
 * menu potrzebuje tylko nazwy, adresu i jednego zdania.
 */
export function SiteNav({ lang = "pl" }: { lang?: string }) {
  const locale = toLocale(lang);
  const menu = kategorieZModulami(locale).map((k) => ({
    id: k.id,
    label: k.label,
    moduly: k.moduly.map((m) => ({ slug: m.slug, name: m.name })),
  }));
  return <NavClient lang={locale} t={getDict(locale).nav} menuProduktu={menu} />;
}
