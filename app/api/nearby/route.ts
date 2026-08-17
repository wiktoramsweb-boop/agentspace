import { NextResponse } from "next/server";

export const maxDuration = 30;

// Auto-research okolicy oferty - darmowe dane z OpenStreetMap (Overpass API).
// Zwraca najbliższe POI w kategoriach: komunikacja, edukacja, sklepy, zdrowie, zieleń.

const RADIUS = 900; // metrów

type OverpassEl = {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const CATEGORIES: { key: string; label: string; match: (t: Record<string, string>) => boolean }[] = [
  {
    key: "komunikacja",
    label: "Komunikacja",
    match: (t) =>
      t.highway === "bus_stop" ||
      t.railway === "tram_stop" ||
      t.public_transport === "station" ||
      t.station === "subway",
  },
  {
    key: "edukacja",
    label: "Edukacja",
    match: (t) => ["school", "kindergarten", "university", "college"].includes(t.amenity),
  },
  {
    key: "sklepy",
    label: "Sklepy",
    match: (t) => ["supermarket", "convenience", "mall"].includes(t.shop) || t.amenity === "marketplace",
  },
  {
    key: "zdrowie",
    label: "Zdrowie",
    match: (t) => ["pharmacy", "hospital", "clinic", "doctors"].includes(t.amenity),
  },
  {
    key: "zielen",
    label: "Zieleń i rekreacja",
    match: (t) => ["park", "playground", "garden"].includes(t.leisure),
  },
];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function labelFor(t: Record<string, string>): string {
  if (t.name) return t.name;
  if (t.highway === "bus_stop") return "Przystanek autobusowy";
  if (t.railway === "tram_stop") return "Przystanek tramwajowy";
  if (t.amenity === "school") return "Szkoła";
  if (t.amenity === "kindergarten") return "Przedszkole";
  if (t.amenity === "pharmacy") return "Apteka";
  if (t.shop === "supermarket") return "Supermarket";
  if (t.shop === "convenience") return "Sklep spożywczy";
  if (t.leisure === "park") return "Park";
  if (t.leisure === "playground") return "Plac zabaw";
  return "Punkt";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Brak współrzędnych" }, { status: 400 });
  }

  const query = `[out:json][timeout:25];
(
  node(around:${RADIUS},${lat},${lng})[highway=bus_stop];
  node(around:${RADIUS},${lat},${lng})[railway=tram_stop];
  node(around:${RADIUS},${lat},${lng})[public_transport=station];
  nwr(around:${RADIUS},${lat},${lng})[amenity~"^(school|kindergarten|university|college|pharmacy|hospital|clinic|doctors)$"];
  nwr(around:${RADIUS},${lat},${lng})[shop~"^(supermarket|convenience|mall)$"];
  nwr(around:${RADIUS},${lat},${lng})[leisure~"^(park|playground|garden)$"];
);
out center tags;`;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "AgentSpace/1.0 (https://agentspace.pl)",
      },
      body: "data=" + encodeURIComponent(query),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ error: "Overpass niedostępny" }, { status: 502 });
    const data = (await res.json()) as { elements?: OverpassEl[] };

    const result = CATEGORIES.map((cat) => {
      const items: { name: string; dist: number }[] = [];
      for (const el of data.elements ?? []) {
        const t = el.tags ?? {};
        if (!cat.match(t)) continue;
        const elat = el.lat ?? el.center?.lat;
        const elon = el.lon ?? el.center?.lon;
        if (elat == null || elon == null) continue;
        items.push({ name: labelFor(t), dist: Math.round(haversine(lat, lng, elat, elon)) });
      }
      items.sort((a, b) => a.dist - b.dist);
      // dedupe po nazwie (najbliższy egzemplarz)
      const seen = new Set<string>();
      const top = items.filter((i) => (seen.has(i.name) ? false : (seen.add(i.name), true))).slice(0, 3);
      return { key: cat.key, label: cat.label, items: top };
    }).filter((c) => c.items.length > 0);

    return NextResponse.json({ categories: result });
  } catch {
    return NextResponse.json({ error: "Błąd pobierania" }, { status: 502 });
  }
}
