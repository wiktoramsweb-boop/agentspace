import type { Metadata } from "next";

// Strona konta: bez indeksowania w Google i bez canonical wskazującego na
// stronę główną (dziedziczony z głównego layoutu).
export const metadata: Metadata = {
  title: "Logowanie | AgentSpace",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
