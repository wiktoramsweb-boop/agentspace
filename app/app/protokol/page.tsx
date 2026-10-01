import { requireUser } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { PageHeader } from "../components/ui";
import { ProtokolCreator } from "./protokol-creator";

export default async function ProtokolPage() {
  const user = await requireUser();
  const settings = await getAgencySettings(user.agency_id, user.agency?.name);
  const c = settings.company;

  return (
    <>
      <PageHeader
        title="Protokół zdawczo-odbiorczy"
        subtitle="Wydanie albo zwrot lokalu. Liczniki i klucze dopisujesz w dowolnej liczbie, a puste wiersze zostają na wydruku do uzupełnienia długopisem."
      />
      <ProtokolCreator
        city={c.city ?? ""}
        stopka={[c.name, c.nip ? `NIP ${c.nip}` : "", c.phone, c.email].filter(Boolean).join(" · ")}
      />
    </>
  );
}
