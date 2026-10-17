import { doPuwg92, wycenRcn, type CelWyceny, type TransakcjaRcn, type WynikWyceny } from "./rcn-wycena";

/**
 * Pobieranie transakcji z Rejestru Cen Nieruchomości (usługa WFS GUGiK).
 * Dane są jawne i bezpłatne od 13.02.2026. Usługa zwraca GML; czytamy go
 * prostym parserem, bo potrzebujemy kilkunastu płaskich pól.
 */

const USLUGA = "https://mapy.geoportal.gov.pl/wss/service/rcn";

function pole(f: string, nazwa: string): string {
  const m = f.match(new RegExp(`<ms:${nazwa}[^>]*>([\\s\\S]*?)</ms:${nazwa}>`));
  if (!m) return "";
  const czas = m[1].match(/<gml:timePosition>([^<]*)<\/gml:timePosition>/);
  return (czas ? czas[1] : m[1]).trim();
}

const liczba = (v: string) => (v === "" ? null : Number(v));

export function czytajGml(xml: string): TransakcjaRcn[] {
  const wynik: TransakcjaRcn[] = [];
  for (const f of xml.match(/<ms:lokale[\s\S]*?<\/ms:lokale>/g) ?? []) {
    const pos = f.match(/<gml:pos>([\d.]+)\s+([\d.]+)<\/gml:pos>/);
    if (!pos) continue;
    wynik.push({
      id: pole(f, "gid"),
      transakcja: pole(f, "TRAN_OZNACZENIE_TRANS") || pole(f, "gid"),
      data: pole(f, "DOK_DATA").slice(0, 10) || null,
      rodzaj: pole(f, "TRAN_RODZAJ_TRANS"),
      rynek: pole(f, "TRAN_RODZAJ_RYNKU") || null,
      funkcja: pole(f, "LOK_FUNKCJA"),
      pow: Number(pole(f, "LOK_POW_UZYT")) || 0,
      izby: liczba(pole(f, "LOK_LICZBA_IZB")),
      pietro: liczba(pole(f, "LOK_NR_KOND")),
      cenaTransakcji: Number(pole(f, "TRAN_CENA_BRUTTO")) || 0,
      cenaLokalu: liczba(pole(f, "LOK_CENA_BRUTTO")),
      adres: pole(f, "LOK_ADRES"),
      x: Number(pos[1]),
      y: Number(pos[2]),
    });
  }
  return wynik;
}

async function pobierz(x: number, y: number, promien: number): Promise<TransakcjaRcn[]> {
  const bbox = [x - promien, y - promien, x + promien, y + promien].map((v) => v.toFixed(0)).join(",");
  // Oś x (północ) idzie pierwsza: tak usługa czyta EPSG:2180. Najnowsze akty pierwsze.
  const url = `${USLUGA}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ms:lokale&COUNT=1000&SORTBY=DOK_DATA%20DESC&BBOX=${bbox},urn:ogc:def:crs:EPSG::2180`;
  // Bez pamięci podręcznej Next: odpowiedź na 1000 aktów ma ok. 2,6 MB, a limit pamięci to 2 MB.
  const r = await fetch(url, { signal: AbortSignal.timeout(25000), cache: "no-store" });
  if (!r.ok) throw new Error(`RCN odpowiedział ${r.status}`);
  return czytajGml(await r.text());
}

export type WycenaRcn = { wynik: WynikWyceny | null; promien: number; pobrane: number; blad?: string };

/** Szuka porównań coraz szerzej, aż będzie ich dość. */
export async function wycenaZRcn(lat: number, lng: number, cel: Omit<CelWyceny, "x" | "y">): Promise<WycenaRcn> {
  const { x, y } = doPuwg92(lat, lng);
  let ostatni: WycenaRcn = { wynik: null, promien: 0, pobrane: 0 };
  for (const promien of [1000, 2000, 3500]) {
    try {
      const tr = await pobierz(x, y, promien);
      const wynik = wycenRcn(tr, { ...cel, x, y });
      ostatni = { wynik, promien, pobrane: tr.length };
      if (wynik && wynik.liczba >= 25) return ostatni;
    } catch (e) {
      return { ...ostatni, blad: e instanceof Error ? e.message : "Brak połączenia z RCN" };
    }
  }
  return ostatni;
}
