import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { ocenISesje, type Sesja } from "@/lib/coach/ocena";
import { zapiszBlad } from "@/lib/blad";
import type { ChatMessage } from "@/lib/types";

// Ocena dłuższej rozmowy modelem trwa 20-60 s. W akcji strony limit 60 s
// potrafił ją uciąć, więc ocena ma własny endpoint z zapasem.
export const maxDuration = 300;

const json = (d: unknown, status = 200) => Response.json(d, { status });

/**
 * Ocena zakończonej sesji. Oceniamy tylko sesję bez wyniku, więc ponowne
 * kliknięcie nie losuje nowej oceny i nie kosztuje kredytów: nieudana próba
 * to nasz błąd, nie agenta.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Zaloguj się ponownie." }, 401);
  const { sessionId } = (await request.json().catch(() => ({}))) as { sessionId?: string };
  if (!sessionId) return json({ error: "Brak sesji." }, 400);

  const admin = createSupabaseAdmin();
  const { data: s } = await admin.from("training_sessions").select("*").eq("id", sessionId).maybeSingle();
  if (!s || s.agent_id !== user.id) return json({ error: "Nie znaleziono rozmowy." }, 404);

  const { data: jest } = await admin.from("session_scores").select("id").eq("session_id", sessionId).limit(1).maybeSingle();
  if (jest) return json({ ok: true });

  const transcript = (s.transcript ?? []) as ChatMessage[];
  if (!transcript.some((m) => m.role === "agent")) return json({ error: "W rozmowie nie padło żadne Twoje zdanie." }, 400);

  // Odświeżenie strony w trakcie oceny nie może zlecić drugiej, równoległej.
  const ctx = (s.context ?? {}) as Record<string, unknown>;
  const start = typeof ctx.ocena_start === "string" ? Date.parse(ctx.ocena_start) : 0;
  if (Date.now() - start < 120_000) return json({ trwa: true });
  await admin.from("training_sessions").update({ context: { ...ctx, ocena_start: new Date().toISOString() } }).eq("id", sessionId);

  try {
    const wynik = await ocenISesje(admin, { ...s, context: { ...ctx } } as Sesja, true);
    if (wynik == null) throw new Error("Nie zapisano oceny w bazie.");
    return json({ ok: true });
  } catch (e) {
    await zapiszBlad("coach/ocena", e, { agencyId: user.agency_id, szczegoly: `sesja ${sessionId}, ${transcript.length} wypowiedzi` });
    const { data: teraz } = await admin.from("training_sessions").select("context").eq("id", sessionId).maybeSingle();
    const c = { ...((teraz?.context as Record<string, unknown> | null) ?? {}) };
    delete c.ocena_start;
    await admin.from("training_sessions").update({ context: c }).eq("id", sessionId);
    return json({ error: "Nie udało się ocenić rozmowy. Spróbuj jeszcze raz za chwilę." }, 502);
  }
}
