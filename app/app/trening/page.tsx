import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getScenarios } from "@/lib/data";
import { PageHeader, Card, EmptyState } from "../components/ui";

const DIFFICULTY_LABEL: Record<string, { label: string; className: string }> = {
  easy: { label: "Łatwy", className: "bg-emerald-500/15 text-emerald-300" },
  medium: { label: "Średni", className: "bg-amber-500/15 text-amber-300" },
  hard: { label: "Trudny", className: "bg-red-500/15 text-red-300" },
};

export default async function TreningPage() {
  await requireUser();
  const scenarios = await getScenarios();

  return (
    <>
      <PageHeader
        title="AI Coach"
        subtitle="Wybierz scenariusz. Ćwicz rozmowę z AI klientem. Dostań scoring i feedback."
      />

      {scenarios.length === 0 ? (
        <EmptyState
          title="Brak scenariuszy"
          body="Scenariusze nie zostały jeszcze wgrane do bazy. Uruchom seed-scenarios.sql w Supabase."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {scenarios.map((s) => {
            const diff = DIFFICULTY_LABEL[s.difficulty] ?? DIFFICULTY_LABEL.medium;
            return (
              <Link
                key={s.id}
                href={`/app/trening/${s.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/40 p-6 transition-all hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-zinc-900/60"
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/5 blur-2xl transition-all group-hover:bg-emerald-500/15" />
                <div className="relative">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${diff.className}`}>
                      {diff.label}
                    </span>
                    <span className="text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-400">
                      →
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{s.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
