import { FadeIn, StaggerContainer, StaggerItem } from "./components/fade-in";
import { SiteNav } from "./components/site-nav";
import { SiteFooter } from "./components/site-footer";
import { AuroraBackground } from "./components/aurora-background";
import { Spotlight } from "./components/effects/spotlight";
import { Magnetic } from "./components/effects/magnetic-button";
import { GlowCard } from "./components/effects/glow-card";
import { Button, Card, Section, SectionHead, Tick } from "./components/mk/ui";
import { Pricing } from "./components/mk/pricing";
import { Compare } from "./components/mk/compare";

/* ── Treść ─────────────────────────────────────────────────── */

/** Liczby prawdziwe z konstrukcji produktu - nie z cudzych badań. */
const FACTS = [
  { value: 6, suffix: "", label: "modułów w jednym systemie" },
  { value: 1, suffix: " dzień", label: "wdrożenia razem z importem bazy" },
  { value: 30, suffix: " dni", label: "do pierwszych wniosków z danych" },
];

const VALUES = [
  {
    title: "Więcej domkniętych transakcji",
    body: "Żaden lead nie ginie w Excelu ani w telefonie agenta. Follow-upy przypominają się same, a agent wie codziennie, co jest dziś najważniejsze.",
  },
  {
    title: "Mniej chaosu w biurze",
    body: "Klienci, nieruchomości, zadania, prowizje i dokumenty w jednym miejscu. Koniec z bazą rozrzuconą po arkuszach, WhatsAppie i notesach.",
  },
  {
    title: "Widzisz, kto naprawdę pracuje",
    body: "Cele dzienne, realizacja lejka i ranking zespołu liczone z prawdziwych danych. Decydujesz na liczbach, nie na przeczuciu.",
  },
];

const MODULES = [
  {
    name: "CRM klientów",
    slug: "crm",
    body: "Karty klientów z historią, notatkami i pipeline. Osobne typy: sprzedający, kupujący, wynajmujący, najemca. Baza zostaje w biurze, nie w telefonie agenta.",
  },
  {
    name: "Wspólna baza nieruchomości",
    slug: "nieruchomosci",
    body: "Oferty widoczne dla całego zespołu, ze zdjęciami i statusem. Agent od kupującego widzi, co ma kolega od sprzedającego.",
  },
  {
    name: "Cele i lejek sprzedaży",
    slug: "cele",
    body: "Cel roczny rozbity na dzienny: telefony → spotkania → umowy → sprzedaże. Dzienny tracker, plan tygodnia i historia realizacji.",
  },
  {
    name: "Prowizje i transakcje",
    slug: "prowizje",
    body: "Karta transakcji z pięcioma etapami i dokumentami. Prowizje liczą się same, cel miesięczny widać na bieżąco. Umowa rezerwacyjna generuje się do PDF.",
  },
  {
    name: "AI Coach",
    slug: "ai-coach",
    body: "Agent trenuje rozmowy z klientem AI: cold call, spotkanie pozyskowe, najem. 13 scenariuszy, 9 osobowości klienta, głos, scoring i feedback po polsku.",
  },
  {
    name: "Panel właściciela",
    slug: "panel-wlasciciela",
    body: "Ranking, mocne i słabe obszary zespołu, prowizje per agent, drill-down do pojedynczej osoby. Raport miesięczny przychodzi na e-mail.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Rozmowa i audyt biura",
    body: "30 minut. Sprawdzamy, jak dziś wygląda obieg leada w Twoim biurze i gdzie realnie tracisz transakcje. Dostajesz wnioski niezależnie od tego, czy zaczniemy współpracę.",
  },
  {
    n: "02",
    title: "Wdrożenie w jeden dzień",
    body: "Zakładamy konto biura, wgrywamy bazę klientów i nieruchomości, zapraszamy agentów. Konfigurujemy cele i lejek pod Twój model pracy. Bez instalacji, bez działu IT.",
  },
  {
    n: "03",
    title: "Pierwsze wnioski w 30 dni",
    body: "Po miesiącu masz komplet danych: kto realizuje cele, gdzie zespół traci leady, jak wyglądają rozmowy. Od tego momentu zarządzasz liczbami, nie wrażeniem.",
  },
];

