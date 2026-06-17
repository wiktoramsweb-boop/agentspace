import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "./components/effects/smooth-scroll";
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
  title: "AgentSpace — codzienna platforma dla agentów nieruchomości",
  description:
    "Trening cold calli z AI, dashboard agenta i ranking zespołu — wszystko w jednym miejscu. Dla biur nieruchomości w Polsce. Start Q1 2026.",
  metadataBase: new URL("https://agentspace.pl"),
  openGraph: {
    title: "AgentSpace — codzienna platforma dla agentów nieruchomości",
    description:
      "Trening cold calli z AI, dashboard agenta i ranking zespołu. Dla polskich biur RE.",
    url: "https://agentspace.pl",
    siteName: "AgentSpace",
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentSpace — codzienna platforma dla agentów nieruchomości",
    description:
      "Trening cold calli z AI, dashboard agenta i ranking zespołu. Dla polskich biur RE.",
  },
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
        <SmoothScroll />
        <ScrollProgress />
        {children}
      </body>
    </html>
  );
}
