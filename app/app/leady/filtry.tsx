"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select } from "../components/select";

/** Filtry listy. Trzymane w adresie, żeby dało się wysłać komuś link do widoku. */
export function FiltryLeadow({
  agenci,
  zrodla,
  biezace,
}: {
  agenci: { id: string; name: string }[];
  zrodla: { value: string; label: string }[];
  biezace: { status?: string; agent?: string; source?: string; q?: string };
}) {
  const router = useRouter();
  const [q, setQ] = useState(biezace.q ?? "");

  function idz(zmiany: Record<string, string>) {
    const p = new URLSearchParams();
    const nowe = { ...biezace, ...zmiany };
    for (const [k, v] of Object.entries(nowe)) if (v) p.set(k, v);
    router.push(`/app/leady${p.toString() ? `?${p}` : ""}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          idz({ q });
        }}
        className="min-w-[220px] flex-1"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Szukaj po nazwisku, telefonie, mailu lub treści…"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
        />
      </form>

      <div className="w-48">
        <Select
          aria-label="Opiekun"
          value={biezace.agent ?? ""}
          onChange={(e) => idz({ agent: e.target.value })}
          options={[{ value: "bez", label: "Bez opiekuna" }, ...agenci.map((a) => ({ value: a.id, label: a.name }))]}
          placeholder="Wszyscy opiekunowie"
        />
      </div>

      <div className="w-48">
        <Select
          aria-label="Źródło"
          value={biezace.source ?? ""}
          onChange={(e) => idz({ source: e.target.value })}
          options={zrodla}
          placeholder="Wszystkie źródła"
        />
      </div>

      {(biezace.status || biezace.agent || biezace.source || biezace.q) && (
        <button
          type="button"
          onClick={() => router.push("/app/leady")}
          className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          Wyczyść
        </button>
      )}
    </div>
  );
}
