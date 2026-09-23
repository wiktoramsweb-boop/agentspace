import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getAddonState } from "@/lib/site/addon";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { ASSET_BUCKET, publicAssetUrl } from "@/lib/storage";
import { TeamOnSite, type TeamRow } from "../site-forms";

export default async function ZespolStronaPage() {
  const owner = await requireOwner();
  const addon = await getAddonState(owner.agency_id!);
  if (!addon.active) redirect("/app/ustawienia/strona");

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, job_title, bio, avatar_path, show_on_site, site_order, created_at")
    .eq("agency_id", owner.agency_id!)
    .order("site_order", { ascending: true })
    .order("created_at", { ascending: true });

  const rows: TeamRow[] = (data ?? []).map((p) => ({
    id: p.id as string,
    name: (p.full_name as string) ?? (p.email as string) ?? "Agent",
    role: (p.job_title as string) ?? "",
    phone: (p.phone as string) ?? null,
    photo: p.avatar_path ? publicAssetUrl(ASSET_BUCKET, p.avatar_path as string) : null,
    bio: (p.bio as string) ?? null,
    show: p.show_on_site !== false,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Zespół na stronie</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lista bierze się prosto z kont w systemie. Zdjęcie, stanowisko i opis każdy agent ustawia sobie sam w{" "}
          <Link href="/app/ustawienia" className="text-emerald-600 hover:underline">
            Moim profilu
          </Link>
          , a Ty decydujesz, kto jest widoczny i w jakiej kolejności.
        </p>
      </div>
      <TeamOnSite rows={rows} />
    </div>
  );
}
