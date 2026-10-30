// Parametry wyceny z adresu: wspólne dla strony, zapisu i asystenta.
// Bez importów wartości spoza rcn-wycena, żeby dało się tego użyć wszędzie.

import { NAZWY_STANU, type CelWyceny, type OkresBudowy, type Parking, type RodzajBudynku, type Stan, type Zewnatrz } from "./rcn-wycena";

export const BUDYNKI: Record<RodzajBudynku, string> = { blok: "Blok", kamienica: "Kamienica", apartamentowiec: "Apartamentowiec", wielorodzinny: "Dom wielorodzinny" };
export const OKRESY: Record<OkresBudowy, string> = { przed_1945: "Przed 1945", "1945_1970": "1945-1970", "1971_1990": "1971-1990", "1991_2005": "1991-2005", "2006_2015": "2006-2015", po_2015: "Po 2015" };
export const ZEWNATRZ: Record<Zewnatrz, string> = { brak: "Brak", balkon: "Balkon", taras: "Taras", ogrod: "Ogródek" };
export const PARKING: Record<Parking, string> = { brak: "Brak", naziemne: "Miejsce naziemne", garaz: "Garaż podziemny" };
export const OGRZEWANIE: Record<string, string> = { miejskie: "Miejskie", gazowe: "Gazowe", elektryczne: "Elektryczne", pompa: "Pompa ciepła", inne: "Inne" };

const zKlucza = <T extends string>(mapa: Record<T, string>, v: string | undefined): T | null => (v && v in mapa ? (v as T) : null);

export type ParametryWyceny = Record<string, string>;

export function liczbaZ(p: ParametryWyceny, k: string): number | null {
  const v = Number(String(p[k] ?? "").replace(",", "."));
  return p[k] !== undefined && p[k] !== "" && Number.isFinite(v) ? v : null;
}

export function celZParametrow(p: ParametryWyceny, oferta?: { area_m2: number | null; rooms: number | null; floor: number | null } | null): Omit<CelWyceny, "x" | "y"> {
  return {
    pow: liczbaZ(p, "pow") || oferta?.area_m2 || 0,
    izby: liczbaZ(p, "izby") ?? oferta?.rooms ?? null,
    pietro: liczbaZ(p, "pietro") ?? oferta?.floor ?? null,
    pieter: liczbaZ(p, "pieter"),
    winda: p.winda === "tak" ? true : p.winda === "nie" ? false : null,
    rynek: p.rynek === "pierwotny" || p.rynek === "wtorny" ? p.rynek : null,
    stan: zKlucza(NAZWY_STANU, p.stan) as Stan | null,
    budynek: zKlucza(BUDYNKI, p.budynek),
    okres: zKlucza(OKRESY, p.okres),
    zewnatrz: zKlucza(ZEWNATRZ, p.zewnatrz),
    piwnica: p.piwnica === "1" ? true : null,
    parking: zKlucza(PARKING, p.parking),
  };
}

export function opisParametrow(cel: Omit<CelWyceny, "x" | "y">, ogrzewanie: string | null): [string, string][] {
  return [
    ["Powierzchnia", cel.pow ? `${cel.pow.toLocaleString("pl-PL")} m²` : "-"],
    ["Pokoje", cel.izby != null ? String(cel.izby) : "-"],
    ["Piętro", cel.pietro != null ? `${cel.pietro === 0 ? "parter" : cel.pietro}${cel.pieter != null ? ` / ${cel.pieter}` : ""}` : "-"],
    ["Winda", cel.winda == null ? "-" : cel.winda ? "Tak" : "Nie"],
    ["Rynek", cel.rynek === "pierwotny" ? "Pierwotny" : cel.rynek === "wtorny" ? "Wtórny" : "-"],
    ["Stan", cel.stan ? NAZWY_STANU[cel.stan] : "-"],
    ["Typ budynku", cel.budynek ? BUDYNKI[cel.budynek] : "-"],
    ["Okres budowy", cel.okres ? OKRESY[cel.okres] : "-"],
    ["Balkon / taras", cel.zewnatrz ? ZEWNATRZ[cel.zewnatrz] : "-"],
    ["Piwnica / komórka", cel.piwnica ? "Tak" : "-"],
    ["Parking", cel.parking ? PARKING[cel.parking] : "-"],
    ["Ogrzewanie", ogrzewanie ?? "-"],
  ];
}
