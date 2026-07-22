"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getScenarioById } from "@/lib/data";
import { scoreSession } from "@/lib/ai/coach";
import type { ChatMessage } from "@/lib/types";

/**
 * Tworzy nową sesję treningową i przekierowuje do niej.
 */
export async function startSession(formData: FormData): Promise<void> {
  const user = await requireUser();
  const scenarioId = String(formData.get("scenarioId") ?? "");
  const personality = String(formData.get("personality") ?? "biznesowy");

  const scenario = await getScenarioById(scenarioId);
  if (!scenario || !user.agency_id) redirect("/app/trening");

  const admin = createSupabaseAdmin();
  const { data: session } = await admin
    .from("training_sessions")
    .insert({
      agent_id: user.id,
      agency_id: user.agency_id,
      scenario_id: scenarioId,
      scenario_title: scenario!.title,
      personality,
      transcript: [],
      status: "in_progress",
    })
    .select("id")
    .single();

  if (!session) redirect("/app/trening");
  redirect(`/app/sesja/${session!.id}`);
}

/**
 * Kończy sesję: uruchamia scoring i zapisuje wynik.
 * Drugi argument (formData) obecny gdy wywołane z <form action={endSession.bind(null, id)}>.
 */
export async function endSession(sessionId: string, _formData?: FormData): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();

  const { data: session } = await admin
    .from("training_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  // Autoryzacja: tylko właściciel sesji
  if (!session || session.agent_id !== user.id) redirect("/app");
  if (session!.status === "completed") redirect(`/app/sesja/${sessionId}`);

  const transcript = (session!.transcript ?? []) as ChatMessage[];
  const agentTurns = transcript.filter((m) => m.role === "agent").length;

  // Oznacz jako zakończoną
  await admin
    .from("training_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  // Scoring tylko jeśli agent coś powiedział
  if (agentTurns > 0) {
    try {
      const result = await scoreSession(session!.scenario_title ?? "Sesja", transcript);
      await admin.from("session_scores").insert({
        session_id: sessionId,
        agent_id: user.id,
        agency_id: session!.agency_id,
        overall: result.overall,
        opening: result.opening,
        qualification: result.qualification,
        objection_handling: result.objection_handling,
        closing: result.closing,
        summary: result.summary,
        suggestions: result.suggestions,
      });
    } catch (err) {
      console.error("Scoring error:", err);
      // Brak scoringu — sesja i tak zakończona, user zobaczy transkrypt
    }
  }

  redirect(`/app/sesja/${sessionId}`);
}

/**
 * Ponowna ocena zakończonej sesji (gdy scoring wcześniej się nie udał).
 */
export async function rescoreSession(sessionId: string, _formData?: FormData): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();

  const { data: session } = await admin
    .from("training_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session || session.agent_id !== user.id) redirect("/app");

  const transcript = (session!.transcript ?? []) as ChatMessage[];
  const agentTurns = transcript.filter((m) => m.role === "agent").length;
  if (agentTurns === 0) redirect(`/app/sesja/${sessionId}`);

  // Usuń stary wynik (jeśli był) i policz od nowa
  await admin.from("session_scores").delete().eq("session_id", sessionId);

  const result = await scoreSession(session!.scenario_title ?? "Sesja", transcript);
  await admin.from("session_scores").insert({
    session_id: sessionId,
    agent_id: user.id,
    agency_id: session!.agency_id,
    overall: result.overall,
    opening: result.opening,
    qualification: result.qualification,
    objection_handling: result.objection_handling,
    closing: result.closing,
    summary: result.summary,
    suggestions: result.suggestions,
  });

  redirect(`/app/sesja/${sessionId}`);
}
