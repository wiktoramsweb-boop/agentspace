"use client";

import { formatDatePL } from "@/lib/datetime";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { klikKarty } from "../components/klik-karty";
import type { SearchRich } from "@/lib/data-searches";
import { PROPERTY_ICONS } from "../components/icons";
import { BulkBar, SelectBox, useSelection } from "../components/bulk-bar";
import { PROPERTY_TYPES, SEARCH_STATUSES } from "@/lib/types";
import { Select } from "../components/select";

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
  agents,
  canDelete,
}: {
  searches: SearchRich[];
  matchCounts: Record<string, { fits: number; near: number }>;
  currentUserId: string;
  agents: { id: string; name: string }[];
  canDelete: boolean;
}) {
  const selection = useSelection();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("aktualne");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [pokazFiltry, setPokazFiltry] = useState(false);
  const PUSTE = { agent: "", transakcja: "", typ: "", miejsce: "", budzetOd: "", budzetDo: "", pokoje: "", dopasowania: "", sort: "nowe" };
  const [f, setF] = useState(PUSTE);
  const ustaw = (k: keyof typeof PUSTE) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const ileFiltrow = (Object.keys(PUSTE) as (keyof typeof PUSTE)[]).filter((k) => k !== "sort" && f[k]).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qd = query.replace(/\D/g, "");
    const liczba = (v: string) => Number(v.replace(/\s/g, "").replace(",", ".")) || 0;
    const od = liczba(f.budzetOd);
    const doK = liczba(f.budzetDo);
    const miejsce = f.miejsce.trim().toLowerCase();
    const wynik = searches.filter((s) => {
      if (status && s.status !== status) return false;
      if (scope === "mine" && s.agent_id !== currentUserId) return false;
      if (f.agent && s.agent_id !== f.agent) return false;
      if (f.transakcja && s.deal_kind !== f.transakcja) return false;
      if (f.typ && !s.property_types.includes(f.typ as (typeof s.property_types)[number])) return false;
      if (miejsce && !s.locations.join(" ").toLowerCase().includes(miejsce)) return false;
      // Budżet klienta to przedział: pasuje, gdy zachodzi na przedział z filtra.
      if (od && s.price_max != null && s.price_max < od) return false;
      if (doK && s.price_min != null && s.price_min > doK) return false;
      if (f.pokoje && s.rooms_max != null && s.rooms_max < liczba(f.pokoje)) return false;
      const dop = matchCounts[s.id]?.fits ?? 0;
      if (f.dopasowania === "tak" && dop === 0) return false;
      if (f.dopasowania === "nie" && dop > 0) return false;
      return true;
    });
    const sortowane = [...wynik].sort((a, b) =>
      f.sort === "stare"
        ? a.created_at.localeCompare(b.created_at)
        : f.sort === "budzet"
          ? (b.price_max ?? b.price_min ?? 0) - (a.price_max ?? a.price_min ?? 0)
          : f.sort === "dopasowania"
            ? (matchCounts[b.id]?.fits ?? 0) - (matchCounts[a.id]?.fits ?? 0)
            : b.created_at.localeCompare(a.created_at),
    );
    return sortowane.filter((s) => {
      if (!q) return true;
      if (qd.length >= 3 && (s.clientPhone ?? "").replace(/\D/g, "").includes(qd)) return true;
      return (
        (s.title ?? "").toLowerCase().includes(q) ||
        (s.clientName ?? "").toLowerCase().includes(q) ||
        (s.search_no ?? "").toLowerCase().includes(q) ||
        s.locations.join(" ").toLowerCase().includes(q)
      );
    });
  }, [searches, query, status, scope, currentUserId, f, matchCounts]);

  const mineCount = searches.filter((s) => s.agent_id === currentUserId).length;
  const pageIds = filtered.map((s) => s.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selection.has(id));

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj po kliencie, numerze telefonu, lokalizacji…"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setPokazFiltry((v) => !v)}
          aria-expanded={pokazFiltry}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            ileFiltrow > 0 ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filtry
          {ileFiltrow > 0 && <span className="rounded-full bg-emerald-500 px-1.5 text-xs font-bold text-white">{ileFiltrow}</span>}
        </button>
        <div className="sm:w-52">
          <Select
            aria-label="Sortowanie"
            value={f.sort}
            onChange={ustaw("sort")}
            options={[
              { value: "nowe", label: "Najnowsze" },
              { value: "stare", label: "Najstarsze" },
              { value: "dopasowania", label: "Najwięcej dopasowań" },
              { value: "budzet", label: "Najwyższy budżet" },
            ]}
            placeholder=""
          />
        </div>
        <div className="flex rounded-xl border border-slate-300 bg-white p-1">
          <Scope active={scope === "all"} onClick={() => setScope("all")}>
            Wszystkie ({searches.length})
          </Scope>
          <Scope active={scope === "mine"} onClick={() => setScope("mine")}>
            Moje ({mineCount})
          </Scope>
        </div>
      </div>

      {pokazFiltry && (
        <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Pole etykieta="Agent">
            <Select value={f.agent} onChange={ustaw("agent")} options={agents.map((a) => ({ value: a.id, label: a.name }))} placeholder="Wszyscy" />
          </Pole>
          <Pole etykieta="Transakcja">
            <Select value={f.transakcja} onChange={ustaw("transakcja")} options={[{ value: "sprzedaz", label: "Kupno" }, { value: "wynajem", label: "Najem" }]} placeholder="Kupno i najem" />
          </Pole>
          <Pole etykieta="Rodzaj nieruchomości">
            <Select value={f.typ} onChange={ustaw("typ")} options={PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.label }))} placeholder="Każdy" />
          </Pole>
          <Pole etykieta="Dopasowania">
            <Select value={f.dopasowania} onChange={ustaw("dopasowania")} options={[{ value: "tak", label: "Mają pasujące oferty" }, { value: "nie", label: "Bez pasujących ofert" }]} placeholder="Wszystkie" />
          </Pole>
          <Pole etykieta="Lokalizacja">
            <input value={f.miejsce} onChange={ustaw("miejsce")} placeholder="np. Podgórze" className={pole} />
          </Pole>
          <Pole etykieta="Budżet od (zł)">
            <input value={f.budzetOd} onChange={ustaw("budzetOd")} inputMode="numeric" placeholder="np. 400 000" className={pole} />
          </Pole>
          <Pole etykieta="Budżet do (zł)">
            <input value={f.budzetDo} onChange={ustaw("budzetDo")} inputMode="numeric" placeholder="np. 700 000" className={pole} />
          </Pole>
          <Pole etykieta="Pokoje (co najmniej)">
            <input value={f.pokoje} onChange={ustaw("pokoje")} inputMode="numeric" placeholder="np. 3" className={pole} />
          </Pole>
          {ileFiltrow > 0 && (
            <button type="button" onClick={() => setF((x) => ({ ...PUSTE, sort: x.sort }))} className="text-left text-sm font-medium text-slate-500 hover:text-slate-900 sm:col-span-2 lg:col-span-4">
              Wyczyść filtry
            </button>
          )}
        </div>
      )}

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

      {filtered.length > 0 && (
        <label className="mb-2 flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-slate-500">
          <input
            type="checkbox"
            checked={allOnPage}
            onChange={() => selection.setMany(pageIds, !allOnPage)}
            className="h-4 w-4 accent-emerald-500"
          />
          Zaznacz wszystkie ({filtered.length})
        </label>
      )}

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
            const picked = selection.has(s.id);
            return (
              <div
                key={s.id}
                onClick={(e) => klikKarty(e, `/app/poszukiwania/${s.id}`, router.push)}
                className={`group flex cursor-pointer items-stretch gap-2 overflow-hidden rounded-2xl border bg-white transition hover:shadow-sm ${
                  picked ? "border-emerald-400 ring-1 ring-emerald-300" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className={`w-1.5 flex-shrink-0 ${sm.bar}`} />
                <div className="flex items-center pt-4">
                  <SelectBox
                    checked={picked}
                    onChange={() => selection.toggle(s.id)}
                    label={`Zaznacz ${s.clientName ?? s.title ?? "poszukiwanie"}`}
                  />
                </div>

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
                      {formatDatePL(s.created_at)}
                    </Row>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center pr-4">
                  <svg className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BulkBar
        entity="searches"
        selection={selection}
        statuses={SEARCH_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
        agents={agents}
        canDelete={canDelete}
        noun={["poszukiwanie", "poszukiwania", "poszukiwań"]}
      />
    </div>
  );
}

const pole = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

function Pole({ etykieta, children }: { etykieta: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{etykieta}</span>
      {children}
    </label>
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
