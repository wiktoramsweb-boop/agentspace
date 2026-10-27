"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { nowaSprawaDoradcy } from "./actions";
import { RODZAJE_KREDYTU } from "@/lib/kredyt-etapy";

/** Nowa sprawa z klientem spoza poleceń (np. doradca przyprowadził własnego klienta). */
export function NowaSprawa({ doradcy, jestemDoradca }: { doradcy: { id: string; name: string }[]; jestemDoradca: boolean }) {
  const router = useRouter();
  const [otwarte, setOtwarte] = useState(false);
  const [f, setF] = useState({ imie: "", telefon: "", email: "", rodzaj: "hipoteczny", kwota: "", notatka: "", advisorId: doradcy[0]?.id ?? "" });
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const pole = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";
  const ustaw = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  if (!jestemDoradca && doradcy.length === 0) return null;

  if (!otwarte)
    return (
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setOtwarte(true)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">
          + Nowa sprawa kredytowa
        </button>
        <span className="text-sm text-slate-500">Klienta biura przekażesz najszybciej z jego karty: przycisk „Przekaż doradcy kredytowemu”.</span>
      </div>
    );

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold text-slate-900">Nowa sprawa kredytowa</p>
        <button type="button" onClick={() => setOtwarte(false)} className="text-sm text-slate-500 hover:text-slate-900">
          Anuluj
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <input value={f.imie} onChange={ustaw("imie")} placeholder="Imię i nazwisko klienta" className={pole} />
        <input value={f.telefon} onChange={ustaw("telefon")} placeholder="Telefon" inputMode="tel" className={pole} />
        <input value={f.email} onChange={ustaw("email")} placeholder="E-mail" inputMode="email" className={pole} />
        <select value={f.rodzaj} onChange={ustaw("rodzaj")} className={pole}>
          {RODZAJE_KREDYTU.map((r) => (
            <option key={r.id} value={r.id}>
              Kredyt: {r.nazwa.toLowerCase()}
            </option>
          ))}
        </select>
        <input value={f.kwota} onChange={ustaw("kwota")} placeholder="Kwota kredytu (zł)" inputMode="numeric" className={pole} />
        {!jestemDoradca && (
          <select value={f.advisorId} onChange={ustaw("advisorId")} className={pole}>
            {doradcy.map((d) => (
              <option key={d.id} value={d.id}>
                Doradca: {d.name}
              </option>
            ))}
          </select>
        )}
        <textarea value={f.notatka} onChange={ustaw("notatka")} rows={2} placeholder="Notatka, np. szuka 3 pokoi, wkład 20%, umowa o pracę" className={`${pole} sm:col-span-3`} />
      </div>
      {blad && <p className="mt-2 text-sm text-rose-600">{blad}</p>}
      <button
        type="button"
        disabled={pending || f.imie.trim().length < 2}
        onClick={() =>
          start(async () => {
            setBlad(null);
            const w = await nowaSprawaDoradcy(f);
            if (!w.ok) return setBlad(w.error);
            router.push(`/app/kredyty/${w.id}`);
          })
        }
        className="mt-3 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Zapisuję…" : "Załóż sprawę"}
      </button>
    </div>
  );
}
