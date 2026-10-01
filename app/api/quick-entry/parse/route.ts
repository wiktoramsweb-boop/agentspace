import { brakKredytow, brakKredytowResponse } from "@/lib/kredyty";
import { getCurrentUser } from "@/lib/auth";
import { COACH_MODEL } from "@/lib/ai/client";
import { odpowiedzJson } from "@/lib/ai/struktura";

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
  if (await brakKredytow(user, "szybki_wpis")) return brakKredytowResponse();

  let body: { transcript?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Złe dane" }), { status: 400 });
  }
  const transcript = (body.transcript ?? "").trim().slice(0, 6000);
  if (!transcript) return new Response(JSON.stringify({ error: "Brak tekstu" }), { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "AI niedostępne (brak ANTHROPIC_API_KEY)." }), { status: 503 });
  }

  try {
        const wynik = await odpowiedzJson<Record<string, unknown>>({
      model: COACH_MODEL,
      maxTokens: 700,
      system: SYSTEM,
      schemat: {
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
        additionalProperties: false,
      },
      messages: [{ role: "user", content: transcript }],
    });
    return Response.json({ data: wynik });
  } catch (err) {
    console.error("quick-entry parse error:", err);
    return new Response(JSON.stringify({ error: "Nie udało się przetworzyć (sprawdź kredyty API)." }), { status: 503 });
  }
}
