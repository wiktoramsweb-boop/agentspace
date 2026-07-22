import { getCurrentUser } from "@/lib/auth";
import {
  getClientsNeedingContact,
  getTasks,
  getDeals,
  getCommissionStats,
} from "@/lib/data-platform";
import { getAgentStats } from "@/lib/data";
import { getDailySuggestions } from "@/lib/ai/assistant";
import { daysAgo } from "@/lib/format";

export const maxDuration = 60;

const CATEGORY_LABELS: Record<string, string> = {
  opening: "Otwarcie rozmowy",
  qualification: "Kwalifikacja klienta",
  objection_handling: "Obsługa obiekcji",
  closing: "Zamykanie",
};

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return new Response(JSON.stringify({ error: "Nie zalogowano" }), { status: 401 });

  try {
    const [clients, tasks, deals, commission, agentStats] = await Promise.all([
      getClientsNeedingContact(user.id, 6),
      getTasks(user.id, true),
      getDeals(user.id),
      getCommissionStats(user.id),
      getAgentStats(user.id),
    ]);

    // Najsłabszy obszar treningowy z ostatnich scoringów — uproszczenie:
    // bierzemy średni wynik; szczegół per kategoria dorobi się w panelu.
    const weakest =
      agentStats.avgScore != null && agentStats.avgScore < 7
        ? "ogólna technika rozmowy (średni wynik poniżej 7)"
        : null;

    const suggestions = await getDailySuggestions({
      agentName: user.full_name ?? "Agent",
      clientsNeedingContact: clients.map((c) => ({
        name: c.name,
        status: c.status,
        daysSinceContact: daysAgo(c.last_contact_at),
      })),
      openTasks: tasks.map((t) => t.title),
      pipelineDeals: deals
        .filter((d) => d.status === "w_toku")
        .map((d) => ({ title: d.title, commission: d.commission_pln })),
      monthProgress:
        (user.monthly_goal_pln ?? 0) > 0
          ? { closed: commission.monthClosed, goal: user.monthly_goal_pln }
          : null,
      weakestTrainingArea: weakest,
    });

    void CATEGORY_LABELS;
    return Response.json({ suggestions });
  } catch (err) {
    console.error("Daily assistant error:", err);
    return new Response(
      JSON.stringify({ error: "AI Asystent chwilowo niedostępny (sprawdź ANTHROPIC_API_KEY / kredyty)." }),
      { status: 503 },
    );
  }
}
