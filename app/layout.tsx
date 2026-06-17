import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ScrollProgress } from "./components/effects/scroll-progress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Szkolenie agentów nieruchomości z AI Coachem | AgentSpace",
  description:
    "Platforma do szkolenia agentów nieruchomości w Polsce. AI Coach do treningu cold calli, dashboard agenta, ranking zespołu, raporty dla właściciela biura. Start Q1 2026.",
  keywords: [
    "szkolenie agentów nieruchomości",
    "trening agentów nieruchomości",
    "AI dla nieruchomości",
    "AI Coach",
    "platforma dla biur nieruchomości",
    "narzędzia dla pośrednika",
    "szkolenie cold calling",
    "trening sprzedaży nieruchomości",
    "CRM dla biura nieruchomości",
    "ranking agentów",
    "biuro nieruchomości oprogramowanie",
    "AgentSpace",
  ],
  metadataBase: new URL("https://agentspace.pl"),
  alternates: {
    canonical: "https://agentspace.pl",
  },
  openGraph: {
    title: "Szkolenie agentów nieruchomości z AI Coachem | AgentSpace",
    description:
      "Trenuj zespół agentów codziennie z AI. Cold calling, obiekcje cenowe, negocjacja prowizji. Dla biur nieruchomości w Polsce.",
    url: "https://agentspace.pl",
    siteName: "AgentSpace",
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Szkolenie agentów nieruchomości z AI Coachem | AgentSpace",
    description:
      "Trenuj zespół agentów codziennie z AI. Cold calling, obiekcje cenowe, negocjacja prowizji. Dla biur nieruchomości w Polsce.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950">
        <ScrollProgress />
        {children}
      </body>
    </html>
  );
}
