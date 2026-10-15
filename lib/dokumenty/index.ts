import { WZORY_NAJMU } from "./najem";
import { WZORY_POSREDNICTWA } from "./posrednictwo";
import { WZORY_INNE } from "./inne";
import type { Kategoria, Wzor } from "./silnik";

export const WZORY: Wzor[] = [...WZORY_NAJMU, ...WZORY_POSREDNICTWA, ...WZORY_INNE];

export function wzor(id: string): Wzor | null {
  return WZORY.find((w) => w.id === id) ?? null;
}

export const KATEGORIE: Kategoria[] = ["Pośrednictwo", "Sprzedaż i transakcja", "Najem"];
