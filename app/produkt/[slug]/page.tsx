import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "../../components/site-nav";
import { SiteFooter } from "../../components/site-footer";
import { PageHero } from "../../components/page-hero";
import { FrameRule } from "../../components/mk/frame";
import { Card, Button, Section, SectionHead } from "../../components/mk/ui";
import { MODULES, getModule } from "@/lib/marketing/modules";

export function generateStaticParams() {
  return MODULES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mod = getModule(slug);
  if (!mod) return {};

  return {
    title: mod.seoTitle,
    description: mod.seoDescription,
    alternates: { canonical: `https://agentspace.pl/produkt/${slug}` },
    openGraph: {
      title: mod.seoTitle,
      description: mod.seoDescription,
      url: `https://agentspace.pl/produkt/${slug}`,
    },
  };
}

export default async function ProduktPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mod = getModule(slug);
  if (!mod) notFound();

  const others = MODULES.filter((m) => m.slug !== slug);

  return (
    <div className="mk relative min-h-screen">
      <SiteNav />

      <PageHero
        eyebrow={`Moduł · ${mod.name}`}
        title={mod.headline}
        description={mod.lead}
      >
        <Button href="/kontakt">Umów rozmowę</Button>
      </PageHero>

      <FrameRule />

      {/* Problem */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHead align="left" eyebrow="Problem" title="Dlaczego to boli" />
          <p className="mt-8 text-lg leading-relaxed text-[var(--color-mk-muted)]">
            {mod.problem}
          </p>
        </div>
      </Section>

      {/* Możliwości */}
      <Section>
        <SectionHead eyebrow="Możliwości" title={`Co robi ${mod.name}`} />

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {mod.capabilities.map((cap) => (
            <Card key={cap.title} className="h-full p-8">
              <h4 className="mb-3">{cap.title}</h4>
              <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                {cap.body}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Dla kogo */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <Card accent className="p-8 md:p-12">
            <p className="mk-eyebrow mb-5">Dla kogo</p>
            <p className="text-lg leading-relaxed text-[var(--color-mk-text)]">
              {mod.forWhom}
            </p>
          </Card>
        </div>
      </Section>

      <FrameRule />

      {/* Pozostałe moduły */}
      <Section>
        <SectionHead
          eyebrow="Reszta systemu"
          title="Pozostałe moduły"
          lead="AgentSpace działa jako całość, ale wdrażasz go stopniowo - w tempie, które wytrzyma zespół."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {others.map((other) => (
            <Link key={other.slug} href={`/produkt/${other.slug}`}>
              <Card className="h-full p-6">
                <p className="mb-2 text-[1.0625rem] font-medium text-[var(--color-mk-text)]">
                  {other.name}
                </p>
                <p className="text-sm leading-snug text-[var(--color-mk-muted)]">
                  {other.headline}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="pb-32">
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[22ch]">Zobacz to na swoich danych</h2>
          <p className="mt-5 max-w-[50ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
            30 minut rozmowy. Pokażę, jak {mod.name.toLowerCase()} wyglądałby
            w Twoim biurze - na Twoich klientach i Twoim modelu prowizji.
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
