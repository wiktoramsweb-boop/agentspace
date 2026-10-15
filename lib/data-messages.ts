import { createSupabaseAdmin } from "./supabase/admin";

export type ClientMessage = {
  id: string;
  channel: "mail" | "sms" | "inne";
  direction: "wyslana" | "otrzymana";
  subject: string | null;
  body: string;
  sent_at: string;
  authorName: string | null;
  /** v49: wyslana | blad, gdy mail poszedł z aplikacji. Puste przy wpisach ręcznych. */
  status?: string | null;
  error?: string | null;
};

/** Korespondencja z klientem, od najnowszej. `ready: false` = brak tabeli (v23). */
export async function getClientMessages(
  agencyId: string | null,
  clientId: string,
): Promise<{ ready: boolean; messages: ClientMessage[] }> {
  if (!agencyId) return { ready: false, messages: [] };
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("client_messages")
    // Gwiazdka, a nie lista kolumn: kolumny statusu dochodzą w v49, a jawna
    // lista z nimi wywracałaby korespondencję w bazie sprzed migracji.
    .select("*")
    .eq("agency_id", agencyId)
    .eq("client_id", clientId)
    .order("sent_at", { ascending: false })
    .limit(100);
  if (error) return { ready: false, messages: [] };

  const ids = [...new Set((data ?? []).map((m) => m.author_id).filter(Boolean))] as string[];
  const { data: people } = ids.length
    ? await admin.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] as { id: string; full_name: string | null }[] };
  const names = new Map((people ?? []).map((p) => [p.id, p.full_name]));

  return {
    ready: true,
    messages: (data ?? []).map((m) => ({
      id: m.id,
      channel: m.channel,
      direction: m.direction,
      subject: m.subject,
      body: m.body,
      sent_at: m.sent_at,
      authorName: m.author_id ? names.get(m.author_id) ?? null : null,
      status: (m as { status?: string | null }).status ?? null,
      error: (m as { error?: string | null }).error ?? null,
    })),
  };
}
