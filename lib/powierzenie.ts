/**
 * Umowa powierzenia przetwarzania danych.
 *
 * Biuro trzyma u nas dane osobowe swoich klientów, więc to ono jest
 * administratorem, a my podmiotem przetwarzającym. Art. 28 RODO wymaga umowy,
 * a my potrzebujemy dowodu, że konkretne biuro ją przyjęło.
 *
 * PODNIEŚ WERSJĘ przy każdej zmianie treści umowy na stronie. Biura, które
 * przyjęły starszą, zobaczą prośbę o ponowną akceptację. To jest cały
 * mechanizm i dlatego wersja jest datą, a nie numerem: od razu widać,
 * czego dotyczy.
 */
export const WERSJA_POWIERZENIA = "2026-10-23";

export type StanPowierzenia = {
  zaakceptowana: boolean;
  /** Czy biuro przyjęło starszą wersję i trzeba poprosić ponownie. */
  nieaktualna: boolean;
};

export function stanPowierzenia(
  agencja: { dpa_accepted_at?: string | null; dpa_version?: string | null } | null | undefined,
): StanPowierzenia {
  if (!agencja?.dpa_accepted_at) return { zaakceptowana: false, nieaktualna: false };
  const aktualna = agencja.dpa_version === WERSJA_POWIERZENIA;
  return { zaakceptowana: aktualna, nieaktualna: !aktualna };
}
