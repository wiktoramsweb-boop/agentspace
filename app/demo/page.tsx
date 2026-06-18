import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { AiCoachMockup } from "../components/mockups/ai-coach-mockup";
import { AgentDashboardMockup } from "../components/mockups/agent-dashboard-mockup";
import { OwnerPanelMockup } from "../components/mockups/owner-panel-mockup";
import { CoachFlow } from "../components/coach-flow";
import { PageHero } from "../components/page-hero";
import { FadeIn } from "../components/fade-in";
import { TiltCard } from "../components/effects/tilt-card";

export const metadata: Metadata = {
  title: "Demo AgentSpace — zobacz jak działa AI Coach",
  description:
    "Demo platformy AgentSpace: AI Coach do treningu cold calli, dashboard agenta, panel właściciela biura. Interaktywne mockupy + pełen flow sesji treningowej.",
  alternates: {
    canonical: "https://agentspace.pl/demo",
  },
};

const MOCKUPS_LIST = [
  {
    eyebrow: "Ekran 1",
    title: "AI Coach w działaniu",
    body: "Agent wybiera scenariusz, wybiera osobowość klienta, klika start. Mikrofon się aktywuje, AI mówi pierwsze zdanie po polsku. Rozmowa toczy się jak prawdziwa — z przerwami, obiekcjami, zaskakującymi pytaniami.",
    Mockup: AiCoachMockup,
  },
  {
    eyebrow: "Ekran 2",
    title: "Codzienny dashboard agenta",
    body: "Każdy agent ma własne miejsce pracy. Plan dnia, tracking prowizji, statystyki, ranking w biurze. Mniej Excela, więcej focus na zamknięciach.",
    Mockup: AgentDashboardMockup,
  },
  {
    eyebrow: "Ekran 3",
    title: "Panel właściciela — pełen obraz zespołu",
    body: "Średni score sesji, ranking agentów, najsłabsze obszary zespołu, alerty (np. agent który nie trenuje). Decyzje oparte o dane, nie przeczucia.",
    Mockup: OwnerPanelMockup,
  },
];

export default function Demo() {
  return (
    <>
      <SiteNav />
      <main className="bg-zinc-950 text-white">
        <PageHero
          eyebrow="Demo"
          title="Zobacz, jak wygląda AgentSpace od środka"
          description="Wszystkie trzy główne ekrany — interaktywne mockupy z mikro-animacjami. Wideo demo zaraz po premierze (Q1 2026)."
        />

        {/* Mockupy */}
        {MOCKUPS_LIST.map((item, index) => (
          <section
            key={item.title}
            className={`px-6 py-20 ${index < MOCKUPS_LIST.length - 1 ? "border-b border-zinc-900" : ""}`}
          >
            <div className="mx-auto max-w-6xl">
              <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
                <FadeIn className={index % 2 === 1 ? "md:order-2" : ""}>
                  <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                    {item.eyebrow}
                  </p>
                  <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
                    {item.title}
                  </h2>
                  <p className="text-lg leading-relaxed text-zinc-400">{item.body}</p>
                </FadeIn>
                <FadeIn delay={0.15} className={index % 2 === 1 ? "md:order-1" : ""}>
                  <TiltCard className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl shadow-emerald-500/10">
                    <div className="mb-2 flex items-center gap-1.5 px-2 py-1">
                      <div className="h-2 w-2 rounded-full bg-red-500/60" />
                      <div className="h-2 w-2 rounded-full bg-amber-500/60" />
                      <div className="h-2 w-2 rounded-full bg-emerald-500/60" />
                      <div className="ml-2 flex-1 rounded-md bg-zinc-900/80 px-2 py-0.5 font-mono text-[9px] text-zinc-500">
                        agentspace.pl/app
                      </div>
                    </div>
                    <item.Mockup />
                  </TiltCard>
                </FadeIn>
              </div>
            </div>
          </section>
        ))}

        {/* Coach flow */}
        <section className="border-b border-t border-zinc-900 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 max-w-2xl">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                Pełen flow
              </p>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Jak wygląda jedna sesja treningowa krok po kroku
              </h2>
            </div>
            <CoachFlow />
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-zinc-900/50 p-8 text-center md:p-12">
            <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Chcesz zobaczyć demo na żywo w swoim biurze?
            </h2>
            <p className="mb-8 text-zinc-400">
              Zaplanuj 30-min rozmowę. Pokażemy konkretnie, jak AgentSpace zadziała u Was.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/#waitlist"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-8 py-4 font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                Dołącz do listy oczekujących
              </Link>
              <Link
                href="/kontakt"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 px-8 py-4 font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900"
              >
                Napisz po demo
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
