import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";

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
        {/* Header */}
        <section className="border-b border-zinc-900 px-6 pt-32 pb-16">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Cennik
            </p>
            <h1 className="mb-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Jedna cena. Wszystkie funkcje. Bez gwiazdek.
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-zinc-400">
              Nie sprzedajemy &quot;pakietów&quot; ani &quot;modułów premium&quot;. Wszystko, co
              budujemy, dostajesz w jednej cenie.
            </p>
          </div>
        </section>

        {/* Pricing card */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-zinc-900/50 p-8 md:p-12">
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />

              <div className="relative">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                  ⚡ Promocja: pierwsze 10 biur
                </div>

                <div className="mt-6 mb-8 flex flex-wrap items-baseline gap-3">
                  <span className="text-6xl font-semibold text-white">299 zł</span>
                  <span className="text-zinc-400">/ miesiąc / biuro</span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-500">do 10 agentów w cenie</span>
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
                  className="block w-full rounded-xl bg-emerald-500 px-6 py-4 text-center font-semibold text-zinc-950 transition hover:bg-emerald-400"
                >
                  Dołącz do listy oczekujących
                </Link>

                <p className="mt-4 text-center text-sm text-zinc-500">
                  Pierwsze 10 biur: 3 miesiące za darmo + 30% rabatu na pierwszy rok
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight md:text-4xl">
              Porównaj z tradycyjnym szkoleniem
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6">
                <h3 className="mb-3 text-base font-semibold text-zinc-400">
                  Trener zewnętrzny 1-na-1
                </h3>
                <p className="mb-2 text-3xl font-semibold text-white">~4800 zł</p>
                <p className="text-sm text-zinc-500">/ mc / biuro 8 agentów</p>
                <p className="mt-4 text-xs text-zinc-600">
                  1 godzina/tydzień/agent · brak danych · brak ciągłości
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6">
                <h3 className="mb-3 text-base font-semibold text-zinc-400">
                  Warsztat raz na kwartał
                </h3>
                <p className="mb-2 text-3xl font-semibold text-white">~1500 zł</p>
                <p className="text-sm text-zinc-500">/ mc / biuro 8 agentów</p>
                <p className="mt-4 text-xs text-zinc-600">
                  4 godziny / kwartał · zapomniane po 2 tygodniach
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-zinc-900/30 p-6">
                <h3 className="mb-3 text-base font-semibold text-emerald-300">AgentSpace</h3>
                <p className="mb-2 text-3xl font-semibold text-white">299 zł</p>
                <p className="text-sm text-zinc-500">/ mc / biuro 8 agentów</p>
                <p className="mt-4 text-xs text-zinc-400">
                  15 min/dzień/agent · dane w czasie rzeczywistym · konsekwencja
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight md:text-4xl">
              Pytania o cennik
            </h2>

            <div className="space-y-4">
              {FAQ_PRICING.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6 transition-all open:bg-zinc-900/50 hover:border-zinc-800"
                >
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
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
