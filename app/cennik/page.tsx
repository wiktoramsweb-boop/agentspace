import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { PageHero } from "../components/page-hero";
import { FadeIn } from "../components/fade-in";
import { BorderBeam } from "../components/effects/border-beam";

export const metadata: Metadata = {
  title: "Cennik — AgentSpace | Szkolenie agentów nieruchomości",
  description:
    "Cennik AgentSpace: 299 zł/mc/biuro do 10 agentów. Pierwsze 10 biur: 3 miesiące za darmo + 30% rabatu. Bez ukrytych opłat, 14 dni za darmo, gwarancja zwrotu.",
  alternates: {
    canonical: "https://agentspace.pl/cennik",
  },
};

const INCLUDED = [
  "AI Coach z 5 polskimi scenariuszami sprzedażowymi",
  "Naturalny polski głos AI klienta (5 osobowości)",
  "Scoring 1–10 w 4 kategoriach po każdej sesji",
  "Feedback po polsku z konkretnymi sugestiami",
  "Dashboard dziennej pracy dla każdego agenta",
  "Panel właściciela: ranking, statystyki, alerty",
  "Raporty miesięczne na email",
  "Transkrypcja i nagranie każdej sesji",
  "Polskie wsparcie w godzinach 9–17",
  "Działanie na laptopie, telefonie, tablecie",
  "Hosting w UE (zgodność z RODO)",
  "Nielimitowana liczba sesji treningowych",
];

const COMPARISON = [
  {
    label: "Trener zewnętrzny 1-na-1",
    price: "~4800 zł",
    perMonth: "/ mc / biuro 8 agentów",
    detail: "1 godz/tydz/agent · brak danych · brak ciągłości",
    highlight: false,
  },
  {
    label: "Warsztat raz na kwartał",
    price: "~1500 zł",
    perMonth: "/ mc / biuro 8 agentów",
    detail: "4 godz / kwartał · zapomniane po 2 tyg.",
    highlight: false,
  },
  {
    label: "AgentSpace",
    price: "299 zł",
    perMonth: "/ mc / biuro 8 agentów",
    detail: "15 min/dzień/agent · dane real-time · konsekwencja",
    highlight: true,
  },
];

const FAQ_PRICING = [
  {
    q: "Co jeśli mam więcej niż 10 agentów?",
    a: "Każdy dodatkowy agent kosztuje 29 zł / miesiąc. Czyli zespół 15-osobowy = 299 zł + 5 × 29 zł = 444 zł / mc.",
  },
  {
    q: "Czy mogę zapłacić rocznie z rabatem?",
    a: "Tak. Subskrypcja roczna kosztuje 2990 zł (zamiast 3588 zł) — oszczędzasz 2 miesiące. Dla pierwszych 10 biur z listy oczekujących: 2093 zł (z rabatem 30%).",
  },
  {
    q: "Co obejmuje 14-dniowy darmowy trial?",
    a: "Pełny dostęp do wszystkich funkcji. Bez karty kredytowej na start. Po 14 dniach decydujesz — kupujesz, zostajesz na trialu odpłatnym (29 zł), albo kończysz.",
  },
  {
    q: "Jak działa gwarancja zwrotu pieniędzy?",
    a: "30 dni od dnia płatności. Bez pytań. Wystarczy mail. Zwracamy 100% kwoty na konto bankowe w 7 dni roboczych.",
  },
];

