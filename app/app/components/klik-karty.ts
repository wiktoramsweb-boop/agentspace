import type { MouseEvent } from "react";

/**
 * Kliknięcie w kartę na liście otwiera jej szczegóły, tak jak w ASARI. Przyciski,
 * linki i pola w karcie działają po swojemu, a zaznaczenie tekstu (kopiowanie
 * numeru) nie przenosi na inną stronę.
 */
export function klikKarty(e: MouseEvent, href: string, idz: (href: string) => void) {
  const cel = e.target as HTMLElement;
  if (cel.closest("a, button, input, select, textarea, label, [role=checkbox], [data-bez-klikniecia]")) return;
  if (window.getSelection()?.toString()) return;
  if (e.metaKey || e.ctrlKey) {
    window.open(href, "_blank");
    return;
  }
  idz(href);
}
