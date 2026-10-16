"use server";

import { idZBiura } from "@/lib/agency-ids";
import { mozeEdytowacTransakcje } from "@/lib/uprawnienia";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { DealStatus } from "@/lib/types";
import { after } from "next/server";
import { poZamknieciuTransakcji } from "@/lib/zdarzenia";
import { zapiszZdarzenie } from "@/lib/dziennik";

function num(v: FormDataEntryValue | null): number {
  const n = parseInt(String(v ?? "0").replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** Wynik zapisu. Modal zamyka się tylko przy ok, inaczej pokazuje powód. */
export type SaveResult = { ok: true } | { ok: false; error: string };

/**
 * Kwoty z formularza transakcji (nowej i edytowanej). Prowizje od stron
 * przychodzą już przeliczone na zł po stronie kalkulatora.
 */
function kwotyZFormularza(formData: FormData, domyslnyUdzial: number) {
  const seller = num(formData.get("commission_seller"));
  const buyer = num(formData.get("commission_buyer"));
  const landlord = num(formData.get("commission_landlord"));
  const tenant = num(formData.get("commission_tenant"));
  const extras = num(formData.get("extras"));

  let split = num(formData.get("split"));
  if (split <= 0 || split > 100) split = domyslnyUdzial;

  // Prowizja biura (brutto) = suma stron. Agent liczony od NETTO (bez 23% VAT).
  const officeTotal = seller + buyer + landlord + tenant;
  const netto = officeTotal / 1.23;
  return {
    transaction_value_pln: num(formData.get("transaction_value")) || null,
    commission_seller_pln: seller,
    commission_buyer_pln: buyer,
    commission_landlord_pln: landlord,
    commission_tenant_pln: tenant,
    extras_pln: extras,
    extras_note: extras > 0 ? String(formData.get("extras_note") ?? "").trim() || null : null,
    agent_split_pct: split,
    commission_pln: officeTotal,
    agent_earnings_pln: Math.round((netto * split) / 100) + extras,
    expected_close: String(formData.get("expectedClose") ?? "") || null,
  };
}

export async function createDeal(formData: FormData): Promise<SaveResult> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Podaj opis transakcji." };

  const admin = createSupabaseAdmin();
  const [propertyId, clientId] = await Promise.all([
    idZBiura(admin, "properties", String(formData.get("property_id") ?? ""), user.agency_id),
    idZBiura(admin, "clients", String(formData.get("client_id") ?? ""), user.agency_id),
  ]);
  const { error: insertError } = await admin.from("deals").insert({
    agent_id: user.id,
    agency_id: user.agency_id,
    title,
    property_id: propertyId,
    client_id: clientId,
    ...kwotyZFormularza(formData, user.default_split_pct ?? 50),
    status: "w_toku",
  });

  // Bez tego nieudany zapis zamykał modal tak samo jak udany.
  if (insertError) {
    return { ok: false, error: `Nie udało się zapisać transakcji: ${insertError.message}` };
  }

  revalidatePath("/app/prowizje");
  revalidatePath("/app");
  return { ok: true };
}

/** Poprawka wpisanej transakcji: opis, oferta, klient i wszystkie kwoty. Status zmienia się osobno. */
export async function updateDeal(dealId: string, formData: FormData): Promise<SaveResult> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Podaj opis transakcji." };

  const admin = createSupabaseAdmin();
  const { data: deal } = await admin
    .from("deals")
    .select("agent_id, property_id, commission_pln, agent_earnings_pln")
    .eq("id", dealId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!deal || !mozeEdytowacTransakcje(user, deal)) {
    return { ok: false, error: "Tę transakcję może zmienić tylko jej opiekun albo CEO." };
  }

  const zmiany: Record<string, unknown> = { title, ...kwotyZFormularza(formData, user.default_split_pct ?? 50) };
  // Formularz przy ofercie nie ma pola klienta: wtedy zostawiamy to, co było.
  if (formData.has("property_id")) {
    zmiany.property_id = await idZBiura(admin, "properties", String(formData.get("property_id") ?? ""), user.agency_id);
  }
  if (formData.has("client_id")) {
    zmiany.client_id = await idZBiura(admin, "clients", String(formData.get("client_id") ?? ""), user.agency_id);
  }

  const { error } = await admin.from("deals").update(zmiany).eq("id", dealId).eq("agency_id", user.agency_id);
  if (error) return { ok: false, error: `Nie udało się zapisać zmian: ${error.message}` };

  if (user.agency_id && deal.commission_pln !== zmiany.commission_pln) {
    await zapiszZdarzenie({
      agencyId: user.agency_id,
      actorId: user.id,
      akcja: "transakcja_zmieniona",
      rodzaj: "transakcja",
      id: dealId,
      opis: `Zmieniono kwoty transakcji ${title}: prowizja ${deal.commission_pln} → ${zmiany.commission_pln} zł`,
    });
  }

  revalidatePath("/app/prowizje");
  revalidatePath(`/app/prowizje/${dealId}`);
  if (deal.property_id) revalidatePath(`/app/nieruchomosci/${deal.property_id}`);
  if (typeof zmiany.property_id === "string") revalidatePath(`/app/nieruchomosci/${zmiany.property_id}`);
  revalidatePath("/app");
  return { ok: true };
}

export async function setDealStatus(dealId: string, status: DealStatus): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  const closedAt = status === "zamkniety" ? new Date().toISOString() : null;
  const { error } = await admin
    .from("deals")
    .update({ status, closed_at: closedAt })
    .eq("id", dealId)
    .eq("agent_id", user.id);
  if (!error && status === "zamkniety") after(() => poZamknieciuTransakcji(user, dealId));
  revalidatePath("/app/prowizje");
  revalidatePath("/app");
}

export async function deleteDeal(dealId: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  const { data: usunieta } = await admin.from("deals").delete().eq("id", dealId).eq("agent_id", user.id).select("title, commission_pln");
  if (usunieta?.length && user.agency_id) {
    await zapiszZdarzenie({ agencyId: user.agency_id, actorId: user.id, akcja: "transakcja_usunieta", rodzaj: "transakcja", opis: `Usunięto transakcję: ${usunieta[0].title} (${usunieta[0].commission_pln} zł prowizji)` });
  }
  revalidatePath("/app/prowizje");
  revalidatePath("/app");
}

/** Zapis karty transakcji (etapy + dokumenty). Autozapis z detalu transakcji. */
export async function updateTransactionCard(
  dealId: string,
  card: unknown,
): Promise<{ error?: string } | undefined> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();

  const { data: deal } = await admin
    .from("deals")
    .select("agent_id")
    .eq("id", dealId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!deal || !mozeEdytowacTransakcje(user, deal)) {
    return { error: "Tę kartę prowadzi opiekun transakcji. Nie masz uprawnień do zmian." };
  }

  // count: bez niego zapis, który nie trafił w żaden wiersz, wyglądał jak udany.
  const { error, count } = await admin
    .from("deals")
    .update({ transaction_card: card }, { count: "exact" })
    .eq("id", dealId)
    .eq("agency_id", user.agency_id);
  if (error) {
    return { error: "Nie zapisano. Uruchom w Supabase migrację SETUP-v15 (kolumna transaction_card)." };
  }
  if (!count) return { error: "Nie zapisano: nie znaleziono transakcji." };
  revalidatePath(`/app/prowizje/${dealId}`);
  return {};
}
