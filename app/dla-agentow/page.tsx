import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { PageHero } from "../components/page-hero";
import { FadeIn, StaggerContainer, StaggerItem } from "../components/fade-in";

export const metadata: Metadata = {
  title: "Dla agentów nieruchomości — co zyskasz z AgentSpace",
  description:
    "AgentSpace z perspektywy agenta nieruchomości. Trening cold calli z AI, plan dnia, tracking prowizji, ranking. Mniej stresu, więcej zamknięć, wyższa prowizja.",
  alternates: {
    canonical: "https://agentspace.pl/dla-agentow",
  },
};

const BENEFITS = [
  {
    icon: ShieldIcon,
    title: "Ćwicz najtrudniejsze rozmowy bez ryzyka",
    body: "Nie musisz uczyć się na prawdziwych klientach. AI Coach gra klienta z różnymi osobowościami. Po sesji wiesz dokładnie, co poprawić. Po 30 dniach Twoje rozmowy z prawdziwymi klientami są pewniejsze, krótsze, skuteczniejsze.",
  },
  {
    icon: ClockIcon,
    title: "15 min/dzień > 4-godzinne szkolenie raz na kwartał",
    body: "Mózg uczy się przez powtarzanie. 15 min treningu codziennie przez miesiąc to 7.5 godziny wprawki — i każdą z nich pamiętasz. Warsztat raz na kwartał? Zapomnisz w 2 tygodnie.",
  },
  {
    icon: TargetIcon,
    title: "Konkretny feedback, nie 'ogólnie nieźle'",
    body: "Po każdej sesji scoring 1–10 w 4 kategoriach (otwarcie, kwalifikacja, obsługa obiekcji, zamknięcie) plus 2-3 konkretne wskazówki: 'nie zapytałeś o timeline', 'za wcześnie zaproponowałeś prowizję'.",
  },
  {
    icon: ChartIcon,
    title: "Plan dnia + tracking prowizji = mniej Excela",
    body: "Codzienne miejsce pracy: lista zadań, statystyki dnia, postęp do celu miesięcznego, prowizja w czasie rzeczywistym. Wszystko w jednym, nie w 7 zakładkach.",
  },
  {
    icon: TrendingUpIcon,
    title: "Widzisz, że rośniesz",
    body: "Po 30 dniach widzisz swoją krzywą: score sesji, zamknięcia, prowizja. Konkretne dane, nie 'czuję, że jest lepiej'. To dosłownie motywujące — i ułatwia rozmowy o awansie/podwyżce.",
  },
];

const FAQ_AGENT = [
  {
    q: "Czy mój szef będzie widział, ile zarabiam i ile rozmów odbyłem?",
    a: "Tak — w zakresie wyników biura. Ale to działa w obie strony: lepsze wyniki = silniejsza pozycja do negocjacji prowizji, awansu, lepszych leadów. Najlepsi agenci kochają widoczność — bo wygrywają z nią.",
  },
  {
    q: "Czy muszę nagrywać prawdziwych klientów?",
    a: "Nie. AI Coach to symulacje z AI klientem, nie nagrywanie prawdziwych rozmów. Pełna prywatność.",
  },
  {
    q: "Ile to mi zajmie dziennie?",
    a: "15 minut. W aucie między oględzinami, w biurze przed pierwszym telefonem, w domu po pracy. Wybierz moment, który Ci pasuje.",
  },
  {
    q: "Co jeśli słabo idzie? Czy szef zobaczy moją porażkę?",
    a: "Szef widzi Twoje wyniki w zespole — średni score, liczba sesji, trend. Nie widzi treści Twoich rozmów ani konkretnych pomyłek. Sesje są prywatne.",
  },
];

export default function DlaAgentow() {
  return (
    <>
      <SiteNav />
      <main className="bg-zinc-950 text-white">
        <PageHero
          eyebrow="Dla agentów nieruchomości"
          title="Mniej stresu, więcej zamknięć, wyższa prowizja"
          description="AgentSpace to nie kolejny system kontroli 'dla szefa'. To Twoje codzienne narzędzie — żeby ćwiczyć trudne rozmowy bez ryzyka, widzieć swój postęp, zarabiać więcej."
        />

        {/* Benefits — grid z ikonami */}
        <section className="border-b border-zinc-900 px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <h2 className="mb-12 text-3xl font-semibold tracking-tight md:text-4xl">
                Co konkretnie zyskasz
              </h2>
            </FadeIn>

            <StaggerContainer className="grid gap-6 md:grid-cols-2" staggerDelay={0.1}>
              {BENEFITS.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <StaggerItem key={benefit.title}>
                    <div className="group relative h-full overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/30 p-8 transition-all hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-zinc-900/50 hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.2)]">
                      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl transition-all duration-500 group-hover:bg-emerald-500/15" />

                      <div className="relative">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition-all group-hover:scale-110 group-hover:bg-emerald-500/20">
                          <Icon />
                        </div>
                        <h3 className="mb-3 text-lg font-semibold text-white md:text-xl">
                          {benefit.title}
                        </h3>
                        <p className="leading-relaxed text-zinc-400">{benefit.body}</p>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-zinc-900 px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl">
            <FadeIn>
              <h2 className="mb-12 text-3xl font-semibold tracking-tight md:text-4xl">
                Pytania, które agenci zadają najczęściej
              </h2>
            </FadeIn>

            <div className="space-y-4">
              {FAQ_AGENT.map((item, index) => (
                <FadeIn key={item.q} delay={index * 0.05}>
                  <details className="group rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6 transition-all open:bg-zinc-900/50">
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

        {/* CTA */}
        <section className="px-6 py-20">
          <FadeIn>
            <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-zinc-900/50 p-8 text-center md:p-12">
              <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
                Powiedz szefowi o AgentSpace
              </h2>
              <p className="mb-8 text-zinc-400">
                Jeśli prowadzisz/pracujesz w biurze, które chciałbyś, żeby wdrożyło AgentSpace —
                wyślij szefowi link do strony. Pierwsze 10 biur dostaje 3 miesiące za darmo.
              </p>
              <Link
                href="/#waitlist"
                className="inline-flex items-center rounded-xl bg-emerald-500 px-8 py-4 font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                Pokaż listę oczekujących →
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  );
}
