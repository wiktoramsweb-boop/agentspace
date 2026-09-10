import { requireOwner } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { SetupBanner } from "../setup-banner";
import { CompanyForm } from "./company-form";
import { AssetUploader } from "../asset-uploader";

export default async function DaneFirmyPage() {
  const owner = await requireOwner();
  const settings = await getAgencySettings(owner.agency_id, owner.agency?.name);

  return (
    <>
      {!settings.ready && <SetupBanner />}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
        <CompanyForm company={settings.company} disabled={!settings.ready} />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:self-start">
          <h2 className="mb-1 text-base font-semibold text-slate-900">Logo firmy</h2>
          <p className="mb-4 text-sm text-slate-500">
            Trafi na ofertówkę, kalkulatory i dokumenty dla klienta.
          </p>
          <AssetUploader
            kind="logo"
            label="Logo firmy"
            currentUrl={settings.logoUrl}
            hint="PNG z przezroczystym tłem wygląda najlepiej. Do 10 MB."
            disabled={!settings.ready}
          />
        </div>
      </div>
    </>
  );
}
