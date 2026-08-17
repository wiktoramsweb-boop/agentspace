import { requireUser } from "@/lib/auth";
import { PageHeader } from "../components/ui";
import { OfertaWspolpracy } from "./oferta";

export default async function OfertaWspolpracyPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader
        title="Oferta współpracy"
        subtitle="Wypełnij warunki - wygenerujemy gotowy, firmowy PDF oferty dla klienta."
      />
      <OfertaWspolpracy
        defaultAgent={user.full_name ?? ""}
        defaultTelefon={user.phone ?? ""}
      />
    </>
  );
}
