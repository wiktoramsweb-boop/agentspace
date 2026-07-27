import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getInvoice } from "@/lib/data-invoices";
import { PageHeader } from "../../../components/ui";
import { InvoiceCreator } from "../../invoice-creator";

type Props = { params: Promise<{ id: string }> };

export default async function EdytujFakturaPage({ params }: Props) {
  const owner = await requireOwner();
  const { id } = await params;

  const inv = await getInvoice(id);
  if (!inv) notFound();
  if (inv.agency_id !== owner.agency_id) redirect("/app/faktury");

  return (
    <>
      <Link
        href={`/app/faktury/${id}`}
        className="print-hide mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-white"
      >
        ← Faktura
      </Link>
      <div className="print-hide">
        <PageHeader title={`Edytuj fakturę ${inv.number}`} subtitle="Zmień dane i zapisz." />
      </div>
      <InvoiceCreator
        editId={inv.id}
        initial={{
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
        }}
      />
    </>
  );
}
