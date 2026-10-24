import { Wstecz } from "@/app/app/components/wstecz";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { getScenarios } from "@/lib/data";
import { KATEGORIE, TECHNIKI, technika } from "@/lib/techniki/techniki";
import { SKRYPTY } from "@/lib/techniki/skrypty";
import { KOLOR, POZIOM, Rozmowa, Sila } from "../wspolne";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const t = technika((await params).slug);
  return { title: t ? t.nazwa : "Technika" };
}

function Lista({ tytul, punkty, styl }: { tytul: string; punkty: string[]; styl: "plus" | "minus" | "uwaga" }) {
  if (!punkty.length) return null;
  const ikona = { plus: "text-emerald-500", minus: "text-rose-500", uwaga: "text-amber-500" }[styl];
  const znak = { plus: "✓", minus: "✕", uwaga: "!" }[styl];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{tytul}</h3>
      <ul className="space-y-2">
        {punkty.map((p) => (
          <li key={p} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
            <span className={`mt-0.5 font-bold ${ikona}`}>{znak}</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function TechnikaPage({ params }: Props) {
  await requireModul("coach");
  const t = technika((await params).slug);
  if (!t) notFound();

  const scenariusze = (await getScenarios()).filter((s) => t.scenariusze.includes(s.slug));
  const powiazane = TECHNIKI.filter((x) => t.powiazane.includes(x.slug));
  const kontra = TECHNIKI.filter((x) => t.kontra.includes(x.slug));
  const wSkryptach = SKRYPTY.filter((s) => s.techniki.includes(t.slug) || s.obiekcje.some((o) => o.technika === t.slug));
  const k = KOLOR[t.kategoria];

  return (
    <>
      <Wstecz href={`/app/techniki?k=${t.kategoria}`} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        ← {KATEGORIE[t.kategoria].nazwa}
      </Wstecz>

      <header className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${k.tlo} ${k.tekst}`}>{KATEGORIE[t.kategoria].nazwa}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{POZIOM[t.poziom]}</span>
            <span className="text-xs text-slate-400">źródło: {t.zrodlo}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{t.nazwa}</h1>
          <p className="mt-3 text-lg leading-relaxed text-slate-700">{t.skrot}</p>
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
            Skuteczność <Sila wartosc={t.sila} />
          </div>
          {t.etyka === "ostroznie" && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <b>Używaj uczciwie.</b> Ta technika działa tylko na prawdziwych faktach. Zmyślone liczby, terminy albo „inni kupujący” niszczą zaufanie i mogą być nieuczciwą praktyką rynkową.
            </p>
          )}
        </div>

        <aside className="rounded-3xl bg-slate-900 p-5 text-white shadow-lg shadow-slate-900/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Trenuj od razu</p>
          <p className="mt-1 text-sm text-slate-300">Wybierz rozmowę. Kroki tej techniki będą widoczne przez cały trening.</p>
          <div className="mt-4 space-y-2">
            {scenariusze.length ? (
              scenariusze.map((s) => (
                <Link
                  key={s.slug}
                  href={`/app/trening/${s.slug}?technika=${t.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3.5 py-2.5 text-sm font-medium transition hover:bg-emerald-400 hover:text-slate-900"
                >
                  <span className="min-w-0">{s.title}</span>
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </Link>
              ))
            ) : (
              <Link href="/app/trening" className="block rounded-xl bg-white/10 px-3.5 py-2.5 text-sm font-medium hover:bg-white/20">
                Wszystkie scenariusze →
              </Link>
            )}
          </div>
        </aside>
      </header>

      <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Jak to działa</h2>
        <p className="leading-relaxed text-slate-700">{t.jakDziala}</p>
      </section>

      <section className="mb-8 grid gap-3 md:grid-cols-2">
        <Lista tytul="Kiedy używać" punkty={t.kiedy} styl="plus" />
        <Lista tytul="Kiedy nie używać" punkty={t.kiedyNie} styl="minus" />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Krok po kroku</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.kroki.map((krok, i) => (
            <li key={krok} className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-sm font-bold text-white">{i + 1}</span>
              <p className="text-sm leading-relaxed text-slate-700">{krok}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Przykłady z rynku</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {t.przyklady.map((p) => (
            <div key={p.sytuacja} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{p.sytuacja}</p>
              <Rozmowa wypowiedzi={p.rozmowa} />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-3 md:grid-cols-2">
        <Lista tytul="Najczęstsze błędy" punkty={t.bledy} styl="minus" />
        {t.sygnaly.length > 0 || kontra.length > 0 ? (
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
            <h3 className="mb-3 text-sm font-semibold text-violet-900">Gdy ktoś używa tego na Tobie</h3>
            <ul className="space-y-2 text-sm leading-relaxed text-violet-900">
              {t.sygnaly.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            {kontra.length > 0 && (
              <p className="mt-3 text-sm text-violet-800">
                Odpowiedź:{" "}
                {kontra.map((x, i) => (
                  <span key={x.slug}>
                    {i > 0 && ", "}
                    <Link href={`/app/techniki/${x.slug}`} className="font-semibold underline-offset-2 hover:underline">
                      {x.nazwa}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="mb-2 text-sm font-semibold text-emerald-900">Ćwiczenie na ten tydzień</h3>
            <p className="text-sm leading-relaxed text-emerald-900">{t.cwiczenie}</p>
          </div>
        )}
      </section>

      {(t.sygnaly.length > 0 || kontra.length > 0) && (
        <section className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="mb-2 text-sm font-semibold text-emerald-900">Ćwiczenie na ten tydzień</h3>
          <p className="text-sm leading-relaxed text-emerald-900">{t.cwiczenie}</p>
        </section>
      )}

      {wSkryptach.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Ta technika w skryptach</h2>
          <div className="flex flex-wrap gap-2">
            {wSkryptach.map((s) => (
              <Link key={s.slug} href={`/app/techniki/skrypty/${s.slug}`} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-emerald-300 hover:text-emerald-700">
                {s.nazwa} →
              </Link>
            ))}
          </div>
        </section>
      )}

      {powiazane.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Łącz z</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {powiazane.map((x) => (
              <Link key={x.slug} href={`/app/techniki/${x.slug}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                <span className={`text-xs font-semibold ${KOLOR[x.kategoria].tekst}`}>{KATEGORIE[x.kategoria].nazwa}</span>
                <p className="mt-1 font-semibold text-slate-900">{x.nazwa}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{x.skrot}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
