"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { przekazDoradcy } from "../../kredyty/actions";
import { RODZAJE_KREDYTU } from "@/lib/kredyt-etapy";

/**
 * Karta „Kredyt” na karcie klienta: status sprawy u doradcy albo przekazanie
 * klienta doradcy jednym formularzem.
 */
export function KredytKlienta({
  clientId,
  sprawy,
  doradcy,
}: {
  clientId: string;
  sprawy: { id: string; etap: string; kolor: string; kwota: string; bank: string | null; doradca: string | null; dokumenty: string }[];
  doradcy: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [otwarte, setOtwarte] = useState(false);
  const [f, setF] = useState({ advisorId: doradcy[0]?.id ?? "", rodzaj: "hipoteczny", kwota: "", notatka: "" });
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const pole = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";
  const ustaw = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <div>
      {sprawy.map((s) => (
        <Link key={s.id} href={`/app/kredyty/${s.id}`} className="mb-2 block rounded-xl border border-slate-200 p-3 transition hover:border-slate-300">
          <div className="flex items-center justify-between gap-2">
            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${s.kolor}`}>{s.etap}</span>
            <span className="text-xs text-slate-400">dokumenty {s.dokumenty}</span>
          </div>
          <p className="mt-1.5 text-sm text-slate-700">
            {s.kwota}
            {s.bank ? ` · ${s.bank}` : ""}
            {s.doradca ? ` · prowadzi ${s.doradca}` : ""}
          </p>
        </Link>
      ))}

      {doradcy.length === 0 ? (
        sprawy.length === 0 && (
          <p className="text-sm text-slate-500">W biurze nie ma doradcy kredytowego. Zaproś go w Zespół → Zarządzanie z rolą „Doradca kredytowy”.</p>
        )
      ) : !otwarte ? (
        <button type="button" onClick={() => setOtwarte(true)} className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
          {sprawy.length ? "Przekaż kolejny kredyt" : "Przekaż doradcy kredytowemu"}
        </button>
      ) : (
        <div className="space-y-2 rounded-xl border border-slate-200 p-3">
          {doradcy.length > 1 && (
            <select value={f.advisorId} onChange={ustaw("advisorId")} className={pole}>
              {doradcy.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
          <div className="grid grid-cols-2 gap-2">
            <select value={f.rodzaj} onChange={ustaw("rodzaj")} className={pole}>
              {RODZAJE_KREDYTU.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nazwa}
                </option>
              ))}
            </select>
            <input value={f.kwota} onChange={ustaw("kwota")} inputMode="numeric" placeholder="Kwota (zł)" className={pole} />
          </div>
          <textarea value={f.notatka} onChange={ustaw("notatka")} rows={2} placeholder="Co doradca ma wiedzieć, np. wkład 20%, umowa o pracę, szuka do 600 tys." className={pole} />
          {blad && <p className="text-sm text-rose-600">{blad}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setBlad(null);
                  const w = await przekazDoradcy({ clientId, ...f });
                  if (!w.ok) return setBlad(w.error);
                  setOtwarte(false);
                  router.refresh();
                })
              }
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {pending ? "Przekazuję…" : `Przekaż${doradcy.length === 1 ? `: ${doradcy[0].name}` : ""}`}
            </button>
            <button type="button" onClick={() => setOtwarte(false)} className="rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
