"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { dopiszKredyty, zwrocKredyty } from "@/lib/kredyty";
import { kredytyZaRozmowe, kredytyZGory } from "@/lib/kredyty-cennik";
import type { ChatMessage } from "@/lib/types";

/**
 * Koniec rozmowy głosowej.
 *
 * Dwie rzeczy naraz: dopisujemy wypowiedzi do transkryptu sesji, żeby ocena
 * liczyła się dokładnie tak samo jak dla rozmowy pisanej, i oddajemy kredyty
 * pobrane z góry za minuty, których agent nie wykorzystał.
 */
export async function zapiszRozmoweGlosowa(
  sessionId: string,
  wypowiedzi: { role: "agent" | "client"; content: string }[],
  sekundy: number,
  /** Czy połączenie w ogóle doszło do skutku. Jeśli nie, oddajemy całość. */
  polaczono = true,
): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();

  const { data: sesja } = await admin
    .from("training_sessions")
    .select("id, agent_id, transcript, status")
    .eq("id", sessionId)
    .maybeSingle();
  if (!sesja || sesja.agent_id !== user.id) return { ok: false };

  // Treść przycinamy, bo to jest tekst z rozpoznawania mowy, a nie pole,
  // które ktoś wypełnia świadomie.
  const czyste: ChatMessage[] = wypowiedzi
    .filter((w) => w.content.trim().length > 0)
    .slice(0, 200)
    .map((w) => ({ role: w.role, content: w.content.trim().slice(0, 2000) }));

  if (czyste.length > 0 && sesja.status === "in_progress") {
    const stary = (sesja.transcript ?? []) as ChatMessage[];
    await admin
      .from("training_sessions")
      .update({ transcript: [...stary, ...czyste] })
      .eq("id", sessionId);
  }

  // Rozliczenie w obie strony. Nieudane połączenie nic nie kosztuje, krótsza
  // rozmowa dostaje zwrot, dłuższa dopłatę według faktycznych minut.
  const pobrane = kredytyZGory();
  const naleznosc = polaczono ? kredytyZaRozmowe(sekundy) : 0;
  if (naleznosc > pobrane) await dopiszKredyty(user, "coach_glos", naleznosc - pobrane);
  else await zwrocKredyty(user, "coach_glos", pobrane - naleznosc);

  revalidatePath(`/app/sesja/${sessionId}`);
  return { ok: true };
}
