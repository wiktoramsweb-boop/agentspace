import { requireUser } from "@/lib/auth";
import { PageHeader } from "../components/ui";
import { OfferBuilder } from "./offer-builder";

export default async function OfertowkaPage() {
  const user = await requireUser();
  return (
    <>
      <div className="print-hide">
        <PageHeader
          title="Ofertówka"
          subtitle="Zbuduj ładną kartę oferty: wgraj zdjęcia, uzupełnij parametry → PDF dla klienta."
        />
      </div>
      <OfferBuilder
        agent={{
          name: user.full_name ?? "Agent",
          email: "biuro@spectranieruchomosci.pl",
          phone: user.phone ?? "",
          agency: user.agency?.name ?? "Agencja Nieruchomości Spectra",
        }}
      />
    </>
  );
}
