import Link from "next/link";
import { requireAktywny } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { maV49 } from "@/lib/schemat";
import type { Kosztorys } from "@/lib/remont";
import { PageHeader } from "../../components/ui";
import { KalkulatorRemontu, type OfertaRemont } from "./kalkulator";
import type { ZapisanyKosztorys } from "./actions";

export const metadata = { title: "Kalkulator remontu" };

export default async function RemontPage({ searchParams }: { searchParams: Promise<{ id?: string; oferta?: string }> }) {
  const sp = await searchParams;
  const user = await requireAktywny();
  const agencyId = user.agency_id;
  const admin = createSupabaseAdmin();
  const [settings, ofertyRes, v49] = await Promise.all([
    getAgencySettings(agencyId, user.agency?.name),
    agencyId
      ? admin.from("properties").select("id, title, address, city, area_m2, rooms").eq("agency_id", agencyId).order("updated_at", { ascending: false }).limit(500)
      : Promise.resolve({ data: [] as { id: string; title: string; address: string | null; city: string | null; area_m2: number | null; rooms: number | null }[] }),
    maV49(),
  ]);

  let zapisane: ZapisanyKosztorys[] = [];
  let wczytany: { id: string; dane: Kosztorys; propertyId: string | null } | null = null;
  if (v49 && agencyId) {
    const { data } = await admin
      .from("renovation_estimates")
      .select("id, title, total_gross_pln, updated_at, property_id")
      .eq("agency_id", agencyId)
      .order("updated_at", { ascending: false })
      .limit(30);
    zapisane = (data ?? []) as ZapisanyKosztorys[];
    if (sp.id) {
      const { data: k } = await admin
        .from("renovation_estimates")
        .select("id, data, property_id")
        .eq("id", sp.id)
        .eq("agency_id", agencyId)
        .maybeSingle();
      if (k?.data) wczytany = { id: k.id, dane: k.data as Kosztorys, propertyId: k.property_id };
    }
  }

  const oferty: OfertaRemont[] = (ofertyRes.data ?? []).map((o) => {
    const a = (o.address ?? "").trim();
    const m = (o.city ?? "").trim();
    return {
      id: o.id,
      nazwa: (m && !a.toLowerCase().includes(m.toLowerCase()) ? [a, m].filter(Boolean).join(", ") : a || m) || o.title,
      metraz: o.area_m2 ?? null,
      pokoje: o.rooms ?? null,
    };
  });
  const c = settings.company;

  return (
    <>
      <PageHeader
        title="Kalkulator remontu"
        subtitle="Ile kosztuje doprowadzenie mieszkania do stanu, w którym klient chce w nim mieszkać. Policz przy kupującym albo pokaż sprzedającemu, że remont nie zwróci się w cenie."
        action={
          <Link href="/app/kalkulatory" className="text-sm font-medium text-slate-500 hover:text-slate-800">
            ← Kalkulatory
          </Link>
        }
      />
      <KalkulatorRemontu
        key={wczytany?.id ?? sp.oferta ?? "nowy"}
        oferty={oferty}
        zapisane={zapisane}
        v49={v49}
        wczytany={wczytany}
        startOferta={sp.oferta && oferty.some((o) => o.id === sp.oferta) ? sp.oferta : undefined}
        biuro={{ nazwa: c.name || user.agency?.name || "", agent: user.full_name ?? "", telefon: user.phone ?? c.phone ?? "", email: c.email ?? "" }}
        stopka={[c.name, c.nip ? `NIP ${c.nip}` : "", c.phone, c.email].filter(Boolean).join(" · ")}
      />
    </>
  );
}
