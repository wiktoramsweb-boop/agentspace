import { requireUser } from "@/lib/auth";
import { PageHeader } from "../components/ui";
import { ReservationCreator } from "./reservation-creator";

export default async function RezerwacjePage() {
  await requireUser();
  return (
    <>
      <div className="print-hide">
        <PageHeader
          title="Umowa rezerwacyjna"
          subtitle="Sprzedaż lub najem. Wpisz dane stron i kwotę — reszta gotowa. Drukuj lub zapisz PDF."
        />
      </div>
      <ReservationCreator city="Kraków" />
    </>
  );
}
