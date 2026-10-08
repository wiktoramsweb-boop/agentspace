import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brandingBiura, dostepPoTokenie, wiadomosciKlienta } from "@/lib/data-portal";
import { PortalNav } from "./nav";
import { ZachetaInstalacji } from "./instalacja";
import "./portal.css";

/**
 * Portal klienta ma własny, jasny wygląd - celowo inny niż aplikacja agenta.
 *
 * Klient nie jest użytkownikiem systemu i nie ma się uczyć jego interfejsu.
 * Ma zobaczyć coś, co wygląda jak zwykła aplikacja z ofertami: dużo bieli,
 * spokojna typografia, duże zdjęcia, pasek zakładek na dole.
 *
 * Wszystko jest podpisane nazwą biura, nie nazwą AgentSpace: klient ma umowę
 * z biurem i to jego markę ma widzieć na ekranie telefonu.
 *
 * `noindex`, bo adres zawiera token dostępu i nie ma czego szukać w Google.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const dostep = await dostepPoTokenie(token);
  const nazwa = dostep ? (await brandingBiura(dostep.agency_id)).nazwa : "Portal klienta";

  return {
    title: nazwa,
    robots: { index: false, follow: false },
    manifest: `/klient/${token}/manifest.webmanifest`,
    // Tytuł spod ikony na iPhonie. Bez tego iOS bierze <title> z całym ogonem.
    appleWebApp: { capable: true, statusBarStyle: "default", title: nazwa },
    icons: {
      icon: [{ url: `/klient/${token}/ikona?r=192`, sizes: "192x192", type: "image/png" }],
      apple: [{ url: `/klient/${token}/ikona?r=192`, sizes: "180x180", type: "image/png" }],
    },
    themeColor: "#ffffff",
  };
}

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

  const [biuro, wiadomosci] = await Promise.all([
    brandingBiura(dostep.agency_id),
    wiadomosciKlienta(dostep),
  ]);

  // Kropka przy zakładce, gdy agent odpisał po ostatniej wiadomości klienta.
  const ostatnia = wiadomosci.lista[wiadomosci.lista.length - 1];
  const nowaOdAgenta = Boolean(ostatnia && ostatnia.autor === "agent");

  return (
    <div className="portal">
      <header className="portal-marka">
        <div>
          {biuro.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={biuro.logoUrl} alt="" />
          ) : (
            <span className="portal-inicjal" aria-hidden="true">
              {biuro.inicjal}
            </span>
          )}
          <div>
            <b>{biuro.nazwa}</b>
            <small>{dostep.rodzaj === "kupujacy" ? "Oferty dla Ciebie" : "Twoja sprawa"}</small>
          </div>
        </div>
      </header>

      <main className="portal-main">
        <ZachetaInstalacji nazwaBiura={biuro.nazwa} />
        {children}
      </main>

      <PortalNav token={token} rodzaj={dostep.rodzaj} nowaWiadomosc={nowaOdAgenta} />
    </div>
  );
}
