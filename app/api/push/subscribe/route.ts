import { getCurrentUser } from "@/lib/auth";
import { saveSubscription, type WebPushSubscription } from "@/lib/push";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response(JSON.stringify({ error: "Nie zalogowano" }), { status: 401 });

  let body: { subscription?: WebPushSubscription };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Złe dane" }), { status: 400 });
  }

  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return new Response(JSON.stringify({ error: "Brak subskrypcji" }), { status: 400 });
  }

  await saveSubscription(user.id, user.agency_id, sub);
  return Response.json({ ok: true });
}
