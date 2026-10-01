import { aiLimitReached, aiLimitResponse } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth";
import { createAnthropic, COACH_MODEL } from "@/lib/ai/client";

export const maxDuration = 60;

const SYSTEM = `Tłumaczysz opisy ogłoszeń nieruchomości z polskiego na angielski dla kupujących z zagranicy.

Zasady:
- Zachowaj układ tekstu: akapity, nagłówki, listy punktowane i ich kolejność.
- Metraż, ceny i jednostki zostaw w oryginale (m², PLN, zł), tylko tłumacz opisy wokół nich.
- Nazwy własne (miasto, dzielnica, ulica, nazwa osiedla) zostaw po polsku.
- Terminy rynku nieruchomości tłumacz tak, jak używa ich rynek brytyjski, nie dosłownie.
- Nie dodawaj nic od siebie i niczego nie skracaj.
- Zwróć wyłącznie przetłumaczony tekst, bez komentarza i bez znaczników markdown.`;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Brak dostępu." }, { status: 401 });
  if (await aiLimitReached(user)) return aiLimitResponse();

  let tekst = "";
  try {
    tekst = String(((await req.json()) as { tekst?: string }).tekst ?? "").trim();
  } catch {
    return Response.json({ error: "Nieczytelne żądanie." }, { status: 400 });
  }
  if (!tekst) return Response.json({ error: "Najpierw napisz opis po polsku." }, { status: 400 });
  if (tekst.length > 9000) return Response.json({ error: "Opis jest za długi do tłumaczenia." }, { status: 400 });

  try {
    const anthropic = createAnthropic();
    const res = await anthropic.messages.create({
      model: COACH_MODEL,
      max_tokens: 6000,
      system: SYSTEM,
      messages: [{ role: "user", content: tekst }],
    });
    const out = res.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("")
      .trim();
    if (!out) return Response.json({ error: "Tłumaczenie wróciło puste." }, { status: 502 });
    return Response.json({ tekst: out });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Nie udało się przetłumaczyć." },
      { status: 500 },
    );
  }
}
