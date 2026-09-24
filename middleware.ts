import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isOwnHost, slugForDomain } from "@/lib/site/domains";
import { MARKETING_SEGMENTS, SEGMENTS_REVERSED } from "@/lib/i18n/config";

const AUTH_PATHS = ["/app", "/login", "/signup"];

/**
 * Adres widoczny w pasku -> ścieżka pliku strony.
 *
 * Pliki marketingu leżą w `app/[lang]/...` pod polskimi nazwami. Polski
 * zostaje na gołych adresach (`/cennik` -> `/pl/cennik`), a angielski ma
 * własne adresy (`/en/pricing` -> `/en/cennik`). Zwraca null, gdy ścieżka
 * nie należy do marketingu - wtedy nie ruszamy jej w ogóle.
 */
function marketingPath(pathname: string): string | null {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const rest = pathname.slice(3).split("/").filter(Boolean);
    if (rest.length > 0 && SEGMENTS_REVERSED[rest[0]]) rest[0] = SEGMENTS_REVERSED[rest[0]];
    return rest.length ? `/en/${rest.join("/")}` : "/en";
  }

  if (pathname === "/") return "/pl";

  const first = pathname.split("/")[1] ?? "";
  if (MARKETING_SEGMENTS.includes(first)) return `/pl${pathname}`;

  return null;
}

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

  const target = marketingPath(pathname);
  if (target && target !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = search;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Pomijamy pliki statyczne i obrazy, żeby middleware nie dotykał każdego
  // zdjęcia oferty. Reszta przechodzi, bo tylko tak rozpoznamy własną domenę.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|woff2?)$).*)"],
};
