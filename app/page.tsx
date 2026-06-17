import { AuroraBackground } from "./components/aurora-background";
import { FadeIn, StaggerContainer, StaggerItem } from "./components/fade-in";
import { AnimatedStat } from "./components/animated-stat";
import { StickyNav } from "./components/sticky-nav";
import { WaitlistForm } from "./components/waitlist-form";

type Problem = {
  title: string;
  body: string;
  statValue?: number;
  statPrefix?: string;
  statSuffix?: string;
  statText?: string;
};

const PROBLEMS: Problem[] = [
  {
    statValue: 60,
    statSuffix: "%",
    title: "agentów wypada w pierwszych 6 miesiącach",
    body: "Brak systemu treningu = chaotyczny start, brak wzorca, brak feedbacku. Najlepsi się frustrują i odchodzą, słabi nie wiedzą czego im brakuje.",
  },
  {
    statValue: 30,
    statPrefix: "15–",
    statSuffix: "k zł",
    title: "tracisz na każdym nieudanym agencie",
    body: "Rekrutacja, ogłoszenia, czas zespołu, biuro, leady które rozdałeś. Każdy agent który nie rozwija się w sprzedaży to wprost koszt biura.",
  },
  {
    statText: "0",
    title: "obiektywnych danych jak naprawdę pracują",
    body: "Wiesz ile transakcji zamknęli. Nie wiesz jak rozmawiają, gdzie tracą leady, kto faktycznie potrzebuje wsparcia. Decydujesz przeczuciem.",
  },
];

const FEATURES = [
  {
    eyebrow: "AI Coach",
    title: "Trening cold calli z AI klientem",
    body: "Agent ćwiczy realne scenariusze: zimny telefon do właściciela, follow-up, obiekcje cenowe, negocjacja prowizji. AI gra klienta o określonej osobowości (agresywny, wahający, biznesowy). Po sesji dostaje scoring 1–10 w 4 kategoriach i konkretny feedback po polsku.",
    bullets: [
      "5 scenariuszy dopasowanych do polskiego rynku RE",
      "Naturalny polski głos AI klienta",
      "Transkrypcja i nagranie każdej sesji",
      "Trening 15 minut dziennie, w pracy lub w aucie",
    ],
  },
  {
    eyebrow: "Dashboard agenta",
    title: "Codzienna platforma do pracy",
    body: "Każdy agent ma swoje konto z planem dnia, celami miesięcznymi, statystykami i notatkami. Widzi swój postęp w czasie rzeczywistym i wie co dziś jest najważniejsze. Mniej Excela i WhatsAppa, więcej zamknięć.",
    bullets: [
      "Plan dnia i lista zadań",
      "Cele miesięczne i tracking prowizji",
      "Notatki per klient i oferta",
      "Wkrótce: integracja z kalendarzem Google",
    ],
  },
  {
    eyebrow: "Twój panel właściciela",
    title: "Pełen obraz zespołu — dane, nie przeczucia",
    body: "Ranking agentów, średni score sesji treningowych, gdzie zespół ma luki, kto rośnie a kto słabnie. Wiesz z kim porozmawiać i co konkretnie poprawić, zanim stracisz dobrego agenta lub leada.",
    bullets: [
      "Ranking i trendy zespołu",
      "Statystyki biura i poszczególnych agentów",
      "Najsłabsze i najsilniejsze obszary",
      "Raporty miesięczne na email",
    ],
  },
];

const STEPS = [
  {
    number: "01",
    title: "Zapraszasz swoich agentów",
    body: "Wpisujesz emaile, system wysyła zaproszenia. Każdy agent loguje się w 30 sekund, ma swoje konto, swoje dane.",
  },
  {
    number: "02",
    title: "Agenci trenują codziennie",
    body: "15 minut dziennie ćwiczenia z AI Coach. Praktyka czyni mistrza — różnica między agentem początkującym a doświadczonym to dziesiątki rozmów.",
  },
  {
    number: "03",
    title: "Widzisz wzrost zespołu w czasie",
    body: "Po 30 dniach masz dane: kto rośnie, gdzie są luki, jakie scenariusze biuro robi słabo. Konkretne decyzje, nie przeczucia.",
  },
];

const PRICING_FEATURES = [
  "Do 10 agentów w cenie podstawowej",
  "Każdy dodatkowy agent: +29 zł / mc",
  "AI Coach z 5 polskimi scenariuszami",
  "Dashboard agenta i panel właściciela",
  "Ranking, statystyki, raporty miesięczne",
  "Polskie wsparcie w godzinach 9–17",
  "14 dni za darmo, bez karty kredytowej",
  "30 dni gwarancji zwrotu pieniędzy",
];

