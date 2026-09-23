import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/site/config";
import { getWzor } from "@/lib/wzory/themes";
import { WZOR_FONTS } from "@/lib/wzory/fonts";
import { WzNav, WzFooter } from "../../components/wzory/chrome";
import { WzMotion } from "../../components/wzory/motion";
import { CookieBar, ViewPing } from "../../components/wzory/site-bits";
import "../../wzory/wzory.css";
import "../../wzory/motywy/kamienica.css";
import "../../wzory/motywy/nokturn.css";
import "../../wzory/motywy/siatka.css";
import "../../wzory/motywy/przystan.css";
import "../../wzory/motywy/strategia.css";
import "../../wzory/motywy/beton.css";
import "../../wzory/motywy/ogrod.css";
import "../../wzory/motywy/horyzont.css";

/**
 * Rama strony internetowej biura. Ten sam układ co we wzorach, ale nazwa,
 * kolory, kontakt i wybrany motyw przychodzą z ustawień biura w AgentSpace.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site || !site.published) notFound();

  const theme = getWzor(site.template) ?? getWzor("kamienica")!;
  const base = `/strona/${site.slug}`;

  const links = [
    { href: `${base}/oferty`, label: "Oferty" },
    { href: `${base}/sprzedaj`, label: "Sprzedaj" },
    { href: `${base}/zespol`, label: "Zespół" },
    { href: `${base}/kontakt`, label: "Kontakt" },
  ];
  const more = [
    { href: `${base}/poradnik`, label: "Poradnik" },
    { href: `${base}/kalkulator`, label: "Kalkulator raty" },
    { href: `${base}/ulubione`, label: "Ulubione oferty" },
    { href: `${base}/zglos-nieruchomosc`, label: "Zgłoś nieruchomość" },
    { href: `${base}/zlec-poszukiwanie`, label: "Zleć poszukiwanie" },
  ];

  // Kolor wiodący z panelu nadpisuje akcent motywu, więc to samo biuro może
  // mieć wzór „Kamienica" w swoich barwach.
  const style = site.brand.accent
    ? ({ ["--d-accent"]: site.brand.accent, ["--d-accent-link"]: site.brand.accent } as CSSProperties)
    : undefined;

  // Dane strukturalne: dzięki nim Google pokazuje biuro z adresem, telefonem
  // i godzinami pracy, zamiast samego tytułu strony.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: site.brand.officeName,
    url: site.domain ? `https://${site.domain}` : `https://agentspace.pl${base}`,
    telephone: site.contact.phone || undefined,
    email: site.contact.email || undefined,
    address: site.contact.addressLine
      ? {
          "@type": "PostalAddress",
          streetAddress: site.contact.addressLine,
          addressLocality: site.contact.addressCity,
          addressCountry: "PL",
        }
      : undefined,
    sameAs: [site.contact.facebook, site.contact.instagram].filter(Boolean),
    areaServed: site.contact.addressCity || "Polska",
  };

  return (
    <div className={`wz ${theme.root} ${WZOR_FONTS[theme.slug]}`} style={style}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <WzMotion />
      <ViewPing agencyId={site.agencyId} />
      <WzNav
        base={base}
        office={site.brand.officeName}
        sub={site.brand.claim}
        links={links}
        more={more}
        phone={site.contact.phone}
        cta="Bezpłatna wycena"
      />
      <main>{children}</main>
      <WzFooter
        base={base}
        office={site.brand.officeName}
        address={[site.contact.addressLine, site.contact.addressCity].filter(Boolean)}
        phone={site.contact.phone}
        email={site.contact.email}
        nip={site.contact.nip}
      />
      <CookieBar office={site.brand.officeName} />
    </div>
  );
}
