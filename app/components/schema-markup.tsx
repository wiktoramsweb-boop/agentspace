/**
 * JSON-LD structured data dla Google rich snippets i crawlerów LLM.
 * Schemy: SoftwareApplication, Organization, FAQPage, HowTo, ItemList (nawigacja).
 * Bez "use client" — to czysty HTML w SSR.
 *
 * FAQ_ENTRIES musi odpowiadać treści widocznej na stronie (app/page.tsx).
 * Google karze za schema, która nie zgadza się z widoczną treścią.
 */

const FAQ_ENTRIES = [
  {
    q: "Czy AgentSpace działa już dziś?",
    a: "Tak. Platforma działa na produkcji i jest codziennie używana w biurze Spectra Nieruchomości w Krakowie — to biuro założyciela i pierwszy klient produktu. Przyjmujemy kolejne biura w ramach Programu Pierwszych 10 Biur.",
  },
  {
    q: "Czy AgentSpace zastąpi mój obecny system?",
    a: "W większości biur tak — AgentSpace obejmuje CRM klientów, wspólną bazę nieruchomości, cele, prowizje, zadania i dokumenty. Jeśli korzystasz z systemu do masowego eksportu ofert na portale, na razie warto zostawić go obok.",
  },
  {
    q: "Ile trwa wdrożenie i kto je robi?",
    a: "Jeden dzień roboczy. Zakładamy konto, wgrywamy bazę klientów i nieruchomości, zapraszamy agentów i konfigurujemy cele pod Twój model pracy. Wdrożenie prowadzimy razem z klientem.",
  },
  {
    q: "Czy agenci to zaakceptują?",
    a: "AgentSpace zaczyna od tego, co daje agentowi: plan dnia, gotowe follow-upy pisane przez AI, widoczny postęp celu i trening przed trudną rozmową. Panel właściciela jest efektem ubocznym ich codziennej pracy, a nie osobnym raportowaniem.",
  },
  {
    q: "Czy musimy nagrywać rozmowy z prawdziwymi klientami?",
    a: "Nie. AI Coach to symulacje — agent ćwiczy z klientem AI, nie z prawdziwym. Zero ryzyka RODO po stronie klientów biura.",
  },
  {
    q: "Gdzie są przechowywane dane biura?",
    a: "Na serwerach w Unii Europejskiej (Frankfurt). Dane biura są odseparowane od danych innych biur, a dostęp mają wyłącznie zaproszeni użytkownicy zgodnie z rolą: CEO, menedżer, agent.",
  },
  {
    q: "Czy jest umowa na czas określony?",
    a: "Nie. Rozliczenie miesięczne, rezygnacja w dowolnym momencie.",
  },
];

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AgentSpace",
  description:
    "System operacyjny dla biura nieruchomości: CRM klientów, wspólna baza nieruchomości, cele i lejek sprzedaży, rozliczanie prowizji, AI Coach do treningu rozmów oraz panel właściciela.",
  url: "https://agentspace.pl",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Real Estate Agency Management Software",
  operatingSystem: "Web",
  inLanguage: "pl-PL",
  offers: [
    {
      "@type": "Offer",
      name: "Start",
      price: "499",
      priceCurrency: "PLN",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "499",
        priceCurrency: "PLN",
        unitText: "MONTH",
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: 5,
          unitCode: "C62",
          unitText: "agentów",
        },
      },
      eligibleRegion: { "@type": "Country", name: "Poland" },
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "899",
      priceCurrency: "PLN",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "899",
        priceCurrency: "PLN",
        unitText: "MONTH",
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: 15,
          unitCode: "C62",
          unitText: "agentów",
        },
      },
      eligibleRegion: { "@type": "Country", name: "Poland" },
    },
    {
      "@type": "Offer",
      name: "Biuro",
      price: "1490",
      priceCurrency: "PLN",
      availability: "https://schema.org/InStock",
      eligibleRegion: { "@type": "Country", name: "Poland" },
    },
  ],
  featureList: [
    "CRM klientów z pipeline i notatkami",
    "Wspólna baza nieruchomości dla biura",
    "Cele i lejek sprzedażowy — roczny do dziennego",
    "Rozliczanie prowizji i karta transakcji",
    "Umowy rezerwacyjne generowane do PDF",
    "AI Coach — trening rozmów z klientem AI",
    "Panel właściciela z rankingiem i raportami",
    "Role: CEO, menedżer, agent",
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
  legalName: "Spectra Nieruchomości",
  url: "https://agentspace.pl",
  description:
    "Polski system operacyjny dla biur nieruchomości. Klient zero: Spectra Nieruchomości w Krakowie.",
  founder: {
    "@type": "Person",
    name: "Wiktor Szostek",
    jobTitle: "Founder",
  },
  foundingLocation: {
    "@type": "Place",
    name: "Kraków, Polska",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "ul. Zbożowa 2/1",
    postalCode: "30-002",
    addressLocality: "Kraków",
    addressCountry: "PL",
  },
  taxID: "6772516327",
  vatID: "PL6772516327",
  identifier: [
    { "@type": "PropertyValue", propertyID: "NIP", value: "6772516327" },
    { "@type": "PropertyValue", propertyID: "REGON", value: "529666353" },
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "nieruchomoscispectra@gmail.com",
    contactType: "customer service",
    availableLanguage: ["pl"],
  },
  areaServed: { "@type": "Country", name: "Poland" },
  knowsLanguage: ["pl-PL"],
};

const faqPageSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ENTRIES.map((entry) => ({
    "@type": "Question",
    name: entry.q,
    acceptedAnswer: { "@type": "Answer", text: entry.a },
  })),
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Jak wdrożyć AgentSpace w biurze nieruchomości",
  description:
    "Wdrożenie systemu operacyjnego AgentSpace w biurze nieruchomości w trzech krokach — od rozmowy do pierwszych wniosków z danych.",
  totalTime: "P30D",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Rozmowa i audyt biura",
      text: "30 minut rozmowy. Sprawdzamy, jak dziś wygląda obieg leada w biurze i gdzie realnie giną transakcje. Wnioski otrzymujesz niezależnie od decyzji o współpracy.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Wdrożenie w jeden dzień",
      text: "Zakładamy konto biura, wgrywamy bazę klientów i nieruchomości, zapraszamy agentów i konfigurujemy cele oraz lejek pod model pracy biura.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Pierwsze wnioski w 30 dni",
      text: "Po miesiącu biuro ma komplet danych: kto realizuje cele, gdzie zespół traci leady i jak wyglądają rozmowy z klientami.",
    },
  ],
};

const navigationSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Nawigacja główna",
  itemListElement: [
    { name: "Produkt", url: "https://agentspace.pl/#moduly" },
    { name: "Integracje", url: "https://agentspace.pl/integracje" },
    { name: "Cennik", url: "https://agentspace.pl/cennik" },
    { name: "Blog", url: "https://agentspace.pl/blog" },
    { name: "O nas", url: "https://agentspace.pl/o-nas" },
  ].map((item, i) => ({
    "@type": "SiteNavigationElement",
    position: i + 1,
    name: item.name,
    url: item.url,
  })),
};

export function SchemaMarkup() {
  const combined = [
    softwareApplicationSchema,
    organizationSchema,
    faqPageSchema,
    howToSchema,
    navigationSchema,
  ];

  return (
    <script
      type="application/ld+json"
      // JSON-LD wymaga dangerouslySetInnerHTML — oficjalnie rekomendowany
      // sposób przez React i Google. Treść statyczna, zero ryzyka XSS.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(combined) }}
    />
  );
}
