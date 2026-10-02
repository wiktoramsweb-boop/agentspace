import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getPrzewodnik } from "@/lib/data-przewodnik";
import { PageHeader } from "../components/ui";

export const metadata = { title: "Jak zacząć" };

/**
 * Przewodnik dla nowego biura.
 *
 * Prowadzi od ustawień firmy do pierwszej oferty, krok po kroku, z informacją
 * po co to robić i gdzie kliknąć. Kroki odhaczają się same na podstawie stanu
 * bazy, więc lista nigdy się nie rozjeżdża z rzeczywistością.
 */
export default async function StartPage() {
  const user = await requireUser();
  const p = await getPrzewodnik(user);
  const pct = p.wszystkich ? Math.round((p.zrobione / p.wszystkich) * 100) : 100;

  return (
    <>
      <PageHeader
        title="Jak zacząć"
        subtitle="Kilka kroków, po których biuro jest gotowe do pracy. Odhaczają się same."
      />

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {p.zrobione} z {p.wszystkich} zrobione
          </span>
          <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">{pct}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="space-y-10">
        {p.sekcje.map((s) => (
          <section key={s.tytul}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{s.tytul}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.opis}</p>

            <ol className="mt-4 space-y-3">
              {s.kroki.map((k) => (
                <li
                  key={k.id}
                  className={`rounded-2xl border p-5 transition ${
                    k.zrobiony
                      ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            k.zrobiony
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {k.zrobiony ? "✓" : ""}
                        </span>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{k.tytul}</h3>
                        {k.wymagany && !k.zrobiony && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                            niezbędne
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{k.po_co}</p>
                      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Gdzie:</span>{" "}
                        {k.jak}
                      </p>
                    </div>

                    {!k.zrobiony && (
                      <Link
                        href={k.href}
                        className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                      >
                        {k.cta}
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {p.ukonczony && (
        <p className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          Wszystko, co niezbędne, jest już zrobione. Ten ekran zostaje pod ręką w menu, gdybyście
          chcieli domknąć resztę.
        </p>
      )}
    </>
  );
}
