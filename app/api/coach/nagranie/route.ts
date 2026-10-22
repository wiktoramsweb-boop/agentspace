import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { kluczGlosu } from "@/lib/glos";

/**
 * Nagranie rozmowy głosowej do odsłuchu na ekranie wyników.
 *
 * Nagranie trzyma dostawca głosu. Przeglądarka nie może pytać go wprost,
 * bo wymagałoby to klucza API, więc przepuszczamy dźwięk przez serwer po
 * sprawdzeniu, że pyta właściciel sesji albo jego przełożony.
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Nie zalogowano", { status: 401 });
  const id = new URL(req.url).searchParams.get("sesja") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Zła sesja", { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: s } = await admin.from("training_sessions").select("agent_id, agency_id, context").eq("id", id).maybeSingle();
  if (!s) return new Response("Brak sesji", { status: 404 });

  let wolno = s.agent_id === user.id || (["owner", "director"].includes(user.role) && s.agency_id === user.agency_id);
  if (!wolno && user.role === "manager" && s.agency_id === user.agency_id) {
    const { data: agent } = await admin.from("profiles").select("manager_id").eq("id", s.agent_id).maybeSingle();
    wolno = agent?.manager_id === user.id;
  }
  if (!wolno) return new Response("Brak dostępu", { status: 403 });

  const rozmowa = (s.context as { glos?: { rozmowa?: string } } | null)?.glos?.rozmowa;
  const klucz = kluczGlosu();
  if (!rozmowa || !klucz) return new Response("Brak nagrania", { status: 404 });

  const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${encodeURIComponent(rozmowa)}/audio`, {
    headers: { "xi-api-key": klucz },
    cache: "no-store",
  });
  if (!r.ok || !r.body) return new Response("Nagranie jeszcze się przygotowuje", { status: 404 });
  return new Response(r.body, {
    headers: {
      "Content-Type": r.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
