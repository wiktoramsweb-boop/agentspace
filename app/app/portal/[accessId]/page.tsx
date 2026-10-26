import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { sprawaPortalu, watekKlienta } from "@/lib/wiadomosci-klientow";
import { APP_URL } from "@/lib/supabase/config";
import { PROCESS_STAGES } from "@/lib/types";
import { formatPln } from "@/lib/format";
import { Wstecz } from "@/app/app/components/wstecz";
import { Rozmowa } from "../../wiadomosci/rozmowa";
import { PropozycjaCeny } from "../../nieruchomosci/[id]/portal-panel";
import { ListaDzialan, NoweDzialanie, PrzypnijNieruchomosc } from "./panel";
import { PrzyciskQr } from "../portale";

export const dynamic = "force-dynamic";

const kiedy = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(new Date(iso)) : "";

/**
 * Portal jednego klienta od środka: co klient widzi, nowy wpis z podpowiedzi,
 * propozycja ceny, nieruchomości w portalu i rozmowa. Wszystko, co wcześniej
 * było rozrzucone po karcie klienta i karcie oferty, w jednym miejscu.
 */
export default async function PortalJednegoKlienta({ params }: { params: Promise<{ accessId: string }> }) {
  const user = await requireModul("klienci");
  const { accessId } = await params;
  const [sprawa, watek] = await Promise.all([sprawaPortalu(user, accessId), watekKlienta(user, accessId)]);
  if (!sprawa || !watek) notFound();
  const { dostep, nieruchomosci, doDodania, reakcje } = sprawa;
  const klient = dostep.client?.name ?? "Klient";
  const kupujacy = dostep.rodzaj === "kupujacy";
  const link = `${APP_URL}/klient/${dostep.token}`;

  return (
    <>
      <Wstecz href="/app/portal">Portal klienta</Wstecz>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 text-xl font-bold text-white">
          {klient.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">{klient}</h1>
          <p className="text-sm text-slate-500">
            {kupujacy ? "Szuka nieruchomości" : "Sprzedaje lub wynajmuje"} ·{" "}
            {dostep.last_seen_at ? `ostatnio w portalu ${kiedy(dostep.last_seen_at)}` : "jeszcze nie wszedł do portalu"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={link} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
            Zobacz jak klient ↗
          </a>
          <PrzyciskQr accessId={accessId} klient={klient} />
          <Link href={`/app/klienci/${dostep.client_id}`} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400">
            Karta klienta
          </Link>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Dodaj działanie</h2>
            <p className="mb-4 mt-0.5 text-sm text-slate-500">
              Zaplanuj prezentację, telefon albo zadanie, albo zapisz, że coś się odbyło. Decydujesz, czy klient to zobaczy, i dostajesz gotowe zdania do opisu.
            </p>
            <NoweDzialanie accessId={accessId} rodzajDostepu={dostep.rodzaj} nieruchomosci={nieruchomosci.map((n) => ({ id: n.id, title: n.title }))} />
          </section>

          {!kupujacy &&
            nieruchomosci.map((n) => {
              const etap = PROCESS_STAGES.find((s) => s.value === n.process_stage);
              return (
                <section key={n.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-4 border-b border-slate-100 p-4">
                    {n.zdjecie ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.zdjecie} alt="" className="h-16 w-20 flex-shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="h-16 w-20 flex-shrink-0 rounded-xl bg-slate-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <Link href={`/app/nieruchomosci/${n.id}`} className="block truncate font-semibold text-slate-900 hover:text-emerald-700">
                        {n.title}
                      </Link>
                      <p className="text-sm text-slate-500">
                        {n.price_pln != null ? formatPln(n.price_pln) : "bez ceny"}
                        {etap ? ` · ${etap.label}` : ""}
                      </p>
                      {n.oczekujacaCena != null && (
                        <p className="mt-1 inline-block rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Czeka na decyzję klienta: {formatPln(n.oczekujacaCena)}
                        </p>
                      )}
                    </div>
                    <PrzypnijNieruchomosc accessId={accessId} propertyId={n.id} przypnij={false} etykieta="Zdejmij z portalu" />
                  </div>

                  <div className="p-4">
                    <p className="mb-2 text-sm font-semibold text-slate-900">Działania przy tej nieruchomości</p>
                    <ListaDzialan accessId={accessId} dzialania={n.dzialania} zWidocznoscia />

                    <details className="group mt-4 rounded-xl border border-slate-200">
                      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-700">
                        Zaproponuj nową cenę <span className="font-normal text-slate-400">· klient zatwierdza ją jednym kliknięciem</span>
                      </summary>
                      <div className="border-t border-slate-100 p-4">
                        <PropozycjaCeny accessId={accessId} propertyId={n.id} obecna={n.price_pln} />
                      </div>
                    </details>
                  </div>
                </section>
              );
            })}

          {!kupujacy && doDodania.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-sm font-semibold text-slate-900">Inne nieruchomości tego klienta</p>
              <div className="flex flex-wrap gap-2">
                {doDodania.map((p) => (
                  <PrzypnijNieruchomosc key={p.id} accessId={accessId} propertyId={p.id} przypnij etykieta={`+ ${p.title}`} />
                ))}
              </div>
            </section>
          )}

          {kupujacy && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 font-semibold text-slate-900">Działania z klientem</h2>
              <ListaDzialan accessId={accessId} dzialania={sprawa.dzialaniaKlienta} zWidocznoscia={false} />
            </section>
          )}

          {kupujacy && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">Reakcje na oferty</h2>
              {reakcje.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">Klient jeszcze nie ocenił żadnej oferty. Oferty dobierają się z jego poszukiwań.</p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {reakcje.map((r, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="truncate text-slate-800">{r.tytul}</span>
                      <span className={`flex-shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${r.reakcja === "lubi" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                        {r.reakcja === "lubi" ? "Podoba się" : "Odrzucona"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <section id="wiadomosci" className="min-w-0 scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:sticky lg:top-6">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold text-slate-900">Wiadomości</h2>
          </div>
          <Rozmowa accessId={accessId} klient={klient} aktywny={watek.aktywny} lista={watek.lista} />
        </section>
      </div>
    </>
  );
}
