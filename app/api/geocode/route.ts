import { NextResponse } from "next/server";
import { geocodePl } from "@/lib/geocode";
import { getCurrentUser } from "@/lib/auth";
import { hitLimit } from "@/lib/rate-limit";

// Proxy do Nominatim. Logika siedzi w lib/geocode.ts, bo korzysta z niej
// również kod serwera (wycena), nie tylko podpowiadanie adresu na froncie.
export async function GET(request: Request) {
  // Tylko dla zalogowanych: Nominatim blokuje adres serwera za nadużycia,
  // a wtedy podpowiadanie adresów przestałoby działać wszystkim biurom.
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ results: [] }, { status: 401 });
  if (await hitLimit(`geocode:${user.id}`, 300, 3600)) return NextResponse.json({ results: [] }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const results = await geocodePl(searchParams.get("q") ?? "");
  return NextResponse.json({ results });
}
