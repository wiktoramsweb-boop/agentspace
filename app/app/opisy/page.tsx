import { requireUser } from "@/lib/auth";
import { getProperties } from "@/lib/data-platform";
import { PageHeader } from "../components/ui";
import { OpisGenerator } from "./opis-generator";

export default async function OpisyPage() {
  const user = await requireUser();
  const properties = await getProperties(user.id);

  const prefill = properties.map((p) => ({
    id: p.id,
    title: p.title,
    deal_kind: p.deal_kind,
    city: p.city,
    address: p.address,
    price_pln: p.price_pln,
    area_m2: p.area_m2,
    rooms: p.rooms,
  }));

  return (
    <>
      <PageHeader
        title="Opisy ogłoszeń"
        subtitle="Wpisz parametry — opis w stylu Spectra złoży się sam. Bez kosztów AI."
      />
      <OpisGenerator properties={prefill} />
    </>
  );
}
