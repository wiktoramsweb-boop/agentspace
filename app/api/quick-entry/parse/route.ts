import { getCurrentUser } from "@/lib/auth";
import { createAnthropic, COACH_MODEL } from "@/lib/ai/client";

export const maxDuration = 45;

const SYSTEM = `Jesteś asystentem agenta nieruchomości. Agent po spotkaniu dyktuje krótką relację (mowa zamieniona na tekst, może być niechlujna). Twoim zadaniem jest wyciągnąć z tego uporządkowane dane do CRM i wywołać narzędzie zapisz_wpis.

Zasady:
- client_name: imię i nazwisko klienta (popraw oczywiste błędy rozpoznawania mowy).
- phone: numer telefonu jeśli podany, inaczej null.
- client_type: "sprzedajacy" (właściciel chcący sprzedać / spotkanie pozyskowe), "kupujacy" (szuka do kupna), "wynajmujacy" (właściciel chcący wynająć), "najemca" (szuka do wynajęcia), "inny" gdy niejasne. Spotkanie pozyskowe = sprzedajacy.
- address: pełny adres nieruchomości jeśli podany (np. "ul. Prądnicka 34/23"), inaczej null.
- city: miasto jeśli wynika z kontekstu, inaczej null (domyślnie okolica to Kraków, ale nie zgaduj jeśli nie ma).
- create_property: true jeśli podano adres nieruchomości (wtedy warto dodać ją do bazy), inaczej false.
- property_title: krótka nazwa oferty na podstawie adresu/kontekstu (np. "Mieszkanie ul. Prądnicka 34/23"), inaczej null.
- note: notatka ze spotkania - zachowaj sens i szczegóły tego, co powiedział agent, lekko uporządkowane, po polsku. Nie skracaj drastycznie, nie dodawaj rzeczy, których nie było.
INTERPUNKCJA: w polu note nie używaj myślnika ani półpauzy (znaki — i –); stosuj przecinek, dwukropek lub kropkę.
Zawsze wywołaj narzędzie zapisz_wpis z wszystkimi polami.`;

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
      max_tokens: 700,
      system: SYSTEM,
      tools: [
        {
          name: "zapisz_wpis",
          description: "Zapisuje uporządkowane dane spotkania do CRM.",
          input_schema: {
            type: "object",
            properties: {
              client_name: { type: "string" },
              phone: { type: ["string", "null"] },
              client_type: { type: "string", enum: ["sprzedajacy", "kupujacy", "wynajmujacy", "najemca", "inny"] },
              address: { type: ["string", "null"] },
              city: { type: ["string", "null"] },
              create_property: { type: "boolean" },
              property_title: { type: ["string", "null"] },
              note: { type: "string" },
            },
            required: ["client_name", "client_type", "create_property", "note"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "zapisz_wpis" },
      messages: [{ role: "user", content: transcript }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return new Response(JSON.stringify({ error: "Nie udało się rozpoznać danych." }), { status: 502 });
    }
    return Response.json({ data: toolUse.input });
  } catch (err) {
    console.error("quick-entry parse error:", err);
    return new Response(JSON.stringify({ error: "Nie udało się przetworzyć (sprawdź kredyty API)." }), { status: 503 });
  }
}
