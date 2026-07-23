// Generator opisów ogłoszeń nieruchomości — w pełni szablonowy (bez AI, za darmo).
// Składa profesjonalny opis w stylu Spectra z parametrów wpisanych przez agenta.
// Sekcje bez treści są pomijane, więc można wypełnić tyle, ile się chce.

export type Transakcja = "sprzedaz" | "wynajem";

export type Pomieszczenie = { name: string; area: string; desc: string };

export type OpisInput = {
  transakcja: Transakcja;
  typLabel: string; // np. "MIESZKANIE", "DOM"
  // nagłówek
  customTitle: string; // jeśli podany, nadpisuje auto-tytuł
  pokoje: string;
  metraz: string;
  miasto: string;
  dzielnica: string;
  ulica: string;
  naglowekAtut: string; // np. "Z 20 m² TARASEM, GARAŻEM I KOMÓRKĄ"
  // wstęp
  intro: string;
  klucze: boolean;
  // podstawowe informacje
  status: string;
  pietro: string;
  budynek: string;
  rokBudowy: string;
  ogrzewanie: string;
  stanPrawny: string;
  // układ
  ukladWstep: string;
  rooms: Pomieszczenie[];
  // atuty
  atuty: string[];
  // lokalizacja
  lokalizacjaWstep: string;
  komunikacja: string;
  zielen: string;
  infrastruktura: string;
  // potencjał (opcjonalny blok narracyjny)
  potencjal: string;
  // finanse
  cena: string; // sprzedaż: cena; wynajem: odstępne
  cenaDodatki: string; // np. "Miejsce w garażu + komórka: 50 000 zł"
  czynszAdmin: string;
  media: string;
  kaucja: string; // wynajem
  // domknięcie
  rekomendacja: string;
  dostepnosc: string;
  english: boolean;
};

const SPECTRA_SPRZEDAZ = `AGENCJA NIERUCHOMOŚCI SPECTRA
W Spectra dbamy o to, by zakup nieruchomości był dla Ciebie czystą przyjemnością, a nie stosem dokumentów. Kupując z nami, zyskujesz:

* Wsparcie kredytowe: nasi eksperci bezpłatnie znajdą dla Ciebie najlepsze finansowanie z 14 banków w jednym miejscu.
* Bezpieczeństwo i czas: bierzemy na siebie kompletowanie dokumentacji, weryfikację prawną i koordynację transakcji aż do notariusza.
* Zarządzanie najmem: jeżeli kupujesz inwestycyjnie - znajdziemy najemcę, zweryfikujemy go w Simpl.rent, prowadzimy umowy najmu okazjonalnego u zaufanego notariusza i obsługujemy nieruchomość na co dzień.`;

const SPECTRA_WYNAJEM = `DLACZEGO WARTO WYNAJĄĆ TO MIESZKANIE Z NAMI?
Dysponujemy kluczami do oferowanego mieszkania, dzięki czemu gwarantujemy Państwu maksymalną elastyczność czasową. Prezentacja jest możliwa w dowolnym, dogodnym dla Państwa dniu oraz o elastycznych godzinach - również wieczorami oraz w weekendy. Jako jedno z najlepiej ocenianych biur nieruchomości w Krakowie (ponad 90 opinii 5.0 na Google) zadbamy o pełne bezpieczeństwo transakcji oraz kompletność dokumentacji - w tym profesjonalną umowę najmu i protokół zdawczo-odbiorczy.`;

const DISCLAIMER_SPRZEDAZ = `Zgodnie z ustawą o gospodarce nieruchomościami przed oglądnięciem nieruchomości należy podpisać standardową umowę pośrednictwa. Treść niniejszego ogłoszenia nie stanowi oferty handlowej w rozumieniu Kodeksu Cywilnego.`;

const DISCLAIMER_WYNAJEM = `Zgodnie z ustawą o gospodarce nieruchomościami (Rozdział 2, Art. 180, pkt 3, Ustawa z dnia 21 sierpnia 1997 r. o gospodarce nieruchomościami) przed oglądnięciem nieruchomości należy podpisać standardową umowę pośrednictwa w najmie. Treść niniejszego ogłoszenia nie stanowi oferty handlowej w rozumieniu Kodeksu Cywilnego.`;

function t(v: string): string {
  return (v ?? "").trim();
}

/** Buduje nagłówek (tytuł) ogłoszenia z pól lub zwraca własny. */
function buildTitle(i: OpisInput): string {
  if (t(i.customTitle)) return t(i.customTitle).toUpperCase();
  const parts: string[] = [];
  if (t(i.pokoje)) parts.push(`${t(i.pokoje)}-POKOJOWE`);
  parts.push(t(i.typLabel) || "MIESZKANIE");
  if (t(i.metraz)) parts.push(`${t(i.metraz)} m²`);
  if (t(i.naglowekAtut)) parts.push(t(i.naglowekAtut).toUpperCase());
  const left = parts.join(" ");
  const loc = [t(i.miasto), t(i.dzielnica)].filter(Boolean).join(", ");
  return loc ? `${left} - ${loc.toUpperCase()}` : left;
}

