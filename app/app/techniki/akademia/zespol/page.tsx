import Link from "next/link";
import { requireModul } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/role";
import { postepZespolu } from "@/lib/data-akademia";
import { ludzieSzkolenia } from "@/lib/szkolenie-zakres";
import { nazwaAkademii, stanAkademii } from "@/lib/techniki/akademia";
import { PageHeader } from "../../../components/page-header";
import { Avatar } from "../../../components/avatar";
import { Wstecz } from "../../../components/wstecz";

export const metadata = { title: "Postępy zespołu w szkoleniu" };

const KOLOR_MODULU = { zielony: "#10b981", turkus: "#06b6d4", fiolet: "#8b5cf6", zloto: "#f59e0b" } as const;

function kiedy(iso: string | null): string {
  if (!iso) return "jeszcze nie zaczął";
  const dni = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return dni === 0 ? "dziś" : dni === 1 ? "wczoraj" : `${dni} dni temu`;
}

/**
 * Widok CEO: kto na jakim etapie Akademii, jakie wyniki sprawdzianów i kiedy
 * ostatnio się uczył. Dostęp daje moduł „Szkolenie zespołu”.
 */
export default async function PostepyZespoluPage() {
  const user = await requireModul("szkolenie");
  const ludzie = await ludzieSzkolenia(user);
  const nazwa = nazwaAkademii(user.agency_id).krotka;
  const { ready, wgOsoby } = await postepZespolu(user.agency_id!, ludzie.map((l) => l.id));

  const wiersze = ludzie.map((l) => {
    const wpisy = wgOsoby.get(l.id) ?? [];
    const stan = stanAkademii(wpisy);
    const ostatnio = wpisy.map((w) => w.updated).sort().at(-1) ?? null;
    const aktualnyModul = stan.moduly.find((m) => m.otwarty && !m.ukonczony);
    return { l, stan, ostatnio, aktualnyModul };
  });
  const zaczelo = wiersze.filter((w) => w.ostatnio).length;
  const ukonczylo = wiersze.filter((w) => w.stan.ukonczona).length;
  const stoja = wiersze.filter((w) => w.ostatnio && !w.stan.ukonczona && Date.now() - new Date(w.ostatnio).getTime() > 7 * 86_400_000).length;

  return (
    <>
      <Wstecz href="/app/techniki?widok=akademia" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        ← {nazwa}
      </Wstecz>
      <PageHeader title={`Postępy zespołu: ${nazwa}`} subtitle="Kto na jakim etapie, wyniki sprawdzianów i kiedy ostatnio się uczył. Kliknij osobę, żeby zobaczyć szczegóły." />

      {!ready ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Akademia wymaga migracji <code>lib/SETUP-v56-akademia.sql</code> w Supabase.
        </p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { l: ludzie.length, o: "osób w zespole" },
              { l: zaczelo, o: "zaczęło naukę" },
              { l: ukonczylo, o: `ukończyło: ${nazwa}` },
              { l: stoja, o: "bez postępu od tygodnia", uwaga: stoja > 0 },
            ].map((x) => (
              <div key={x.o} className={`rounded-2xl border p-4 ${x.uwaga ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
                <p className={`text-3xl font-bold tabular-nums ${x.uwaga ? "text-amber-800" : "text-slate-900"}`}>{x.l}</p>
                <p className="text-sm text-slate-500">{x.o}</p>
              </div>
            ))}
          </div>

          {wiersze.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Nie masz jeszcze nikogo w swoim zespole.</p>
          ) : (
            <div className="space-y-2">
              {wiersze.map(({ l, stan, ostatnio, aktualnyModul }) => (
                <Link key={l.id} href={`/app/techniki/akademia/zespol/${l.id}`} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                  <div className="flex min-w-[200px] flex-1 items-center gap-3">
                    <Avatar name={l.imie} path={l.avatar} size={40} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{l.imie}</p>
                      <p className="text-xs text-slate-500">
                        {ROLE_LABELS[l.rola as keyof typeof ROLE_LABELS] ?? l.rola} · {kiedy(ostatnio)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5" aria-label="Moduły Akademii">
                    {stan.moduly.map((m) => (
                      <span
                        key={m.nr}
                        title={`Moduł ${m.nr}: ${m.nazwa}${m.sprawdzian.najlepszy !== null ? `, sprawdzian ${m.sprawdzian.najlepszy}/${m.sprawdzian.ile}` : ""}`}
                        className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold"
                        style={m.ukonczony ? { background: KOLOR_MODULU[m.kolor], color: "#fff" } : m.otwarty ? { boxShadow: `inset 0 0 0 2px ${KOLOR_MODULU[m.kolor]}`, color: KOLOR_MODULU[m.kolor] } : { background: "rgba(148,163,184,0.18)", color: "#94a3b8" }}
                      >
                        {m.ukonczony ? "✓" : m.nr}
                      </span>
                    ))}
                    <span
                      title="Egzamin końcowy"
                      className="ml-1 grid h-8 w-8 place-items-center rounded-lg text-sm"
                      style={stan.ukonczona ? { background: "#f59e0b", color: "#fff" } : { background: "rgba(148,163,184,0.18)", color: "#94a3b8" }}
                    >
                      ★
                    </span>
                  </div>
                  <div className="w-full text-sm sm:w-48 sm:text-right">
                    <p className="font-semibold text-slate-900">{stan.ukonczona ? `${nazwa}: ukończona` : aktualnyModul ? `Moduł ${aktualnyModul.nr}: ${aktualnyModul.nazwa}` : "Egzamin końcowy"}</p>
                    <p className="text-xs text-slate-500">
                      {stan.lekcjiZrobionych}/{stan.lekcjiWszystkich} lekcji · średnio {stan.srednia !== null ? `${stan.srednia}%` : "–"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
