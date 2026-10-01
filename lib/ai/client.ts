import Anthropic from "@anthropic-ai/sdk";

/**
 * Fabryka klienta Anthropic. Model dobrany do jakości polskiego dialogu.
 */
export function createAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Brak ANTHROPIC_API_KEY. Ustaw w .env.local i w Vercel Environment Variables.",
    );
  }
  return new Anthropic({ apiKey });
}

// Model konfigurowalny przez env (gdyby ID modelu się zmieniło).
//
// Sonnet 5.5 jest lepszy i tańszy od 4.5 ($2/$10 za milion tokenów zamiast
// $3/$15), co obniża koszt kredytu z 0,025 zł na 0,0167 zł.
//
// Uwaga przy zmianie modelu: Sonnet 5.5 i nowsze zwracają błąd 400 na
// `tool_choice: {type: "tool"}`, dlatego odpowiedzi w zadanym kształcie
// bierzemy przez structured outputs (lib/ai/struktura.ts), a nie przez
// wymuszone narzędzie.
export const COACH_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";
export const SCORING_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";
