/** Sprawdzenie mapowania ofert na Otodom (`npm run test:otodom`). */
import { readFileSync } from "node:fs";
import { budujOgloszenie, bezKrzyku, ulicaZAdresu, kategoria, PREFIKS_TESTOWY, OPIS_TESTOWY, type Taksonomia } from "./otodom/mapowanie.ts";

const taks = JSON.parse(readFileSync(new URL("./otodom/taksonomia.json", import.meta.url), "utf8")) as Taksonomia;
let bledy = 0;
const sprawdz = (opis: string, w: boolean, szczegol = "") => {
  if (!w) {
    bledy++;
    console.error(`BŁĄD  ${opis}${szczegol ? ` (${szczegol})` : ""}`);
  }
};

const oferta = {
  id: "00000000-0000-0000-0000-000000000001",
  offer_no: "SP/2026/014",
  title: "Mieszkanie 3 pokoje, Podgórze",
  description: "Słoneczne mieszkanie z balkonem, po remoncie, blisko tramwaju i bulwarów. Do wprowadzenia od zaraz.",
  deal_kind: "sprzedaz",
  property_type: "mieszkanie",
  price_pln: 978000,
  area_m2: 67.5,
  rooms: 3,
  floor: 4,
  floors_total: 6,
  year_built: 2015,
  market: "wtorny",
  ownership: "wlasnosc",
  building_type: "blok",
  condition_std: "do_wprowadzenia",
  heating: "miejskie",
  features: { balkon: true, winda: true, alarm: true, meble: true },
  lat: 50.0466,
  lng: 19.9608,
  address: "ul. Portowa 12/4, Kraków",
  photos: [{ url: "https://x.pl/1.jpg" }, { url: "https://x.pl/plan.jpg", plan: true }, { url: "https://x.pl/3.jpg", export: false }],
};
const kontakt = { name: "Jan Kowalski", email: "jan@biuro.pl", phone: "+48 600 100 200" };
const lok = { cityId: 38, ulica: "Portowa", exact: false };

const w = budujOgloszenie(oferta, kontakt, lok, taks, { test: false });
sprawdz("poprawna oferta przechodzi", w.ok, w.ok ? "" : w.bledy.join("; "));
if (w.ok) {
  const p = w.payload as Record<string, any>;
  const a = Object.fromEntries((p.attributes as { urn: string; value: string }[]).map((x) => [x.urn + "=" + x.value, true]));
  sprawdz("kategoria", p.category_urn === "urn:concept:apartments-for-sale");
  sprawdz("strona", p.site_urn === "urn:site:otodompl");
  sprawdz("pokoje", a["urn:concept:number-of-rooms=urn:concept:3"]);
  sprawdz("metraż", a["urn:concept:net-area-m2=67.5"]);
  sprawdz("rynek wtórny", a["urn:concept:market=urn:concept:secondary"]);
  sprawdz("piętro", a["urn:concept:floor=urn:concept:4th-floor"]);
  sprawdz("winda i balkon", a["urn:concept:extras=urn:concept:lift"] && a["urn:concept:extras=urn:concept:balcony"]);
  sprawdz("własność", a["urn:concept:building-ownership=urn:concept:full-ownership"]);
  sprawdz("ogrzewanie miejskie", a["urn:concept:heating=urn:concept:urban"]);
  sprawdz("city_id i ulica", p.location.custom_fields.city_id === 38 && p.location.custom_fields.street_name === "Portowa");
  sprawdz("tylko zdjęcia do eksportu", p.images.length === 1 && p.floor_plan === "https://x.pl/plan.jpg");
  sprawdz("cena w PLN", p.price.value === 978000 && p.price.currency === "PLN");
  sprawdz("telefon bez spacji", p.contact.phone === "+48600100200");
  sprawdz("id oferty", p.custom_fields.id === oferta.id && p.custom_fields.reference_id === "SP/2026/014");
  sprawdz("opis z <br/>", !String(p.description).includes("\n"));
}

const t = budujOgloszenie(oferta, kontakt, lok, taks, { test: true });
sprawdz("tryb testowy: prefiks i opis", t.ok && String((t.payload as any).title).startsWith(PREFIKS_TESTOWY) && (t.payload as any).description === OPIS_TESTOWY);
sprawdz("tytuł max 70", t.ok && String((t.payload as any).title).length <= 70);

