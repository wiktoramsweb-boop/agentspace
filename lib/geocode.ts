/**
 * Geokodowanie adresów przez OpenStreetMap (Nominatim).
 *
 * Wydzielone z trasy API, bo korzysta z tego i front (podpowiadanie adresu),
 * i kod serwera (wycena, gdy agent wpisał adres, ale nie wybrał podpowiedzi).
 *
 * Nominatim wymaga nagłówka User-Agent i prosi o maksymalnie jedno zapytanie
 * na sekundę, dlatego nigdy nie wołamy go prosto z przeglądarki, a odpowiedzi
 * trzymamy w cache na dobę.
 */

export type GeoResult = {
  label: string;
  city: string | null;
  /** Ulica z numerem - z niej układamy nazwę oferty. */
  street: string | null;
  lat: number;
  lng: number;
};

type NominatimItem = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    road?: string;
    house_number?: string;
  };
};

export async function geocodePl(query: string, limit = 6): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      format: "jsonv2",
      addressdetails: "1",
      limit: String(limit),
      countrycodes: "pl",
      "accept-language": "pl",
      q,
    }).toString();

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "AgentSpace/1.0 (https://agentspace.pl)",
        "Accept-Language": "pl",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as NominatimItem[];
    return (data ?? []).map((r) => ({
      label: r.display_name,
      city:
        r.address?.city ?? r.address?.town ?? r.address?.village ?? r.address?.municipality ?? null,
      street: [r.address?.road, r.address?.house_number].filter(Boolean).join(" ") || null,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
}
