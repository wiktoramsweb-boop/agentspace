// Tłumaczenie oferty z ogłoszenia na pola wyceny i kreatora oferty.
// Bez importów poza typami: sprawdza to `npm run test:ogloszenia`.

import type { DaneOferty } from "./ogloszenie-czytanie";

/** Okres budowy w słowniku wyceny (OkresBudowy w lib/rcn-wycena.ts). */
export function okresZRoku(rok: number | null | undefined): string {
  if (!rok) return "";
  if (rok < 1945) return "przed_1945";
  if (rok <= 1970) return "1945_1970";
  if (rok <= 1990) return "1971_1990";
  if (rok <= 2005) return "1991_2005";
  if (rok <= 2015) return "2006_2015";
  return "po_2015";
}

export function adresOferty(o: Pick<DaneOferty, "miasto" | "dzielnica" | "ulica" | "numer">): string {
  const ulica = [o.ulica, o.numer].filter(Boolean).join(" ");
  return [ulica, o.dzielnica, o.miasto].filter(Boolean).join(", ");
}

const tekst = (v: number | null | undefined) => (v == null ? "" : String(v));

/** Parametry adresu /app/wycena-rcn. Puste pola pomijamy, żeby adres był krótki. */
export function parametryWyceny(o: DaneOferty, zrodlo?: string | null): Record<string, string> {
  const stan = { do_wprowadzenia: "standard", deweloperski: "standard", do_odswiezenia: "do_odswiezenia", do_remontu: "do_remontu" } as const;
  const budynek = { blok: "blok", kamienica: "kamienica", apartamentowiec: "apartamentowiec", dom: "wielorodzinny" } as const;
  const ogrzewanie = { miejskie: "miejskie", gazowe: "gazowe", elektryczne: "elektryczne", pompa: "pompa", inne: "inne" } as const;
  const wszystkie: Record<string, string> = {
    address: adresOferty(o),
    lat: tekst(o.lat),
    lng: tekst(o.lng),
    pow: tekst(o.powM2),
    izby: tekst(o.pokoje),
    pietro: tekst(o.pietro),
    pieter: tekst(o.pieter),
    rynek: o.rynek ?? "",
    stan: o.stan ? stan[o.stan] : "",
    budynek: o.budynek ? budynek[o.budynek] : "",
    okres: okresZRoku(o.rok),
    winda: o.winda == null ? "" : o.winda ? "tak" : "nie",
    zewnatrz: o.ogrod ? "ogrod" : o.taras ? "taras" : o.balkon ? "balkon" : "",
    parking: o.garaz ? "garaz" : "",
    piwnica: o.piwnica ? "1" : "",
    ogrzewanie: o.ogrzewanie ?? "",
    cena_ogl: o.transakcja === "sprzedaz" ? tekst(o.cenaPln) : "",
    zrodlo: zrodlo?.startsWith("http") ? zrodlo : "",
  };
  return Object.fromEntries(Object.entries(wszystkie).filter(([, v]) => v !== ""));
}

/** Jakie pola wyceny uzupełniła oferta: to samo tłumaczenie dla oferty z bazy. */
export function parametryZOferty(o: {
  market?: string | null;
  floors_total?: number | null;
  year_built?: number | null;
  condition_std?: string | null;
  building_type?: string | null;
  heating?: string | null;
  features?: Record<string, boolean> | null;
  details?: Record<string, unknown> | null;
}): Record<string, string> {
  const l = (v: unknown) => String(v ?? "").toLowerCase();
  const f = o.features ?? {};
  const w: Record<string, string> = {};
  if (/wt|wtorny/.test(l(o.market))) w.rynek = "wtorny";
  if (/pierw/.test(l(o.market))) w.rynek = "pierwotny";
  if (o.floors_total) w.pieter = String(o.floors_total);
  const okres = okresZRoku(o.year_built);
  if (okres) w.okres = okres;
  const stan = l(o.condition_std);
  if (/remon/.test(stan)) w.stan = /po remoncie/.test(stan) ? "po_remoncie" : "do_remontu";
  else if (/od[sś]wie/.test(stan)) w.stan = "do_odswiezenia";
  else if (/wysoki/.test(stan)) w.stan = "premium";
  else if (stan) w.stan = "standard";
  const bud = l(o.building_type);
  if (/kamienica/.test(bud)) w.budynek = "kamienica";
  else if (/apartament/.test(bud)) w.budynek = "apartamentowiec";
  else if (/blok|plomba/.test(bud)) w.budynek = "blok";
  else if (/wielo/.test(bud)) w.budynek = "wielorodzinny";
  const og = l(o.heating);
  if (/miejsk/.test(og)) w.ogrzewanie = "miejskie";
  else if (/pomp/.test(og)) w.ogrzewanie = "pompa";
  else if (/gaz/.test(og)) w.ogrzewanie = "gazowe";
  else if (/elektr/.test(og)) w.ogrzewanie = "elektryczne";
  else if (og) w.ogrzewanie = "inne";
  const winda = l(o.details?.winda);
  if (f.winda || /tak|dwie/.test(winda)) w.winda = "tak";
  else if (winda === "nie") w.winda = "nie";
  if (f.ogrodek) w.zewnatrz = "ogrod";
  else if (f.taras) w.zewnatrz = "taras";
  else if (f.balkon) w.zewnatrz = "balkon";
  if (f.garaz) w.parking = "garaz";
  if (f.piwnica) w.piwnica = "1";
  return w;
}

