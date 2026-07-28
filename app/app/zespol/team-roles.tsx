"use client";

import { useState, useTransition } from "react";
import type { UserRole } from "@/lib/types";
import { setMemberRole, assignManager, setWeeklyLimit } from "./actions";
import type { ManagerOption } from "./invite-form";

export type TeamMember = {
  id: string;
  label: string;
  email: string | null;
  role: UserRole;
  manager_id: string | null;
  weekly_ai_limit: number | null;
};

export function TeamRoles({
  members,
  managers,
  currentUserId,
}: {
  members: TeamMember[];
  managers: ManagerOption[];
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ error?: string } | undefined | void>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res && "error" in res && res.error) setError(res.error);
    });
  }

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      <div className="divide-y divide-zinc-900 rounded-2xl border border-zinc-800">
        {members.map((m) => (
          <div key={m.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {m.label}
                {m.id === currentUserId && <span className="ml-2 text-xs text-zinc-500">(Ty)</span>}
              </p>
              {m.email && <p className="truncate text-xs text-zinc-500">{m.email}</p>}
            </div>

            <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
              <select
                aria-label="Rola"
                value={m.role}
                disabled={pending}
                onChange={(e) => run(() => setMemberRole(m.id, e.target.value as UserRole))}
                className={sel}
              >
                <option value="agent">Agent</option>
                <option value="manager">Menedżer</option>
                <option value="owner">CEO</option>
              </select>

              {m.role === "agent" && (
                <select
                  aria-label="Menedżer"
                  value={m.manager_id ?? ""}
                  disabled={pending}
                  onChange={(e) => run(() => assignManager(m.id, e.target.value || null))}
                  className={sel}
                >
                  <option value="">— bez menedżera —</option>
                  {managers
                    .filter((mgr) => mgr.id !== m.id)
                    .map((mgr) => (
                      <option key={mgr.id} value={mgr.id}>{mgr.label}</option>
                    ))}
                </select>
              )}

              <div className="flex items-center gap-1.5" title="Tygodniowy limit rozmów z AI Coach (puste = bez limitu)">
                <span className="text-xs text-zinc-500">Limit AI/tydz.</span>
                <input
                  type="number"
                  min={0}
                  aria-label="Tygodniowy limit rozmów AI"
                  defaultValue={m.weekly_ai_limit ?? ""}
                  placeholder="∞"
                  disabled={pending}
                  onBlur={(e) => {
                    const raw = e.target.value.trim();
                    const val = raw === "" ? null : parseInt(raw, 10);
                    const current = m.weekly_ai_limit;
                    if ((val ?? null) !== (current ?? null)) run(() => setWeeklyLimit(m.id, val));
                  }}
                  className="w-16 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const sel =
  "rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none disabled:opacity-60";
