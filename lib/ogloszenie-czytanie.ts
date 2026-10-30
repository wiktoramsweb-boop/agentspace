// Odczyt ogłoszeń z portali: to, co da się zrobić bez AI i bez bazy.
// Bez importów, żeby test (npm run test:ogloszenia) liczył to samo co aplikacja.

/** Oferta z ogłoszenia w jednym kształcie, niezależnie od portalu. Czego nie ma w ogłoszeniu, to null. */
export type DaneOferty = {
  typ: string | null;
  transakcja: "sprzedaz" | "wynajem";
  miasto: string | null;
  dzielnica: string | null;
  ulica: string | null;
  numer: string | null;
  lat: number | null;
  lng: number | null;
  cenaPln: number | null;
  powM2: number | null;
  dzialkaM2: number | null;
  pokoje: number | null;
  pietro: number | null;
  pieter: number | null;
  rok: number | null;
  rynek: "wtorny" | "pierwotny" | null;
  stan: "do_wprowadzenia" | "do_odswiezenia" | "do_remontu" | "deweloperski" | null;
  budynek: "blok" | "kamienica" | "apartamentowiec" | "dom" | null;
  ogrzewanie: "miejskie" | "gazowe" | "elektryczne" | "pompa" | "inne" | null;
  wlasnosc: "pelna" | "spoldzielcza" | "udzial" | null;
  winda: boolean | null;
  balkon: boolean;
  taras: boolean;
  ogrod: boolean;
  garaz: boolean;
  piwnica: boolean;
  czynsz: number | null;
  tytul: string;
  opis: string;
};

export const PUSTA_OFERTA: DaneOferty = {
  typ: null, transakcja: "sprzedaz", miasto: null, dzielnica: null, ulica: null, numer: null, lat: null, lng: null,
  cenaPln: null, powM2: null, dzialkaM2: null, pokoje: null, pietro: null, pieter: null, rok: null, rynek: null,
  stan: null, budynek: null, ogrzewanie: null, wlasnosc: null, winda: null, balkon: false, taras: false, ogrod: false,
  garaz: false, piwnica: false, czynsz: null, tytul: "", opis: "",
};

