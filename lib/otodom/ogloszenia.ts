import { createSupabaseAdmin } from "../supabase/admin";
import { budujOgloszenie, ulicaZAdresu, type OfertaDoEksportu, type Taksonomia } from "./mapowanie";
import taksonomia from "./taksonomia.json";
import { BladOtodom, PORTAL, idMiasta, stanPolaczenia, wywolaj } from "./klient";

export type OgloszenieOtodom = {
  advert_uuid: string | null;
  status: string | null;
  last_action: string | null;
  url: string | null;
  last_error: string | null;
  exact_location: boolean;
  updated_at: string | null;
};

export const STATUSY: Record<string, { label: string; kolor: string }> = {
  wysylanie: { label: "Wysyłamy na Otodom…", kolor: "bg-sky-100 text-sky-800" },
  active: { label: "Aktywne na Otodom", kolor: "bg-emerald-100 text-emerald-800" },
  new: { label: "Dodane, czeka na publikację", kolor: "bg-sky-100 text-sky-800" },
  outdated: { label: "Nieaktywne", kolor: "bg-slate-100 text-slate-700" },
  inactive: { label: "Nieaktywne", kolor: "bg-slate-100 text-slate-700" },
  removed_by_user: { label: "Zdjęte", kolor: "bg-slate-100 text-slate-700" },
  moderated: { label: "Zatrzymane przez moderację Otodom", kolor: "bg-amber-100 text-amber-800" },
  removed_by_moderator: { label: "Usunięte przez moderację Otodom", kolor: "bg-rose-100 text-rose-800" },
  blocked: { label: "Czeka na weryfikację Otodom", kolor: "bg-amber-100 text-amber-800" },
  unpaid: { label: "Brak opłaconego pakietu na Otodom", kolor: "bg-rose-100 text-rose-800" },
  blad: { label: "Błąd publikacji", kolor: "bg-rose-100 text-rose-800" },
  usuniete: { label: "Usunięte z Otodom", kolor: "bg-slate-100 text-slate-700" },
};

export async function ogloszenieOferty(propertyId: string): Promise<OgloszenieOtodom | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("portal_listings")
    .select("advert_uuid, status, last_action, url, last_error, exact_location, updated_at")
    .eq("property_id", propertyId)
    .eq("portal", PORTAL)
    .maybeSingle();
  const o = (data as OgloszenieOtodom | null) ?? null;
  // Webhook potrafi dojść, zanim zapiszemy numer ogłoszenia z odpowiedzi.
  // Wtedy zdarzenie czeka w portal_events i dociągamy je tutaj.
  if (o?.advert_uuid && o.status === "wysylanie") {
    const { data: z } = await admin
      .from("portal_events")
      .select("code, message, payload, created_at")
      .eq("advert_uuid", o.advert_uuid)
      .gte("created_at", o.updated_at ?? new Date(0).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (z?.code) {
      const url = (z.payload as { data?: { url?: string } } | null)?.data?.url ?? o.url;
      await admin.from("portal_listings").update({ status: z.code, url, last_error: z.message ?? null }).eq("property_id", propertyId).eq("portal", PORTAL);
      return { ...o, status: z.code as string, url: url ?? null, last_error: (z.message as string) ?? null };
    }
  }
  return o;
}

async function zapiszStan(agencyId: string, propertyId: string, userId: string, zmiany: Record<string, unknown>) {
  await createSupabaseAdmin()
    .from("portal_listings")
    .upsert({ agency_id: agencyId, property_id: propertyId, portal: PORTAL, published_by: userId, updated_at: new Date().toISOString(), ...zmiany }, { onConflict: "property_id,portal" });
}

export type WynikOperacji = { ok: true; komunikat: string } | { ok: false; bledy: string[] };

/**
 * Publikacja albo aktualizacja oferty. Gdy ogłoszenie już istnieje na Otodom,
 * wysyłamy PUT (aktualizacja treści), inaczej POST. Wynik przychodzi później
 * webhookiem, więc tu zapisujemy stan „wysyłamy” z numerem transakcji.
 */
