import { requireUser } from "@/lib/auth";
import { queryProperties } from "@/lib/data-lists";
import { getAgencyAgents } from "@/lib/data-activities";
import { getAgencyClientsLite } from "@/lib/data-platform";
import { getAgencySettings, photoConfigFrom } from "@/lib/agency-settings";
import { parseListQuery } from "@/lib/list-params";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader, EmptyState } from "../components/ui";
import { PropertyWizard } from "./property-wizard";
import { PropertiesBrowser, type MapPoint } from "./properties-browser";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Środek Krakowa (Rynek Główny) i promień, w jakim trzymamy mapę ofert. */
const KRAKOW = { lat: 50.0619, lng: 19.9369 };
const MAP_RADIUS_KM = 45;

function distanceKm(lat: number, lng: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat - KRAKOW.lat);
  const dLng = toRad(lng - KRAKOW.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(KRAKOW.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Punkty na mapę i liczniki pobieramy osobno od listy: mapa pokazuje wszystkie
 * aktywne oferty biura, a nie tylko bieżącą stronę wyników.
 */
async function mapData(agencyId: string) {
  const admin = createSupabaseAdmin();
  const [{ data, count }, all] = await Promise.all([
    admin
      .from("properties")
      .select("id, title, price_pln, lat, lng, deal_kind", { count: "exact" })
      .eq("agency_id", agencyId)
      .eq("status", "aktywna")
      .limit(500),
    admin.from("properties").select("id", { count: "exact", head: true }).eq("agency_id", agencyId),
  ]);

  const rows = (data ?? []) as { id: string; title: string; price_pln: number | null; lat: number | null; lng: number | null; deal_kind: string }[];
  const located = rows.filter((p) => p.lat != null && p.lng != null);
  const points: MapPoint[] = located.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price_pln,
    lat: p.lat!,
    lng: p.lng!,
    kind: p.deal_kind,
  }));
  const near = points.filter((p) => distanceKm(p.lat, p.lng) <= MAP_RADIUS_KM);
  const far = points.filter((p) => distanceKm(p.lat, p.lng) > MAP_RADIUS_KM);
  return {
    near: near.length > 0 ? near : points,
    far: near.length > 0 ? far.map((p) => ({ id: p.id, title: p.title })) : [],
    located: located.length,
    activeCount: count ?? rows.length,
    allCount: all.count ?? 0,
  };
}

export default async function NieruchomosciPage({ searchParams }: Props) {
  const user = await requireUser();
  const agencyId = user.agency_id;
  const query = parseListQuery(await searchParams, { sort: "nowe", dateField: "zmiana" });

  const [page, agents, clients, settings, map] = await Promise.all([
    agencyId ? queryProperties(agencyId, query, user.id) : Promise.resolve({ rows: [], total: 0, pages: 1 }),
    agencyId ? getAgencyAgents(agencyId) : Promise.resolve([]),
    agencyId ? getAgencyClientsLite(agencyId) : Promise.resolve([]),
    getAgencySettings(agencyId, user.agency?.name),
    agencyId
      ? mapData(agencyId)
      : Promise.resolve({ near: [], far: [], located: 0, activeCount: 0, allCount: 0 }),
  ]);

  return (
    <>
      <PageHeader
        title="Nieruchomości"
        subtitle={`${map.activeCount} aktywnych · ${map.allCount} w biurze`}
        action={
          <PropertyWizard
            clients={clients}
            photoConfig={photoConfigFrom(settings)}
            offerPrefix={settings.options.offer_prefix}
            canEditSettings={user.role === "owner"}
          />
        }
      />

      {map.allCount === 0 ? (
        <EmptyState
          title="Brak nieruchomości"
          body="Dodaj pierwszą ofertę - baza jest wspólna dla całego biura, więc każdy agent ją zobaczy (możesz filtrować na „Moje”)."
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          }
        />
      ) : (
        <PropertiesBrowser
          rows={page.rows}
          query={query}
          total={page.total}
          pages={page.pages}
          agents={agents}
          canDelete={user.role === "owner" || user.role === "manager"}
          currentUserId={user.id}
          mapNear={map.near}
          mapFar={map.far}
          located={map.located}
          activeCount={map.activeCount}
        />
      )}
    </>
  );
}
