import { createAnthropic, COACH_MODEL } from "./client";

export type DailySuggestion = {
  title: string;
  reason: string;
  category: "klient" | "trening" | "prowizja" | "zadanie";
};

export type AssistantContext = {
  agentName: string;
  clientsNeedingContact: { name: string; status: string; daysSinceContact: string }[];
  openTasks: string[];
  pipelineDeals: { title: string; commission: number }[];
  monthProgress: { closed: number; goal: number } | null;
  weakestTrainingArea: string | null;
};

const SYSTEM = `Jesteś asystentem agenta nieruchomości w Polsce. Na podstawie stanu jego dnia (klienci bez kontaktu, zadania, pipeline, cel prowizji, słabości treningowe) proponujesz 3 NAJWAŻNIEJSZE priorytety na dziś.

Zasady:
- Konkret, nie ogólniki. Odnoś się do konkretnych klientów/liczb z kontekstu.
- Priorytetyzuj to co realnie przybliża do zamknięcia transakcji i celu prowizji.
- Ton: rzeczowy, motywujący, po polsku, jak dobry menedżer sprzedaży.
- Każda sugestia: krótki tytuł (co zrobić) + jedno zdanie dlaczego.
- Kategorie: klient (kontakt/follow-up), trening (AI Coach), prowizja (pipeline), zadanie.
- Zawsze wywołaj narzędzie zaproponuj_priorytety z dokładnie 3 sugestiami.`;

export async function getDailySuggestions(
  ctx: AssistantContext,
): Promise<DailySuggestion[]> {
  const anthropic = createAnthropic();

  const contextText = `
Agent: ${ctx.agentName}

Klienci wymagający kontaktu (${ctx.clientsNeedingContact.length}):
${ctx.clientsNeedingContact.map((c) => `- ${c.name} (status: ${c.status}, ostatni kontakt: ${c.daysSinceContact})`).join("\n") || "brak"}

Otwarte zadania (${ctx.openTasks.length}):
${ctx.openTasks.map((t) => `- ${t}`).join("\n") || "brak"}

Transakcje w pipeline (${ctx.pipelineDeals.length}):
${ctx.pipelineDeals.map((d) => `- ${d.title}: ${d.commission} zł prowizji`).join("\n") || "brak"}

Cel prowizji miesięcznej: ${ctx.monthProgress ? `${ctx.monthProgress.closed} / ${ctx.monthProgress.goal} zł` : "nie ustawiony"}

Najsłabszy obszar treningowy: ${ctx.weakestTrainingArea ?? "brak danych"}
`.trim();

  const response = await anthropic.messages.create({
    model: COACH_MODEL,
    max_tokens: 800,
    system: SYSTEM,
    tools: [
      {
        name: "zaproponuj_priorytety",
        description: "Zwraca 3 priorytety na dziś dla agenta.",
        input_schema: {
          type: "object",
          properties: {
            priorytety: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Co zrobić — krótko" },
                  reason: { type: "string", description: "Dlaczego — jedno zdanie" },
                  category: {
                    type: "string",
                    enum: ["klient", "trening", "prowizja", "zadanie"],
                  },
                },
                required: ["title", "reason", "category"],
              },
            },
          },
          required: ["priorytety"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "zaproponuj_priorytety" },
    messages: [{ role: "user", content: contextText }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return [];

  const input = toolUse.input as { priorytety?: DailySuggestion[] };
  return (input.priorytety ?? []).slice(0, 3);
}
