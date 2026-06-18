import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { PageHero } from "../components/page-hero";
import { FadeIn, StaggerContainer, StaggerItem } from "../components/fade-in";

export const metadata: Metadata = {
  title: "Dla właścicieli biur nieruchomości — AgentSpace",
  description:
    "AgentSpace dla właścicieli biur RE. Niższa rotacja agentów, szybszy onboarding, decyzje oparte o dane, wyższa konwersja zespołu. 299 zł/mc/biuro.",
  alternates: {
    canonical: "https://agentspace.pl/dla-wlascicieli",
  },
};

const PROBLEMS_OWNER = [
  {
    stat: "60%",
    title: "agentów odpada w 6 mc",
    body: "Bez systemu szkolenia: chaotyczny start, brak feedbacku. Najlepsi odchodzą, słabi nie wiedzą czego im brakuje. Koszt: 15–30 tys. zł na nieudanego agenta.",
  },
  {
    stat: "8h",
    title: "tygodniowo na mentoring 1-na-1",
    body: "Mentorowanie kosztuje czas. Senior agenci nie chcą tego robić — chcą sprzedawać. Wewnętrzne szkolenia raz na kwartał = za rzadko żeby zmienić nawyk.",
  },
  {
    stat: "0",
    title: "obiektywnych danych o pracy",
    body: "Wiesz kto zamknął ile. Nie wiesz czemu Tomek konwertuje 1/8 a Asia 1/3. Decydujesz na intuicji.",
  },
];

const BENEFITS_OWNER = [
  {
    eyebrow: "Niższa rotacja agentów",
    title: "Z 60% wypadalności do 30% w 6 miesięcy",
    body: "Systematyczny trening + widoczność postępu = nowy agent czuje, że rośnie i ma wsparcie. Każde uratowane miejsce w zespole = 20-30 tys. zł oszczędności.",
  },
  {
    eyebrow: "Szybszy onboarding",
    title: "Z 3 miesięcy do 4 tygodni do pierwszej transakcji",
    body: "AI Coach robi to, czego Ty nie masz czasu: codzienne dryle obiekcji, scenariusze, technikę zamykania. Nowy agent przychodzi do prawdziwego klienta przygotowany.",
  },
  {
    eyebrow: "Decyzje oparte o dane",
    title: "Widzisz kto rośnie, kto stoi, gdzie zespół ma lukę",
    body: "Ranking sesji, średnie score zespołu, najsłabsze obszary, alerty. Konkretne dane = konkretne decyzje rekrutacyjne i menedżerskie.",
  },
  {
    eyebrow: "Wyższa konwersja zespołu",
    title: "Średnio +25-40% lepsza obsługa obiekcji",
    body: "Po 30 dniach treningu agenci znają konkretne odpowiedzi na 5 najczęstszych obiekcji. To bezpośrednio przekłada się na więcej zamkniętych umów.",
  },
];

const ROI_MATH = [
  { label: "Koszt AgentSpace", value: "299 zł", suffix: "/ mc", color: "text-zinc-300" },
  { label: "Średnia prowizja z transakcji", value: "~8 000 zł", suffix: "", color: "text-zinc-300" },
  { label: "Próg break-even", value: "+1 transakcja", suffix: "/ mc", color: "text-emerald-400" },
  { label: "Średnio zespół 8-osobowy daje (po 30 dniach)", value: "+3–5 transakcji", suffix: "/ mc", color: "text-emerald-400" },
];

export default function DlaWlascicieli() {
  return (
    <>
      <SiteNav />
      <main className="bg-zinc-950 text-white">
        <PageHero
          eyebrow="Dla właścicieli biur nieruchomości"
          title="Zespół który rośnie. Niższa rotacja. Decyzje oparte o dane."
          description="AgentSpace nie jest kolejnym CRM. To system rozwoju zespołu — codzienny dryl, tracking, ranking. Robione przez właściciela biura w Krakowie, dla właścicieli biur w Polsce."
        />

        {/* Problemy z liczbami */}
        <section className="border-b border-zinc-900 px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <FadeIn>
              <h2 className="mb-12 text-3xl font-semibold tracking-tight md:text-4xl">
                Co Cię prawdopodobnie dziś boli
              </h2>
            </FadeIn>

            <StaggerContainer className="grid gap-6 md:grid-cols-3" staggerDelay={0.1}>
              {PROBLEMS_OWNER.map((problem) => (
                <StaggerItem key={problem.title}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/30 p-8 transition-all hover:-translate-y-1 hover:border-red-500/30 hover:bg-zinc-900/50">
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-red-500/5 blur-2xl transition-all duration-500 group-hover:bg-red-500/15" />
                    <div className="relative">
                      <p className="mb-4 bg-gradient-to-br from-red-400 to-amber-400 bg-clip-text text-5xl font-semibold text-transparent md:text-6xl">
                        {problem.stat}
                      </p>
                      <h3 className="mb-3 text-lg font-semibold text-white">{problem.title}</h3>
                      <p className="text-zinc-400">{problem.body}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Benefits */}
        <section className="border-b border-zinc-900 px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <h2 className="mb-12 text-3xl font-semibold tracking-tight md:text-4xl">
                Co konkretnie dostajesz
              </h2>
            </FadeIn>

            <StaggerContainer className="grid gap-6 md:grid-cols-2" staggerDelay={0.1}>
              {BENEFITS_OWNER.map((benefit) => (
                <StaggerItem key={benefit.title}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/30 p-8 transition-all hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-zinc-900/50">
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl transition-all duration-500 group-hover:bg-emerald-500/15" />
                    <div className="relative">
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-emerald-400">
                        {benefit.eyebrow}
                      </p>
                      <h3 className="mb-3 text-xl font-semibold text-white">{benefit.title}</h3>
                      <p className="leading-relaxed text-zinc-400">{benefit.body}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ROI math */}
        <section className="border-b border-zinc-900 px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl">
            <FadeIn>
              <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight md:text-4xl">
                Prosta matematyka
              </h2>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-zinc-900/20 p-8 backdrop-blur-xl md:p-10">
                <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

                <dl className="relative space-y-6">
                  {ROI_MATH.map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col justify-between gap-2 border-b border-zinc-800 pb-6 last:border-0 last:pb-0 md:flex-row md:items-center"
                    >
                      <dt className="text-zinc-400">{item.label}</dt>
                      <dd className={`text-2xl font-semibold ${item.color}`}>
                        {item.value}
                        {item.suffix && <span className="text-base text-zinc-500"> {item.suffix}</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
          <FadeIn>
            <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-zinc-900/50 p-8 text-center md:p-12">
              <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
                Pilotaż dla pierwszych 10 biur
              </h2>
              <p className="mb-8 text-zinc-400">
                3 miesiące za darmo + 30% rabatu na pierwszy rok. Plus bezpośredni wpływ na rozwój
                produktu (1-on-1 z founderem co tydzień).
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
                  Porozmawiajmy
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
