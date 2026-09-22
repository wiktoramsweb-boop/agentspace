import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { PageHero } from "../components/page-hero";
import { FrameRule } from "../components/mk/frame";
import { Card, Section, SectionHead } from "../components/mk/ui";
import { WZORY } from "@/lib/wzory/themes";

export const metadata: Metadata = {
  title: "Strony internetowe dla biur nieruchomości | wzory | AgentSpace",
  description:
    "Gotowe wzory stron dla biur nieruchomości i deweloperów. Oferty z CRM trafiają na stronę automatycznie, a formularze ze strony wracają do systemu jako kontakty i poszukiwania.",
  alternates: { canonical: "https://agentspace.pl/wzory" },
  openGraph: {
    title: "Strony dla biur nieruchomości | AgentSpace",
    description:
      "Wzory stron połączonych z CRM: oferta dodana w systemie jest na stronie w tej samej minucie, a zapytanie ze strony ląduje u agenta.",
    url: "https://agentspace.pl/wzory",
  },
};

const HOW: [string, string, string][] = [
  [
    "01",
    "Wybierasz wzór",
    "Cztery projekty, każdy inny: od redakcyjnego premium po wyszukiwarkę dla biura z setkami ofert. Zmieniamy kolory, kroje i teksty pod Wasze logo.",
  ],
  [
    "02",
    "Podłączamy Waszą bazę",
    "Strona czyta oferty prosto z AgentSpace. Agent zaznacza w ofercie „publikuj” i po chwili jest ona na stronie, ze zdjęciami po obróbce i znakiem wodnym biura.",
  ],
  [
    "03",
    "Formularze wracają do CRM",
    "Zapytanie o ofertę, zgłoszenie nieruchomości i zlecenie poszukiwania tworzą w systemie kontakt, zadanie i przypisanie do agenta. Nic nie ginie w skrzynce.",
  ],
  [
    "04",
    "Domena i hosting po naszej stronie",
    "Podpinamy Waszą domenę, certyfikat i kopie zapasowe. Strona działa tak długo, jak trwa abonament, bez osobnego serwera i bez aktualizowania wtyczek.",
  ],
];

const DIFF: [string, string][] = [
  ["Bez WordPressa i wtyczek", "Nie ma czego łatać ani co się nie zaktualizuje. Strona to część systemu, nie kolejne oprogramowanie do pilnowania."],
  ["Oferty zawsze aktualne", "Zmiana ceny w CRM zmienia cenę na stronie. Sprzedana oferta znika ze strony sama."],
  ["Zdjęcia raz, wszędzie", "Ten sam zestaw zdjęć ze znakiem wodnym idzie na stronę, do PDF dla klienta i na portale."],
  ["Szybkość i Google", "Strony budujemy statycznie, więc ładują się w ułamku sekundy, co Google traktuje jako sygnał rankingowy."],
  ["Ulubione i historia", "Odwiedzający odkłada oferty do ulubionych, a agent widzi przy kontakcie, co ten człowiek oglądał."],
  ["Jeden abonament", "Strona, CRM i obsługa w jednej cenie. Bez faktur od trzech różnych firm co miesiąc."],
];

