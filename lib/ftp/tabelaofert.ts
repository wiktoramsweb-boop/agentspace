// Plik z ofertami w formacie importu TabelaOfert.pl. Bez importów: czyta to
// serwer (wysyłka) i test (`npm run test:portale`).
//
// Specyfikacja: „Dokumentacja techniczna formatu importu danych” TabelaOfert.pl
// (2022). Dane idą w paczce ZIP: plik oferty.xml i zdjęcia JPG. Wysyłamy
// eksport pełny (`calosc`): portal zostawia dokładnie oferty z pliku.

export type OfertaTo = {
  id: string;
  offer_no?: string | null;
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
  city?: string | null;
  address: string | null;
  export_address_mode?: string | null;
  admin_fee_pln?: number | null;
  updated_at?: string | null;
  details?: Record<string, unknown> | null;
};

export type AgentTo = { imie: string; email: string | null; telefon: string | null };
export type UrzedoweTo = { wojewodztwo: string | null; powiat: string | null; gmina: string | null };
export type ZdjecieTo = { plik: string; rzut: boolean };

const DZIALY: Record<string, string> = { mieszkanie: "mieszkania", pokoj: "mieszkania", dom: "domy", dzialka: "dzialki", lokal: "lokale", magazyn: "lokale", obiekt: "lokale", budynek: "lokale" };

/** Dział pliku: rodzaj nieruchomości i sprzedaż albo wynajem. `null`, gdy portal nie ma takiego działu. */
export function dzialTo(propertyType: string, dealKind: string): { tab: string; typ: "sprzedaz" | "wynajem" } | null {
  const tab = DZIALY[propertyType];
  return tab ? { tab, typ: dealKind === "wynajem" ? "wynajem" : "sprzedaz" } : null;
}

/** Identyfikator oferty: do 16 znaków, litery, cyfry i / - _. Stały dla tej samej oferty. */
export function idTo(o: { id: string; offer_no?: string | null }): string {
  const nr = String(o.offer_no ?? "").replace(/[^A-Za-z0-9/_-]/g, "-").slice(0, 16);
  return nr.length >= 3 ? nr : o.id.replace(/-/g, "").slice(0, 16);
}

/** Piętro jako liczba: parter 0, suterena -1. Bez wiedzy `null`. */
export function pietroTo(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v) : null;
  const t = v.toLowerCase().trim();
  if (/parter/.test(t)) return 0;
  if (/suteren|przyziem/.test(t)) return -1;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
const kwota = (n: number) => n.toFixed(2);

