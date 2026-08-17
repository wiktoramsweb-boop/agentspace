import type { Metadata, Viewport } from "next";
import { Inter_Tight, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ScrollProgress } from "./components/effects/scroll-progress";
import { SchemaMarkup } from "./components/schema-markup";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "AgentSpace | System operacyjny dla biura nieruchomości",
  description:
    "Jedno miejsce pracy całego biura: CRM klientów, wspólna baza nieruchomości, cele i lejek sprzedaży, rozliczanie prowizji, AI Coach do treningu rozmów i panel właściciela. Polski produkt, działa od pierwszego dnia.",
  keywords: [
    "system dla biura nieruchomości",
    "CRM dla biura nieruchomości",
    "oprogramowanie dla pośredników",
    "program dla biura nieruchomości",
    "rozliczanie prowizji nieruchomości",
    "cele sprzedażowe agenta nieruchomości",
    "szkolenie agentów nieruchomości",
    "AI Coach",
    "trening cold calling nieruchomości",
    "zarządzanie zespołem agentów",
    "baza nieruchomości dla biura",
    "AgentSpace",
  ],
  metadataBase: new URL("https://agentspace.pl"),
  alternates: {
    canonical: "https://agentspace.pl",
  },
  openGraph: {
    title: "AgentSpace | System operacyjny dla biura nieruchomości",
    description:
      "CRM, wspólna baza nieruchomości, cele, prowizje, AI Coach i panel właściciela w jednym miejscu. Dla biur nieruchomości w Polsce.",
    url: "https://agentspace.pl",
    siteName: "AgentSpace",
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentSpace | System operacyjny dla biura nieruchomości",
    description:
      "CRM, wspólna baza nieruchomości, cele, prowizje, AI Coach i panel właściciela w jednym miejscu. Dla biur nieruchomości w Polsce.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  authors: [{ name: "Wiktor Szostek", url: "https://agentspace.pl" }],
  category: "Real Estate Technology",
  appleWebApp: {
    capable: true,
    title: "AgentSpace",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${interTight.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950">
        <SchemaMarkup />
        <ScrollProgress />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
