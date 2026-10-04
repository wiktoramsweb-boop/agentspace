import { cronUnauthorized } from "@/lib/cron-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getGoal,
  getContactReminders,
  getClientsNeedingContact,
} from "@/lib/data-platform";
import { computeFunnel } from "@/lib/funnel";
import { sendPushToAgent } from "@/lib/push";
import { przypomnijOZaleglychFakturach } from "@/lib/przypomnienia-faktury";
import { wystawZaplanowaneFaktury } from "@/lib/faktury-cykliczne";
import { zapiszBlad } from "@/lib/blad";

export const maxDuration = 300;

/**
 * Poranna odprawa push i przypomnienia o fakturach.
 *
 * Przypomnienia doczepione tutaj, a nie w osobnym cronie, bo plan Hobby
 * daje tylko dwa zadania i oba są już zajęte. Zadanie i tak chodzi raz
 * dziennie, czyli dokładnie z taką częstotliwością, jaka jest potrzebna.
 * Dla każdego agenta z aktywną subskrypcją liczy:
 * klientów do kontaktu dziś + dzienny cel telefonów, i wysyła powiadomienie.
 * Uruchamiany przez Vercel Cron (patrz vercel.json). Zabezpieczony CRON_SECRET.
 */
export async function GET(request: Request) {
  const denied = cronUnauthorized(request);
  if (denied) return denied;

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
      await zapiszBlad("cron/morning-brief", err);
    }
  }

  // Każdy z tych trzech kroków leci osobno: awaria jednego nie może
  // zabrać dwóch pozostałych.
  //
  // Faktury cykliczne PRZED przypomnieniami, żeby dokument wystawiony dziś
  // trafił od razu do dzisiejszego zestawienia zaległości, jeśli ma termin
  // wsteczny.
  let cykliczne = 0;
  try {
    cykliczne = await wystawZaplanowaneFaktury();
  } catch (err) {
    await zapiszBlad("cron/faktury-cykliczne", err);
  }

  let przypomnienia = 0;
  try {
    przypomnienia = await przypomnijOZaleglychFakturach();
  } catch (err) {
    await zapiszBlad("cron/przypomnienia-faktury", err);
  }

  return Response.json({ ok: true, agents: agentIds.length, notified, cykliczne, przypomnienia });
}
