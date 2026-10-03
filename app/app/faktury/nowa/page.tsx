import { addDaysKey, todayPL } from "@/lib/datetime";
import Link from "next/link";
import { requireModul } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { sprzedawcy } from "@/lib/invoice";
import { getInvoiceNumberSuggestion } from "@/lib/data-invoices";
import { PageHeader } from "../../components/ui";
import { InvoiceCreator } from "../invoice-creator";

export default async function NowaFakturaPage() {
  const owner = await requireModul("faktury");
  const ustawienia = await getAgencySettings(owner.agency_id, owner.agency?.name);
  const listaSprzedawcow = sprzedawcy(ustawienia.sellers, ustawienia.company);
  const nazwaBiura = ustawienia.company.name ?? owner.agency?.name ?? "";
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
        sellers={listaSprzedawcow}
        logoUrl={ustawienia.logoUrl}
        agencyName={nazwaBiura}
        initial={{
          number,
          sellerKey: listaSprzedawcow[0]?.key ?? "firma",
          buyerName: "",
          buyerAddress: "",
          buyerCity: "",
          buyerPostcode: "",
          buyerNip: "",
          buyerPesel: "",
          place: ustawienia.company.city ?? "",
          issueDate: today,
          saleDate: today,
          paymentDate: pay,
          paymentMethod: "Przelew",
          items: [{ name: "Pośrednictwo w kupnie nieruchomości", qty: 1, unitPrice: 0, vat: "zw", unit: "szt." }],
          pricesMode: "netto",
          description: "",
          paid: 0,
          issuer: owner.full_name ?? "",
        }}
      />
    </>
  );
}
