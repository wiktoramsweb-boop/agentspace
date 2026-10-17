import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { mapaProgramu } from "@/lib/data-osiagniecia";
import { PageHeader } from "../components/page-header";

export const metadata = { title: "Osiągnięcia" };

export default async function OsiagnieciaPage() {
  const user = await requireUser();
  const mapa = await mapaProgramu(user);
  const r = 54;
  const obwod = 2 * Math.PI * r;

  return (
    <>
      <PageHeader title="Osiągnięcia" subtitle="Mapa programu: zadania za punkty, które pokazują, co jeszcze AgentSpace potrafi." />

      <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="flex items-center gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
          <span className="relative grid h-32 w-32 flex-shrink-0 place-items-center">
            <svg viewBox="0 0 128 128" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx="64" cy="64" r={r} fill="none" strokeWidth="10" className="stroke-slate-100" />
              <circle cx="64" cy="64" r={r} fill="none" strokeWidth="10" strokeLinecap="round" stroke="url(#osi-grad)" strokeDasharray={obwod} strokeDashoffset={obwod * (1 - mapa.procent / 100)} />
              <defs>
                <linearGradient id="osi-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#10b981" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <span className="relative text-center">
              <b className="block text-3xl font-bold tabular-nums text-slate-900">{mapa.procent}%</b>
              <span className="text-xs text-slate-500">programu</span>
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-600">{mapa.ranga}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {mapa.punkty} <span className="text-base font-medium text-slate-400">/ {mapa.maksimum} pkt</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">Punkty liczą się same z tego, co robisz w programie. Nic nie trzeba odhaczać ręcznie.</p>
          </div>
        </div>

        {mapa.nastepne ? (
          <Link
            href={mapa.nastepne.href}
            className="group flex flex-col justify-between gap-4 rounded-3xl bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Następne do zdobycia</p>
              <p className="mt-2 text-2xl font-semibold">{mapa.nastepne.tytul}</p>
              <p className="mt-1 text-sm text-slate-300">{mapa.nastepne.opis}</p>
            </div>
            <span className="inline-flex items-center gap-2 self-start rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-900">
              Zrób to, +{mapa.nastepne.pkt} pkt
              <span className="transition group-hover:translate-x-1">→</span>
            </span>
          </Link>
        ) : (
          <div className="flex flex-col justify-center rounded-3xl bg-slate-900 p-6 text-white">
            <p className="text-2xl font-semibold">Cała mapa odkryta.</p>
            <p className="mt-1 text-sm text-slate-300">Znasz program lepiej niż większość biur. Teraz już tylko wyniki.</p>
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mapa.obszary.map((o) => {
          const pct = Math.round((o.zrobione / o.zadania.length) * 100);
          return (
            <section key={o.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{o.nazwa}</h2>
                  <p className="text-sm text-slate-500">{o.opis}</p>
                </div>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold tabular-nums text-slate-600">
                  {o.zrobione}/{o.zadania.length}
                </span>
              </div>
              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${pct}%` }} />
              </div>
              <ul className="space-y-2">
                {o.zadania.map((z) => (
                  <li key={z.id}>
                    <Link
                      href={z.href}
                      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                        z.zrobione ? "border-emerald-100 bg-emerald-50/60" : "border-slate-200 hover:border-emerald-300"
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-xs font-bold ${
                          z.zrobione ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                        aria-hidden="true"
                      >
                        {z.zrobione ? "✓" : `+${z.pkt}`}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-semibold ${z.zrobione ? "text-slate-600" : "text-slate-900"}`}>{z.tytul}</span>
                        <span className="block text-xs text-slate-500">
                          {z.opis}
                          {!z.zrobione && z.postep.cel > 1 && ` (${z.postep.teraz}/${z.postep.cel})`}
                        </span>
                      </span>
                      {z.zrobione ? (
                        <span className="flex-shrink-0 text-xs font-semibold text-emerald-700">+{z.pkt} pkt</span>
                      ) : (
                        <span className="flex-shrink-0 text-xs font-semibold text-slate-400">Zrób →</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
