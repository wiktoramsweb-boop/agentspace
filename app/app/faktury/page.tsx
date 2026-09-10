import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { getInvoices } from "@/lib/data-invoices";
import { PageHeader, EmptyState } from "../components/ui";
import { InvoicesBrowser } from "./invoices-browser";

export default async function FakturyPage() {
  const owner = await requireOwner();
  const invoices = owner.agency_id ? await getInvoices(owner.agency_id) : [];

  return (
    <>
      <PageHeader
        title="Faktury"
        subtitle={`${invoices.length} wystawionych`}
        action={
          <Link
            href="/app/faktury/nowa"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            + Nowa faktura
          </Link>
        }
      />

      {invoices.length === 0 ? (
        <EmptyState
          title="Brak faktur"
          body="Wystaw pierwszą fakturę - wybierz sprzedawcę, wpisz nabywcę i kwotę, a resztę (konto, słownie, VAT zw) zrobimy za Ciebie."
          ctaHref="/app/faktury/nowa"
          ctaLabel="Nowa faktura"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          }
        />
      ) : (
        <InvoicesBrowser invoices={invoices} />
      )}
    </>
  );
}
