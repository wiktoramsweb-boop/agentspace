// Oferta z AgentSpace → ogłoszenie w formacie OLX Group API (Otodom).
// Bez importów: test (`npm run test:otodom`) i serwer liczą to samo.
// Taksonomię (lib/otodom/taksonomia.json) podaje wywołujący, żeby moduł
// nie zależał od sposobu wczytania JSON-a.

export type Taksonomia = Record<string, Record<string, string[]>>;

export type OfertaDoEksportu = {
  id: string;
  offer_no?: string | null;
  title: string;
  headline?: string | null;
  description: string | null;
  deal_kind: string;
  property_type: string;
  price_pln: number | null;
  area_m2: number | null;
  plot_area_m2?: number | null;
  rooms: number | null;
  floor: number | null;
  floors_total?: number | null;
  year_built?: number | null;
  market?: string | null;
  ownership?: string | null;
  building_type?: string | null;
  condition_std?: string | null;
  heating?: string | null;
  available_from?: string | null;
  features?: Record<string, boolean> | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  export_address_mode?: string | null;
  photos?: { url: string; export?: boolean; plan?: boolean }[] | null;
};

export type Kontakt = { name: string; email: string; phone?: string | null };
export type Lokalizacja = { cityId: number | null; ulica: string | null; exact: boolean };

export const OPIS_TESTOWY =
  "Czasami musimy dodać takie ogłoszenie, żeby zweryfikować działanie niektórych funkcji systemu. Liczymy na Twoją wyrozumiałość :) Radzimy skorzystać ponownie z naszej wyszukiwarki ofert.<br/><br/> Powodzenia w dalszych poszukiwaniach!";
export const PREFIKS_TESTOWY = "[qatest-mercury]";

const KATEGORIA: Record<string, { sprzedaz?: string; wynajem?: string }> = {
  mieszkanie: { sprzedaz: "apartments-for-sale", wynajem: "apartments-for-rent" },
  dom: { sprzedaz: "houses-for-sale", wynajem: "houses-for-rent" },
  dzialka: { sprzedaz: "lots-for-sale", wynajem: "lots-for-rent" },
  lokal: { sprzedaz: "stores-for-sale", wynajem: "stores-for-rent" },
  magazyn: { sprzedaz: "warehouses-for-sale", wynajem: "warehouses-for-rent" },
  pokoj: { wynajem: "rooms-for-rent" },
};

export function kategoria(o: Pick<OfertaDoEksportu, "property_type" | "deal_kind">): string | null {
  const k = KATEGORIA[o.property_type];
  return (o.deal_kind === "wynajem" ? k?.wynajem : k?.sprzedaz) ?? null;
}

const BUDYNEK: Record<string, string> = {
  blok: "block",
  apartamentowiec: "apartment",
  kamienica: "tenement",
  wolnostojacy: "detached",
  blizniak: "semi-detached",
  szeregowy: "ribbon",
};
const STAN: Record<string, string> = {
  do_wprowadzenia: "ready-to-use",
  do_odswiezenia: "ready-to-use",
  do_remontu: "in-renovation",
  deweloperski: "to-complete",
  w_budowie: "to-complete",
};
const WLASNOSC: Record<string, string> = { wlasnosc: "full-ownership", spoldzielcze: "limited-ownership", udzial: "shared", uzytkowanie: "usufruct" };
const OGRZEWANIE: Record<string, string> = { miejskie: "urban", gazowe: "gas", elektryczne: "electrical", kominek: "tiled-stove", pompa: "other", inne: "other" };
const OGRZEWANIE_DOM: Record<string, string> = { miejskie: "urban", gazowe: "gas", elektryczne: "electric", kominek: "fireplace", pompa: "heat-pump" };
const DODATKI: Record<string, string> = { winda: "lift", balkon: "balcony", taras: "terrace", ogrodek: "garden", klimatyzacja: "air-conditioning", piwnica: "basement", garaz: "garage" };
const BEZPIECZENSTWO: Record<string, string> = { alarm: "alarm", monitoring: "monitoring" };
const WYPOSAZENIE: Record<string, string> = { meble: "furniture", zmywarka: "dishwasher", pralka: "washing-machine" };

