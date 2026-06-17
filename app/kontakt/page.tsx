import type { Metadata } from "next";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { ContactForm } from "../components/contact-form";

export const metadata: Metadata = {
  title: "Kontakt | AgentSpace",
  description:
    "Skontaktuj się z zespołem AgentSpace. Pytania o szkolenie agentów nieruchomości, AI Coach, pilotaż dla biur. Odpowiadamy w 24h.",
  alternates: {
    canonical: "https://agentspace.pl/kontakt",
  },
};

const CONTACT_ITEMS = [
  {
    label: "Email",
    value: "nieruchomoscispectra@gmail.com",
    href: "mailto:nieruchomoscispectra@gmail.com",
  },
  {
    label: "Adres",
    value: "ul. Zbożowa 2/1, 30-002 Kraków",
  },
  {
    label: "Czas odpowiedzi",
    value: "do 24h w dni robocze",
  },
];

export default function Kontakt() {
  return (
    <>
      <SiteNav />
      <main className="bg-zinc-950 text-white">
        {/* Header */}
        <section className="border-b border-zinc-900 px-6 pt-32 pb-16">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Kontakt
            </p>
            <h1 className="mb-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Porozmawiajmy o Twoim biurze
            </h1>
            <p className="max-w-2xl text-lg text-zinc-400">
              Pytanie o AgentSpace, propozycja pilotażu, współpraca? Napisz — odpowiadamy w 24h.
            </p>
          </div>
        </section>

        {/* Contact info + form */}
        <section className="border-b border-zinc-900 px-6 py-20">
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1fr_1.2fr]">
            {/* Info column */}
            <div>
              <h2 className="mb-6 text-xl font-semibold text-white">Informacje kontaktowe</h2>

              <dl className="space-y-6">
                {CONTACT_ITEMS.map((item) => (
                  <div key={item.label}>
                    <dt className="mb-1 text-xs uppercase tracking-[0.15em] text-zinc-500">
                      {item.label}
                    </dt>
                    <dd className="text-zinc-200">
                      {item.href ? (
                        <a
                          href={item.href}
                          className="transition hover:text-emerald-400"
                        >
                          {item.value}
                        </a>
                      ) : (
                        item.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
                <h3 className="mb-3 text-base font-semibold text-white">
                  Operator AgentSpace
                </h3>
                <div className="space-y-1 text-sm text-zinc-400">
                  <p>
                    <span className="text-zinc-200">Spectra Nieruchomości</span>
                  </p>
                  <p>ul. Zbożowa 2/1</p>
                  <p>30-002 Kraków</p>
                  <p className="pt-2 font-mono text-xs">NIP: 6772516327</p>
                  <p className="font-mono text-xs">REGON: 529666353</p>
                  <p className="pt-3 text-zinc-500">
                    Founder:{" "}
                    <span className="text-zinc-200">Wiktor Szostek</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Form column */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 md:p-10">
              <h2 className="mb-6 text-xl font-semibold text-white">Napisz do nas</h2>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
