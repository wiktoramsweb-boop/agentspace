import { createAnthropic, COACH_MODEL, SCORING_MODEL } from "./client";
import { PERSONALITIES, type ChatMessage } from "../types";

/**
 * Buduje system prompt dla AI grającego klienta: wstawia opis osobowości
 * w miejsce placeholdera {{PERSONALITY}}.
 */
export function buildClientSystemPrompt(
  scenarioSystemPrompt: string,
  personality: string,
): string {
  const p = PERSONALITIES.find((x) => x.value === personality);
  const desc = p
    ? `${p.label} — ${p.description}. Graj konsekwentnie tę postawę przez całą rozmowę.`
    : "Neutralny, przeciętny klient.";
  return scenarioSystemPrompt.replace("{{PERSONALITY}}", desc);
}

/**
 * Konwersja transkryptu (agent/client) na format wiadomości Anthropic.
 * AI gra KLIENTA, więc: wiadomości klienta = assistant, agenta = user.
 */
function toAnthropicMessages(transcript: ChatMessage[]) {
  return transcript.map((m) => ({
    role: m.role === "client" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));
}

/**
 * Streamuje kolejną odpowiedź AI klienta.
 * Zwraca ReadableStream tekstu (do przesłania do przeglądarki).
 */
export async function streamClientReply(
  scenarioSystemPrompt: string,
  personality: string,
  transcript: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const anthropic = createAnthropic();
  const system = buildClientSystemPrompt(scenarioSystemPrompt, personality);
  const messages = toAnthropicMessages(transcript);

  // Jeśli transkrypt pusty lub ostatni był od klienta — zaczynamy rozmowę
  // (AI wypowiada pierwsze zdanie). Wtedy dokładamy "user" trigger.
  const needsOpener =
    messages.length === 0 || messages[messages.length - 1].role === "assistant";
  if (needsOpener) {
    messages.push({
      role: "user",
      content: "[System: rozpocznij rozmowę zgodnie z instrukcją.]",
    });
  }

  const stream = await anthropic.messages.create({
    model: COACH_MODEL,
    max_tokens: 400,
    system: [
      {
        type: "text",
        text: system,
        // Prompt caching — system prompt jest długi i powtarza się co turę.
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
    stream: true,
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode("\n[Błąd połączenia z AI. Spróbuj ponownie.]"),
        );
        console.error("streamClientReply error:", err);
      } finally {
        controller.close();
      }
    },
  });
}

export type ScoringResult = {
  overall: number;
  opening: number;
  qualification: number;
  objection_handling: number;
  closing: number;
  summary: string;
  suggestions: string[];
};

const SCORING_SYSTEM = `Jesteś doświadczonym trenerem sprzedaży nieruchomości w Polsce. Analizujesz transkrypt sesji treningowej, w której AGENT ćwiczył rozmowę z (symulowanym) KLIENTEM.

Twoje zadanie: ocenić WYŁĄCZNIE wypowiedzi AGENTA (nie klienta) i dać konkretny, praktyczny feedback po polsku.

Oceniasz w 4 kategoriach, każda w skali 1-10:
- opening (otwarcie): jak agent rozpoczął, czy zbudował relację, czy nie był nachalny
- qualification (kwalifikacja): czy agent zadawał dobre pytania, poznał potrzeby/sytuację klienta
- objection_handling (obsługa obiekcji): jak agent reagował na opór, wątpliwości, "nie"
- closing (zamknięcie): czy agent zaproponował konkretny następny krok, umówił spotkanie/działanie

overall: ogólna ocena 1-10 (nie musi być średnią — uwzględnij całościowe wrażenie).

summary: 2-3 zdania podsumowania po polsku — co poszło dobrze, co najważniejsze do poprawy.

suggestions: 2-4 KONKRETNE wskazówki po polsku. Każda odnosi się do tego co agent FAKTYCZNIE powiedział (lub czego nie powiedział). Cytuj/parafrazuj realne momenty. Dawaj gotowe sformułowania których agent może użyć następnym razem. NIE ogólniki.

Bądź sprawiedliwy ale wymagający. Jeśli rozmowa była krótka lub agent zrobił mało — niższe oceny. Odpowiadasz TYLKO w formacie JSON, bez dodatkowego tekstu.`;

/**
 * Ocenia zakończoną sesję. Zwraca strukturę scoringu.
 */
export async function scoreSession(
  scenarioTitle: string,
  transcript: ChatMessage[],
): Promise<ScoringResult> {
  const anthropic = createAnthropic();

  const dialogue = transcript
    .map((m) => `${m.role === "agent" ? "AGENT" : "KLIENT"}: ${m.content}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: SCORING_MODEL,
    max_tokens: 1024,
    system: SCORING_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Scenariusz: ${scenarioTitle}\n\nTranskrypt rozmowy:\n\n${dialogue}\n\nOceń wypowiedzi agenta. Zwróć wynik jako JSON o strukturze:\n{\n  "overall": <1-10>,\n  "opening": <1-10>,\n  "qualification": <1-10>,\n  "objection_handling": <1-10>,\n  "closing": <1-10>,\n  "summary": "<2-3 zdania>",\n  "suggestions": ["<wskazówka 1>", "<wskazówka 2>", ...]\n}`,
      },
      {
        // Prefill — wymusza czysty JSON.
        role: "assistant",
        content: "{",
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");

  const raw = "{" + text;
  const parsed = JSON.parse(extractJson(raw)) as ScoringResult;

  // Sanity clamp 1-10
  const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n || 1)));
  return {
    overall: clamp(parsed.overall),
    opening: clamp(parsed.opening),
    qualification: clamp(parsed.qualification),
    objection_handling: clamp(parsed.objection_handling),
    closing: clamp(parsed.closing),
    summary: parsed.summary ?? "",
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
  };
}

/** Wyciąga pierwszy pełny obiekt JSON z tekstu. */
function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Brak JSON w odpowiedzi scoringu");
  return text.slice(start, end + 1);
}
