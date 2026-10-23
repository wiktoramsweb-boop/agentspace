import Link from "next/link";
import { stanProby } from "@/lib/proba";
import { LicznikProby } from "../components/proba";
import { requireUser, requireModul } from "@/lib/auth";
import { getScenarios, getWeeklySessionCount } from "@/lib/data";
import { SCENARIO_CATEGORIES, type ScenarioCategory } from "@/lib/types";
import { PageHeader, EmptyState } from "../components/ui";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { maV49 } from "@/lib/schemat";
import { postepSciezki, rankingTreningu } from "@/lib/data-sciezka";
import { wynikSesji } from "@/lib/coach/sciezka";
import { TECHNIKI } from "@/lib/techniki/techniki";
import { kartaRozmowy } from "@/lib/karta-rozmowy";
import { SciezkaNauki } from "./sciezka-nauki";

type MojeZadanie = { id: string; scenario_id: string; difficulty: string; min_score: number | null; due_on: string | null; note: string | null; best_score: number | null; attempts: number };

/** Zadania od menedżera, które czekają na zaliczenie. Przed migracją v49 pusto. */
async function mojeZadania(userId: string): Promise<MojeZadanie[]> {
  if (!(await maV49())) return [];
  const { data } = await createSupabaseAdmin()
    .from("training_assignments")
    .select("id, scenario_id, difficulty, min_score, due_on, note, best_score, attempts")
    .eq("agent_id", userId)
    .eq("status", "do_zrobienia")
    .order("due_on", { ascending: true, nullsFirst: false })
    .limit(10);
  return (data ?? []) as MojeZadanie[];
}

/** Najlepszy wynik (0-100) i liczba rozmów agenta w każdym scenariuszu. */
async function rekordyAgenta(userId: string): Promise<Map<string, { najlepszy: number; ile: number }>> {
  const { data } = await createSupabaseAdmin()
    .from("training_sessions")
    .select("scenario_id, context, score:session_scores(overall)")
    .eq("agent_id", userId)
    .eq("status", "completed")
    .limit(1000);
  const mapa = new Map<string, { najlepszy: number; ile: number }>();
  for (const w of (data ?? []) as unknown as { scenario_id: string; context: { analiza?: { wynik?: number } } | null; score: { overall: number | null }[] | null }[]) {
    const wynik = wynikSesji(w.context?.analiza?.wynik, Array.isArray(w.score) ? w.score[0]?.overall : null);
    if (wynik === null) continue;
    const b = mapa.get(w.scenario_id) ?? { najlepszy: 0, ile: 0 };
    mapa.set(w.scenario_id, { najlepszy: Math.max(b.najlepszy, wynik), ile: b.ile + 1 });
  }
  return mapa;
}

// Kolory per kategoria - żeby karty się wyróżniały (pełne klasy dla Tailwind).
const CAT_STYLE: Record<string, { tile: string; bar: string; hover: string; trenuj: string }> = {
  cold_calling: {
    tile: "bg-cyan-100 text-cyan-700",
    bar: "bg-cyan-400",
    hover: "hover:border-cyan-500/50",
    trenuj: "text-cyan-700",
  },
  spotkanie: {
    tile: "bg-violet-100 text-violet-700",
    bar: "bg-violet-400",
    hover: "hover:border-violet-500/50",
    trenuj: "text-violet-700",
  },
  najem: {
    tile: "bg-amber-100 text-amber-700",
    bar: "bg-amber-400",
    hover: "hover:border-amber-500/50",
    trenuj: "text-amber-700",
  },
};

function CategoryIcon({ icon }: { icon: string }) {
  if (icon === "phone")
    return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>;
  if (icon === "handshake")
    return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>;
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>;
}

