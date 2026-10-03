/**
 * Odpowiedź modelu w zadanym kształcie JSON.
 *
 * Historia tego pliku: najpierw wymuszaliśmy kształt przez `tool_choice`,
 * potem przez structured outputs (`output_config`). Problem w tym, że
 * structured outputs jedzie na nagłówku beta, a gdy API go nie zna, całe
 * zapytanie leci 400 i użytkownik widzi tylko „AI chwilowo niedostępne”.
 *
 * Dlatego teraz są dwie drogi i jedna awaryjna:
 *  1. structured outputs z nagłówkiem beta - gwarantowany kształt,
 *  2. gdy API to odrzuci, zwykłe zapytanie z instrukcją „zwróć sam JSON”
 *     i ręcznym parsowaniem.
 *
 * Druga droga daje ten sam wynik w 99% przypadków i jest odporna na zmiany
 * po stronie API. Lepsza działająca funkcja z luźniejszą gwarancją niż
 * czerwony komunikat na pulpicie.
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

const API = "https://api.anthropic.com/v1/messages";
const BETA_STRUCTURED = "structured-outputs-2025-11-13";

type OdpowiedzApi = { content?: { type: string; text?: string }[] };

function tekstZOdpowiedzi(dane: OdpowiedzApi): string | null {
  return dane.content?.find((c) => c.type === "text")?.text ?? null;
}

/**
 * Wyciąga obiekt JSON z odpowiedzi modelu.
 *
 * Model bywa uczynny i opakowuje JSON w ```json albo dokleja zdanie przed.
 * Bierzemy wszystko od pierwszej klamry do ostatniej, bo to jest jedyny
 * fragment, który ma szansę się sparsować.
 */
function wyciagnijJson<T>(tekst: string): T {
  const bezPlotka = tekst.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const start = bezPlotka.indexOf("{");
  const koniec = bezPlotka.lastIndexOf("}");
  if (start === -1 || koniec === -1 || koniec < start) {
    throw new Error("Model nie zwrócił JSON-a.");
  }
  return JSON.parse(bezPlotka.slice(start, koniec + 1)) as T;
}

async function wyslij(apiKey: string, body: unknown, beta?: string) {
  const headers: Record<string, string> = {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };
  if (beta) headers["anthropic-beta"] = beta;
  return fetch(API, { method: "POST", headers, body: JSON.stringify(body) });
}

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

  // 1. Structured outputs.
  const strukturalna = await wyslij(
    apiKey,
    {
      model,
      max_tokens: maxTokens,
      system,
      messages,
      output_config: { format: { type: "json_schema", schema: schemat } },
    },
    BETA_STRUCTURED,
  );

  if (strukturalna.ok) {
    const tekst = tekstZOdpowiedzi((await strukturalna.json()) as OdpowiedzApi);
    if (tekst) return wyciagnijJson<T>(tekst);
  } else {
    // Powód zapisujemy w logach serwera. Bez tego jedyną informacją o awarii
    // był komunikat dla użytkownika, z którego nie da się nic naprawić.
    const tresc = await strukturalna.text();
    console.error(`Anthropic structured outputs ${strukturalna.status}: ${tresc.slice(0, 500)}`);
  }

  // 2. Droga awaryjna: zwykłe zapytanie z instrukcją formatu.
  const pola = Object.keys(schemat.properties).join(", ");
  const zapasowa = await wyslij(apiKey, {
    model,
    max_tokens: maxTokens,
    system: `${system}\n\nOdpowiadasz WYŁĄCZNIE obiektem JSON, bez komentarza i bez bloku kodu. Wymagane pola: ${pola}. Schemat: ${JSON.stringify(schemat)}`,
    messages,
  });

  if (!zapasowa.ok) {
    const tresc = await zapasowa.text();
    throw new Error(`Anthropic ${zapasowa.status}: ${tresc.slice(0, 300)}`);
  }

  const tekst = tekstZOdpowiedzi((await zapasowa.json()) as OdpowiedzApi);
  if (!tekst) throw new Error("Model nie zwrócił odpowiedzi.");
  return wyciagnijJson<T>(tekst);
}
