"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SearchRich } from "@/lib/data-searches";
import { PROPERTY_ICONS } from "../components/icons";
import { PROPERTY_TYPES, SEARCH_STATUSES } from "@/lib/types";

const STATUS_MAP = Object.fromEntries(SEARCH_STATUSES.map((s) => [s.value, s]));
const TYPE_MAP = Object.fromEntries(PROPERTY_TYPES.map((t) => [t.value, t.label]));

const zl = (n: number | null) =>
  n == null ? null : new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(n) + " zł";

/** Zakres „od - do" w formie czytelnej: puste krańce zastępuje słowem. */
function range(min: number | null, max: number | null, unit = "", fmt?: (n: number) => string): string {
  const f = fmt ?? ((n: number) => String(n));
  if (min == null && max == null) return "dowolnie";
  if (min == null) return `do ${f(max!)}${unit}`;
  if (max == null) return `od ${f(min)}${unit}`;
  return `${f(min)} - ${f(max)}${unit}`;
}

export function SearchesBrowser({
  searches,
  matchCounts,
  currentUserId,
}: {
  searches: SearchRich[];
  matchCounts: Record<string, { fits: number; near: number }>;
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("aktualne");
  const [scope, setScope] = useState<"all" | "mine">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qd = query.replace(/\D/g, "");
    return searches.filter((s) => {
      if (status && s.status !== status) return false;
      if (scope === "mine" && s.agent_id !== currentUserId) return false;
      if (!q) return true;
      if (qd.length >= 3 && (s.clientPhone ?? "").replace(/\D/g, "").includes(qd)) return true;
      return (
        (s.title ?? "").toLowerCase().includes(q) ||
        (s.clientName ?? "").toLowerCase().includes(q) ||
        (s.search_no ?? "").toLowerCase().includes(q) ||
        s.locations.join(" ").toLowerCase().includes(q)
      );
    });
  }, [searches, query, status, scope, currentUserId]);

  const mineCount = searches.filter((s) => s.agent_id === currentUserId).length;

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj po kliencie, numerze telefonu, lokalizacji…"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
        />
        <div className="flex rounded-xl border border-slate-300 bg-white p-1">
          <Scope active={scope === "all"} onClick={() => setScope("all")}>
            Wszystkie ({searches.length})
          </Scope>
          <Scope active={scope === "mine"} onClick={() => setScope("mine")}>
            Moje ({mineCount})
          </Scope>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Chip active={status === ""} onClick={() => setStatus("")}>
          Wszystkie statusy
        </Chip>
        {SEARCH_STATUSES.map((s) => (
          <Chip key={s.value} active={status === s.value} onClick={() => setStatus(s.value)}>
            {s.label}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-sm text-slate-500">
          {searches.length === 0
            ? "Brak poszukiwań. Dodaj pierwsze - wtedy system sam podpowie pasujące oferty."
            : "Brak poszukiwań dla tego filtra."}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((s) => {
            const sm = STATUS_MAP[s.status] ?? STATUS_MAP.aktualne;
            const counts = matchCounts[s.id] ?? { fits: 0, near: 0 };
            return (
              <div
                key={s.id}
                className="flex items-stretch gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm"
              >
                <span className={`w-1.5 flex-shrink-0 ${sm.bar}`} />

                <div className="min-w-0 flex-1 py-4 pr-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/app/poszukiwania/${s.id}`}
                      className="font-semibold text-slate-900 hover:text-emerald-600 hover:underline"
                    >
                      {s.clientName ?? s.title ?? "Poszukiwanie"}
                    </Link>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${sm.color}`}>
                      {sm.label}
                    </span>
                    {counts.fits > 0 && (
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        {counts.fits} dopasowań
                      </span>
                    )}
                    {counts.near > 0 && (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {counts.near} prawie
                      </span>
                    )}
                  </div>

                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    {s.property_types.map((t) => {
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
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {s.deal_kind === "wynajem" ? "Najem" : "Kupno"}
                    </span>
                  </div>

                  <div className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <Row label={s.deal_kind === "wynajem" ? "Czynsz" : "Cena"}>
                      {range(s.price_min, s.price_max, "", (n) => zl(n)!)}
                    </Row>
                    <Row label="Powierzchnia">{range(s.area_min, s.area_max, " m²")}</Row>
                    <Row label="Pokoje">{range(s.rooms_min, s.rooms_max)}</Row>
                    <Row label="Lokalizacje">
                      {s.locations.length > 0 ? s.locations.join(", ") : "dowolnie"}
                    </Row>
                    <Row label="Nr">{s.search_no ?? "-"}</Row>
                    <Row label="Agent">{s.agentName ?? "-"}</Row>
                    <Row label="Telefon">
                      {s.clientPhone ? (
                        <a href={`tel:${s.clientPhone}`} className="text-blue-600 hover:underline">
                          {s.clientPhone}
                        </a>
                      ) : (
                        "-"
                      )}
                    </Row>
                    <Row label="Dodano">
                      {new Date(s.created_at).toLocaleDateString("pl-PL")}
                    </Row>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center pr-4">
                  <Link
                    href={`/app/poszukiwania/${s.id}`}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:text-emerald-600"
                  >
                    Dopasowania →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 truncate">
      <span className="text-slate-400">{label}:</span>
      <span className="truncate text-slate-700">{children}</span>
    </p>
  );
}

function Scope({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-emerald-500 text-white" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}