export default function Cennik() {
  return (
    <>
      <SiteNav />
      <main className="bg-zinc-950 text-white">
        <PageHero
          eyebrow="Cennik"
          title="Jedna cena. Wszystkie funkcje. Bez gwiazdek."
          description="Nie sprzedajemy 'pakietów' ani 'modułów premium'. Wszystko, co budujemy, dostajesz w jednej cenie."
        />

        {/* Pricing card z BorderBeam */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <FadeIn>
              <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-zinc-900/50 p-8 transition hover:border-emerald-500/50 hover:shadow-[0_0_80px_-10px_rgba(16,185,129,0.4)] md:p-12">
                <BorderBeam size={350} duration={10} colorFrom="#10b981" colorTo="#22d3ee" />
                <BorderBeam size={350} duration={10} colorFrom="#22d3ee" colorTo="#10b981" delay={5} />

                <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />

                <div className="relative">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                    ⚡ Promocja: pierwsze 10 biur
                  </div>

                  <div className="mt-6 mb-8 flex flex-wrap items-baseline gap-3">
                    <span className="bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-6xl font-semibold text-transparent">
                      299 zł
                    </span>
                    <span className="text-zinc-400">/ miesiąc / biuro</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-zinc-500">do 10 agentów</span>
                  </div>

                  <p className="mb-8 text-zinc-300">
                    Każdy dodatkowy agent: <strong className="text-white">29 zł / mc</strong>.
                    Roczna subskrypcja: <strong className="text-white">2990 zł</strong> (zamiast
                    3588 zł).
                  </p>

                  <ul className="mb-8 grid gap-3 md:grid-cols-2">
                    {INCLUDED.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-zinc-300">
                        <svg
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/#waitlist"
                    className="group relative block w-full overflow-hidden rounded-xl bg-emerald-500 px-6 py-4 text-center font-semibold text-zinc-950 transition hover:bg-emerald-400 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.8)]"
                  >
                    <span className="relative z-10">Dołącz do listy oczekujących</span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </Link>

                  <p className="mt-4 text-center text-sm text-zinc-500">
                    Pierwsze 10 biur: 3 miesiące za darmo + 30% rabatu na pierwszy rok
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Comparison — visual */}
        <section className="border-b border-zinc-900 px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight md:text-4xl">
                Porównaj z tradycyjnym szkoleniem
              </h2>
            </FadeIn>

            <div className="grid gap-6 md:grid-cols-3">
              {COMPARISON.map((item, index) => (
                <FadeIn key={item.label} delay={index * 0.1}>
                  <div
                    className={`relative h-full overflow-hidden rounded-2xl p-6 transition-all ${
                      item.highlight
                        ? "border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-zinc-900/30 shadow-[0_0_40px_-15px_rgba(16,185,129,0.4)]"
                        : "border border-zinc-900 bg-zinc-900/30"
                    }`}
                  >
                    {item.highlight && (
                      <>
                        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl" />
                        <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-cyan-500/20 blur-2xl" />
                        <div className="absolute right-4 top-4 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          Najlepszy
                        </div>
                      </>
                    )}
                    <div className="relative">
                      <h3
                        className={`mb-3 text-base font-semibold ${item.highlight ? "text-emerald-300" : "text-zinc-400"}`}
                      >
                        {item.label}
                      </h3>
                      <p
                        className={`mb-2 font-semibold ${
                          item.highlight
                            ? "bg-gradient-to-br from-white to-emerald-200 bg-clip-text text-4xl text-transparent"
                            : "text-3xl text-white"
                        }`}
                      >
                        {item.price}
                      </p>
                      <p className="text-sm text-zinc-500">{item.perMonth}</p>
                      <p
                        className={`mt-4 text-xs ${item.highlight ? "text-zinc-400" : "text-zinc-600"}`}
                      >
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-zinc-900 px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl">
            <FadeIn>
              <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight md:text-4xl">
                Pytania o cennik
              </h2>
            </FadeIn>

            <div className="space-y-4">
              {FAQ_PRICING.map((item, index) => (
                <FadeIn key={item.q} delay={index * 0.05}>
                  <details className="group rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6 transition-all open:bg-zinc-900/50 hover:border-zinc-800">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-white">
                      {item.q}
                      <svg
                        className="h-5 w-5 flex-shrink-0 text-zinc-500 transition group-open:rotate-180 group-open:text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="mt-4 leading-relaxed text-zinc-400">{item.a}</p>
                  </details>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
