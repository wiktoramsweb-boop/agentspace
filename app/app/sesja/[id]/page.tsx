import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSessionWithScore, getScenarioById } from "@/lib/data";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { SessionChat } from "./chat";
import { SessionResults } from "./results";

// Scoring (endSession) potrafi trwać kilka-kilkanaście sekund — daj mu czas.
export const maxDuration = 60;

type Props = { params: Promise<{ id: string }> };

export default async function SessionPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  const session = await getSessionWithScore(id);
  if (!session) notFound();

  // Autoryzacja: właściciel sesji, CEO tej samej agencji, albo menedżer agenta sesji.
  let canView =
    session.agent_id === user.id ||
    (user.role === "owner" && user.agency_id === session.agency_id);
  if (!canView && user.role === "manager" && user.agency_id === session.agency_id) {
    const admin = createSupabaseAdmin();
    const { data: agent } = await admin
      .from("profiles")
      .select("manager_id")
      .eq("id", session.agent_id)
      .maybeSingle();
    canView = agent?.manager_id === user.id;
  }
  if (!canView) redirect("/app");

  // Podgląd cudzej sesji (CEO/menedżer): zawsze read-only wyniki + transkrypt,
  // niezależnie od statusu (także sesje w toku/niedokończone).
  const isViewer = session.agent_id !== user.id;

  if (session.status === "completed" || isViewer) {
    return (
      <SessionResults
        session={session}
        backHref={isViewer ? `/app/zespol/${session.agent_id}` : "/app/historia"}
        backLabel={isViewer ? "← Wróć do agenta" : "← Historia sesji"}
        showTrainAgain={!isViewer}
      />
    );
  }

  const scenario = await getScenarioById(session.scenario_id);

  return (
    <SessionChat
      sessionId={session.id}
      initialTranscript={session.transcript}
      scenarioTitle={session.scenario_title ?? scenario?.title ?? "Sesja"}
      brief={scenario?.brief ?? ""}
      personality={session.personality ?? "biznesowy"}
    />
  );
}
