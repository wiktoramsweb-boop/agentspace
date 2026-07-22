import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSessionWithScore, getScenarioById } from "@/lib/data";
import { SessionChat } from "./chat";
import { SessionResults } from "./results";

type Props = { params: Promise<{ id: string }> };

export default async function SessionPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  const session = await getSessionWithScore(id);
  if (!session) notFound();

  // Autoryzacja: właściciel sesji, albo owner tej samej agencji (podgląd)
  const isOwnerOfAgency = user.role === "owner" && user.agency_id === session.agency_id;
  if (session.agent_id !== user.id && !isOwnerOfAgency) redirect("/app");

  if (session.status === "completed") {
    return <SessionResults session={session} />;
  }

  // Sesja w toku — tylko właściciel sesji może kontynuować
  if (session.agent_id !== user.id) redirect("/app");

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
