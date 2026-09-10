import { requireOwner } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { SetupBanner } from "../setup-banner";
import { OptionsForm } from "./options-form";

export default async function PozostaleUstawieniaPage() {
  const owner = await requireOwner();
  const settings = await getAgencySettings(owner.agency_id, owner.agency?.name);

  return (
    <>
      {!settings.ready && <SetupBanner />}
      <OptionsForm options={settings.options} disabled={!settings.ready} />
    </>
  );
}
