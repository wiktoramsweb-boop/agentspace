import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../components/site-footer";
import { FrameRule } from "../../components/mk/frame";
import { Card, Button, Section, SectionHead, Tick } from "../../components/mk/ui";
import { FadeIn } from "../../components/fade-in";
import { OFFERS, getOffer, getOfferPlan } from "@/lib/marketing/offers";

export function generateStaticParams() {
  return OFFERS.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const offer = getOffer(slug);
  if (!offer) return { robots: { index: false, follow: false } };

  return {
    title: `Oferta dla ${offer.officeName} — AgentSpace`,
    description: `Propozycja wdrożenia AgentSpace dla ${offer.officeName} (${offer.city}).`,
    // Strony ofertowe są prywatne — nie chcemy ich w wynikach wyszukiwania.
    robots: { index: false, follow: false },
  };
}

const STEPS = [
  {
    n: "01",
    title: "Wdrożenie",
    body: "Jeden dzień roboczy. Zakładamy konto, importujemy bazę klientów i nieruchomości, zapraszamy agentów, konfigurujemy cele i podział prowizji pod Wasz model.",
  },
  {
    n: "02",
    title: "Pierwsze dwa tygodnie",
    body: "Zespół pracuje w systemie, ja jestem dostępny na bieżąco. Poprawiamy konfigurację pod to, jak realnie pracujecie — nie pod to, jak zakładaliśmy.",
  },
  {
    n: "03",
    title: "Po 30 dniach",
    body: "Siadamy do danych: kto realizuje cele, gdzie giną leady, jak wyglądają rozmowy. Decydujecie, czy zostajemy — bez umowy na czas określony.",
  },
];

export default async function OfertaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const offer = getOffer(slug);
  if (!offer) notFound();

  const plan = getOfferPlan(offer);
  const price = offer.customPrice ?? plan.price;
  const yearly = price * 10; // rozliczenie roczne = 2 miesiące gratis

  return (
    <div className="mk relative min-h-screen">
      {/* Bez nawigacji — to strona jednego celu, nie miejsce do przeglądania. */}
      <section className="relative overflow-hidden px-6 pt-24 pb-16 md:pt-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[820px] -translate-x-1/2 opacity-[0.25]"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 40%, rgba(47,109,246,0.35) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-[1080px]">
          <FadeIn>
            <p className="mk-eyebrow mb-6">
              Oferta przygotowana dla: {offer.officeName}, {offer.city}
            </p>
          </FadeIn>

          <FadeIn delay={0.06}>
            <h1 className="max-w-[22ch]">
              Cześć {offer.contactFirstName}
              <span className="accent">.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.12}>
            <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-[var(--color-mk-muted)]">
              {offer.intro}
            </p>
          </FadeIn>
        </div>
      </section>

      <FrameRule />

      {/* Co usłyszałem */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHead
            align="left"
            eyebrow="Z naszej rozmowy"
            title="To, co u Was dziś nie działa"
          />
          <ul className="mt-8 flex flex-col gap-4">
            {offer.painPoints.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 text-[1.0625rem] leading-snug text-[var(--color-mk-muted)]"
              >
                <Tick />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-[58ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
            Każdy z tych punktów AgentSpace zamyka w ramach jednego systemu —
            bez dokładania kolejnego narzędzia obok.
          </p>
        </div>
      </Section>

      {/* Propozycja */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHead
            eyebrow="Propozycja"
            title={`Pakiet ${plan.name} dla ${offer.agents} agentów`}
          />

          <Card accent className="mt-12 p-8 md:p-12">
            <div className="flex flex-col gap-8">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-5xl font-medium text-[var(--color-mk-text)] md:text-6xl">
                  {price}
                </span>
                <span className="text-lg text-[var(--color-mk-muted)]">
                  zł netto / miesiąc
                </span>
              </div>

              <p className="text-[0.9375rem] text-[var(--color-mk-muted)]">
                Przy rozliczeniu rocznym:{" "}
                <span className="text-[var(--color-mk-text)]">
                  {yearly} zł
                </span>{" "}
                — dwa miesiące gratis.
              </p>

              <div className="h-px bg-[var(--color-mk-line)]" />

              <ul className="flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-[0.9375rem] leading-snug text-[var(--color-mk-muted)]"
                  >
                    <Tick />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="h-px bg-[var(--color-mk-line)]" />

              <ul className="flex flex-col gap-3">
                {[
                  "Wdrożenie i import bazy — bez opłaty",
                  "Wyłączność na Wasze miasto w ramach Programu Pierwszych 10 Biur",
                  "Cena zamrożona na 24 miesiące",
                  "Bez umowy na czas określony",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[0.9375rem] leading-snug text-[var(--color-mk-text)]"
                  >
                    <Tick />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <p className="mt-6 text-center text-sm text-[var(--color-mk-muted)]">
            Oferta ważna do {offer.validUntil}.
          </p>
        </div>
      </Section>

      <FrameRule />

      {/* Jak to wygląda */}
      <Section>
        <SectionHead eyebrow="Co dalej" title="Jak wygląda start" />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <Card key={step.n} className="h-full p-8">
              <p className="mb-6 font-mono text-sm text-[var(--color-mk-accent)]">
                {step.n}
              </p>
              <h4 className="mb-3">{step.title}</h4>
              <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                {step.body}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="pb-32">
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[22ch]">Zaczynamy?</h2>
          <p className="mt-5 max-w-[48ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
            Odpisz na maila albo zadzwoń — ustalimy termin wdrożenia. Jeśli coś
            wymaga doprecyzowania, też daj znać.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button href="mailto:nieruchomoscispectra@gmail.com">
              Odpisz na ofertę
            </Button>
            <Button href="/kontakt" variant="ghost">
              Umów rozmowę
            </Button>
          </div>

          <p className="mt-10 text-sm text-[var(--color-mk-muted)]">
            Wiktor Szostek · AgentSpace
          </p>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
