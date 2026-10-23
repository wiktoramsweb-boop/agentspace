import { NextResponse, type NextRequest } from "next/server";

/**
 * Powrót z autoryzacji Otodom (OAuth). Otodom dokleja `code`, który wymienimy
 * na access_token, gdy będą dane aplikacji (OTODOM_CLIENT_ID i _SECRET).
 * Do tego czasu odsyłamy do ustawień z informacją.
 */
export async function GET(req: NextRequest) {
  const u = new URL("/app/ustawienia", req.url);
  u.searchParams.set("otodom", req.nextUrl.searchParams.get("code") ? "w-przygotowaniu" : "anulowano");
  return NextResponse.redirect(u, 303);
}
