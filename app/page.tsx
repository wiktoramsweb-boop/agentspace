import { FadeIn, StaggerContainer, StaggerItem } from "./components/fade-in";
import { SiteNav } from "./components/site-nav";
import { SiteFooter } from "./components/site-footer";
import { Frame, FrameRule } from "./components/mk/frame";
import { Button, Section, SectionHead, Tick } from "./components/mk/ui";
import { Pricing } from "./components/mk/pricing";
import { Compare } from "./components/mk/compare";

/* ── Treść ─────────────────────────────────────────────────── */

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
    body: "Karty klientów z historią, notatkami i pipeline. Osobne typy: sprzedający, kupujący, wynajmujący, najemca. Baza zostaje w biurze, nie w telefonie agenta.",
  },
  {
    name: "Wspólna baza nieruchomości",
    body: "Oferty widoczne dla całego zespołu, ze zdjęciami i statusem. Agent od kupującego widzi, co ma kolega od sprzedającego.",
  },
  {
    name: "Cele i lejek sprzedaży",
    body: "Cel roczny rozbity na dzienny: telefony → spotkania → umowy → sprzedaże. Dzienny tracker, plan tygodnia i historia realizacji.",
  },
  {
    name: "Prowizje i transakcje",
    body: "Karta transakcji z pięcioma etapami i dokumentami. Prowizje liczą się same, cel miesięczny widać na bieżąco. Umowa rezerwacyjna generuje się do PDF.",
  },
  {
    name: "AI Coach",
    body: "Agent trenuje rozmowy z klientem AI — cold call, spotkanie pozyskowe, najem. 13 scenariuszy, 9 osobowości klienta, głos, scoring i feedback po polsku.",
  },
  {
    name: "Panel właściciela",
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
    body: "Wiesz, ile było transakcji. Nie wiesz, ile było telefonów, ile spotkań i który agent utknął dwa tygodnie temu — dopóki nie jest za późno.",
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
    body: "AgentSpace pokazuje dane i daje narzędzia, ale nie zarządza za Ciebie. Jeśli nikt nie spojrzy w panel raz w tygodniu i nie porozmawia z agentem, który słabnie — żaden system tego nie naprawi.",
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
      "Tak. Platforma działa na produkcji i jest codziennie używana w biurze Spectra Nieruchomości w Krakowie — to biuro założyciela i pierwszy klient produktu. Przyjmujemy kolejne biura w ramach Programu Pierwszych 10 Biur.",
  },
  {
    question: "Czy AgentSpace zastąpi mój obecny system?",
    answer:
      "W większości biur tak — AgentSpace obejmuje CRM klientów, wspólną bazę nieruchomości, cele, prowizje, zadania i dokumenty. Jeśli korzystasz z systemu do masowego eksportu ofert na portale, na razie warto zostawić go obok. Na rozmowie sprawdzamy to konkretnie na Twoim przypadku.",
  },
  {
    question: "Ile trwa wdrożenie i kto je robi?",
    answer:
      "Jeden dzień roboczy. Zakładamy konto, wgrywamy bazę klientów i nieruchomości, zapraszamy agentów i konfigurujemy cele pod Twój model pracy. Robimy to razem z Tobą — nie zostawiamy Cię z pustym systemem.",
  },
  {
    question: "Czy agenci to zaakceptują?",
    answer:
      "Agenci przyjmują narzędzia, które im pomagają, i odrzucają te, które ich kontrolują. Dlatego AgentSpace zaczyna od tego, co daje agentowi: plan dnia, gotowe follow-upy pisane przez AI, widoczny postęp celu i trening przed trudną rozmową. Panel właściciela jest efektem ubocznym ich codziennej pracy, a nie osobnym raportowaniem.",
  },
  {
    question: "Czy musimy nagrywać rozmowy z prawdziwymi klientami?",
    answer:
      "Nie. AI Coach to symulacje — agent ćwiczy z klientem AI, nie z prawdziwym. Zero ryzyka RODO po stronie Twoich klientów. Analiza prawdziwych nagrań jest na mapie drogowej i będzie opcjonalna.",
  },
  {
    question: "Gdzie są przechowywane dane biura?",
    answer:
      "Na serwerach w Unii Europejskiej (Frankfurt). Dane Twojego biura są odseparowane od danych innych biur, a dostęp do nich mają wyłącznie zaproszeni przez Ciebie użytkownicy, zgodnie z rolą: CEO, menedżer, agent.",
  },
  {
    question: "Czy jest umowa na czas określony?",
    answer:
      "Nie. Rozliczenie miesięczne, rezygnujesz kiedy chcesz. Nie chcemy trzymać biura umową — jeśli system nie daje wartości, powinieneś móc odejść.",
  },
];

