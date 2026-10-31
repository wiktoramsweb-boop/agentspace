import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { kartaLokalu, konfigBiura, warunki } from "@/lib/data-najem";
import { getDocuments } from "@/lib/data-documents";
import { ETAPY_NAJMU, FORMY_UMOWY, krokiLokalu, MODELE_ROZLICZEN, najemWMiesiacu, rozliczMiesiac, TYPY_NAJMU } from "@/lib/najem-model";
import { formatPln } from "@/lib/format";
import { todayPL } from "@/lib/datetime";
import { Wstecz } from "../../components/wstecz";
import { DocumentsCard } from "../../dokumenty/documents-card";
import { wiadomosciWlasciciela } from "@/lib/data-wlasciciel";
import { DaneLokalu, EtapyLokalu, ListaKrokow, PortalBiuro, RaportLokalu, Strony, UmowaNajmu, Wplaty, Zgloszenia } from "./karta";

export const metadata = { title: "Karta lokalu" };

const ZAKLADKI = [
  { id: "przeglad", nazwa: "Przegląd" },
  { id: "strony", nazwa: "Strony" },
  { id: "umowa", nazwa: "Umowa najmu" },
  { id: "rozliczenia", nazwa: "Rozliczenia" },
  { id: "dokumenty", nazwa: "Dokumenty" },
  { id: "zgloszenia", nazwa: "Usterki i przeglądy" },
  { id: "portal", nazwa: "Portal właściciela" },
];

