"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { dostepPoTokenie } from "@/lib/data-portal";
import { todayPL } from "@/lib/datetime";

/**
 * Akcje klienta w portalu.
 *
 * Każda zaczyna od tokenu i sama ustala zakres. Żadna nie przyjmuje id biura
 * ani klienta z zewnątrz, więc podmiana parametru w żądaniu nie wyprowadzi
 * poza własne dane.
 */

export type WynikAkcji = { ok: true } | { ok: false; error: string };

/** Reakcja kupującego na podesłaną ofertę. */
export async function oznaczOferte(
  token: string,
  propertyId: string,
  reakcja: "lubi" | "nie_lubi",
): Promise<WynikAkcji> {
  const dostep = await dostepPoTokenie(token);
  if (!dostep || dostep.rodzaj !== "kupujacy") return { ok: false, error: "Brak dostępu." };
  if (!/^[0-9a-f-]{36}$/i.test(propertyId)) return { ok: false, error: "Zły identyfikator." };

  const admin = createSupabaseAdmin();

  // Oferta musi pochodzić z dopasowań tego klienta, a nie być dowolnym id.
  const { data: poszukiwania } = await admin
    .from("searches")
    .select("id")
    .eq("agency_id", dostep.agency_id)
    .eq("client_id", dostep.client_id);
  const searchIds = (poszukiwania ?? []).map((s) => s.id as string);
  if (searchIds.length === 0) return { ok: false, error: "Brak dostępu." };

  const { data: dopasowanie } = await admin
    .from("search_matches")
    .select("id")
    .in("search_id", searchIds)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (!dopasowanie) return { ok: false, error: "Ta oferta nie była Ci wysłana." };

  await admin.from("client_offer_feedback").upsert(
    { access_id: dostep.id, property_id: propertyId, reakcja },
    { onConflict: "access_id,property_id" },
  );

  // Ten sam sygnał trafia do statusu dopasowania, żeby agent zobaczył go tam,
  // gdzie i tak patrzy, bez zaglądania w osobną tabelę.
  await admin
    .from("search_matches")
    .update({ status: reakcja === "lubi" ? "zainteresowany" : "odrzucone" })
    .eq("id", dopasowanie.id);

  revalidatePath(`/klient/${token}`);
  return { ok: true };
}

/** Termin, w którym kupujący może oglądać. */
export async function dodajTermin(
  token: string,
  dzien: string,
  od: string,
  doGodz: string,
): Promise<WynikAkcji> {
  const dostep = await dostepPoTokenie(token);
  if (!dostep || dostep.rodzaj !== "kupujacy") return { ok: false, error: "Brak dostępu." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dzien) || dzien < todayPL()) {
    return { ok: false, error: "Wybierz dzień z przyszłości." };
  }
  if (!/^\d{2}:\d{2}$/.test(od) || !/^\d{2}:\d{2}$/.test(doGodz) || od >= doGodz) {
    return { ok: false, error: "Godzina końca musi być późniejsza niż początku." };
  }

  const admin = createSupabaseAdmin();
  await admin
    .from("client_availability")
    .upsert(
      { access_id: dostep.id, dzien, od, do_godz: doGodz },
      { onConflict: "access_id,dzien,od,do_godz" },
    );

  revalidatePath(`/klient/${token}/terminy`);
  return { ok: true };
}

export async function usunTermin(token: string, id: string): Promise<WynikAkcji> {
  const dostep = await dostepPoTokenie(token);
  if (!dostep) return { ok: false, error: "Brak dostępu." };

  const admin = createSupabaseAdmin();
  // Warunek na dostęp w samym zapytaniu: nie da się skasować cudzego terminu.
  await admin.from("client_availability").delete().eq("id", id).eq("access_id", dostep.id);

  revalidatePath(`/klient/${token}/terminy`);
  return { ok: true };
}

/** Wiadomość od klienta do agenta. */
export async function wyslijWiadomosc(token: string, tresc: string): Promise<WynikAkcji> {
  const dostep = await dostepPoTokenie(token);
  if (!dostep) return { ok: false, error: "Brak dostępu." };

  const czysta = tresc.trim().slice(0, 2000);
  if (czysta.length < 2) return { ok: false, error: "Napisz treść wiadomości." };

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("client_portal_messages")
    .insert({ access_id: dostep.id, autor: "klient", tresc: czysta });

  if (error) return { ok: false, error: "Nie udało się wysłać. Spróbuj za chwilę." };

  revalidatePath(`/klient/${token}/wiadomosci`);
  return { ok: true };
}

/**
 * Decyzja właściciela o zmianie ceny ofertowej.
 *
 * To jest zgoda albo jej brak, a nie informacja: dopóki klient nie kliknie,
 * cena w ofercie zostaje stara. Zapis z godziną decyzji jest po to, żeby
 * biuro miało dowód, że właściciel się zgodził.
 */
export async function decyzjaOCenie(
  token: string,
  propozycjaId: string,
  zgoda: boolean,
): Promise<WynikAkcji> {
  const dostep = await dostepPoTokenie(token);
  if (!dostep || dostep.rodzaj !== "sprzedajacy") return { ok: false, error: "Brak dostępu." };

  const admin = createSupabaseAdmin();
  // Warunek na dostęp w samym zapytaniu: nie da się zatwierdzić cudzej propozycji.
  const { data: prop } = await admin
    .from("client_price_proposals")
    .select("id, property_id, cena_proponowana, status")
    .eq("id", propozycjaId)
    .eq("access_id", dostep.id)
    .maybeSingle();
  if (!prop) return { ok: false, error: "Nie ma takiej propozycji." };
  if (prop.status !== "oczekuje") return { ok: false, error: "Ta propozycja była już rozpatrzona." };

  await admin
    .from("client_price_proposals")
    .update({
      status: zgoda ? "zaakceptowana" : "odrzucona",
      decided_at: new Date().toISOString(),
    })
    .eq("id", propozycjaId)
    .eq("access_id", dostep.id);

  // Zgoda od razu zmienia cenę w ofercie - inaczej agent musiałby pilnować
  // tego ręcznie i portal byłby tylko ankietą.
  if (zgoda) {
    await admin
      .from("properties")
      .update({ price_pln: prop.cena_proponowana })
      .eq("id", prop.property_id)
      .eq("agency_id", dostep.agency_id);
  }

  revalidatePath(`/klient/${token}/n/${prop.property_id}`);
  return { ok: true };
}
