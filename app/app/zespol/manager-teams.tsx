"use client";

import { useState, useTransition } from "react";
import { assignManager } from "./actions";

export type MTAgent = { id: string; name: string; manager_id: string | null };
export type MTManager = { id: string; name: string };

export function ManagerTeams({ managers, agents }: { managers: MTManager[]; agents: MTAgent[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ error?: string } | undefined | void>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res && "error" in res && res.error) setError(res.error);
    });
  }

  if (managers.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-500">
        Najpierw nadaj komuś rolę <span className="font-medium text-zinc-300">Menedżer</span> w „Role i przypisania"
        powyżej - wtedy tutaj przypiszesz mu osoby, które ma widzieć.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {managers.map((m) => {
        const team = agents.filter((a) => a.manager_id === m.id);
        const available = agents.filter((a) => a.manager_id !== m.id);
        return (
          <div key={m.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-bold text-violet-300">
                {m.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-medium text-white">{m.name}</p>
                <p className="text-xs text-zinc-500">
                  {team.length === 0 ? "nikim jeszcze nie zarządza" : `zarządza ${team.length} ${team.length === 1 ? "osobą" : "osobami"}`}
                </p>
              </div>
            </div>

            {team.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {team.map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-sm text-zinc-200">
                    {a.name}
                    <button
                      onClick={() => run(() => assignManager(a.id, null))}
                      disabled={pending}
                      title="Usuń z zespołu"
                      className="text-zinc-500 transition hover:text-red-400 disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            <select
              value=""
              disabled={pending || available.length === 0}
              onChange={(e) => {
                const id = e.target.value;
                if (id) run(() => assignManager(id, m.id));
              }}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none disabled:opacity-60 sm:w-auto"
            >
              <option value="">
                {available.length === 0 ? "Brak agentów do dodania" : `+ dodaj osobę do zespołu: ${m.name}`}
              </option>
              {available.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.manager_id ? " (przeniesie od innego menedżera)" : ""}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
