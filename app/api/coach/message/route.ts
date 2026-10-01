import { aiLimitReached, aiLimitResponse } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createAnthropic, COACH_MODEL } from "@/lib/ai/client";
import { buildClientSystemPrompt } from "@/lib/ai/coach";
import type { ChatMessage } from "@/lib/types";

export const maxDuration = 60;

// Ochrona przed przepaleniem tokenów: wklejony długi tekst albo rozmowa bez końca.
const MAX_MESSAGE_CHARS = 2000;
const MAX_AGENT_TURNS = 60;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Nie zalogowano" }), { status: 401 });
  }
  if (await aiLimitReached(user)) return aiLimitResponse();

  let body: { sessionId?: string; agentMessage?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Złe dane" }), { status: 400 });
  }

  const sessionId = body.sessionId;
  const agentMessage = (body.agentMessage ?? "").trim();
  if (!sessionId) {
    return new Response(JSON.stringify({ error: "Brak sessionId" }), { status: 400 });
  }
  if (agentMessage.length > MAX_MESSAGE_CHARS) {
    return new Response(
      JSON.stringify({ error: `Wiadomość jest za długa (maks. ${MAX_MESSAGE_CHARS} znaków).` }),
      { status: 400 },
    );
  }

  const admin = createSupabaseAdmin();

  // Sesja + scenariusz
  const { data: session } = await admin
    .from("training_sessions")
    .select("*, scenario:scenarios(system_prompt)")
    .eq("id", sessionId)
    .single();

  if (!session || session.agent_id !== user.id) {
    return new Response(JSON.stringify({ error: "Brak dostępu" }), { status: 403 });
  }
  if (session.status !== "in_progress") {
    return new Response(JSON.stringify({ error: "Sesja zakończona" }), { status: 409 });
  }

  const scenarioSystemPrompt =
    (session.scenario as { system_prompt: string } | null)?.system_prompt ?? "";
  const transcript = (session.transcript ?? []) as ChatMessage[];
  if (transcript.filter((m) => m.role === "agent").length >= MAX_AGENT_TURNS) {
    return new Response(
      JSON.stringify({ error: "Ta rozmowa jest już bardzo długa. Zakończ ją, żeby zobaczyć ocenę." }),
      { status: 409 },
    );
  }

  // Dołóż wiadomość agenta (jeśli jest)
  const workingTranscript: ChatMessage[] = [...transcript];
  if (agentMessage) {
    workingTranscript.push({ role: "agent", content: agentMessage });
  }

  // Zbuduj messages dla Claude (AI gra klienta)
  const messages = workingTranscript.map((m) => ({
    role: m.role === "client" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));

  const needsOpener =
    messages.length === 0 || messages[messages.length - 1].role === "assistant";
  if (needsOpener) {
    messages.push({ role: "user", content: "[System: rozpocznij rozmowę zgodnie z instrukcją.]" });
  }

  const system = buildClientSystemPrompt(
    scenarioSystemPrompt,
    session.personality ?? "",
    session.difficulty ?? "sredni",
  );

  let anthropic;
  try {
    anthropic = createAnthropic();
  } catch {
    return new Response(
      JSON.stringify({ error: "AI Coach nie jest skonfigurowany (brak ANTHROPIC_API_KEY)." }),
      { status: 503 },
    );
  }

  // Bez try błąd API (np. skończone środki na koncie Anthropic) kończył się
  // gołym błędem 500, a agent nie wiedział, co się stało.
  let aiStream;
  try {
    aiStream = await anthropic.messages.create({
      model: COACH_MODEL,
      max_tokens: 400,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages,
      stream: true,
    });
  } catch (err) {
    console.error("Coach API error:", err);
    return new Response(
      JSON.stringify({ error: "AI chwilowo nie odpowiada. Spróbuj ponownie za chwilę." }),
      { status: 503 },
    );
  }

  const encoder = new TextEncoder();
  let fullReply = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of aiStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullReply += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error("Coach stream error:", err);
      } finally {
        // Zapisz zaktualizowany transkrypt
        const finalTranscript: ChatMessage[] = [...workingTranscript];
        if (fullReply.trim()) {
          finalTranscript.push({ role: "client", content: fullReply.trim() });
        }
        await admin
          .from("training_sessions")
          .update({ transcript: finalTranscript })
          .eq("id", sessionId);

        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
