import { getCurrentUser } from "@/lib/auth";
import { deleteSubscription } from "@/lib/push";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response(JSON.stringify({ error: "Nie zalogowano" }), { status: 401 });

  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Złe dane" }), { status: 400 });
  }

  if (!body.endpoint) return new Response(JSON.stringify({ error: "Brak endpoint" }), { status: 400 });

  await deleteSubscription(body.endpoint);
  return Response.json({ ok: true });
}
