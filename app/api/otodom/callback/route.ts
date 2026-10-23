import { NextResponse, type NextRequest } from "next/server";
import { polaczKodem, sprawdzStan } from "@/lib/otodom/klient";
import { zapiszBlad } from "@/lib/blad";
import { zapiszZdarzenie } from "@/lib/dziennik";

/**
 * Powrót z autoryzacji Otodom. Kod jest ważny 60 sekund, więc wymieniamy go
 * na tokeny od razu. Biuro rozpoznajemy po podpisanym `state`, a nie po
 * sesji: Otodom może otworzyć powrót w innej karcie.
 */
export async function GET(req: NextRequest) {
  const wroc = (wynik: string) => NextResponse.redirect(new URL(`/app/ustawienia/portale?otodom=${wynik}`, req.url), 303);
  const code = req.nextUrl.searchParams.get("code");
  const stan = sprawdzStan(req.nextUrl.searchParams.get("state") ?? "");
  if (!code) return wroc("anulowano");
  if (!stan) return wroc("zly-stan");
  try {
    await polaczKodem(stan.agencyId, stan.userId, code);
    await zapiszZdarzenie({ agencyId: stan.agencyId, actorId: stan.userId, akcja: "portal_polaczony", opis: "Połączono konto Otodom", meta: { portal: "otodom" } });
    return wroc("polaczono");
  } catch (e) {
    await zapiszBlad("otodom/callback", e, { agencyId: stan.agencyId });
    return wroc("blad");
  }
}