const FAQ = [
  {
    question: "Kiedy AgentSpace startuje?",
    answer:
      "Pierwsza wersja w Q1 2026. Aktualnie pilotujemy z grupą zaprzyjaźnionych biur (w tym Spectra Nieruchomości w Krakowie). Pierwsze 10 biur z listy oczekujących dostanie wczesny dostęp + 3 miesiące za darmo + 30% rabatu na pierwszy rok.",
  },
  {
    question: "Czy moi agenci dostaną z tego realną korzyść, czy tylko więcej kontroli?",
    answer:
      "Realną korzyść. Agenci ćwiczą umiejętności które bezpośrednio przekładają się na ich prowizję. Lepiej obrabiają obiekcje = więcej zamkniętych transakcji. Plus widzą swój postęp i ranking — to motywujące. Najlepsi agenci kochają systemy które dają im przewagę.",
  },
  {
    question: "Czy musimy nagrywać prawdziwych klientów?",
    answer:
      "Nie. AI Coach to symulacje — agent ćwiczy z AI klientem, nie z prawdziwym. Pełna prywatność, zero ryzyka RODO ze strony klientów. Możemy w przyszłości dodać opcję analizy prawdziwych nagrań, ale tylko za zgodą i tylko jeśli sam tego chcesz.",
  },
  {
    question: "Jakie są wymagania techniczne?",
    answer:
      "Przeglądarka i mikrofon. Działa na laptopie, telefonie, tablecie. Bez instalacji, bez dodatkowego sprzętu. Twoi agenci mogą trenować w biurze, w domu, w aucie między spotkaniami.",
  },
  {
    question: "Co jeśli nie zadziała w moim biurze?",
    answer:
      "30 dni gwarancji zwrotu pieniędzy od dnia płatności, bez pytań. Plus pierwsze 14 dni to darmowy trial — testujesz bez ryzyka. Naszym celem jest żebyś po 30 dniach miał konkretne dane pokazujące wzrost zespołu.",
  },
];

