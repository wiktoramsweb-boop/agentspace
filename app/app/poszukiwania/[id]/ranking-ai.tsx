"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { rankingDopasowan } from "../actions";
import type { WynikDopasowania } from "@/lib/ai/dopasowanie";

export function RankingAi({
  searchId, oferty, maNotatki,
}: {
  searchId: string;
  oferty: Record<string, { nazwa: string; cena: string }>;
  maNotatki: boolean;
}) {
  const [ranking, setRanking] = useState<WynikDopasowania[] | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [pracuje, start] = useTransition();

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="font-semibold text-slate-900">Ranking AI według rozmów z klientem</p>
          <p className="mt-0.5 text-sm text-slate-600">
            Liczby sprawdziliśmy wyżej. AI czyta notatki z rozmów i układa oferty według tego, co klient naprawdę mówił,
            z jednym zdaniem uzasadnienia, które możesz powtórzyć przy telefonie.
            {!maNotatki && " Ten klient nie ma jeszcze notatek, więc ranking oprze się na kryteriach."}
          </p>
        </div>
        <button
          type="button"
          disabled={pracuje}
          onClick={() =>
            start(async () => {
              setBlad(null);
              const r = await rankingDopasowan(searchId);
              if (!r.ok) return setBlad(r.error);
              setRanking(r.ranking);
            })
          }
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {pracuje ? "Układam…" : ranking ? "Ułóż ponownie" : "Ułóż ranking · 3 kredyty"}
        </button>
      </div>
      {blad && <p className="mt-3 text-sm text-red-600">{blad}</p>}
      {ranking && (
        <ol className="mt-4 space-y-2">
          {ranking.map((r, i) => {
            const o = oferty[r.propertyId];
            if (!o) return null;
            return (
              <li key={r.propertyId} className="flex gap-3 rounded-xl bg-white p-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-sm font-bold text-violet-700">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link href={`/app/nieruchomosci/${r.propertyId}`} className="font-medium text-slate-900 hover:underline">{o.nazwa}</Link>
                    <span className="text-xs text-slate-500">{o.cena} · <strong className="text-violet-700">{r.ocena}/10</strong></span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{r.dlaczego}</p>
                  {r.uwaga && <p className="mt-1 text-xs text-amber-700">Zapytaj: {r.uwaga}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
