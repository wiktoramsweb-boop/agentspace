import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { plikIcs } from "@/lib/ics";

/**
 * Prywatny kalendarz osoby w formacie iCalendar. Bez logowania, bo pobierają go
 * serwery Google i Apple: dostęp daje sam losowy token. Tytuł bez telefonów,
 * a przy kontakcie tylko imię i nazwisko, żeby dane nie wyciekały poza potrzebę.
 */
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const czysty = token.replace(/\.ics$/, "");
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(czysty)) return new Response("Nie znaleziono", { status: 404 });
  const admin = createSupabaseAdmin();
  const { data: t } = await admin.from("calendar_tokens").select("profile_id, agency_id").eq("token", czysty).maybeSingle();
  if (!t) return new Response("Nie znaleziono", { status: 404 });

  const od = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const doKiedy = new Date(Date.now() + 365 * 86_400_000).toISOString();
  const { data } = await admin
    .from("activities")
    .select("id, subject, due_at, duration_s, status, contact_name")
    .eq("agency_id", t.agency_id)
    .contains("assignee_ids", [t.profile_id])
    .gte("due_at", od)
    .lt("due_at", doKiedy)
    .order("due_at")
    .limit(2000);
  await admin.from("calendar_tokens").update({ ostatnio_pobrany: new Date().toISOString() }).eq("token", czysty);
  const zdarzenia = ((data ?? []) as { id: string; subject: string; due_at: string; duration_s: number | null; status: string; contact_name: string | null }[]).map((a) => ({
    id: a.id,
    tytul: a.subject,
    start: a.due_at,
    sekundy: a.duration_s,
    opis: a.contact_name,
    wykonane: a.status === "wykonane",
  }));
  return new Response(plikIcs("AgentSpace", zdarzenia), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "private, max-age=900" } });
}
