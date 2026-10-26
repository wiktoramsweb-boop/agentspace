import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { portaleKlientow } from "@/lib/wiadomosci-klientow";
import { APP_URL } from "@/lib/supabase/config";
import { PageHeader } from "../components/ui";
import { PortaleLista, NowyPortal } from "./portale";

export const metadata = { title: "Portal klienta" };
export const dynamic = "force-dynamic";

/**
 * Wszystkie portale klientów w jednym miejscu. Wcześniej portal siedział
 * w zakładce na karcie każdego klienta i trzeba było go szukać.
 */
export default async function PortalKlientaPage() {
  const user = await requireModul("klienci");
  const portale = await portaleKlientow(user);
  const zDostepem = new Set(portale.map((p) => p.clientId));

  let q = createSupabaseAdmin().from("clients").select("id, name, phone").eq("agency_id", user.agency_id).order("updated_at", { ascending: false }).limit(800);
  if (!["owner", "director", "manager"].includes(user.role)) q = q.eq("agent_id", user.id);
  const { data: klienci } = await q;

  const wszedl = portale.filter((p) => p.ostatnioWPortalu).length;
  const czeka = portale.reduce((s, p) => s + p.nieprzeczytane, 0);

  return (
    <>
      <PageHeader
        title="Portal klienta"
        subtitle="Aplikacja dla Twoich klientów z podglądem sprawy, kalendarzem prezentacji i wiadomościami. Tu otworzysz każdy portal jednym kliknięciem."
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Liczba wartosc={portale.length} opis="aktywnych portali" />
        <Liczba wartosc={wszedl} opis="klientów zagląda" />
        <Liczba wartosc={czeka} opis="nowych wiadomości" wyroznij={czeka > 0} />
      </div>

      <NowyPortal klienci={(klienci ?? []).filter((k) => !zDostepem.has(k.id as string)).map((k) => ({ id: k.id as string, nazwa: (k.name as string) ?? "Klient", telefon: (k.phone as string | null) ?? null }))} />

      <PortaleLista portale={portale} baza={APP_URL} />
    </>
  );
}

function Liczba({ wartosc, opis, wyroznij }: { wartosc: number; opis: string; wyroznij?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${wyroznij ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"}`}>
      <p className={`text-2xl font-bold tabular-nums ${wyroznij ? "text-sky-700" : "text-slate-900"}`}>{wartosc}</p>
      <p className="text-xs text-slate-500">{opis}</p>
    </div>
  );
}
