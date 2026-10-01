/**
 * Odpowiedź modelu w zadanym kształcie JSON (structured outputs).
 *
 * Wcześniej wymuszaliśmy to przez `tool_choice: {type: "tool"}`, ale Sonnet 5.5
 * i nowsze zwracają na to błąd 400. Structured outputs daje dokładnie to samo
 * (gwarantowany kształt odpowiedzi), działa na wszystkich obecnych modelach
 * i nie wymaga definiowania sztucznego „narzędzia", którego i tak nigdy nie
 * wywołujemy.
 *
 * Wołamy API wprost przez fetch, a nie przez SDK, bo wersja SDK w projekcie
 * jeszcze nie zna pola `output_config`.
 */

export type SchematJson = {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
};

type Parametry = {
  model: string;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens: number;
  schemat: SchematJson;
};

export async function odpowiedzJson<T>({
  model,
  system,
  messages,
  maxTokens,
  schemat,
}: Parametry): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Brak ANTHROPIC_API_KEY. Ustaw w .env.local i w Vercel Environment Variables.");
  }

  const odpowiedz = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages,
      output_config: { format: { type: "json_schema", schema: schemat } },
    }),
  });

  if (!odpowiedz.ok) {
    const tresc = await odpowiedz.text();
    throw new Error(`Anthropic ${odpowiedz.status}: ${tresc.slice(0, 300)}`);
  }

  const dane = (await odpowiedz.json()) as {
    content?: { type: string; text?: string }[];
  };
  const tekst = dane.content?.find((c) => c.type === "text")?.text;
  if (!tekst) throw new Error("Model nie zwrócił odpowiedzi w zadanym formacie.");
  return JSON.parse(tekst) as T;
}
