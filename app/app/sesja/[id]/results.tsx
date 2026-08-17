import Link from "next/link";
import type { SessionWithScore } from "@/lib/data";
import { scoreColor } from "../../components/ui";
import { RescoreButton } from "./rescore-button";

const CATEGORIES = [
  { key: "opening", label: "Otwarcie rozmowy" },
  { key: "qualification", label: "Kwalifikacja klienta" },
  { key: "objection_handling", label: "Obsługa obiekcji" },
  { key: "closing", label: "Zamknięcie / następny krok" },
] as const;

export function SessionResults({
  session,
  backHref = "/app/historia",
  backLabel = "← Historia sesji",
  showTrainAgain = true,
}: {
  session: SessionWithScore;
  backHref?: string;
  backLabel?: string;
  showTrainAgain?: boolean;
}) {
  const score = session.score;
  const inProgress = session.status !== "completed";

  return (
    <>
      <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        {backLabel}
      </Link>

      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            {session.scenario_title ?? "Sesja treningowa"}
          </h1>
          <p className="mt-1 text-slate-500">
            Klient: {session.personality} · {inProgress ? "w trakcie (niedokończona)" : "zakończona"}
          </p>
        </div>
        {showTrainAgain && (
          <Link
            href="/app/trening"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            Trenuj ponownie →
          </Link>
        )}
      </div>

      {!score ? (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="mb-4 text-slate-500">
            Ta sesja nie została jeszcze oceniona. Kliknij poniżej, żeby AI przeanalizował
            rozmowę i dał Ci scoring z feedbackiem.
          </p>
          {session.transcript.some((m) => m.role === "agent") && (
            <RescoreButton sessionId={session.id} />
          )}
        </div>
      ) : (
        <>
          {/* Wynik ogólny */}
          <div className="mb-6 grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
            <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-50 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Wynik ogólny
                </p>
                <p className={`text-5xl font-semibold ${scoreColor(score.overall)}`}>
                  {score.overall}
                  <span className="text-2xl text-slate-400">/10</span>
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-900 bg-slate-50 p-6">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                Podsumowanie
              </p>
              <p className="leading-relaxed text-slate-800">{score.summary}</p>
            </div>
          </div>

          {/* Kategorie */}
          <div className="mb-6 rounded-2xl border border-zinc-900 bg-slate-50 p-6">
            <h2 className="mb-5 text-sm font-medium uppercase tracking-wider text-slate-500">
              Rozbicie na kategorie
            </h2>
            <div className="space-y-4">
              {CATEGORIES.map((cat) => {
                const val = score[cat.key];
                return (
                  <div key={cat.key} className="flex items-center gap-4">
                    <span className="w-44 flex-shrink-0 text-sm text-slate-700">{cat.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          val >= 8 ? "bg-emerald-400" : val >= 6 ? "bg-amber-400" : "bg-red-400"
                        }`}
                        style={{ width: `${val * 10}%` }}
                      />
                    </div>
                    <span className={`w-10 text-right font-mono text-sm font-semibold ${scoreColor(val)}`}>
                      {val}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sugestie */}
          {score.suggestions.length > 0 && (
            <div className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-emerald-600">
                Co poprawić następnym razem
              </h2>
              <ul className="space-y-3">
                {score.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-3 text-slate-800">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Transkrypt */}
      <details className="rounded-2xl border border-zinc-900 bg-slate-50 p-6">
        <summary className="cursor-pointer text-sm font-medium uppercase tracking-wider text-slate-500">
          Transkrypt rozmowy ({session.transcript.length} wiadomości)
        </summary>
        <div className="mt-5 space-y-3">
          {session.transcript.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "agent" ? "flex-row-reverse" : ""}`}>
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  m.role === "agent" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-800"
                }`}
              >
                {m.role === "agent" ? "Ty" : "K"}
              </span>
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  m.role === "agent"
                    ? "rounded-tr-sm bg-emerald-50 text-emerald-50"
                    : "rounded-tl-sm bg-slate-100 text-slate-800"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>
      </details>
    </>
  );
}
