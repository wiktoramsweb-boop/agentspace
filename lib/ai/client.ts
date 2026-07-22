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
// Domyślnie Sonnet — dobry balans jakości polskiego dialogu i kosztu.
export const COACH_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929";
export const SCORING_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929";
