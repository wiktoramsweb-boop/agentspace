import { getCurrentUser } from "@/lib/auth";
import { sendPushToAgent } from "@/lib/push";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return new Response(JSON.stringify({ error: "Nie zalogowano" }), { status: 401 });

  const sent = await sendPushToAgent(user.id, {
    title: "Powiadomienia włączone ✅",
    body: "Tak będą wyglądać przypomnienia z AgentSpace.",
    url: "/app",
  });

  return Response.json({ ok: true, sent });
}
