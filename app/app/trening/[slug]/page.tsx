import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getScenarioBySlug } from "@/lib/data";
import { PERSONALITIES } from "@/lib/types";
import { startSession } from "../actions";
import { Card } from "../../components/ui";

type Props = { params: Promise<{ slug: string }> };

export default async function ScenarioSetupPage({ params }: Props) {
  await requireUser();
  const { slug } = await params;
  const scenario = await getScenarioBySlug(slug);
  if (!scenario) notFound();

  return (
    <>
      <Link href="/app/trening" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-emerald-400">
        ← Wszystkie scenariusze
      </Link>

      <h1 className="mb-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
        {scenario!.title}
      </h1>

      <Card className="mb-8 !border-emerald-500/20 !bg-emerald-500/[0.04]">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-400">
          Krok 1 · Twoje zadanie
        </p>
        <p className="leading-relaxed text-zinc-200">{scenario!.brief}</p>
      </Card>

      <form action={startSession}>
        <input type="hidden" name="scenarioId" value={scenario!.id} />

        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-400">
          Krok 2 · Wybierz typ klienta
        </p>
        <h2 className="mb-4 text-lg font-semibold text-white">Jak ma zachowywać się AI?</h2>
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONALITIES.map((p, i) => (
            <label
              key={p.value}
              className="group relative cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 transition-all has-[:checked]:border-emerald-500/50 has-[:checked]:bg-emerald-500/5 hover:border-zinc-700"
            >
              <input
                type="radio"
                name="personality"
                value={p.value}
                defaultChecked={i === 0}
                className="peer sr-only"
              />
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-white">{p.label}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 peer-checked:border-emerald-400 peer-checked:bg-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-transparent peer-checked:bg-zinc-950" />
                </span>
              </div>
              <p className="text-sm text-zinc-400">{p.description}</p>
            </label>
          ))}
        </div>

        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-emerald-400">
          Krok 3 · Zaczynamy
        </p>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-4 font-semibold text-zinc-950 transition hover:bg-emerald-400 hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.7)] sm:w-auto"
        >
          Rozpocznij rozmowę z AI klientem →
        </button>
        <p className="mt-2 text-sm text-zinc-500">
          AI odezwie się pierwszy. Pisz jak do prawdziwego klienta. Na końcu kliknij „Zakończ i oceń".
        </p>
      </form>
    </>
  );
}