export default async function KartaLokaluPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireModul("najem");
  const { id } = await params;
  const sp = await searchParams;
  if (!user.agency_id || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [dane, k] = await Promise.all([kartaLokalu(user.agency_id, id), konfigBiura(user.agency_id)]);
  if (!dane) notFound();
  const { lokal: l, najmy, strony, wplaty, zdarzenia, oplaty, portal } = dane;
  const z = ZAKLADKI.some((x) => x.id === sp.z) ? (sp.z as string) : "przeglad";
  const aktywny = najmy.find((n) => n.aktywny) ?? null;
  const etap = ETAPY_NAJMU.find((e) => e.id === l.etap);
  const w = warunki(l, k);
  const dzis = todayPL();
  const miesiac = dzis.slice(0, 7);
  const wlasciciel = strony.find((s) => s.rola === "wlasciciel")?.nazwa ?? null;
  const najemca = strony.find((s) => s.rola === "najemca")?.nazwa ?? null;
  const dokumenty = z === "dokumenty" ? await getDocuments(user.agency_id, "najem", id) : null;

  const miesiace = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.UTC(Number(dzis.slice(0, 4)), Number(dzis.slice(5, 7)) - 12 + i, 1));
    return d.toISOString().slice(0, 7);
  }).reverse();
  const roz = miesiace
    .map((m) => {
      const najem = najmy.find((n) => najemWMiesiacu(n, m)) ?? null;
      const wpl = wplaty.find((x) => x.miesiac === m) ?? null;
      return { r: rozliczMiesiac(m, najem, wpl, w, oplaty), wplata: wpl, kaucja: najem?.kaucja ?? 0 };
    })
    .filter((x) => x.r.wynajety || x.wplata);
  const teraz = rozliczMiesiac(miesiac, najmy.find((n) => najemWMiesiacu(n, miesiac)) ?? null, wplaty.find((x) => x.miesiac === miesiac) ?? null, w, oplaty);
  const rok = Number(dzis.slice(0, 4));
  const wierszeRaportu = Array.from({ length: 12 }, (_, i) => `${rok}-${String(i + 1).padStart(2, "0")}`)
    .map((m) => {
      const najem = najmy.find((n) => najemWMiesiacu(n, m)) ?? null;
      const wpl = wplaty.find((x) => x.miesiac === m) ?? null;
      const r = rozliczMiesiac(m, najem, wpl, w, oplaty);
      const kwoty: Record<string, number> = {};
      for (const o of oplaty.filter((x) => x.miesiac === m)) kwoty[o.rodzaj] = (kwoty[o.rodzaj] ?? 0) + o.kwota;
      return { miesiac: m, czynsz: wpl?.czynsz ?? 0, kwoty, prowizja: r.prowizja, netto: r.wplaty - r.prowizja - r.koszty, jest: r.wynajety || Boolean(wpl) };
    })
    .filter((x) => x.jest);
  const rodzajeRaportu = [...new Set(oplaty.filter((o) => o.miesiac.startsWith(String(rok))).map((o) => o.rodzaj))];
  const wiadomosci = z === "portal" && portal.dostep ? await wiadomosciWlasciciela(portal.dostep.id) : [];
  const czynsz = aktywny?.czynsz ?? l.czynsz_oczekiwany;
  const zostaje = czynsz ? Math.round(Number(czynsz) * (1 - w.prowizjaPct / 100)) : null;

  return (
    <>
      <Wstecz href="/app/najem?z=lokale">Lokale</Wstecz>
      <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className={`h-2 w-2 rounded-full ${etap?.kolor ?? "bg-slate-400"}`} aria-hidden="true" />
              {etap?.nazwa}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">{l.adres}</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {TYPY_NAJMU.find((t) => t.id === l.typ_najmu)?.nazwa}
              {l.pow ? ` · ${Number(l.pow).toLocaleString("pl-PL")} m²` : ""}
              {l.pokoje ? ` · ${l.pokoje} pok.` : ""}
              {aktywny ? ` · ${FORMY_UMOWY.find((f) => f.id === aktywny.forma)?.nazwa}` : ""}
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-5 text-right text-sm">
            <div>
              <dt className="text-xs text-slate-500">Czynsz</dt>
              <dd className="font-bold tabular-nums text-slate-900">{formatPln(czynsz)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Prowizja {w.prowizjaPct}%</dt>
              <dd className="font-bold tabular-nums text-slate-900">{czynsz ? formatPln((Number(czynsz) * w.prowizjaPct) / 100) : "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Dla właściciela</dt>
              <dd className="font-bold tabular-nums text-slate-900">{formatPln(zostaje)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <EtapyLokalu id={l.id} etap={l.etap} />

      <nav className="my-5 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1" aria-label="Sekcje lokalu">
        {ZAKLADKI.map((x) => (
          <Link key={x.id} href={`/app/najem/${l.id}?z=${x.id}`} aria-current={z === x.id ? "page" : undefined} className={`flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-center text-sm font-semibold transition ${z === x.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
            {x.nazwa}
          </Link>
        ))}
      </nav>

      {z === "przeglad" && (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <DaneLokalu lokal={l} k={k} />
          <div className="space-y-5">
            <section className="rounded-3xl bg-slate-900 p-5 text-white">
              <p className="text-sm text-slate-300">Ten miesiąc</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{formatPln(teraz.wplaty)}</p>
              <p className="text-sm text-slate-300">wpłat z {formatPln(teraz.czynszNalezny + teraz.oplatyNalezne)} należnych</p>
              {teraz.zaleglosc > 0 && <p className="mt-2 text-sm font-semibold text-amber-300">Zaległość: {formatPln(teraz.zaleglosc)}</p>}
            </section>
            <ListaKrokow id={l.id} etap={l.etap} kroki={krokiLokalu(l.etap, aktywny?.forma ?? null, k)} zrobione={l.kroki} />
          </div>
        </div>
      )}
      {z === "strony" && <Strony id={l.id} strony={strony} />}
      {z === "umowa" && <UmowaNajmu id={l.id} najmy={najmy} k={k} oplatyAdmin={l.oplaty_admin} czynsz={l.czynsz_oczekiwany} />}
      {z === "rozliczenia" && (
        <>
        <RaportLokalu rok={rok} wiersze={wierszeRaportu} rodzaje={rodzajeRaportu} />
        <Wplaty
          id={l.id}
          dane={roz}
          oplaty={oplaty}
          naglowek={{ adres: l.adres, wlasciciel: wlasciciel ?? "-", najemca: najemca ?? "-", model: l.model, modelNazwa: MODELE_ROZLICZEN.find((m) => m.id === l.model)?.nazwa ?? "", prowizjaPct: w.prowizjaPct, biuro: user.agency?.name ?? "Biuro", dniNaZastrzezenia: k.dniNaZastrzezenia }}
        />
        </>
      )}
      {z === "portal" && <PortalBiuro id={l.id} gotowy={portal.gotowy} dostep={portal.dostep} wlasciciel={wlasciciel} wiadomosci={wiadomosci} adresBazowy="https://www.agentspace.pl" />}
      {z === "dokumenty" && dokumenty && <DocumentsCard entity="najem" entityId={l.id} initial={dokumenty.docs} ready={dokumenty.ready} />}
      {z === "zgloszenia" && <Zgloszenia id={l.id} zdarzenia={zdarzenia} limit={l.limit_napraw != null ? Number(l.limit_napraw) : k.limitNapraw} przegladyRok={k.przegladyRok} />}
    </>
  );
}
