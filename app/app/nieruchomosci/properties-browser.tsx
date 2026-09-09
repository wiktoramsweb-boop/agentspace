"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { PROPERTY_STATUSES, PROPERTY_DEAL_KINDS } from "@/lib/types";
import type { PropertyWithOwner } from "@/lib/data-platform";
import { formatPln } from "@/lib/format";
import { Card } from "../components/ui";
import { SegmentedToggle } from "../components/kit";
import { PropertiesMap } from "./properties-map";
import { PROPERTY_ICONS, PinIcon } from "../components/icons";

function kindVisual(kind: string) {
  return kind === "wynajem"
    ? { bar: "from-sky-400 to-indigo-400", glow: "rgba(56,189,248,0.4)", chip: "text-sky-700" }
    : { bar: "from-emerald-400 to-cyan-400", glow: "rgba(16,185,129,0.4)", chip: "text-emerald-700" };
}

export function PropertiesBrowser({
  properties,
  currentUserId,
}: {
  properties: PropertyWithOwner[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [sort, setSort] = useState<"nowe" | "cena_rosnaco" | "cena_malejaco" | "cena_m2">("nowe");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return properties.filter((p) => {
      if (scope === "mine" && p.agent_id !== currentUserId) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.city ?? "").toLowerCase().includes(q) ||
        (p.address ?? "").toLowerCase().includes(q) ||
        (p.opiekunName ?? "").toLowerCase().includes(q)
      );
    });
  }, [properties, query, scope, currentUserId]);

  // Sortowanie liczone po filtrach - agenci najczęściej szukają „najtańsze w tej
  // dzielnicy", a nie „najtańsze w całej bazie".
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const perM2 = (p: PropertyWithOwner) =>
      p.price_pln != null && p.area_m2 ? p.price_pln / p.area_m2 : Number.POSITIVE_INFINITY;
    if (sort === "cena_rosnaco") arr.sort((a, b) => (a.price_pln ?? Infinity) - (b.price_pln ?? Infinity));
    else if (sort === "cena_malejaco") arr.sort((a, b) => (b.price_pln ?? -1) - (a.price_pln ?? -1));
    else if (sort === "cena_m2") arr.sort((a, b) => perM2(a) - perM2(b));
    else arr.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    return arr;
  }, [filtered, sort]);

  const mineCount = properties.filter((p) => p.agent_id === currentUserId).length;
  const active = filtered.filter((p) => p.status === "aktywna");
  const mapPoints = active
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({ id: p.id, title: p.title, price: p.price_pln, lat: p.lat!, lng: p.lng!, kind: p.deal_kind }));

  return (
    <div>
      {/* Szukaj + zakres */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj po nazwie, adresie, mieście lub agencie…"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
          aria-label="Sortowanie"
        >
          <option value="nowe">Najnowsze</option>
          <option value="cena_rosnaco">Cena rosnąco</option>
          <option value="cena_malejaco">Cena malejąco</option>
          <option value="cena_m2">Cena za m² rosnąco</option>
        </select>
        <SegmentedToggle
          value={scope}
          onChange={setScope}
          accent="emerald"
          options={[
            { value: "all", label: `Wszystkie (${properties.length})` },
            { value: "mine", label: `Moje (${mineCount})` },
          ]}
        />
      </div>

      {/* Mapa */}
      {sorted.length > 0 && (
        <Card className="mb-6 !overflow-hidden !p-0">
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-slate-700">
              Mapa ofert
            </h2>
            <span className="text-xs text-slate-500">{mapPoints.length} na mapie</span>
          </div>
          {mapPoints.length > 0 ? (
            <PropertiesMap points={mapPoints} />
          ) : (
            <p className="p-6 text-sm text-slate-500">
              Żadna oferta w tym widoku nie ma lokalizacji. Przy dodawaniu/edycji wybierz adres z podpowiedzi.
            </p>
          )}
        </Card>
      )}

      {sorted.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-slate-500">Brak ofert dla tego filtra.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((p) => {
            const status = PROPERTY_STATUSES.find((s) => s.value === p.status);
            const kind = PROPERTY_DEAL_KINDS.find((k) => k.value === p.deal_kind);
            const params = [
              p.area_m2 != null ? `${p.area_m2} m²` : null,
              p.rooms != null ? `${p.rooms} pok.` : null,
            ]
              .filter(Boolean)
              .join(" · ");
            const mine = p.agent_id === currentUserId;
            const kv = kindVisual(p.deal_kind);
            const TypeIcon = PROPERTY_ICONS[p.property_type] ?? PinIcon;
            return (
              <Link key={p.id} href={`/app/nieruchomosci/${p.id}`} className="block">
                <div
                  className="card-glow group h-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50"
                  style={{ ["--glow"]: kv.glow } as CSSProperties}
                >
                  <div className={`h-1.5 w-full bg-gradient-to-r ${kv.bar}`} />
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                          <TypeIcon className="h-5 w-5" />
                        </span>
                        <span className={`text-xs font-semibold uppercase tracking-wide ${kv.chip}`}>{kind?.label}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {status && (
                          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${status.color}`}>{status.label}</span>
                        )}
                        {p.export_to_web ? (
                          <span
                            title="Oznaczona do publikacji na stronie"
                            className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700"
                          >
                            na stronę
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <h3 className="mb-1 truncate font-semibold text-slate-900">{p.title}</h3>
                    {(p.city || p.address) && (
                      <p className="mb-3 flex items-center gap-1 truncate text-sm text-slate-500">
                        <PinIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        {p.city ?? p.address}
                      </p>
                    )}

                    <p className="text-2xl font-bold text-slate-900">
                      {p.price_pln != null ? formatPln(p.price_pln) : "-"}
                      {p.deal_kind === "wynajem" && p.price_pln != null && (
                        <span className="text-sm font-medium text-slate-500"> /mc</span>
                      )}
                    </p>
                    {params && <p className="mt-1 text-sm text-slate-500">{params}</p>}

                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-[10px] font-bold text-white">
                          {(p.opiekunName ?? "?").charAt(0).toUpperCase()}
                        </span>
                        {mine ? "Ty" : p.opiekunName ?? "-"}
                      </span>
                      <span className="text-xs font-medium text-emerald-400/80 opacity-0 transition group-hover:opacity-100">Otwórz →</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
