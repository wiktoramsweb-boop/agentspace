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





/** Skrót adresu IP odwiedzającego (bez zapisywania samego IP). */
export async function visitorKey(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256")
    .update(ip + (process.env.IP_HASH_SALT ?? "agentspace"))
    .digest("hex")
    .slice(0, 24);
}
