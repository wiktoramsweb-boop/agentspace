import { ludzieKierownika } from "@/lib/oddzialy";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSessionWithScore, getScenarioById } from "@/lib/data";
import { SessionChat } from "./chat";
import { SessionResults } from "./results";
import { glosWlaczony } from "@/lib/glos";
import { plecZWyboru, scenariuszWPlci } from "@/lib/coach/scenariusz-plec";
import { technika as znajdzTechnike } from "@/lib/techniki/techniki";
import { lekcja as znajdzLekcje } from "@/lib/coach/sciezka";

// Scoring (endSession) potrafi trwać kilka-kilkanaście sekund - daj mu czas.
export const maxDuration = 60;

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tryb?: string; plec?: string; technika?: string }> };

export default async function SessionPage({ params, searchParams }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const { tryb, plec, technika: slugTechniki } = await searchParams;

  const session = await getSessionWithScore(id);
  if (!session) notFound();

  // Autoryzacja: właściciel sesji, CEO tej samej agencji, albo menedżer agenta sesji.
  let canView =
    session.agent_id === user.id ||
    (user.role === "owner" && user.agency_id === session.agency_id);
  if (!canView && user.role === "manager" && user.agency_id === session.agency_id) {
    canView = (await ludzieKierownika(session.agency_id, user.id)).includes(session.agent_id);
  }
  if (!canView) redirect("/app");

  // Podgląd cudzej sesji (CEO/menedżer): zawsze read-only wyniki + transkrypt,
  // niezależnie od statusu (także sesje w toku/niedokończone).
  const isViewer = session.agent_id !== user.id;

  if (session.status === "completed" || isViewer) {
    const sc = await getScenarioById(session.scenario_id);
    return (
      <SessionResults
        session={session}
        slug={sc?.slug ?? null}
        brief={sc?.brief ?? ""}
        backHref={isViewer ? `/app/zespol/${session.agent_id}` : "/app/historia"}
        backLabel={isViewer ? "← Wróć do agenta" : "← Historia sesji"}
        showTrainAgain={!isViewer}
      />
    );
  }

  const scenario = await getScenarioById(session.scenario_id);
  const plecSesji = plecZWyboru(session.context?.plec) ?? plecZWyboru(plec);
  const wersja = scenariuszWPlci(
    { slug: scenario?.slug, brief: scenario?.brief ?? "", system_prompt: scenario?.system_prompt ?? "" },
    plecSesji,
  );

  return (
    <SessionChat
      sessionId={session.id}
      initialTranscript={session.transcript}
      scenarioTitle={session.scenario_title ?? scenario?.title ?? "Sesja"}
      brief={wersja.brief}
      personality={session.personality ?? "biznesowy"}
      glos={glosWlaczony()}
      trybGlosu={tryb === "glos" && glosWlaczony()}
      plec={plecSesji}
      oferta={session.context?.oferta ?? null}
      lekcja={(() => {
        const l = znajdzLekcje(session.context?.lekcja);
        return l ? { id: l.id, tytul: l.tytul, cel: l.cel, prog: l.prog } : null;
      })()}
      technika={(() => {
        const t = slugTechniki ? znajdzTechnike(slugTechniki) : undefined;
        return t ? { slug: t.slug, nazwa: t.nazwa, kroki: t.kroki } : null;
      })()}
    />
  );
}
