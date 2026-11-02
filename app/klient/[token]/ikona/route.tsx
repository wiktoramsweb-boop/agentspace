import { dostepPoTokenie } from "@/lib/data-portal";
import { ikonaBiura } from "@/lib/ikona-biura";

/**
 * Ikona aplikacji na ekranie telefonu klienta.
 *
 * iPhone bierze pod uwagę wyłącznie `apple-touch-icon` w formacie PNG - bez
 * niego robi zrzut strony i na ekranie początkowym ląduje nieczytelny kafelek.
 * Dlatego składamy PNG tutaj, z logo biura, a gdy biuro go nie wgrało -
 * z pierwszej litery nazwy na ciemnym tle.
 *
 * Wersja „maskable" ma zapas przy krawędziach, bo Android przycina ikonę do
 * kształtu wybranego przez producenta telefonu.
 */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dostep = await dostepPoTokenie(token);
  if (!dostep) return new Response("Nie znaleziono", { status: 404 });
  return ikonaBiura(dostep.agency_id, req);
}