export default function WzoryPage() {
  return (
    <div className="mk relative min-h-screen">
      <SiteNav />

      <PageHero
        eyebrow="Strony internetowe"
        title="Strona biura połączona z systemem, a nie obok niego"
        description="Wybieracie wzór, my podłączamy Waszą bazę ofert i domenę. Oferta dodana w AgentSpace jest na stronie od razu, a zapytanie ze strony ląduje u konkretnego agenta."
      />

      <FrameRule />

      <Section>
        <SectionHead
          eyebrow="Wzory"
          title="Cztery projekty, cztery różne biura"
          lead="To nie są warianty kolorystyczne tego samego szablonu. Każdy ma własną typografię, siatkę i rytm, bo biuro premium i biuro z setkami mieszkań na wynajem potrzebują czegoś innego."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {WZORY.map((w) => (
            <Card key={w.slug} className="flex h-full flex-col overflow-hidden !p-0">
              <Link href={`/wzory/${w.slug}`} className="relative block aspect-[16/9] overflow-hidden">
                <Image
                  src={w.preview}
                  alt={`Podgląd wzoru ${w.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition duration-500 hover:scale-[1.03]"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(180deg, transparent 30%, ${w.swatch[0]}D9 100%)` }}
                />
                <span
                  className="absolute bottom-4 left-5 text-2xl font-medium"
                  style={{ color: w.swatch[1], fontFamily: w.dark ? "Georgia, serif" : undefined }}
                >
                  {w.office}
                </span>
              </Link>

              <div className="flex flex-1 flex-col p-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex gap-1.5" aria-hidden="true">
                  {w.swatch.map((c) => (
                    <span key={c} className="h-6 w-6 rounded-full border border-white/10" style={{ background: c }} />
                  ))}
                </span>
                <span className="text-xs text-[var(--color-mk-muted)]">{w.fonts}</span>
              </div>

              <h3 className="mb-2 text-2xl font-medium text-[var(--color-mk-text)]">{w.name}</h3>
              <p className="mb-4 text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">{w.tagline}</p>

              <p className="mb-5 text-xs uppercase tracking-wider text-[var(--color-mk-muted)]">Dla kogo: {w.forWhom}</p>

              <ul className="mb-7 grid gap-2 text-[0.9375rem] text-[var(--color-mk-muted)]">
                {w.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span className="text-[var(--color-mk-accent)]">·</span>
                    {h}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-wrap gap-3">
                <Link
                  href={`/wzory/${w.slug}`}
                  className="rounded-xl bg-[var(--color-mk-accent)] px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:brightness-110"
                >
                  Zobacz wzór
                </Link>
                <Link
                  href={`/wzory/${w.slug}/oferty`}
                  className="rounded-xl border border-[var(--color-mk-line)] px-5 py-2.5 text-sm font-medium text-[var(--color-mk-text)] transition hover:border-[var(--color-mk-line-lit)]"
                >
                  Lista ofert
                </Link>
              </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <FrameRule />

      <Section>
        <SectionHead eyebrow="Jak to działa" title="Od wyboru wzoru do działającej strony" />
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {HOW.map(([n, t, d]) => (
            <Card key={n} className="h-full p-8">
              <p className="mb-4 font-mono text-xs text-[var(--color-mk-accent)]">{n}</p>
              <h4 className="mb-3 text-xl text-[var(--color-mk-text)]">{t}</h4>
              <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">{d}</p>
            </Card>
          ))}
        </div>
      </Section>

      <FrameRule />

      <Section>
        <SectionHead
          eyebrow="Czym się różnimy"
          title="Dlaczego nie robimy tego na WordPressie"
          lead="Większość stron dla biur to WordPress z wtyczką do ofert. Działa, dopóki ktoś pilnuje aktualizacji, kopii i wydajności. My poszliśmy inną drogą."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {DIFF.map(([t, d]) => (
            <Card key={t} className="h-full p-7">
              <h4 className="mb-3 text-lg text-[var(--color-mk-text)]">{t}</h4>
              <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">{d}</p>
            </Card>
          ))}
        </div>
      </Section>

      <FrameRule />

      <Section>
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="mb-5 text-3xl font-medium text-[var(--color-mk-text)] md:text-4xl">
            Chcecie zobaczyć swoje oferty w tym wzorze?
          </h2>
          <p className="mb-8 text-[var(--color-mk-muted)]">
            Przygotujemy podgląd na Waszych ofertach i logo, zanim cokolwiek podpiszecie. Wystarczy nam eksport z
            obecnego systemu albo link do Waszej strony.
          </p>
          <Link
            href="/kontakt"
            className="inline-flex rounded-xl bg-[var(--color-mk-accent)] px-7 py-3.5 font-semibold text-emerald-950 transition hover:brightness-110"
          >
            Zamów podgląd na swoich ofertach
          </Link>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
