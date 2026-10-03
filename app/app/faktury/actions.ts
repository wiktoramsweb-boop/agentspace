"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sumyFaktury, type TrybCen, type InvoiceItem } from "@/lib/invoice";

export type InvoicePayload = {
  number: string;
  sellerKey: string;
  buyerName: string;
  buyerAddress: string;
  buyerCity: string;
  buyerPostcode: string;
  buyerNip: string;
  buyerPesel: string;
  place: string;
  issueDate: string;
  saleDate: string;
  paymentDate: string;
  paymentMethod: string;
  items: InvoiceItem[];
  /** Czy ceny jednostkowe podano netto, czy brutto. */
  pricesMode: TrybCen;
  description: string;
  paid: number;
  issuer: string;
};

/**
 * Oczyszczenie pozycji i policzenie sum.
 *
 * Kwoty liczymy po stronie serwera, a nie przyjmujemy z formularza: inaczej
 * wystarczyłoby podmienić wartość w przeglądarce, żeby zapisać fakturę
 * z sumą niezgodną z pozycjami.
 */
function przygotuj(p: InvoicePayload) {
  const items = (p.items ?? [])
    .filter((i) => (i.name ?? "").trim())
    .map((i) => ({
      name: i.name,
      qty: Number(i.qty) || 0,
      unitPrice: Number(i.unitPrice) || 0,
      vat: i.vat ?? "zw",
      unit: (i.unit ?? "").trim() || "szt.",
    }));
  const tryb: TrybCen = p.pricesMode === "brutto" ? "brutto" : "netto";
  return { items, tryb, sumy: sumyFaktury(items, tryb) };
}

export async function createInvoice(p: InvoicePayload): Promise<void> {
  const owner = await requireModul("faktury");
  const admin = createSupabaseAdmin();
  const { items, tryb, sumy } = przygotuj(p);
  const total = sumy.brutto;

  const { data } = await admin
    .from("invoices")
    .insert({
      agency_id: owner.agency_id,
      created_by: owner.id,
      number: p.number,
      seller_key: p.sellerKey,
      buyer_name: p.buyerName || null,
      buyer_address: p.buyerAddress || null,
      buyer_city: p.buyerCity || null,
      buyer_postcode: p.buyerPostcode || null,
      buyer_nip: p.buyerNip || null,
      buyer_pesel: p.buyerPesel || null,
      place: p.place || "",
      issue_date: p.issueDate || null,
      sale_date: p.saleDate || null,
      payment_date: p.paymentDate || null,
      payment_method: p.paymentMethod || "Przelew",
      items,
      total_pln: total,
      prices_mode: tryb,
      net_pln: sumy.netto,
      vat_pln: sumy.vat,
      description: p.description || null,
      paid_pln: Number(p.paid) || 0,
      issuer: p.issuer || null,
    })
    .select("id")
    .single();

  revalidatePath("/app/faktury");
  if (data) redirect(`/app/faktury/${data.id}`);
}

export async function updateInvoice(id: string, p: InvoicePayload): Promise<void> {
  const owner = await requireModul("faktury");
  const admin = createSupabaseAdmin();
  const { items, tryb, sumy } = przygotuj(p);
  const total = sumy.brutto;

  await admin
    .from("invoices")
    .update({
      number: p.number,
      seller_key: p.sellerKey,
      buyer_name: p.buyerName || null,
      buyer_address: p.buyerAddress || null,
      buyer_city: p.buyerCity || null,
      buyer_postcode: p.buyerPostcode || null,
      buyer_nip: p.buyerNip || null,
      buyer_pesel: p.buyerPesel || null,
      place: p.place || "",
      issue_date: p.issueDate || null,
      sale_date: p.saleDate || null,
      payment_date: p.paymentDate || null,
      payment_method: p.paymentMethod || "Przelew",
      items,
      total_pln: total,
      prices_mode: tryb,
      net_pln: sumy.netto,
      vat_pln: sumy.vat,
      description: p.description || null,
      paid_pln: Number(p.paid) || 0,
      issuer: p.issuer || null,
    })
    .eq("id", id)
    .eq("agency_id", owner.agency_id);

  revalidatePath("/app/faktury");
  revalidatePath(`/app/faktury/${id}`);
  redirect(`/app/faktury/${id}`);
}

export async function deleteInvoice(id: string): Promise<void> {
  const owner = await requireModul("faktury");
  const admin = createSupabaseAdmin();
  await admin.from("invoices").delete().eq("id", id).eq("agency_id", owner.agency_id);
  revalidatePath("/app/faktury");
  redirect("/app/faktury");
}
