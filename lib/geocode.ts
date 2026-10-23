/**
 * Podpowiadanie i geokodowanie adresów w Polsce.
 *
 * Podpowiedzi biorą się z Photon (komoot, dane OpenStreetMap): to wyszukiwarka
 * „w trakcie pisania”, więc radzi sobie z „Kraków Sołtys” albo „bochenka 3”,
 * czego Nominatim nie umie. Wynik dostaje od nas własny ranking: każde wpisane
 * słowo musi pasować do ulicy, numeru, dzielnicy albo miasta, inaczej odpada.
 * Dzięki temu na górze jest to, co agent faktycznie wpisał, a nie przypadkowy
 * budynek urzędu z drugiego końca województwa.
 *
 * Nominatim zostaje jako zapas, gdy Photon nic nie znajdzie albo nie odpowiada.
 * Oba wołamy z serwera (nagłówek User-Agent, cache na dobę).
 */

export type GeoResult = {
  label: string;
  city: string | null;
  /** Ulica z numerem - z niej układamy nazwę oferty. */
  street: string | null;
  /** Sama nazwa ulicy, bez numeru (eksport na portale). */
  streetName: string | null;
  number: string | null;
  district: string | null;
  postcode: string | null;
  lat: number;
  lng: number;
};

const UA = { "User-Agent": "AgentSpace/1.0 (https://agentspace.pl)", "Accept-Language": "pl" };

const norm = (s: string | null | undefined) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const PREFIKSY = new Set(["ul", "ulica", "al", "aleja", "aleje", "os", "osiedle", "pl", "plac", "rondo", "skwer"]);

function etykieta(r: Pick<GeoResult, "streetName" | "number" | "district" | "city">): string {
  const ulica = [r.streetName, r.number].filter(Boolean).join(" ");
  const dzielnica = r.district && r.district !== r.city ? r.district : null;
  return [ulica, dzielnica, r.city].filter(Boolean).join(", ");
}

/**
 * Ranking wyniku względem zapytania. -1 = wynik nie pasuje do któregoś słowa.
 * Liczby muszą zaczynać numer budynku, słowa muszą zaczynać któreś słowo
 * ulicy, dzielnicy albo miasta.
 */
export function punktyDopasowania(zapytanie: string, r: Pick<GeoResult, "streetName" | "number" | "district" | "city">): number {
  const slowa = norm(zapytanie)
    .split(" ")
    .filter((w) => w && !PREFIKSY.has(w));
  if (!slowa.length) return 0;
  const ulica = norm(r.streetName).split(" ");
  const miasto = norm(r.city).split(" ");
  const dzielnica = norm(r.district).split(" ");
  const numer = norm(r.number).replace(/ /g, "");
  let pkt = 0;
  for (const w of slowa) {
    if (/^\d/.test(w)) {
      // Liczba to numer budynku albo część numeru lokalu („23/4” → „23 4”).
      if (numer && numer.startsWith(w)) pkt += numer === w ? 4 : 2;
      else if (numer && numer.includes(w)) pkt += 1;
      else if (!numer) pkt -= 1;
      else return -1;
      continue;
    }
    if (w.length < 2) continue;
    if (ulica.some((u) => u.startsWith(w))) pkt += ulica.some((u) => u === w) ? 5 : 3;
    else if (miasto.some((m) => m.startsWith(w))) pkt += miasto.some((m) => m === w) ? 3 : 2;
    else if (dzielnica.some((d) => d.startsWith(w))) pkt += 1;
    else return -1;
  }
  if (r.streetName) pkt += 1;
  return pkt;
}

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: { type?: string; name?: string; street?: string; housenumber?: string; district?: string; locality?: string; city?: string; postcode?: string; county?: string };
};

async function photon(q: string, limit: number): Promise<GeoResult[]> {
  const p = new URLSearchParams({ q, limit: "15", lang: "default", bbox: "14.07,49.0,24.15,54.84" });
  for (const l of ["house", "street", "city", "district", "locality"]) p.append("layer", l);
  const res = await fetch(`https://photon.komoot.io/api/?${p}`, { headers: UA, next: { revalidate: 86400 }, signal: AbortSignal.timeout(6000) });
  if (!res.ok) return [];
  const d = (await res.json()) as { features?: PhotonFeature[] };
  const wyniki: (GeoResult & { pkt: number })[] = [];
  const widziane = new Set<string>();
  for (const f of d.features ?? []) {
    const pr = f.properties;
    const ulicaTyp = pr.type === "street";
    const streetName = pr.street ?? (ulicaTyp ? pr.name : null) ?? null;
    const city = pr.city ?? (pr.type === "city" ? pr.name : null) ?? pr.county ?? null;
    const number = pr.housenumber ?? null;
    const district = pr.district ?? pr.locality ?? (pr.type === "district" ? pr.name : null) ?? null;
    const r = { streetName, number, district, city };
    const pkt = punktyDopasowania(q, r);
    if (pkt < 0) continue;
    // Ta sama ulica w kilku odcinkach (różne kody pocztowe) to jedna podpowiedź.
    const klucz = norm(`${streetName}|${number}|${city}`);
    if (widziane.has(klucz)) continue;
    widziane.add(klucz);
    const [lng, lat] = f.geometry.coordinates;
    wyniki.push({ ...r, label: etykieta(r), street: [streetName, number].filter(Boolean).join(" ") || null, postcode: pr.postcode ?? null, lat, lng, pkt });
  }
  return wyniki
    .sort((a, b) => b.pkt - a.pkt)
    .slice(0, limit)
    .map(({ pkt: _pkt, ...r }) => r);
}

type NominatimItem = {
  lat: string;
  lon: string;
  address?: { city?: string; town?: string; village?: string; municipality?: string; road?: string; house_number?: string; suburb?: string; city_district?: string; quarter?: string; postcode?: string };
};

async function nominatim(q: string, limit: number): Promise<GeoResult[]> {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({ format: "jsonv2", addressdetails: "1", limit: String(limit), countrycodes: "pl", "accept-language": "pl", q }).toString();
  const res = await fetch(url, { headers: UA, next: { revalidate: 86400 }, signal: AbortSignal.timeout(6000) });
  if (!res.ok) return [];
  const data = (await res.json()) as NominatimItem[];
  return (data ?? []).map((x) => {
    const a = x.address ?? {};
    const r = {
      streetName: a.road ?? null,
      number: a.house_number ?? null,
      district: a.city_district ?? a.suburb ?? a.quarter ?? null,
      city: a.city ?? a.town ?? a.village ?? a.municipality ?? null,
    };
    return { ...r, label: etykieta(r), street: [r.streetName, r.number].filter(Boolean).join(" ") || null, postcode: a.postcode ?? null, lat: parseFloat(x.lat), lng: parseFloat(x.lon) };
  });
}

export async function geocodePl(query: string, limit = 6): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const p = await photon(q, limit);
    if (p.length) return p;
  } catch {
    // Photon nie odpowiada: próbujemy Nominatim.
  }
  try {
    return await nominatim(q, limit);
  } catch {
    return [];
  }
}
