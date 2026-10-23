import { odpowiedzJson } from "./ai/struktura";
import { SCORING_MODEL } from "./ai/client";

/**
 * Dane ogłoszenia do ofertówki: z linku do portalu albo z wklejonej treści.
 *
 * Otodom czytamy bez AI: strona ma pełne dane w JSON-ie osadzonym w HTML.
 * Inne portale (Morizon, Gratka, Nieruchomosci-online, Domiporta) mają różne
 * układy, więc tekst strony porządkuje AI. OLX blokuje pobieranie z serwera,
 * dlatego tam prosimy o wklejenie treści.
 *
 * Pobieramy wyłącznie z listy znanych portali: dowolny adres od użytkownika
 * pozwoliłby kazać serwerowi odpytywać sieć wewnętrzną.
 */

export type ZOgloszenia = {
  tytul: string;
  cena: string;
  lokalizacja: string;
  opis: string;
  parametry: Record<string, string>;
  zdjecia: string[];
  zrodlo: string;
};

export const PORTALE = ["otodom.pl", "olx.pl", "morizon.pl", "gratka.pl", "nieruchomosci-online.pl", "domiporta.pl", "adresowo.pl", "sprzedajemy.pl"];

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

export class BladImportu extends Error {}

export function portal(adres: string): string | null {
  try {
    const u = new URL(adres);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    return PORTALE.find((p) => host === p || host.endsWith(`.${p}`)) ?? null;
  } catch {
    return null;
  }
}

const bezHtml = (h: string) =>
  h
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|li|div|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

/** Opis na jedną kartę A4: tniemy na końcu zdania albo linii, nie w pół słowa. */
function skroc(t: string, max: number): string {
  if (t.length <= max) return t;
  const kawalek = t.slice(0, max);
  const koniec = Math.max(kawalek.lastIndexOf("\n"), kawalek.lastIndexOf(". "));
  return (koniec > max * 0.5 ? kawalek.slice(0, koniec + 1) : kawalek).trim();
}

const liczba = (v: unknown) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/* ───────────── Otodom ───────────── */

const STAN: Record<string, string> = { ready_to_use: "do wprowadzenia", to_completion: "stan deweloperski", to_renovation: "do remontu" };
const WLASNOSC: Record<string, string> = { full_ownership: "pełna własność", cooperative_ownership: "spółdzielcze własnościowe", share: "udział" };
const OGRZEWANIE: Record<string, string> = { urban: "miejskie", gas: "gazowe", electrical: "elektryczne", fireplace: "kominkowe", boiler_room: "inne", tiled_stove: "inne", other: "inne" };

function pietro(v: string | undefined, z: string | undefined): string {
  if (!v) return "";
  const p = v === "ground_floor" ? "parter" : v === "cellar" ? "suterena" : v.replace(/^floor_/, "").replace("higher_10", ">10").replace("garret", "poddasze");
  return z ? `${p}/${z}` : p;
}

function zOtodom(html: string, adres: string): ZOgloszenia {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new BladImportu("Otodom zmienił układ strony. Wklej treść ogłoszenia poniżej.");
  const ad = JSON.parse(m[1])?.props?.pageProps?.ad;
  if (!ad) throw new BladImportu("To ogłoszenie jest już nieaktywne albo link jest niepełny.");
  const ch = new Map<string, string>((ad.characteristics ?? []).map((c: { key: string; value: string }) => [c.key, String(c.value)]));
  const t = ad.target ?? {};
  const extras: string[] = Array.isArray(t.Extras_types) ? t.Extras_types : [];
  const lok = (ad.location?.reverseGeocoding?.locations ?? []) as { locationLevel: string; name: string }[];
  const nazwa = (poziom: string) => lok.find((l) => l.locationLevel === poziom)?.name;
  const ulica = ad.location?.address?.street?.name as string | undefined;
  const lokalizacja = [nazwa("city_or_village"), nazwa("district"), nazwa("residential"), ulica].filter(Boolean).join(", ");
  const cena = liczba(ch.get("price") ?? t.Price);

  const p: Record<string, string> = {};
  const area = liczba(ch.get("m") ?? t.Area);
  if (area) p.area = String(area).replace(".", ",");
  if (ch.get("rooms_num")) p.rooms = ch.get("rooms_num")!;
  const pt = pietro(ch.get("floor_no"), ch.get("building_floors_num"));
  if (pt) p.floor = pt;
  if (ch.get("build_year")) p.year = ch.get("build_year")!;
  if (ch.get("market")) p.market = ch.get("market") === "primary" ? "pierwotny" : "wtórny";
  if (STAN[ch.get("construction_status") ?? ""]) p.condition = STAN[ch.get("construction_status")!];
  if (OGRZEWANIE[ch.get("heating") ?? ""]) p.heating = OGRZEWANIE[ch.get("heating")!];
  if (WLASNOSC[ch.get("building_ownership") ?? ""]) p.ownership = WLASNOSC[ch.get("building_ownership")!];
  const balkon = extras.includes("terrace") ? "taras" : extras.includes("balcony") ? "balkon" : extras.includes("garden") ? "ogródek" : null;
  if (balkon) p.balcony = balkon;
  if (extras.includes("garage")) p.parking = "garaż podziemny";
  if (extras.includes("lift")) p.elevator = "tak";
  const czynsz = liczba(ch.get("rent"));
  if (czynsz) p.rent = String(Math.round(czynsz));
  const od = ch.get("free_from");
  if (od && /^\d{4}-\d{2}-\d{2}$/.test(od)) p.available = od.split("-").reverse().join(".");

  return {
    tytul: String(ad.title ?? "").slice(0, 120),
    cena: cena ? `${cena.toLocaleString("pl-PL")} zł` : "",
    lokalizacja,
    opis: skroc(bezHtml(String(ad.description ?? "")), 700),
    parametry: p,
    zdjecia: ((ad.images ?? []) as { large?: string; medium?: string }[]).map((i) => i.large ?? i.medium ?? "").filter(Boolean).slice(0, 8),
    zrodlo: adres,
  };
}

