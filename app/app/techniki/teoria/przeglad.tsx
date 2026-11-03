import Link from "next/link";
import { postepTeorii } from "@/lib/data-teoria";
import { MODULY_TEORII, TESTY, WSZYSTKIE_ROZDZIALY_TEORII, itemTestu, type ModulTeorii } from "@/lib/techniki/teoria";

export const KOLOR_MODULU: Record<ModulTeorii["kolor"], { pelny: string; obrys: string; tlo: string; tekst: string }> = {
  zielony: { pelny: "#10b981", obrys: "#059669", tlo: "bg-emerald-50", tekst: "text-emerald-700" },
  turkus: { pelny: "#06b6d4", obrys: "#0891b2", tlo: "bg-cyan-50", tekst: "text-cyan-700" },
  fiolet: { pelny: "#8b5cf6", obrys: "#7c3aed", tlo: "bg-violet-50", tekst: "text-violet-700" },
};

const RZYMSKIE = ["I", "II", "III"];

/** Zakładka „Teoria” w Bibliotece technik: nauka przed egzaminem po szkoleniu. */
export async function PrzegladTeorii({ user }: { user: { id: string; agency_id: string | null } }) {
  const postep = await postepTeorii(user.agency_id, user.id);
  if (!postep.ready) {
    return (
      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Teoria wymaga migracji <code>lib/SETUP-v56-akademia.sql</code> w Supabase.
      </p>
    );
  }
  const przeczytanych = WSZYSTKIE_ROZDZIALY_TEORII.filter((r) => postep.przeczytane.has(r.id)).length;
  const egzamin = postep.testy[itemTestu("egzamin")];
  const zaliczoneModuly = MODULY_TEORII.filter((m) => postep.testy[itemTestu(m.id)]?.zaliczony).length;
  const procent = Math.round((przeczytanych / WSZYSTKIE_ROZDZIALY_TEORII.length) * 100);

  return (
    <>
      <section className="mb-8 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-[28px] bg-slate-900 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Teoria dla agenta · Spectra</p>
          <p className="mt-2 max-w-md text-lg font-semibold leading-snug">
            Prawo nieruchomości ze szkolenia w trzech modułach. Czytasz rozdział, sprawdzasz się testem, a na koniec robisz egzamin próbny.
          </p>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${procent}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-300">
            {przeczytanych}/{WSZYSTKIE_ROZDZIALY_TEORII.length} rozdziałów · {zaliczoneModuly}/3 testy modułów zaliczone
          </p>
        </div>
        <div className="grid gap-3">
          <Link href="/app/techniki/teoria/test?zakres=egzamin" className="group flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md">
            <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4h6M10 2v2M14 2v2" /><rect x="5" y="4" width="14" height="18" rx="2" /><path d="M9 11l2 2 4-4M9 17h6" /></svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-900">Egzamin próbny</span>
              <span className="block text-sm text-slate-500">
                {TESTY.egzamin.ile} pytań ze wszystkich modułów, {TESTY.egzamin.minut} minut, zaliczenie od {TESTY.egzamin.prog}
              </span>
            </span>
            <span className="text-right">
              <span className="block text-xl font-bold tabular-nums text-slate-900">{egzamin ? `${egzamin.najlepszy}/${egzamin.max}` : "–"}</span>
              <span className="text-xs text-slate-500">{egzamin ? `najlepszy · ${egzamin.podejscia}×` : "jeszcze nie"}</span>
            </span>
          </Link>
          {postep.bledy.length > 0 ? (
            <Link href="/app/techniki/teoria/test?zakres=bledy" className="flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md">
              <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900">Powtórka błędów</span>
                <span className="block text-sm text-slate-500">Pytania, na które ostatnio padła zła odpowiedź. Znikają, gdy odpowiesz dobrze.</span>
              </span>
              <span className="text-xl font-bold tabular-nums text-rose-600">{postep.bledy.length}</span>
            </Link>
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-300 p-5 text-sm text-slate-500">
              Tu pojawią się pytania, w których się pomylisz, żeby powtórzyć je osobno.
            </div>
          )}
        </div>
      </section>

      <div className="space-y-5">
        {MODULY_TEORII.map((m) => {
          const k = KOLOR_MODULU[m.kolor];
          const test = postep.testy[itemTestu(m.id)];
          const minut = m.rozdzialy.reduce((s, r) => s + r.minut, 0);
          return (
            <section key={m.id} className="sn-karta overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start gap-4 p-5 sm:p-6">
                <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl text-lg font-bold text-white" style={{ background: k.pelny }}>
                  {RZYMSKIE[m.nr - 1]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold uppercase tracking-[0.14em] ${k.tekst}`}>Moduł {RZYMSKIE[m.nr - 1]} · {minut} min czytania</p>
                  <h2 className="mt-1 text-lg font-bold leading-snug text-slate-900">{m.nazwa}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{m.opis}</p>
                </div>
              </div>
              <ol className="border-t border-slate-100">
                {m.rozdzialy.map((r, i) => {
                  const czyt = postep.przeczytane.has(r.id);
                  return (
                    <li key={r.id} className="border-b border-slate-100 last:border-b-0">
                      <Link href={`/app/techniki/teoria/${r.id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 sm:px-6">
                        <span className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-xs font-bold ${czyt ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>{czyt ? "✓" : i + 1}</span>
                        <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">{r.tytul}</span>
                        <span className="text-xs tabular-nums text-slate-400">{r.minut} min</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
                <span className="min-w-0 flex-1 text-sm text-slate-600">
                  {test ? (
                    <>
                      Najlepszy wynik <b className="tabular-nums text-slate-900">{test.najlepszy}/{test.max}</b>
                      {test.zaliczony ? <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">zaliczony</span> : null}
                    </>
                  ) : (
                    `Test: ${TESTY[m.id].ile} pytań, zaliczenie od ${TESTY[m.id].prog}`
                  )}
                </span>
                <Link href={`/app/techniki/teoria/test?zakres=${m.id}`} className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition active:translate-y-0.5" style={{ background: k.pelny, boxShadow: `0 4px 0 ${k.obrys}` }}>
                  {test ? "Sprawdź się jeszcze raz" : "Sprawdź się"}
                </Link>
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-slate-400">
        Testy są dla Ciebie: możesz je robić ile razy chcesz, za każdym razem z innymi pytaniami. Treść odpowiada przepisom z 2026 roku. Przy konkretnej transakcji zawsze potwierdź szczegóły z notariuszem.
      </p>
    </>
  );
}
