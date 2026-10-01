import { brakKredytow, brakKredytowResponse } from "@/lib/kredyty";
import { getCurrentUser } from "@/lib/auth";
import { COACH_MODEL } from "@/lib/ai/client";
import { odpowiedzJson } from "@/lib/ai/struktura";

export const maxDuration = 45;

const SYSTEM = `Jesteś asystentem agenta nieruchomości. Agent dyktuje warunki oferty współpracy (mowa zamieniona na tekst, może być niechlujna). Wyciągnij uporządkowane dane i wywołaj narzędzie wypelnij_oferte.

Zasady:
- adres: adres nieruchomości bez przedrostka „ul." (np. z „adres Prądnicka 48" → "Prądnicka 48"). Popraw oczywiste błędy rozpoznawania mowy. null jeśli nie podano.
- czas: czas trwania współpracy jako fraza (np. "3 miesiące", "6 miesięcy"). null jeśli nie podano.
- prowizja: wysokość prowizji jako fraza (np. "2% brutto", "2,5%"). Jeśli agent poda samą liczbę procent, dopisz "% brutto". null jeśli nie podano.
Wywołuj narzędzie tylko z polami, które faktycznie padły; resztę zostaw jako null.`;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response(JSON.stringify({ error: "Nie zalogowano" }), { status: 401 });
  if (await brakKredytow(user, "parsowanie_dokumentu")) return brakKredytowResponse();

  let body: { transcript?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Złe dane" }), { status: 400 });
  }
  const transcript = (body.transcript ?? "").trim().slice(0, 4000);
  if (!transcript) return new Response(JSON.stringify({ error: "Brak tekstu" }), { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "AI niedostępne (brak ANTHROPIC_API_KEY)." }), { status: 503 });
  }

  try {
        const wynik = await odpowiedzJson<Record<string, unknown>>({
      model: COACH_MODEL,
      maxTokens: 400,
      system: SYSTEM,
      schemat: {
            type: "object",
            properties: {
              adres: { type: ["string", "null"] },
              czas: { type: ["string", "null"] },
              prowizja: { type: ["string", "null"] },
            },
            required: [],
        additionalProperties: false,
      },
      messages: [{ role: "user", content: transcript }],
    });
    return Response.json({ data: wynik });
  } catch (err) {
    console.error("oferta parse error:", err);
    return new Response(JSON.stringify({ error: "Nie udało się przetworzyć (sprawdź kredyty API)." }), { status: 503 });
  }
}
