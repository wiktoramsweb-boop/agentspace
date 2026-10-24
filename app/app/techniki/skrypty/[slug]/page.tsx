import { Wstecz } from "@/app/app/components/wstecz";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { getScenarios } from "@/lib/data";
import { TECHNIKI } from "@/lib/techniki/techniki";
import { skrypt } from "@/lib/techniki/skrypty";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const s = skrypt((await params).slug);
  return { title: s ? s.nazwa : "Skrypt rozmowy" };
}

export default async function SkryptPage({ params }: Props) {
  await requireModul("coach");
  const s = skrypt((await params).slug);
  if (!s) notFound();

  const scenariusze = (await getScenarios()).filter((x) => s.scenariusze.includes(x.slug));
  const nazwa = (slug: string) => TECHNIKI.find((t) => t.slug === slug)?.nazwa ?? slug;
  const glowna = s.techniki[0];

  return (
    <>
      <Wstecz href="/app/techniki?widok=skrypty" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        ← Skrypty rozmów
      </Wstecz>

      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className={`rounded-full px-2.5 py-0.5 ${s.rodzaj === "telefon" ? "bg-cyan-50 text-cyan-700" : "bg-violet-50 text-violet-700"}`}>
            {s.rodzaj === "telefon" ? "Telefon" : "Spotkanie"}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">{s.czas}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{s.nazwa}</h1>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Do kogo</dt>
            <dd className="mt-1 text-sm text-slate-800">{s.dlaKogo}</dd>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Cel rozmowy</dt>
            <dd className="mt-1 text-sm font-medium text-emerald-900">{s.cel}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-slate-500">
          To nie tekst do czytania. Kwestie w cudzysłowie są punktem wyjścia: powiedz je własnymi słowami, a w nawiasach kwadratowych wstaw dane klienta.
        </p>
      </header>

      <ol className="relative mb-10 space-y-4 border-l-2 border-emerald-200 pl-6 md:pl-8">
        {s.etapy.map((e, i) => (
          <li key={e.nazwa} className="relative">
            <span className="absolute -left-[37px] top-4 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-xs font-bold text-white ring-4 ring-white md:-left-[45px]">
              {i + 1}
            </span>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{e.nazwa}</h2>
                <span className="text-xs tabular-nums text-slate-400">{e.czas}</span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{e.cel}</p>
              <div className="mt-4 space-y-2">
                {e.kwestie.map((k) =>
                  k.startsWith("(") ? (
                    <p key={k} className="text-sm italic text-slate-400">
                      {k}
                    </p>
                  ) : (
                    <p key={k} className="rounded-xl rounded-tl-sm bg-slate-900 px-4 py-2.5 text-sm leading-relaxed text-white">
                      {k}
                    </p>
                  ),
                )}
              </div>
              {e.pytania && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-700">Pytania do zadania</p>
                  <ul className="space-y-1.5">
                    {e.pytania.map((p) => (
                      <li key={p} className="flex gap-2 text-sm text-slate-700">
                        <span className="text-sky-500">?</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {e.uwaga && <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">{e.uwaga}</p>}
            </div>
          </li>
        ))}
      </ol>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Obiekcje i odpowiedzi</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {s.obiekcje.map((o) => (
            <div key={o.obiekcja} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-rose-700">„{o.obiekcja}”</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{o.odpowiedz}</p>
              <Link href={`/app/techniki/${o.technika}`} className="mt-3 inline-block text-xs font-semibold text-emerald-700 hover:underline">
                Technika: {nazwa(o.technika)} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-900">Techniki w tym skrypcie</h2>
          <div className="flex flex-wrap gap-2">
            {s.techniki.map((t) => (
              <Link key={t} href={`/app/techniki/${t}`} className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:border-emerald-300 hover:text-emerald-700">
                {nazwa(t)}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-slate-900 p-5 text-white">
          <h2 className="font-semibold">Przećwicz ten skrypt z klientem AI</h2>
          <p className="mt-1 text-sm text-slate-300">Klient AI zareaguje jak prawdziwy: przerwie, zada pytanie, rzuci obiekcję. Po rozmowie dostaniesz ocenę.</p>
          <div className="mt-4 space-y-2">
            {scenariusze.map((x) => (
              <Link
                key={x.slug}
                href={`/app/trening/${x.slug}?technika=${glowna}`}
                className="group flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3.5 py-2.5 text-sm font-medium transition hover:bg-emerald-400 hover:text-slate-900"
              >
                {x.title}
                <span className="transition group-hover:translate-x-0.5">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
