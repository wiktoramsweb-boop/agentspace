import { FadeIn, StaggerContainer, StaggerItem } from "./components/fade-in";
import Link from "next/link";
import { SiteNav } from "./components/site-nav";
import { BrowserShot, MkMarquee, PhotoTile, ShotTabs, TemplateTile } from "./components/mk/showcase";
import { Beams, RevealWords, SpotlightCard, StickySteps, Ticker, TiltPhoto } from "./components/mk/motion-bits";
import {
  ShotCele,
  ShotDokumenty,
  ShotKalendarz,
  ShotKlient,
  ShotOferty,
  ShotPanel,
  ShotProwizje,
  ShotPulpit,
} from "./components/mockups/light-shots";
import { CoachLive } from "./components/mk/coach-live";
import { WZORY } from "@/lib/wzory/themes";
import { SITE_ADDON } from "@/lib/site/addon";
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
    photo: "/wzory/dziedziniec.jpg",
    title: "Rozmowa i audyt biura",
    body: "30 minut. Sprawdzamy, jak dziś wygląda obieg leada w Twoim biurze i gdzie realnie tracisz transakcje. Dostajesz wnioski niezależnie od tego, czy zaczniemy współpracę.",
  },
  {
    n: "02",
    photo: "/wzory/schody.jpg",
    title: "Wdrożenie w jeden dzień",
    body: "Zakładamy konto biura, wgrywamy bazę klientów i nieruchomości, zapraszamy agentów. Konfigurujemy cele i lejek pod Twój model pracy. Bez instalacji, bez działu IT.",
  },
  {
    n: "03",
    photo: "/wzory/miasto-noc.jpg",
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
      "Tak. System działa na produkcji i jest codziennie używany w biurach nieruchomości, między innymi w Spectrze w Krakowie, gdzie powstaje. Wdrożenie nowego biura zajmuje jeden dzień roboczy.",
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
      <section className="relative overflow-hidden px-6 pt-[120px] pb-14 md:pt-[148px] md:pb-20">
        <AuroraBackground />
        <Spotlight />

        <div className="relative z-10 mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div>
            <FadeIn>
              <p className="mk-eyebrow mb-6">Dla biur nieruchomości w Polsce</p>
            </FadeIn>

            <FadeIn delay={0.08}>
              <h1 className="max-w-[15ch] !text-left">
                Całe biuro <span className="grad">w jednym miejscu</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.16}>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-[var(--color-mk-muted)]">
                Klienci, oferty, cele, prowizje i strona internetowa biura. Agenci pracują w jednym systemie, a Ty{" "}
                <span className="text-[var(--color-mk-text)]">pierwszy raz widzisz biuro w liczbach</span>.
              </p>
            </FadeIn>

            <FadeIn delay={0.24}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Magnetic strength={0.24}>
                  <Button href="/kontakt">Umów rozmowę</Button>
                </Magnetic>
                <Magnetic strength={0.18}>
                  <Button href="#w-srodku" variant="ghost">
                    Zobacz, jak to wygląda
                  </Button>
                </Magnetic>
              </div>
            </FadeIn>

            <FadeIn delay={0.32}>
              <p className="mt-6 text-sm text-[var(--color-mk-muted)]">
                Wdrożenie w jeden dzień · Bez umowy na czas określony · Polski produkt
              </p>
            </FadeIn>

            <FadeIn delay={0.4} className="mt-10">
              <div className="grid max-w-lg grid-cols-3 gap-0">
                {FACTS.map((fact, i) => (
                  <div key={fact.label} className={`pr-5 ${i > 0 ? "border-l border-[var(--mk-hairline)] pl-5" : ""}`}>
                    <p className="mb-1 text-3xl font-semibold md:text-4xl">
                      <span className="grad">
                        <Ticker value={fact.value} suffix={fact.suffix} />
                      </span>
                    </p>
                    <p className="text-[0.8125rem] leading-snug text-[var(--color-mk-muted)]">{fact.label}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Podgląd produktu zamiast kolejnego akapitu: w trzy sekundy widać,
              czy to wygląda jak coś, w czym agent chce pracować. */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-10 -z-10 opacity-60"
              style={{ background: "radial-gradient(50% 50% at 60% 40%, rgba(16,185,129,0.22), transparent 70%)" }}
            />
            <BrowserShot label="agentspace.pl/app" tilt>
              <ShotPulpit />
            </BrowserShot>
          </div>
        </div>
      </section>

      <div className="py-6">
        <MkMarquee
          items={["Klienci", "Nieruchomości", "Cele", "Prowizje", "Kalendarz", "Dokumenty", "AI Coach", "Strona www"]}
        />
      </div>

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
          {MODULES.map((mod, i) => (
            <StaggerItem key={mod.name} className={i === 0 ? "lg:col-span-2" : ""}>
              <SpotlightCard href={`/produkt/${mod.slug}`} className="p-8">
                <div className="flex h-full flex-col">
                  <h4 className="mb-3">{mod.name}</h4>
                  <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                    {mod.body}
                  </p>
                  <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-mk-accent)]">
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
                </div>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      {/* ── W ŚRODKU: jasna przerwa z podglądem produktu ── */}
      <section id="w-srodku" className="mk-paper py-24 md:py-32">
        <div className="mx-auto max-w-[1240px] px-6">
          <p className="mk-eyebrow mb-5">Tak to wygląda w środku</p>
          <h2 className="max-w-[22ch] text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.08] tracking-[-0.03em]">
            Cały dzień biura w jednym systemie
          </h2>
          <p className="mt-5 max-w-[62ch] text-[1.0625rem] leading-relaxed mk-soft">
            Od porannego planu, przez oferty i prezentacje, po prowizje i dokumenty u notariusza. Poniżej osiem
            ekranów, z których zespół korzysta codziennie. Kliknij, żeby zobaczyć każdy z nich.
          </p>

          <div className="mt-12">
            <ShotTabs
              tabs={[
                {
                  key: "pulpit",
                  label: "Pulpit agenta",
                  note: "Cele dnia, zadania i prowizja w jednym widoku. Agent wie, co ma zrobić dziś, zanim wypije kawę.",
                  node: <ShotPulpit />,
                },
                {
                  key: "nieruchomosci",
                  label: "Oferty",
                  note: "Wspólna baza ofert ze zdjęciami po obróbce i znakiem wodnym biura. Jedno zaznaczenie publikuje ofertę na stronie biura i na portalach.",
                  node: <ShotOferty />,
                },
                {
                  key: "klienci",
                  label: "Karta klienta",
                  note: "Cała historia kontaktu w jednym miejscu: telefony, prezentacje i ustalenia. Kolejna rozmowa dopina się do tej samej historii, zamiast tworzyć drugi kontakt.",
                  node: <ShotKlient />,
                },
                {
                  key: "cele",
                  label: "Cele",
                  note: "Cel roczny rozbity aż do dziennego: telefony, rozmowy, spotkania, umowy. Agent widzi, ile mu zostało dziś, a nie w abstrakcyjnym kwartale.",
                  node: <ShotCele />,
                },
                {
                  key: "kalendarz",
                  label: "Kalendarz",
                  note: "Spotkania, prezentacje i telefony w jednym widoku, razem z rytmem dnia: o której zespół faktycznie dzwoni i kiedy odbiera najwięcej osób.",
                  node: <ShotKalendarz />,
                },
                {
                  key: "prowizje",
                  label: "Transakcje",
                  note: "Pięć etapów transakcji, komplet dokumentów i prowizja licząca się sama, razem z podziałem między agentów.",
                  node: <ShotProwizje />,
                },
                {
                  key: "dokumenty",
                  label: "Dokumenty",
                  note: "Umowy, odpisy i świadectwa leżą przy ofercie i przy kliencie naraz. Linki do pobrania wygasają, więc nie krążą po WhatsAppie.",
                  node: <ShotDokumenty />,
                },
                {
                  key: "zespol",
                  label: "Panel właściciela",
                  note: "Prowizje, telefony i oferty w rozbiciu na ludzi. System sam podpowiada, kto wymaga rozmowy, zanim zrobi się problem.",
                  node: <ShotPanel />,
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── AI COACH: rozmowa, która odtwarza się sama ── */}
      <Section className="relative">
        <Beams />
        <div className="relative">
          <CoachLive />
        </div>
      </Section>

      {/* ── DZIEŃ W BIURZE: zdjęcia zamiast kolejnych kart z tekstem ── */}
      <Section>
        <SectionHead
          eyebrow="Dzień w biurze"
          title={
            <>
              Robota dzieje się <span className="grad">w terenie</span>, nie w tabelkach
            </>
          }
          lead="System ma być z boku, a nie zamiast pracy. Dlatego wszystko, co agent robi w ciągu dnia, zapisuje się jednym kliknięciem z telefonu."
        />

        <StaggerContainer className="mt-12 grid gap-5 md:grid-cols-3">
          <StaggerItem>
            <PhotoTile
              src="/wzory/kamienica.jpg"
              alt="Kamienica w centrum"
              title="Pozyskanie"
              body="Telefon do właściciela zapisuje się jako kontakt i od razu liczy do celu dziennego. Kolejna rozmowa z tym numerem dopina się do tej samej historii."
              className="aspect-[3/4]"
              priority
            />
          </StaggerItem>
          <StaggerItem>
            <PhotoTile
              src="/wzory/salon.jpg"
              alt="Salon w mieszkaniu"
              title="Prezentacja"
              body="Zdjęcia z sesji wrzucasz z telefonu, a system sam dokłada znak wodny biura i wysyła ofertę na stronę oraz na portale."
              className="aspect-[3/4]"
            />
          </StaggerItem>
          <StaggerItem>
            <PhotoTile
              src="/wzory/schody.jpg"
              alt="Klatka schodowa"
              title="Transakcja"
              body="Umowa, zaświadczenia i prowizja w jednym miejscu. Rozliczenie z agentem liczy się samo, razem z podziałem i podatkiem."
              className="aspect-[3/4]"
            />
          </StaggerItem>
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

        <div className="mt-12">
          <StickySteps steps={STEPS} />
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
                <p className="mk-eyebrow mb-7">Wdrożenie</p>
                <h3 className="max-w-[20ch]">
                  Zaczynacie pracę <span className="grad">następnego dnia</span>
                </h3>
                <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  Wdrożenie prowadzimy sami, od początku do końca. Importujemy bazę
                  klientów i ofert, ustawiamy cele oraz podział prowizji pod Wasz
                  model i szkolimy zespół na Waszych danych.
                </p>

                <ul className="mt-10 flex w-full max-w-md flex-col gap-4 text-left">
                  {[
                    "Import bazy klientów i ofert z obecnego systemu",
                    "Szkolenie zespołu na Waszych danych, nie na przykładach",
                    "Opiekun, który odbiera telefon, a nie system zgłoszeń",
                    "Cena zamrożona na 24 miesiące przy umowie rocznej",
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
                    <Button href="/kontakt">Umów wdrożenie</Button>
                  </Magnetic>
                </div>
              </div>
            </Card>
          </FadeIn>
        </div>
      </Section>

      {/* ── SKĄD TO SIĘ WZIĘŁO ── */}
      {/* ── MANIFEST: zdanie odsłaniane przy przewijaniu + zdjęcia ── */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-16">
          <div>
            <p className="mk-eyebrow mb-7">Po ludzku</p>
            <RevealWords
              text="Nie sprzedajemy oprogramowania. Sprzedajemy spokojniejszy poniedziałek: wiesz, kto do kogo dzwoni, która oferta stoi i skąd realnie biorą się transakcje w Twoim biurze."
              className="text-[clamp(1.5rem,3.1vw,2.5rem)] font-medium leading-[1.25] tracking-[-0.025em] text-[var(--color-mk-text)]"
            />
            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {[
                ["Polski produkt", "Piszemy go w Krakowie, dla polskich biur i polskich umów."],
                ["Człowiek odbiera", "Piszesz do mnie, nie do systemu zgłoszeń. Odpowiadam tego samego dnia."],
                ["Zero lock-inu", "Twoje dane eksportujesz do Excela w każdej chwili, bez proszenia."],
              ].map(([t, d]) => (
                <div key={t}>
                  <p className="mb-1.5 font-medium text-[var(--color-mk-text)]">{t}</p>
                  <p className="text-sm leading-relaxed text-[var(--color-mk-muted)]">{d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TiltPhoto
              src="/wzory/kuchnia.jpg"
              alt="Wnętrze mieszkania"
              caption="Prezentacja, Podgórze"
              className="aspect-[3/4]"
            />
            <div className="grid gap-4 pt-10">
              <TiltPhoto src="/wzory/dom.jpg" alt="Dom" caption="Odbiór kluczy" className="aspect-square" />
              <TiltPhoto src="/wzory/taras.jpg" alt="Taras" caption="Sesja zdjęciowa" className="aspect-square" />
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHead eyebrow="Skąd to się wzięło" title="System napisany w biurze nieruchomości" />

          <FadeIn delay={0.1}>
            <Card className="mt-12 p-8 md:p-12">
              <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start md:gap-10">
                <div className="flex justify-center md:justify-start">
                  <div className="relative">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 opacity-45 blur-xl"
                    />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-2xl font-bold text-[var(--mk-on-accent)]">
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

      {/* ── STRONY WWW: osobny dodatek, ale wizualnie najmocniejszy argument ── */}
      <Section>
        <SectionHead
          eyebrow="Dodatek"
          title={
            <>
              Strona biura, która <span className="grad">sama się aktualizuje</span>
            </>
          }
          lead={`Osiem gotowych wzorów. Oferta dodana w systemie jest na stronie w tej samej minucie, a zapytanie ze strony wraca do CRM jako kontakt i zadanie dla agenta. Osobna usługa, ${SITE_ADDON.monthly} zł miesięcznie.`}
        />

        <StaggerContainer className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WZORY.slice(0, 4).map((w) => (
            <StaggerItem key={w.slug}>
              <TemplateTile
                href={`/wzory/${w.slug}`}
                photo={w.preview}
                name={w.name}
                forWhom={w.forWhom}
                swatch={[...w.swatch]}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button href="/wzory">Zobacz wszystkie osiem wzorów</Button>
          <Link href="/cennik" className="text-[0.9375rem] text-[var(--color-mk-muted)] underline-offset-4 hover:underline">
            Ile to kosztuje
          </Link>
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
                  className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--mk-surface-2)] ring-1 ring-white/10"
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
                <details className="mk-card group px-6 py-5 md:px-8 [&[open]]:bg-[var(--mk-surface-2)]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[1.0625rem] font-medium text-[var(--color-mk-text)]">
                    {item.question}
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--mk-surface-2)] transition-all duration-300 group-open:rotate-180 group-open:bg-emerald-500/15">
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
