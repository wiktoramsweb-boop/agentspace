import { notFound } from "next/navigation";
import { WZORY, getWzor } from "@/lib/wzory/themes";
import { WZOR_FONTS } from "@/lib/wzory/fonts";
import { WzNav, WzFooter, WzBadge } from "../../components/wzory/chrome";
import { WzMotion } from "../../components/wzory/motion";
import "../wzory.css";
import "../motywy/kamienica.css";
import "../motywy/nokturn.css";
import "../motywy/siatka.css";
import "../motywy/przystan.css";

export function generateStaticParams() {
  return WZORY.map((w) => ({ wzor: w.slug }));
}

/**
 * Rama wzoru: nagłówek, stopka i plakietka są wspólne, a wygląd bierze się
 * z klasy motywu na korzeniu. Podstrony wzoru dokładają tylko treść.
 */
export default async function WzorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ wzor: string }>;
}) {
  const { wzor } = await params;
  const w = getWzor(wzor);
  if (!w) notFound();

  const links = [
    { href: `/wzory/${w.slug}/oferty`, label: "Oferty" },
    { href: `/wzory/${w.slug}/oferty?transakcja=wynajem`, label: "Wynajem" },
    { href: `/wzory/${w.slug}/zespol`, label: "Zespół" },
    { href: `/wzory/${w.slug}#wiedza`, label: "Poradnik" },
    { href: `/wzory/${w.slug}/kontakt`, label: "Kontakt" },
  ];

  return (
    <div className={`wz ${w.root} ${WZOR_FONTS[w.slug]}`}>
      <WzMotion />
      <WzNav wzor={w.slug} office={w.office.split(" ")[0]} sub={w.sub} links={links} phone={w.phone} cta={w.navCta} />
      <main>{children}</main>
      <WzFooter
        wzor={w.slug}
        office={w.office}
        address={w.address}
        phone={w.phone}
        email={w.email}
        nip={w.nip}
      />
      <WzBadge name={w.name} />
    </div>
  );
}
