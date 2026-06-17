import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";

export const metadata: Metadata = {
  title: "O AgentSpace — Polska platforma szkolenia agentów RE | AgentSpace",
  description:
    "Kto, dlaczego i po co buduje AgentSpace. Historia foundera, klient zero, filozofia produktu. Polska platforma dla biur nieruchomości.",
  alternates: {
    canonical: "https://agentspace.pl/o-nas",
  },
};

export default function ONas() {
  return (
    <>
      <SiteNav />
      <main className="bg-zinc-950 text-white">
        {/* Header */}
        <section className="border-b border-zinc-900 px-6 pt-32 pb-16">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              O AgentSpace
            </p>
            <h1 className="mb-6 text-4xl font-semibold tracking-tight md:text-5xl">
              Polski produkt dla polskich biur — bez kompromisów
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-zinc-400 md:text-xl">
              AgentSpace nie jest kolejnym SaaS-em &quot;dla nieruchomości&quot; tłumaczonym z angielskiego.
              Jest budowany w Krakowie, dla biur w Polsce, przez kogoś kto na co dzień prowadzi
              biuro nieruchomości i wie, co konkretnie boli.
            </p>
          </div>
        </section>

        {/* Founder story */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/60 to-zinc-900/20 p-8 md:p-12">
              <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start md:gap-10">
                <div className="flex justify-center md:justify-start">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 blur-xl opacity-50" />
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-4xl font-bold text-zinc-950">
                      W
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium uppercase tracking-[0.15em] text-emerald-400">
                    Founder
                  </p>
                  <h2 className="mb-4 text-2xl font-semibold text-white">
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
                      AgentSpace to system, którego sam potrzebowałem od dawna. Buduję go
                      dla mojego biura — i otwieram go dla innych biur, które mają ten sam
                      problem.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filozofia */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Filozofia produktu
            </p>
            <h2 className="mb-12 text-3xl font-semibold tracking-tight md:text-4xl">
              Cztery rzeczy, w które wierzymy
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {PRINCIPLES.map((principle) => (
                <div
                  key={principle.title}
                  className="rounded-2xl border border-zinc-900 bg-zinc-900/30 p-8"
                >
                  <p className="mb-4 text-3xl font-semibold text-emerald-400">
                    {principle.number}
                  </p>
                  <h3 className="mb-3 text-xl font-semibold text-white">
                    {principle.title}
                  </h3>
                  <p className="leading-relaxed text-zinc-400">{principle.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Co dalej
            </p>
            <h2 className="mb-12 text-3xl font-semibold tracking-tight md:text-4xl">
              Roadmap najbliższych 12 miesięcy
            </h2>

            <div className="space-y-6">
              {ROADMAP.map((item) => (
                <div key={item.period} className="flex gap-6 md:gap-8">
                  <div className="flex-shrink-0">
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-mono text-emerald-300">
                      {item.period}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="text-zinc-400">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
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
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

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
