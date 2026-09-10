import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSearch, getActiveProperties, getMatchStatuses } from "@/lib/data-searches";
import { findMatches } from "@/lib/matching";
import { getAgencySettings, matchTolerance } from "@/lib/agency-settings";
import { Card } from "../../components/ui";
import { PROPERTY_ICONS } from "../../components/icons";
import { MatchList } from "./match-list";
import { SearchActions } from "./search-actions";
import { PROPERTY_TYPES, SEARCH_STATUSES, PROPERTY_FEATURES } from "@/lib/types";

const STATUS_MAP = Object.fromEntries(SEARCH_STATUSES.map((s) => [s.value, s]));
const TYPE_MAP = Object.fromEntries(PROPERTY_TYPES.map((t) => [t.value, t.label]));
const FEATURE_MAP = Object.fromEntries(PROPERTY_FEATURES.map((f) => [f.key, f.label]));

const zl = (n: number) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(n) + " zł";

function range(min: number | null, max: number | null, unit = "", money = false): string {
  const f = (n: number) => (money ? zl(n) : `${n}${unit}`);
  if (min == null && max == null) return "dowolnie";
  if (min == null) return `do ${f(max!)}`;
  if (max == null) return `od ${f(min)}`;
  return `${f(min)} - ${f(max)}`;
}

type Props = { params: Promise<{ id: string }> };

export default async function SearchDetailPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const agencyId = user.agency_id;
  if (!agencyId) notFound();

  const search = await getSearch(id, agencyId);
  if (!search) notFound();

  const [properties, statusMap, settings] = await Promise.all([
    getActiveProperties(agencyId),
    getMatchStatuses(agencyId, id),
    getAgencySettings(agencyId, user.agency?.name),
  ]);

  const allMatches = findMatches(search, properties, matchTolerance(settings));
  const o = settings.options;
  const rangeText =
    o.match_price_minus === o.match_price_plus && o.match_area_minus === o.match_area_plus && o.match_price_plus === o.match_area_plus
      ? `o mniej niż ${o.match_price_plus}%`
      : `(cena −${o.match_price_minus}/+${o.match_price_plus}%, metraż −${o.match_area_minus}/+${o.match_area_plus}%)`;
  const fits = allMatches.filter((m) => m.fits);
  const near = allMatches.filter((m) => !m.fits);

  const statuses: Record<string, string> = {};
  for (const [k, v] of statusMap) {
    const [sid, pid] = k.split(":");
    if (sid === id) statuses[pid] = v;
  }

  const sm = STATUS_MAP[search.status] ?? STATUS_MAP.aktualne;
  const isRent = search.deal_kind === "wynajem";
  const required = Object.entries(search.must_have ?? {}).filter(([, v]) => v).map(([k]) => k);

  return (
    <>
      <Link
        href="/app/poszukiwania"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
      >
        ← Poszukiwania
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${sm.color}`}>{sm.label}</span>
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {isRent ? "Najem" : "Kupno"}
            </span>
            {search.search_no && <span className="text-xs text-slate-400">{search.search_no}</span>}
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {search.clientName ?? search.title ?? "Poszukiwanie"}
          </h1>
          {search.clientPhone && (
            <a href={`tel:${search.clientPhone}`} className="text-blue-600 hover:underline">
              {search.clientPhone}
            </a>
          )}
        </div>
        <SearchActions id={search.id} status={search.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
              Kryteria
            </h2>
            <dl className="space-y-3 text-sm">
              <Row label={isRent ? "Czynsz" : "Cena"} value={range(search.price_min, search.price_max, "", true)} />
              <Row label="Powierzchnia" value={range(search.area_min, search.area_max, " m²")} />
              <Row label="Pokoje" value={range(search.rooms_min, search.rooms_max)} />
              <Row label="Piętro" value={range(search.floor_min, search.floor_max)} />
              {search.year_built_min != null && (
                <Row label="Rok budowy" value={`od ${search.year_built_min}`} />
              )}
              <Row
                label="Lokalizacje"
                value={search.locations.length ? search.locations.join(", ") : "dowolnie"}
              />
            </dl>

            <div className="mt-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">Typy</p>
              <div className="flex flex-wrap gap-1.5">
                {search.property_types.map((t) => {
                  const Icon = PROPERTY_ICONS[t] ?? PROPERTY_ICONS.inne;
                  return (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {TYPE_MAP[t] ?? t}
                    </span>
                  );
                })}
              </div>
            </div>

            {required.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">Wymagane</p>
                <div className="flex flex-wrap gap-1.5">
                  {required.map((k) => (
                    <span key={k} className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                      {FEATURE_MAP[k] ?? k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {search.notes && (
            <Card>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
                Notatki
              </h2>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{search.notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 flex flex-wrap items-center gap-2 text-sm font-medium uppercase tracking-wider text-slate-500">
              Pasujące oferty
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {fits.length}
              </span>
            </h2>
            <MatchList searchId={search.id} matches={fits} statuses={statuses} />
          </div>

          {near.length > 0 && (
            <div>
              <h2 className="mb-1 flex flex-wrap items-center gap-2 text-sm font-medium uppercase tracking-wider text-slate-500">
                Prawie pasuje
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {near.length}
                </span>
              </h2>
              <p className="mb-3 text-xs text-slate-400">
                Oferty poza zakresem {rangeText} albo bez jednego udogodnienia. Warto pokazać, bo
                klienci często je akceptują.
              </p>
              <MatchList searchId={search.id} matches={near} statuses={statuses} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}