export async function publikujNaOtodom(agencyId: string, userId: string, propertyId: string, exact: boolean): Promise<WynikOperacji> {
  const admin = createSupabaseAdmin();
  const pol = await stanPolaczenia(agencyId);
  if (!pol.tabele) return { ok: false, bledy: ["Brak tabel eksportu w bazie. Uruchom lib/SETUP-v50-portale.sql w Supabase."] };
  if (!pol.polaczone) return { ok: false, bledy: ["Biuro nie jest połączone z Otodom. Połącz konto w Ustawieniach → Portale."] };

  const { data: o } = await admin.from("properties").select("*").eq("id", propertyId).eq("agency_id", agencyId).maybeSingle();
  if (!o) return { ok: false, bledy: ["Nie znaleziono oferty."] };
  const { data: agent } = await admin.from("profiles").select("full_name, email, phone").eq("id", o.agent_id ?? userId).maybeSingle();

  const cityId = o.city ? await idMiasta(agencyId, String(o.city)).catch(() => null) : null;
  const wynik = budujOgloszenie(
    o as OfertaDoEksportu,
    { name: (agent?.full_name as string) ?? "", email: (agent?.email as string) ?? "", phone: (agent?.phone as string) ?? null },
    { cityId, ulica: ulicaZAdresu(o.address as string | null), exact },
    taksonomia as Taksonomia,
    { test: pol.test },
  );
  if (!wynik.ok) return { ok: false, bledy: wynik.bledy };

  const obecne = await ogloszenieOferty(propertyId);
  const aktualizacja = Boolean(obecne?.advert_uuid && obecne.status !== "usuniete" && obecne.status !== "blad");
  try {
    const odp = await wywolaj<{ transaction_id?: string; data?: { uuid?: string } }>(
      agencyId,
      aktualizacja ? "PUT" : "POST",
      aktualizacja ? `/advert/v1/${obecne!.advert_uuid}` : "/advert/v1",
      wynik.payload,
    );
    await zapiszStan(agencyId, propertyId, userId, {
      advert_uuid: odp.data?.uuid ?? obecne?.advert_uuid ?? null,
      status: "wysylanie",
      last_action: aktualizacja ? "PUT" : "POST",
      last_transaction_id: odp.transaction_id ?? null,
      last_error: null,
      exact_location: exact,
    });
    return { ok: true, komunikat: aktualizacja ? "Zmiany wysłane na Otodom. Status odświeży się sam w ciągu kilku sekund." : "Ogłoszenie wysłane na Otodom. Status odświeży się sam w ciągu kilku sekund." };
  } catch (e) {
    const komunikat = e instanceof BladOtodom ? opisBledu(e) : "Otodom nie odpowiedział. Spróbuj za chwilę.";
    await zapiszStan(agencyId, propertyId, userId, { status: "blad", last_error: komunikat, last_action: aktualizacja ? "PUT" : "POST" });
    return { ok: false, bledy: [komunikat] };
  }
}

function opisBledu(e: BladOtodom): string {
  const d = e.szczegoly as { errors?: { detail?: string; field?: string }[]; data?: { validation?: { detail?: string; field?: string }[] } } | undefined;
  const lista = d?.errors ?? d?.data?.validation ?? [];
  const szczegol = lista.map((x) => [x.field?.replace("urn:concept:", ""), x.detail].filter(Boolean).join(": ")).join("; ");
  return szczegol ? `${e.message} (${szczegol})` : e.message;
}

export async function zmienStanOtodom(agencyId: string, userId: string, propertyId: string, akcja: "activate" | "deactivate" | "delete"): Promise<WynikOperacji> {
  const obecne = await ogloszenieOferty(propertyId);
  if (!obecne?.advert_uuid) return { ok: false, bledy: ["Ta oferta nie jest jeszcze na Otodom."] };
  try {
    const odp =
      akcja === "delete"
        ? await wywolaj<{ transaction_id?: string }>(agencyId, "DELETE", `/advert/v1/${obecne.advert_uuid}`)
        : await wywolaj<{ transaction_id?: string }>(agencyId, "POST", `/advert/v1/${obecne.advert_uuid}/${akcja}`);
    await zapiszStan(agencyId, propertyId, userId, {
      status: akcja === "delete" ? "usuniete" : "wysylanie",
      last_action: akcja.toUpperCase(),
      last_transaction_id: odp.transaction_id ?? null,
      last_error: null,
    });
    const nazwa = { activate: "Aktywacja wysłana", deactivate: "Dezaktywacja wysłana", delete: "Ogłoszenie usunięte z Otodom" }[akcja];
    return { ok: true, komunikat: `${nazwa}. Status odświeży się sam.` };
  } catch (e) {
    const komunikat = e instanceof BladOtodom ? opisBledu(e) : "Otodom nie odpowiedział. Spróbuj za chwilę.";
    await zapiszStan(agencyId, propertyId, userId, { last_error: komunikat });
    return { ok: false, bledy: [komunikat] };
  }
}

/** Ręczne odświeżenie statusu, gdy webhook nie dotarł (Get Advert Metadata). */
export async function odswiezStanOtodom(agencyId: string, propertyId: string): Promise<void> {
  const obecne = await ogloszenieOferty(propertyId);
  if (!obecne?.advert_uuid) return;
  const d = await wywolaj<{ data?: { last_action_status?: string; state?: { code?: string; url?: string }; code?: string; url?: string } }>(agencyId, "GET", `/advert/v1/${obecne.advert_uuid}/meta`).catch(() => null);
  const kod = d?.data?.state?.code ?? d?.data?.code;
  const url = d?.data?.state?.url ?? d?.data?.url;
  if (kod) {
    await createSupabaseAdmin()
      .from("portal_listings")
      .update({ status: kod, ...(url ? { url } : {}), updated_at: new Date().toISOString() })
      .eq("property_id", propertyId)
      .eq("portal", PORTAL);
  }
}
