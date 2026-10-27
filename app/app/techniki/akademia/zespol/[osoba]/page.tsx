import { notFound } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { postepZespolu } from "@/lib/data-akademia";
import { ludzieSzkolenia } from "@/lib/szkolenie-zakres";
import { EGZAMIN, MODULY_AKADEMII, stanAkademii, type Sprawdzian } from "@/lib/techniki/akademia";
import { PageHeader } from "../../../../components/page-header";
import { Wstecz } from "../../../../components/wstecz";

export const metadata = { title: "Szkolenie: szczegóły" };

const data = (iso: string | undefined) => (iso ? new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "");

/** Szczegóły jednej osoby: lekcje, każdy sprawdzian i pytania, na których potknęła się ostatnio. */
export default async function SzkolenieOsobyPage({ params }: { params: Promise<{ osoba: string }> }) {
  const user = await requireModul("szkolenie");
  const { osoba } = await params;
  const ludzie = await ludzieSzkolenia(user);
  const o = ludzie.find((l) => l.id === osoba);
  if (!o) notFound();
  const { wgOsoby, ostatnie } = await postepZespolu(user.agency_id!, [o.id]);
  const wpisy = wgOsoby.get(o.id) ?? [];
  const stan = stanAkademii(wpisy);
  const odpowiedzi = new Map((ostatnie.get(o.id) ?? []).map((x) => [x.item, x]));
  const wpis = (id: string) => wpisy.find((w) => w.item === id);

  const bledy = (s: Sprawdzian) => {
    const ost = odpowiedzi.get(s.id);
    if (!ost?.answers) return null;
    const zle = s.pytania.map((p, i) => ({ p, wybrana: ost.answers![i] })).filter((x) => x.wybrana !== x.p.poprawna);
    if (!zle.length) return <p className="mt-2 text-sm text-emerald-700">Ostatnie podejście bez błędów.</p>;
    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Błędy w ostatnim podejściu ({ost.score}/{s.pytania.length})</p>
        {zle.map(({ p, wybrana }) => (
          <div key={p.pytanie} className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="font-medium text-slate-900">{p.pytanie}</p>
            <p className="mt-1 text-rose-700">Odpowiedział: {p.odpowiedzi[wybrana] ?? "brak"}</p>
            <p className="text-emerald-700">Dobrze: {p.odpowiedzi[p.poprawna]}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Wstecz href="/app/techniki/akademia/zespol" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        ← Postępy zespołu
      </Wstecz>
      <PageHeader
        title={o.imie}
        subtitle={`${stan.lekcjiZrobionych}/${stan.lekcjiWszystkich} lekcji · ${stan.zaliczonych}/${stan.sprawdzianow} sprawdzianów · średni wynik ${stan.srednia !== null ? `${stan.srednia}%` : "–"}`}
      />
      <div className="space-y-4">
        {MODULY_AKADEMII.map((m, i) => {
          const sm = stan.moduly[i];
          const w = wpis(m.sprawdzian.id);
          return (
            <section key={m.nr} className={`rounded-2xl border bg-white p-5 shadow-sm ${sm.otwarty ? "border-slate-200" : "border-slate-200 opacity-60"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold text-slate-900">
                  Moduł {m.nr}: {m.nazwa}
                </h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sm.ukonczony ? "bg-emerald-100 text-emerald-800" : sm.otwarty ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>
                  {sm.ukonczony ? "ukończony" : sm.otwarty ? "w trakcie" : "zablokowany"}
                </span>
              </div>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {sm.lekcje.map((l) => (
                  <li key={l.id} className="flex items-center gap-2 text-sm">
                    <span className={l.zrobiona ? "text-emerald-600" : "text-slate-300"}>{l.zrobiona ? "✓" : "○"}</span>
                    <span className={l.zrobiona ? "text-slate-800" : "text-slate-500"}>{l.tytul}</span>
                    {l.zrobiona && <span className="text-xs text-slate-400">{data(wpis(l.id)?.updated)}</span>}
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">
                  Sprawdzian: {w ? `najlepszy ${w.best}/${m.sprawdzian.pytania.length}, podejść ${w.attempts}` : "jeszcze nie podchodził"}
                  {w?.passed && <span className="ml-2 text-emerald-700">zaliczony</span>}
                </p>
                {bledy(m.sprawdzian)}
              </div>
            </section>
          );
        })}
        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <h2 className="font-semibold text-slate-900">Egzamin końcowy</h2>
          <p className="mt-1 text-sm text-slate-700">
            {wpis(EGZAMIN.id) ? `Najlepszy ${wpis(EGZAMIN.id)!.best}/${EGZAMIN.pytania.length}, podejść ${wpis(EGZAMIN.id)!.attempts}${wpis(EGZAMIN.id)!.passed ? ", zaliczony" : ""}` : "Jeszcze nie podchodził."}
          </p>
          {bledy(EGZAMIN)}
        </section>
      </div>
    </>
  );
}
