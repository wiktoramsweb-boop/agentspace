"use server";

import { revalidatePath } from "next/cache";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { kolejnaData, type TrybCen } from "@/lib/invoice";
import { todayPL } from "@/lib/datetime";
import type { WzorzecFaktury } from "@/lib/faktury-cykliczne";

export type WynikHarmonogramu = { ok: true } | { ok: false; error: string };

/**
 * Harmonogram zakładany z istniejącej faktury.
 *
 * Wzorzec zapisujemy jako kopię danych, nie jako odwołanie: tamta faktura
 * może zostać poprawiona albo usunięta, a harmonogram ma dalej wystawiać to,
 * co ustalono przy jego zakładaniu.
 */
export async function utworzHarmonogram(
  invoiceId: string,
  opcje: { coMiesiecy: number; dniPlatnosci: number },
): Promise<WynikHarmonogramu> {
  const user = await requireModul("faktury");
  if (!user.agency_id) return { ok: false, error: "Brak biura." };

  const admin = createSupabaseAdmin();
  const { data: f } = await admin.from("invoices").select("*").eq("id", invoiceId).maybeSingle();
  // Przynależność do biura, a nie samo istnienie: bez tego znajomość cudzego
  // id wystarczyłaby, żeby wystawiać faktury w cudzym biurze co miesiąc.
  if (!f || f.agency_id !== user.agency_id) return { ok: false, error: "Nie ma takiej faktury." };

  const wzorzec: WzorzecFaktury = {
    sellerKey: f.seller_key ?? "firma",
    buyerName: f.buyer_name ?? "",
    buyerAddress: f.buyer_address ?? "",
    buyerCity: f.buyer_city ?? "",
    buyerPostcode: f.buyer_postcode ?? "",
    buyerNip: f.buyer_nip ?? "",
    buyerPesel: f.buyer_pesel ?? "",
    place: f.place ?? "",
    paymentMethod: f.payment_method ?? "Przelew",
    items: f.items ?? [],
    pricesMode: (f.prices_mode === "brutto" ? "brutto" : "netto") as TrybCen,
    description: f.description ?? "",
    issuer: f.issuer ?? user.full_name ?? "",
  };

  const dzis = todayPL();
  const podstawa = (f.issue_date as string) ?? dzis;
  const dzien = Number(podstawa.slice(8, 10)) || 1;
  const coMiesiecy = Math.min(12, Math.max(1, Math.round(opcje.coMiesiecy) || 1));

  // Pierwsze wystawienie liczymy od daty faktury źródłowej, ale nigdy
  // wstecz: inaczej założenie harmonogramu wystawiłoby od razu zaległości.
  let nastepne = kolejnaData(podstawa, coMiesiecy, dzien);
  while (nastepne <= dzis) nastepne = kolejnaData(nastepne, coMiesiecy, dzien);

  const { error } = await admin.from("invoice_schedules").insert({
    agency_id: user.agency_id,
    created_by: user.id,
    nazwa: `${f.buyer_name ?? "Bez nabywcy"} - ${coMiesiecy === 1 ? "co miesiąc" : `co ${coMiesiecy} mies.`}`,
    co_miesiecy: coMiesiecy,
    dzien_miesiaca: dzien,
    dni_platnosci: Math.min(90, Math.max(0, Math.round(opcje.dniPlatnosci) || 7)),
    nastepne,
    wzorzec,
  });

  if (error) {
    return {
      ok: false,
      error: String(error.message).includes("does not exist")
        ? "Uruchom migrację v44 w Supabase."
        : "Nie udało się zapisać harmonogramu.",
    };
  }

  revalidatePath("/app/faktury");
  return { ok: true };
}

export async function zatrzymajHarmonogram(id: string): Promise<WynikHarmonogramu> {
  const user = await requireModul("faktury");
  if (!user.agency_id) return { ok: false, error: "Brak biura." };

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("invoice_schedules")
    .update({ aktywny: false })
    .eq("id", id)
    // Warunek na biuro w samym zapytaniu: nie da się zatrzymać cudzego.
    .eq("agency_id", user.agency_id);

  if (error) return { ok: false, error: "Nie udało się zatrzymać." };
  revalidatePath("/app/faktury");
  return { ok: true };
}
