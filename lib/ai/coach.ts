import { createAnthropic, COACH_MODEL, SCORING_MODEL } from "./client";
import { odpowiedzJson } from "./struktura";
import { PERSONALITIES, type ChatMessage } from "../types";
import { blokOferty, faktyOferty, type KontekstOferty } from "./oferta-kontekst";

/**
 * Buduje system prompt dla AI grającego klienta: wstawia opis osobowości
 * w miejsce placeholdera {{PERSONALITY}}.
 */
const DIFFICULTY_BLOCK: Record<string, string> = {
  latwy:
    "\n\nPOZIOM TRUDNOŚCI: ŁATWY. To najważniejsza instrukcja - jesteś życzliwym, otwartym klientem. Obiekcje zgłaszasz miękko i szybko dajesz się przekonać każdemu sensownemu argumentowi. Nagradzaj nawet niedoskonałe próby agenta, bądź wyrozumiały. Celem jest zbudowanie pewności początkującego agenta, więc doprowadź rozmowę do pozytywnego zakończenia, jeśli agent w ogóle się stara.",
  sredni:
    "\n\nPOZIOM TRUDNOŚCI: ŚREDNI. Standardowy, realistyczny opór - trzymasz swoją obiekcję, ale ustępujesz przy dobrych, konkretnych argumentach. Nie oddawaj za łatwo, ale też nie bądź nadmiernie trudny.",
  trudny:
    "\n\nPOZIOM TRUDNOŚCI: TRUDNY. Jesteś wymagającym klientem - trzymasz obiekcję twardo i ustępujesz tylko przy naprawdę mocnych, konkretnych i dobrze poprowadzonych argumentach. Testuj agenta.",
};

