"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CLIENT_STATUSES, CLIENT_TYPES, CLIENT_TYPE_LABELS, type ClientStatus, type ClientType } from "@/lib/types";
import type { ClientWithOwner } from "@/lib/data-platform";
import { formatPln, daysAgo } from "@/lib/format";

const digits = (s: string | null) => (s ?? "").replace(/\D/g, "");

// Kolor awatara na podstawie nazwy - stabilny, żywy, w klimacie marki.
const AVATARS = [
  "from-emerald-400 to-cyan-500",
  "from-violet-400 to-fuchsia-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
  "from-rose-400 to-pink-500",
  "from-teal-400 to-emerald-500",
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATARS[h % AVATARS.length];
}

// Kolor lewego akcentu wiersza wg statusu.
const ACCENT: Record<ClientStatus, string> = {
  nowy: "bg-blue-400",
  w_kontakcie: "bg-cyan-400",
  oglada: "bg-violet-400",
  negocjacje: "bg-amber-400",
  zamkniety: "bg-emerald-400",
  stracony: "bg-red-400",
};

export function ClientsBrowser({
  clients,
  currentUserId,
}: {
  clients: ClientWithOwner[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<ClientType | "">("");

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qd = digits(query);
    return clients.filter((c) => {
      if (scope === "mine" && c.agent_id !== currentUserId) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (typeFilter && c.type !== typeFilter) return false;
      if (!q) return true;
      const byName = c.name.toLowerCase().includes(q);
      const byEmail = (c.email ?? "").toLowerCase().includes(q);
      const byPhone = qd.length >= 3 && digits(c.phone).includes(qd);
      return byName || byEmail || byPhone;
    });
  }, [clients, query, scope, statusFilter, typeFilter, currentUserId]);

  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of clients) m[c.type] = (m[c.type] ?? 0) + 1;
    return m;
  }, [clients]);

  const mineCount = clients.filter((c) => c.agent_id === currentUserId).length;

  return (
    <div>
      {/* Pasek wyszukiwania + zakres */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj po nazwisku lub numerze telefonu…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          <ScopeBtn active={scope === "all"} onClick={() => setScope("all")}>
            Całe biuro ({clients.length})
          </ScopeBtn>
          <ScopeBtn active={scope === "mine"} onClick={() => setScope("mine")}>
            Moi ({mineCount})
          </ScopeBtn>
        </div>
      </div>

      {/* Filtr typu klienta */}
      <div className="mb-3 flex flex-wrap gap-2">
        <Chip active={typeFilter === ""} onClick={() => setTypeFilter("")}>
          Wszyscy
        </Chip>
        {CLIENT_TYPES.map((t) => (
          <Chip
            key={t.value}
            active={typeFilter === t.value}
            onClick={() => setTypeFilter(typeFilter === t.value ? "" : t.value)}
          >
            {t.label}
            {typeCounts[t.value] ? ` (${typeCounts[t.value]})` : ""}
          </Chip>
        ))}
      </div>

      {/* Filtr statusu */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Chip active={statusFilter === ""} onClick={() => setStatusFilter("")}>
          Wszystkie
        </Chip>
        {CLIENT_STATUSES.map((s) => (
          <Chip
            key={s.value}
            active={statusFilter === s.value}
            onClick={() => setStatusFilter(statusFilter === s.value ? "" : s.value)}
          >
            {s.label}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
          {query ? "Brak wyników dla tego wyszukiwania." : "Brak klientów w tym widoku."}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => {
            const status = CLIENT_STATUSES.find((s) => s.value === c.status);
            const typeLabel = CLIENT_TYPE_LABELS[c.type] ?? c.type;
            const due = c.next_contact_at && c.next_contact_at <= today;
            return (
              <Link
                key={c.id}
                href={`/app/klienci/${c.id}`}
                className="hover-lift group flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 pl-0 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <span className={`h-14 w-1.5 flex-shrink-0 rounded-r-full ${ACCENT[c.status]}`} />
                <div
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(c.name)} text-sm font-bold text-white`}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>

                <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-0.5 sm:grid-cols-[1.4fr_1fr_1fr]">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{c.name}</p>
                    <p className="truncate text-sm text-slate-500">
                      {typeLabel}
                      {c.property && ` · ${c.property}`}
                    </p>
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="truncate text-slate-700">{c.phone ?? "-"}</p>
                    <p className="truncate text-xs text-slate-500">
                      {c.budget_pln != null ? formatPln(c.budget_pln) : "-"}
                    </p>
                  </div>
                  <div className="hidden min-w-0 text-sm sm:block">
                    <p className="truncate text-slate-500">
                      <span className="text-slate-400">Opiekun: </span>
                      {c.opiekunName ?? "-"}
                    </p>
                    <p className="truncate text-xs text-slate-500">{daysAgo(c.last_contact_at)}</p>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-3 pr-4">
                  {due && (
                    <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                      🔔
                    </span>
                  )}
                  {status && (
                    <span className={`rounded-md px-2 py-1 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScopeBtn({
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
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-emerald-500/50 bg-emerald-100 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}
