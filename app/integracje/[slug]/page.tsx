import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "../../components/site-nav";
import { SiteFooter } from "../../components/site-footer";
import { PageHero } from "../../components/page-hero";
import { FrameRule } from "../../components/mk/frame";
import { Card, Button, Section, SectionHead, Tick } from "../../components/mk/ui";
import {
  INTEGRATIONS,
  STATUS_LABEL,
  getIntegration,
} from "@/lib/marketing/integrations";

export function generateStaticParams() {
  return INTEGRATIONS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const integration = getIntegration(slug);
  if (!integration) return {};

  const title = `AgentSpace + ${integration.name} - integracja dla biur nieruchomości`;
  const description = `Jak połączyć ${integration.fullName} z AgentSpace: co się synchronizuje, dla kogo ma to sens i jak wygląda wdrożenie. Status: ${STATUS_LABEL[integration.status].toLowerCase()}.`;

  return {
    title,
    description,
    alternates: { canonical: `https://agentspace.pl/integracje/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://agentspace.pl/integracje/${slug}`,
    },
  };
}

export default async function IntegracjaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const integration = getIntegration(slug);
  if (!integration) notFound();

  const isLive = integration.status === "live";
  const others = INTEGRATIONS.filter((i) => i.slug !== slug);

  return (
    <div className="mk relative min-h-screen">
      <SiteNav />

      <PageHero
        eyebrow={`Integracja · ${STATUS_LABEL[integration.status]}`}
        title={`AgentSpace + ${integration.name}`}
        description={integration.about}
      />

      {/* Uczciwy komunikat o statusie - nie udajemy gotowej integracji. */}
      {!isLive && (
        <Section className="py-0">
          <Card accent className="p-6 md:p-8">
            <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
              <span className="font-medium text-[var(--color-mk-text)]">
                Ta integracja jest {STATUS_LABEL[integration.status].toLowerCase()}.
              </span>{" "}
              Kolejność prac ustalamy według zgłoszeń od biur - jeśli pracujesz
              na {integration.name}, daj znać. Biura, które zgłoszą się teraz,
              wdrażamy jako pierwsze i konsultujemy z nimi zakres synchronizacji.
            </p>
          </Card>
        </Section>
      )}

      <FrameRule className="mt-20" />

      <Section>
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <SectionHead
              align="left"
              eyebrow="Zakres"
              title={isLive ? "Co się synchronizuje" : "Co będzie się synchronizować"}
            />
            <ul className="mt-8 flex flex-col gap-4">
              {integration.syncs.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-[0.9375rem] leading-snug text-[var(--color-mk-muted)]"
                >
                  <Tick />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHead
              align="left"
              eyebrow="Po co"
              title="Dlaczego biura to łączą"
            />
            <p className="mt-8 text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
              {integration.why}
            </p>
          </div>
        </div>
      </Section>

      <FrameRule />

      <Section>
        <SectionHead
          eyebrow="Podział ról"
          title={`Co robi ${integration.name}, a co AgentSpace`}
          lead="Systemy się nie dublują - każdy odpowiada za inny etap pracy biura."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <Card className="p-8">
            <h4 className="mb-5">{integration.name}</h4>
            <ul className="flex flex-col gap-3 text-[0.9375rem] text-[var(--color-mk-muted)]">
              <li>Baza ofert i ich prezentacja</li>
              <li>Eksport na portale ogłoszeniowe</li>
              <li>Dokumentacja oferty</li>
            </ul>
          </Card>

          <Card accent className="p-8">
            <h4 className="mb-5">AgentSpace</h4>
            <ul className="flex flex-col gap-3 text-[0.9375rem] text-[var(--color-mk-muted)]">
              <li>Praca zespołu: cele, lejek, zadania dnia</li>
              <li>Rozliczanie prowizji i karta transakcji</li>
              <li>Trening rozmów z AI Coachem</li>
              <li>Panel właściciela i raporty</li>
            </ul>
          </Card>
        </div>
      </Section>

      <Section>
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[24ch]">
            Pracujesz na {integration.name}
            <span className="accent">?</span>
          </h2>
          <p className="mt-5 max-w-[50ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
            Napisz, jak dziś wygląda u Ciebie obieg oferty i klienta. Powiem
            wprost, czy połączenie z AgentSpace ma w Twoim biurze sens.
          </p>
          <div className="mt-10">
            <Button href="/kontakt">Umów rozmowę</Button>
          </div>
        </div>
      </Section>

      <FrameRule />

      <Section className="pb-32">
        <SectionHead eyebrow="Pozostałe" title="Inne integracje" />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {others.map((other) => (
            <Link key={other.slug} href={`/integracje/${other.slug}`}>
              <Card className="h-full p-6">
                <p className="mb-1 text-[1.0625rem] font-medium text-[var(--color-mk-text)]">
                  {other.name}
                </p>
                <p className="text-sm text-[var(--color-mk-muted)]">
                  {STATUS_LABEL[other.status]}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
