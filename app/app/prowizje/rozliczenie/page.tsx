import Link from "next/link";
import { redirect } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { rozliczenieMiesiaca } from "@/lib/data-zasady-prowizji";
import { poprawnyMiesiac } from "@/lib/koszty-model";
import { todayPL } from "@/lib/datetime";
import { formatPln } from "@/lib/format";
import { ROZLICZAJACY } from "@/lib/uprawnienia";
import { PageHeader, StatCard, Card } from "../../components/ui";
import { Wstecz } from "../../components/wstecz";

export const metadata = { title: "Rozliczenie prowizji" };

const MIESIACE = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"];

function przesun(m: string, o: number): string {
  const [r, mc] = m.split("-").map(Number);
  const d = new Date(r, mc - 1 + o, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Rozliczenie miesiąca: z każdej zamkniętej transakcji ile dostaje agent,
 * współagent, menedżer i sieć, a ile zostaje biuru. Ekran dla CEO,
 * dyrektora i księgowej, z eksportem do CSV.
 */
export default async function RozliczeniePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const user = await requireModul("prowizje");
  if (!ROZLICZAJACY.includes(user.role)) redirect("/app/prowizje");
  const { m } = await searchParams;
  const miesiac = poprawnyMiesiac(m) ? m : todayPL().slice(0, 7);
  const [rok, mc] = miesiac.split("-").map(Number);
  const r = await rozliczenieMiesiaca(user.agency_id!, rok, mc);
  const strzalka = "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-slate-400";

  return (
    <>
      <Wstecz href="/app/prowizje" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        ← Prowizje
      </Wstecz>
      <PageHeader
        title="Rozliczenie prowizji"
        subtitle="Z każdej zamkniętej transakcji: ile dostaje agent, współagent, menedżer i sieć, a ile zostaje biuru. Kwoty netto."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/app/prowizje/rozliczenie?m=${przesun(miesiac, -1)}`} replace className={strzalka} aria-label="Poprzedni miesiąc">
              ‹
            </Link>
            <span className="min-w-36 text-center text-sm font-semibold capitalize text-slate-900">
              {MIESIACE[mc - 1]} {rok}
            </span>
            <Link href={`/app/prowizje/rozliczenie?m=${przesun(miesiac, 1)}`} replace className={strzalka} aria-label="Następny miesiąc">
              ›
            </Link>
            <a href={`/api/eksport/rozliczenie?m=${miesiac}`} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              Pobierz CSV
            </a>
          </div>
        }
      />

      {!r.ready && (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Współagenci, nadprowizja menedżera i opłata dla sieci działają po migracji <code>lib/SETUP-v54-oddzialy-prowizje.sql</code>. Na razie widać udział prowadzących agentów.
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Prowizja netto biura" value={formatPln(r.suma.netto)} sub={`${formatPln(r.suma.brutto)} brutto`} />
        <StatCard label="Do wypłaty ludziom" value={formatPln(r.suma.wyplaty)} sub={`${r.osoby.length} os.`} />
        <StatCard label={r.zasady.nazwaSieci ? `Opłata: ${r.zasady.nazwaSieci}` : "Opłata dla sieci"} value={formatPln(r.suma.siec)} sub={r.zasady.oplataSieci ? `${r.zasady.oplataSieci}% netto` : "nie dotyczy"} />
        <StatCard label="Zostaje biuru" value={formatPln(r.suma.biuro)} accent />
      </div>

      {r.wiersze.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-slate-500">W tym miesiącu nie zamknięto żadnej transakcji.</p>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <h2 className="mb-3 font-semibold text-slate-900">Do wypłaty</h2>
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-400">
                  <tr>
                    <th className="pb-2 font-medium">Osoba</th>
                    <th className="pb-2 text-right font-medium">Prowadzone</th>
                    <th className="pb-2 text-right font-medium">Udziały</th>
                    <th className="pb-2 text-right font-medium">Nadprow.</th>
                    <th className="pb-2 text-right font-medium">Razem</th>
                  </tr>
                </thead>
                <tbody>
                  {r.osoby.map((o) => (
                    <tr key={o.id} className="border-t border-slate-100">
                      <td className="py-2 font-medium text-slate-900">{o.imie}</td>
                      <td className="py-2 text-right tabular-nums">{o.jakoAgent ? formatPln(o.jakoAgent) : "–"}</td>
                      <td className="py-2 text-right tabular-nums">{o.jakoWspolny ? formatPln(o.jakoWspolny) : "–"}</td>
                      <td className="py-2 text-right tabular-nums">{o.nadprowizja ? formatPln(o.nadprowizja) : "–"}</td>
                      <td className="py-2 text-right font-semibold tabular-nums text-emerald-700">{formatPln(o.razem)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            {r.oddzialy.length > 0 && (
              <Card>
                <h2 className="mb-3 font-semibold text-slate-900">Oddziały</h2>
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-slate-400">
                    <tr>
                      <th className="pb-2 font-medium">Oddział</th>
                      <th className="pb-2 text-right font-medium">Prowizja brutto</th>
                      <th className="pb-2 text-right font-medium">Zostaje biuru</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.oddzialy.map((o) => (
                      <tr key={o.nazwa} className="border-t border-slate-100">
                        <td className="py-2 font-medium text-slate-900">{o.nazwa}</td>
                        <td className="py-2 text-right tabular-nums">{formatPln(o.brutto)}</td>
                        <td className="py-2 text-right font-semibold tabular-nums">{formatPln(o.biuro)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>

          <h2 className="mb-3 font-semibold text-slate-900">Transakcje</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Transakcja</th>
                  <th className="px-3 py-3 text-right font-medium">Netto</th>
                  <th className="px-3 py-3 text-right font-medium">Agent</th>
                  <th className="px-3 py-3 text-right font-medium">Udziały</th>
                  <th className="px-3 py-3 text-right font-medium">Menedżer</th>
                  <th className="px-3 py-3 text-right font-medium">Sieć</th>
                  <th className="px-4 py-3 text-right font-medium">Biuro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.wiersze.map((w) => (
                  <tr key={w.dealId}>
                    <td className="px-4 py-3">
                      <Link href={`/app/prowizje/${w.dealId}`} className="font-medium text-slate-900 hover:text-emerald-700">
                        {w.tytul}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {w.agentImie}
                        {w.oddzial ? ` · ${w.oddzial}` : ""} · {new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(new Date(w.zamknieta))}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatPln(w.netto)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatPln(w.agent)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{w.wspolni.length ? formatPln(w.wspolni.reduce((a, s) => a + s.kwota, 0)) : "–"}</td>
                    <td className="px-3 py-3 text-right tabular-nums" title={w.menedzerImie ?? undefined}>{w.menedzer ? formatPln(w.menedzer) : "–"}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{w.siec ? formatPln(w.siec) : "–"}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${w.biuro < 0 ? "text-red-600" : "text-slate-900"}`}>{formatPln(w.biuro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Zasady ustawisz w Ustawieniach → Zasady prowizji. Ujemny wynik biura znaczy, że wypłaty z transakcji przekraczają prowizję netto.
          </p>
        </>
      )}
    </>
  );
}
