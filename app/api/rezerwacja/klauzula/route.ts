import { brakKredytow, brakKredytowResponse } from "@/lib/kredyty";
import { getCurrentUser } from "@/lib/auth";
import { COACH_MODEL } from "@/lib/ai/client";
import { odpowiedzJson } from "@/lib/ai/struktura";

export const maxDuration = 45;

const SYSTEM = `Jesteś prawnikiem redagującym umowy rezerwacyjne nieruchomości (prawo polskie, Kodeks cywilny). Na podstawie prośby agenta napisz JEDEN formalny zapis (ustęp) do dodania do umowy.

Zasady:
- Język formalny, precyzyjny, spójny z resztą umowy. Strony to zdefiniowane terminy: przy sprzedaży „Sprzedający" i „Kupujący", przy najmie „Wynajmujący" i „Najemca". Wpłata to „zadatek" albo „opłata rezerwacyjna" (użyj tego, co podano).
- JEDNO zwięzłe postanowienie (1-4 zdania). BEZ numeru paragrafu i BEZ nagłówka - sama treść ustępu.
- Nie wymyślaj kwot, dat, nazwisk, numerów. Jeśli potrzebne dane, których agent nie podał, wstaw [placeholder w nawiasach kwadratowych].
- Jeśli prośba jest niejasna, zredaguj najbardziej sensowny, bezpieczny prawnie zapis.
- INTERPUNKCJA: nie używaj myślnika ani półpauzy (— –); stosuj przecinek, dwukropek lub nawias.
Zawsze wywołaj narzędzie dodaj_zapis.`;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response(JSON.stringify({ error: "Nie zalogowano" }), { status: 401 });
  if (await brakKredytow(user, "klauzula")) return brakKredytowResponse();

  let body: { request?: string; mode?: string; depositType?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Złe dane" }), { status: 400 });
  }
  const prompt = (body.request ?? "").trim().slice(0, 2000);
  if (!prompt) return new Response(JSON.stringify({ error: "Napisz, co dopisać." }), { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "AI niedostępne (brak ANTHROPIC_API_KEY)." }), { status: 503 });
  }

  const ctx = `Kontekst umowy: ${body.mode === "najem" ? "najem (Wynajmujący / Najemca)" : "sprzedaż (Sprzedający / Kupujący)"}, wpłata: ${
    body.depositType === "oplata" ? "opłata rezerwacyjna" : "zadatek"
  }.`;

  try {
        const wynik = await odpowiedzJson<{ clause: string }>({
      model: COACH_MODEL,
      maxTokens: 500,
      system: SYSTEM,
      schemat: {
            type: "object",
            properties: { clause: { type: "string", description: "Treść ustępu, bez numeru i nagłówka." } },
            required: ["clause"],
        additionalProperties: false,
      },
      messages: [{ role: "user", content: `${ctx}\n\nProśba agenta: ${prompt}` }],
    });
    return Response.json({ data: wynik });
  } catch (err) {
    console.error("klauzula error:", err);
    return new Response(JSON.stringify({ error: "Nie udało się (sprawdź kredyty API)." }), { status: 503 });
  }
}
