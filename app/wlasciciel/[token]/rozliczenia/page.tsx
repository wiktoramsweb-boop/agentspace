import { notFound } from "next/navigation";
import { brandingBiura } from "@/lib/data-portal";
import { dostepWlasciciela, lokaleWlasciciela } from "@/lib/data-wlasciciel";
import { konfigBiura } from "@/lib/data-najem";
import { todayPL } from "@/lib/datetime";
import { KartaMiesiaca, ZestawienieRoczne } from "../widok";

export const dynamic = "force-dynamic";

export default async function Rozliczenia({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await dostepWlasciciela(token);
  if (!d) notFound();
  const [lokale, biuro, k] = await Promise.all([lokaleWlasciciela(d), brandingBiura(d.agency_id), konfigBiura(d.agency_id)]);
  const miesiace = lokale.flatMap((l) => l.miesiace.map((m) => ({ m, najemca: l.najemca ?? "-" }))).sort((a, b) => b.m.r.miesiac.localeCompare(a.m.r.miesiac));
  return (
    <>
      <div className="portal-top">
        <h1>Rozliczenia</h1>
      </div>
      <ZestawienieRoczne rok={Number(todayPL().slice(0, 4))} biuro={biuro.nazwa} wlasciciel={d.nazwa} lokale={lokale} />
      {miesiace.length === 0 && <p className="py-6 text-center text-sm text-[var(--t2)]">Pierwsze rozliczenie pojawi się tutaj, gdy biuro je przygotuje.</p>}
      {miesiace.map(({ m, najemca }) => (
        <KartaMiesiaca key={`${m.lokalId}${m.r.miesiac}`} m={m} biuro={biuro.nazwa} wlasciciel={d.nazwa} najemca={najemca} dni={k.dniNaZastrzezenia} />
      ))}
    </>
  );
}
