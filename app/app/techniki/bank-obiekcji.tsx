"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GRUPY_OBIEKCJI, STYLE, type GrupaObiekcji, type Obiekcja, type Styl } from "@/lib/techniki/obiekcje";

const bezOgonkow = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

/**
 * Bank obiekcji: klikasz zdanie, które słyszysz od klienta, i wybierasz styl
 * odpowiedzi. Łagodnie, pewnie albo pytaniem, bo ten sam klient raz potrzebuje
 * spokoju, a raz konkretu.
 */
export function BankObiekcji({ lista, nazwyTechnik }: { lista: Obiekcja[]; nazwyTechnik: Record<string, string> }) {
  const [grupa, setGrupa] = useState<GrupaObiekcji | null>(null);
  const [q, setQ] = useState("");
  const [otwarta, setOtwarta] = useState<string | null>(null);
  const [styl, setStyl] = useState<Record<string, Styl>>({});

  const widoczne = useMemo(
    () => lista.filter((o) => (!grupa || o.grupa === grupa) && (!q.trim() || bezOgonkow(`${o.obiekcja} ${o.coZnaczy}`).includes(bezOgonkow(q.trim())))),
    [lista, grupa, q],
  );

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Wpisz, co usłyszałeś, np. prowizja, mailem, pomyśleć"
        className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {[null, ...(Object.keys(GRUPY_OBIEKCJI) as GrupaObiekcji[])].map((g) => (
          <button
            key={g ?? "all"}
            type="button"
            onClick={() => setGrupa(g)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${grupa === g ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
          >
            {g ? GRUPY_OBIEKCJI[g] : "Wszystkie"}
            <span className="ml-1.5 tabular-nums opacity-60">{g ? lista.filter((o) => o.grupa === g).length : lista.length}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {widoczne.map((o) => {
          const otw = otwarta === o.id;
          const s = styl[o.id] ?? "pewnie";
          const odp = o.odpowiedzi.find((x) => x.styl === s) ?? o.odpowiedzi[0];
          return (
            <div key={o.id} className={`rounded-2xl border bg-white shadow-sm transition ${otw ? "border-emerald-300" : "border-slate-200 hover:border-slate-300"}`}>
              <button type="button" onClick={() => setOtwarta(otw ? null : o.id)} aria-expanded={otw} className="flex w-full items-start justify-between gap-3 p-5 text-left">
                <span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{GRUPY_OBIEKCJI[o.grupa]}</span>
                  <span className="mt-1 block font-semibold text-rose-700">„{o.obiekcja}”</span>
                </span>
                <span className={`mt-1 text-slate-400 transition ${otw ? "rotate-180" : ""}`} aria-hidden="true">
                  ▾
                </span>
              </button>
              {otw && (
                <div className="rozmowa-krok space-y-3 border-t border-slate-100 px-5 pb-5 pt-4">
                  <p className="text-sm text-slate-600">
                    <b className="font-semibold text-slate-800">Co zwykle znaczy:</b> {o.coZnaczy}
                  </p>
                  <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Styl odpowiedzi">
                    {o.odpowiedzi.map((x) => (
                      <button
                        key={x.styl}
                        type="button"
                        onClick={() => setStyl((st) => ({ ...st, [o.id]: x.styl }))}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${s === x.styl ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        {STYLE[x.styl]}
                      </button>
                    ))}
                  </div>
                  <p key={s} className="rozmowa-krok rounded-2xl rounded-tr-sm bg-slate-900 px-4 py-3 text-sm leading-relaxed text-white">
                    {odp.tekst}
                  </p>
                  <Link href={`/app/techniki/${o.technika}`} className="inline-block text-xs font-semibold text-emerald-700 hover:underline">
                    Technika: {nazwyTechnik[o.technika] ?? o.technika} →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {widoczne.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Nic nie pasuje. Spróbuj innego słowa.</p>}
    </div>
  );
}
