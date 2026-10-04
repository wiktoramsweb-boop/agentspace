import { addDaysKey, todayPL } from "@/lib/datetime";
import Link from "next/link";
import { requireModul } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { sprzedawcy, type RodzajDokumentu } from "@/lib/invoice";
import { getInvoice, getInvoiceNumberSuggestion } from "@/lib/data-invoices";
import { PageHeader } from "../../components/ui";
import { InvoiceCreator } from "../invoice-creator";

export default async function NowaFakturaPage({
  searchParams,
}: {
  searchParams: Promise<{ koryguje?: string; rodzaj?: string }>;
}) {
  const sp = await searchParams;
  const owner = await requireModul("faktury");
  const ustawienia = await getAgencySettings(owner.agency_id, owner.agency?.name);
  const listaSprzedawcow = sprzedawcy(ustawienia.sellers, ustawienia.company);
  const nazwaBiura = ustawienia.company.name ?? owner.agency?.name ?? "";
  const number = owner.agency_id ? await getInvoiceNumberSuggestion(owner.agency_id) : "";

  // Korektę wystawia się ZAWSZE do konkretnej faktury, więc dokument pierwotny
  // wczytujemy tutaj i przepisujemy z niego dane nabywcy i pozycje. Agent ma
  // poprawić to, co się zmieniło, a nie wpisywać wszystko od nowa.
  const pierwotna =
    sp.koryguje && owner.agency_id ? await getInvoice(sp.koryguje) : null;
  const korygowana =
    pierwotna && pierwotna.agency_id === owner.agency_id ? pierwotna : null;
  const rodzaj: RodzajDokumentu = korygowana
    ? "korekta"
    : sp.rodzaj === "proforma"
      ? "proforma"
      : "faktura";

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
          title={korygowana ? `Korekta do faktury ${korygowana.number}` : rodzaj === "proforma" ? "Nowa proforma" : "Nowa faktura"}
          subtitle="Wypełnij dane - podgląd składa się na żywo. Zapisz albo od razu Drukuj/PDF."
        />
      </div>
      <InvoiceCreator
        sellers={listaSprzedawcow}
        logoUrl={ustawienia.logoUrl}
        agencyName={nazwaBiura}
        initial={{
          number,
          sellerKey: korygowana?.seller_key ?? listaSprzedawcow[0]?.key ?? "firma",
          buyerName: korygowana?.buyer_name ?? "",
          buyerAddress: korygowana?.buyer_address ?? "",
          buyerCity: korygowana?.buyer_city ?? "",
          buyerPostcode: korygowana?.buyer_postcode ?? "",
          buyerNip: korygowana?.buyer_nip ?? "",
          buyerPesel: korygowana?.buyer_pesel ?? "",
          place: ustawienia.company.city ?? "",
          issueDate: today,
          saleDate: today,
          paymentDate: pay,
          paymentMethod: "Przelew",
          items:
            korygowana?.items && korygowana.items.length > 0
              ? korygowana.items
              : [{ name: "Pośrednictwo w kupnie nieruchomości", qty: 1, unitPrice: 0, vat: "zw", unit: "szt." }],
          pricesMode: korygowana?.prices_mode === "brutto" ? "brutto" : "netto",
          docType: rodzaj,
          correctsInvoiceId: korygowana?.id ?? null,
          correctsNumber: korygowana?.number ?? null,
          correctionReason: "",
          description: "",
          paid: 0,
          issuer: owner.full_name ?? "",
        }}
      />
    </>
  );
}
