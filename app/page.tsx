import { WaitlistForm } from "./components/waitlist-form";

const PROBLEMS = [
  {
    stat: "60%",
    title: "agentów wypada w pierwszych 6 miesiącach",
    body: "Brak systemu treningu = chaotyczny start, brak wzorca, brak feedbacku. Najlepsi się frustrują i odchodzą, słabi nie wiedzą czego im brakuje.",
  },
  {
    stat: "15–30k zł",
    title: "tracisz na każdym nieudanym agencie",
    body: "Rekrutacja, ogłoszenia, czas zespołu, biuro, leady które rozdałeś. Każdy agent który nie rozwija się w sprzedaży to wprost koszt biura.",
  },
  {
    stat: "0",
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
      "Ranking i ranking trendów",
      "Statystyki biura i poszczególnych agentów",
      "Najsłabsze i najsilniejsze obszary zespołu",
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
    <div className="bg-zinc-950 text-white antialiased">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-zinc-900 px-6 pt-24 pb-32 md:pt-32 md:pb-40">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-zinc-400">
              Lista oczekujących otwarta — start Q1 2026
            </span>
          </div>

          <h1 className="mb-6 text-5xl font-semibold tracking-tight text-white md:text-7xl">
            Codzienna platforma <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              dla agentów nieruchomości
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
            AgentSpace łączy trening cold calli z AI, dashboard dziennej pracy i ranking zespołu.
            Wszystko czego potrzebuje Twoje biuro — w jednym miejscu, po polsku, z polskim wsparciem.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <a
              href="#waitlist"
              className="w-full rounded-xl bg-emerald-500 px-8 py-4 text-base font-semibold text-zinc-950 transition hover:bg-emerald-400 sm:w-auto"
            >
              Dołącz do listy oczekujących
            </a>
            <a
              href="#how"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-8 py-4 text-base font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 sm:w-auto"
            >
              Zobacz jak działa
            </a>
          </div>

          <p className="mt-6 text-sm text-zinc-600">
            Pierwsze 10 biur: 3 miesiące za darmo + 30% rabatu na pierwszy rok
          </p>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-b border-zinc-900 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Problem
            </p>
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Trenowanie agentów RE jest drogie, czasochłonne i mało skuteczne
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((problem) => (
              <div
                key={problem.title}
                className="rounded-2xl border border-zinc-900 bg-zinc-900/30 p-8"
              >
                <p className="mb-6 text-5xl font-semibold text-emerald-400">{problem.stat}</p>
                <h3 className="mb-3 text-xl font-semibold text-white">{problem.title}</h3>
                <p className="text-zinc-400">{problem.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROZWIĄZANIE */}
      <section className="border-b border-zinc-900 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Rozwiązanie
            </p>
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Trzy narzędzia. Jedna platforma. Jeden cel: lepszy zespół.
            </h2>
          </div>

          <div className="space-y-12">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-zinc-900 bg-zinc-900/30 p-8 md:p-12"
              >
                <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-16">
                  <div className={index % 2 === 1 ? "md:order-2" : ""}>
                    <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                      {feature.eyebrow}
                    </p>
                    <h3 className="mb-4 text-3xl font-semibold tracking-tight">{feature.title}</h3>
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
                    <div className="aspect-[4/3] rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
                      <div className="flex h-full items-center justify-center">
                        <p className="text-center text-sm text-zinc-600">
                          Mockup ekranu —<br />
                          dodamy w następnej sesji
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JAK TO DZIAŁA */}
      <section id="how" className="border-b border-zinc-900 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Jak to działa
            </p>
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Wdrożenie w 10 minut. Pierwsze wnioski w 30 dni.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number}>
                <p className="mb-4 text-6xl font-semibold text-zinc-800">{step.number}</p>
                <h3 className="mb-3 text-xl font-semibold text-white">{step.title}</h3>
                <p className="text-zinc-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CENNIK */}
      <section className="border-b border-zinc-900 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Cennik
            </p>
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Jeden plan. Bez kombinowania.
            </h2>
          </div>

          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-zinc-900/50 p-8 md:p-12">
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
              className="block w-full rounded-xl bg-emerald-500 px-6 py-4 text-center font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              Dołącz do listy oczekujących
            </a>

            <p className="mt-4 text-center text-sm text-zinc-500">
              Pierwsze 10 biur: 3 miesiące za darmo + 30% rabatu na pierwszy rok
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-zinc-900 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Pytania
            </p>
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Najczęściej pytają o to
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6 transition open:bg-zinc-900/50"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-medium text-white">
                  {item.question}
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-zinc-500 transition group-open:rotate-180"
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
            ))}
          </div>
        </div>
      </section>

      {/* WAITLIST FORM */}
      <section id="waitlist" className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-2xl">
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

          <div className="rounded-3xl border border-zinc-900 bg-zinc-900/30 p-8 md:p-10">
            <WaitlistForm />
          </div>
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
