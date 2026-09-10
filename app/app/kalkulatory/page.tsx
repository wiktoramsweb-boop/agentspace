import { requireUser } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { PageHeader } from "../components/ui";
import { Calculators } from "./calculators";

export default async function KalkulatoryPage() {
  const user = await requireUser();
  const settings = await getAgencySettings(user.agency_id, user.agency?.name);
  return (
    <>
      <div className="print-hide">
        <PageHeader
          title="Kalkulatory"
          subtitle="Policz przy kliencie ratę, koszty zakupu i rentowność najmu - i wyślij mu ładny PDF."
        />
      </div>
      <Calculators
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
