import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader } from "../../components/page-header";
import { FormularzSwiadectwa, type OfertaDoSwiadectwa } from "./formularz";

export const metadata = { title: "Zamów świadectwo energetyczne" };

export default async function NoweSwiadectwoPage({ searchParams }: { searchParams: Promise<{ oferta?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const { data } = await createSupabaseAdmin()
    .from("properties")
    .select("id, title, address, city, area_m2, floor, property_type")
    .eq("agency_id", user.agency_id)
    .neq("status", "archiwum")
    .order("updated_at", { ascending: false })
    .limit(200);
  return (
    <>
      <PageHeader title="Zamów świadectwo energetyczne" subtitle="Wypełnij formularz, a uprawniony audytor przygotuje świadectwo i skontaktuje się z właścicielem." />
      <FormularzSwiadectwa oferty={(data ?? []) as OfertaDoSwiadectwa[]} start={sp.oferta ?? null} />
    </>
  );
}
