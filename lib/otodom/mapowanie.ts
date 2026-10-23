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
  floor: number | string | null;
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
  admin_fee_pln?: number | null;
  deposit_pln?: number | null;
  energy_cert_status?: string | null;
  details?: Record<string, unknown> | null;
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

// Kreator zapisuje wartości pól wyboru jako etykiety („Pełna własność”,
// „Miejskie”), a starsze oferty jako krótkie kody („wlasnosc”). Słowniki
// przyjmują jedno i drugie: klucz to tekst po normalizacji (małe litery, bez ogonków).
const norm = (v: unknown) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
const slownik = (pary: Record<string, string>) => Object.fromEntries(Object.entries(pary).map(([k, v]) => [norm(k), v]));
const z = (s: Record<string, string>, v: unknown): string | undefined => s[norm(v)];

const BUDYNEK = slownik({
  blok: "block", "niski blok (do 4 pieter)": "block", "wysoki blok": "block", kamienica: "tenement", apartamentowiec: "apartment",
  plomba: "infill", szeregowiec: "ribbon", szeregowy: "ribbon", loft: "loft", "dom wolnostojacy": "house", "dom wielolokalowy": "house", "willa miejska": "house",
});
const TYP_DOMU = slownik({
  wolnostojacy: "detached", blizniak: "semi-detached", "blizniak polowa": "semi-detached", "szeregowy skrajny": "ribbon", "szeregowy srodkowy": "ribbon",
  segment: "ribbon", szeregowy: "ribbon", willa: "residence", rezydencja: "residence", dworek: "residence", kamienica: "tenement", gospodarstwo: "farm",
});
const STAN = slownik({
  "do zamieszkania": "ready-to-use", "wysoki standard": "ready-to-use", "po remoncie": "ready-to-use", "pod klucz": "ready-to-use", "do odswiezenia": "ready-to-use",
  do_wprowadzenia: "ready-to-use", do_odswiezenia: "ready-to-use", "do wykonczenia": "to-complete", "stan deweloperski": "to-complete", deweloperski: "to-complete",
  "w budowie": "to-complete", w_budowie: "to-complete", "do remontu": "in-renovation", do_remontu: "in-renovation",
});
const WLASNOSC = slownik({
  "pelna wlasnosc": "full-ownership", "wlasnosc z udzialem w gruncie": "full-ownership", wlasnosc: "full-ownership",
  "spoldzielcze wl prawo do lokalu": "limited-ownership", "spoldzielcze wlasnosciowe z kw": "limited-ownership", "spoldzielcze lokatorskie": "limited-ownership", spoldzielcze: "limited-ownership",
  "uzytkowanie wieczyste dzierzawa": "usufruct", uzytkowanie: "usufruct", udzial: "shared",
});
const OGRZEWANIE = slownik({
  miejskie: "urban", gazowe: "gas", "gazowe kondensacyjne": "gas", "piece kaflowe": "tiled-stove", elektryczne: "electrical", kotlownia: "boiler-room",
  inne: "other", "pompa ciepla": "other", "pompa ciepla powietrzna": "other", "pompa ciepla gruntowa": "other", pompa: "other", kominek: "tiled-stove",
  "kominek z rozprowadzeniem": "other", "kociol na pellet": "other", "kociol na wegiel": "boiler-room", olejowe: "other", podlogowe: "other",
});
const OGRZEWANIE_DOM = slownik({
  miejskie: "urban", gazowe: "gas", "gazowe kondensacyjne": "gas", elektryczne: "electric", "pompa ciepla": "heat-pump", "pompa ciepla powietrzna": "heat-pump",
  "pompa ciepla gruntowa": "geothermal", pompa: "heat-pump", "kominek z rozprowadzeniem": "fireplace", kominek: "fireplace", "kociol na pellet": "biomass",
  "kociol na wegiel": "coal", olejowe: "oil", "piece kaflowe": "stove",
});
const MATERIAL = slownik({
  cegla: "brick", drewno: "wood", pustak: "breeze-block", keramzyt: "hydroton", "wielka plyta": "concrete-plate", beton: "concrete", silikat: "silicate",
  "beton komorkowy": "cellular-concrete", zelbet: "reinforced-concrete", inne: "other", kamien: "other", prefabrykat: "concrete-plate", "szkielet drewniany": "wood",
});
const OKNA = slownik({ plastikowe: "plastic", drewniane: "wooden", aluminiowe: "aluminium", "drewno aluminium": "wooden" });
const MEDIA = slownik({ internet: "internet", "telewizja kablowa": "cable-tv", telefon: "phone" });
const WYPOSAZENIE = slownik({
  meble: "furniture", pralka: "washing-machine", zmywarka: "dishwasher", lodowka: "fridge", kuchenka: "stove", "plyta indukcyjna": "stove", "plyta gazowa": "stove",
  piekarnik: "oven", telewizor: "tv",
});
const ZABEZPIECZENIA = slownik({
  "drzwi antywlamaniowe": "anti-burglary-door", "rolety antywlamaniowe": "roller-shutters", "system alarmowy": "alarm", monitoring: "monitoring",
  domofon: "entryphone", wideofon: "entryphone", "teren ogrodzony": "closed-area", "osiedle zamkniete": "closed-area",
});
const KLASA = slownik({ "a+": "a-plus", a: "a", b: "b", c: "c", d: "d", e: "e", f: "f", g: "g" });
// Stare flagi z kolumny features (kafelki udogodnień).
const FLAGI_DODATKI: Record<string, string> = { winda: "lift", balkon: "balcony", taras: "terrace", ogrodek: "garden", klimatyzacja: "air-conditioning", piwnica: "basement", garaz: "garage" };
const FLAGI_ZABEZPIECZENIA: Record<string, string> = { alarm: "alarm", monitoring: "monitoring" };
const FLAGI_WYPOSAZENIE: Record<string, string> = { meble: "furniture", zmywarka: "dishwasher", pralka: "washing-machine" };

