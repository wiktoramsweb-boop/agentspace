import Link from "next/link";

export type OnboardingState = {
  hasGoal: boolean;
  hasClient: boolean;
  hasSession: boolean;
  hasDeal: boolean;
};

const STEPS = [
  {
    key: "hasGoal" as const,
    title: "Ustaw swój cel",
    body: "Powiedz ile chcesz zarobić — rozbijemy to na codzienne działania.",
    href: "/app/cele",
    cta: "Ustaw cel",
  },
  {
    key: "hasSession" as const,
    title: "Zrób pierwszą sesję AI Coach",
    body: "Poćwicz rozmowę z AI klientem. Zacznij od klienta życzliwego.",
    href: "/app/trening",
    cta: "Trenuj",
  },
  {
    key: "hasClient" as const,
    title: "Dodaj pierwszego klienta",
    body: "Prowadź notatki i status, nie zgub żadnego leada.",
    href: "/app/klienci",
    cta: "Dodaj klienta",
  },
  {
    key: "hasDeal" as const,
    title: "Dodaj transakcję",
    body: "Śledź prowizję i postęp do celu.",
    href: "/app/prowizje",
    cta: "Dodaj transakcję",
  },
];

export function OnboardingChecklist({ state }: { state: OnboardingState }) {
  const done = STEPS.filter((s) => state[s.key]).length;
  if (done === STEPS.length) return null; // wszystko zrobione → chowamy

  const pct = Math.round((done / STEPS.length) * 100);

  return (
    <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] to-zinc-800/40 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Pierwsze kroki w AgentSpace</h2>
          <p className="text-sm text-zinc-400">Zrób te 4 rzeczy, żeby ruszyć pełną parą.</p>
        </div>
        <span className="text-sm font-medium text-emerald-400">{done}/{STEPS.length}</span>
      </div>

      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-2">
        {STEPS.map((step) => {
          const complete = state[step.key];
          return (
            <div
              key={step.key}
              className={`flex items-center gap-4 rounded-xl border p-3 ${complete ? "border-emerald-500/20 bg-emerald-500/5" : "border-zinc-700 bg-zinc-800/40"}`}
            >
              <div
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border ${complete ? "border-emerald-500 bg-emerald-500" : "border-zinc-600"}`}
              >
                {complete && (
                  <svg className="h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${complete ? "text-zinc-500 line-through" : "text-white"}`}>
                  {step.title}
                </p>
                {!complete && <p className="text-xs text-zinc-400">{step.body}</p>}
              </div>
              {!complete && (
                <Link
                  href={step.href}
                  className="flex-shrink-0 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
                >
                  {step.cta} →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
