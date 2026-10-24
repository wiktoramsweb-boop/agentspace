"use server";

import { redirect } from "next/navigation";
import { stanProby, zuzyjProbe } from "@/lib/proba";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getScenarioById, getWeeklySessionCount } from "@/lib/data";
import { migawkaOferty } from "@/lib/ai/oferta-kontekst";
import { maV49 } from "@/lib/schemat";
import { lekcja as znajdzLekcje } from "@/lib/coach/sciezka";


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

  // Oznacz jako zakończoną
  await admin
    .from("training_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  // Ocena idzie osobno (/api/coach/ocena, limit 300 s), uruchamia ją strona wyników.
  // W tej akcji Vercel ucinał ją po 60 s i agent dostawał stronę błędu.
  redirect(`/app/sesja/${sessionId}`);
}


