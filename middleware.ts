import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isOwnHost, slugForDomain } from "@/lib/site/domains";
import { MARKETING_EXACT, MARKETING_SEGMENTS, toPolishPath } from "@/lib/i18n/config";
import { DEMO_EMAIL, KOMUNIKAT_DEMO, demoMozeZapisac, emailZCiasteczek } from "@/lib/demo/tryb";

const AUTH_PATHS = ["/app", "/login", "/signup", "/witaj"];

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
    const plPath = toPolishPath(pathname.slice(3));
    return plPath === "/" ? "/en" : `/en${plPath}`;
  }

  if (pathname === "/") return "/pl";

  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0] ?? "";

  if (MARKETING_SEGMENTS.includes(first)) return `/pl${pathname}`;
  // Galeria wzorów ma wersję językową, ale same wzory stron pod nią nie.
  if (parts.length === 1 && MARKETING_EXACT.includes(first)) return `/pl${pathname}`;

  return null;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname, search } = request.nextUrl;

  // Gość wersji demo: w aplikacji i API zapis blokuje klient bazy (lib/demo/straz.ts)
  // na podstawie nagłówka x-demo. Poza nimi (reset hasła, zaproszenia) gość
  // nie ma czego wysyłać, więc odcinamy każdy POST od razu.
  const demo = emailZCiasteczek(request.cookies.getAll()) === DEMO_EMAIL;
  const dlaAplikacji: Record<string, string> = demo ? { "x-demo": demoMozeZapisac(pathname) ? "zapis" : "odczyt" } : {};
  const aplikacja = pathname === "/app" || pathname.startsWith("/app/") || pathname.startsWith("/api/");
  if (demo && !aplikacja && request.method !== "GET" && request.method !== "HEAD" && !demoMozeZapisac(pathname)) {
    return NextResponse.json({ error: KOMUNIKAT_DEMO }, { status: 403 });
  }

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
    return await updateSession(request, dlaAplikacji);
  }

  // API nie przechodzi przez updateSession, ale strażnik zapisu też musi wiedzieć o gościu.
  // Podrobiony x-demo z przeglądarki zawsze usuwamy.
  if (pathname.startsWith("/api/")) {
    const h = new Headers(request.headers);
    h.delete("x-demo");
    for (const [k, v] of Object.entries(dlaAplikacji)) h.set(k, v);
    return NextResponse.next({ request: { headers: h } });
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
  //
  // Na liście musi być też ttf: czcionki generatorów PDF leżą pod
  // /oferta/fonts/*.ttf, a bez tego wyjątku middleware brał je za adres
  // marketingowy zaczynający się od „oferta" i oddawał 404. Objaw był mylący,
  // bo pliki są na dysku, a mimo to generator umowy nie mógł ich pobrać.
  //
  // js i css z public/ (np. Leaflet w /vendor) też omijamy, inaczej na własnej
  // domenie biura zostałyby przepisane na /strona/... i mapa by nie wstała.
  //
  // xml celowo NIE jest na liście: na własnej domenie biura /sitemap.xml
  // musi trafić do mapy strony biura, a nie do mapy agentspace.pl.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|pdf|woff2?|ttf|otf|js|css)$).*)",
  ],
};