/** Wstępnie wypełniona oferta do kreatora. Słowa w polach wyboru muszą być ze słownika lib/property-fields.ts. */
export function szkicOferty(o: DaneOferty) {
  const rynek = { wtorny: "Wtórny", pierwotny: "Pierwotny" } as const;
  const wlasnosc = { pelna: "Pełna własność", spoldzielcza: "Spółdzielcze własnościowe z KW", udzial: "Udział" } as const;
  const budynek = { blok: "Blok", kamienica: "Kamienica", apartamentowiec: "Apartamentowiec", dom: "Dom wolnostojący" } as const;
  const stan = { do_wprowadzenia: "Do zamieszkania", do_odswiezenia: "Do odświeżenia", do_remontu: "Do remontu", deweloperski: "Stan deweloperski" } as const;
  const ogrzewanie = { miejskie: "Miejskie", gazowe: "Gazowe", elektryczne: "Elektryczne", pompa: "Pompa ciepła", inne: "Inne" } as const;
  const akapity = o.opis
    .split(/\n+/)
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => `<p>${a.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("");
  const details: Record<string, unknown> = {};
  if (o.dzielnica) details.dzielnica = o.dzielnica;
  if (o.ulica) details.adres_ulica = o.ulica;
  if (o.numer) details.adres_numer = o.numer;
  if (o.winda != null) details.winda = o.winda ? "Tak" : "Nie";
  return {
    deal_kind: o.transakcja,
    property_type: o.typ ?? "mieszkanie",
    address: [[o.ulica, o.numer].filter(Boolean).join(" "), o.dzielnica].filter(Boolean).join(", ") || null,
    city: o.miasto,
    lat: o.lat,
    lng: o.lng,
    price_pln: o.cenaPln,
    area_m2: o.powM2,
    plot_area_m2: o.dzialkaM2,
    rooms: o.pokoje,
    floor: o.pietro,
    floors_total: o.pieter,
    year_built: o.rok,
    admin_fee_pln: o.czynsz,
    market: o.rynek ? rynek[o.rynek] : null,
    ownership: o.wlasnosc ? wlasnosc[o.wlasnosc] : null,
    building_type: o.budynek ? budynek[o.budynek] : null,
    condition_std: o.stan ? stan[o.stan] : null,
    heating: o.ogrzewanie ? ogrzewanie[o.ogrzewanie] : null,
    headline: o.tytul.slice(0, 120) || null,
    description: akapity || null,
    features: { balkon: o.balkon, taras: o.taras, ogrodek: o.ogrod, winda: o.winda === true, garaz: o.garaz, piwnica: o.piwnica },
    details,
  };
}

/** Oferta z zapisanej wyceny: parametry adresu wyceny z powrotem na pola oferty. */
export function ofertaZWyceny(p: Record<string, string>): DaneOferty {
  const l = (k: string) => {
    const n = Number(String(p[k] ?? "").replace(",", "."));
    return p[k] !== undefined && p[k] !== "" && Number.isFinite(n) ? n : null;
  };
  const czesci = String(p.address ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const stan = p.stan === "do_remontu" ? "do_remontu" : p.stan === "do_odswiezenia" ? "do_odswiezenia" : p.stan ? "do_wprowadzenia" : null;
  const budynek = p.budynek === "kamienica" || p.budynek === "apartamentowiec" || p.budynek === "blok" ? p.budynek : null;
  const ogrzewanie = ["miejskie", "gazowe", "elektryczne", "pompa", "inne"].includes(p.ogrzewanie ?? "") ? (p.ogrzewanie as DaneOferty["ogrzewanie"]) : null;
  const ulica = czesci.length > 1 ? (czesci[0].match(/^(.*?)(?:\s+(\d+[a-zA-Z]?(?:\/\d+)?))?$/) ?? null) : null;
  return {
    typ: "mieszkanie", transakcja: "sprzedaz",
    miasto: czesci.length ? czesci[czesci.length - 1] : null,
    dzielnica: czesci.length > 2 ? czesci[1] : null,
    ulica: ulica?.[1] ?? null,
    numer: ulica?.[2] ?? null,
    lat: l("lat"), lng: l("lng"),
    cenaPln: l("cena_ogl"), powM2: l("pow"), dzialkaM2: null, pokoje: l("izby"), pietro: l("pietro"), pieter: l("pieter"), rok: null,
    rynek: p.rynek === "wtorny" || p.rynek === "pierwotny" ? p.rynek : null,
    stan, budynek, ogrzewanie, wlasnosc: null,
    winda: p.winda === "tak" ? true : p.winda === "nie" ? false : null,
    balkon: p.zewnatrz === "balkon", taras: p.zewnatrz === "taras", ogrod: p.zewnatrz === "ogrod",
    garaz: p.parking === "garaz", piwnica: p.piwnica === "1", czynsz: null, tytul: "", opis: "",
  };
}
