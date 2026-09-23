import { SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Rozpoznawanie własnych domen biur w middleware.
 *
 * Middleware działa na brzegu sieci i przy każdym żądaniu, więc zamiast
 * klienta Supabase używamy zwykłego zapytania HTTP i trzymamy wynik w pamięci
 * instancji przez kilka minut. Dzięki temu podpięta domena nie dokłada
 * zapytania do bazy przy każdym odświeżeniu strony.
 */

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { slug: string | null; exp: number }>();

/** Adresy, pod którymi stoi sam AgentSpace, a nie strona klienta. */
export function isOwnHost(host: string): boolean {
  const h = host.toLowerCase().split(":")[0];
  return (
    h === "agentspace.pl" ||
    h === "www.agentspace.pl" ||
    h === "localhost" ||
    h === "127.0.0.1" ||
    h.endsWith(".vercel.app")
  );
}

export async function slugForDomain(host: string): Promise<string | null> {
  const domain = host.toLowerCase().split(":")[0].replace(/^www\./, "");
  const hit = cache.get(domain);
  if (hit && hit.exp > Date.now()) return hit.slug;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!key) return null;

  try {
    const base = (process.env.SUPABASE_URL ?? SUPABASE_URL).replace(/\/$/, "");
    const url = `${base}/rest/v1/site_config?select=slug,published&domain=eq.${encodeURIComponent(domain)}&limit=1`;
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const rows = (await res.json()) as { slug: string; published: boolean }[];
    const slug = rows[0]?.published ? rows[0].slug : null;
    cache.set(domain, { slug, exp: Date.now() + TTL_MS });
    return slug;
  } catch {
    return null;
  }
}
