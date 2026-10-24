import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getScenarioById } from "@/lib/data";
import { scoreSession } from "@/lib/ai/coach";
import type { KontekstOferty } from "@/lib/ai/oferta-kontekst";
import { maV49 } from "@/lib/schemat";
import { powiadom } from "@/lib/powiadomienia";
import type { ChatMessage } from "@/lib/types";
import { lekcja as znajdzLekcje } from "@/lib/coach/sciezka";

type Admin = ReturnType<typeof createSupabaseAdmin>;

export type Sesja = {
  id: string;
  agent_id: string;
  agency_id: string;
  scenario_title: string | null;
  transcript: ChatMessage[] | null;
  scenario_id?: string;
  context?: { oferta?: KontekstOferty; lekcja?: string; [k: string]: unknown } | null;
  assignment_id?: string | null;
};

/** Ocena sesji z zapisem. Kluczowe momenty zapisujemy tylko, gdy baza ma już kolumnę. */
export async function ocenISesje(admin: Admin, s: Sesja, nowePodejscie = true): Promise<number | null> {
  const transcript = (s.transcript ?? []) as ChatMessage[];
  const lekcja = znajdzLekcje(s.context?.lekcja);
  const scen = s.scenario_id ? await getScenarioById(s.scenario_id) : null;
  const cel = lekcja ? lekcja.cel : (scen?.brief ?? null);
  const result = await scoreSession(s.scenario_title ?? "Sesja", transcript, s.context?.oferta ?? null, cel);
  const v49 = await maV49();
  // Pełna analiza idzie do kontekstu sesji: bez nowej kolumny i bez migracji.
  if (v49) {
    const { data: teraz } = await admin.from("training_sessions").select("context").eq("id", s.id).maybeSingle();
    await admin
      .from("training_sessions")
      .update({ context: { ...((teraz?.context as Record<string, unknown> | null) ?? {}), analiza: result.analiza } })
      .eq("id", s.id);
  }
  const { error } = await admin.from("session_scores").insert({
    session_id: s.id,
    agent_id: s.agent_id,
    agency_id: s.agency_id,
    overall: result.overall,
    opening: result.opening,
    qualification: result.qualification,
    objection_handling: result.objection_handling,
    closing: result.closing,
    summary: result.summary,
    suggestions: result.suggestions,
    ...(v49 ? { moments: result.moments } : {}),
  });
  if (error) {
    console.error("Zapis oceny:", error.message);
    return null;
  }
  if (v49 && s.assignment_id) await rozliczZadanie(admin, s, result.overall, nowePodejscie);
  return result.overall;
}

/** Podejście do zadania od menedżera: liczba prób, najlepszy wynik, zaliczenie. */
async function rozliczZadanie(admin: Admin, s: Sesja, wynik: number, nowePodejscie: boolean): Promise<void> {
  const { data: a } = await admin
    .from("training_assignments")
    .select("id, assigned_by, min_score, best_score, attempts, status, agent_id")
    .eq("id", s.assignment_id!)
    .maybeSingle();
  if (!a || a.agent_id !== s.agent_id) return;
  const najlepszy = Math.max(Number(a.best_score ?? 0), wynik);
  const prog = Number(a.min_score ?? 0);
  const zaliczone = a.status === "zaliczone" || najlepszy >= prog;
  await admin
    .from("training_assignments")
    .update({
      attempts: Number(a.attempts ?? 0) + (nowePodejscie ? 1 : 0),
      best_score: najlepszy,
      status: zaliczone ? "zaliczone" : "do_zrobienia",
      ...(zaliczone && a.status !== "zaliczone" ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq("id", a.id);

  if (zaliczone && a.status !== "zaliczone" && a.assigned_by) {
    const { data: agent } = await admin.from("profiles").select("full_name").eq("id", s.agent_id).maybeSingle();
    await powiadom(s.agency_id, [a.assigned_by], {
      rodzaj: "trening",
      tytul: `Zadanie treningowe zaliczone: ${agent?.full_name ?? "agent"}`,
      tresc: `${s.scenario_title ?? "Sesja"}: wynik ${wynik}/10${prog ? ` (próg ${prog})` : ""}.`,
      adres: `/app/sesja/${s.id}`,
    });
  }
}

