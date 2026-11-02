import { dostepWlasciciela } from "@/lib/data-wlasciciel";
import { ikonaBiura } from "@/lib/ikona-biura";

/** Ikona aplikacji właściciela: logo biura, które zarządza jego lokalem. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await dostepWlasciciela(token);
  if (!d) return new Response("Nie znaleziono", { status: 404 });
  return ikonaBiura(d.agency_id, req);
}
