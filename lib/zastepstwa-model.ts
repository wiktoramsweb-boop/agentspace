/**
 * Urlopy i zastępstwa: część bez dostępu do bazy, sprawdzana testem
 * (`npm run test:automatyzacje`). Opis działania w `lib/zastepstwa.ts`.
 */

export type RodzajNieobecnosci = "urlop" | "l4" | "szkolenie" | "delegacja" | "inne";

export const RODZAJE_NIEOBECNOSCI: { value: RodzajNieobecnosci; label: string; kolor: string }[] = [
  { value: "urlop", label: "Urlop", kolor: "bg-sky-100 text-sky-700" },
  { value: "l4", label: "Zwolnienie lekarskie", kolor: "bg-rose-100 text-rose-700" },
  { value: "szkolenie", label: "Szkolenie", kolor: "bg-violet-100 text-violet-700" },
  { value: "delegacja", label: "Delegacja", kolor: "bg-amber-100 text-amber-700" },
  { value: "inne", label: "Inna nieobecność", kolor: "bg-slate-200 text-slate-700" },
];

export type Nieobecnosc = {
  id: string;
  agent_id: string;
  substitute_id: string | null;
  kind: RodzajNieobecnosci;
  starts_on: string;
  ends_on: string;
  note: string | null;
};

/**
 * Kto ma dziś obsłużyć sprawy tej osoby: ona sama albo jej zastępca.
 * Łańcuch zastępstw (zastępca też na urlopie) rozwijamy do trzech kroków,
 * a gdy dalej nikt nie jest dostępny, zostaje pierwotna osoba.
 */
export function rozwinZastepce(userId: string | null | undefined, lista: Nieobecnosc[]): string | null {
  if (!userId) return null;
  const mapa = new Map(lista.map((n) => [n.agent_id, n.substitute_id]));
  const odwiedzeni = new Set<string>([userId]);
  let kto: string = userId;
  for (let i = 0; i < 3; i++) {
    // Osoba jest dziś w pracy: to ona obsługuje.
    if (!mapa.has(kto)) return kto;
    const zastepca = mapa.get(kto);
    if (!zastepca || odwiedzeni.has(zastepca)) break;
    odwiedzeni.add(zastepca);
    kto = zastepca;
  }
  // Ostatni w łańcuchu też jest nieobecny albo nikt nie został wskazany:
  // zostawiamy sprawę opiekunowi, zamiast oddawać ją przypadkowej osobie.
  return mapa.has(kto) ? userId : kto;
}
