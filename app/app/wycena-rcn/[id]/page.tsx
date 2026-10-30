import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { formatDatePL } from "@/lib/datetime";
import { wycenaPoId } from "@/lib/wyceny";
import { PageHeader } from "../../components/page-header";
import { WynikWidok } from "../wynik-widok";
import { PowiazanieWyceny } from "../wycena-klient";

export const metadata = { title: "Zapisana wycena" };

export default async function ZapisanaWycenaPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireModul("nieruchomosci");
  const { id } = await params;
  const w = await wycenaPoId(user, id);
  if (!w) notFound();
  const { data } = await createSupabaseAdmin().from("properties").select("id, title").eq("agency_id", user.agency_id).eq("property_type", "mieszkanie").neq("status", "archiwum").order("updated_at", { ascending: false }).limit(200);
  const oferty = (data ?? []) as { id: string; title: string }[];
  const { oferta: _o, ...reszta } = w.parametry;
  const przelicz = new URLSearchParams({ ...reszta, ...(w.property_id ? { oferta: w.property_id } : {}), podglad: "1" });

  return (
    <>
      <PageHeader
        title={w.adres}
        subtitle={`Wycena z ${formatDatePL(w.updated_at)}. Liczby są z dnia wyceny, nowe akty dojdą po ponownym przeliczeniu.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/app/wycena-rcn/historia" className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700">
              ← Wszystkie wyceny
            </Link>
            <Link href={`/app/wycena-rcn?${przelicz}`} className="inline-flex items-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400">
              Popraw i przelicz
            </Link>
          </div>
        }
      />
      <div className="space-y-6">
        <PowiazanieWyceny wycenaId={w.id} oferty={oferty} powiazana={w.property_id ? { id: w.property_id, title: w.properties?.title ?? "Oferta" } : null} zrodlo={w.zrodlo} />
        <WynikWidok
          w={w.raport.wynik}
          promien={w.raport.promien}
          raport={w.raport}
          adres={w.adres}
          stan={w.raport.wybranyStan ?? "standard"}
          ofertaId={w.property_id}
          cenaPorownania={w.cena_ogloszenia ? Number(w.cena_ogloszenia) : null}
          etykietaCeny="w ogłoszeniu"
        />
      </div>
    </>
  );
}