export default async function TreningPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string; widok?: string; k?: string }>;
}) {
  const user = await requireModul("coach");
  const { limit: limitParam, widok: widokParam, k: katParam } = await searchParams;
  const widok = widokParam === "rozmowy" || widokParam === "ranking" ? widokParam : "sciezka";
  const [scenarios, zadania, sciezka, ranking, rekordy] = await Promise.all([
    getScenarios(),
    mojeZadania(user.id),
    postepSciezki(user.id),
    user.agency_id ? rankingTreningu(user.agency_id) : Promise.resolve([]),
    rekordyAgenta(user.id),
  ]);
  const proba = await stanProby(user, "coach");
  const nazwyTechnik = Object.fromEntries(TECHNIKI.map((t) => [t.slug, t.nazwa]));
  const zlecajacy = ["owner", "director", "manager"].includes(user.role);

  // Tygodniowy limit rozmów AI (ustawiany przez CEO).
  const weeklyLimit = user.weekly_ai_limit;
  const usedThisWeek = weeklyLimit != null ? await getWeeklySessionCount(user.id) : 0;
  const remaining = weeklyLimit != null ? Math.max(0, weeklyLimit - usedThisWeek) : null;
  const limitReached = remaining === 0;

  if (scenarios.length === 0) {
    return (
      <>
        <PageHeader title="AI Coach" subtitle="Trenuj rozmowy z AI klientem." />
        <EmptyState
          title="Brak scenariuszy"
          body="Uruchom SETUP-v3 w Supabase, żeby wgrać scenariusze treningowe."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="AI Coach"
        subtitle="Rozmowy z klientem AI, który zachowuje się jak prawdziwy: przerywa, wątpi i potrafi się rozłączyć. Po każdej rozmowie dokładna analiza."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/app/techniki" className="rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Biblioteka technik
            </Link>
            {zlecajacy && (
              <Link href="/app/trening/zadania" className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-slate-400">
                Zadania dla zespołu
              </Link>
            )}
          </div>
        }
      />

      <LicznikProby stan={proba} rodzaj="coach" />

      {zadania.length > 0 && (
        <section className="mb-8 rounded-2xl border border-violet-200 bg-violet-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-violet-700">Od menedżera</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Twoje zadania treningowe</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {zadania.map((z) => {
              const sc = scenarios.find((x) => x.id === z.scenario_id);
              if (!sc) return null;
              return (
                <li key={z.id} className="flex flex-col rounded-xl border border-violet-200 bg-white p-4">
                  <p className="font-medium text-slate-900">{sc.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Zalicz na {z.min_score ?? 7}/10
                    {z.due_on ? ` · do ${z.due_on.split("-").reverse().join(".")}` : ""}
                    {z.attempts ? ` · podejścia: ${z.attempts}, najlepiej ${z.best_score ?? "-"}` : ""}
                  </p>
                  {z.note && <p className="mt-2 text-sm italic text-slate-600">„{z.note}”</p>}
                  <Link href={`/app/trening/${sc.slug}?zadanie=${z.id}`} className="mt-3 self-start rounded-lg bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-500">
                    {z.attempts ? "Spróbuj jeszcze raz" : "Zacznij"} →
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Limit tygodniowy (jeśli CEO ustawił) */}
      {weeklyLimit != null && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            limitReached
              ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
              : "border-slate-300 bg-white text-slate-700"
          }`}
        >
          {limitReached ? (
            <>
              <strong>Wykorzystałeś limit rozmów AI na ten tydzień</strong> ({usedThisWeek}/{weeklyLimit}).
              Limit odnowi się w poniedziałek. Chcesz więcej - poproś CEO.
            </>
          ) : (
            <>
              Rozmowy AI w tym tygodniu: <strong className="text-slate-900">{usedThisWeek}/{weeklyLimit}</strong>{" "}
              - zostało <strong className="text-emerald-600">{remaining}</strong>.
            </>
          )}
        </div>
      )}
      {limitParam === "reached" && !limitReached && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
          Ta rozmowa przekroczyłaby Twój tygodniowy limit.
        </div>
      )}

      {/* Podsumowanie postępu */}
      <section className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-[28px] bg-slate-900 p-6 text-white">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-500/30 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Ścieżka nauki</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {sciezka.zaliczone}
              <span className="text-lg font-semibold text-white/50">/{sciezka.wszystkie} lekcji</span>
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="wyniki-pasek h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${(sciezka.zaliczone / sciezka.wszystkie) * 100}%` }} />
            </div>
            {sciezka.aktualna ? (
              <Link href={`/app/trening/${sciezka.aktualna.scenariusz}?lekcja=${sciezka.aktualna.id}`} className="mt-5 inline-flex items-center gap-3 rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-slate-900 shadow-[0_6px_0_#059669] transition active:translate-y-1 active:shadow-none">
                <span>Dalej: {sciezka.aktualna.tytul}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <p className="mt-5 font-semibold text-emerald-300">Cała ścieżka ukończona. Mistrz.</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { w: sciezka.sredniWynik ?? "-", o: "średni wynik" },
            { w: `${sciezka.xp}`, o: "XP ze ścieżki" },
            { w: ranking.findIndex((r) => r.agentId === user.id) >= 0 ? `#${ranking.findIndex((r) => r.agentId === user.id) + 1}` : "-", o: "miejsce w tym tygodniu" },
          ].map((x) => (
            <div key={x.o} className="flex flex-col justify-center rounded-3xl border border-slate-200 bg-white p-4 text-center">
              <b className="text-2xl font-bold tabular-nums text-slate-900">{x.w}</b>
              <span className="mt-1 text-xs text-slate-500">{x.o}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Zakładki */}
      <nav className="mb-8 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {[
          { id: "sciezka", href: "/app/trening", nazwa: "Ścieżka nauki" },
          { id: "rozmowy", href: "/app/trening?widok=rozmowy", nazwa: `Wszystkie rozmowy (${scenarios.length})` },
          { id: "ranking", href: "/app/trening?widok=ranking", nazwa: "Ranking tygodnia" },
        ].map((z) => (
          <Link
            key={z.id}
            href={z.href}
            scroll={false}
            className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${widok === z.id ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            {z.nazwa}
          </Link>
        ))}
      </nav>

      {widok === "sciezka" && <SciezkaNauki stan={sciezka} nazwyTechnik={nazwyTechnik} />}

      {widok === "ranking" && <RankingTygodnia ranking={ranking} ja={user.id} />}

      {widok === "rozmowy" && (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {[{ value: "", label: "Wszystkie" }, ...SCENARIO_CATEGORIES].map((c) => (
              <Link
                key={c.value}
                href={c.value ? `/app/trening?widok=rozmowy&k=${c.value}` : "/app/trening?widok=rozmowy"}
                scroll={false}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${(katParam ?? "") === c.value ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
              >
                {c.label}
              </Link>
            ))}
          </div>
          <div className="space-y-10">
            {SCENARIO_CATEGORIES.filter((cat) => !katParam || cat.value === katParam).map((cat) => {
              const catScenarios = scenarios.filter((s) => (s.category ?? "cold_calling") === (cat.value as ScenarioCategory));
              if (catScenarios.length === 0) return null;
              const style = CAT_STYLE[cat.value] ?? CAT_STYLE.cold_calling;
              return (
                <section key={cat.value}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${style.tile}`}>
                      <CategoryIcon icon={cat.icon} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{cat.label}</h2>
                      <p className="text-sm text-slate-500">{cat.description}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {catScenarios.map((s) => {
                      const karta = kartaRozmowy(s.brief);
                      const rekord = rekordy.get(s.id);
                      const kropki = s.difficulty === "hard" ? 3 : s.difficulty === "medium" ? 2 : 1;
                      return (
                        <Link
                          key={s.id}
                          href={`/app/trening/${s.slug}`}
                          className={`group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg ${style.hover}`}
                        >
                          <div className={`relative flex items-center gap-3 px-5 pb-4 pt-5 ${style.tile}`}>
                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-lg font-bold text-slate-800 shadow-sm">
                              {karta.kto.replace(/^Pan[i]?\s+/, "").charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">{karta.kto}</p>
                              <p className="flex items-center gap-1 text-xs">
                                {[1, 2, 3].map((n) => (
                                  <span key={n} className={`h-1.5 w-4 rounded-full ${n <= kropki ? style.bar : "bg-white/70"}`} />
                                ))}
                                <span className="ml-1 opacity-80">{kropki === 3 ? "trudny" : kropki === 2 ? "średni" : "łatwy"}</span>
                              </p>
                            </div>
                            {rekord && (
                              <span className="absolute right-4 top-4 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-900 shadow-sm">
                                {rekord.najlepszy}/100
                              </span>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col p-5">
                            <h3 className="font-semibold text-slate-900">{s.title}</h3>
                            <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-500">{s.description}</p>
                            {karta.szczegoly.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {karta.szczegoly.slice(0, 3).map((x) => (
                                  <span key={x} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{x}</span>
                                ))}
                              </div>
                            )}
                            <span className={`mt-4 text-sm font-bold ${style.trenuj}`}>
                              {rekord ? `Rozmowy: ${rekord.ile} · trenuj dalej →` : "Zacznij rozmowę →"}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function RankingTygodnia({ ranking, ja }: { ranking: { agentId: string; imie: string; punkty: number; rozmowy: number; zaliczone: number }[]; ja: string }) {
  if (ranking.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-slate-900">W tym tygodniu jeszcze nikt nie trenował</p>
        <p className="mt-1 text-slate-500">Pierwsza rozmowa i jesteś na podium.</p>
      </div>
    );
  }
  const podium = [ranking[1], ranking[0], ranking[2]];
  const wysokosc = ["h-36", "h-48", "h-28"];
  const barwy = ["bg-slate-200 text-slate-700", "bg-emerald-400 text-slate-900", "bg-amber-200 text-amber-800"];
  const miejsce = [2, 1, 3];
  return (
    <div>
      <div className="mx-auto mb-8 grid max-w-2xl grid-cols-3 items-end gap-3">
        {podium.map((r, i) =>
          r ? (
            <div key={r.agentId} className="ranking-wjazd flex flex-col items-center" style={{ animationDelay: `${[0.15, 0, 0.3][i]}s` }}>
              <span className={`mb-2 grid h-16 w-16 place-items-center rounded-full border-4 bg-white text-xl font-bold text-slate-800 ${i === 1 ? "border-emerald-400" : i === 0 ? "border-slate-300" : "border-amber-300"}`}>
                {r.imie.charAt(0).toUpperCase()}
              </span>
              <p className="mb-2 max-w-full truncate text-sm font-semibold text-slate-900">{r.imie}</p>
              <div className={`flex w-full flex-col items-center justify-center rounded-t-2xl ${wysokosc[i]} ${barwy[i]}`}>
                <b className="text-3xl font-bold tabular-nums">{r.punkty}</b>
                <span className="text-[11px] font-bold uppercase tracking-wider">{miejsce[i]}. miejsce</span>
              </div>
            </div>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
      <ol className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        {ranking.map((r, i) => (
          <li key={r.agentId} className={`flex items-center gap-4 border-b border-slate-100 px-5 py-3.5 last:border-0 ${r.agentId === ja ? "bg-emerald-50" : ""}`}>
            <span className="w-6 text-sm font-bold tabular-nums text-slate-400">{i + 1}</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">{r.imie.charAt(0).toUpperCase()}</span>
            <span className="min-w-0 flex-1 truncate font-semibold text-slate-900">{r.imie}{r.agentId === ja ? " (Ty)" : ""}</span>
            <span className="hidden text-xs text-slate-500 sm:inline">{r.zaliczone} zdane · {r.rozmowy} rozmów</span>
            <b className="w-14 text-right tabular-nums text-slate-900">{r.punkty}</b>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-center text-xs text-slate-400">Punkty to suma wyników z rozmów od poniedziałku. Zdane: rozmowy z wynikiem od 60.</p>
    </div>
  );
}
