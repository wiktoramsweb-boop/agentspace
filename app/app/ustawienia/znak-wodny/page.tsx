import { requireOwner } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { PropertyPhoto } from "@/lib/types";
import { SetupBanner } from "../setup-banner";
import { MarksForm } from "./marks-form";

/**
 * Do podglądu bierzemy prawdziwe zdjęcia z ofert biura (czyste wersje, bez
 * znaku), bo tak CEO od razu widzi, jak znak wygląda na ich wnętrzach.
 */
async function samplePhotos(agencyId: string | null): Promise<string[]> {
  if (!agencyId) return [];
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("properties")
    .select("photos")
    .eq("agency_id", agencyId)
    .order("updated_at", { ascending: false })
    .limit(20);
  const urls: string[] = [];
  for (const row of data ?? []) {
    for (const p of (row.photos ?? []) as PropertyPhoto[]) {
      if (p.original_url) urls.push(p.original_url);
      if (urls.length >= 5) return urls;
    }
  }
  return urls;
}

export default async function ZnakWodnyPage() {
  const owner = await requireOwner();
  const [settings, samples] = await Promise.all([
    getAgencySettings(owner.agency_id, owner.agency?.name),
    samplePhotos(owner.agency_id),
  ]);

  return (
    <>
      {!settings.ready && <SetupBanner />}
      <MarksForm
        watermark={settings.watermark}
        watermarkUrl={settings.watermarkUrl}
        stamp={settings.stamp}
        stampUrl={settings.stampUrl}
        samples={samples}
        disabled={!settings.ready}
      />
    </>
  );
}
