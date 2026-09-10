"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { ActivityRich } from "@/lib/data-activities";
import { formatDateTimePL } from "@/lib/datetime";
import { setActivityStatus, deleteActivity } from "./actions";
import { ACTIVITY_ICONS } from "../components/icons";
import {
  ACTIVITY_KINDS,
  ACTIVITY_KIND_MAP,
  ACTIVITY_PRIORITIES,
  ACTIVITY_PURPOSES,
  ACTIVITY_STATUSES,
  type ActivityKind,
  type ActivityStatus,
} from "@/lib/types";

const STATUS_MAP = Object.fromEntries(ACTIVITY_STATUSES.map((s) => [s.value, s]));
const PRIORITY_MAP = Object.fromEntries(ACTIVITY_PRIORITIES.map((p) => [p.value, p]));
const PURPOSE_MAP = Object.fromEntries(ACTIVITY_PURPOSES.map((p) => [p.value, p.label]));

function fmtWhen(iso: string | null): string {
  return formatDateTimePL(iso);
}

function fmtDuration(s: number | null): string | null {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m} min ${sec} s` : `${sec} s`;
}

export function ActivitiesBrowser({
  activities,
  currentUserId,
  agents = [],
}: {
  activities: ActivityRich[];
  currentUserId: string;
  agents?: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [status, setStatus] = useState<ActivityStatus | "">("");
  const [kind, setKind] = useState<ActivityKind | "">("");
  const [pending, start] = useTransition();
  const [advanced, setAdvanced] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Gdy wpisano co najmniej 3 cyfry, traktujemy zapytanie takze jako numer
    // telefonu: "+48 600 100 200", "600-100-200" i "600100200" to ten sam numer.
    const qDigits = query.replace(/\D/g, "");
    return activities.filter((a) => {
      if (scope === "mine" && !(a.assignee_ids ?? []).includes(currentUserId)) return false;
      if (status && a.status !== status) return false;
      if (kind && a.kind !== kind) return false;
      if (agentId && !(a.assignee_ids ?? []).includes(agentId)) return false;
      if (purpose && a.purpose !== purpose) return false;
      if (from && (a.due_at ?? "") < `${from}T00:00:00`) return false;
      if (to && (a.due_at ?? "") > `${to}T23:59:59`) return false;
      if (!q) return true;
      const phoneDigits = (a.contact_phone ?? "").replace(/\D/g, "");
      if (qDigits.length >= 3 && phoneDigits.includes(qDigits)) return true;
      return (
        a.subject.toLowerCase().includes(q) ||
        (a.contact_name ?? "").toLowerCase().includes(q) ||
        (a.contact_phone ?? "").toLowerCase().includes(q) ||
        (a.clientName ?? "").toLowerCase().includes(q) ||
        (a.propertyTitle ?? "").toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [activities, query, scope, status, kind, currentUserId, agentId, purpose, from, to]);

  const mineCount = activities.filter((a) => (a.assignee_ids ?? []).includes(currentUserId)).length;

  return (
    <div>
      {/* Pasek filtrów */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj po numerze telefonu, nazwisku, temacie…"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
        />
        <div className="flex rounded-xl border border-slate-300 bg-white p-1">
          <Scope active={scope === "all"} onClick={() => setScope("all")}>
            Wszystko ({activities.length})
          </Scope>
          <Scope active={scope === "mine"} onClick={() => setScope("mine")}>
            Moje ({mineCount})
          </Scope>
        </div>
      </div>

      {/* Chipsy rodzaju */}
      <div className="mb-2.5 flex flex-wrap gap-2">
        <Chip active={kind === ""} onClick={() => setKind("")}>
          Wszystkie rodzaje
        </Chip>
        {ACTIVITY_KINDS.map((k) => {
          const KIcon = ACTIVITY_ICONS[k.value];
          return (
            <Chip key={k.value} active={kind === k.value} onClick={() => setKind(kind === k.value ? "" : k.value)}>
              <KIcon className="h-3.5 w-3.5" />
              {k.label}
            </Chip>
          );
        })}
      </div>

      {/* Chipsy statusu */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Chip active={status === ""} onClick={() => setStatus("")}>
          Wszystkie statusy
        </Chip>
        {ACTIVITY_STATUSES.map((s) => (
          <Chip
            key={s.value}
            active={status === s.value}
            onClick={() => setStatus(status === s.value ? "" : s.value)}
          >
            {s.label}
          </Chip>
        ))}
      </div>

      {/* Filtry zaawansowane - zwinięte, żeby nie zaśmiecać widoku codziennego */}
      <div className="mb-5">
        <button
          onClick={() => setAdvanced((v) => !v)}
          className="text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
        >
          {advanced ? "Ukryj filtry zaawansowane" : "Filtry zaawansowane"}
          {(agentId || purpose || from || to) && !advanced ? " (aktywne)" : ""}
        </button>

        {advanced && (
          <div className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Agent</label>
              <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className={advInp}>
                <option value="">wszyscy</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Cel</label>
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={advInp}>
                <option value="">wszystkie</option>
                {ACTIVITY_PURPOSES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Termin od</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={advInp} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Termin do</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={advInp} />
            </div>
            {(agentId || purpose || from || to) && (
              <button
                onClick={() => {
                  setAgentId("");
                  setPurpose("");
                  setFrom("");
                  setTo("");
                }}
                className="justify-self-start rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-900"
              >
                Wyczyść filtry zaawansowane
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-sm text-slate-500">
          {activities.length === 0
            ? "Brak działań. Dodaj pierwsze - telefon, zadanie albo spotkanie."
            : "Brak działań dla tego filtra."}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((a) => {
            const km = ACTIVITY_KIND_MAP[a.kind] ?? ACTIVITY_KIND_MAP.polaczenie;
            const sm = STATUS_MAP[a.status] ?? STATUS_MAP.zaplanowane;
            const pm = PRIORITY_MAP[a.priority] ?? PRIORITY_MAP.normalny;
            const overdue =
              a.status === "zaplanowane" && a.due_at && new Date(a.due_at) < new Date();
            const dur = fmtDuration(a.duration_s);

            const KindIcon = ACTIVITY_ICONS[a.kind] ?? ACTIVITY_ICONS.polaczenie;
            return (
              <div
                key={a.id}
                className="group flex items-stretch gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white pl-0 transition hover:border-slate-300 hover:shadow-sm"
              >
                <span className={`w-1.5 flex-shrink-0 ${sm.bar}`} />

                <div className="min-w-0 flex-1 py-4 pr-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${km.tile}`}>
                      <KindIcon className="h-4 w-4" />
                    </span>
                    <Link
                      href={`/app/dzialania/${a.id}`}
                      className="font-semibold text-slate-900 hover:text-emerald-600 hover:underline"
                    >
                      {a.subject}
                    </Link>
                    {overdue && (
                      <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        zaległe
                      </span>
                    )}
                  </div>

                  <div className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <Row label="Typ">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${km.badge}`}>
                        {km.label}
                      </span>
                    </Row>
                    <Row label="Priorytet">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${pm.color}`}>
                        {pm.label}
                      </span>
                    </Row>
                    <Row label="Status">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${sm.color}`}>
                        {sm.label}
                      </span>
                    </Row>
                    <Row label="Termin">
                      <span className={overdue ? "font-medium text-red-600" : "text-slate-700"}>
                        {fmtWhen(a.due_at)}
                      </span>
                    </Row>

                    {a.purpose && <Row label="Cel">{PURPOSE_MAP[a.purpose] ?? a.purpose}</Row>}
                    <Row label="Agent">{a.assigneeNames.join(", ") || "-"}</Row>
                    <Row label="Telefon">
                      {a.contact_phone ? (
                        <a href={`tel:${a.contact_phone}`} className="text-blue-600 hover:underline">
                          {a.contact_phone}
                        </a>
                      ) : (
                        "-"
                      )}
                    </Row>
                    <Row label="Kontakt">{a.contact_name ?? "-"}</Row>
                    <Row label="Klient">
                      {a.client_id && a.clientName ? (
                        <Link href={`/app/klienci/${a.client_id}`} className="text-blue-600 hover:underline">
                          {a.clientName}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </Row>
                    <Row label="Nieruchomość">
                      {a.property_id && a.propertyTitle ? (
                        <Link
                          href={`/app/nieruchomosci/${a.property_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {a.propertyTitle}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </Row>
                    {dur && <Row label="Czas rozmowy">{dur}</Row>}
                  </div>

                  {a.description && (
                    <p className="mt-2.5 line-clamp-2 text-sm text-slate-500">{a.description}</p>
                  )}
                </div>

                <div className="flex flex-shrink-0 flex-col items-end justify-center gap-2 pr-4">
                  <Link
                    href={`/app/dzialania/${a.id}`}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:text-emerald-600"
                  >
                    Szczegóły →
                  </Link>
                  {a.status !== "wykonane" && (
                    <button
                      onClick={() => start(() => setActivityStatus(a.id, "wykonane"))}
                      disabled={pending}
                      className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50"
                    >
                      ✓ Wykonane
                    </button>
                  )}
                  {a.status === "wykonane" && (
                    <button
                      onClick={() => start(() => setActivityStatus(a.id, "zaplanowane"))}
                      disabled={pending}
                      className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
                    >
                      Cofnij
                    </button>
                  )}
                  <button
                    onClick={() => start(() => deleteActivity(a.id))}
                    disabled={pending}
                    aria-label="Usuń działanie"
                    className="rounded-lg px-3 py-1.5 text-xs text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-red-600 disabled:opacity-50"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const advInp =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 truncate">
      <span className="text-slate-400">{label}:</span>
      <span className="truncate text-slate-700">{children}</span>
    </p>
  );
}

function Scope({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}
