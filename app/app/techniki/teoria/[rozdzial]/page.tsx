import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { postepTeorii } from "@/lib/data-teoria";
import { WSZYSTKIE_ROZDZIALY_TEORII, maTeorie, rozdzialTeorii } from "@/lib/techniki/teoria";
import { Wstecz } from "../../../components/wstecz";
import { KOLOR_MODULU } from "../przeglad";
import { Przeczytane } from "./przeczytane";

type Props = { params: Promise<{ rozdzial: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: rozdzialTeorii((await params).rozdzial)?.tytul ?? "Teoria" };
}

export default async function RozdzialPage({ params }: Props) {
  const user = await requireModul("coach");
  if (!maTeorie(user.agency_id)) redirect("/app/techniki");
  const r = rozdzialTeorii((await params).rozdzial);
  if (!r) notFound();
  const postep = await postepTeorii(user.agency_id, user.id);
  const k = KOLOR_MODULU[r.modul.kolor];
  const nr = WSZYSTKIE_ROZDZIALY_TEORII.findIndex((x) => x.id === r.id);
  const nastepny = WSZYSTKIE_ROZDZIALY_TEORII[nr + 1];
  const ostatniWModule = r.modul.rozdzialy[r.modul.rozdzialy.length - 1].id === r.id;
  const wModule = r.modul.rozdzialy.findIndex((x) => x.id === r.id) + 1;

  return (
    <article className="mx-auto max-w-2xl">
      <Wstecz href="/app/techniki?widok=teoria" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        ← Teoria
      </Wstecz>
      <p className={`text-xs font-bold uppercase tracking-[0.14em] ${k.tekst}`}>
        Moduł {r.modul.nr} · rozdział {wModule}/{r.modul.rozdzialy.length} · {r.minut} min
      </p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900">{r.tytul}</h1>

      <div className="mt-6 space-y-5">
        {r.bloki.map((b, i) =>
          b.t === "p" ? (
            <p key={i} className="text-[16px] leading-relaxed text-slate-700">{b.tekst}</p>
          ) : b.t === "lista" ? (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
              {b.tytul && <p className="mb-3 text-sm font-bold text-slate-900">{b.tytul}</p>}
              <ul className="space-y-2.5">
                {b.pozycje.map((x) => (
                  <li key={x} className="flex gap-3 text-[15px] leading-relaxed text-slate-700">
                    <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: k.pelny }} />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div key={i} className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Zapamiętaj</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-amber-900">{b.tekst}</p>
            </div>
          ),
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
        <Przeczytane id={r.id} przeczytany={postep.przeczytane.has(r.id)} />
        <div className="flex flex-1 flex-wrap justify-end gap-2">
          {ostatniWModule && (
            <Link href={`/app/techniki/teoria/test?zakres=${r.modul.id}`} className="rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: k.pelny, boxShadow: `0 4px 0 ${k.obrys}` }}>
              Test z modułu {r.modul.nr}
            </Link>
          )}
          {nastepny && (
            <Link href={`/app/techniki/teoria/${nastepny.id}`} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400">
              {nastepny.tytul} →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
