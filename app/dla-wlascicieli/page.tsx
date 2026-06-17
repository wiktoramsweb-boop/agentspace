import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";

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
    title: "60% nowych agentów odpada w 6 miesięcy",
    body: "Bez systemu szkolenia: chaotyczny start, brak feedbacku, frustracja. Najlepsi odchodzą, słabi nie wiedzą czego im brakuje. Koszt: 15–30 tys. zł na każdego nieudanego agenta.",
  },
  {
    title: "Nie masz czasu uczyć każdego osobiście",
    body: "Mentorowanie 1-na-1 to 4-8 godzin/tydzień. Senior agenci nie chcą tego robić — chcą sprzedawać. Wewnętrzne szkolenia raz na kwartał = za rzadko żeby zmienić nawyk.",
  },
  {
    title: "Nie wiesz, gdzie naprawdę są luki",
    body: "Wiesz, kto ile zamknął. Nie wiesz, czemu Tomek konwertuje 1 na 8 a Asia 1 na 3. Decydujesz na intuicji, nie na danych.",
  },
];

const BENEFITS_OWNER = [
  {
    eyebrow: "Niższa rotacja agentów",
    title: "Z 60% wypadalności do 30% w pierwszych 6 miesiącach",
    body: "Systematyczny trening + widoczność postępu = nowy agent czuje, że rośnie i ma wsparcie. Konkretnie: każde uratowane miejsce w zespole = 20-30 tys. zł oszczędności.",
  },
  {
    eyebrow: "Szybszy onboarding",
    title: "Z 3 miesięcy do 4 tygodni do pierwszej transakcji",
    body: "AI Coach robi to, czego Ty nie masz czasu: codzienne dryle obiekcji, scenariusze, technikę zamykania. Nowy agent przychodzi do prawdziwego klienta przygotowany.",
  },
  {
    eyebrow: "Decyzje oparte o dane",
    title: "Widzisz, kto rośnie, kto stoi, gdzie zespół ma lukę",
    body: "Ranking sesji, średnie score zespołu, najsłabsze obszary, alerty (np. agent który nie trenował w tym tygodniu). Konkretne dane = konkretne decyzje rekrutacyjne i menedżerskie.",
  },
  {
    eyebrow: "Wyższa konwersja zespołu",
    title: "Średnio +25-40% lepsza obsługa obiekcji",
    body: "Po 30 dniach treningu agenci znają konkretne odpowiedzi na 5 najczęstszych obiekcji. To bezpośrednio przekłada się na więcej zamkniętych umów pośrednictwa i transakcji.",
  },
];

const ROI_MATH = [
  {
    label: "Koszt AgentSpace",
    value: "299 zł / mc",
    color: "text-zinc-300",
  },
  {
    label: "Średnia prowizja z transakcji",
    value: "~8 000 zł",
    color: "text-zinc-300",
  },
  {
    label: "Próg break-even",
    value: "1 transakcja więcej / mc",
    color: "text-emerald-400",
  },
  {
    label: "Średnio zespół 8-agentów daje (po 30 dniach)",
    value: "+3-5 transakcji / mc",
    color: "text-emerald-400",
  },
];

export default function DlaWlascicieli() {
  return (
    <>
      <SiteNav />
      <main className="bg-zinc-950 text-white">
        {/* Header */}
        <section className="border-b border-zinc-900 px-6 pt-32 pb-16">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Dla właścicieli biur nieruchomości
            </p>
            <h1 className="mb-6 text-4xl font-semibold tracking-tight md:text-5xl">
              Zespół który rośnie. Niższa rotacja. Decyzje oparte o dane.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
              AgentSpace nie jest kolejnym CRM. To system rozwoju zespołu — codzienny dryl,
              tracking, ranking. Robione przez właściciela biura w Krakowie, dla właścicieli
              biur w Polsce.
            </p>
          </div>
        </section>

        {/* Problem */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-3xl font-semibold tracking-tight md:text-4xl">
              Co Cię prawdopodobnie dziś boli
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              {PROBLEMS_OWNER.map((problem) => (
                <div
                  key={problem.title}
                  className="rounded-2xl border border-zinc-900 bg-zinc-900/30 p-8"
                >
                  <h3 className="mb-3 text-lg font-semibold text-white">{problem.title}</h3>
                  <p className="leading-relaxed text-zinc-400">{problem.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-3xl font-semibold tracking-tight md:text-4xl">
              Co konkretnie dostajesz
            </h2>

            <div className="space-y-6">
              {BENEFITS_OWNER.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-zinc-900 bg-zinc-900/30 p-8"
                >
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-emerald-400">
                    {benefit.eyebrow}
                  </p>
                  <h3 className="mb-3 text-xl font-semibold text-white">{benefit.title}</h3>
                  <p className="leading-relaxed text-zinc-400">{benefit.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight md:text-4xl">
              Prosta matematyka
            </h2>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 md:p-10">
              <dl className="space-y-6">
                {ROI_MATH.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col justify-between gap-2 border-b border-zinc-800 pb-6 last:border-0 last:pb-0 md:flex-row md:items-center"
                  >
                    <dt className="text-zinc-400">{item.label}</dt>
                    <dd className={`text-2xl font-semibold ${item.color}`}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-zinc-900/50 p-8 text-center md:p-12">
            <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Pilotaż dla pierwszych 10 biur
            </h2>
            <p className="mb-8 text-zinc-400">
              3 miesiące za darmo + 30% rabatu na pierwszy rok. Plus bezpośredni wpływ na rozwój
              produktu (osobiste 1-on-1 z founderem co tydzień).
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
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