function opisHtml(tekst: string | null): string {
  const t = String(tekst ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
  return t
    .split(/\n{2,}/)
    .map((akapit) => `<p>${esc(akapit.trim()).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

const ulicaZAdresu = (adres: string | null | undefined): string | null => {
  const czesci = String(adres ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const a = czesci[0] && /^\d+[a-z]?(\s*\/\s*\d+[a-z]?)?$/i.test(czesci[0]) ? (czesci[1] ?? "") : (czesci[0] ?? "");
  const bez = a.replace(/\s+\d+[a-z]?(\s*\/\s*\d+[a-z]?)?\s*$/i, "").trim();
  return bez.length >= 2 ? bez : null;
};

export type WynikTo = { ok: true; dzial: { tab: string; typ: string }; xml: string } | { ok: false; bledy: string[] };

/**
 * Jedna oferta jako element <oferta> albo lista braków po polsku. Wymagania
 * z dokumentacji: miasto, cena, metraż (mieszkania i domy) albo powierzchnia,
 * a w mieszkaniach liczba pokoi i piętro. Minimalna cena domów i mieszkań to
 * 1000 zł (najem 100 zł), minimalny metraż 15 m².
 */
export function ofertaTo(o: OfertaTo, u: UrzedoweTo, agent: AgentTo | null, zdjecia: ZdjecieTo[], dzis: string): WynikTo {
  const bledy: string[] = [];
  const dzial = dzialTo(o.property_type, o.deal_kind);
  if (!dzial) bledy.push("Ten rodzaj nieruchomości nie ma działu na TabelaOfert.");
  const miasto = (o.city ?? "").trim();
  if (!miasto) bledy.push("Uzupełnij miasto w adresie oferty.");
  const cena = o.price_pln ?? 0;
  const mieszkalne = dzial?.tab === "mieszkania" || dzial?.tab === "domy";
  const minCena = dzial?.typ === "wynajem" ? 100 : 1000;
  if (cena <= 0) bledy.push("Uzupełnij cenę.");
  else if (mieszkalne && cena < minCena) bledy.push(`Cena musi wynosić co najmniej ${minCena} zł.`);
  const pow = dzial?.tab === "dzialki" ? (o.plot_area_m2 ?? o.area_m2 ?? 0) : (o.area_m2 ?? 0);
  if (pow <= 0) bledy.push(dzial?.tab === "dzialki" ? "Uzupełnij powierzchnię działki." : "Uzupełnij metraż.");
  else if (mieszkalne && pow < 15) bledy.push("Metraż musi wynosić co najmniej 15 m².");
  const pietro = pietroTo(o.floor);
  if (dzial?.tab === "mieszkania") {
    if (!(o.rooms && o.rooms > 0)) bledy.push("Uzupełnij liczbę pokoi.");
    if (pietro == null) bledy.push("Uzupełnij piętro.");
  }
  if (bledy.length || !dzial) return { ok: false, bledy };

  const det = o.details ?? {};
  const dzielnica = typeof det.dzielnica === "string" ? det.dzielnica.trim() : "";
  const ulica = o.export_address_mode === "dzielnica" ? null : (typeof det.adres_ulica === "string" && det.adres_ulica.trim()) || ulicaZAdresu(o.address);
  const data = String(o.updated_at ?? dzis).slice(0, 10);

  const p = (nazwa: string, typ: "text" | "integer" | "float" | "boolean", v: string | number | null | undefined) =>
    v == null || v === "" ? "" : `        <param nazwa="${nazwa}" typ="${typ}">${typeof v === "string" ? (nazwa === "opis" ? cdata(v) : esc(v)) : v}</param>\n`;

  const xml =
    `      <oferta>\n` +
    `        <id>${esc(idTo(o))}</id>\n` +
    `        <cena waluta="PLN">${kwota(cena)}</cena>\n` +
    p("dataaktualizacji", "text", data) +
    p("wojewodztwo", "text", u.wojewodztwo) +
    p("powiat", "text", u.powiat) +
    p("gmina", "text", u.gmina) +
    p("miasto", "text", miasto) +
    p("dzielnica", "text", dzielnica || null) +
    p("ulica", "text", ulica) +
    p("lokalizacjawidoczna", "boolean", o.export_address_mode === "pelny" ? "tak" : "nie") +
    p("powierzchnia", "float", kwota(pow)) +
    p("pietro", "integer", dzial.tab === "mieszkania" || dzial.tab === "lokale" ? pietro : null) +
    p("liczbapokoi", "integer", mieszkalne && o.rooms ? o.rooms : null) +
    p("rokbudowy", "integer", o.year_built && o.year_built > 1000 && o.year_built < 2100 ? o.year_built : null) +
    p("liczbapieter", "integer", o.floors_total && o.floors_total > 0 ? o.floors_total : null) +
    p("powierzchniadzialki", "float", dzial.tab === "domy" && o.plot_area_m2 ? kwota(o.plot_area_m2) : null) +
    p("czynsz", "float", o.admin_fee_pln && o.admin_fee_pln > 0 ? kwota(o.admin_fee_pln) : null) +
    p("opis", "text", opisHtml(o.description) || null) +
    p("agent_nazwisko", "text", agent?.imie ?? null) +
    p("agent_email", "text", agent?.email ?? null) +
    p("agent_tel_kom", "text", agent?.telefon ?? null) +
    (zdjecia.some((z) => !z.rzut) ? `        <zdjecia>\n${zdjecia.filter((z) => !z.rzut).map((z) => `          <zdjecie>${esc(z.plik)}</zdjecie>\n`).join("")}        </zdjecia>\n` : "") +
    (zdjecia.some((z) => z.rzut) ? `        <rzuty>\n${zdjecia.filter((z) => z.rzut).map((z) => `          <rzut>${esc(z.plik)}</rzut>\n`).join("")}        </rzuty>\n` : "") +
    `      </oferta>\n`;
  return { ok: true, dzial, xml };
}

/** Cały plik oferty.xml z ofert pogrupowanych w działy. */
export function dokumentTo(oferty: { dzial: { tab: string; typ: string }; xml: string }[], nazwaBiura: string, teraz: string): string {
  const grupy = new Map<string, string[]>();
  for (const o of oferty) {
    const k = `${o.dzial.tab}|${o.dzial.typ}`;
    grupy.set(k, [...(grupy.get(k) ?? []), o.xml]);
  }
  const dzialy = [...grupy]
    .map(([k, lista]) => {
      const [tab, typ] = k.split("|");
      return `    <dzial tab="${tab}" typ="${typ}">\n${lista.join("")}    </dzial>\n`;
    })
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n<plik>\n  <header>\n` +
    `    <informacje>AgentSpace</informacje>\n` +
    `    <agencja>${esc(nazwaBiura)}</agencja>\n` +
    `    <data>${teraz}</data>\n` +
    `    <cel>tabelaofert.pl</cel>\n` +
    `    <zawartosc_pliku>calosc</zawartosc_pliku>\n` +
    `  </header>\n  <lista_ofert>\n${dzialy}  </lista_ofert>\n</plik>\n`
  );
}