const PROBLEMS = [
  {
    title: "Baza biura jest w telefonach agentów",
    body: "Agent odchodzi i zabiera ze sobą kontakty, historię rozmów i relacje. Zostaje Ci arkusz, który nikt nie uzupełniał od pół roku.",
  },
  {
    title: "Nie wiesz, co się dzieje między odprawami",
    body: "Wiesz, ile było transakcji. Nie wiesz, ile było telefonów, ile spotkań i który agent utknął dwa tygodnie temu - dopóki nie jest za późno.",
  },
  {
    title: "Nowy agent uczy się na Twoich klientach",
    body: "Pierwsze rozmowy nowej osoby to spalone leady. Bez miejsca do trenowania każdy błąd kosztuje realną prowizję.",
  },
];

const NOT_FOR = [
  {
    title: "Pracujesz solo lub we dwójkę",
    body: "Ranking, panel właściciela i raporty zespołowe nie mają wtedy sensu. Zapłacisz za funkcje, których nie użyjesz.",
  },
  {
    title: "Nie chcesz prowadzić zespołu",
    body: "AgentSpace pokazuje dane i daje narzędzia, ale nie zarządza za Ciebie. Jeśli nikt nie spojrzy w panel raz w tygodniu i nie porozmawia z agentem, który słabnie - żaden system tego nie naprawi.",
  },
  {
    title: "Szukasz portalu z eksportem ofert",
    body: "Nie jesteśmy systemem do masowego wystawiania na portale. Eksport do OtoDom jest na mapie drogowej, ale dziś AgentSpace jest systemem pracy biura, nie wystawiarką ogłoszeń.",
  },
];

const FAQ = [
  {
    question: "Czy AgentSpace działa już dziś?",
    answer:
      "Tak. Platforma działa na produkcji i jest codziennie używana w biurze Spectra Nieruchomości w Krakowie - to biuro założyciela i pierwszy klient produktu. Przyjmujemy kolejne biura w ramach Programu Pierwszych 10 Biur.",
  },
  {
    question: "Czy AgentSpace zastąpi mój obecny system?",
    answer:
      "W większości biur tak - AgentSpace obejmuje CRM klientów, wspólną bazę nieruchomości, cele, prowizje, zadania i dokumenty. Jeśli korzystasz z systemu do masowego eksportu ofert na portale, na razie warto zostawić go obok. Na rozmowie sprawdzamy to konkretnie na Twoim przypadku.",
  },
  {
    question: "Ile trwa wdrożenie i kto je robi?",
    answer:
      "Jeden dzień roboczy. Zakładamy konto, wgrywamy bazę klientów i nieruchomości, zapraszamy agentów i konfigurujemy cele pod Twój model pracy. Robimy to razem z Tobą - nie zostawiamy Cię z pustym systemem.",
  },
  {
    question: "Czy agenci to zaakceptują?",
    answer:
      "Agenci przyjmują narzędzia, które im pomagają, i odrzucają te, które ich kontrolują. Dlatego AgentSpace zaczyna od tego, co daje agentowi: plan dnia, gotowe follow-upy pisane przez AI, widoczny postęp celu i trening przed trudną rozmową. Panel właściciela jest efektem ubocznym ich codziennej pracy, a nie osobnym raportowaniem.",
  },
  {
    question: "Czy musimy nagrywać rozmowy z prawdziwymi klientami?",
    answer:
      "Nie. AI Coach to symulacje - agent ćwiczy z klientem AI, nie z prawdziwym. Zero ryzyka RODO po stronie Twoich klientów. Analiza prawdziwych nagrań jest na mapie drogowej i będzie opcjonalna.",
  },
  {
    question: "Gdzie są przechowywane dane biura?",
    answer:
      "Na serwerach w Unii Europejskiej (Frankfurt). Dane Twojego biura są odseparowane od danych innych biur, a dostęp do nich mają wyłącznie zaproszeni przez Ciebie użytkownicy, zgodnie z rolą: CEO, menedżer, agent.",
  },
  {
    question: "Czy jest umowa na czas określony?",
    answer:
      "Nie. Rozliczenie miesięczne, rezygnujesz kiedy chcesz. Nie chcemy trzymać biura umową - jeśli system nie daje wartości, powinieneś móc odejść.",
  },
];

