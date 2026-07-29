"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PROPERTY_STATUSES, PROPERTY_TYPES, PROPERTY_DEAL_KINDS } from "@/lib/types";
import type { PropertyWithOwner } from "@/lib/data-platform";
import { formatPln } from "@/lib/format";
import { Card } from "../components/ui";
import { PropertiesMap } from "./properties-map";

export function PropertiesBrowser({
  properties,
  currentUserId,
}: {
  properties: PropertyWithOwner[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "mine">("all");

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

  const mineCount = properties.filter((p) => p.agent_id === currentUserId).length;
  const active = filtered.filter((p) => p.status === "aktywna");
  const mapPoints = active
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({ id: p.id, title: p.title, price: p.price_pln, lat: p.lat!, lng: p.lng! }));

  return (
    <div>
      {/* Szukaj + zakres */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj po nazwie, adresie, mieście lub agencie…"
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
        />
        <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
          <ScopeBtn active={scope === "all"} onClick={() => setScope("all")} label={`Wszystkie (${properties.length})`} />
          <ScopeBtn active={scope === "mine"} onClick={() => setScope("mine")} label={`Moje (${mineCount})`} />
        </div>
      </div>

      {/* Mapa */}
      {filtered.length > 0 && (
        <Card className="mb-6 !overflow-hidden !p-0">
          <div className="flex items-center justify-between border-b border-zinc-700/60 px-5 py-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">Mapa ofert</h2>
            <span className="text-xs text-zinc-500">{mapPoints.length} na mapie</span>
          </div>
          {mapPoints.length > 0 ? (
            <PropertiesMap points={mapPoints} />
          ) : (
            <p className="p-6 text-sm text-zinc-500">
              Żadna oferta w tym widoku nie ma lokalizacji. Przy dodawaniu/edycji wybierz adres z podpowiedzi.
            </p>
          )}
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-zinc-500">Brak ofert dla tego filtra.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const status = PROPERTY_STATUSES.find((s) => s.value === p.status);
            const type = PROPERTY_TYPES.find((t) => t.value === p.property_type);
            const kind = PROPERTY_DEAL_KINDS.find((k) => k.value === p.deal_kind);
            const params = [
              type?.label,
              p.area_m2 != null ? `${p.area_m2} m²` : null,
              p.rooms != null ? `${p.rooms} pok.` : null,
            ]
              .filter(Boolean)
              .join(" · ");
            const mine = p.agent_id === currentUserId;
            return (
              <Link key={p.id} href={`/app/nieruchomosci/${p.id}`}>
                <Card className="h-full transition hover:border-emerald-500/40 hover:bg-zinc-800/70">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="text-xs font-medium uppercase tracking-wide text-emerald-400">{kind?.label}</span>
                    {status && (
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${status.color}`}>{status.label}</span>
                    )}
                  </div>
                  <h3 className="mb-1 font-semibold text-white">{p.title}</h3>
                  {(p.city || p.address) && (
                    <p className="mb-3 truncate text-sm text-zinc-500">{p.city ?? p.address}</p>
                  )}
                  <p className="text-lg font-semibold text-white">
                    {p.price_pln != null ? formatPln(p.price_pln) : "—"}
                    {p.deal_kind === "wynajem" && p.price_pln != null && (
                      <span className="text-sm font-normal text-zinc-500"> /mc</span>
                    )}
                  </p>
                  {params && <p className="mt-1 text-sm text-zinc-500">{params}</p>}
                  {p.opiekunName && (
                    <p className="mt-2 text-xs text-zinc-500">
                      Agent: <span className={mine ? "text-emerald-400" : "text-zinc-400"}>{mine ? "Ty" : p.opiekunName}</span>
                    </p>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScopeBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