/* ───────────── pozostałe: AI porządkuje tekst ───────────── */

const OPCJE = {
  market: ["wtórny", "pierwotny"],
  condition: ["do wprowadzenia", "do odświeżenia", "do remontu", "stan deweloperski"],
  heating: ["miejskie", "gazowe", "elektryczne", "kominkowe", "inne"],
  ownership: ["pełna własność", "spółdzielcze własnościowe", "udział"],
  balcony: ["balkon", "taras", "loggia", "ogródek", "brak"],
  parking: ["garaż podziemny", "miejsce naziemne", "w cenie", "brak"],
  elevator: ["tak", "nie"],
};

const POLA_TEKSTOWE = ["area", "rooms", "floor", "year", "plot", "rent", "available"] as const;

export async function zTekstu(tekst: string, zrodlo: string, zdjecia: string[] = []): Promise<ZOgloszenia> {
  const wynik = await odpowiedzJson<{ tytul: string; cena: string; lokalizacja: string; opis: string; parametry: Record<string, string> }>({
    model: SCORING_MODEL,
    maxTokens: 1500,
    system:
      "Wyciągasz dane z ogłoszenia nieruchomości do karty oferty. Bierzesz wyłącznie to, co jest w tekście, nic nie zgadujesz. " +
      "Pole puste zostawiasz jako pusty tekst. Metraż jako liczba bez jednostki (np. 54,3). Piętro jako „3/5” albo „parter/4”. " +
      "Cena z jednostką, np. „649 000 zł” albo „3 200 zł/mc”. Opis to 2-4 zdania z najważniejszymi atutami, po polsku, bez wykrzykników.",
    schemat: {
      type: "object",
      properties: {
        tytul: { type: "string" },
        cena: { type: "string" },
        lokalizacja: { type: "string" },
        opis: { type: "string" },
        parametry: {
          type: "object",
          properties: {
            ...Object.fromEntries(POLA_TEKSTOWE.map((k) => [k, { type: "string" }])),
            ...Object.fromEntries(Object.entries(OPCJE).map(([k, v]) => [k, { type: "string", enum: ["", ...v] }])),
          },
          required: [...POLA_TEKSTOWE, ...Object.keys(OPCJE)],
          additionalProperties: false,
        },
      },
      required: ["tytul", "cena", "lokalizacja", "opis", "parametry"],
      additionalProperties: false,
    },
    messages: [{ role: "user", content: `TREŚĆ OGŁOSZENIA\n${tekst.slice(0, 12000)}` }],
  });
  const parametry = Object.fromEntries(Object.entries(wynik.parametry ?? {}).filter(([, v]) => typeof v === "string" && v.trim()).map(([k, v]) => [k, v.trim().slice(0, 60)]));
  return {
    tytul: (wynik.tytul ?? "").slice(0, 120),
    cena: (wynik.cena ?? "").slice(0, 40),
    lokalizacja: (wynik.lokalizacja ?? "").slice(0, 120),
    opis: (wynik.opis ?? "").slice(0, 1500),
    parametry,
    zdjecia,
    zrodlo,
  };
}

/** Zdjęcia z meta og:image i JSON-LD, gdy portal je podaje. */
function zdjeciaZHtml(html: string): string[] {
  const z = new Set<string>();
  for (const m of html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi)) z.add(m[1]);
  for (const m of html.matchAll(/"image"\s*:\s*\[([^\]]+)\]/g)) for (const u of m[1].matchAll(/"(https:[^"]+)"/g)) z.add(u[1]);
  return [...z].filter((u) => /^https:\/\//.test(u)).slice(0, 8);
}

export async function zLinku(adres: string): Promise<{ dane: ZOgloszenia; ai: boolean }> {
  const p = portal(adres);
  if (!p) throw new BladImportu(`Obsługujemy linki z portali: ${PORTALE.join(", ")}. Z innej strony wklej treść ogłoszenia.`);
  let r: Response;
  try {
    r = await fetch(adres, { headers: { "User-Agent": UA, "Accept-Language": "pl-PL,pl;q=0.9", Accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(12000) });
  } catch {
    throw new BladImportu("Portal nie odpowiedział. Spróbuj za chwilę albo wklej treść ogłoszenia.");
  }
  if (r.status === 403 || r.status === 429) {
    throw new BladImportu(`${p === "olx.pl" ? "OLX" : "Portal"} nie pozwala na automatyczne pobieranie. Skopiuj treść ogłoszenia (Ctrl+A, Ctrl+C na stronie) i wklej poniżej.`);
  }
  // Przekierowanie poza portal traktujemy jak zły link.
  if (!portal(r.url || adres)) throw new BladImportu("Link przekierował poza portal ogłoszeniowy.");
  if (!r.ok) throw new BladImportu(r.status === 404 ? "Ogłoszenie nie istnieje albo zostało zdjęte." : `Portal odpowiedział błędem ${r.status}.`);
  const html = (await r.text()).slice(0, 3_000_000);
  if (p === "otodom.pl") return { dane: zOtodom(html, adres), ai: false };
  return { dane: await zTekstu(bezHtml(html), adres, zdjeciaZHtml(html)), ai: true };
}
