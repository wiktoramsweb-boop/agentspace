import { requireOwner } from "@/lib/auth";
import { PageHeader } from "../components/ui";
import { TaxCalculator } from "./tax-calculator";

export default async function PodatkiPage() {
  // Dane finansowe firmy — tylko właściciel.
  await requireOwner();
  return (
    <>
      <PageHeader
        title="Kalkulator podatkowy"
        subtitle="Porównaj formy opodatkowania, sprawdź kiedy kończy się mały ZUS, limity VAT i opłacalność spółki z o.o. Wszystko na Twoich liczbach."
      />
      <TaxCalculator />
    </>
  );
}
