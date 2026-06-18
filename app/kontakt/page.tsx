import type { Metadata } from "next";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { ContactForm } from "../components/contact-form";
import { PageHero } from "../components/page-hero";
import { FadeIn } from "../components/fade-in";

export const metadata: Metadata = {
  title: "Kontakt | AgentSpace",
  description:
    "Skontaktuj się z zespołem AgentSpace. Pytania o szkolenie agentów nieruchomości, AI Coach, pilotaż dla biur. Odpowiadamy w 24h.",
  alternates: {
    canonical: "https://agentspace.pl/kontakt",
  },
};

const QUICK_TOPICS = [
  {
    title: "Pilotaż",
    body: "Chcesz pierwsze 3 miesiące za darmo + 30% rabatu?",
    cta: "Wybierz w formularzu temat 'Pilotaż'",
  },
  {
    title: "Demo",
    body: "Pokażemy konkretnie jak AgentSpace zadziała u Was — 30 min.",
    cta: "Wybierz w formularzu temat 'Demo'",
  },
  {
    title: "Inne",
    body: "Współpraca, media, pomysł, krytyka — wszystko czytamy.",
    cta: "Napisz po prostu — odpowiemy",
  },
];

export default function Kontakt() {
  return (
    <>
      <SiteNav />
      <main className="bg-zinc-950 text-white">
        <PageHero
          eyebrow="Kontakt"
          title="Porozmawiajmy o Twoim biurze"
          description="Pytanie o AgentSpace, propozycja pilotażu, współpraca? Napisz — odpowiadamy w 24h w dni robocze."
          compact
        />

        {/* Quick topics — co możesz napisać */}
        <section className="border-b border-zinc-900 px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-4 md:grid-cols-3">
              {QUICK_TOPICS.map((topic, index) => (
                <FadeIn key={topic.title} delay={index * 0.08}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6 transition-all hover:border-emerald-500/30 hover:bg-zinc-900/50">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/5 blur-xl transition-all duration-500 group-hover:bg-emerald-500/15" />
                    <div className="relative">
                      <h3 className="mb-2 text-lg font-semibold text-white">{topic.title}</h3>
                      <p className="mb-4 text-sm text-zinc-400">{topic.body}</p>
                      <p className="text-xs text-emerald-400">{topic.cta}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Contact info + form */}
        <section className="border-b border-zinc-900 px-6 py-20 md:py-24">
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1fr_1.3fr]">
            {/* Info column */}
            <FadeIn>
              <div className="sticky top-24 space-y-8">
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-white">
                    Jak nas znaleźć
                  </h2>

                  <div className="space-y-5">
                    <ContactInfoRow
                      label="Email"
                      value="nieruchomoscispectra@gmail.com"
                      href="mailto:nieruchomoscispectra@gmail.com"
                      icon={<MailIcon />}
                    />
                    <ContactInfoRow
                      label="Adres"
                      value="ul. Zbożowa 2/1, 30-002 Kraków"
                      icon={<PinIcon />}
                    />
                    <ContactInfoRow
                      label="Czas odpowiedzi"
                      value="do 24h w dni robocze"
                      icon={<ClockIcon />}
                    />
                  </div>
                </div>

                {/* Operator card */}
                <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-zinc-900/20 p-6 backdrop-blur-xl">
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
                  <div className="relative">
                    <h3 className="mb-3 text-base font-semibold text-white">
                      Operator AgentSpace
                    </h3>
                    <div className="space-y-1 text-sm text-zinc-400">
                      <p className="text-zinc-200">Spectra Nieruchomości</p>
                      <p>ul. Zbożowa 2/1, 30-002 Kraków</p>
                      <p className="pt-2 font-mono text-xs text-zinc-500">NIP: 6772516327</p>
                      <p className="font-mono text-xs text-zinc-500">REGON: 529666353</p>
                      <p className="pt-3 text-zinc-500">
                        Founder:{" "}
                        <span className="text-zinc-200">Wiktor Szostek</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Form column */}
            <FadeIn delay={0.15}>
              <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-zinc-900/30 p-8 backdrop-blur-xl md:p-10">
                <h2 className="mb-6 text-xl font-semibold text-white">Napisz do nas</h2>
                <ContactForm />
              </div>
            </FadeIn>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function ContactInfoRow({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: string;
  href?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-emerald-400">
        {icon}
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-[0.15em] text-zinc-500">{label}</p>
        <p className="text-zinc-200">
          {href ? (
            <a href={href} className="transition hover:text-emerald-400">
              {value}
            </a>
          ) : (
            value
          )}
        </p>
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
