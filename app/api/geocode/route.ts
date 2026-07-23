import { NextResponse } from "next/server";

// Proxy do darmowego geokodera OpenStreetMap (Nominatim).
// Dzięki temu z frontu wołamy własny endpoint (Nominatim wymaga nagłówka
// User-Agent i limitu ~1 zapytanie/s — obsługujemy to tutaj + cache 24h).

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 3) return NextResponse.json({ results: [] });

  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      format: "jsonv2",
      addressdetails: "1",
      limit: "6",
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
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = (await res.json()) as NominatimItem[];
    const results = (data ?? []).map((r) => ({
      label: r.display_name,
      city:
        r.address?.city ??
        r.address?.town ??
        r.address?.village ??
        r.address?.municipality ??
        null,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
