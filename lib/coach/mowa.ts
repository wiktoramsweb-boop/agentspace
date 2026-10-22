// Czyszczenie tekstu z rozmowy głosowej. Bez importów: czyta to przeglądarka
// (napisy na żywo), serwer (zapis) i test.

/**
 * Tryb ekspresyjny u dostawcy steruje barwą głosu wstawkami w nawiasach
 * kwadratowych („[warm] Halo?”). W uchu ich nie ma, więc w tekście też nie.
 * Napisy przychodzą kawałkami, stąd też ucięty nawias na końcu („[sur”).
 * Zdarza się też, że model powtórzy fragment instrukcji dostawcy po angielsku
 * („No numbers/symbols (”). Tego klient nigdy nie mówi, więc wycinamy.
 */
export function bezZnacznikowMowy(tekst: string): string {
  return tekst
    .replace(/\[[\p{L} '-]{1,40}\]/gu, " ")
    .replace(/\[[\p{L} '-]{0,40}$/u, " ")
    .replace(/\b(no numbers?|numbers?\s*\/\s*symbols?|audio tags?|use tags?)\b[^.!?]*[.!?(]?/gi, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Rozpoznawanie mowy oddaje szum na linii jako „...”. To nie jest wypowiedź. */
export function toSzum(tekst: string): boolean {
  return !/[\p{L}\p{N}]/u.test(tekst);
}
