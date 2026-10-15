/**
 * Adres oferty z miastem, bez powtórzeń.
 *
 * W bazie adres często ma już miasto w środku („Mazowiecka 34, Kraków”),
 * a miasto jest też w osobnej kolumnie. Zwykłe sklejenie dawało
 * „Mazowiecka 34, Kraków, Kraków” na listach i w powiadomieniach.
 */
export function adresZMiastem(adres: string | null | undefined, miasto: string | null | undefined): string {
  const a = (adres ?? "").trim();
  const m = (miasto ?? "").trim();
  if (!m) return a;
  if (!a) return m;
  return a.toLowerCase().includes(m.toLowerCase()) ? a : `${a}, ${m}`;
}
