import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getInvoice } from "@/lib/data-invoices";
import { InvoiceSheet } from "../invoice-sheet";
import { PrintButton } from "../print-button";
import { deleteInvoice } from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function InvoiceViewPage({ params }: Props) {
  const owner = await requireOwner();
  const { id } = await params;

  const inv = await getInvoice(id);
  if (!inv) notFound();
  if (inv.agency_id !== owner.agency_id) redirect("/app/faktury");

  const data = {
    number: inv.number,
    sellerKey: inv.seller_key,
    buyerName: inv.buyer_name ?? "",
    buyerAddress: inv.buyer_address ?? "",
    buyerCity: inv.buyer_city ?? "",
    buyerPostcode: inv.buyer_postcode ?? "",
    buyerNip: inv.buyer_nip ?? "",
    buyerPesel: inv.buyer_pesel ?? "",
    place: inv.place ?? "Kraków",
    issueDate: inv.issue_date ?? "",
    saleDate: inv.sale_date ?? "",
    paymentDate: inv.payment_date ?? "",
    paymentMethod: inv.payment_method ?? "Przelew",
    items: inv.items ?? [],
    description: inv.description ?? "",
    paid: inv.paid_pln ?? 0,
    issuer: inv.issuer ?? "",
  };

  return (
    <>
      <div className="print-hide mb-5 flex items-center justify-between gap-4">
        <Link
          href="/app/faktury"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-white"
        >
          ← Faktury
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/app/faktury/${inv.id}/edytuj`}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-emerald-500/50 hover:text-white"
          >
            Edytuj
          </Link>
          <PrintButton number={inv.number} />
          <form action={deleteInvoice.bind(null, inv.id)}>
            <button className="text-sm text-zinc-500 transition hover:text-red-400">Usuń</button>
          </form>
        </div>
      </div>
      <InvoiceSheet data={data} />
    </>
  );
}
