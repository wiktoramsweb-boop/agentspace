import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getGoal,
  getContactReminders,
  getClientsNeedingContact,
} from "@/lib/data-platform";
import { computeFunnel } from "@/lib/funnel";
import { sendPushToAgent } from "@/lib/push";

export const maxDuration = 300;

/**
 * Poranna odprawa push. Dla każdego agenta z aktywną subskrypcją liczy:
 * klientów do kontaktu dziś + dzienny cel telefonów, i wysyła powiadomienie.
 * Uruchamiany przez Vercel Cron (patrz vercel.json). Zabezpieczony CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const admin = createSupabaseAdmin();
  const { data: subs } = await admin.from("push_subscriptions").select("agent_id");
  const agentIds = [...new Set((subs ?? []).map((s) => s.agent_id as string))];

  let notified = 0;
  for (const agentId of agentIds) {
    try {
      const [reminders, needContact, goal] = await Promise.all([
        getContactReminders(agentId, 50),
        getClientsNeedingContact(agentId, 50),
        getGoal(agentId),
      ]);

      const toContact = new Set([
        ...reminders.map((c) => c.id),
        ...needContact.map((c) => c.id),
      ]).size;
      const callTarget = goal ? computeFunnel(goal).byStage.cold_calls.daily : 0;

      const parts: string[] = [];
      if (toContact > 0) parts.push(`${toContact} klientów do kontaktu`);
      if (callTarget > 0) parts.push(`cel: ${callTarget} telefonów`);
      const body = parts.length ? parts.join(" · ") : "Zaplanuj dzień i zrób pierwszy telefon.";

      const sent = await sendPushToAgent(agentId, {
        title: "Dzień dobry 👋",
        body,
        url: "/app",
      });
      if (sent > 0) notified += 1;
    } catch (err) {
      console.error("morning-brief error for agent", agentId, err);
    }
  }

  return Response.json({ ok: true, agents: agentIds.length, notified });
}
