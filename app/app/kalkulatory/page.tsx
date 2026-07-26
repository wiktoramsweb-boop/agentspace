import { requireUser } from "@/lib/auth";
import { PageHeader } from "../components/ui";
import { Calculators } from "./calculators";

export default async function KalkulatoryPage() {
  const user = await requireUser();
  return (
    <>
      <div className="print-hide">
        <PageHeader
          title="Kalkulatory"
          subtitle="Policz przy kliencie ratę, koszty zakupu i rentowność najmu — i wyślij mu ładny PDF."
        />
      </div>
      <Calculators
        agent={{
          name: user.full_name ?? "Agent",
          email: user.email ?? "",
          agency: user.agency?.name ?? "Agencja Nieruchomości Spectra",
        }}
      />
    </>
  );
}
