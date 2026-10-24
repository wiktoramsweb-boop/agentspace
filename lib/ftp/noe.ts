// Plik z ofertami w formacie NOE 2.0 (Nieruchomosci-online.pl). Bez importów:
// czyta to serwer (wysyłka) i test (`npm run test:noe`).
//
// Specyfikacja: „Specyfikacja eksportu ogłoszeń w formacie natywnym NOE 2.0”
// (wrzesień 2025) i słownik noeDictionary_v_2_0.xml. Wysyłamy eksport pełny:
// portal zostawia dokładnie te oferty, które są w pliku, a resztę zdejmuje.
// Dzięki temu odznaczenie oferty w AgentSpace albo jej sprzedaż zdejmuje ją
// z portalu bez osobnego polecenia.

export type OfertaNoe = {
  id: string;
  offer_no?: string | null;
  agent_id: string;
  deal_kind: string;
  property_type: string;
  description: string | null;
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
  city?: string | null;
  address: string | null;
  export_address_mode?: string | null;
  admin_fee_pln?: number | null;
  deposit_pln?: number | null;
  details?: Record<string, unknown> | null;
};

/** Jednostki administracyjne z geokodowania odwrotnego (portal ich wymaga). */
export type Urzedowe = { wojewodztwo: string | null; powiat: string | null; gmina: string | null };
export type AgentNoe = { id: string; imie: string; email: string | null; telefon: string | null };
export type ZdjecieNoe = { plik: string; rzut: boolean };

const norm = (v: unknown) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
const slownik = (pary: Record<string, number>) => Object.fromEntries(Object.entries(pary).map(([k, v]) => [norm(k), v]));
const z = (s: Record<string, number>, v: unknown): number | undefined => s[norm(v)];
/** Szuka po fragmencie: „Pompa ciepła powietrzna” trafia w „pompa ciepla”. */
const zawiera = (s: Record<string, number>, v: unknown): number | undefined => {
  const t = norm(v);
  if (!t) return undefined;
  if (s[t] != null) return s[t];
  const klucz = Object.keys(s).find((k) => t.includes(k));
  return klucz ? s[klucz] : undefined;
};