function pietro(v: number | string): string | null {
  if (String(v).includes(">")) return "11th-floor-and-above";
  const t = norm(v);
  if (t === "suterena") return "cellar";
  if (t === "parter") return "ground-floor";
  if (t === "poddasze") return "garret";
  const p = typeof v === "number" ? v : Number(t);
  if (!Number.isFinite(p)) return null;
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

  // Opis z edytora jest już HTML-em (akapity, pogrubienia, listy) i taki idzie na Otodom.
  // Stary opis to zwykły tekst: zamieniamy złamania linii na <br/>.
  const zrodlo = (o.description ?? "").replace(EMOJI, "").trim();
  const html = /<\/?(p|br|strong|em|u|ul|ol|li)\b/i.test(zrodlo);
  const opisTekst = html ? zrodlo.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : zrodlo;
  const opis = opcje.test ? OPIS_TESTOWY : html ? zrodlo : zrodlo.replace(/\r?\n/g, "<br/>");
  if (!opcje.test && opisTekst.length < 50) bledy.push("Opis musi mieć co najmniej 50 znaków.");

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
  const rynek = norm(o.market) === "pierwotny" ? "primary" : "secondary";
  dodaj("market", rynek);

  const det = o.details ?? {};
  const lista = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
  const liczba = (v: unknown) => Number(String(v ?? "").replace(",", ".")) || 0;

  if (o.floor != null && o.floor !== "" && ma("floor")) dodaj("floor", pietro(o.floor));
  if (o.floors_total) dodaj("building-floors", String(o.floors_total));
  if (o.year_built && o.year_built > 1700 && o.year_built < 2100) dodaj("construction-year", String(o.year_built));
  if (kat?.startsWith("houses")) dodaj("building-type", z(TYP_DOMU, det.typ_domu) ?? z(TYP_DOMU, o.building_type));
  else dodaj("building-type", z(BUDYNEK, o.building_type));
  dodaj("status", z(STAN, o.condition_std));
  dodaj("building-ownership", z(WLASNOSC, o.ownership));
  if (o.heating) {
    dodaj("heating", z(OGRZEWANIE, o.heating));
    dodaj("heating-types", z(OGRZEWANIE_DOM, o.heating));
  }
  dodaj("building-material", z(MATERIAL, det.material_budynku ?? det.material_scian));
  dodaj("windows-type", z(OKNA, det.okna));
  if (o.available_from && /^\d{4}-\d{2}-\d{2}/.test(o.available_from)) dodaj("free-from", o.available_from.slice(0, 10));
  if (/zwolnion/i.test(o.energy_cert_status ?? "")) dodaj("energy-certificate", "exempt");
  else dodaj("energy-certificate", z(KLASA, det.energia_klasa));

  // Wiele wartości: zbieramy do zbiorów, żeby ta sama wartość nie poszła dwa razy.
  const extras = new Set<string>();
  const security = new Set<string>();
  const equipment = new Set<string>();
  const media = new Set<string>();
  const f = o.features ?? {};
  for (const [k, v] of Object.entries(FLAGI_DODATKI)) if (f[k]) extras.add(v);
  for (const [k, v] of Object.entries(FLAGI_ZABEZPIECZENIA)) if (f[k]) security.add(v);
  for (const [k, v] of Object.entries(FLAGI_WYPOSAZENIE)) if (f[k]) equipment.add(v);
  if (/tak|dwie/i.test(String(det.winda ?? ""))) extras.add("lift");
  if (liczba(det.balkon_m2) > 0 || liczba(det.balkony) > 0) extras.add("balcony");
  if (liczba(det.taras_m2) > 0) extras.add("terrace");
  if (liczba(det.ogrodek_m2) > 0) extras.add("garden");
  if (liczba(det.piwnica_m2) > 0 || det.komorka === true) extras.add("basement");
  if (norm(det.kuchnia) === "osobna") extras.add("separate-kitchen");
  if (det.parking_rodzaj && norm(det.parking_rodzaj) !== "brak") extras.add("garage");
  if (det.klimatyzacja_dom === true) extras.add("air-conditioning");
  for (const w of lista(det.wyposazenie)) {
    const v = z(WYPOSAZENIE, w);
    if (v) equipment.add(v);
  }
  for (const w of lista(det.bezpieczenstwo)) {
    const v = z(ZABEZPIECZENIA, w);
    if (v) security.add(v);
  }
  if (norm(det.drzwi_wejsciowe) === "antywlamaniowe") security.add("anti-burglary-door");
  if (det.rolety === true) security.add("roller-shutters");
  for (const w of lista(det.media_lokalu)) {
    const v = z(MEDIA, w);
    if (v) media.add(v);
  }
  extras.forEach((v) => dodaj("extras", v));
  security.forEach((v) => dodaj("security", v));
  equipment.forEach((v) => dodaj("equipment-types", v));
  media.forEach((v) => dodaj("media-types", v));

  if (bledy.length) return { ok: false, bledy };

  const ulica = lok.ulica && o.export_address_mode !== "dzielnica" ? lok.ulica : null;
  const payload: Record<string, unknown> = {
    site_urn: "urn:site:otodompl",
    category_urn: `urn:concept:${kat}`,
    title: tytul,
    description: opis,
    price: { value: Math.round(o.price_pln!), currency: "PLN" },
    // Czynsz administracyjny przy sprzedaży, kaucja przy najmie (pola Otodom spoza taksonomii).
    ...(o.deal_kind !== "wynajem" && o.admin_fee_pln ? { rent_price: { value: Math.round(o.admin_fee_pln), currency: "PLN" } } : {}),
    ...(o.deal_kind === "wynajem" && o.deposit_pln ? { deposit_price: { value: Math.round(o.deposit_pln), currency: "PLN" } } : {}),
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
