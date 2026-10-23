import { createSupabaseAdmin } from "./supabase/admin";
import { stanDostepu } from "./abonament-cennik";
import { visitorKey } from "./rate-limit";
import { zPominieciemDemo } from "./demo/straz";
import type { ProfileWithAgency } from "./types";

/**
 * Limity wersji próbnej: okres próbny biura i publiczne demo.
 *
 * Próba ma pokazać, że narzędzie działa, a nie zastąpić abonament. Najdroższe
 * rzeczy (rozmowy AI Coach, wyceny z aktów) dostają kilka podejść, a biblioteka
 * technik jest tylko w abonamencie.
 *
 * Biuro na próbie liczymy w całości, od założenia konta. Demo to jedno wspólne
 * konto dla wszystkich odwiedzających, więc tam liczymy osobno na każdą sieć
 * i odnawiamy co dobę: inaczej pierwszych trzech gości zużyłoby limit za resztę.
 */

export type RodzajProby = "coach" | "wycena";

export const LIMIT_PROBY: Record<RodzajProby, number> = { coach: 3, wycena: 3 };

export const NAZWA_PROBY: Record<RodzajProby, { mn: string; jedna: string }> = {
  coach: { mn: "rozmowy z klientem AI", jedna: "rozmowę" },
  wycena: { mn: "wyceny z aktów notarialnych", jedna: "wycenę" },
};

export type StanProby = { naProbie: boolean; demo: boolean; limit: number; uzyte: number; zostalo: number };

/** Czy użytkownik korzysta z wersji próbnej (okres próbny albo demo). */
export function naProbie(user: ProfileWithAgency): { naProbie: boolean; demo: boolean } {
  const demo = Boolean(user.agency?.is_demo);
  if (demo) return { naProbie: true, demo: true };
  return { naProbie: stanDostepu(user.agency ?? null).probny, demo: false };
}

async function kluczDemo(rodzaj: RodzajProby): Promise<string> {
  return `proba:${rodzaj}:demo:${await visitorKey()}`;
}

export async function stanProby(user: ProfileWithAgency, rodzaj: RodzajProby): Promise<StanProby> {
  const { naProbie: proba, demo } = naProbie(user);
  const limit = LIMIT_PROBY[rodzaj];
  if (!proba || !user.agency_id) return { naProbie: false, demo, limit, uzyte: 0, zostalo: Infinity };

  const admin = createSupabaseAdmin();
  let uzyte = 0;
  if (demo) {
    const { count } = await admin
      .from("rate_events")
      .select("id", { count: "exact", head: true })
      .like("key", `${await kluczDemo(rodzaj)}%`)
      .gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
    uzyte = count ?? 0;
  } else if (rodzaj === "coach") {
    const { count } = await admin.from("training_sessions").select("id", { count: "exact", head: true }).eq("agency_id", user.agency_id);
    uzyte = count ?? 0;
  } else {
    const { count } = await admin.from("rate_events").select("id", { count: "exact", head: true }).like("key", `proba:${rodzaj}:${user.agency_id}%`);
    uzyte = count ?? 0;
  }
  return { naProbie: true, demo, limit, uzyte, zostalo: Math.max(0, limit - uzyte) };
}

/**
 * Zapis jednego podejścia. Rozmów biura na próbie nie zapisujemy osobno:
 * liczą się same sesje treningowe. Gość demo nie może zapisywać, więc zapis
 * idzie w imieniu systemu.
 *
 * `slad` odróżnia podejścia: ta sama wycena odświeżona w przeglądarce ma ten
 * sam ślad i nie zużywa drugiego podejścia.
 */
export async function zuzyjProbe(user: ProfileWithAgency, rodzaj: RodzajProby, slad = ""): Promise<void> {
  const { naProbie: proba, demo } = naProbie(user);
  if (!proba || !user.agency_id) return;
  if (!demo && rodzaj === "coach") return;
  const baza = demo ? await kluczDemo(rodzaj) : `proba:${rodzaj}:${user.agency_id}`;
  const key = slad ? `${baza}:${slad}` : `${baza}:${crypto.randomUUID().slice(0, 8)}`;
  const admin = createSupabaseAdmin();
  if (slad) {
    const { data } = await admin.from("rate_events").select("id").eq("key", key).limit(1);
    if (data?.length) return;
  }
  await zPominieciemDemo(async () => {
    await admin.from("rate_events").insert({ key, agency_id: user.agency_id, credits: 0 });
  });
}

/** Czy to podejście już było liczone (np. odświeżona ta sama wycena). */
export async function juzLiczone(user: ProfileWithAgency, rodzaj: RodzajProby, slad: string): Promise<boolean> {
  const { naProbie: proba, demo } = naProbie(user);
  if (!proba || !user.agency_id) return false;
  const baza = demo ? await kluczDemo(rodzaj) : `proba:${rodzaj}:${user.agency_id}`;
  const { data } = await createSupabaseAdmin().from("rate_events").select("id").eq("key", `${baza}:${slad}`).limit(1);
  return Boolean(data?.length);
}
