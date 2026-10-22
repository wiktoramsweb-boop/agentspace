"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { dopiszKredyty, zwrocKredyty } from "@/lib/kredyty";
import { kredytyZaRozmowe, kredytyZGory } from "@/lib/kredyty-cennik";
import { bezZnacznikowMowy, toSzum } from "@/lib/coach/mowa";
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
  wypowiedzi: { role: "agent" | "client"; content: string; t?: number }[],
  sekundy: number,
  /** Czy połączenie w ogóle doszło do skutku. Jeśli nie, oddajemy całość. */
  polaczono = true,
  /** Identyfikator rozmowy u dostawcy: po nim pobieramy nagranie do analizy. */
  rozmowaId: string | null = null,
): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();

  const { data: sesja } = await admin
    .from("training_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!sesja || sesja.agent_id !== user.id) return { ok: false };

  // Treść przycinamy, bo to jest tekst z rozpoznawania mowy, a nie pole,
  // które ktoś wypełnia świadomie.
  const czyste: ChatMessage[] = wypowiedzi
    .slice(0, 200)
    .map((w) => ({
      role: w.role,
      content: bezZnacznikowMowy(w.content).slice(0, 2000),
      ...(typeof w.t === "number" && Number.isFinite(w.t) ? { t: Math.max(0, Math.round(w.t)) } : {}),
    }))
    // Filtr po oczyszczeniu: wypowiedź złożona z samego znacznika emocji
    // zostaje pusta i nie ma czego zapisywać.
    .filter((w) => w.content.length > 0 && !toSzum(w.content));

  if (czyste.length > 0 && sesja.status === "in_progress") {
    const stary = (sesja.transcript ?? []) as ChatMessage[];
    const id = rozmowaId && /^[A-Za-z0-9_-]{6,80}$/.test(rozmowaId) ? rozmowaId : null;
    // Kolumna context istnieje od v49; bez niej select("*") jej nie zwraca i zapisujemy sam transkrypt.
    const maKontekst = "context" in sesja;
    await admin
      .from("training_sessions")
      .update({
        transcript: [...stary, ...czyste],
        ...(maKontekst
          ? { context: { ...((sesja.context as Record<string, unknown> | null) ?? {}), glos: { ...(id ? { rozmowa: id } : {}), sekundy } } }
          : {}),
      })
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