export function buildClientSystemPrompt(
  scenarioSystemPrompt: string,
  personality: string,
  difficulty = "sredni",
  oferta?: KontekstOferty | null,
): string {
  const p = PERSONALITIES.find((x) => x.value === personality);
  const desc = p
    ? `${p.label} - ${p.description}. Graj konsekwentnie tę postawę przez całą rozmowę.`
    : "Neutralny, przeciętny klient.";
  const diff = DIFFICULTY_BLOCK[difficulty] ?? DIFFICULTY_BLOCK.sredni;
  // Klient AI ma mówić jak człowiek, a myślnik w wypowiedzi zdradza tekst z AI.
  const style =
    "\n\nINTERPUNKCJA: nie używaj myślnika ani półpauzy (znaki — i –). Zamiast nich przecinek, dwukropek lub kropka.";
  return scenarioSystemPrompt.replace("{{PERSONALITY}}", desc) + (oferta ? blokOferty(oferta) : "") + diff + style;
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
  difficulty = "sredni",
): Promise<ReadableStream<Uint8Array>> {
  const anthropic = createAnthropic();
  const system = buildClientSystemPrompt(scenarioSystemPrompt, personality, difficulty);
  const messages = toAnthropicMessages(transcript);

  // Jeśli transkrypt pusty lub ostatni był od klienta - zaczynamy rozmowę
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
        // Prompt caching - system prompt jest długi i powtarza się co turę.
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

/** Jeden konkretny moment rozmowy: cytat agenta i co z nim zrobić. */
export type Moment = {
  cytat: string;
  ocena: "dobrze" | "do_poprawy";
  komentarz: string;
  /** Gotowe zdanie, które agent może powiedzieć następnym razem. */
  lepiej?: string;
};

export type ScoringResult = {
  overall: number;
  opening: number;
  qualification: number;
  objection_handling: number;
  closing: number;
  summary: string;
  suggestions: string[];
  moments: Moment[];
};

const SCORING_SYSTEM = `Jesteś doświadczonym trenerem sprzedaży nieruchomości w Polsce. Analizujesz transkrypt sesji treningowej, w której AGENT ćwiczył rozmowę z (symulowanym) KLIENTEM.

Twoje zadanie: ocenić WYŁĄCZNIE wypowiedzi AGENTA (nie klienta) i dać konkretny, praktyczny feedback po polsku.

Oceniasz w 4 kategoriach, każda w skali 1-10:
- opening (otwarcie): jak agent rozpoczął, czy zbudował relację, czy nie był nachalny
- qualification (kwalifikacja): czy agent zadawał dobre pytania, poznał potrzeby/sytuację klienta
- objection_handling (obsługa obiekcji): jak agent reagował na opór, wątpliwości, "nie"
- closing (zamknięcie): czy agent zaproponował konkretny następny krok, umówił spotkanie/działanie

overall: ogólna ocena 1-10 (nie musi być średnią - uwzględnij całościowe wrażenie).

summary: 2-3 zdania podsumowania po polsku - co poszło dobrze, co najważniejsze do poprawy.

suggestions: 2-4 KONKRETNE wskazówki po polsku. Każda odnosi się do tego co agent FAKTYCZNIE powiedział (lub czego nie powiedział). Cytuj/parafrazuj realne momenty. Dawaj gotowe sformułowania których agent może użyć następnym razem. NIE ogólniki.

moments: 3-5 kluczowych momentów rozmowy. Każdy to DOSŁOWNY cytat wypowiedzi agenta (fragment do 200 znaków, skopiowany z transkryptu bez zmian), ocena "dobrze" albo "do_poprawy", jedno-dwa zdania komentarza: dlaczego to zadziałało albo co klient poczuł, oraz przy "do_poprawy" pole "lepiej": gotowe zdanie, które agent mógł powiedzieć zamiast tego. Daj przynajmniej jeden moment "dobrze", jeśli jakikolwiek się zdarzył: agent ma wiedzieć, co powtarzać, a nie tylko co poprawiać.

Bądź sprawiedliwy ale wymagający. Jeśli rozmowa była krótka lub agent zrobił mało - niższe oceny. Odpowiadasz TYLKO w formacie JSON, bez dodatkowego tekstu.

INTERPUNKCJA (ważne): w summary i suggestions nie używaj myślnika ani półpauzy (znaki — i –). Zamiast nich stosuj przecinek, dwukropek albo kropkę.`;

/**
 * Ocenia zakończoną sesję. Używa tool use - gwarantuje poprawny format
 * (zero parsowania JSON z tekstu, brak ryzyka błędu składni).
 */
export async function scoreSession(
  scenarioTitle: string,
  transcript: ChatMessage[],
  oferta?: KontekstOferty | null,
): Promise<ScoringResult> {
  const dialogue = transcript
    .map((m) => `${m.role === "agent" ? "AGENT" : "KLIENT"}: ${m.content}`)
    .join("\n");

  const parsed = await odpowiedzJson<ScoringResult>({
    model: SCORING_MODEL,
    maxTokens: 2600,
    system: SCORING_SYSTEM,
    schemat: {
      type: "object",
      properties: {
        overall: { type: "integer", description: "Ogólna ocena 1-10" },
        opening: { type: "integer", description: "Otwarcie rozmowy 1-10" },
        qualification: { type: "integer", description: "Kwalifikacja klienta 1-10" },
        objection_handling: { type: "integer", description: "Obsługa obiekcji 1-10" },
        closing: { type: "integer", description: "Zamknięcie 1-10" },
        summary: { type: "string", description: "2-3 zdania podsumowania po polsku" },
        suggestions: {
          type: "array",
          items: { type: "string" },
          description: "2-4 konkretne wskazówki po polsku",
        },
        moments: {
          type: "array",
          description: "3-5 kluczowych momentów rozmowy",
          items: {
            type: "object",
            properties: {
              cytat: { type: "string", description: "Dosłowny cytat wypowiedzi agenta" },
              ocena: { type: "string", enum: ["dobrze", "do_poprawy"] },
              komentarz: { type: "string", description: "1-2 zdania po polsku" },
              lepiej: { type: "string", description: "Gotowe lepsze zdanie (tylko przy do_poprawy)" },
            },
            required: ["cytat", "ocena", "komentarz"],
            additionalProperties: false,
          },
        },
      },
      required: [
        "overall",
        "opening",
        "qualification",
        "objection_handling",
        "closing",
        "summary",
        "suggestions",
        "moments",
      ],
      additionalProperties: false,
    },
    messages: [
      {
        role: "user",
        content:
          `Scenariusz: ${scenarioTitle}\n\n` +
          (oferta
            ? `Rozmowa dotyczyła konkretnej oferty agenta. Dane oferty:\n${faktyOferty(oferta).map((f) => `- ${f}`).join("\n")}\n\nOceń także, czy agent znał swoją ofertę: czy podawał zgodne z nią fakty i czy umiał odpowiedzieć na pytania o nią. Pomyłkę w faktach o ofercie pokaż jako moment "do_poprawy".\n\n`
            : "") +
          `Transkrypt rozmowy:\n\n${dialogue}\n\nOceń wypowiedzi agenta.`,
      },
    ],
  });

  const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(Number(n) || 1)));

  return {
    overall: clamp(parsed.overall),
    opening: clamp(parsed.opening),
    qualification: clamp(parsed.qualification),
    objection_handling: clamp(parsed.objection_handling),
    closing: clamp(parsed.closing),
    summary: parsed.summary ?? "",
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
    moments: (Array.isArray(parsed.moments) ? parsed.moments : [])
      .filter((m) => m && typeof m.cytat === "string" && typeof m.komentarz === "string")
      .slice(0, 6)
      .map((m) => ({
        cytat: m.cytat.slice(0, 300),
        ocena: m.ocena === "dobrze" ? "dobrze" : "do_poprawy",
        komentarz: m.komentarz.slice(0, 500),
        ...(m.lepiej ? { lepiej: String(m.lepiej).slice(0, 400) } : {}),
      })),
  };
}