export const bezHtml = (h: string) =>
  h
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|li|div|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, k) => String.fromCodePoint(parseInt(k, 16)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

/** Opis na jedną kartę A4: tniemy na końcu zdania albo linii, nie w pół słowa. */
export function skroc(t: string, max: number): string {
  if (t.length <= max) return t;
  const kawalek = t.slice(0, max);
  const koniec = Math.max(kawalek.lastIndexOf("\n"), kawalek.lastIndexOf(". "));
  return (koniec > max * 0.5 ? kawalek.slice(0, koniec + 1) : kawalek).trim();
}

export const dodatnia = (v: unknown) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Ulica z tytułu albo opisu, gdy portal nie podaje jej w danych („ul. Podskale 12”). */
export function ulicaZTekstu(tekst: string): { ulica: string; numer: string | null } | null {
  const m = tekst.match(/\b(?:ul\.|ulica|ulicy|al\.|aleja|alei|os\.|osiedle|osiedlu)\s+((?:\p{Lu}[\p{L}.-]*\s?){1,3})(\d+[a-zA-Z]?)?/u);
  if (!m) return null;
  return { ulica: m[1].trim(), numer: m[2] ?? null };
}

const STAN: Record<string, DaneOferty["stan"]> = { ready_to_use: "do_wprowadzenia", to_completion: "deweloperski", to_renovation: "do_remontu" };
const BUDYNEK: Record<string, DaneOferty["budynek"]> = { block: "blok", tenement: "kamienica", apartment: "apartamentowiec", house: "dom", detached: "dom", semi_detached: "dom", ribbon: "dom" };
const OGRZEWANIE: Record<string, DaneOferty["ogrzewanie"]> = { urban: "miejskie", gas: "gazowe", electrical: "elektryczne", heat_pump: "pompa", fireplace: "inne", boiler_room: "inne", tiled_stove: "inne", other: "inne" };
const WLASNOSC: Record<string, DaneOferty["wlasnosc"]> = { full_ownership: "pelna", cooperative_ownership: "spoldzielcza", share: "udzial" };
const TYP: Record<string, string> = { mieszkanie: "mieszkanie", dom: "dom", dzialka: "dzialka", lokal: "lokal", haleimagazyny: "magazyn", pokoj: "pokoj" };

export function pietroZKlucza(v: string | undefined): number | null {
  if (!v) return null;
  if (v === "ground_floor") return 0;
  if (v === "cellar") return -1;
  if (v === "garret") return null;
  if (v === "higher_10" || v === "floor_higher_10") return 11;
  const n = parseInt(v.replace(/^floor_/, ""), 10);
  return Number.isFinite(n) ? n : null;
}

/** Strona ogłoszenia Otodom: dane są w JSON-ie osadzonym w HTML. `null`, gdy portal zmienił układ. */
export function ogloszenieOtodom(html: string): { ad: Record<string, unknown> | null; uklad: boolean } {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return { ad: null, uklad: false };
  return { ad: JSON.parse(m[1])?.props?.pageProps?.ad ?? null, uklad: true };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ofertaZOtodom(ad: any): DaneOferty {
  const ch = new Map<string, string>((ad.characteristics ?? []).map((c: { key: string; value: string }) => [c.key, String(c.value)]));
  const t = ad.target ?? {};
  const extras: string[] = Array.isArray(t.Extras_types) ? t.Extras_types : [];
  const lok = (ad.location?.reverseGeocoding?.locations ?? []) as { locationLevel: string; name: string }[];
  const nazwa = (poziom: string) => lok.find((l) => l.locationLevel === poziom)?.name ?? null;
  const opis = bezHtml(String(ad.description ?? ""));
  const tytul = String(ad.title ?? "");
  const adres = ad.location?.address?.street as { name?: string; number?: string } | null | undefined;
  const zTekstu = adres?.name ? null : (ulicaZTekstu(tytul) ?? ulicaZTekstu(opis));
  const wspolrzedne = ad.location?.coordinates as { latitude?: number; longitude?: number } | undefined;
  const budynek = ch.get("building_type") ?? "";
  return {
    ...PUSTA_OFERTA,
    typ: TYP[String(t.ProperType ?? "")] ?? null,
    transakcja: t.OfferType === "wynajem" ? "wynajem" : "sprzedaz",
    miasto: nazwa("city_or_village"),
    dzielnica: nazwa("residential") ?? nazwa("district"),
    ulica: adres?.name ?? zTekstu?.ulica ?? null,
    numer: adres?.number ?? zTekstu?.numer ?? null,
    lat: dodatnia(wspolrzedne?.latitude),
    lng: dodatnia(wspolrzedne?.longitude),
    cenaPln: dodatnia(ch.get("price") ?? t.Price),
    powM2: dodatnia(ch.get("m") ?? t.Area),
    dzialkaM2: dodatnia(ch.get("terrain_area") ?? t.Terrain_area),
    pokoje: dodatnia(ch.get("rooms_num")),
    pietro: pietroZKlucza(ch.get("floor_no")),
    pieter: dodatnia(ch.get("building_floors_num")),
    rok: dodatnia(ch.get("build_year")),
    rynek: ch.get("market") === "primary" ? "pierwotny" : ch.get("market") === "secondary" ? "wtorny" : null,
    stan: STAN[ch.get("construction_status") ?? ""] ?? null,
    budynek: BUDYNEK[budynek] ?? null,
    ogrzewanie: OGRZEWANIE[ch.get("heating") ?? ""] ?? null,
    wlasnosc: WLASNOSC[ch.get("building_ownership") ?? ""] ?? null,
    winda: extras.includes("lift") ? true : null,
    balkon: extras.includes("balcony"),
    taras: extras.includes("terrace"),
    ogrod: extras.includes("garden"),
    garaz: extras.includes("garage"),
    piwnica: extras.includes("basement") || extras.includes("usable_room"),
    czynsz: dodatnia(ch.get("rent")),
    tytul,
    opis,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Sama treść ogłoszenia: od nagłówka H1. Na Morizonie i Gratce pierwsze 15 tys.
 * znaków tekstu strony to menu, więc AI dostawało linki zamiast oferty.
 */
export function trescOgloszenia(html: string): string {
  const start = html.search(/<h1[\s>]/i);
  return bezHtml(start > 0 ? html.slice(start) : html);
}

function zapisyLd(html: string): unknown[] {
  const wynik: unknown[] = [];
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      wynik.push(JSON.parse(m[1]));
    } catch {
      /* uszkodzony blok pomijamy */
    }
  }
  return wynik;
}

function wszystkie(w: unknown, klucz: string, wynik: unknown[] = []): unknown[] {
  if (Array.isArray(w)) for (const x of w) wszystkie(x, klucz, wynik);
  else if (w && typeof w === "object") {
    for (const [k, v] of Object.entries(w)) {
      if (k === klucz) wynik.push(v);
      wszystkie(v, klucz, wynik);
    }
  }
  return wynik;
}

const wPolsce = (lat: number, lng: number) => lat > 48.9 && lat < 55 && lng > 14 && lng < 24.3;

/** Współrzędne i pełny opis z danych strukturalnych, jeśli portal je podaje. */
export function zDanychStrukturalnych(html: string): { lat: number | null; lng: number | null; opis: string | null } {
  const ld = zapisyLd(html);
  let lat: number | null = null;
  let lng: number | null = null;
  for (const geo of wszystkie(ld, "geo")) {
    const g = geo as { latitude?: unknown; longitude?: unknown };
    const a = Number(g?.latitude);
    const b = Number(g?.longitude);
    if (wPolsce(a, b)) {
      lat = a;
      lng = b;
      break;
    }
  }
  if (lat == null) {
    const m = html.match(/"latitude"\s*:\s*"?(\d{2}\.\d+)"?\s*,\s*"longitude"\s*:\s*"?(\d{2}\.\d+)/);
    if (m && wPolsce(Number(m[1]), Number(m[2]))) {
      lat = Number(m[1]);
      lng = Number(m[2]);
    }
  }
  const opisy = wszystkie(ld, "description").filter((o): o is string => typeof o === "string").map(bezHtml);
  const opis = opisy.sort((a, b) => b.length - a.length)[0] ?? null;
  return { lat, lng, opis: opis && !opis.endsWith("...") && opis.length > 80 ? opis : null };
}

/** Zdjęcia z meta og:image i JSON-LD, gdy portal je podaje. */
export function zdjeciaZHtml(html: string): string[] {
  const z = new Set<string>();
  for (const m of html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi)) z.add(m[1]);
  for (const m of html.matchAll(/"image"\s*:\s*\[([^\]]+)\]/g)) for (const u of m[1].matchAll(/"(https:[^"]+)"/g)) z.add(u[1]);
  return [...z].filter((u) => /^https:\/\//.test(u)).slice(0, 8);
}
