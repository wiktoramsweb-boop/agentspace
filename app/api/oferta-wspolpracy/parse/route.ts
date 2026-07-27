import { getCurrentUser } from "@/lib/auth";
import { createAnthropic, COACH_MODEL } from "@/lib/ai/client";

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

  let body: { transcript?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Złe dane" }), { status: 400 });
  }
  const transcript = (body.transcript ?? "").trim();
  if (!transcript) return new Response(JSON.stringify({ error: "Brak tekstu" }), { status: 400 });

  let anthropic;
  try {
    anthropic = createAnthropic();
  } catch {
    return new Response(JSON.stringify({ error: "AI niedostępne (brak ANTHROPIC_API_KEY)." }), { status: 503 });
  }

  try {
    const response = await anthropic.messages.create({
      model: COACH_MODEL,
      max_tokens: 400,
      system: SYSTEM,
      tools: [
        {
          name: "wypelnij_oferte",
          description: "Wypełnia pola oferty współpracy na podstawie relacji agenta.",
          input_schema: {
            type: "object",
            properties: {
              adres: { type: ["string", "null"] },
              czas: { type: ["string", "null"] },
              prowizja: { type: ["string", "null"] },
            },
            required: [],
          },
        },
      ],
      tool_choice: { type: "tool", name: "wypelnij_oferte" },
      messages: [{ role: "user", content: transcript }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return new Response(JSON.stringify({ error: "Nie udało się rozpoznać danych." }), { status: 502 });
    }
    return Response.json({ data: toolUse.input });
  } catch (err) {
    console.error("oferta parse error:", err);
    return new Response(JSON.stringify({ error: "Nie udało się przetworzyć (sprawdź kredyty API)." }), { status: 503 });
  }
}
