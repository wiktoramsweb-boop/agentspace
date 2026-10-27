"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dodajPodzial, usunPodzial } from "../actions";
import { formatPln } from "@/lib/format";
import type { PodzialWidok } from "@/lib/data-zasady-prowizji";

const ROLE: Record<string, string> = { wspolagent: "Współagent", polecajacy: "Polecający", inny: "Inny udział" };
const pole = "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none";

/**
 * Podział prowizji z transakcji: kto poza prowadzącym dostaje część, np.
 * agent kupującego albo osoba, która poleciła klienta. Procent od netto biura,
 * jak udział prowadzącego.
 */
export function PodzialProwizji({
  dealId,
  lista,
  osoby,
  udzialAgenta,
}: {
  dealId: string;
  lista: PodzialWidok[];
  osoby: { id: string; name: string }[];
  udzialAgenta: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [blad, setBlad] = useState<string | null>(null);
  const [f, setF] = useState({ profileId: osoby[0]?.id ?? "", rola: "wspolagent", pct: "" });
  const zostalo = 100 - udzialAgenta - lista.reduce((a, s) => a + s.pct, 0);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setBlad(null);
      const w = await fn();
      if (!w.ok) return setBlad(w.error ?? "Nie udało się zapisać.");
      setF((x) => ({ ...x, pct: "" }));
      router.refresh();
    });

  return (
    <div>
      {lista.length > 0 && (
        <ul className="mb-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {lista.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
              <span>
                <span className="font-medium text-slate-900">{s.imie}</span>
                <span className="text-slate-500">
                  {" "}
                  · {ROLE[s.rola] ?? s.rola} · {s.pct}%
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-semibold tabular-nums text-emerald-700">{formatPln(s.kwota)}</span>
                <button type="button" disabled={pending} onClick={() => run(() => usunPodzial(dealId, s.id))} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Usuń udział: ${s.imie}`}>
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {osoby.length === 0 ? (
        <p className="text-sm text-slate-500">W biurze nie ma innych osób, z którymi można podzielić prowizję.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Osoba" value={f.profileId} onChange={(e) => setF((x) => ({ ...x, profileId: e.target.value }))} className={`${pole} min-w-0 flex-1`}>
            {osoby.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <select aria-label="Rola w transakcji" value={f.rola} onChange={(e) => setF((x) => ({ ...x, rola: e.target.value }))} className={pole}>
            {Object.entries(ROLE).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-sm text-slate-500">
            <input aria-label="Procent prowizji netto" inputMode="decimal" value={f.pct} onChange={(e) => setF((x) => ({ ...x, pct: e.target.value }))} placeholder={String(Math.max(0, Math.min(20, zostalo)))} className={`${pole} w-20`} />%
          </label>
          <button
            type="button"
            disabled={pending || !f.pct}
            onClick={() => run(() => dodajPodzial(dealId, f.profileId, f.rola, Number(f.pct.replace(",", "."))))}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {pending ? "Zapisuję…" : "Dodaj udział"}
          </button>
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Prowadzący ma {udzialAgenta}% netto. {zostalo > 0 ? `Do podziału zostało ${zostalo}%.` : "Cała pula dla ludzi jest już rozdzielona."}
      </p>
      {blad && <p className="mt-2 text-sm text-red-600">{blad}</p>}
    </div>
  );
}
