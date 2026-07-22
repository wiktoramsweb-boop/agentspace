import { getCurrentUser } from "@/lib/auth";
import { createAnthropic, COACH_MODEL } from "@/lib/ai/client";

export const maxDuration = 45;

const SYSTEMS: Record<string, string> = {
  followup:
    "Jesteś asystentem agenta nieruchomości w Polsce. Piszesz krótkie, naturalne wiadomości follow-up do klienta (SMS/WhatsApp). Ton: uprzejmy, konkretny, ludzki — nie sztuczny, nie nachalny. Po polsku. Zwróć samą treść wiadomości, bez komentarzy. Max 3-4 zdania.",
  objection:
    "Jesteś trenerem sprzedaży nieruchomości w Polsce. Agent podaje obiekcję klienta. Podajesz 2-3 konkretne, gotowe do użycia odpowiedzi po polsku (każda w 1-2 zdaniach), które agent może powiedzieć. Praktyczne, oparte na wartości, nie ogólnikowe. Zwróć same odpowiedzi jako listę.",
  summary:
    "Jesteś asystentem agenta nieruchomości. Agent podaje notatki z rozmowy/spotkania. Tworzysz zwięzłe, uporządkowane podsumowanie po polsku: co ustalono, następne kroki. Krótko, rzeczowo.",
  custom:
    "Jesteś asystentem agenta nieruchomości w Polsce. Pomagasz napisać profesjonalny, naturalny tekst po polsku na podstawie prośby agenta. Zwróć samą treść.",
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response(JSON.stringify({ error: "Nie zalogowano" }), { status: 401 });

  let body: { kind?: string; context?: string; clientName?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Złe dane" }), { status: 400 });
  }

  const kind = body.kind ?? "custom";
  const context = (body.context ?? "").trim();
  const system = SYSTEMS[kind] ?? SYSTEMS.custom;

  if (!context && kind !== "followup") {
    return new Response(JSON.stringify({ error: "Podaj kontekst" }), { status: 400 });
  }

  let anthropic;
  try {
    anthropic = createAnthropic();
  } catch {
    return new Response(
      JSON.stringify({ error: "AI niedostępne (brak ANTHROPIC_API_KEY)." }),
      { status: 503 },
    );
  }

  try {
    const userMsg =
      kind === "followup"
        ? `Napisz wiadomość follow-up do klienta${body.clientName ? ` (${body.clientName})` : ""}. Kontekst: ${context || "standardowy follow-up po kontakcie, podtrzymanie relacji"}.`
        : context;

    const response = await anthropic.messages.create({
      model: COACH_MODEL,
      max_tokens: 500,
      system,
      messages: [{ role: "user", content: userMsg }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    return Response.json({ text });
  } catch (err) {
    console.error("AI write error:", err);
    return new Response(
      JSON.stringify({ error: "Nie udało się wygenerować (sprawdź kredyty API)." }),
      { status: 503 },
    );
  }
}
