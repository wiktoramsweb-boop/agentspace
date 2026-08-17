import type { Metadata } from "next";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { FrameRule } from "../components/mk/frame";
import { Card, Button, Section, SectionHead } from "../components/mk/ui";
import { Pricing } from "../components/mk/pricing";
import { FadeIn } from "../components/fade-in";

export const metadata: Metadata = {
  title: "Cennik | AgentSpace dla biur nieruchomości",
  description:
    "Trzy pakiety: Start 499 zł, Pro 899 zł, Biuro od 1490 zł miesięcznie. Cena zależy od liczby agentów, nie od liczby modułów. Bez umowy na czas określony.",
  alternates: { canonical: "https://agentspace.pl/cennik" },
  openGraph: {
    title: "Cennik | AgentSpace dla biur nieruchomości",
    description:
      "Start 499 zł, Pro 899 zł, Biuro od 1490 zł miesięcznie. Płacisz za wielkość biura, nie za moduły.",
    url: "https://agentspace.pl/cennik",
  },
};

const FAQ = [
  {
    q: "Co się dzieje, gdy zatrudnię kolejnego agenta?",
    a: "Nic w trakcie miesiąca - nie doliczamy opłat za użytkownika. Jeśli zespół przekroczy limit pakietu na stałe, przy kolejnym rozliczeniu przechodzimy na wyższy pakiet. Odzywamy się wcześniej, nie robimy tego po cichu.",
  },
  {
    q: "Czy jest okres próbny?",
    a: "Zamiast klasycznego triala robimy wdrożenie pilotażowe: pierwszy miesiąc pracujemy razem na Twoich danych. Jeśli po nim uznasz, że system nie daje wartości - kończymy bez faktury za kolejny okres.",
  },
  {
    q: "Czy mogę zapłacić za rok z góry?",
    a: "Tak, przy rozliczeniu rocznym dwa miesiące są gratis. Dla biur z Programu Pierwszych 10 Biur cena jest dodatkowo zamrożona na 24 miesiące.",
  },
  {
    q: "Czy są koszty wdrożenia?",
    a: "W pakietach Start i Pro nie ma opłaty wdrożeniowej. W pakiecie Biuro wdrożenie 1:1 i szkolenie zespołu wyceniamy indywidualnie, w zależności od liczby oddziałów.",
  },
  {
    q: "Co z danymi, jeśli zrezygnuję?",
    a: "Eksportujemy całą bazę klientów, nieruchomości i transakcji do plików, które otworzysz w Excelu. Dane są Twoje - nie trzymamy biura zakładnikiem bazy.",
  },
];

export default function CennikPage() {
  return (
    <div className="mk relative min-h-screen">
      <SiteNav />

      <section className="px-6 pt-[136px] pb-16 md:pt-[168px]">
        <div className="mx-auto flex max-w-[1080px] flex-col items-center text-center">
          <FadeIn>
            <p className="mk-eyebrow mb-6">Cennik</p>
          </FadeIn>
          <FadeIn delay={0.06}>
            <h1 className="max-w-[20ch]">
              Płacisz za wielkość biura, nie za moduły
            </h1>
          </FadeIn>
          <FadeIn delay={0.12}>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-[var(--color-mk-muted)]">
              Każdy pakiet zawiera komplet funkcji ze swojego poziomu. Bez
              dopłat za użytkownika w trakcie miesiąca i bez umowy na czas
              określony.
            </p>
          </FadeIn>
        </div>
      </section>

      <Section className="pt-4">
        <Pricing />
      </Section>

      <FrameRule />

      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHead eyebrow="Pytania o rozliczenia" title="Zanim zapytasz" />

          <div className="mt-12">
            {FAQ.map((item, i) => (
              <Card key={item.q} className={i > 0 ? "border-t-0" : ""}>
                <details className="group px-6 py-5 md:px-8">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[1.0625rem] font-medium text-[var(--color-mk-text)]">
                    {item.q}
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
                    {item.a}
                  </p>
                </details>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section className="pb-32">
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[20ch]">Nie wiesz, który pakiet?</h2>
          <p className="mt-5 max-w-[46ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
            Napisz, ilu masz agentów i jak dziś pracujecie. Powiem wprost, czy
            AgentSpace ma u Ciebie sens.
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