const zle = budujOgloszenie({ ...oferta, price_pln: null, rooms: null, lat: null, lng: null, photos: [], description: "krótko" }, kontakt, { ...lok, cityId: null }, taks, { test: false });
sprawdz("braki wypisane po polsku", !zle.ok && zle.bledy.length >= 5, zle.ok ? "" : zle.bledy.join("; "));

const dom = budujOgloszenie({ ...oferta, property_type: "dom", plot_area_m2: null }, kontakt, lok, taks, { test: false });
sprawdz("dom bez działki odrzucony", !dom.ok && dom.bledy.some((b) => b.includes("działki")));
const domOk = budujOgloszenie({ ...oferta, property_type: "dom", plot_area_m2: 600, building_type: "wolnostojacy", heating: "pompa" }, kontakt, lok, taks, { test: false });
sprawdz("dom: działka, typ, pompa ciepła", domOk.ok && JSON.stringify((domOk.payload as any).attributes).includes("terrain-area-m2") && JSON.stringify((domOk.payload as any).attributes).includes("heat-pump") && JSON.stringify((domOk.payload as any).attributes).includes("detached"));
sprawdz("najem mieszkania bez rynku obowiązkowego", kategoria({ property_type: "mieszkanie", deal_kind: "wynajem" }) === "apartments-for-rent");

// Oferta zapisana przez kreator: etykiety zamiast kodów i pola w details (jak w zgłoszeniu z 23.10).
const zKreatora = budujOgloszenie(
  {
    ...oferta,
    market: "Wtórny",
    ownership: "Pełna własność",
    building_type: "Blok",
    condition_std: "Do zamieszkania",
    heating: "Miejskie",
    floor: "3",
    admin_fee_pln: 886,
    features: {},
    details: {
      winda: "Tak",
      okna: "Plastikowe",
      material_budynku: "Wielka płyta",
      balkon_m2: 4,
      komorka: true,
      wyposazenie: ["Meble", "Pralka", "Zmywarka", "Lodówka", "Piekarnik", "Telewizor", "Płyta indukcyjna"],
      media_lokalu: ["Internet"],
      energia_klasa: "B",
    },
  },
  kontakt,
  lok,
  taks,
  { test: false },
);
sprawdz("oferta z kreatora przechodzi", zKreatora.ok, zKreatora.ok ? "" : zKreatora.bledy.join("; "));
if (zKreatora.ok) {
  const p = zKreatora.payload as Record<string, any>;
  const a = new Set((p.attributes as { urn: string; value: string }[]).map((x) => `${x.urn.replace("urn:concept:", "")}=${x.value.replace("urn:concept:", "")}`));
  for (const oczekiwane of ["building-ownership=full-ownership", "status=ready-to-use", "heating=urban", "building-type=block", "floor=3rd-floor", "extras=lift", "extras=balcony", "extras=basement", "windows-type=plastic", "building-material=concrete-plate", "equipment-types=fridge", "equipment-types=stove", "media-types=internet", "energy-certificate=b", "market=secondary"]) {
    sprawdz(`kreator: ${oczekiwane}`, a.has(oczekiwane), [...a].join(", "));
  }
  sprawdz("kreator: płyta indukcyjna nie dubluje kuchenki", [...a].filter((x) => x === "equipment-types=stove").length === 1);
  sprawdz("kreator: czynsz administracyjny", p.rent_price?.value === 886);
}
const pietra = (f: string | number) => {
  const r = budujOgloszenie({ ...oferta, floor: f }, kontakt, lok, taks, { test: false });
  return r.ok ? (r.payload as any).attributes.find((x: any) => x.urn === "urn:concept:floor")?.value : null;
};
sprawdz("parter", pietra("Parter") === "urn:concept:ground-floor");
sprawdz("> 10", pietra("> 10") === "urn:concept:11th-floor-and-above");
sprawdz("10", pietra("10") === "urn:concept:10th-floor");
sprawdz("poddasze", pietra("Poddasze") === "urn:concept:garret");

sprawdz("bez krzyku", bezKrzyku("SUPER OKAZJA na Podgórzu") === "Super Okazja na Podgórzu");
sprawdz("ulica z adresu", ulicaZAdresu("ul. Prądnicka 34/12, Kraków") === "Prądnicka");
sprawdz("aleja", ulicaZAdresu("al. Pokoju 5") === "Pokoju");
sprawdz("pusty adres", ulicaZAdresu("") === null);

if (bledy) {
  console.error(`\nOtodom: ${bledy} błędów.`);
  process.exit(1);
}
console.log("Mapowanie Otodom w porządku.");
