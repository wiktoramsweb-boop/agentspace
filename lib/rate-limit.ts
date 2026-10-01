import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createSupabaseAdmin } from "./supabase/admin";

/**
 * Limity wywołań oparte o tabelę `rate_events` (migracja v34).
 *
 * Liczymy zdarzenia z danym kluczem w oknie czasu. Gdy tabeli jeszcze nie ma,
 * przepuszczamy: lepiej działać bez limitu niż zablokować całe biuro przez
 * nieuruchomioną migrację.
 */
export async function hitLimit(key: string, max: number, windowSec: number): Promise<boolean> {
  const admin = createSupabaseAdmin();
  const since = new Date(Date.now() - windowSec * 1000).toISOString();

  const { count, error } = await admin
    .from("rate_events")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", since);
  if (error) return false;
  if ((count ?? 0) >= max) return true;

  await admin.from("rate_events").insert({ key });

  // Sprzątanie raz na jakiś czas, żeby tabela nie rosła bez końca.
  if (Math.random() < 0.01) {
    const old = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    await admin.from("rate_events").delete().lt("created_at", old);
  }
  return false;
}

function envInt(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

const DAY = 24 * 3600;

/**
 * Limit AI na osobę i na biuro w ciągu doby. Każde biuro korzysta z AI na
 * jednym kluczu Anthropic, więc jedno konto nie może przepalić całego portfela.
 * Wartości można zmienić w Vercel: AI_DAILY_LIMIT_USER, AI_DAILY_LIMIT_AGENCY.
 */
export async function aiLimitReached(user: { id: string; agency_id: string | null }): Promise<boolean> {
  if (await hitLimit(`ai:user:${user.id}`, envInt("AI_DAILY_LIMIT_USER", 200), DAY)) return true;
  if (user.agency_id && (await hitLimit(`ai:agency:${user.agency_id}`, envInt("AI_DAILY_LIMIT_AGENCY", 1500), DAY))) {
    return true;
  }
  return false;
}

/** Gotowa odpowiedź 429 dla endpointów AI. */
export function aiLimitResponse(): Response {
  return Response.json(
    { error: "Dzisiejszy limit zapytań do AI został wykorzystany. Spróbuj jutro albo napisz do nas, jeśli potrzebujesz więcej." },
    { status: 429 },
  );
}

/** Skrót adresu IP odwiedzającego (bez zapisywania samego IP). */
export async function visitorKey(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256")
    .update(ip + (process.env.IP_HASH_SALT ?? "agentspace"))
    .digest("hex")
    .slice(0, 24);
}
