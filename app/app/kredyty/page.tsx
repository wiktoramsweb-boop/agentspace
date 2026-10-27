import Link from "next/link";
import { requireModul } from "@/lib/auth";
import { sprawyKredytowe, doradcyBiura } from "@/lib/data-kredyty";
import { ETAPY_KREDYTU, ETAPY_AKTYWNE } from "@/lib/kredyt-etapy";
import { formatPln } from "@/lib/format";
import { PageHeader, Card } from "../components/ui";
import { Avatar } from "../components/avatar";
import { NowaSprawa } from "./nowa-sprawa";

export const metadata = { title: "Kredyty" };
export const dynamic = "force-dynamic";

const dni = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

/**
 * Tablica spraw kredytowych według etapów. Doradca widzi swoje sprawy,
 * agent sprawy swoich klientów, a CEO całe biuro.
 */
export default async function KredytyPage() {
  const user = await requireModul("kredyty");
  const [{ ready, sprawy }, doradcy] = await Promise.all([sprawyKredytowe(user), doradcyBiura(user.agency_id)]);
  const jestemDoradca = user.role === "credit_advisor";
  const aktywne = sprawy.filter((s) => ETAPY_AKTYWNE.includes(s.stage));
  const zamkniete = sprawy.filter((s) => !ETAPY_AKTYWNE.includes(s.stage));
  const wToku = aktywne.reduce((x, s) => x + (s.amount_pln ?? 0), 0);
  const podpisane = sprawy.filter((s) => s.stage === "umowa");

  return (
    <>
      <PageHeader
        title="Kredyty"
        subtitle={
          jestemDoradca
            ? "Klienci przekazani przez agentów biura i Twoi własni. Przesuwaj sprawę po etapach, a agent od razu wie, na czym stoi kredyt."
            : "Klienci przekazani doradcy kredytowemu. Widzisz, na jakim etapie jest kredyt, zanim transakcja się zatrzyma."
        }
      />

      {!ready ? (
        <Card>
          <p className="text-sm text-slate-600">Moduł wymaga aktualizacji bazy: uruchom w Supabase plik lib/SETUP-v53-doradca-kredytowy.sql.</p>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Liczba wartosc={String(aktywne.length)} opis="spraw w toku" />
            <Liczba wartosc={wToku ? formatPln(wToku) : "0 zł"} opis="kredytów w toku" />
            <Liczba wartosc={String(aktywne.filter((s) => s.stage === "wniosek").length)} opis="wniosków w bankach" />
            <Liczba wartosc={String(podpisane.length)} opis="podpisanych umów" />
          </div>

          <NowaSprawa doradcy={doradcy} jestemDoradca={jestemDoradca} />

          {doradcy.length === 0 && !jestemDoradca && (
            <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              W biurze nie ma jeszcze doradcy kredytowego. Zaproś go w{" "}
              <Link href="/app/zespol?z=zarzadzanie" className="font-semibold underline">
                Zespół → Zarządzanie
              </Link>{" "}
              z rolą „Doradca kredytowy”.
            </p>
          )}

          <div className="-mx-5 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
            <div className="grid min-w-[900px] grid-cols-5 gap-3">
              {ETAPY_KREDYTU.filter((e) => ETAPY_AKTYWNE.includes(e.id)).map((e) => {
                const lista = aktywne.filter((s) => s.stage === e.id);
                return (
                  <div key={e.id} className="rounded-2xl bg-slate-100/70 p-2.5">
                    <p className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {e.nazwa}
                      <span className="rounded-full bg-white px-2 py-0.5 text-slate-600">{lista.length}</span>
                    </p>
                    <div className="space-y-2">
                      {lista.map((s) => {
                        const ok = s.documents.filter((d) => d.jest).length;
                        return (
                          <Link key={s.id} href={`/app/kredyty/${s.id}`} className="block rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm">
                            <p className="truncate font-semibold text-slate-900">{s.client.name}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {s.amount_pln ? formatPln(s.amount_pln) : "kwota do ustalenia"}
                              {s.bank ? ` · ${s.bank}` : ""}
                            </p>
                            {s.documents.length > 0 && (
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(ok / s.documents.length) * 100}%` }} />
                              </div>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                              <span className="flex -space-x-1.5">
                                {s.polecajacy && <Avatar name={s.polecajacy.name} path={s.polecajacy.avatar} size={22} ring />}
                                {s.doradca && <Avatar name={s.doradca.name} path={s.doradca.avatar} size={22} ring />}
                              </span>
                              <span className={`text-[11px] ${dni(s.updated_at) > 7 ? "font-semibold text-amber-600" : "text-slate-400"}`}>
                                {dni(s.updated_at) === 0 ? "dziś" : `${dni(s.updated_at)} dni temu`}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                      {lista.length === 0 && <p className="px-1 py-3 text-center text-xs text-slate-400">Pusto</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {zamkniete.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Zakończone ({zamkniete.length})</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {zamkniete.map((s) => {
                  const e = ETAPY_KREDYTU.find((x) => x.id === s.stage)!;
                  return (
                    <Link key={s.id} href={`/app/kredyty/${s.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-300">
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-900">{s.client.name}</span>
                        <span className="block text-xs text-slate-500">{s.amount_pln ? formatPln(s.amount_pln) : ""}{s.bank ? ` · ${s.bank}` : ""}</span>
                      </span>
                      <span className={`flex-shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${e.kolor}`}>{e.nazwa}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function Liczba({ wartosc, opis }: { wartosc: string; opis: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xl font-bold tabular-nums text-slate-900">{wartosc}</p>
      <p className="text-xs text-slate-500">{opis}</p>
    </div>
  );
}
