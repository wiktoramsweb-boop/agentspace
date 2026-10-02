"use client";

import { useState, useTransition } from "react";
import type { UserRole } from "@/lib/types";
import { ROLE, opisRoli } from "@/lib/role";
import { setMemberRole } from "./actions";
import { Select } from "@/app/app/components/select";

export type TeamMember = {
  id: string;
  label: string;
  email: string | null;
  role: UserRole;
  manager_id: string | null;
};

export function TeamRoles({
  members,
  currentUserId,
}: {
  members: TeamMember[];
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
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
        {members.map((m) => (
          <div key={m.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {m.label}
                {m.id === currentUserId && <span className="ml-2 text-xs text-slate-500">(Ty)</span>}
              </p>
              {m.email && <p className="truncate text-xs text-slate-500">{m.email}</p>}
              <p className="mt-0.5 text-xs text-slate-400">{opisRoli(m.role).opis}</p>
            </div>

            <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
              <Select aria-label="Rola" value={m.role} disabled={pending} onChange={(e) => run(() => setMemberRole(m.id, e.target.value as UserRole))}>
                {ROLE.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nazwa}
                  </option>
                ))}
              </Select>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