const CheckIcon = () => (
  <svg
    className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default function Home() {
  return (
    <div className="grain relative bg-zinc-950 text-white antialiased">
      <StickyNav />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-zinc-900 px-6 pt-32 pb-32 md:pt-40 md:pb-40">
        <AuroraBackground />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <FadeIn>
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-zinc-800/80 bg-zinc-900/50 px-4 py-2 backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-zinc-300">
                Lista oczekujących otwarta — start Q1 2026
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="mb-6 text-5xl font-semibold tracking-tight text-white md:text-7xl lg:text-8xl">
              Codzienna platforma <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent shimmer">
                dla agentów nieruchomości
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
              AgentSpace łączy trening cold calli z AI, dashboard dziennej pracy i ranking zespołu.
              Wszystko czego potrzebuje Twoje biuro — w jednym miejscu, po polsku, z polskim wsparciem.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <a
                href="#waitlist"
                className="group relative w-full overflow-hidden rounded-xl bg-emerald-500 px-8 py-4 text-base font-semibold text-zinc-950 transition hover:bg-emerald-400 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.8)] sm:w-auto"
              >
                <span className="relative z-10">Dołącz do listy oczekujących</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </a>
              <a
                href="#how"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-8 py-4 text-base font-medium text-zinc-300 backdrop-blur-sm transition hover:border-zinc-700 hover:bg-zinc-900 sm:w-auto"
              >
                Zobacz jak działa
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <p className="mt-6 text-sm text-zinc-500">
              Pierwsze 10 biur: 3 miesiące za darmo + 30% rabatu na pierwszy rok
            </p>
          </FadeIn>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="relative border-b border-zinc-900 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <div className="mb-16 max-w-2xl">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                Problem
              </p>
              <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Trenowanie agentów RE jest drogie, czasochłonne i mało skuteczne
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((problem) => (
              <StaggerItem key={problem.title}>
                <div className="card-glow group relative h-full rounded-2xl border border-zinc-900 bg-zinc-900/30 p-8 transition-colors hover:border-emerald-500/30 hover:bg-zinc-900/50">
                  <p className="mb-6 text-5xl font-semibold text-emerald-400 md:text-6xl">
                    {problem.statText !== undefined ? (
                      problem.statText
                    ) : (
                      <AnimatedStat
                        value={problem.statValue ?? 0}
                        prefix={problem.statPrefix ?? ""}
                        suffix={problem.statSuffix ?? ""}
                      />
                    )}
                  </p>
                  <h3 className="mb-3 text-xl font-semibold text-white">{problem.title}</h3>
                  <p className="text-zinc-400">{problem.body}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ROZWIĄZANIE */}
      <section className="relative border-b border-zinc-900 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <div className="mb-16 max-w-2xl">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                Rozwiązanie
              </p>
              <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Trzy narzędzia. Jedna platforma. Jeden cel: lepszy zespół.
              </h2>
            </div>
          </FadeIn>

          <div className="space-y-12">
            {FEATURES.map((feature, index) => (
              <FadeIn key={feature.title} delay={index * 0.05}>
                <div className="card-glow rounded-3xl border border-zinc-900 bg-zinc-900/30 p-8 transition-colors hover:border-emerald-500/20 md:p-12">
                  <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-16">
                    <div className={index % 2 === 1 ? "md:order-2" : ""}>
                      <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                        {feature.eyebrow}
                      </p>
                      <h3 className="mb-4 text-3xl font-semibold tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="mb-6 leading-relaxed text-zinc-400">{feature.body}</p>
                      <ul className="space-y-2">
                        {feature.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-3 text-zinc-300">
                            <CheckIcon />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={index % 2 === 1 ? "md:order-1" : ""}>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/50 to-zinc-950 p-6">
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-cyan-500/5" />
                        <div className="relative flex h-full items-center justify-center">
                          <p className="text-center text-sm text-zinc-600">
                            Mockup ekranu —<br />
                            dodamy w następnej sesji
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* JAK TO DZIAŁA */}
      <section id="how" className="relative border-b border-zinc-900 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <div className="mb-16 max-w-2xl">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                Jak to działa
              </p>
              <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Wdrożenie w 10 minut. Pierwsze wnioski w 30 dni.
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="grid gap-8 md:grid-cols-3" staggerDelay={0.15}>
            {STEPS.map((step) => (
              <StaggerItem key={step.number}>
                <div className="group relative">
                  <p className="mb-4 bg-gradient-to-br from-zinc-700 to-zinc-900 bg-clip-text text-7xl font-semibold text-transparent transition-all group-hover:from-emerald-400 group-hover:to-cyan-400">
                    {step.number}
                  </p>
                  <h3 className="mb-3 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="text-zinc-400">{step.body}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CENNIK */}
      <section className="relative border-b border-zinc-900 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                Cennik
              </p>
              <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Jeden plan. Bez kombinowania.
              </h2>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-zinc-900/50 p-8 transition hover:border-emerald-500/50 hover:shadow-[0_0_60px_-10px_rgba(16,185,129,0.3)] md:p-12">
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />

              <div className="relative">
                <div className="mb-8 flex items-baseline gap-2">
                  <span className="text-6xl font-semibold text-white">299 zł</span>
                  <span className="text-zinc-400">/ miesiąc / biuro</span>
                </div>

                <ul className="mb-8 space-y-3 text-zinc-300">
                  {PRICING_FEATURES.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#waitlist"
                  className="group relative block w-full overflow-hidden rounded-xl bg-emerald-500 px-6 py-4 text-center font-semibold text-zinc-950 transition hover:bg-emerald-400 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.8)]"
                >
                  <span className="relative z-10">Dołącz do listy oczekujących</span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </a>

                <p className="mt-4 text-center text-sm text-zinc-500">
                  Pierwsze 10 biur: 3 miesiące za darmo + 30% rabatu na pierwszy rok
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative border-b border-zinc-900 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                Pytania
              </p>
              <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Najczęściej pytają o to
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="space-y-4" staggerDelay={0.05}>
            {FAQ.map((item) => (
              <StaggerItem key={item.question}>
                <details className="group rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6 transition-all open:bg-zinc-900/50 hover:border-zinc-800">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-white">
                    {item.question}
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
                  <p className="mt-4 leading-relaxed text-zinc-400">{item.answer}</p>
                </details>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* WAITLIST FORM */}
      <section id="waitlist" className="relative px-6 py-24 md:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl">
          <FadeIn>
            <div className="mb-10 text-center">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                Lista oczekujących
              </p>
              <h2 className="mb-4 text-4xl font-semibold tracking-tight md:text-5xl">
                Bądź wśród pierwszych 10 biur
              </h2>
              <p className="text-lg text-zinc-400">
                3 miesiące za darmo + 30% rabatu na pierwszy rok dla biur które dołączą teraz.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 backdrop-blur-xl md:p-10">
              <WaitlistForm />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-zinc-600 md:flex-row">
          <p>
            © 2026 AgentSpace ·{" "}
            <a href="https://agentspace.pl" className="hover:text-zinc-400">
              agentspace.pl
            </a>
          </p>
          <p>
            Robione w Krakowie · klient zero:{" "}
            <span className="text-zinc-400">Spectra Nieruchomości</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
