import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { ASSET_BUCKET, publicAssetUrl } from "@/lib/storage";
import type { DemoAgent, DemoArticle, DemoDeal, DemoKind, DemoOffer } from "@/lib/wzory/data";
import type { Property, PropertyPhoto } from "@/lib/types";

/**
 * Dane strony internetowej biura brane wprost z CRM.
 *
 * Mapujemy rekordy z bazy na te same kształty, których używają wzory, dzięki
 * czemu strona klienta i strona pokazowa korzystają z tych samych komponentów.
 */

const KIND_MAP: Record<string, DemoKind> = {
  mieszkanie: "mieszkanie",
  dom: "dom",
  dzialka: "dzialka",
  lokal: "lokal",
  biuro: "biuro",
  garaz: "lokal",
  magazyn: "lokal",
  inne: "lokal",
};

function photoUrls(photos: PropertyPhoto[] | null | undefined): string[] {
  const list = (photos ?? []).map((p) => p.url).filter(Boolean) as string[];
  return list.length ? list : ["/wzory/kamienica.jpg"];
}

function toOffer(p: Property, ownerName: string | null): DemoOffer {
  const area = p.area_m2 ?? 0;
  return {
    id: p.id,
    no: p.offer_no ?? p.id.slice(0, 8).toUpperCase(),
    title: p.headline?.trim() || p.title,
    deal: (p.deal_kind === "wynajem" ? "wynajem" : "sprzedaz") as DemoDeal,
    kind: KIND_MAP[p.property_type] ?? "mieszkanie",
    city: p.city ?? "",
    district: p.city ?? "",
    street: p.address ?? "",
    price: p.price_pln ?? 0,
    area: area || 1,
    rooms: p.rooms ?? null,
    floor: p.floor == null ? null : p.floor === 0 ? "parter" : String(p.floor),
    year: p.year_built ?? null,
    lat: p.lat ?? 50.0614,
    lng: p.lng ?? 19.9366,
    photos: photoUrls(p.photos),
    lead: (p.description ?? "").split(/\n+/)[0]?.slice(0, 180) ?? "",
    description: (p.description ?? "").split(/\n{2,}/).filter(Boolean),
    features: Object.entries(p.features ?? {})
      .filter(([, v]) => v)
      .map(([k]) => k.replace(/_/g, " "))
      .slice(0, 12),
    agentId: p.agent_id,
    fresh: !!p.created_at && Date.now() - new Date(p.created_at).getTime() < 14 * 24 * 3600 * 1000,
    energy: p.energy_cert_status === "gotowe" ? (p.energy_ep ? `EP ${p.energy_ep}` : "gotowe") : undefined,
    featured: false,
    ...(ownerName ? {} : {}),
  };
}

/** Oferty oznaczone do publikacji na stronie, tylko aktywne. */
export async function siteOffers(agencyId: string): Promise<DemoOffer[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("properties")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("export_to_web", true)
    .in("status", ["aktywna", "zarezerwowana"])
    .order("created_at", { ascending: false })
    .limit(300);

  return ((data ?? []) as Property[]).map((p) => toOffer(p, null));
}

export async function siteOffer(agencyId: string, id: string): Promise<DemoOffer | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("properties")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("id", id)
    .eq("export_to_web", true)
    .maybeSingle();
  return data ? toOffer(data as Property, null) : null;
}

/** Zespół widoczny na stronie: profile z CRM, w kolejności ustawionej w panelu. */
export async function siteTeam(agencyId: string): Promise<DemoAgent[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, avatar_path, job_title, bio, show_on_site, site_order")
    .eq("agency_id", agencyId)
    .order("site_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? [])
    .filter((p) => p.show_on_site !== false)
    .map((p) => ({
      id: p.id as string,
      name: (p.full_name as string) ?? "Agent",
      role: (p.job_title as string) ?? "Doradca nieruchomości",
      phone: (p.phone as string) ?? "",
      email: (p.email as string) ?? "",
      photo: p.avatar_path ? publicAssetUrl(ASSET_BUCKET, p.avatar_path as string) : "/wzory/salon.jpg",
      bio: (p.bio as string) ?? "",
      areas: [],
      deals: 0,
    }));
}

export type SitePost = DemoArticle & { id: string };

export async function sitePosts(agencyId: string, onlyPublished = true): Promise<SitePost[]> {
  const admin = createSupabaseAdmin();
  let q = admin.from("site_posts").select("*").eq("agency_id", agencyId).order("published_at", { ascending: false });
  if (onlyPublished) q = q.eq("published", true);
  const { data } = await q;

  return (data ?? []).map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    lead: (r.lead as string) ?? "",
    date: new Intl.DateTimeFormat("pl-PL", { dateStyle: "long" }).format(new Date((r.published_at as string) ?? Date.now())),
    read: (r.read_min as number) ?? 4,
    photo: r.cover_path ? publicAssetUrl(ASSET_BUCKET, r.cover_path as string) : "/wzory/miasto-noc.jpg",
    tag: (r.tag as string) ?? "Poradnik",
    author: (r.author as string) ?? "",
    body: String(r.body ?? "")
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((chunk) => {
        const lines = chunk.split("\n");
        if (lines[0]?.startsWith("## ")) {
          return { h: lines[0].slice(3).trim(), p: lines.slice(1).filter(Boolean) };
        }
        return { p: lines.filter(Boolean) };
      }),
  }));
}
