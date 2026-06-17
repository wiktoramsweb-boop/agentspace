import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";

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
    title: "Ćwicz najtrudniejsze rozmowy bez ryzyka spalenia leada",
    body: "Nie musisz uczyć się na prawdziwych klientach. AI Coach gra klienta z różnymi osobowościami (agresywny, wahający, cenowy). Po sesji wiesz dokładnie, co poprawić. Po 30 dniach Twoje rozmowy z prawdziwymi klientami są inne — pewniejsze, krótsze, skuteczniejsze.",
  },
  {
    title: "Codzienne 15 minut > raz na kwartał 4-godzinne szkolenie",
    body: "Mózg uczy się przez powtarzanie. 15 minut treningu codziennie przez miesiąc to 7.5 godziny wprawki — i każdą z nich pamiętasz, bo ćwiczyłeś świeżo. Warsztat raz na kwartał? Zapomnisz w 2 tygodnie.",
  },
  {
    title: "Konkretny feedback, nie 'ogólnie nieźle, popracuj'",
    body: "Po każdej sesji dostajesz scoring 1-10 w 4 kategoriach (otwarcie, kwalifikacja, obsługa obiekcji, zamknięcie) plus 2-3 konkretne wskazówki: 'nie zapytałeś o timeline klienta', 'za wcześnie zaproponowałeś prowizję'. Wiesz, na czym pracować w przyszłym tygodniu.",
  },
  {
    title: "Plan dnia + tracking prowizji = mniej Excela, więcej focus",
    body: "Codzienne miejsce pracy: lista zadań, statystyki dnia, postęp do celu miesięcznego, prowizja w czasie rzeczywistym. Wszystko w jednym, nie w 7 zakładkach przeglądarki.",
  },
  {
    title: "Widzisz, że rośniesz",
    body: "Po 30 dniach widzisz swoją krzywą: score sesji, zamknięcia, prowizja. Konkretne dane, nie 'czuję, że jest lepiej'. To dosłownie motywujące — i ułatwia rozmowy o awansie/podwyżce z szefem.",
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
        {/* Header */}
        <section className="border-b border-zinc-900 px-6 pt-32 pb-16">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Dla agentów nieruchomości
            </p>
            <h1 className="mb-6 text-4xl font-semibold tracking-tight md:text-5xl">
              Mniej stresu, więcej zamknięć, wyższa prowizja
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
              AgentSpace to nie kolejny system kontroli &quot;dla szefa&quot;.
              To Twoje codzienne narzędzie — żeby ćwiczyć trudne rozmowy bez ryzyka,
              widzieć swój postęp, zarabiać więcej.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-3xl font-semibold tracking-tight md:text-4xl">
              Co konkretnie zyskasz
            </h2>

            <div className="space-y-6">
              {BENEFITS.map((benefit, index) => (
                <div
                  key={benefit.title}
                  className="flex gap-6 rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6 md:gap-8 md:p-8"
                >
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 font-mono text-sm font-bold text-emerald-400">
                      0{index + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-white md:text-xl">
                      {benefit.title}
                    </h3>
                    <p className="leading-relaxed text-zinc-400">{benefit.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-3xl font-semibold tracking-tight md:text-4xl">
              Pytania, które agenci zadają najczęściej
            </h2>

            <div className="space-y-4">
              {FAQ_AGENT.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6 transition-all open:bg-zinc-900/50"
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

        {/* CTA */}
        <section className="px-6 py-20">
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
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
