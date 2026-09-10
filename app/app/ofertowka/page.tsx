import { requireUser } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { PageHeader } from "../components/ui";
import { OfferBuilder } from "./offer-builder";

export default async function OfertowkaPage() {
  const user = await requireUser();
  const settings = await getAgencySettings(user.agency_id, user.agency?.name);
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
          // Dane biura z Ustawień → Dane firmy; gdy puste, rozsądne zastępstwa.
          email: settings.company.email ?? user.email ?? "",
          phone: user.phone ?? settings.company.phone ?? "",
          agency: settings.company.name ?? user.agency?.name ?? "Biuro nieruchomości",
          logoUrl: settings.logoUrl,
        }}
      />
    </>
  );
}
