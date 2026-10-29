/**
 * Sprawdzenie eksportu na TabelaOfert.pl (`npm run test:portale`).
 */
import { dokumentTo, dzialTo, idTo, ofertaTo, pietroTo, type OfertaTo } from "./ftp/tabelaofert.ts";
import { PORTALE_FTP, PORTALE_W_PRZYGOTOWANIU } from "./ftp/portale.ts";

let bledy = 0;
const sprawdz = (opis: string, ok: boolean) => {
  if (!ok) {
    bledy++;
    console.error(`BŁĄD  ${opis}`);
  }
};

const u = { wojewodztwo: "małopolskie", powiat: "Kraków", gmina: "Kraków" };
const agent = { imie: "Jan Kowalski", email: "jan@biuro.pl", telefon: "500 100 200" };
const baza: OfertaTo = {
  id: "0f5c2e1a-1111-2222-3333-444455556666",
  offer_no: "SP/12/2026",
  deal_kind: "sprzedaz",
  property_type: "mieszkanie",
  description: "Słoneczne mieszkanie & balkon.\n\nBlisko tramwaju <i>i</i> szkoły.",
  price_pln: 789000,
  area_m2: 56.4,
  rooms: 3,
  floor: "parter",
  floors_total: 4,
  year_built: 1985,
  city: "Kraków",
  address: "ul. Kalwaryjska 12/4, Kraków",
  export_address_mode: "ulica",
  details: { dzielnica: "Podgórze" },
  updated_at: "2026-10-20T10:00:00Z",
};

sprawdz("dział mieszkania sprzedaż", JSON.stringify(dzialTo("mieszkanie", "sprzedaz")) === JSON.stringify({ tab: "mieszkania", typ: "sprzedaz" }));
sprawdz("dział lokale wynajem", dzialTo("magazyn", "wynajem")?.tab === "lokale" && dzialTo("magazyn", "wynajem")?.typ === "wynajem");
sprawdz("inwestycja bez działu", dzialTo("inwestycja", "sprzedaz") === null);
sprawdz("id z numeru oferty", idTo(baza) === "SP/12/2026");
sprawdz("id najwyżej 16 znaków", idTo({ id: baza.id, offer_no: null }).length === 16);
sprawdz("parter to 0", pietroTo("parter") === 0 && pietroTo("suterena") === -1 && pietroTo(3) === 3);

const ok = ofertaTo(baza, u, agent, [{ plik: "a.jpg", rzut: false }, { plik: "r.jpg", rzut: true }], "2026-10-29");
sprawdz("poprawna oferta przechodzi", ok.ok);
if (ok.ok) {
  sprawdz("cena z dwoma miejscami", ok.xml.includes('<cena waluta="PLN">789000.00</cena>'));
  sprawdz("piętro 0 dla parteru", ok.xml.includes('nazwa="pietro" typ="integer">0<'));
  sprawdz("ulica bez numeru", ok.xml.includes(">ul. Kalwaryjska<"));
  sprawdz("opis w CDATA z akapitami", ok.xml.includes("<![CDATA[<p>Słoneczne mieszkanie &amp; balkon.</p><p>Blisko tramwaju i szkoły.</p>]]>"));
  sprawdz("zdjęcia i rzuty osobno", ok.xml.includes("<zdjecie>a.jpg</zdjecie>") && ok.xml.includes("<rzut>r.jpg</rzut>"));
  sprawdz("data aktualizacji z oferty", ok.xml.includes(">2026-10-20<"));
  const doc = dokumentTo([ok], "Biuro & Spółka", "2026-10-29 12:00:00");
  sprawdz("nagłówek pełnego eksportu", doc.includes("<zawartosc_pliku>calosc</zawartosc_pliku>") && doc.includes("<cel>tabelaofert.pl</cel>"));
  sprawdz("nazwa biura zakodowana", doc.includes("<agencja>Biuro &amp; Spółka</agencja>"));
  sprawdz("dział w pliku", doc.includes('<dzial tab="mieszkania" typ="sprzedaz">'));
}

const bezPokoi = ofertaTo({ ...baza, rooms: null, floor: null }, u, agent, [], "2026-10-29");
sprawdz("mieszkanie bez pokoi i piętra odrzucone", !bezPokoi.ok && bezPokoi.bledy.length === 2);
const male = ofertaTo({ ...baza, area_m2: 12 }, u, agent, [], "2026-10-29");
sprawdz("metraż poniżej 15 m² odrzucony", !male.ok);
const tanie = ofertaTo({ ...baza, deal_kind: "wynajem", price_pln: 80 }, u, agent, [], "2026-10-29");
sprawdz("najem poniżej 100 zł odrzucony", !tanie.ok);
const dzialka = ofertaTo({ ...baza, property_type: "dzialka", rooms: null, floor: null, area_m2: null, plot_area_m2: 900 }, u, agent, [], "2026-10-29");
sprawdz("działka bez pokoi i piętra przechodzi", dzialka.ok);
const tylkoDzielnica = ofertaTo({ ...baza, export_address_mode: "dzielnica" }, u, agent, [], "2026-10-29");
sprawdz("tryb dzielnica ukrywa ulicę", tylkoDzielnica.ok && !tylkoDzielnica.xml.includes("Kalwaryjska"));

sprawdz("unikalne id portali", new Set([...PORTALE_FTP, ...PORTALE_W_PRZYGOTOWANIU].map((p) => p.id)).size === PORTALE_FTP.length + PORTALE_W_PRZYGOTOWANIU.length);
sprawdz("bez długich myślników", !JSON.stringify([PORTALE_FTP, PORTALE_W_PRZYGOTOWANIU]).includes("—"));

if (bledy) {
  console.error(`\n${bledy} błędów.`);
  process.exit(1);
}
console.log(`Portale w porządku (${PORTALE_FTP.length} przez FTP, ${PORTALE_W_PRZYGOTOWANIU.length} w przygotowaniu).`);
