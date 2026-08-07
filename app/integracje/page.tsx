import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { PageHero } from "../components/page-hero";
import { Frame, FrameRule } from "../components/mk/frame";
import { Button, Section, SectionHead } from "../components/mk/ui";
import { INTEGRATIONS, STATUS_LABEL } from "@/lib/marketing/integrations";

export const metadata: Metadata = {
  title: "Integracje z systemami dla biur nieruchomości — AgentSpace",
  description:
    "AgentSpace łączy się z systemami, których biura nieruchomości używają na co dzień: Asari, Galactica, IMO, Estiman. Zachowujesz obieg ofert, zyskujesz zarządzanie zespołem.",
  alternates: { canonical: "https://agentspace.pl/integracje" },
  openGraph: {
    title: "Integracje — AgentSpace dla biur nieruchomości",
    description:
      "Asari, Galactica, IMO, Estiman. Zachowaj obieg ofert, dołóż zarządzanie zespołem.",
    url: "https://agentspace.pl/integracje",
  },
};

const STATUS_COLOR: Record<string, string> = {
  live: "text-emerald-400",
  "in-progress": "text-[var(--color-mk-accent)]",
  planned: "text-[var(--color-mk-muted)]",
};

export default function IntegracjePage() {
  return (
    <div className="mk relative min-h-screen">
      <SiteNav />

      <PageHero
        eyebrow="Integracje"
        title="Nie musisz porzucać systemu, który działa"
        description="Większość biur ma już gdzieś swoje oferty. AgentSpace nie każe migrować wszystkiego na start — łączymy się z systemami ofertowymi, żeby nie wpisywać tych samych danych dwa razy."
      />

      <FrameRule />

      <Section>
        <SectionHead
          eyebrow="Systemy"
          title="Z czym łączymy AgentSpace"
          lead="Status aktualizujemy na bieżąco. Jeśli Twojego systemu nie ma na liście — napisz, sprawdzimy możliwość połączenia."
        />

        <div className="mt-14 grid gap-0 md:grid-cols-2">
          {INTEGRATIONS.map((integration) => (
            <Link
              key={integration.slug}
              href={`/integracje/${integration.slug}`}
              className="group block"
            >
              <Frame interactive className="h-full p-8">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h4>{integration.name}</h4>
                  <span
                    className={`text-xs font-medium ${
                      STATUS_COLOR[integration.status]
                    }`}
                  >
                    {STATUS_LABEL[integration.status]}
                  </span>
                </div>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
                  {integration.about}
                </p>
                <p className="mt-6 inline-flex items-center gap-2 text-[0.9375rem] text-[var(--color-mk-accent)]">
                  Zobacz szczegóły
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M3 10h13m0 0-5-5m5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </p>
              </Frame>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="pb-32">
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[22ch]">Pracujesz na innym systemie?</h2>
          <p className="mt-5 max-w-[50ch] text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">
            Napisz, z czego korzysta Twoje biuro. Sprawdzimy, czy da się je
            połączyć z AgentSpace — a jeśli nie, powiem wprost.
          </p>
          <div className="mt-10">
            <Button href="/kontakt">Zapytaj o swój system</Button>
          </div>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
