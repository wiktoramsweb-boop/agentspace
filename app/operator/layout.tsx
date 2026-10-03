import type { Metadata } from "next";

/**
 * Wspólna skorupa panelu operatora: ciemne tło i brak indeksowania.
 *
 * Sprawdzenie logowania NIE jest tutaj, bo ten layout obejmuje też ekran
 * logowania. Siedzi w `(panel)/layout.tsx`, czyli tylko nad chronioną częścią.
 */
export const metadata: Metadata = {
  title: "Operator | AgentSpace",
  robots: { index: false, follow: false },
};

export default function OperatorShellLayout({ children }: { children: React.ReactNode }) {
  return <div className="portal-dark min-h-screen bg-zinc-950 text-zinc-100">{children}</div>;
}
