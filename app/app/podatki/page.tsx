import { requireOwner, requireModul } from "@/lib/auth";
import { PageHeader } from "../components/ui";
import { TaxCalculator } from "./tax-calculator";

export default async function PodatkiPage() {
  // Dane finansowe firmy - tylko właściciel.
  await requireModul("faktury");
  return (
    <>
      <PageHeader
        title="Kalkulator podatkowy"
        subtitle="Forma opodatkowania, ZUS, VAT, spółka, koszt zatrudnienia agenta i podatki przy sprzedaży mieszkania. Na stawkach 2026, na Twoich liczbach."
      />
      <TaxCalculator />
    </>
  );
}
