import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { buildClientSystemPrompt } from "@/lib/ai/coach";
import { kontekstSesji } from "@/lib/ai/oferta-kontekst";
import { brakKredytow, brakKredytowResponse } from "@/lib/kredyty";
import { kredytyZGory, MAX_MINUT_ROZMOWY } from "@/lib/kredyty-cennik";
import { glosWlaczony, dostepDoRozmowy, pierwszeZdanie } from "@/lib/glos";
import { plecRozmowcy } from "@/lib/karta-rozmowy";

/**
 * Start rozmowy głosowej z klientem AI.
 *
 * Kredyty pobieramy Z GÓRY za maksymalną długość rozmowy. Inaczej zamknięcie
 * karty w połowie byłoby darmową rozmową, a to jest najdroższa operacja
 * w całej aplikacji. Resztę oddajemy po rozłączeniu.
 */
export async function POST(req: Request) {
  if (!glosWlaczony()) {
    return Response.json({ error: "Rozmowa głosowa nie jest włączona." }, { status: 503 });
  }

  const user = await requireUser();
  const { sessionId, plec: wymuszona } = (await req.json()) as { sessionId?: string; plec?: string };
  if (!sessionId) return Response.json({ error: "Brak sesji." }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: sesja } = await admin
    .from("training_sessions")
    .select("id, agent_id, personality, difficulty, status, scenario:scenarios(system_prompt, category, brief)")
    .eq("id", sessionId)
    .maybeSingle();

  // Rozmawiać można wyłącznie w swojej sesji i tylko dopóki trwa.
  if (!sesja || sesja.agent_id !== user.id) {
    return Response.json({ error: "Brak dostępu do tej sesji." }, { status: 403 });
  }
  if (sesja.status !== "in_progress") {
    return Response.json({ error: "Ta sesja jest już zakończona." }, { status: 409 });
  }

  if (await brakKredytow(user, "coach_glos", kredytyZGory())) {
    return brakKredytowResponse();
  }

  const scenariusz = sesja.scenario as unknown as { system_prompt: string; category: string; brief: string } | null;
  if (!scenariusz) return Response.json({ error: "Nie ma takiego scenariusza." }, { status: 404 });

  // Ta sama instrukcja, którą dostaje klient AI w trybie tekstowym. Dzięki temu
  // rozmowa głosowa i pisana zachowują się tak samo, a scenariusze pisze się raz.
  const prompt = buildClientSystemPrompt(
    scenariusz.system_prompt,
    (sesja.personality as string) ?? "biznesowy",
    (sesja.difficulty as string) ?? "sredni",
    await kontekstSesji(sessionId),
  );

  // Głos ustawia się na agencie u dostawcy, nie na pojedynczej rozmowie, więc
  // kobiece scenariusze kierujemy na drugiego agenta. Płeć bierzemy z opisu
  // scenariusza, bo to ona stoi na ekranie telefonu i musi się zgadzać.
  // Wybór agenta ma pierwszeństwo nad tym, co wynika z opisu scenariusza.
  const plec =
    wymuszona === "k" || wymuszona === "m" ? wymuszona : plecRozmowcy(scenariusz.brief ?? "");
  let dostep = await dostepDoRozmowy(plec);

  // Drugi agent bywa nieskonfigurowany albo nieopublikowany. Lepiej, żeby
  // rozmowa odbyła się nie tym głosem, niż żeby nie odbyła się wcale.
  if (!dostep.token && !dostep.adres && plec === "k") {
    dostep = await dostepDoRozmowy("m");
  }

  if (!dostep.token && !dostep.adres) {
    return Response.json(
      { error: `Dostawca głosu odmówił. ${dostep.blad ?? ""}`.trim() },
      { status: 502 },
    );
  }

  return Response.json({
    token: dostep.token,
    adres: dostep.adres,
    prompt,
    pierwsze: pierwszeZdanie(scenariusz.category),
    maxMinut: MAX_MINUT_ROZMOWY,
    pobrane: kredytyZGory(),
  });
}
