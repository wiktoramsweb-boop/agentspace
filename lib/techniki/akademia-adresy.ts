// Adresy lekcji Akademii dla komponentów w przeglądarce. Osobny plik, bo
// akademia.ts zawiera pytania z poprawnymi odpowiedziami: zaimportowany
// w komponencie klienckim trafiłby w całości do kodu strony.

export function adresLekcji(l: { id: string; rodzaj: "technika" | "skrypt" | "struktura" | "obiekcje"; slug: string }): string {
  const z = `akademia=${l.id}`;
  if (l.rodzaj === "technika") return `/app/techniki/${l.slug}?${z}`;
  if (l.rodzaj === "skrypt") return `/app/techniki/skrypty/${l.slug}?${z}`;
  if (l.rodzaj === "obiekcje") return `/app/techniki?widok=obiekcje&${z}`;
  return `/app/techniki?widok=struktura&${z}`;
}
