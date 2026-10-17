import { getCurrentUser } from "@/lib/auth";
import { brakKredytow, brakKredytowResponse } from "@/lib/kredyty";
import { zapiszBlad } from "@/lib/blad";
import { getDyzur, promptDyzuru, turaDyzuru } from "@/lib/dyzur";

/** Próbna rozmowa z Dyżurem AI w przeglądarce: ten sam mózg co w telefonie, bez zapisu leada. */
export const maxDuration = 30;

type Wiadomosc = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.agency_id) return Response.json({ error: "Nie zalogowano" }, { status: 401 });
  let body: { wiadomosci?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Złe dane" }, { status: 400 });
  }
  const wiadomosci: Wiadomosc[] = (Array.isArray(body.wiadomosci) ? body.wiadomosci : [])
    .filter((m): m is Wiadomosc => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 500) }))
    .filter((m) => m.content)
    .slice(-16);
  if (!wiadomosci.length || wiadomosci[wiadomosci.length - 1].role !== "user") {
    return Response.json({ error: "Powiedz coś" }, { status: 400 });
  }
  if (await brakKredytow(user, "dyzur_tura")) return brakKredytowResponse();

  const cfg = await getDyzur(user.agency_id);
  try {
    const tura = await turaDyzuru(
      promptDyzuru({ nazwa: cfg.nazwa || user.agency?.name || "biuro nieruchomości", informacje: cfg.informacje, telefon: "+48500100200" }),
      wiadomosci,
    );
    return Response.json(tura);
  } catch (e) {
    await zapiszBlad("dyzur/symulacja", e, { agencyId: user.agency_id });
    return Response.json({ error: "AI chwilowo nie odpowiada." }, { status: 503 });
  }
}
