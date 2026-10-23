import { requireModul } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { SPECTRA_AGENCY_ID, wzorZUstawien } from "@/lib/oferta-wzor";
import { PageHeader } from "../components/ui";
import { OfertaWspolpracy } from "./oferta";
import { OfertaWzor } from "./wzor";

export default async function OfertaWspolpracyPage() {
  const user = await requireModul("dokumenty");

  // Spectra ma własny wzór z Canvy i zostaje przy nim. Każde inne biuro,
  // także demo i okres próbny, dostaje ogólny wzór do dostosowania.
  if (user.agency_id === (process.env.SPECTRA_AGENCY_ID ?? SPECTRA_AGENCY_ID)) {
    return (
      <>
        <PageHeader title="Oferta współpracy" subtitle="Wypełnij warunki - wygenerujemy gotowy, firmowy PDF oferty dla klienta." />
        <OfertaWspolpracy defaultAgent={user.full_name ?? ""} defaultTelefon={user.phone ?? ""} />
      </>
    );
  }

  const s = await getAgencySettings(user.agency_id, user.agency?.name);
  const c = s.company;
  return (
    <>
      <PageHeader
        title="Oferta współpracy"
        subtitle="Pięciostronicowy PDF dla właściciela: o biurze, jak sprzedajecie, warunki i kontakt. W kolorach biura, z Waszym logo i tekstami."
      />
      <OfertaWzor
        wzorBiura={wzorZUstawien(s.options.oferta_wzor)}
        marka={{
          kolor: s.options.offer_color ?? "#059669",
          biuro: c.name ?? user.agency?.name ?? "Biuro nieruchomości",
          logoUrl: s.logoUrl,
          adresBiura: [c.street, [c.postal_code, c.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),
          www: c.www ?? "",
        }}
        agent={user.full_name ?? ""}
        telefon={user.phone ?? c.phone ?? ""}
        email={user.email ?? c.email ?? ""}
        ceo={user.role === "owner"}
      />
    </>
  );
}
