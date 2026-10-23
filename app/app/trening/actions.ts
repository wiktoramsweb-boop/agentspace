"use server";

import { redirect } from "next/navigation";
import { stanProby, zuzyjProbe } from "@/lib/proba";
import { requireUser } from "@/lib/auth";
import { brakKredytow } from "@/lib/kredyty";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getScenarioById, getWeeklySessionCount } from "@/lib/data";
import { scoreSession } from "@/lib/ai/coach";
import { migawkaOferty, type KontekstOferty } from "@/lib/ai/oferta-kontekst";
import { maV49 } from "@/lib/schemat";
import { powiadom } from "@/lib/powiadomienia";
import type { ChatMessage } from "@/lib/types";
import { lekcja as znajdzLekcje } from "@/lib/coach/sciezka";

type Admin = ReturnType<typeof createSupabaseAdmin>;

/**
 * Tworzy nową sesję treningową i przekierowuje do niej.
 *
 * Sesja z zadania od menedżera bierze scenariusz, trudność, osobowość i ofertę
 * z zadania, a nie z formularza: zadanie ma być tym samym sprawdzianem dla
 * każdego, kto je dostał.
 */
export async function startSession(formData: FormData): Promise<void> {
  const user = await requireUser();
  let scenarioId = String(formData.get("scenarioId") ?? "");
  let personality = String(formData.get("personality") ?? "biznesowy");
  let difficulty = String(formData.get("difficulty") ?? "sredni");
  let propertyId = String(formData.get("propertyId") ?? "");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  // Tryb nie idzie do bazy, tylko do adresu sesji: to wybór na jedno wejście,
  // a nie cecha sesji, i nie ma po co trzymać go w kolumnie.
  const tryb = formData.get("tryb") === "glos" ? "glos" : "pisanie";
  const plecWybrana = String(formData.get("plec") ?? "auto");
  const technika = String(formData.get("technika") ?? "");
  const lekcjaId = String(formData.get("lekcja") ?? "");
  const plec = plecWybrana === "k" || plecWybrana === "m" ? plecWybrana : "";

  const v49 = await maV49();
  const admin = createSupabaseAdmin();
  let zadanie: string | null = null;
  if (assignmentId && v49) {
    const { data: a } = await admin
      .from("training_assignments")
      .select("id, agent_id, scenario_id, property_id, difficulty, personality")
      .eq("id", assignmentId)
      .eq("agency_id", user.agency_id)
      .maybeSingle();
    if (a && a.agent_id === user.id) {
      zadanie = a.id;
      if (a.scenario_id) scenarioId = a.scenario_id;
      difficulty = a.difficulty ?? difficulty;
      if (a.personality) personality = a.personality;
      if (a.property_id) propertyId = a.property_id;
    }
  }

  const scenario = await getScenarioById(scenarioId);
  if (!scenario || !user.agency_id) redirect("/app/trening");

  // Lekcja ze ścieżki ustala poziom trudności i charakter klienta: zaliczenie
  // ma znaczyć to samo dla każdego agenta w biurze.
  const lekcja = !zadanie ? znajdzLekcje(lekcjaId) : null;
  const lekcjaPasuje = lekcja && lekcja.scenariusz === scenario!.slug ? lekcja : null;
  if (lekcjaPasuje) {
    difficulty = lekcjaPasuje.poziomTrudnosci;
    personality = lekcjaPasuje.charakter;
  }

  // Tygodniowy limit rozmów AI (ustawiany przez CEO). null = bez limitu.
  if (user.weekly_ai_limit != null) {
    const used = await getWeeklySessionCount(user.id);
    if (used >= user.weekly_ai_limit) redirect("/app/trening?limit=reached");
  }

  // Okres próbny i demo: kilka rozmów na spróbowanie, reszta w abonamencie.
  const proba = await stanProby(user, "coach");
  if (proba.naProbie && proba.zostalo <= 0) redirect("/app/trening?proba=koniec");

  const oferta = v49 && propertyId ? await migawkaOferty(user.agency_id!, propertyId) : null;

  const { data: session } = await admin
    .from("training_sessions")
    .insert({
      agent_id: user.id,
      agency_id: user.agency_id,
      scenario_id: scenarioId,
      scenario_title: oferta ? `${scenario!.title} · ${oferta.dzielnica || oferta.tytul}` : scenario!.title,
      personality,
      difficulty,
      transcript: [],
      status: "in_progress",
      ...(v49
        ? {
            property_id: oferta?.propertyId ?? null,
            // Płeć klienta zapisujemy w sesji, a nie tylko w adresie: czat
            // tekstowy też musi wiedzieć, czy rozmawia Pani Krystyna, czy Pan Krzysztof.
            context:
              oferta || plec || lekcjaPasuje
                ? { ...(oferta ? { oferta } : {}), ...(plec ? { plec } : {}), ...(lekcjaPasuje ? { lekcja: lekcjaPasuje.id } : {}) }
                : null,
            assignment_id: zadanie,
          }
        : {}),
    })
    .select("id")
    .single();

  if (!session) redirect("/app/trening");
  await zuzyjProbe(user, "coach");
  const parametry = [
    tryb === "glos" ? "tryb=glos" : "",
    plec ? `plec=${plec}` : "",
    /^[a-z-]{2,40}$/.test(technika) ? `technika=${technika}` : lekcjaPasuje ? `technika=${lekcjaPasuje.technika}` : "",
  ].filter(Boolean);
  redirect(`/app/sesja/${session!.id}${parametry.length ? `?${parametry.join("&")}` : ""}`);
}

type Sesja = {
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
async function ocenISesje(admin: Admin, s: Sesja, nowePodejscie = true): Promise<number | null> {
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
      await ocenISesje(admin, session as Sesja);
    } catch (err) {
      console.error("Scoring error:", err);
      // Brak scoringu - sesja i tak zakończona, user zobaczy transkrypt
    }
  }

  redirect(`/app/sesja/${sessionId}`);
}

/**
 * Ponowna ocena zakończonej sesji (gdy scoring wcześniej się nie udał).
 */
export async function rescoreSession(sessionId: string, _formData?: FormData): Promise<void> {
  const user = await requireUser();
  if (await brakKredytow(user, "coach_ocena")) redirect(`/app/sesja/${sessionId}`);
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
  // Ponowna ocena tej samej rozmowy nie jest nowym podejściem do zadania.
  await ocenISesje(admin, session as Sesja, false);

  redirect(`/app/sesja/${sessionId}`);
}
