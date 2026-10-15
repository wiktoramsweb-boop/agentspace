import Link from "next/link";
import { requireModul } from "@/lib/auth";
import { todayPL } from "@/lib/datetime";
import { maV49 } from "@/lib/schemat";
import { dopiszStaleKoszty, kosztyMiesiaca, staleKoszty, wynikiMiesiecy, wyplatyAgentow } from "@/lib/data-finanse";
import { nazwaMiesiaca, poprawnyMiesiac, przesunMiesiac, zakresMiesiaca } from "@/lib/koszty-model";
import { PageHeader } from "../components/ui";
import { BrakMigracji } from "../components/brak-migracji";
import { PanelFinansow, type Widok } from "./panel";

export const metadata = { title: "Koszty i wynik" };

const WIDOKI: Widok[] = ["koszty", "stale", "wyplaty"];

export default async function FinansePage({ searchParams }: { searchParams: Promise<{ m?: string; widok?: string }> }) {
  const user = await requireModul("faktury");
  const sp = await searchParams;
  const dzis = todayPL();
  const m = poprawnyMiesiac(sp.m) ? sp.m : dzis.slice(0, 7);
  const widok: Widok = WIDOKI.includes(sp.widok as Widok) ? (sp.widok as Widok) : "koszty";
  const agencyId = user.agency_id;
  if (!agencyId) return null;

  const v49 = await maV49();
  if (!v49) {
    return (
      <>
        <PageHeader title="Koszty i wynik" subtitle="Koszty biura, stałe opłaty, wypłaty prowizji i wynik miesiąca." />
        <BrakMigracji />
      </>
    );
  }

  await dopiszStaleKoszty(agencyId, dzis);
  const [{ koszty }, stale, wyplaty, wyniki] = await Promise.all([
    kosztyMiesiaca(agencyId, m),
    staleKoszty(agencyId),
    wyplatyAgentow(agencyId, m, true),
    wynikiMiesiecy(agencyId, m, 6),
  ]);
  const { od, doWyl } = zakresMiesiaca(m);
  const ostatniDzien = new Date(Date.parse(doWyl) - 86_400_000).toISOString().slice(0, 10);
  const link = (mm: string) => `/app/finanse?m=${mm}&widok=${widok}`;

  return (
    <>
      <PageHeader
        title="Koszty i wynik"
        subtitle="Ile biuro zarobiło, ile wydało i komu trzeba wypłacić prowizję. Na koniec miesiąca jednym kliknięciem paczka dla księgowej."
        action={
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 text-sm">
            <Link href={link(przesunMiesiac(m, -1))} className="rounded-lg px-2.5 py-1.5 text-slate-500 hover:bg-slate-100" aria-label="Poprzedni miesiąc">‹</Link>
            <span className="min-w-[9rem] text-center font-medium capitalize text-slate-800">{nazwaMiesiaca(m)}</span>
            <Link href={link(przesunMiesiac(m, 1))} className="rounded-lg px-2.5 py-1.5 text-slate-500 hover:bg-slate-100" aria-label="Następny miesiąc">›</Link>
          </div>
        }
      />
      <PanelFinansow
        miesiac={m}
        dzis={dzis}
        widok={widok}
        koszty={koszty}
        stale={stale}
        wyplaty={wyplaty}
        wyniki={wyniki}
        eksport={{
          koszty: `/api/eksport/finanse?co=koszty&m=${m}`,
          wyplaty: `/api/eksport/finanse?co=wyplaty&m=${m}`,
          sprzedaz: `/api/eksport/ewidencja?od=${od}&do=${ostatniDzien}`,
        }}
      />
    </>
  );
}
