// Test: odczyt ogłoszeń i tłumaczenie na pola wyceny oraz kreatora. `npm run test:ogloszenia`
import { ofertaZOtodom, pietroZKlucza, trescOgloszenia, ulicaZTekstu, zDanychStrukturalnych, PUSTA_OFERTA } from "./ogloszenie-czytanie.ts";
import { adresOferty, ofertaZWyceny, okresZRoku, parametryWyceny, parametryZOferty, szkicOferty } from "./ogloszenie-mapy.ts";

let bledy = 0;
function sprawdz(nazwa: string, wynik: unknown, oczekiwane: unknown) {
  const a = JSON.stringify(wynik);
  const b = JSON.stringify(oczekiwane);
  if (a === b) console.log(`  ok  ${nazwa}`);
  else {
    bledy++;
    console.log(`  BŁĄD ${nazwa}: ${a} zamiast ${b}`);
  }
}

const ad = {
  title: "Mieszkanie przy ul. Podskale 12",
  description: "<p>Jasne mieszkanie.</p>",
  characteristics: [
    { key: "price", value: "489000" }, { key: "m", value: "36.5" }, { key: "rooms_num", value: "2" }, { key: "floor_no", value: "floor_3" },
    { key: "building_floors_num", value: "5" }, { key: "build_year", value: "1985" }, { key: "market", value: "secondary" },
    { key: "construction_status", value: "to_renovation" }, { key: "building_type", value: "tenement" }, { key: "heating", value: "urban" },
    { key: "building_ownership", value: "full_ownership" },
  ],
  target: { OfferType: "sprzedaz", ProperType: "mieszkanie", Extras_types: ["balcony", "lift", "garage"] },
  location: {
    coordinates: { latitude: 50.04, longitude: 19.95 },
    address: { street: null },
    reverseGeocoding: { locations: [{ locationLevel: "city_or_village", name: "Kraków" }, { locationLevel: "district", name: "Podgórze" }] },
  },
};
const o = ofertaZOtodom(ad);
sprawdz("otodom: miasto i dzielnica", [o.miasto, o.dzielnica], ["Kraków", "Podgórze"]);
sprawdz("otodom: ulica z tytułu", [o.ulica, o.numer], ["Podskale", "12"]);
sprawdz("otodom: liczby", [o.cenaPln, o.powM2, o.pokoje, o.pietro, o.pieter, o.rok], [489000, 36.5, 2, 3, 5, 1985]);
sprawdz("otodom: słowniki", [o.rynek, o.stan, o.budynek, o.ogrzewanie], ["wtorny", "do_remontu", "kamienica", "miejskie"]);
sprawdz("otodom: dodatki", [o.balkon, o.winda, o.garaz, o.taras], [true, true, true, false]);

sprawdz("parter", pietroZKlucza("ground_floor"), 0);
sprawdz("piętro", pietroZKlucza("floor_7"), 7);
sprawdz("okresy", [okresZRoku(1930), okresZRoku(1985), okresZRoku(2020), okresZRoku(null)], ["przed_1945", "1971_1990", "po_2015", ""]);
sprawdz("ulica z tekstu", ulicaZTekstu("blisko ul. Wincentego Bogdanowskiego 11, Kraków"), { ulica: "Wincentego Bogdanowskiego", numer: "11" });
sprawdz("adres", adresOferty(o), "Podskale 12, Podgórze, Kraków");

const w = parametryWyceny(o, "https://www.otodom.pl/pl/oferta/x");
sprawdz("wycena: pola", [w.pow, w.izby, w.pietro, w.pieter, w.rynek, w.stan, w.budynek, w.okres, w.winda, w.zewnatrz, w.parking], ["36.5", "2", "3", "5", "wtorny", "do_remontu", "kamienica", "1971_1990", "tak", "balkon", "garaz"]);
sprawdz("wycena: cena do porównania", w.cena_ogl, "489000");
sprawdz("wycena: najem bez ceny", parametryWyceny({ ...o, transakcja: "wynajem" }).cena_ogl, undefined);
sprawdz("wycena: obcy adres źródła odpada", parametryWyceny(o, "javascript:alert(1)").zrodlo, undefined);

const s = szkicOferty(o);
sprawdz("szkic: pola kreatora", [s.market, s.building_type, s.condition_std, s.heating, s.ownership], ["Wtórny", "Kamienica", "Do remontu", "Miejskie", "Pełna własność"]);
sprawdz("szkic: adres", [s.address, s.city, s.details.adres_ulica], ["Podskale 12, Podgórze", "Kraków", "Podskale"]);
sprawdz("szkic: opis bez znaczników z zewnątrz", szkicOferty({ ...PUSTA_OFERTA, opis: "a <b>x</b>" }).description, "<p>a &lt;b&gt;x&lt;/b&gt;</p>");

const zw = ofertaZWyceny(w);
sprawdz("z wyceny do oferty", [zw.miasto, zw.ulica, zw.numer, zw.dzielnica, zw.powM2, zw.pietro], ["Kraków", "Podskale", "12", "Podgórze", 36.5, 3]);
sprawdz("oferta z bazy do wyceny", parametryZOferty({ market: "Wtórny", year_built: 2010, condition_std: "Po remoncie", building_type: "Niski blok (do 4 pięter)", heating: "Pompa ciepła", features: { taras: true, winda: true } }), { rynek: "wtorny", okres: "2006_2015", stan: "po_remoncie", budynek: "blok", ogrzewanie: "pompa", winda: "tak", zewnatrz: "taras" });

const html = `<nav>menu menu</nav><h1>Oferta</h1><p>Treść</p><script type="application/ld+json">{"geo":{"latitude":50.01,"longitude":19.95},"description":"${"Opis ".repeat(30)}"}</script>`;
sprawdz("treść od nagłówka", trescOgloszenia(html).startsWith("Oferta"), true);
sprawdz("współrzędne z danych strukturalnych", [zDanychStrukturalnych(html).lat, zDanychStrukturalnych(html).lng], [50.01, 19.95]);
sprawdz("współrzędne poza Polską odpadają", zDanychStrukturalnych(`<script type="application/ld+json">{"geo":{"latitude":40,"longitude":3}}</script>`).lat, null);

console.log(bledy ? `\n${bledy} błędów` : "\nWszystko OK");
process.exit(bledy ? 1 : 0);
