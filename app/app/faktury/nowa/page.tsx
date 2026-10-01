import { addDaysKey, todayPL } from "@/lib/datetime";
import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { getInvoiceNumberSuggestion } from "@/lib/data-invoices";
import { PageHeader } from "../../components/ui";
import { InvoiceCreator } from "../invoice-creator";

export default async function NowaFakturaPage() {
  const owner = await requireOwner();
  const number = owner.agency_id ? await getInvoiceNumberSuggestion(owner.agency_id) : "";

  // Daty po polsku: o 0:30 w nocy UTC wskazywałby jeszcze wczoraj.
  const today = todayPL();
  const pay = addDaysKey(today, 7);

  return (
    <>
      <Link
        href="/app/faktury"
        className="print-hide mb-4 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
      >
        ← Faktury
      </Link>
      <div className="print-hide">
        <PageHeader
          title="Nowa faktura"
          subtitle="Wypełnij dane - podgląd składa się na żywo. Zapisz albo od razu Drukuj/PDF."
        />
      </div>
      <InvoiceCreator
        initial={{
          number,
          sellerKey: "spectra",
          buyerName: "",
          buyerAddress: "",
          buyerCity: "",
          buyerPostcode: "",
          buyerNip: "",
          buyerPesel: "",
          place: "Kraków",
          issueDate: today,
          saleDate: today,
          paymentDate: pay,
          paymentMethod: "Przelew",
          items: [{ name: "Pośrednictwo w kupnie nieruchomości", qty: 1, unitPrice: 0 }],
          description: "",
          paid: 0,
          issuer: owner.full_name ?? "",
        }}
      />
    </>
  );
}
