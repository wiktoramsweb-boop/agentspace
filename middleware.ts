import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isOwnHost, slugForDomain } from "@/lib/site/domains";

const AUTH_PATHS = ["/app", "/login", "/signup"];

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname, search } = request.nextUrl;

  // Własna domena biura: pokazujemy jego stronę, zachowując adres w pasku.
  if (host && !isOwnHost(host)) {
    const slug = await slugForDomain(host);
    if (slug) {
      if (pathname.startsWith("/strona/")) return NextResponse.next();
      const url = request.nextUrl.clone();
      url.pathname = `/strona/${slug}${pathname === "/" ? "" : pathname}`;
      url.search = search;
      return NextResponse.rewrite(url);
    }
  }

  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return await updateSession(request);
  }

  return NextResponse.next();
}

export const config = {
  // Pomijamy pliki statyczne i obrazy, żeby middleware nie dotykał każdego
  // zdjęcia oferty. Reszta przechodzi, bo tylko tak rozpoznamy własną domenę.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|woff2?)$).*)"],
};
