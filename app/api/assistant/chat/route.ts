import { brakKredytow, brakKredytowResponse } from "@/lib/kredyty";
import { getCurrentUser } from "@/lib/auth";
import { createAnthropic, COACH_MODEL } from "@/lib/ai/client";
import { kontekstAsystenta } from "@/lib/asystent-kontekst";
import { todayPL } from "@/lib/datetime";

export const maxDuration = 45;

const MAX_WIADOMOSCI = 12;
const MAX_ZNAKOW = 2000;

const SYSTEM = `Jesteś asystentem w AgentSpace, programie dla agentów nieruchomości w Polsce. Pomagasz agentowi w bieżącej pracy: co zrobić dalej z klientem, jak odpowiedzieć na obiekcję, jak napisać wiadomość, opis oferty albo plan dnia.
Zasady:
- Po polsku, konkretnie i krótko. Gotowe teksty do wysłania podawaj w całości, bez wstępów.
- Opieraj się na kontekście ekranu poniżej. Jeśli czegoś w nim nie ma, nie zgaduj faktów o kliencie ani ofercie, zapytaj albo zostaw miejsce do uzupełnienia w nawiasie kwadratowym.
- Nie podawaj porad prawnych ani podatkowych jako pewnych; przy umowach i podatkach odsyłaj do sprawdzenia z prawnikiem lub doradcą.
- Nie wymyślaj funkcji programu.
- Pisz zwykłym tekstem, bez markdown (bez gwiazdek i nagłówków). Listy zapisuj jako linie zaczynające się od cyfry albo znaku •.
- INTERPUNKCJA (ważne): nie używaj myślnika ani półpauzy (znaki — i –). Zamiast nich stosuj przecinek, dwukropek, kropkę albo nawias.`;

type Wiadomosc = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Nie zalogowano" }, { status: 401 });

  let body: { wiadomosci?: unknown; sciezka?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Złe dane" }, { status: 400 });
  }

  const wiadomosci: Wiadomosc[] = (Array.isArray(body.wiadomosci) ? body.wiadomosci : [])
    .filter((m): m is Wiadomosc => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_ZNAKOW) }))
    .filter((m) => m.content)
    .slice(-MAX_WIADOMOSCI);
  // API wymaga, żeby rozmowa zaczynała się i kończyła wiadomością agenta.
  while (wiadomosci.length && wiadomosci[0].role !== "user") wiadomosci.shift();
  if (!wiadomosci.length || wiadomosci[wiadomosci.length - 1].role !== "user") {
    return Response.json({ error: "Napisz pytanie" }, { status: 400 });
  }

  if (await brakKredytow(user, "asystent_czat")) return brakKredytowResponse();

  const sciezka = typeof body.sciezka === "string" ? body.sciezka.slice(0, 200) : "/app";
  const kontekst = await kontekstAsystenta(user, sciezka);

  let anthropic;
  try {
    anthropic = createAnthropic();
  } catch {
    return Response.json({ error: "AI niedostępne (brak ANTHROPIC_API_KEY)." }, { status: 503 });
  }

  try {
    const odp = await anthropic.messages.create({
      model: COACH_MODEL,
      max_tokens: 900,
      system: [
        { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
        { type: "text", text: `Dziś: ${todayPL()}. Agent: ${user.full_name ?? "agent"}.\n\nKONTEKST EKRANU:\n${kontekst || "brak"}` },
      ],
      messages: wiadomosci,
    });
    const text = odp.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return Response.json({ text });
  } catch (err) {
    console.error("AI chat error:", err);
    return Response.json({ error: "Nie udało się odpowiedzieć. Spróbuj za chwilę." }, { status: 503 });
  }
}
