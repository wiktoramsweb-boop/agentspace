"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { WidokCelow, WynikMiernika } from "@/lib/data-cele-rol";
import { formatPln } from "@/lib/format";
import { zapiszCelRoli } from "./actions";

const pokaz = (m: WynikMiernika, v: number) => (m.jednostka === "zl" ? formatPln(v) : m.jednostka === "ocena" ? `${v.toLocaleString("pl-PL")}/10` : v.toLocaleString("pl-PL"));

function Karta({ m }: { m: WynikMiernika }) {
  const router = useRouter();
  const [edycja, setEdycja] = useState(false);
  const [wartosc, setWartosc] = useState(String(m.cel));
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const r = 42;
  const obwod = 2 * Math.PI * r;
  const zapisz = () =>
    start(async () => {
      const w = await zapiszCelRoli(m.klucz, wartosc);
      setBlad(w.ok ? null : (w.blad ?? "Nie udało się."));
      if (w.ok) {
        setEdycja(false);
        router.refresh();
      }
    });
  return (
    <section className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5">
      <span className="relative grid h-24 w-24 flex-shrink-0 place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-slate-100" />
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" strokeLinecap="round" className={m.zaPlanem ? "stroke-emerald-500" : "stroke-amber-500"} strokeDasharray={obwod} strokeDashoffset={obwod * (1 - m.procent / 100)} />
        </svg>
        <b className="relative text-lg font-bold tabular-nums text-slate-900">{m.procent}%</b>
      </span>
      <div className="min-w-0 flex-1">
        <Link href={m.href} className="font-semibold text-slate-900 hover:text-emerald-700">
          {m.nazwa}
        </Link>
        <p className="text-xl font-bold tabular-nums text-slate-900">
          {pokaz(m, m.teraz)} <span className="text-sm font-medium text-slate-400">z {pokaz(m, m.cel)}</span>
        </p>
        <p className="text-xs text-slate-500">{m.opis}</p>
        {edycja ? (
          <div className="mt-2 flex gap-2">
            <input value={wartosc} onChange={(e) => setWartosc(e.target.value)} inputMode="decimal" aria-label={`Cel: ${m.nazwa}`} className="w-32 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none" />
            <button type="button" disabled={pending} onClick={zapisz} className="rounded-lg bg-emerald-600 px-3 py-1 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
              Zapisz
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setEdycja(true)} className="mt-1 text-xs font-medium text-emerald-700 hover:underline">
            Zmień cel
          </button>
        )}
        {blad && <p className="mt-1 text-xs text-rose-600">{blad}</p>}
      </div>
    </section>
  );
}

export function CeleRoli({ widok }: { widok: WidokCelow }) {
  return (
    <>
      <p className="mb-4 text-sm text-slate-500">
        Dzień {widok.dzien} z {widok.dniWMiesiacu}. Zielony wykres: idziesz zgodnie z planem. Pomarańczowy: tempo poniżej planu.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {widok.mierniki.map((m) => (
          <Karta key={m.klucz} m={m} />
        ))}
      </div>
    </>
  );
}
