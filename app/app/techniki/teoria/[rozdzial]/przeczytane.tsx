"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { oznaczRozdzial } from "../actions";

export function Przeczytane({ id, przeczytany }: { id: string; przeczytany: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [blad, setBlad] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setBlad(null);
            const w = await oznaczRozdzial(id, !przeczytany);
            if (!w.ok) return setBlad(w.error);
            router.refresh();
          })
        }
        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${przeczytany ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-900 text-white hover:bg-slate-700"}`}
      >
        {pending ? "Zapisuję…" : przeczytany ? "✓ Przeczytane" : "Oznacz jako przeczytane"}
      </button>
      {blad && <p className="mt-1 text-xs text-red-600">{blad}</p>}
    </div>
  );
}
