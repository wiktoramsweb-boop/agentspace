import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createAnthropic, COACH_MODEL } from "@/lib/ai/client";
import { buildClientSystemPrompt } from "@/lib/ai/coach";
import type { ChatMessage } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Nie zalogowano" }), { status: 401 });
  }

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

  const system = buildClientSystemPrompt(scenarioSystemPrompt, session.personality ?? "");

  let anthropic;
  try {
    anthropic = createAnthropic();
  } catch {
    return new Response(
      JSON.stringify({ error: "AI Coach nie jest skonfigurowany (brak ANTHROPIC_API_KEY)." }),
      { status: 503 },
    );
  }

  const aiStream = await anthropic.messages.create({
    model: COACH_MODEL,
    max_tokens: 400,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages,
    stream: true,
  });

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