const WOJEWODZTWA = slownik({
  dolnoslaskie: 1, "kujawsko pomorskie": 2, lubelskie: 3, lubuskie: 4, lodzkie: 5, malopolskie: 6, mazowieckie: 7, opolskie: 8,
  podkarpackie: 9, podlaskie: 10, pomorskie: 11, slaskie: 12, swietokrzyskie: 13, "warminsko mazurskie": 14, wielkopolskie: 15, zachodniopomorskie: 16,
});
const KATEGORIE: Record<string, number> = { mieszkanie: 1, dom: 2, dzialka: 3, lokal: 4, magazyn: 5, obiekt: 5, budynek: 5, pokoj: 6 };
const BUDYNEK = slownik({
  blok: 3, "niski blok": 3, "wysoki blok": 3, kamienica: 7, apartamentowiec: 1, loft: 22, plomba: 3, oficyna: 27,
  "dom wolnostojacy": 4, wolnostojacy: 4, "dom wielolokalowy": 5, "dom wielorodzinny": 5, blizniak: 2, szeregowy: 11, szeregowiec: 11, segment: 11,
  willa: 9, rezydencja: 9, dworek: 6, letniskowy: 8, siedlisko: 20, gospodarstwo: 18,
});
const STAN = slownik({
  "wysoki standard": 18, "po remoncie": 15, "bardzo dobry": 15, "do zamieszkania": 14, dobry: 14, "pod klucz": 13, do_wprowadzenia: 14,
  "do odswiezenia": 3, do_odswiezenia: 3, "do remontu": 4, do_remontu: 4, "do wykonczenia": 5, "stan deweloperski": 6, deweloperski: 6,
  "surowy zamkniety": 7, "surowy otwarty": 8, "w budowie": 9, w_budowie: 9,
});
const WLASNOSC = slownik({
  "pelna wlasnosc": 8, wlasnosc: 8, "spoldzielcze wlasnosciowe": 2, "spoldzielcze wl prawo": 2, spoldzielcze: 2,
  "uzytkowanie wieczyste": 7, uzytkowanie: 7, udzial: 5, dzierzawa: 10,
});
const OGRZEWANIE = slownik({
  miejskie: 6, "gazowe": 4, gaz: 4, elektryczne: 2, "pompa ciepla": 15, pompa: 15, "kominek z rozprowadzeniem": 25, kominek: 12, olejowe: 3,
  "wegiel": 10, "kociol na wegiel": 10, pellet: 20, ekogroszek: 21, podlogowe: 29, "piece kaflowe": 13, piec: 13, kotlownia: 24, centralne: 24, inne: 28,
});
const MATERIAL = slownik({
  cegla: 1, drewno: 2, kamien: 3, "wielka plyta": 4, plyta: 4, pustak: 5, ytong: 7, beton: 8, "beton komorkowy": 9, gazobeton: 9,
  silikat: 10, keramzyt: 16, zelbet: 19, inne: 18, prefabrykat: 4, "szkielet drewniany": 2,
});
const OKNA = slownik({ plastikowe: 5, pcv: 5, drewniane: 6, aluminiowe: 8, "drewno aluminium": 6, nowe: 1, wymienione: 1, "do wymiany": 3 });
const KUCHNIA = slownik({ osobna: 1, oddzielna: 1, aneks: 2, "aneks kuchenny": 2, "z oknem": 3, "w zabudowie": 4 });
const AGD = slownik({ lodowka: 1, piekarnik: 2, kuchenka: 3, "plyta indukcyjna": 3, "plyta gazowa": 3, plyta: 3, zmywarka: 4, pralka: 5, telewizor: 6, suszarka: 7, mikrofala: 8, mikrofalowka: 8 });
const BEZPIECZENSTWO = slownik({
  "system alarmowy": 1, alarm: 1, domofon: 2, wideofon: 2, "drzwi antywlamaniowe": 3, monitoring: 4, ochrona: 5, "rolety antywlamaniowe": 6,
  "teren ogrodzony": 7, "osiedle zamkniete": 7, kraty: 8,
});
const PARKING = slownik({ "garaz podziemny": 1, podziemny: 1, "hala garazowa": 10, garaz: 3, "miejsce naziemne": 11, naziemne: 11, ulica: 8, podjazd: 9, wiata: 5 });
const DZIALKA = slownik({ budowlana: 1, "budowlano rolna": 2, siedliskowa: 3, rekreacyjna: 4, rolna: 5, lesna: 6, inwestycyjna: 7, przemyslowa: 8, uslugowa: 10, "rolno lesna": 12 });
const PRZEZNACZENIE = slownik({ biurowe: 3, biuro: 3, uslugowy: 4, uslugowe: 4, handlowy: 5, handlowe: 5, gastronomiczny: 6, gastronomia: 6, magazyn: 2, produkcja: 1, gabinet: 10, medyczne: 15 });

const liczba = (v: unknown): number => Number(String(v ?? "").replace(",", ".").replace(/\s/g, "")) || 0;
const lista = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
const tak = (v: unknown) => v === true || /^(tak|dwie|1|true)$/i.test(String(v ?? "").trim());
/** W NOE pola „czy” mają 1 = tak, 2 = nie. Pole bez wiedzy pomijamy. */
const czy = (v: boolean | null) => (v == null ? null : v ? 1 : 2);

/** Stabilny numer agenta z jego UUID: NOE chce liczby, a numer nie może się zmieniać. */
export function idAgentaNoe(uuid: string): number {
  let h = 0;
  for (const c of uuid) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  return (Math.abs(h) % 2_000_000_000) + 1;
}

export function pietroNoe(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const t = norm(v);
  if (String(v).includes(">")) return 11;
  if (t === "suterena") return -1;
  if (t === "parter") return 0;
  if (t === "poddasze") return null;
  const p = typeof v === "number" ? v : Number(t);
  if (!Number.isFinite(p)) return null;
  return Math.max(-1, Math.min(11, Math.round(p)));
}

export function idWojewodztwa(nazwa: string | null | undefined): number | null {
  return z(WOJEWODZTWA, String(nazwa ?? "").replace(/^wojew[oó]dztwo\s+/i, "")) ?? null;
}

/** Opis do NOE: zwykły tekst z akapitami (portal nie przyjmuje naszego HTML-a). */
export function opisNoe(s: string | null | undefined): string {
  const v = String(s ?? "");
  const tekst = /<\/?(p|br|strong|em|u|ul|ol|li)\b/i.test(v)
    ? v
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<li[^>]*>/gi, "• ")
        .replace(/<\/(p|li|ul|ol|div)>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
    : v;
  return tekst.replace(/\n{3,}/g, "\n\n").trim();
}

