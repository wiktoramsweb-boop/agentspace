import { Wstecz } from "@/app/app/components/wstecz";
import { notFound } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { todayPL } from "@/lib/datetime";
import { wzor } from "@/lib/dokumenty";
import type { Kontekst } from "@/lib/dokumenty/silnik";
import { PageHeader } from "../../components/ui";
import { Generator, type Rekord } from "./generator";
import { klientDoDokumentu, ofertaDoDokumentu } from "../wzory-actions";
import { szkic as wczytajSzkic, szkiceOsoby } from "@/lib/data-szkice";

function adresZMiastem(adres: string | null, miasto: string | null): string {
  const a = (adres ?? "").trim();
  const m = (miasto ?? "").trim();
  if (!m || a.toLowerCase().includes(m.toLowerCase())) return a || m;
  return a ? `${a}, ${m}` : m;
}

export async function generateMetadata({ params }: { params: Promise<{ wzor: string }> }) {
  const w = wzor((await params).wzor);
  return { title: w ? w.nazwa : "Dokument" };
}

export default async function WzorPage({
  params,
  searchParams,
}: {
  params: Promise<{ wzor: string }>;
  searchParams: Promise<{ klient?: string; oferta?: string; szkic?: string }>;
}) {
  const [{ wzor: id }, sp] = await Promise.all([params, searchParams]);
  const w = wzor(id);
  if (!w) notFound();

  const user = await requireModul("dokumenty");
  const agencyId = user.agency_id;
  const admin = createSupabaseAdmin();
  const [settings, klienciRes, ofertyRes, szkicStart, szkice] = await Promise.all([
    getAgencySettings(agencyId, user.agency?.name),
    w.poleKlienta && agencyId
      ? admin.from("clients").select("id, name, city").eq("agency_id", agencyId).order("updated_at", { ascending: false }).limit(800)
      : Promise.resolve({ data: [] as { id: string; name: string; city: string | null }[] }),
    w.zOferty && agencyId
      ? admin.from("properties").select("id, title, address, city, offer_no").eq("agency_id", agencyId).order("updated_at", { ascending: false }).limit(800)
      : Promise.resolve({ data: [] as { id: string; title: string; address: string | null; city: string | null; offer_no?: string | null }[] }),
    sp.szkic ? wczytajSzkic(agencyId, user.id, sp.szkic) : Promise.resolve(null),
    szkiceOsoby(agencyId, user.id),
  ]);

  const c = settings.company;
  const adres = [c.street, [c.postal_code, c.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const kontekst: Kontekst = {
    firma: { nazwa: c.name || user.agency?.name || "", adres, nip: c.nip ?? "", telefon: c.phone ?? "", email: c.email ?? "" },
    miasto: c.city ?? "",
    agent: { imie: user.full_name ?? "", telefon: user.phone ?? "" },
  };

  const klienci: Rekord[] = (klienciRes.data ?? []).map((k) => ({ id: k.id, nazwa: k.name, opis: k.city ?? undefined }));
  const oferty: Rekord[] = (ofertyRes.data ?? []).map((o) => ({
    id: o.id,
    nazwa: adresZMiastem(o.address, o.city) || o.title,
    opis: [o.offer_no ? `nr ${o.offer_no}` : "", o.title].filter(Boolean).join(" · "),
  }));
  const okKlient = sp.klient && klienci.some((k) => k.id === sp.klient) ? sp.klient : undefined;
  const okOferta = sp.oferta && oferty.some((o) => o.id === sp.oferta) ? sp.oferta : undefined;
  // Dane z linku („Utwórz dokument” z karty klienta albo oferty) wczytujemy
  // na serwerze, żeby formularz otworzył się już wypełniony.
  const [zKlienta, zOferty] = await Promise.all([
    okKlient && w.poleKlienta ? klientDoDokumentu(okKlient) : Promise.resolve(null),
    okOferta && w.zOferty ? ofertaDoDokumentu(okOferta) : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={w.kategoria}
        title={w.nazwa}
        subtitle={w.opis}
        action={
          <Wstecz href="/app/dokumenty" className="text-sm font-medium text-slate-500 hover:text-slate-800">
            ← Wszystkie dokumenty
          </Wstecz>
        }
      />
      <Generator
        wzorId={w.id}
        kontekst={kontekst}
        stopka={[c.name, c.nip ? `NIP ${c.nip}` : "", c.phone, c.email].filter(Boolean).join(" · ")}
        dzis={todayPL()}
        klienci={klienci}
        oferty={oferty}
        startKlient={okKlient}
        startOferta={okOferta}
        startStrona={zKlienta?.ok ? zKlienta.strona : undefined}
        startUkryte={zKlienta?.ok ? zKlienta.ukryte : false}
        startPola={zOferty?.ok ? zOferty.pola : undefined}
        startSzkic={szkicStart && szkicStart.wzorId === w.id ? szkicStart : null}
        szkiceDzialaja={szkice.ready}
      />
    </>
  );
}
