import { NextResponse } from "next/server";
import { geocodePl } from "@/lib/geocode";

// Proxy do Nominatim. Logika siedzi w lib/geocode.ts, bo korzysta z niej
// również kod serwera (wycena), nie tylko podpowiadanie adresu na froncie.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const results = await geocodePl(searchParams.get("q") ?? "");
  return NextResponse.json({ results });
}