/* ── Strona ────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="mk relative min-h-screen">
      <SiteNav />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 pt-[136px] pb-24 md:pt-[168px] md:pb-32">
        {/* Jedna, delikatna poświata — zamiast aurory i spotlightu */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 opacity-[0.28]"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 40%, rgba(47,109,246,0.35) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto flex max-w-[1080px] flex-col items-center text-center">
          <FadeIn>
            <p className="mk-eyebrow mb-6">Dla biur nieruchomości w Polsce</p>
          </FadeIn>

          <FadeIn delay={0.06}>
            <h1 className="max-w-[18ch]">
              System operacyjny dla biura nieruchomości
            </h1>
          </FadeIn>

          <FadeIn delay={0.12}>
            <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-[var(--color-mk-muted)]">
              Klienci, nieruchomości, cele, prowizje i trening zespołu w jednym
              miejscu. Twoi agenci pracują w jednym systemie, a Ty pierwszy raz
              widzisz biuro w liczbach.
            </p>
          </FadeIn>

          <FadeIn delay={0.18}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Button href="/kontakt">Umów rozmowę</Button>
              <Button href="#moduly" variant="ghost">
                Zobacz, co jest w środku
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={0.24}>
            <p className="mt-6 text-sm text-[var(--color-mk-muted)]">
              Wdrożenie w jeden dzień · Bez umowy na czas określony
            </p>
          </FadeIn>
        </div>
      </section>

      <FrameRule />

      {/* ── WARTOŚCI ── */}
      <Section>
        <SectionHead
          eyebrow="Po co to biuru"
          title="Trzy rzeczy, które zmieniają się od pierwszego miesiąca"
        />

        <StaggerContainer className="mt-14 grid gap-0 md:grid-cols-3">
          {VALUES.map((value) => (
            <StaggerItem key={value.title}>
              <Frame className="h-full p-8">
                <h4 className="mb-3">{value.title}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {value.body}
                </p>
              </Frame>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* ── MODUŁY ── */}
      <Section id="moduly">
        <SectionHead
          eyebrow="Moduły"
          title="Sześć modułów, jeden system"
          lead="Nie musisz wdrażać wszystkiego naraz. Większość biur zaczyna od CRM i celów, resztę włącza w kolejnych tygodniach."
        />

        <StaggerContainer className="mt-14 grid gap-0 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => (
            <StaggerItem key={mod.name}>
              <Frame interactive className="h-full p-8">
                <h4 className="mb-3">{mod.name}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {mod.body}
                </p>
              </Frame>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* ── JAK TO DZIAŁA ── */}
      <Section id="jak-to-dziala">
        <SectionHead
          eyebrow="Krok po kroku"
          title="Od rozmowy do pierwszych wniosków — 30 dni"
        />

        <div className="mt-14 grid gap-0 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <FadeIn key={step.n} delay={i * 0.06}>
              <Frame className="h-full p-8">
                <p className="mb-6 font-mono text-sm text-[var(--color-mk-accent)]">
                  {step.n}
                </p>
                <h4 className="mb-3">{step.title}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {step.body}
                </p>
              </Frame>
            </FadeIn>
          ))}
        </div>
      </Section>

      <FrameRule />

      {/* ── PROBLEMY ── */}
      <Section>
        <SectionHead
          eyebrow="Znasz to"
          title="Trzy rzeczy, które kosztują biuro najwięcej"
          lead="Żadna z nich nie widać w rachunku wyników. Wszystkie widać w liczbie transakcji."
        />

        <StaggerContainer className="mt-14 grid gap-0 md:grid-cols-3">
          {PROBLEMS.map((problem) => (
            <StaggerItem key={problem.title}>
              <Frame className="h-full p-8">
                <h4 className="mb-3">{problem.title}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {problem.body}
                </p>
              </Frame>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* ── PORÓWNANIE ── */}
      <Section>
        <SectionHead
          eyebrow="Porównanie"
          title="Ten sam dzień w biurze, dwa scenariusze"
        />
        <div className="mt-14">
          <Compare />
        </div>
      </Section>

      <FrameRule />

      {/* ── PROGRAM PIERWSZYCH 10 BIUR ── */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <Frame className="p-8 md:p-14">
            <div className="flex flex-col items-center text-center">
              <p className="mk-eyebrow mb-6">Program Pierwszych 10 Biur</p>
              <h3 className="max-w-[20ch]">
                Przyjmujemy jedno biuro na miasto
              </h3>
              <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                Wdrażamy powoli i z każdym biurem pracujemy indywidualnie —
                dlatego przyjmujemy ograniczoną liczbę biur, po jednym na miasto
                (w Warszawie i Krakowie po jednym na dzielnicę).
              </p>

              <ul className="mt-10 flex w-full max-w-md flex-col gap-4 text-left">
                {[
                  "Wyłączność na Twoje miasto na czas trwania umowy",
                  "Wdrożenie 1:1 z założycielem, nie z działem supportu",
                  "Wpływ na mapę drogową — budujemy pod realne potrzeby biur",
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

              <div className="mt-10">
                <Button href="/kontakt">Sprawdź, czy Twoje miasto jest wolne</Button>
              </div>
            </div>
          </Frame>
        </div>
      </Section>

      {/* ── KLIENT ZERO ── */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHead eyebrow="Klient zero" title="Buduję to dla własnego biura" />

          <Frame className="mt-12 p-8 md:p-12">
            <p className="text-lg leading-relaxed text-[var(--color-mk-text)] md:text-xl">
              Prowadzę biuro nieruchomości Spectra w Krakowie. Znam ten moment,
              w którym dobry agent odchodzi i zabiera ze sobą pół bazy — i wiem,
              ile to kosztuje biuro.{" "}
              <span className="text-[var(--color-mk-text)]">
                AgentSpace to system, którego sam potrzebowałem od lat.
              </span>{" "}
              Buduję go dla swojego biura i udostępniam biurom, które mierzą się
              z tym samym.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-px w-10 bg-[var(--color-mk-line-lit)]" />
              <div>
                <p className="text-[0.9375rem] font-medium text-[var(--color-mk-text)]">
                  Wiktor Szostek
                </p>
                <p className="text-sm text-[var(--color-mk-muted)]">
                  Założyciel · Spectra Nieruchomości, Kraków
                </p>
              </div>
            </div>
          </Frame>
        </div>
      </Section>

      <FrameRule />

      {/* ── CENNIK ── */}
      <Section id="cennik">
        <SectionHead
          eyebrow="Cennik"
          title="Płacisz za wielkość biura, nie za moduły"
          lead="Każdy pakiet zawiera komplet funkcji ze swojego poziomu. Bez dopłat za użytkownika w trakcie miesiąca."
        />
        <div className="mt-14">
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

        <StaggerContainer className="mt-14 grid gap-0 md:grid-cols-3">
          {NOT_FOR.map((item) => (
            <StaggerItem key={item.title}>
              <Frame className="h-full p-8">
                <h4 className="mb-3">{item.title}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {item.body}
                </p>
              </Frame>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq">
        <div className="mx-auto max-w-3xl">
          <SectionHead eyebrow="Pytania" title="Najczęściej pytają o to" />

          <div className="mt-12">
            {FAQ.map((item, i) => (
              <Frame key={item.question} className={i > 0 ? "border-t-0" : ""}>
                <details className="group px-6 py-5 md:px-8">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[1.0625rem] font-medium text-[var(--color-mk-text)]">
                    {item.question}
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5 flex-shrink-0 text-[var(--color-mk-muted)] transition-transform duration-200 group-open:rotate-180"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M5 7.5 10 12.5 15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </summary>
                  <p className="mt-4 max-w-[62ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                    {item.answer}
                  </p>
                </details>
              </Frame>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA ── */}
      <Section className="pb-32">
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[20ch]">
            Gotowy uporządkować biuro
            <span className="accent">?</span>
          </h2>
          <p className="mt-5 max-w-[48ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
            30 minut rozmowy. Sprawdzimy, gdzie Twoje biuro traci transakcje —
            wnioski dostajesz niezależnie od tego, czy zaczniemy współpracę.
          </p>
          <div className="mt-10">
            <Button href="/kontakt">Umów rozmowę</Button>
          </div>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