/* ── Strona ────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="mk relative min-h-screen">
      <SiteNav />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 pt-[132px] pb-16 md:pt-[156px] md:pb-20">
        <AuroraBackground />
        <Spotlight />

        <div className="relative z-10 mx-auto flex max-w-[1120px] flex-col items-center text-center">
          <FadeIn>
            <p className="mk-eyebrow mb-7">Dla biur nieruchomości w Polsce</p>
          </FadeIn>

          <FadeIn delay={0.08}>
            <h1 className="max-w-[17ch]">
              System operacyjny
              <br />
              <span className="grad">dla biura nieruchomości</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.16}>
            <p className="mt-7 max-w-[54ch] text-lg leading-relaxed text-[var(--color-mk-muted)]">
              Klienci, nieruchomości, cele, prowizje i trening zespołu w jednym
              miejscu. Twoi agenci pracują w jednym systemie, a Ty{" "}
              <span className="text-[var(--color-mk-text)]">
                pierwszy raz widzisz biuro w liczbach
              </span>
              .
            </p>
          </FadeIn>

          <FadeIn delay={0.24}>
            <div className="mt-11 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <Magnetic strength={0.24}>
                <Button href="/kontakt">Umów rozmowę</Button>
              </Magnetic>
              <Magnetic strength={0.18}>
                <Button href="#moduly" variant="ghost">
                  Zobacz, co jest w środku
                </Button>
              </Magnetic>
            </div>
          </FadeIn>

          <FadeIn delay={0.32}>
            <p className="mt-7 text-sm text-[var(--color-mk-muted)]">
              Wdrożenie w jeden dzień · Bez umowy na czas określony
            </p>
          </FadeIn>

          {/* Pasek liczb - ożywia hero i od razu daje konkret */}
          <FadeIn delay={0.4} className="mt-14 w-full">
            <div className="mx-auto grid max-w-3xl gap-0 sm:grid-cols-3">
              {FACTS.map((fact, i) => (
                <div
                  key={fact.label}
                  className={`px-6 py-6 ${
                    i > 0 ? "sm:border-l sm:border-white/[0.07]" : ""
                  }`}
                >
                  <p className="mb-1.5 text-4xl font-semibold md:text-5xl">
                    <span className="grad">
                      {fact.value}
                      {fact.suffix}
                    </span>
                  </p>
                  <p className="text-sm leading-snug text-[var(--color-mk-muted)]">
                    {fact.label}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── WARTOŚCI ── */}
      <Section>
        <SectionHead
          eyebrow="Po co to biuru"
          title={
            <>
              Trzy rzeczy, które zmieniają się{" "}
              <span className="grad">od pierwszego miesiąca</span>
            </>
          }
        />

        <StaggerContainer className="mt-12 grid gap-5 md:grid-cols-3">
          {VALUES.map((value) => (
            <StaggerItem key={value.title}>
              <GlowCard className="mk-card h-full rounded-[20px] p-8">
                <h4 className="mb-3">{value.title}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {value.body}
                </p>
              </GlowCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* ── MODUŁY ── */}
      <Section id="moduly">
        <SectionHead
          eyebrow="Moduły"
          title={
            <>
              Sześć modułów, <span className="grad">jeden system</span>
            </>
          }
          lead="Nie musisz wdrażać wszystkiego naraz. Większość biur zaczyna od CRM i celów, resztę włącza w kolejnych tygodniach."
        />

        <StaggerContainer className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => (
            <StaggerItem key={mod.name}>
              <a href={`/produkt/${mod.slug}`} className="block h-full">
                <GlowCard className="mk-card group/card h-full rounded-[20px] p-8">
                  <h4 className="mb-3">{mod.name}</h4>
                  <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                    {mod.body}
                  </p>
                  <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-400">
                    Zobacz moduł
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform duration-300 group-hover/card:translate-x-1"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M3 10h13m0 0-5-5m5 5-5 5"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </p>
                </GlowCard>
              </a>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* ── JAK TO DZIAŁA ── */}
      <Section id="jak-to-dziala">
        <SectionHead
          eyebrow="Krok po kroku"
          title={
            <>
              Od rozmowy do pierwszych wniosków -{" "}
              <span className="grad">30 dni</span>
            </>
          }
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <FadeIn key={step.n} delay={i * 0.08}>
              <Card className="h-full p-8">
                <span className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 font-mono text-sm font-semibold text-emerald-400 ring-1 ring-emerald-500/25">
                  {step.n}
                </span>
                <h4 className="mb-3">{step.title}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {step.body}
                </p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── PROBLEMY ── */}
      <Section>
        <SectionHead
          eyebrow="Znasz to"
          title={
            <>
              Trzy rzeczy, które kosztują biuro{" "}
              <span className="grad">najwięcej</span>
            </>
          }
          lead="Żadnej z nich nie widać w rachunku wyników. Wszystkie widać w liczbie transakcji."
        />

        <StaggerContainer className="mt-12 grid gap-5 md:grid-cols-3">
          {PROBLEMS.map((problem) => (
            <StaggerItem key={problem.title}>
              <Card className="h-full p-8">
                <span
                  aria-hidden="true"
                  className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/10 ring-1 ring-rose-500/25"
                >
                  <svg className="h-5 w-5 text-rose-400" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 8.5v4.5m0 3.5h.01M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.4h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h4 className="mb-3">{problem.title}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {problem.body}
                </p>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* ── PORÓWNANIE ── */}
      <Section>
        <SectionHead
          eyebrow="Porównanie"
          title={
            <>
              Ten sam dzień w biurze, <span className="grad">dwa scenariusze</span>
            </>
          }
        />
        <div className="mt-12">
          <Compare />
        </div>
      </Section>

      {/* ── PROGRAM PIERWSZYCH 10 BIUR ── */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <Card accent className="overflow-hidden p-8 md:p-14">
              {/* Poświaty w rogach - karta ma być najjaśniejszym punktem strony */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl"
              />

              <div className="relative flex flex-col items-center text-center">
                <p className="mk-eyebrow mb-7">Program Pierwszych 10 Biur</p>
                <h3 className="max-w-[20ch]">
                  Przyjmujemy <span className="grad">jedno biuro na miasto</span>
                </h3>
                <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  Wdrażamy powoli i z każdym biurem pracujemy indywidualnie -
                  dlatego przyjmujemy ograniczoną liczbę biur, po jednym na
                  miasto (w Warszawie i Krakowie po jednym na dzielnicę).
                </p>

                <ul className="mt-10 flex w-full max-w-md flex-col gap-4 text-left">
                  {[
                    "Wyłączność na Twoje miasto na czas trwania umowy",
                    "Wdrożenie 1:1 z założycielem, nie z działem supportu",
                    "Wpływ na mapę drogową - budujemy pod realne potrzeby biur",
                    "Cena zamrożona na 24 miesiące",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-[0.9375rem] leading-snug text-[var(--color-mk-muted)]"
                    >
                      <Tick />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-11">
                  <Magnetic strength={0.2}>
                    <Button href="/kontakt">
                      Sprawdź, czy Twoje miasto jest wolne
                    </Button>
                  </Magnetic>
                </div>
              </div>
            </Card>
          </FadeIn>
        </div>
      </Section>

      {/* ── KLIENT ZERO ── */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHead eyebrow="Klient zero" title="Buduję to dla własnego biura" />

          <FadeIn delay={0.1}>
            <Card className="mt-12 p-8 md:p-12">
              <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start md:gap-10">
                <div className="flex justify-center md:justify-start">
                  <div className="relative">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 opacity-45 blur-xl"
                    />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-2xl font-bold text-zinc-950">
                      W
                    </div>
                  </div>
                </div>

                <div>
                  <svg
                    aria-hidden="true"
                    className="mb-4 h-7 w-7 text-emerald-400/45"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>

                  <p className="text-lg leading-relaxed text-[var(--color-mk-text)]">
                    Prowadzę biuro nieruchomości{" "}
                    <span className="font-medium">Spectra</span> w Krakowie. Znam
                    ten moment, w którym dobry agent odchodzi i zabiera ze sobą
                    pół bazy - i wiem, ile to kosztuje biuro.{" "}
                    <span className="grad font-medium">
                      AgentSpace to system, którego sam potrzebowałem od lat.
                    </span>{" "}
                    Buduję go dla swojego biura i udostępniam biurom, które
                    mierzą się z tym samym.
                  </p>

                  <div className="mt-8 flex items-center gap-4">
                    <div className="h-px w-10 bg-gradient-to-r from-emerald-400/70 to-transparent" />
                    <div>
                      <p className="text-[0.9375rem] font-medium text-[var(--color-mk-text)]">
                        Wiktor Szostek
                      </p>
                      <p className="text-sm text-[var(--color-mk-muted)]">
                        Założyciel · Spectra Nieruchomości, Kraków
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </FadeIn>
        </div>
      </Section>

      {/* ── CENNIK ── */}
      <Section id="cennik">
        <SectionHead
          eyebrow="Cennik"
          title={
            <>
              Płacisz za wielkość biura, <span className="grad">nie za moduły</span>
            </>
          }
          lead="Każdy pakiet zawiera komplet funkcji ze swojego poziomu. Bez dopłat za użytkownika w trakcie miesiąca."
        />
        <div className="mt-12">
          <Pricing />
        </div>
      </Section>

      {/* ── DLA KOGO NIE JEST ── */}
      <Section>
        <SectionHead
          eyebrow="Szczerze"
          title="AgentSpace nie jest dla każdego biura"
          lead="Lepiej powiedzieć to teraz niż po trzech miesiącach."
        />

        <StaggerContainer className="mt-12 grid gap-5 md:grid-cols-3">
          {NOT_FOR.map((item) => (
            <StaggerItem key={item.title}>
              <Card className="h-full p-8">
                <span
                  aria-hidden="true"
                  className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/10"
                >
                  <svg
                    className="h-4.5 w-4.5 text-zinc-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ width: 18, height: 18 }}
                  >
                    <path
                      d="M6 18 18 6M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <h4 className="mb-3">{item.title}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {item.body}
                </p>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq">
        <div className="mx-auto max-w-3xl">
          <SectionHead eyebrow="Pytania" title="Najczęściej pytają o to" />

          <StaggerContainer className="mt-12 flex flex-col gap-3" staggerDelay={0.05}>
            {FAQ.map((item) => (
              <StaggerItem key={item.question}>
                <details className="mk-card group px-6 py-5 md:px-8 [&[open]]:bg-white/[0.03]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[1.0625rem] font-medium text-[var(--color-mk-text)]">
                    {item.question}
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.05] transition-all duration-300 group-open:rotate-180 group-open:bg-emerald-500/15">
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4 text-[var(--color-mk-muted)] transition-colors group-open:text-emerald-400"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M5 7.5 10 12.5 15 7.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-4 max-w-[62ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                    {item.answer}
                  </p>
                </details>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </Section>

      {/* ── CTA ── */}
      <Section className="pb-32">
        <FadeIn>
          <div className="relative flex flex-col items-center overflow-hidden rounded-[28px] px-6 py-20 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/12 blur-[100px]"
            />

            <div className="relative">
              <h2 className="max-w-[20ch]">
                Gotowy <span className="grad">uporządkować biuro</span>?
              </h2>
              <p className="mx-auto mt-6 max-w-[48ch] text-[1.0625rem] leading-relaxed text-[var(--color-mk-muted)]">
                30 minut rozmowy. Sprawdzimy, gdzie Twoje biuro traci transakcje
                - wnioski dostajesz niezależnie od tego, czy zaczniemy
                współpracę.
              </p>
              <div className="mt-11 flex justify-center">
                <Magnetic strength={0.24}>
                  <Button href="/kontakt">Umów rozmowę</Button>
                </Magnetic>
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      <SiteFooter />
    </div>
  );
}
