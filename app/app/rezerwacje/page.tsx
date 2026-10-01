import { requireUser } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { PageHeader } from "../components/ui";
import { ReservationCreator } from "./reservation-creator";

export default async function RezerwacjePage() {
  const user = await requireUser();
  const { company } = await getAgencySettings(user.agency_id, user.agency?.name);
  return (
    <>
      <div className="print-hide">
        <PageHeader
          title="Umowa rezerwacyjna"
          subtitle="Sprzedaż lub najem. Wpisz dane stron i kwotę - reszta gotowa. Drukuj lub zapisz PDF."
        />
      </div>
      <ReservationCreator city={company.city ?? ""} />
    </>
  );
}
