"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { WidokCelow, WynikMiernika } from "@/lib/data-cele-rol";
import { formatPln } from "@/lib/format";
import { zapiszCelRoli } from "./actions";

const plDni = (n: number) => (n === 1 ? "1 dzień" : `${n} dni`);
const pokaz = (m: WynikMiernika, v: number) => (m.jednostka === "zl" ? formatPln(v) : m.jednostka === "ocena" ? `${v.toLocaleString("pl-PL")}/10` : v.toLocaleString("pl-PL"));

function Karta({ m }: { m: WynikMiernika }) {
  const router = useRouter();
  const [edycja, setEdycja] = useState(false);
  const [wartosc, setWartosc] = useState(String(m.cel));
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const zapisz = () =>
    start(async () => {
      const w = await zapiszCelRoli(m.klucz, wartosc);
      setBlad(w.ok ? null : (w.blad ?? "Nie udało się."));
      if (w.ok) {
        setEdycja(false);
        router.refresh();
      }
    });
  const zostalo = Math.max(0, m.cel - m.teraz);
  return (
    <section className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <Link href={m.href} className="font-semibold text-slate-900 hover:text-emerald-700">
          {m.nazwa}
        </Link>
        <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${m.procent >= 100 ? "bg-emerald-100 text-emerald-700" : m.zaPlanem ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"}`}>
          {m.procent >= 100 ? "Cel osiągnięty" : m.zaPlanem ? "W planie" : "Poniżej tempa"}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{pokaz(m, m.teraz)}</p>
      <p className="text-sm text-slate-500">
        z {pokaz(m, m.cel)}
        {zostalo > 0 && m.jednostka !== "ocena" ? ` · brakuje ${pokaz(m, zostalo)}` : ""}
      </p>
      <div className="relative mt-4 h-3 rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${m.zaPlanem || m.procent >= 100 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.max(m.procent, m.teraz > 0 ? 3 : 0)}%` }} />
        {m.jednostka !== "ocena" && <span className="absolute -top-1 h-5 w-0.5 rounded bg-slate-400" style={{ left: `${m.plan}%` }} title="Gdzie powinieneś być dziś" aria-hidden="true" />}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-3">
        <p className="text-xs text-slate-500">{m.opis}</p>
        {!edycja && (
          <button type="button" onClick={() => setEdycja(true)} className="flex-shrink-0 text-xs font-semibold text-emerald-700 hover:underline">
            Zmień cel
          </button>
        )}
      </div>
      {edycja && (
        <div className="mt-2 flex gap-2">
          <input value={wartosc} onChange={(e) => setWartosc(e.target.value)} inputMode="decimal" aria-label={`Cel: ${m.nazwa}`} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none" />
          <button type="button" disabled={pending} onClick={zapisz} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
            Zapisz
          </button>
        </div>
      )}
      {blad && <p className="mt-1 text-xs text-rose-600">{blad}</p>}
    </section>
  );
}

export function CeleRoli({ widok }: { widok: WidokCelow }) {
  const sredni = Math.round(widok.mierniki.reduce((s, m) => s + m.procent, 0) / Math.max(1, widok.mierniki.length));
  const uplynelo = Math.round((widok.dzien / widok.dniWMiesiacu) * 100);
  const r = 46;
  const obwod = 2 * Math.PI * r;
  const zostalo = widok.dniWMiesiacu - widok.dzien;
  const wPlanie = widok.mierniki.filter((m) => m.zaPlanem).length;
  return (
    <>
      <section className="mb-5 flex flex-wrap items-center gap-6 rounded-3xl bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/20">
        <span className="relative grid h-28 w-28 flex-shrink-0 place-items-center">
          <svg viewBox="0 0 110 110" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="55" cy="55" r={r} fill="none" strokeWidth="10" stroke="rgba(148,163,184,.3)" />
            <circle cx="55" cy="55" r={r} fill="none" strokeWidth="10" strokeLinecap="round" stroke="#34d399" strokeDasharray={obwod} strokeDashoffset={obwod * (1 - sredni / 100)} />
          </svg>
          <b className="text-2xl font-bold tabular-nums">{sredni}%</b>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-300">Średnie wykonanie celów</p>
          <p className="text-2xl font-bold">
            {wPlanie} z {widok.mierniki.length} celów w planie
          </p>
          <p className="mt-1 text-sm text-slate-300">{zostalo > 0 ? `Do końca miesiąca ${plDni(zostalo)}.` : "Ostatni dzień miesiąca."} Miesiąc minął w {uplynelo}%.</p>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {widok.mierniki.map((m) => (
          <Karta key={m.klucz} m={m} />
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Pionowa kreska na pasku: tyle powinno być zrobione dziś przy równym tempie.</p>
    </>
  );
}
