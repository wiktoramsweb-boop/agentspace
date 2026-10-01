import { cronUnauthorized } from "@/lib/cron-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendPushToAgent } from "@/lib/push";
import { APP_TZ } from "@/lib/datetime";

export const maxDuration = 300;

/**
 * Przypomnienia o zadaniach z terminem w ciągu dnia.
 *
 * Poranna odprawa mówi, ile jest roboty. To jest druga połowa: zadanie
 * z terminem na 14:00 ma się odezwać o 14:00, a nie zniknąć do jutra.
 *
 * Cron chodzi co godzinę, więc bierzemy okno od poprzedniego uruchomienia
 * (zaległe, których jeszcze nie przypomnieliśmy) do godziny w przód.
 * Kolumna `reminded_at` pilnuje, żeby to samo zadanie nie dzwoniło co godzinę.
 */

const WINDOW_AHEAD_MS = 60 * 60 * 1000;
/** Nie wracamy do zadań sprzed wielu dni - o tych mówi poranna odprawa. */
const WINDOW_BEHIND_MS = 6 * 60 * 60 * 1000;

type Row = {
  id: string;
  subject: string;
  kind: string;
  priority: string;
  due_at: string;
  client_id: string | null;
  assignee_ids: string[] | null;
};

function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: APP_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export async function GET(request: Request) {
  const denied = cronUnauthorized(request);
  if (denied) return denied;

  const admin = createSupabaseAdmin();
  const now = Date.now();

  const { data, error } = await admin
    .from("activities")
    .select("id, subject, kind, priority, due_at, client_id, assignee_ids")
    .eq("status", "zaplanowane")
    .is("reminded_at", null)
    .gte("due_at", new Date(now - WINDOW_BEHIND_MS).toISOString())
    .lte("due_at", new Date(now + WINDOW_AHEAD_MS).toISOString())
    .order("due_at", { ascending: true })
    .limit(500);

  if (error) {
    // Brak kolumny reminded_at oznacza nieuruchomioną migrację v27.
    console.error("task-reminders:", error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Row[];

  // Grupujemy po agencie: trzy zadania o tej samej porze to jedno
  // powiadomienie, a nie trzy wibracje pod rząd.
  const perAgent = new Map<string, Row[]>();
  for (const row of rows) {
    for (const agentId of row.assignee_ids ?? []) {
      const list = perAgent.get(agentId) ?? [];
      list.push(row);
      perAgent.set(agentId, list);
    }
  }

  let notified = 0;
  const remindedIds = new Set<string>();

  for (const [agentId, list] of perAgent) {
    const first = list[0];
    const overdue = new Date(first.due_at).getTime() < now;
    const when = timeLabel(first.due_at);

    const title = list.length > 1 ? `${list.length} zadania na teraz` : overdue ? "Termin minął" : `Na ${when}`;
    const body =
      list.length > 1
        ? list.slice(0, 3).map((r) => `${timeLabel(r.due_at)} ${r.subject}`).join("\n")
        : first.subject;

    try {
      const sent = await sendPushToAgent(agentId, {
        title,
        body,
        url: list.length === 1 && first.client_id ? `/app/klienci/${first.client_id}` : "/app/dzialania",
        tag: `zadania-${agentId}`,
        important: list.some((r) => r.priority === "wysoki"),
      });
      if (sent > 0) {
        notified += 1;
        for (const r of list) remindedIds.add(r.id);
      }
    } catch (err) {
      console.error("task-reminders push error", agentId, err);
    }
  }

  if (remindedIds.size > 0) {
    await admin
      .from("activities")
      .update({ reminded_at: new Date().toISOString() })
      .in("id", [...remindedIds]);
  }

  return Response.json({ ok: true, agents: notified, tasks: remindedIds.size });
}
