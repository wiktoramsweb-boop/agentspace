import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { mapaProgramu } from "@/lib/data-osiagniecia";
import { PageHeader } from "../components/page-header";
import { IkonaObszaru, Medal } from "./medal";

export const metadata = { title: "Osiągnięcia" };

export default async function OsiagnieciaPage() {
  const user = await requireUser();
  const mapa = await mapaProgramu(user);
  const kolejna = mapa.rangi[mapa.poziom + 1];

  return (
    <>
      <PageHeader title="Osiągnięcia" subtitle="Mapa programu: zadania za punkty, które pokazują, co jeszcze AgentSpace potrafi." />

      <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
          <div className="flex flex-wrap items-center gap-5">
            <Medal poziom={mapa.poziom} rozmiar={92}>
              {mapa.poziom + 1}
            </Medal>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Twoja ranga</p>
              <p className="text-3xl font-bold text-slate-900">{mapa.ranga}</p>
              <p className="mt-1 text-sm text-slate-500">
                {kolejna ? `Do rangi „${kolejna.nazwa}” brakuje ${kolejna.od - mapa.procent}% programu.` : "Najwyższa ranga. Znasz cały program."}
              </p>
            </div>
            <p className="text-right">
              <b className="block text-3xl font-bold tabular-nums text-slate-900">{mapa.punkty}</b>
              <span className="text-sm text-slate-500">z {mapa.maksimum} pkt</span>
            </p>
          </div>
          <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-violet-500" style={{ width: `${Math.max(3, mapa.procent)}%` }} />
          </div>
          <ol className="mt-5 grid grid-cols-5 gap-2">
            {mapa.rangi.map((r, i) => (
              <li key={r.nazwa} className="flex flex-col items-center gap-1.5 text-center">
                <Medal poziom={i} zdobyty={i <= mapa.poziom} rozmiar={44}>
                  {i <= mapa.poziom ? i + 1 : ""}
                </Medal>
                <span className={`text-[11px] leading-tight ${i === mapa.poziom ? "font-bold text-slate-900" : "text-slate-500"}`}>{r.nazwa}</span>
              </li>
            ))}
          </ol>
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
              <div className="mb-3 flex items-start gap-3">
                <IkonaObszaru id={o.id} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-slate-900">{o.nazwa}</h2>
                  <p className="text-sm text-slate-500">{o.opis}</p>
                </div>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold tabular-nums text-slate-600">
                  {o.zrobione}/{o.zadania.length}
                </span>
              </div>
              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
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
                      <Medal poziom={z.pkt >= 40 ? 2 : z.pkt >= 20 ? 1 : 0} zdobyty={z.zrobione} rozmiar={34}>
                        {z.zrobione ? "✓" : ""}
                      </Medal>
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
