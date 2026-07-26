"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { invoiceTotal, type InvoiceItem } from "@/lib/invoice";

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
  description: string;
};

export async function createInvoice(p: InvoicePayload): Promise<void> {
  const owner = await requireOwner();
  const admin = createSupabaseAdmin();
  const items = (p.items ?? [])
    .filter((i) => (i.name ?? "").trim())
    .map((i) => ({ name: i.name, qty: Number(i.qty) || 0, unitPrice: Number(i.unitPrice) || 0 }));
  const total = invoiceTotal(items);

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
      place: p.place || "Kraków",
      issue_date: p.issueDate || null,
      sale_date: p.saleDate || null,
      payment_date: p.paymentDate || null,
      payment_method: p.paymentMethod || "Przelew",
      items,
      total_pln: total,
      description: p.description || null,
    })
    .select("id")
    .single();

  revalidatePath("/app/faktury");
  if (data) redirect(`/app/faktury/${data.id}`);
}

export async function deleteInvoice(id: string): Promise<void> {
  const owner = await requireOwner();
  const admin = createSupabaseAdmin();
  await admin.from("invoices").delete().eq("id", id).eq("agency_id", owner.agency_id);
  revalidatePath("/app/faktury");
  redirect("/app/faktury");
}