const ulicaZAdresu = (adres: string | null | undefined): string | null => {
  const czesci = String(adres ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const a = czesci[0] && /^\d+[a-z]?(\s*\/\s*\d+[a-z]?)?$/i.test(czesci[0]) ? (czesci[1] ?? "") : (czesci[0] ?? "");
  const bez = a.replace(/^(ul\.|ulica|al\.|aleja|os\.|osiedle|pl\.|plac)\s+/i, "").replace(/\s+\d+[a-z]?(\s*\/\s*\d+[a-z]?)?\s*$/i, "").trim();
  return bez.length >= 2 ? bez : null;
};

type Pole = [string, string | number | (string | number)[] | null | undefined];

export type WynikOferty = { ok: true; pola: Pole[]; kategoria: number; typ: number } | { ok: false; bledy: string[] };

/** Pola sekcji <details> albo lista braków po polsku. */
export function polaOferty(o: OfertaNoe, u: Urzedowe, maAgenta: boolean): WynikOferty {
  const bledy: string[] = [];
  const kat = KATEGORIE[o.property_type];
  const typ = o.deal_kind === "wynajem" ? 2 : 1;
  if (!kat) bledy.push("Ten rodzaj nieruchomości nie ma eksportu na Nieruchomosci-online.");
  if (kat === 6 && typ === 1) bledy.push("Pokój można wystawić tylko na wynajem.");
  const det = o.details ?? {};
  const f = o.features ?? {};

  const region = idWojewodztwa(u.wojewodztwo);
  const miasto = (o.city ?? "").trim();
  if (!miasto) bledy.push("Uzupełnij miasto w adresie oferty.");
  if (!region || !u.powiat || !u.gmina) bledy.push("Nie ustaliliśmy województwa, powiatu i gminy: wybierz adres z podpowiedzi, żeby oferta miała położenie na mapie.");
  if (!maAgenta) bledy.push("Agent prowadzący musi mieć w profilu telefon i e-mail.");

  const cena = o.price_pln ?? 0;
  if (cena <= 0) bledy.push("Uzupełnij cenę.");
  const pow = kat === 3 ? (o.plot_area_m2 ?? o.area_m2 ?? 0) : (o.area_m2 ?? 0);
  if (pow <= 0) bledy.push(kat === 3 ? "Uzupełnij powierzchnię działki." : "Uzupełnij metraż.");
  const opis = opisNoe(o.description);
  if (opis.length < 30) bledy.push("Opis musi mieć co najmniej 30 znaków.");
  if ((kat === 2 || kat === 5) && !(o.plot_area_m2 && o.plot_area_m2 > 0)) bledy.push("Uzupełnij powierzchnię działki.");
  const rodzajDzialki = kat === 3 ? (zawiera(DZIALKA, det.typ_dzialki ?? det.przeznaczenie_dzialki ?? det.przeznaczenie) ?? null) : null;
  if (kat === 3 && !rodzajDzialki) bledy.push("Uzupełnij przeznaczenie działki (np. budowlana, rolna).");
  if (bledy.length) return { ok: false, bledy };

  const mieszkalne = kat === 1 || kat === 2 || kat === 6;
  const ulica =
    o.export_address_mode === "dzielnica" ? null : (typeof det.adres_ulica === "string" && det.adres_ulica.trim()) || ulicaZAdresu(o.address);

  const pietro = kat === 1 || kat === 4 || kat === 6 ? pietroNoe(o.floor) : null;
  const pietra = o.floors_total ? Math.max(1, Math.min(11, o.floors_total)) : null;
  const winda = det.winda != null ? tak(det.winda) || /dwie/i.test(String(det.winda)) : f.winda ? true : null;
  const balkonM2 = liczba(det.balkon_m2);
  const tarasM2 = liczba(det.taras_m2);
  const balkon = balkonM2 > 0 || tarasM2 > 0 || liczba(det.balkony) > 0 || f.balkon || f.taras ? true : null;
  const piwnicaM2 = liczba(det.piwnica_m2);
  const piwnica = piwnicaM2 > 0 || det.komorka === true || f.piwnica ? true : null;
  const ogrodM2 = liczba(det.ogrodek_m2);
  const parkingRodzaj = det.parking_rodzaj && norm(det.parking_rodzaj) !== "brak" ? String(det.parking_rodzaj) : null;
  const parking = parkingRodzaj || f.garaz ? true : null;

  const agd = new Set<number>();
  for (const w of lista(det.wyposazenie)) {
    const v = zawiera(AGD, w);
    if (v) agd.add(v);
  }
  if (f.zmywarka) agd.add(4);
  if (f.pralka) agd.add(5);
  const ochrona = new Set<number>();
  for (const w of lista(det.bezpieczenstwo)) {
    const v = zawiera(BEZPIECZENSTWO, w);
    if (v) ochrona.add(v);
  }
  if (f.alarm) ochrona.add(1);
  if (f.monitoring) ochrona.add(4);
  if (norm(det.drzwi_wejsciowe) === "antywlamaniowe") ochrona.add(3);
  if (det.rolety === true) ochrona.add(6);
  const umeblowane = lista(det.wyposazenie).some((w) => /mebl/i.test(w)) || f.meble ? true : null;
  const ogrzewanie = o.heating ? zawiera(OGRZEWANIE, o.heating) : undefined;
  const okna = det.okna ? zawiera(OKNA, det.okna) : undefined;
  const kuchnia = det.kuchnia ? zawiera(KUCHNIA, det.kuchnia) : undefined;
  const data = o.available_from && /^\d{4}-\d{2}/.test(o.available_from) ? o.available_from : null;

  const pola: Pole[] = [
    ["id", o.id],
    ["idCategory", kat],
    ["idAdType", typ],
    ["sign", o.offer_no ?? null],
    ["action", "insert"],
    ["idRegion", region],
    ["districtName", u.powiat],
    ["communeName", u.gmina],
    ["cityName", miasto],
    ["quarterName", typeof det.dzielnica === "string" ? det.dzielnica : null],
    ["street", ulica],
    // Bez pełnego adresu portal pokazuje okolicę, a nie punkt.
    ["inaccurateLocation", o.export_address_mode === "pelny" ? null : 1],
    ["idAgent", idAgentaNoe(o.agent_id)],
    ["idMarketType", typ === 1 && kat !== 3 && kat !== 6 ? (norm(o.market) === "pierwotny" ? 2 : 1) : null],
    ["area", Math.round(pow * 100) / 100],
    ["areaPlot", kat === 2 || kat === 5 ? o.plot_area_m2 : null],
    ["price", Math.round(cena)],
    ["idCurrency", 1],
    ["pricePM", Math.round((cena / pow) * 100) / 100],
    ["rooms", kat !== 3 ? o.rooms : null],
    ["floor", pietro],
    ["totalFloors", kat !== 2 && kat !== 3 ? pietra : null],
    ["isElevator", kat !== 2 && kat !== 3 ? czy(winda) : null],
    ["idBuildingType", kat !== 3 ? (z(BUDYNEK, det.typ_domu) ?? zawiera(BUDYNEK, o.building_type) ?? null) : null],
    ["yearBuilt", o.year_built && o.year_built > 1700 && o.year_built < 2100 ? o.year_built : null],
    ["idConditionType", kat !== 3 ? (z(STAN, o.condition_std) ?? null) : null],
    ["isGarageParking", kat === 1 || kat === 2 ? czy(parking) : null],
    ["idGarageType", parkingRodzaj ? (zawiera(PARKING, parkingRodzaj) ?? null) : null],
    ["idAvailableFromType", data ? 1 : 3],
    ["availableFromYear", data ? Number(data.slice(0, 4)) : null],
    ["availableFromMonth", data ? Number(data.slice(5, 7)) : null],
    ["idOwnershipType", typ === 1 && kat !== 6 ? (z(WLASNOSC, o.ownership) ?? zawiera(WLASNOSC, o.ownership) ?? null) : null],
    ["rent", kat === 1 && typ === 1 && o.admin_fee_pln ? o.admin_fee_pln : null],
    ["isBalcony", mieszkalne ? czy(balkon) : null],
    ["idBalconyType", mieszkalne && balkon ? (tarasM2 > 0 && balkonM2 === 0 ? 3 : 1) : null],
    ["areaBalcony", mieszkalne && (balkonM2 || tarasM2) ? balkonM2 || tarasM2 : null],
    ["isBasement", kat === 1 || kat === 2 ? czy(piwnica) : null],
    ["areaBasement", (kat === 1 || kat === 2) && piwnicaM2 ? piwnicaM2 : null],
    ["isGarden", kat === 1 && ogrodM2 > 0 ? 1 : null],
    ["areaGarden", kat === 1 && ogrodM2 > 0 ? ogrodM2 : null],
    ["jKitchen", mieszkalne && kuchnia ? [kuchnia] : null],
    ["jEquipment", mieszkalne && agd.size ? [...agd] : null],
    ["isFurnished", mieszkalne || kat === 4 ? czy(umeblowane) : null],
    ["jWindows", typ === 1 && kat !== 3 && kat !== 6 && okna ? [okna] : null],
    ["jHeatingType", kat !== 3 && ogrzewanie ? [ogrzewanie] : null],
    ["idConstructMaterial", kat === 2 || kat === 5 ? (zawiera(MATERIAL, det.material_budynku ?? det.material_scian) ?? null) : null],
    ["isAirConditioning", kat !== 3 && (det.klimatyzacja_dom === true || f.klimatyzacja) ? 1 : null],
    ["jSafety", kat !== 3 && ochrona.size ? [...ochrona] : null],
    ["idPlotType", rodzajDzialki],
    ["idBPDestType", kat === 4 || kat === 5 ? (zawiera(PRZEZNACZENIE, det.przeznaczenie_lokalu ?? det.przeznaczenie) ?? null) : null],
    ["idPriceType", typ === 2 && (kat === 1 || kat === 2 || kat === 6) ? 1 : null],
    ["pledge", typ === 2 && o.deposit_pln ? o.deposit_pln : null],
    ["description", opis],
  ];
  return { ok: true, pola, kategoria: kat, typ };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// CDATA nie może zawierać „]]>”: dzielimy je na dwie sekcje.
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
// XML 1.0 nie dopuszcza znaków sterujących, a wklejone z Worda opisy je mają.
const czysty = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "");

function pole([k, v]: Pole, wciecie: string): string {
  if (v == null || v === "") return "";
  if (Array.isArray(v)) return v.length ? `${wciecie}<${k}>${v.map((x) => `<v>${x}</v>`).join("")}</${k}>\n` : "";
  const t = czysty(String(v));
  return `${wciecie}<${k}>${k === "description" || k === "street" || k === "quarterName" || k === "sign" ? cdata(t) : esc(t)}</${k}>\n`;
}

export type OfertaDoPliku = { pola: Pole[]; lat: number | null; lng: number | null; zdjecia: ZdjecieNoe[] };

/** Cały dokument eksportu. Agentów bierzemy tylko tych, którzy prowadzą wysyłane oferty. */
export function dokumentNoe(agenci: AgentNoe[], oferty: OfertaDoPliku[], program = "AgentSpace"): string {
  const a = agenci
    .map((g) => {
      const [imie, ...reszta] = g.imie.trim().split(/\s+/);
      return (
        `    <agent>\n` +
        pole(["idAgent", idAgentaNoe(g.id)], "      ") +
        pole(["name", imie || "Agent"], "      ") +
        pole(["surname", reszta.join(" ") || "-"], "      ") +
        pole(["phone", (g.telefon ?? "").replace(/[^\d+]/g, "")], "      ") +
        pole(["email", g.email], "      ") +
        `    </agent>\n`
      );
    })
    .join("");
  const ads = oferty
    .map((o) => {
      const zdj = o.zdjecia.filter((x) => !x.rzut).slice(0, 20);
      const rzuty = o.zdjecia.filter((x) => x.rzut).slice(0, 3);
      return (
        `    <ad>\n      <details>\n` +
        o.pola.map((p) => pole(p, "        ")).join("") +
        `      </details>\n` +
        (o.lat != null && o.lng != null ? `      <map>\n        <mapLatitude>${o.lat}</mapLatitude>\n        <mapLongitude>${o.lng}</mapLongitude>\n      </map>\n` : "") +
        (zdj.length ? `      <photos>\n${zdj.map((x) => `        <photo><fileName>${esc(x.plik)}</fileName></photo>\n`).join("")}      </photos>\n` : "") +
        (rzuty.length ? `      <plans>\n${rzuty.map((x) => `        <plan><fileName>${esc(x.plik)}</fileName></plan>\n`).join("")}      </plans>\n` : "") +
        `    </ad>\n`
      );
    })
    .join("");
  return (
    `<?xml version="1.0" encoding="utf-8"?>\n<xml>\n` +
    `  <export>\n    <version>2.0</version>\n    <type>full</type>\n    <softwareName>${esc(program)}</softwareName>\n  </export>\n` +
    `  <agents>\n${a}  </agents>\n  <ads>\n${ads}  </ads>\n</xml>\n`
  );
}

/** Nazwa pliku zdjęcia: stała dla tego samego adresu, unikalna w obrębie konta biura. */
export function nazwaZdjecia(url: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0;
  for (const c of url) {
    h1 = Math.imul(h1 ^ c.charCodeAt(0), 16777619) >>> 0;
    h2 = (Math.imul(h2, 31) + c.charCodeAt(0)) >>> 0;
  }
  return `as_${h1.toString(36)}${h2.toString(36)}.jpg`;
}
