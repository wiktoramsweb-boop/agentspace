"use client";

import { useTransition } from "react";
import { deleteSearch, setSearchStatus } from "../actions";
import { SEARCH_STATUSES } from "@/lib/types";
import { Select } from "@/app/app/components/select";

export function SearchActions({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      <Select value={status} onChange={(e) => start(() => setSearchStatus(id, e.target.value))} disabled={pending}>
        {SEARCH_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
      <button
        onClick={() => {
          if (confirm("Usunąć to poszukiwanie?")) start(() => deleteSearch(id));
        }}
        disabled={pending}
        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-600 transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
      >
        Usuń
      </button>
    </div>
  );
}