function pietro(p: number): string {
  if (p < 0) return "cellar";
  if (p === 0) return "ground-floor";
  if (p >= 11) return "11th-floor-and-above";
  const kon = p === 1 ? "st" : p === 2 ? "nd" : p === 3 ? "rd" : "th";
  return `${p}${kon}-floor`;
}

/** „SUPER OKAZJA mieszkanie” → „Super okazja mieszkanie”: Otodom odrzuca tytuły z krzykiem. */
export function bezKrzyku(t: string): string {
  return t.replace(/\b(\p{Lu}{3,})\b/gu, (s) => s.charAt(0) + s.slice(1).toLowerCase());
}

const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu;

/** Ulica bez numeru budynku i lokalu, do location.custom_fields.street_name. */
export function ulicaZAdresu(adres: string | null | undefined): string | null {
  const a = String(adres ?? "").split(",")[0].trim();
  if (!a) return null;
  const bez = a
    .replace(/^(ul\.|ulica|al\.|aleja|os\.|osiedle|pl\.|plac)\s+/i, "")
    .replace(/\s+\d+[a-z]?(\s*\/\s*\d+[a-z]?)?\s*$/i, "")
    .trim();
  return bez.length >= 2 ? bez : null;
}

export type Wynik = { ok: true; payload: Record<string, unknown> } | { ok: false; bledy: string[] };

/**
 * Buduje ogłoszenie albo zwraca listę braków po polsku. Sprawdzamy u siebie
 * wszystko, co Otodom i tak by odrzucił, bo jego odpowiedź przychodzi dopiero
 * po kilku sekundach webhookiem i bywa po angielsku.
 */
