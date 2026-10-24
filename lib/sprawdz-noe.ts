/** Sprawdzenie pliku NOE 2.0 dla Nieruchomosci-online (`npm run test:noe`). */
import { writeFileSync } from "node:fs";
import { dokumentNoe, idAgentaNoe, idWojewodztwa, nazwaZdjecia, opisNoe, pietroNoe, polaOferty, type OfertaNoe } from "./ftp/noe.ts";

let bledy = 0;
const sprawdz = (nazwa: string, ok: boolean) => {
  if (!ok) {
    bledy++;
    console.error("✗", nazwa);
  }
};

const oferta: OfertaNoe = {
  id: "8b994ab8-babb-41c5-a894-88053c61727c",
  offer_no: "DEMO-029",
  agent_id: "c3b3f0b5-c5da-4340-b33f-7b12def00b8a",
  deal_kind: "sprzedaz",
  property_type: "mieszkanie",
  description: "<p><strong>Słoneczne</strong> mieszkanie & balkon</p><ul><li>3 pokoje</li><li>blisko tramwaju ]]> test</li></ul>",
  price_pln: 950000,
  area_m2: 57,
  rooms: 3,
  floor: "3",
  floors_total: 3,
  year_built: 1958,
  market: "Wtórny",
  ownership: "Pełna własność",
  building_type: "Blok",
  condition_std: "Do zamieszkania",
  heating: "Miejskie",
  lat: 50.07,
  lng: 19.92,
  city: "Kraków",
  address: "Wrocławska 48-50, Krowodrza, Kraków",
  export_address_mode: "ulica",
  admin_fee_pln: 650,
  details: { dzielnica: "Krowodrza", adres_ulica: "Wrocławska", winda: "Nie", balkon_m2: "4,5", kuchnia: "Osobna", okna: "Plastikowe", wyposazenie: ["Lodówka", "Zmywarka", "Meble"], bezpieczenstwo: ["Domofon"] },
};
const u = { wojewodztwo: "województwo małopolskie", powiat: "Kraków", gmina: "Kraków" };

const w = polaOferty(oferta, u, true);
sprawdz("oferta przechodzi", w.ok);
if (w.ok) {
  const p = Object.fromEntries(w.pola);
  sprawdz("kategoria mieszkanie", p.idCategory === 1 && p.idAdType === 1);
  sprawdz("województwo", p.idRegion === 6);
  sprawdz("piętro", p.floor === 3);
  sprawdz("winda nie = 2", p.isElevator === 2);
  sprawdz("blok", p.idBuildingType === 3);
  sprawdz("stan dobry", p.idConditionType === 14);
  sprawdz("własność", p.idOwnershipType === 8);
  sprawdz("ogrzewanie miejskie", JSON.stringify(p.jHeatingType) === "[6]");
  sprawdz("cena za m2", p.pricePM === 16666.67);
  sprawdz("balkon", p.isBalcony === 1 && p.areaBalcony === 4.5);
  sprawdz("AGD", JSON.stringify(p.jEquipment) === "[1,4]");
  sprawdz("umeblowane", p.isFurnished === 1);
  sprawdz("czynsz", p.rent === 650);
  sprawdz("ulica bez numeru", p.street === "Wrocławska");
  sprawdz("opis bez HTML", typeof p.description === "string" && !p.description.includes("<strong>") && p.description.includes("• 3 pokoje"));
  const xml = dokumentNoe([{ id: oferta.agent_id, imie: "Jan Kowalski", email: "jan@biuro.pl", telefon: "+48 600 100 200" }], [
    { pola: w.pola, lat: oferta.lat, lng: oferta.lng, zdjecia: [{ plik: nazwaZdjecia("https://x/1.webp"), rzut: false }, { plik: "rzut.jpg", rzut: true }] },
  ]);
  writeFileSync(new URL("../.noe-test.xml", import.meta.url), xml);
  sprawdz("nagłówek", xml.includes("<type>full</type>") && xml.includes("<softwareName>AgentSpace</softwareName>"));
  sprawdz("agent", xml.includes(`<idAgent>${idAgentaNoe(oferta.agent_id)}</idAgent>`) && xml.includes("<surname>Kowalski</surname>") && xml.includes("<phone>+48600100200</phone>"));
  sprawdz("CDATA rozbite", xml.includes("]]]]><![CDATA[>"));
  sprawdz("ampersand w CDATA zostaje", xml.includes("mieszkanie & balkon"));
  sprawdz("rzut w plans", xml.includes("<plan><fileName>rzut.jpg</fileName></plan>"));
}

sprawdz("braki", !polaOferty({ ...oferta, price_pln: null, city: "" }, { wojewodztwo: null, powiat: null, gmina: null }, false).ok);
const dz = polaOferty({ ...oferta, property_type: "dzialka", plot_area_m2: 1200, details: { typ_dzialki: "Budowlana" } }, u, true);
sprawdz("działka", dz.ok && Object.fromEntries(dz.pola).idPlotType === 1 && Object.fromEntries(dz.pola).area === 1200);
sprawdz("dom bez działki odpada", !polaOferty({ ...oferta, property_type: "dom" }, u, true).ok);
sprawdz("parter", pietroNoe("Parter") === 0 && pietroNoe("Suterena") === -1 && pietroNoe("> 10") === 11);
sprawdz("województwo z nazwy", idWojewodztwa("Śląskie") === 12 && idWojewodztwa("kujawsko-pomorskie") === 2);
sprawdz("nazwa zdjęcia stała", nazwaZdjecia("a") === nazwaZdjecia("a") && nazwaZdjecia("a") !== nazwaZdjecia("b"));
sprawdz("opis tekstowy zostaje", opisNoe("Zwykły\ntekst") === "Zwykły\ntekst");

if (bledy) {
  console.error(`${bledy} błędów`);
  process.exit(1);
}
console.log("Plik NOE w porządku.");
