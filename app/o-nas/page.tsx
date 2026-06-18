import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { PageHero } from "../components/page-hero";
import { Timeline } from "../components/timeline";
import { FadeIn, StaggerContainer, StaggerItem } from "../components/fade-in";
import { TiltCard } from "../components/effects/tilt-card";

export const metadata: Metadata = {
  title: "O AgentSpace — Polska platforma szkolenia agentów RE | AgentSpace",
  description:
    "Kto, dlaczego i po co buduje AgentSpace. Historia foundera, klient zero, filozofia produktu. Polska platforma dla biur nieruchomości.",
  alternates: {
    canonical: "https://agentspace.pl/o-nas",
  },
};

const PRINCIPLES = [
  {
    number: "01",
    title: "Polski produkt, polski język",
    body: "Nie tłumaczymy z angielskiego. Skrypty, scenariusze, obiekcje, feedback — wszystko po polsku, z polską specyfiką. Bo Twój klient nie mówi 'I'd like to make an offer'.",
  },
  {
    number: "02",
    title: "Codzienność > eventy",
    body: "Lepsze 15 minut treningu dziennie niż 4-godzinne szkolenie raz na kwartał. Mózg uczy się przez powtarzanie, nie przez intensywność.",
  },
  {
    number: "03",
    title: "Dane > intuicja",
    body: "Decyzje o rozwoju zespołu mają być oparte o liczby — kto rośnie, gdzie są luki. Nie o przeczucia, kto 'wygląda na obiecującego'.",
  },
  {
    number: "04",
    title: "Klient zero przed klientem 100",
    body: "Każda funkcja jest najpierw testowana w Spectrze. Jeśli nie pomaga moim agentom, nie wchodzi do produktu. Dopiero potem otwieramy ją innym biurom.",
  },
];

const ROADMAP = [
  {
    period: "Q1 2026",
    title: "Wczesny dostęp dla pierwszych 10 biur",
    body: "AI Coach z 5 podstawowymi scenariuszami, dashboard agenta, panel właściciela.",
  },
  {
    period: "Q2 2026",
    title: "Publiczna premiera",
    body: "Otwarte zapisy, marketing, partnerstwa branżowe, rozbudowa scenariuszy.",
  },
  {
    period: "Q3 2026",
    title: "Integracja z kalendarzem Google",
    body: "Plan dnia agenta synchronizowany ze spotkaniami, automatyczne notatki post-spotkanie.",
  },
  {
    period: "Q4 2026",
    title: "Tracking umów i KPI",
    body: "Integracja z popularnymi CRM-ami (Asari, Galactica), automatyczne raporty miesięczne.",
  },
];

export default function ONas() {
  return (
    <>
      <SiteNav />
      <main className="bg-zinc-950 text-white">
        <PageHero
          eyebrow="O AgentSpace"
          title="Polski produkt dla polskich biur — bez kompromisów"
          description="AgentSpace nie jest kolejnym SaaS-em 'dla nieruchomości' tłumaczonym z angielskiego. Jest budowany w Krakowie, dla biur w Polsce, przez kogoś kto na co dzień prowadzi biuro nieruchomości i wie, co konkretnie boli."
        />

        {/* Founder story z TiltCard */}
        <section className="border-b border-zinc-900 px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <TiltCard className="rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/60 to-zinc-900/20 p-8 backdrop-blur-xl md:p-12">
                <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start md:gap-12">
                  {/* Avatar — duży, animowany glow */}
                  <div className="flex justify-center md:justify-start">
                    <div className="relative">
                      {/* Outer glow rings */}
                      <div className="absolute inset-0 -m-4 animate-pulse rounded-full bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 blur-2xl" />
                      <div className="absolute inset-0 -m-2 rounded-full bg-gradient-to-br from-emerald-400/40 to-cyan-400/40 blur-lg" />

                      {/* Main avatar */}
                      <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-5xl font-bold text-zinc-950 shadow-2xl">
                        W
                      </div>

                      {/* Online dot */}
                      <div className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950">
                        <div className="relative h-3 w-3">
                          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <div className="relative h-3 w-3 rounded-full bg-emerald-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quote */}
                  <div>
                    <p className="mb-2 text-sm font-medium uppercase tracking-[0.15em] text-emerald-400">
                      Founder
                    </p>
                    <h2 className="mb-4 text-2xl font-semibold text-white md:text-3xl">
                      Wiktor Szostek
                    </h2>
                    <div className="space-y-4 leading-relaxed text-zinc-300">
                      <p>
                        Prowadzę biuro nieruchomości{" "}
                        <strong className="text-white">Spectra</strong> w Krakowie. Codziennie
                        pracuję z agentami, klientami sprzedającymi, kupującymi, doradcami
                        kredytowymi, prawnikami. Widzę dokładnie to, czego nie widać ze świata
                        software house&apos;ów: ile czasu agent traci, jak wygląda zła rozmowa
                        z klientem, gdzie pęka konwersja.
                      </p>
                      <p>
                        Przez ostatnie lata próbowałem różnych rozwiązań — szkolenia stacjonarne,
                        mentoring, książki, podcasty. Większość kosztuje, mało co rzeczywiście
                        zmienia codzienność agenta. Najlepsi w branży uczą się w bólu, przez
                        setki spalonych leadów. Najsłabsi odchodzą po sześciu miesiącach.
                      </p>
                      <p>
                        AgentSpace to system, którego sam potrzebowałem od dawna. Buduję go dla
                        mojego biura — i otwieram go dla innych biur, które mają ten sam problem.
                      </p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </FadeIn>
          </div>
        </section>

        {/* Filozofia */}
        <section className="border-b border-zinc-900 px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <div className="mb-12 max-w-2xl">
                <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                  Filozofia produktu
                </p>
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Cztery rzeczy, w które wierzymy
                </h2>
              </div>
            </FadeIn>

            <StaggerContainer className="grid gap-6 md:grid-cols-2" staggerDelay={0.1}>
              {PRINCIPLES.map((principle) => (
                <StaggerItem key={principle.title}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/30 p-8 transition-all hover:border-emerald-500/30 hover:bg-zinc-900/50">
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl transition-all duration-500 group-hover:bg-emerald-500/10" />

                    <div className="relative">
                      <p className="mb-4 bg-gradient-to-br from-emerald-400 to-cyan-400 bg-clip-text text-5xl font-semibold text-transparent">
                        {principle.number}
                      </p>
                      <h3 className="mb-3 text-xl font-semibold text-white">
                        {principle.title}
                      </h3>
                      <p className="leading-relaxed text-zinc-400">{principle.body}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Roadmap — animowany timeline */}
        <section className="border-b border-zinc-900 px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl">
            <FadeIn>
              <div className="mb-12 max-w-2xl">
                <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                  Co dalej
                </p>
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Roadmap najbliższych 12 miesięcy
                </h2>
              </div>
            </FadeIn>

            <Timeline items={ROADMAP} />
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
          <FadeIn>
            <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-zinc-900/50 p-8 text-center md:p-12">
              <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
                Chcesz dołączyć jako jedno z pierwszych 10 biur?
              </h2>
              <p className="mb-8 text-zinc-400">
                3 miesiące za darmo + 30% rabatu na pierwszy rok. Plus wpływ na rozwój produktu.
              </p>
              <Link
                href="/#waitlist"
                className="inline-flex items-center rounded-xl bg-emerald-500 px-8 py-4 font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                Dołącz do listy oczekujących →
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
