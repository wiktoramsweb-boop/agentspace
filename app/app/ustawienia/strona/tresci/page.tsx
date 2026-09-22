import { requireOwner } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site/config";
import { ContentForm } from "../site-forms";

export default async function TresciPage() {
  const owner = await requireOwner();
  const site = await getSiteConfig(owner.agency_id!, owner.agency?.name ?? "Biuro");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Teksty na stronie</h1>
        <p className="mt-1 text-sm text-slate-500">
          To, co odwiedzający czyta zanim zobaczy oferty. Pisz krótko i konkretnie, bez ogólników o profesjonalizmie.
        </p>
      </div>
      <ContentForm site={site} />
    </div>
  );
}
