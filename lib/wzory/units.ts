/**
 * Mieszkania w przykładowej inwestycji (wzór „Horyzont").
 *
 * Generujemy je z jednego ziarna, żeby lista była powtarzalna przy każdym
 * renderze: inaczej ceny skakałyby po każdym odświeżeniu strony.
 */

export type Unit = {
  id: string;
  floor: number;
  rooms: number;
  area: number;
  price: number;
  status: "wolne" | "rezerwacja" | "sprzedane";
  aspect: string;
  extra: string;
};

const ASPECTS = ["południe", "południowy zachód", "wschód", "zachód", "północny wschód"];
const EXTRAS = ["balkon 6 m²", "balkon 9 m²", "taras 18 m²", "ogródek 42 m²", "dwa balkony"];

/** Prosty generator pseudolosowy, żeby wynik był zawsze taki sam. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function buildUnits(): Unit[] {
  const rnd = seeded(20260322);
  const out: Unit[] = [];

  for (let floor = 0; floor <= 7; floor++) {
    const perFloor = floor === 7 ? 3 : 6;
    for (let i = 0; i < perFloor; i++) {
      const rooms = floor === 7 ? 4 : 1 + Math.floor(rnd() * 4);
      const area = Math.round((22 + rooms * 15 + rnd() * 10) * 10) / 10;
      const base = 15200 + floor * 180 + (rooms === 1 ? 900 : 0);
      const price = Math.round((area * base) / 1000) * 1000;
      const r = rnd();
      const status: Unit["status"] = r > 0.74 ? "sprzedane" : r > 0.62 ? "rezerwacja" : "wolne";
      out.push({
        id: `${String.fromCharCode(65 + (i % 3))}${floor}.${i + 1}`,
        floor,
        rooms,
        area,
        price,
        status,
        aspect: ASPECTS[Math.floor(rnd() * ASPECTS.length)],
        extra: floor === 0 ? "ogródek 42 m²" : floor === 7 ? "taras 18 m²" : EXTRAS[Math.floor(rnd() * 3)],
      });
    }
  }
  return out;
}

export const UNIT_STATUS_LABEL: Record<Unit["status"], string> = {
  wolne: "Wolne",
  rezerwacja: "Rezerwacja",
  sprzedane: "Sprzedane",
};
