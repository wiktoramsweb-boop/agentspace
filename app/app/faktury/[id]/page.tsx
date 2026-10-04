import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { getSeller, sprzedawcy, type RodzajDokumentu, type TrybCen } from "@/lib/invoice";
import { WyslijMailem } from "../wyslij-mailem";
import { UstawCykliczna } from "../cykliczne";
import { getInvoice } from "@/lib/data-invoices";
import { InvoiceSheet } from "../invoice-sheet";
import { deleteInvoice } from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function InvoiceViewPage({ params }: Props) {
  const owner = await requireModul("faktury");
  const ustawienia = await getAgencySettings(owner.agency_id, owner.agency?.name);
  const listaSprzedawcow = sprzedawcy(ustawienia.sellers, ustawienia.company);
  const nazwaBiura = ustawienia.company.name ?? owner.agency?.name ?? "";
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
    place: inv.place ?? ustawienia.company.city ?? "",
    issueDate: inv.issue_date ?? "",
    saleDate: inv.sale_date ?? "",
    paymentDate: inv.payment_date ?? "",
    paymentMethod: inv.payment_method ?? "Przelew",
    items: inv.items ?? [],
    pricesMode: (inv.prices_mode === "brutto" ? "brutto" : "netto") as TrybCen,
    docType: (inv.doc_type ?? "faktura") as RodzajDokumentu,
    paymentStatus: inv.payment_status ?? null,
    correctsInvoiceId: inv.corrects_invoice_id ?? null,
    correctionReason: inv.correction_reason ?? "",
    description: inv.description ?? "",
    paid: inv.paid_pln ?? 0,
    issuer: inv.issuer ?? "",
  };

  return (
    <>
      <div className="print-hide mb-5 flex items-center justify-between gap-4">
        <Link
          href="/app/faktury"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
        >
          ← Faktury
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/app/faktury/${inv.id}/edytuj`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-emerald-500/50 hover:text-slate-900"
          >
            Edytuj
          </Link>
          {/* Korektę wystawia się do konkretnej faktury, więc wejście jest
              stąd, a nie z pustego formularza. Proformy się nie koryguje. */}
          {(inv.doc_type ?? "faktura") === "faktura" && (
            <Link
              href={`/app/faktury/nowa?koryguje=${inv.id}`}
              className="text-sm text-slate-500 transition hover:text-slate-900"
            >
              Wystaw korektę
            </Link>
          )}
          {(inv.doc_type ?? "faktura") === "faktura" && <UstawCykliczna invoiceId={inv.id} />}
          <form action={deleteInvoice.bind(null, inv.id)}>
            <button className="text-sm text-slate-500 transition hover:text-red-600">Usuń</button>
          </form>
        </div>
      </div>
      <div className="print-hide mb-5">
        <WyslijMailem
          invoiceId={inv.id}
          dane={{
            number: inv.number,
            docType: (inv.doc_type ?? "faktura") as RodzajDokumentu,
            correctsNumber: null,
            correctionReason: inv.correction_reason ?? null,
            place: data.place,
            issueDate: data.issueDate,
            saleDate: data.saleDate,
            paymentDate: data.paymentDate,
            paymentMethod: data.paymentMethod,
            buyerName: data.buyerName,
            buyerAddress: data.buyerAddress,
            buyerCity: data.buyerCity,
            buyerPostcode: data.buyerPostcode,
            buyerNip: data.buyerNip,
            buyerPesel: data.buyerPesel,
            items: data.items,
            pricesMode: data.pricesMode,
            paid: data.paid,
            issuer: data.issuer,
            description: data.description,
          }}
          sprzedawca={getSeller(inv.seller_key, listaSprzedawcow)}
          stopka={nazwaBiura}
          logoUrl={ustawienia.logoUrl}
          nazwaBiura={nazwaBiura}
        />
      </div>

      <InvoiceSheet
        data={data}
        sellers={listaSprzedawcow}
        logoUrl={ustawienia.logoUrl}
        agencyName={nazwaBiura}
      />
    </>
  );
}
