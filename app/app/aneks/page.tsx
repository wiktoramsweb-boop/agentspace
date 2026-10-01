import { requireUser } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { getAgencyAgents } from "@/lib/data-activities";
import { PageHeader } from "../components/ui";
import { AneksCreator } from "./aneks-creator";

export default async function AneksPage() {
  const user = await requireUser();
  const [settings, agenci] = await Promise.all([
    getAgencySettings(user.agency_id, user.agency?.name),
    user.agency_id ? getAgencyAgents(user.agency_id) : Promise.resolve([]),
  ]);
  const c = settings.company;
  const adres = [c.postal_code, c.city].filter(Boolean).join(" ");

  return (
    <>
      <PageHeader
        title="Aneks do umowy"
        subtitle="Przedłużenie współpracy, zmiana wynagrodzenia albo ceny ofertowej. Dane biura wchodzą z Ustawień, resztę uzupełniasz tutaj."
      />
      <AneksCreator
        city={c.city || "Kraków"}
        firma={{
          nazwa: c.name || "Agencja Nieruchomości",
          nip: c.nip || "",
          adres: [adres, c.street].filter(Boolean).join(", "),
        }}
        stopka={[c.name, c.nip ? `NIP ${c.nip}` : "", c.phone, c.email].filter(Boolean).join(" · ")}
        agenci={agenci}
      />
    </>
  );
}
