/**
 * JSON-LD structured data dla Google rich snippets.
 * 3 schemy: SoftwareApplication, Organization, FAQPage.
 * Bez "use client" — to czysty HTML w SSR.
 */

const FAQ_ENTRIES = [
  {
    q: "Kiedy AgentSpace startuje?",
    a: "Pierwsza wersja w Q1 2026. Aktualnie pilotujemy z grupą zaprzyjaźnionych biur nieruchomości (w tym Spectra Nieruchomości w Krakowie). Pierwsze 10 biur z listy oczekujących dostanie wczesny dostęp + 3 miesiące za darmo + 30% rabatu na pierwszy rok.",
  },
  {
    q: "Co agenci nieruchomości dostają z AgentSpace?",
    a: "Realną korzyść. Agenci ćwiczą umiejętności które bezpośrednio przekładają się na ich prowizję — cold calling, obiekcje cenowe, negocjacja prowizji. Lepiej obrabiają obiekcje = więcej zamkniętych transakcji. Plus widzą swój postęp i ranking biura.",
  },
  {
    q: "Czy musimy nagrywać prawdziwych klientów?",
    a: "Nie. AI Coach to symulacje — agent ćwiczy z AI klientem, nie z prawdziwym. Pełna prywatność, zero ryzyka RODO ze strony klientów.",
  },
  {
    q: "Jakie są wymagania techniczne?",
    a: "Przeglądarka i mikrofon. Działa na laptopie, telefonie, tablecie. Bez instalacji, bez dodatkowego sprzętu.",
  },
  {
    q: "Co jeśli AgentSpace nie zadziała w moim biurze nieruchomości?",
    a: "30 dni gwarancji zwrotu pieniędzy od dnia płatności, bez pytań. Plus pierwsze 14 dni to darmowy trial — testujesz bez ryzyka.",
  },
];

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AgentSpace",
  description:
    "Platforma do szkolenia agentów nieruchomości z AI Coachem. Trening cold calli, dashboard agenta, ranking zespołu, raporty dla właściciela biura.",
  url: "https://agentspace.pl",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Real Estate Training Software",
  operatingSystem: "Web",
  inLanguage: "pl-PL",
  offers: {
    "@type": "Offer",
    price: "299",
    priceCurrency: "PLN",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "299",
      priceCurrency: "PLN",
      unitText: "MONTH",
      referenceQuantity: {
        "@type": "QuantitativeValue",
        value: 10,
        unitCode: "C62",
        unitText: "agentów",
      },
    },
    availability: "https://schema.org/PreOrder",
    priceValidUntil: "2026-12-31",
    eligibleRegion: {
      "@type": "Country",
      name: "Poland",
    },
  },
  featureList: [
    "AI Coach do treningu cold calli",
    "5 polskich scenariuszy sprzedażowych",
    "Naturalny polski głos AI klienta",
    "Scoring po polsku w 4 kategoriach",
    "Dashboard dziennej pracy agenta",
    "Ranking agentów w biurze",
    "Raporty miesięczne dla właściciela",
  ],
  publisher: {
    "@type": "Organization",
    name: "AgentSpace",
    url: "https://agentspace.pl",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AgentSpace",
  url: "https://agentspace.pl",
  description:
    "Polska platforma do szkolenia agentów nieruchomości z AI. Klient zero: Spectra Nieruchomości w Krakowie.",
  founder: {
    "@type": "Person",
    name: "Wiktor Szostek",
    jobTitle: "Founder",
  },
  foundingLocation: {
    "@type": "Place",
    name: "Kraków, Polska",
  },
  areaServed: {
    "@type": "Country",
    name: "Poland",
  },
  knowsLanguage: ["pl-PL"],
  sameAs: ["https://github.com/wiktoramsweb-boop/agentspace"],
};

const faqPageSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ENTRIES.map((entry) => ({
    "@type": "Question",
    name: entry.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: entry.a,
    },
  })),
};

export function SchemaMarkup() {
  const combined = [softwareApplicationSchema, organizationSchema, faqPageSchema];

  return (
    <script
      type="application/ld+json"
      // JSON-LD wymaga dangerouslySetInnerHTML — jest to oficjalnie rekomendowany
      // sposób przez React i Google. Treść jest statyczna, zero ryzyka XSS.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(combined) }}
    />
  );
}
