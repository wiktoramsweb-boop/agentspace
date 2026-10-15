"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { brakTabeli, komunikatMigracji } from "@/lib/migracja";
import { zapiszZdarzenie } from "@/lib/dziennik";
import {
  RODZAJE_ZGOD,
  ZRODLA_ZGODY,
  maZgodeMarketingowa,
  stanZgod,
  type WpisZgody,
} from "@/lib/rodo-model";

type Wynik = { ok: true; wpisy: WpisZgody[] } | { ok: false; error: string };

export async function zgodyKlienta(clientId: string): Promise<{ wpisy: WpisZgody[] } | null> {
  const user = await requireUser();
  const { data, error } = await createSupabaseAdmin()
    .from("client_consents")
    .select("id, kind, granted, source, note, recorded_at, recorded_by")
    .eq("client_id", clientId)
    .eq("agency_id", user.agency_id ?? "")
    .order("recorded_at", { ascending: false })
    .limit(200);
  if (error) return null;
  return { wpisy: (data ?? []) as WpisZgody[] };
}

/**
 * Dopisuje zmianę zgody. Stare pole `clients.marketing_consent` trzymamy
 * w zgodzie z rejestrem, bo czyta je reszta aplikacji (filtry, eksport,
 * automatyzacje sprzed v49).
 */
export async function zapiszZgode(
  clientId: string,
  rodzaj: string,
  udzielona: boolean,
  zrodlo: string,
  notatka: string,
): Promise<Wynik> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const r = RODZAJE_ZGOD.find((x) => x.value === rodzaj);
  if (!r) return { ok: false, error: "Nieznany rodzaj zgody." };
  const zr = ZRODLA_ZGODY.some((x) => x.value === zrodlo) ? zrodlo : "ustnie";

  const admin = createSupabaseAdmin();
  const { data: klient } = await admin.from("clients").select("id, name").eq("id", clientId).eq("agency_id", user.agency_id).maybeSingle();
  if (!klient) return { ok: false, error: "Nie znaleziono klienta." };

  const { error } = await admin.from("client_consents").insert({
    agency_id: user.agency_id,
    client_id: clientId,
    kind: r.value,
    granted: udzielona,
    source: zr,
    note: notatka.trim().slice(0, 300) || null,
    recorded_by: user.id,
  });
  if (error) return { ok: false, error: brakTabeli(error) ? komunikatMigracji() : error.message };

  const lista = await zgodyKlienta(clientId);
  const wpisy = lista?.wpisy ?? [];
  if (r.marketing) {
    const teraz = maZgodeMarketingowa(stanZgod(wpisy));
    await admin
      .from("clients")
      .update({ marketing_consent: teraz, marketing_consent_at: teraz ? new Date().toISOString() : null })
      .eq("id", clientId)
      .eq("agency_id", user.agency_id);
  }
  await zapiszZdarzenie({
    agencyId: user.agency_id,
    actorId: user.id,
    akcja: "zgoda_rodo",
    rodzaj: "klient",
    id: clientId,
    opis: `„${klient.name}": ${r.nazwa.toLowerCase()} – ${udzielona ? (r.value === "obowiazek_informacyjny" ? "przekazana" : "udzielona") : "wycofana"}`,
  });
  revalidatePath(`/app/klienci/${clientId}`);
  return { ok: true, wpisy };
}
