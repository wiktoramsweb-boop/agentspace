import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getScenarioBySlug, getWeeklySessionCount } from "@/lib/data";
import { PERSONALITIES } from "@/lib/types";
import { startSession } from "../actions";
import { Card } from "../../components/ui";
import { SubmitButton } from "../../components/submit-button";

type Props = { params: Promise<{ slug: string }> };

export default async function ScenarioSetupPage({ params }: Props) {
  const user = await requireUser();
  const { slug } = await params;
  const scenario = await getScenarioBySlug(slug);
  if (!scenario) notFound();

  // Tygodniowy limit rozmów AI - jeśli wyczerpany, nie pozwól zacząć.
  const limitReached =
    user.weekly_ai_limit != null && (await getWeeklySessionCount(user.id)) >= user.weekly_ai_limit;

  return (
    <>
      <Link href="/app/trening" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        ← Wszystkie scenariusze
      </Link>

      <h1 className="mb-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        {scenario!.title}
      </h1>

      <Card className="mb-8 !border-emerald-500/20 !bg-emerald-500/[0.04]">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-600">
          Krok 1 · Twoje zadanie
        </p>
        <p className="leading-relaxed text-slate-800">{scenario!.brief}</p>
      </Card>

      {limitReached && (
        <Card className="mb-8 !border-amber-500/30 !bg-amber-500/10">
          <p className="font-semibold text-amber-200">Wykorzystałeś limit rozmów AI na ten tydzień.</p>
          <p className="mt-1 text-sm text-amber-200/80">
            Limit odnowi się w poniedziałek. Jeśli potrzebujesz więcej - poproś CEO o zwiększenie limitu.
          </p>
        </Card>
      )}

      <form action={startSession}>
        <input type="hidden" name="scenarioId" value={scenario!.id} />

        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-600">
          Krok 2 · Wybierz typ klienta
        </p>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Jak ma zachowywać się AI?</h2>
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONALITIES.map((p, i) => (
            <label
              key={p.value}
              className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all has-[:checked]:border-emerald-500/50 has-[:checked]:bg-emerald-500/5 hover:border-slate-300"
            >
              <input
                type="radio"
                name="personality"
                value={p.value}
                defaultChecked={i === 0}
                className="peer sr-only"
              />
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-slate-900">{p.label}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 peer-checked:border-emerald-400 peer-checked:bg-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-transparent peer-checked:bg-white" />
                </span>
              </div>
              <p className="text-sm text-slate-500">{p.description}</p>
            </label>
          ))}
        </div>

        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-600">
          Krok 3 · Poziom trudności
        </p>
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Jak trudny ma być klient?</h2>
        <p className="mb-4 text-sm text-slate-500">
          Zacznij od łatwego, żeby złapać pewność - potem podnoś poprzeczkę. Nie każdy klient jest trudny.
        </p>
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            { value: "latwy", label: "Łatwy", desc: "Życzliwy, daje się przekonać - na rozgrzewkę" },
            { value: "sredni", label: "Średni", desc: "Realistyczny opór, ustępuje przy dobrych argumentach" },
            { value: "trudny", label: "Trudny", desc: "Wymagający, trzyma obiekcję twardo" },
          ].map((d) => (
            <label
              key={d.value}
              className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all has-[:checked]:border-emerald-500/50 has-[:checked]:bg-emerald-500/5 hover:border-slate-300"
            >
              <input
                type="radio"
                name="difficulty"
                value={d.value}
                defaultChecked={d.value === "sredni"}
                className="peer sr-only"
              />
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-slate-900">{d.label}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 peer-checked:border-emerald-400 peer-checked:bg-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-transparent peer-checked:bg-white" />
                </span>
              </div>
              <p className="text-sm text-slate-500">{d.desc}</p>
            </label>
          ))}
        </div>

        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-emerald-600">
          Krok 4 · Zaczynamy
        </p>
        <SubmitButton
          overlay
          overlayText="Uruchamiam sesję z AI…"
          pendingText="Uruchamiam…"
          disabled={limitReached}
          className="w-full rounded-xl bg-emerald-500 px-6 py-4 font-semibold text-white hover:bg-emerald-400 hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.7)] sm:w-auto"
        >
          {limitReached ? "Limit wyczerpany na ten tydzień" : "Rozpocznij rozmowę z AI klientem →"}
        </SubmitButton>
        <p className="mt-2 text-sm text-slate-500">
          AI odezwie się pierwszy. Pisz jak do prawdziwego klienta. Na końcu kliknij „Zakończ i oceń".
        </p>
      </form>
    </>
  );
}