/** Sekcja z nagłówkiem i treścią; pomija gdy treść pusta. */
function section(header: string, body: string): string | null {
  const b = body.trim();
  if (!b) return null;
  return `${header}\n${b}`;
}

function bullet(label: string, value: string): string | null {
  const v = t(value);
  return v ? `* ${label}: ${v}` : null;
}

export function generateListing(i: OpisInput): string {
  const blocks: (string | null)[] = [];
  const sprzedaz = i.transakcja === "sprzedaz";

  // 1. Tytuł
  blocks.push(buildTitle(i));

  // 2. Wstęp
  if (t(i.intro)) {
    blocks.push(t(i.intro));
  }
  if (i.klucze) {
    blocks.push(
      sprzedaz
        ? "Mamy klucze do nieruchomości - prezentacja możliwa jeszcze w tym tygodniu, również wieczorami i w weekendy."
        : "Dysponujemy kluczami - prezentacja możliwa w dowolnym dniu, również wieczorami i w weekendy.",
    );
  }

  // 3. Podstawowe informacje
  const podstawowe = [
    bullet("Status", i.status),
    bullet("Metraż", i.metraz ? `${t(i.metraz)} m²` : ""),
    bullet("Piętro", i.pietro),
    bullet(
      "Budynek",
      [t(i.budynek), t(i.rokBudowy) ? `rok ${t(i.rokBudowy)}` : ""]
        .filter(Boolean)
        .join(", "),
    ),
    bullet("Ogrzewanie", i.ogrzewanie),
    bullet("Stan prawny", i.stanPrawny),
  ]
    .filter(Boolean)
    .join("\n");
  blocks.push(section("PODSTAWOWE INFORMACJE", podstawowe));

  // 4. Układ pomieszczeń
  const roomLines = i.rooms
    .filter((r) => t(r.name))
    .map((r) => {
      const head = t(r.area) ? `${t(r.name)} (${t(r.area)} m²)` : t(r.name);
      return t(r.desc) ? `* ${head}: ${t(r.desc)}` : `* ${head}`;
    })
    .join("\n");
  const uklad = [t(i.ukladWstep), roomLines].filter(Boolean).join("\n");
  const metrazHead = t(i.metraz) ? ` (${t(i.metraz)} m²)` : "";
  blocks.push(section(`UKŁAD POMIESZCZEŃ${metrazHead}`, uklad));

  // 5. Atuty
  const atutyLines = i.atuty
    .map((a) => t(a))
    .filter(Boolean)
    .map((a) => `* ${a}`)
    .join("\n");
  blocks.push(section("DODATKOWE ATUTY", atutyLines));

  // 6. Lokalizacja
  const locHeaderLoc = [t(i.miasto), t(i.dzielnica), t(i.ulica)]
    .filter(Boolean)
    .join(", ");
  const locBody = [
    t(i.lokalizacjaWstep),
    t(i.komunikacja) ? `Komunikacja i dojazd\n${t(i.komunikacja)}` : "",
    t(i.zielen) ? `Zieleń i rekreacja\n${t(i.zielen)}` : "",
    t(i.infrastruktura) ? `Infrastruktura codzienna\n${t(i.infrastruktura)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  blocks.push(
    section(`LOKALIZACJA${locHeaderLoc ? ` - ${locHeaderLoc.toUpperCase()}` : ""}`, locBody),
  );

  // 7. Potencjał inwestycyjny (opcjonalny)
  if (sprzedaz) {
    blocks.push(section("POTENCJAŁ INWESTYCYJNY", t(i.potencjal)));
  }

  // 8. Finanse
  const finanse = [
    sprzedaz
      ? bullet("Cena", i.cena)
      : bullet("Czynsz najmu (odstępne)", i.cena),
    bullet(sprzedaz ? "Dodatkowo" : "Czynsz administracyjny", sprzedaz ? i.cenaDodatki : i.czynszAdmin),
    sprzedaz ? bullet("Czynsz administracyjny", i.czynszAdmin) : bullet("Kaucja zabezpieczająca", i.kaucja),
    bullet("Media", i.media),
    sprzedaz ? bullet("Stan prawny", i.stanPrawny) : null,
  ]
    .filter(Boolean)
    .join("\n");
  blocks.push(
    section(sprzedaz ? "FINANSE I STAN PRAWNY" : "FINANSE I WARUNKI NAJMU", finanse),
  );

  // 9. Rekomendacja
  blocks.push(section("NASZA REKOMENDACJA", t(i.rekomendacja)));

  // 10. Dostępność
  if (t(i.dostepnosc)) blocks.push(t(i.dostepnosc));

  // 11. Domknięcie Spectra
  blocks.push(sprzedaz ? SPECTRA_SPRZEDAZ : SPECTRA_WYNAJEM);

  // 12. English + disclaimer
  if (i.english) blocks.push("We speak English!");
  blocks.push(sprzedaz ? DISCLAIMER_SPRZEDAZ : DISCLAIMER_WYNAJEM);

  return blocks.filter(Boolean).join("\n\n");
}
