"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import {
  PROPERTY_STATUSES,
  PROPERTY_DEAL_KINDS,
  PROPERTY_TYPES,
  PROCESS_STAGES,
} from "@/lib/types";
import type { PropertyRow } from "@/lib/data-lists";
import type { ListQuery } from "@/lib/list-params";
import { formatPln } from "@/lib/format";
import { Card } from "../components/ui";
import { PropertiesMap } from "./properties-map";
import { PROPERTY_ICONS, PinIcon } from "../components/icons";
import { ListToolbar, ServerPagination } from "../components/list-controls";
import { BulkBar, SelectBox, useSelection } from "../components/bulk-bar";

function kindVisual(kind: string) {
  return kind === "wynajem"
    ? { bar: "from-sky-400 to-indigo-400", glow: "rgba(56,189,248,0.4)", chip: "text-sky-700" }
    : { bar: "from-emerald-400 to-cyan-400", glow: "rgba(16,185,129,0.4)", chip: "text-emerald-700" };
}

export type MapPoint = { id: string; title: string; price: number | null; lat: number; lng: number; kind: string };

const SORTS = [
  { value: "nowe", label: "Najnowsze" },
  { value: "zmiana", label: "Ostatnio zmienione" },
  { value: "cena_rosnaco", label: "Cena rosnąco" },
  { value: "cena_malejaco", label: "Cena malejąco" },
  { value: "powierzchnia", label: "Powierzchnia malejąco" },
];

/**
 * Lista ofert. Filtry, sortowanie i strony liczy baza; mapa dostaje osobno
 * same punkty aktywnych ofert, żeby nie zależała od bieżącej strony listy.
 */
export function PropertiesBrowser({
  rows,
  query,
  total,
  pages,
  agents,
  canDelete,
  currentUserId,
  mapNear,
  mapFar,
  located,
  activeCount,
}: {
  rows: PropertyRow[];
  query: ListQuery;
  total: number;
  pages: number;
  agents: { id: string; name: string }[];
  canDelete: boolean;
  currentUserId: string;
  mapNear: MapPoint[];
  mapFar: { id: string; title: string }[];
  located: number;
  activeCount: number;
}) {
  const reduce = useReducedMotion();
  const selection = useSelection();
  const pageIds = rows.map((r) => r.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selection.has(id));

  return (
    <div>
      <ListToolbar
        base="/app/nieruchomosci"
        query={query}
        total={total}
        sorts={SORTS}
        agents={agents}
        placeholder="Szukaj po nazwie, adresie, mieście, numerze oferty…"
        filters={{
          statuses: PROPERTY_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          types: { label: "Typ nieruchomości", options: PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.label })) },
          dateFields: [
            { value: "zmiana", label: "ostatniej zmiany" },
            { value: "nowe", label: "dodania" },
          ],
          city: true,
          range: { label: "Cena", unit: "zł" },
          extra: {
            label: "Dodatkowo",
            options: [
              { value: "sprzedaz", label: "Tylko sprzedaż" },
              { value: "wynajem", label: "Tylko wynajem" },
              { value: "na_strone", label: "Oznaczone na stronę" },
              { value: "bez_zdjec", label: "Bez zdjęć" },
            ],
          },
        }}
      />

      {/* Mapa: aktywne oferty w okolicy Krakowa, niezależnie od strony listy */}
      {(mapNear.length > 0 || mapFar.length > 0) && (
        <Card className="mb-6 !overflow-hidden !p-0">
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent px-5 py-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-slate-700">Mapa ofert</h2>
            <span className="text-xs text-slate-500">
              {mapNear.length} z {activeCount} aktywnych
              {activeCount - located > 0 ? ` · ${activeCount - located} bez lokalizacji` : ""}
            </span>
          </div>
          {mapNear.length > 0 ? (
            <PropertiesMap points={mapNear} />
          ) : (
            <p className="p-6 text-sm text-slate-500">
              Żadna aktywna oferta nie ma lokalizacji. Przy dodawaniu albo edycji wybierz adres z podpowiedzi.
            </p>
          )}
          {mapFar.length > 0 && (
            <div className="border-t border-slate-200 px-5 py-3">
              <p className="mb-1.5 text-xs text-slate-500">
                Poza okolicami Krakowa (nie na mapie, żeby jej nie rozciągać):
              </p>
              <div className="flex flex-wrap gap-2">
                {mapFar.map((p) => (
                  <Link
                    key={p.id}
                    href={`/app/nieruchomosci/${p.id}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  >
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {rows.length > 0 && (
        <label className="mb-3 flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-slate-500">
          <input
            type="checkbox"
            checked={allOnPage}
            onChange={() => selection.setMany(pageIds, !allOnPage)}
            className="h-4 w-4 accent-emerald-500"
          />
          Zaznacz wszystkie na stronie ({rows.length})
        </label>
      )}

      {rows.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-slate-500">
            Nic nie pasuje do tych filtrów. Zmień je albo wyczyść, żeby zobaczyć całą bazę ofert.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p, i) => {
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
            const picked = selection.has(p.id);
            return (
              <motion.div
                key={p.id}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : Math.min(0.2, i * 0.02), duration: 0.25 }}
                className="relative"
              >
                <span className="absolute left-2 top-2 z-10 rounded-lg bg-white/90 shadow-sm backdrop-blur">
                  <SelectBox checked={picked} onChange={() => selection.toggle(p.id)} label={`Zaznacz ${p.title}`} />
                </span>
                <Link href={`/app/nieruchomosci/${p.id}`} className="block h-full">
                  <div
                    className={`card-glow group h-full overflow-hidden rounded-2xl border bg-gradient-to-b from-white to-slate-50 ${
                      picked ? "border-emerald-400 ring-1 ring-emerald-300" : "border-slate-200"
                    }`}
                    style={{ ["--glow"]: kv.glow } as CSSProperties}
                  >
                    <div className={`h-1.5 w-full bg-gradient-to-r ${kv.bar}`} />
                    {p.photos?.[0]?.url && (
                      <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.photos[0].url}
                          alt={p.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
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
                        <span className="text-xs font-medium text-emerald-400/80 opacity-0 transition group-hover:opacity-100">
                          Otwórz →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <ServerPagination base="/app/nieruchomosci" query={query} total={total} pages={pages} label="ofert" />

      <BulkBar
        entity="properties"
        selection={selection}
        statuses={PROPERTY_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
        stages={PROCESS_STAGES.map((s) => ({ value: s.value, label: s.label }))}
        agents={agents}
        canDelete={canDelete}
        noun={["oferta", "oferty", "ofert"]}
      />
    </div>
  );
}
