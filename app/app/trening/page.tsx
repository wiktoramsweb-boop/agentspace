import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getScenarios } from "@/lib/data";
import { SCENARIO_CATEGORIES, type ScenarioCategory } from "@/lib/types";
import { PageHeader, EmptyState } from "../components/ui";

const DIFFICULTY: Record<string, { label: string; className: string }> = {
  easy: { label: "Łatwy", className: "bg-emerald-500/15 text-emerald-300" },
  medium: { label: "Średni", className: "bg-amber-500/15 text-amber-300" },
  hard: { label: "Trudny", className: "bg-red-500/15 text-red-300" },
};

function CategoryIcon({ icon }: { icon: string }) {
  if (icon === "phone")
    return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>;
  if (icon === "handshake")
    return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>;
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>;
}

export default async function TreningPage() {
  await requireUser();
  const scenarios = await getScenarios();

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
        subtitle="Wybierz kategorię i scenariusz. Ćwicz rozmowę z AI klientem, dostań scoring i feedback."
      />

      {/* Instrukcja — jak to działa */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          { n: "1", t: "Wybierz scenariusz", d: "Z jednej z trzech kategorii poniżej" },
          { n: "2", t: "Wybierz typ klienta", d: "AI zagra go z daną osobowością" },
          { n: "3", t: "Rozmawiaj i oceń", d: "Na końcu scoring + wskazówki" },
        ].map((s) => (
          <div key={s.n} className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/40 p-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 font-bold text-emerald-300">
              {s.n}
            </span>
            <div>
              <p className="text-sm font-medium text-white">{s.t}</p>
              <p className="text-xs text-zinc-400">{s.d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Kategorie */}
      <div className="space-y-10">
        {SCENARIO_CATEGORIES.map((cat) => {
          const catScenarios = scenarios.filter((s) => s.category === (cat.value as ScenarioCategory));
          if (catScenarios.length === 0) return null;
          return (
            <section key={cat.value}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <CategoryIcon icon={cat.icon} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{cat.label}</h2>
                  <p className="text-sm text-zinc-400">{cat.description}</p>
                </div>
                <span className="ml-auto text-sm text-zinc-500">{catScenarios.length} scenariuszy</span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {catScenarios.map((s) => {
                  const diff = DIFFICULTY[s.difficulty] ?? DIFFICULTY.medium;
                  return (
                    <Link
                      key={s.id}
                      href={`/app/trening/${s.slug}`}
                      className="group relative overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-800/40 p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-zinc-800/70"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${diff.className}`}>
                          {diff.label}
                        </span>
                        <span className="text-sm font-medium text-emerald-400 opacity-0 transition group-hover:opacity-100">
                          Trenuj →
                        </span>
                      </div>
                      <h3 className="mb-1.5 font-semibold text-white">{s.title}</h3>
                      <p className="text-sm leading-relaxed text-zinc-400">{s.description}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