export function budujOgloszenie(o: OfertaDoEksportu, kontakt: Kontakt, lok: Lokalizacja, taks: Taksonomia, opcje: { test: boolean }): Wynik {
  const bledy: string[] = [];
  const kat = kategoria(o);
  if (!kat || !taks[kat]) bledy.push("Ten rodzaj nieruchomości nie ma jeszcze eksportu na Otodom.");
  const atrybutyKat = (kat && taks[kat]) || {};
  const ma = (a: string) => a in atrybutyKat;

  let tytul = bezKrzyku((o.headline || o.title || "").trim()).replace(EMOJI, "").trim();
  if (opcje.test) tytul = `${PREFIKS_TESTOWY} ${tytul}`;
  if (tytul.length > 70) tytul = tytul.slice(0, 70).replace(/\s+\S*$/, "").trim();
  if (tytul.length < 5) bledy.push("Tytuł ogłoszenia musi mieć co najmniej 5 znaków.");

  const opisZrodlo = (o.description ?? "").replace(EMOJI, "").trim();
  const opis = opcje.test ? OPIS_TESTOWY : opisZrodlo.replace(/\r?\n/g, "<br/>");
  if (!opcje.test && opisZrodlo.length < 50) bledy.push("Opis musi mieć co najmniej 50 znaków.");

  if (!o.price_pln || o.price_pln <= 0) bledy.push("Uzupełnij cenę.");
  if (o.lat == null || o.lng == null) bledy.push("Brak położenia na mapie: wybierz adres z podpowiedzi w karcie oferty.");
  else if (o.lat < 49 || o.lat > 55 || o.lng < 14 || o.lng > 24.2) bledy.push("Położenie oferty jest poza Polską.");
  if (!lok.cityId) bledy.push("Nie rozpoznaliśmy miejscowości w słowniku Otodom. Sprawdź miasto w adresie oferty.");

  const zdjecia = (o.photos ?? []).filter((p) => p.url && p.export !== false && !p.plan).map((p) => ({ url: p.url }));
  const plan = (o.photos ?? []).find((p) => p.url && p.plan)?.url;
  if (!zdjecia.length) bledy.push("Dodaj co najmniej jedno zdjęcie oznaczone do eksportu.");

  if (!kontakt.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kontakt.email)) bledy.push("Agent prowadzący musi mieć imię i e-mail w profilu.");

  const attrs: { urn: string; value: string }[] = [];
  const dodaj = (a: string, v: string | null | undefined) => {
    if (!v || !ma(a)) return;
    const dozwolone = atrybutyKat[a];
    if (dozwolone.length && !dozwolone.includes(v)) return;
    attrs.push({ urn: `urn:concept:${a}`, value: dozwolone.length ? `urn:concept:${v}` : v });
  };

  if (ma("net-area-m2")) {
    if (!o.area_m2) bledy.push("Uzupełnij metraż.");
    else dodaj("net-area-m2", String(o.area_m2));
  }
  if (atrybutyKat["terrain-area-m2"] && kat?.startsWith("houses")) {
    if (!o.plot_area_m2) bledy.push("Dla domu uzupełnij powierzchnię działki.");
    else dodaj("terrain-area-m2", String(o.plot_area_m2));
  }
  if (ma("number-of-rooms")) {
    if (!o.rooms) bledy.push("Uzupełnij liczbę pokoi.");
    else dodaj("number-of-rooms", o.rooms > 10 ? "more" : String(o.rooms));
  }
  // Rynek jest obowiązkowy przy sprzedaży. Brak w ofercie = wtórny, jak domyślnie w API.
  const rynek = o.market === "pierwotny" ? "primary" : "secondary";
  dodaj("market", rynek);

  if (o.floor != null && ma("floor")) dodaj("floor", pietro(o.floor));
  if (o.floors_total) dodaj("building-floors", String(o.floors_total));
  if (o.year_built && o.year_built > 1700 && o.year_built < 2100) dodaj("construction-year", String(o.year_built));
  if (o.building_type) dodaj("building-type", BUDYNEK[o.building_type]);
  if (o.condition_std) dodaj("status", STAN[o.condition_std]);
  if (o.ownership) dodaj("building-ownership", WLASNOSC[o.ownership]);
  if (o.heating) {
    dodaj("heating", OGRZEWANIE[o.heating]);
    dodaj("heating-types", OGRZEWANIE_DOM[o.heating]);
  }
  if (o.available_from && /^\d{4}-\d{2}-\d{2}/.test(o.available_from)) dodaj("free-from", o.available_from.slice(0, 10));
  const f = o.features ?? {};
  for (const [k, v] of Object.entries(DODATKI)) if (f[k]) dodaj("extras", v);
  for (const [k, v] of Object.entries(BEZPIECZENSTWO)) if (f[k]) dodaj("security", v);
  for (const [k, v] of Object.entries(WYPOSAZENIE)) if (f[k]) dodaj("equipment-types", v);

  if (bledy.length) return { ok: false, bledy };

  const ulica = lok.ulica && o.export_address_mode !== "dzielnica" ? lok.ulica : null;
  const payload: Record<string, unknown> = {
    site_urn: "urn:site:otodompl",
    category_urn: `urn:concept:${kat}`,
    title: tytul,
    description: opis,
    price: { value: Math.round(o.price_pln!), currency: "PLN" },
    location: {
      lat: o.lat,
      lon: o.lng,
      exact: lok.exact,
      custom_fields: { city_id: lok.cityId, ...(ulica ? { street_name: ulica } : {}) },
    },
    images: zdjecia.slice(0, 40),
    attributes: attrs,
    contact: { name: bezKrzyku(kontakt.name.trim()), email: kontakt.email.trim(), ...(kontakt.phone && kontakt.phone.replace(/\D/g, "").length >= 7 ? { phone: kontakt.phone.replace(/[^\d+]/g, "").slice(0, 15) } : {}) },
    custom_fields: { id: o.id, ...(o.offer_no ? { reference_id: o.offer_no } : {}) },
    ...(plan ? { floor_plan: plan } : {}),
  };
  return { ok: true, payload };
}
