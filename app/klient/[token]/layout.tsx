import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dostepPoTokenie } from "@/lib/data-portal";
import { PortalNav } from "./nav";
import "./portal.css";

/**
 * Portal klienta ma własny, jasny wygląd - celowo inny niż aplikacja agenta.
 *
 * Klient nie jest użytkownikiem systemu i nie ma się uczyć jego interfejsu.
 * Ma zobaczyć coś, co wygląda jak zwykła aplikacja z ofertami: dużo bieli,
 * spokojna typografia, duże zdjęcia, pasek zakładek na dole.
 *
 * `noindex`, bo adres zawiera token dostępu i nie ma czego szukać w Google.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  manifest: "/klient/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Moja nieruchomość" },
  themeColor: "#ffffff",
};

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const dostep = await dostepPoTokenie(token);
  if (!dostep) notFound();

  return (
    <div className="portal">
      <main className="portal-main">{children}</main>
      <PortalNav token={token} rodzaj={dostep.rodzaj} />
    </div>
  );
}
