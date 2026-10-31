import Link from "next/link";
import { requireModul } from "@/lib/auth";
import { alertyNajmu, konfigBiura, lokaleBiura, rozliczLokal } from "@/lib/data-najem";
import { ETAPY_NAJMU, miesiaceOkresu, sumuj, TYPY_NAJMU, type RodzajOkresu } from "@/lib/najem-model";
import { formatPln } from "@/lib/format";
import { todayPL } from "@/lib/datetime";
import { PageHeader } from "../components/page-header";
import { PropertiesMap, type MapPoint } from "../nieruchomosci/properties-map";
import { FiltrOkresu, NowyLokal, TablicaNajmu } from "./najem-klient";

export const metadata = { title: "Zarządzanie najmem" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const ZAKLADKI = [
  { id: "pulpit", nazwa: "Pulpit" },
  { id: "lejek", nazwa: "Lejek" },
  { id: "lokale", nazwa: "Lokale i mapa" },
  { id: "rozliczenia", nazwa: "Rozliczenia" },
];

const KOLOR_MAPY: Record<string, string> = { wynajete: "#34d399", koniec: "#fb7185", szukanie: "#fbbf24", formalnosci: "#e879f9" };

function Liczba({ etykieta, wartosc, dopisek, zle }: { etykieta: string; wartosc: string; dopisek?: string; zle?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{etykieta}</p>
      <p className={`mt-1 truncate text-2xl font-bold tabular-nums ${zle ? "text-rose-600" : "text-slate-900"}`}>{wartosc}</p>
      {dopisek && <p className="truncate text-xs text-slate-500">{dopisek}</p>}
    </div>
  );
}

export default async function NajemPage({ searchParams }: Props) {
  const user = await requireModul("najem");
  const sp = await searchParams;
  const p = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const dzis = todayPL();
  const rokTeraz = Number(dzis.slice(0, 4));
  const miesiac = dzis.slice(0, 7);
  const zakladka = ZAKLADKI.some((z) => z.id === p("z")) ? p("z") : "pulpit";

  const rodzaj = (["miesiac", "kwartal", "polrocze", "rok"].includes(p("okres")) ? p("okres") : "miesiac") as RodzajOkresu;
  const rok = Number(p("rok")) || rokTeraz;
  const domyslny = rodzaj === "miesiac" ? Number(dzis.slice(5, 7)) : rodzaj === "kwartal" ? Math.ceil(Number(dzis.slice(5, 7)) / 3) : rodzaj === "polrocze" ? (Number(dzis.slice(5, 7)) > 6 ? 2 : 1) : 1;
  const numer = Number(p("nr")) || domyslny;

  const [lokale, k] = await Promise.all([lokaleBiura(user.agency_id, `${Math.min(rok, rokTeraz) - 1}-01`), konfigBiura(user.agency_id)]);
  const szef = user.role === "owner" || user.role === "director";

  const naglowek = (
    <PageHeader
      title="Zarządzanie najmem"
      subtitle="Lokale, strony, umowy i rozliczenia z właścicielami w jednym miejscu."
      action={
        <div className="flex flex-wrap gap-2">
          {szef && (
            <Link href="/app/najem/ustawienia" className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700">
              Warunki biura
            </Link>
          )}
          {lokale && <NowyLokal k={k} />}
        </div>
      }
    />
  );

  if (!lokale) {
    return (
      <>
        {naglowek}
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Moduł ruszy po uruchomieniu migracji lib/SETUP-v60-najem.sql.</p>
      </>
    );
  }

  const wTymMiesiacu = lokale.map((l) => rozliczLokal(l, miesiac, k));
  const sumaMies = sumuj(wTymMiesiacu);
  const obslugiwane = lokale.filter((l) => ["wynajete", "szukanie", "formalnosci", "koniec", "przygotowanie"].includes(l.etap));
  const wynajete = lokale.filter((l) => l.najem).length;
  const oblozenie = obslugiwane.length ? Math.round((wynajete / obslugiwane.length) * 100) : 0;
  const alerty = alertyNajmu(lokale, k);
  const roczne = Array.from({ length: 12 }, (_, i) => `${rokTeraz}-${String(i + 1).padStart(2, "0")}`).map((m) => ({ m, s: sumuj(lokale.map((l) => rozliczLokal(l, m, k))) }));
  const szczyt = Math.max(1, ...roczne.map((r) => Math.max(r.s.prowizja, 0)));

  const punkty: MapPoint[] = lokale
    .filter((l) => l.lat != null && l.lng != null)
    .map((l) => ({
      id: l.id,
      title: l.adres,
      price: l.najem?.czynsz ?? l.czynsz_oczekiwany,
      lat: l.lat!,
      lng: l.lng!,
      kind: "wynajem",
      color: KOLOR_MAPY[l.etap] ?? "#94a3b8",
      subtitle: `${ETAPY_NAJMU.find((e) => e.id === l.etap)?.nazwa ?? ""}${l.wlasciciel ? ` · ${l.wlasciciel}` : ""}`,
      href: `/app/najem/${l.id}`,
      linkText: "Otwórz kartę",
    }));

  const miesiace = miesiaceOkresu(rodzaj, rok, numer);
  const wiersze = lokale.map((l) => ({ l, s: sumuj(miesiace.map((m) => rozliczLokal(l, m, k))) })).filter((w) => w.s.wynajete > 0 || w.s.wplaty > 0);
  const razem = sumuj(lokale.flatMap((l) => miesiace.map((m) => rozliczLokal(l, m, k))));

  return (
    <>
      {naglowek}
      <nav className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1" aria-label="Zakładki najmu">
        {ZAKLADKI.map((z) => (
          <Link key={z.id} href={`/app/najem?z=${z.id}`} aria-current={zakladka === z.id ? "page" : undefined} className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-center text-sm font-semibold transition ${zakladka === z.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
            {z.nazwa}
          </Link>
        ))}
      </nav>

      {lokale.length === 0 && (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-slate-900">Nie ma jeszcze żadnego lokalu</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Dodaj pierwszy lokal, a program poprowadzi go od umowy z właścicielem po miesięczne rozliczenia.</p>
          <div className="mt-4 inline-block">
            <NowyLokal k={k} />
          </div>
        </section>
      )}

      {lokale.length > 0 && zakladka === "pulpit" && (
        <div className="space-y-5">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/20">
              <p className="text-sm text-slate-300">Prowizja w tym miesiącu</p>
              <p className="mt-1 text-4xl font-bold tabular-nums">{formatPln(sumaMies.prowizja)}</p>
              <p className="mt-1 text-sm text-slate-300">z {formatPln(sumaMies.wplaty)} wpłat najemców</p>
              <div className="mt-5 flex h-24 items-end gap-1.5" aria-hidden="true">
                {roczne.map((r) => (
                  <div key={r.m} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t" style={{ height: `${Math.max(4, (r.s.prowizja / szczyt) * 64)}px`, background: r.m === miesiac ? "#34d399" : "rgba(148, 163, 184, 0.35)" }} />
                    <span className="text-[10px] text-slate-400">{r.m.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Liczba etykieta="Obłożenie" wartosc={`${oblozenie}%`} dopisek={`${wynajete} z ${obslugiwane.length} lokali`} />
              <Liczba etykieta="Lokale w zarządzaniu" wartosc={String(lokale.length)} dopisek={`${lokale.filter((l) => !l.najem).length} bez najemcy`} />
              <Liczba etykieta="Czynsz należny" wartosc={formatPln(sumaMies.czynsz)} dopisek="ten miesiąc" />
              <Liczba etykieta="Zaległości" wartosc={formatPln(sumaMies.zaleglosc)} dopisek="ten miesiąc" zle={sumaMies.zaleglosc > 0} />
            </div>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="flex items-center gap-2 font-semibold text-slate-900">
              <span className={`h-2.5 w-2.5 rounded-full ${alerty.length ? "bg-amber-500" : "bg-emerald-500"}`} aria-hidden="true" />
              {alerty.length ? `Wymaga działania (${alerty.length})` : "Wszystko pod kontrolą"}
            </p>
            {alerty.length > 0 ? (
              <ul className="mt-2 divide-y divide-slate-100">
                {alerty.map((a) => (
                  <li key={a.tekst}>
                    <Link href={a.href} className="flex items-center justify-between gap-3 py-2.5 text-sm text-slate-700 hover:text-emerald-700">
                      <span>{a.tekst}</span>
                      {a.pilne && <span className="flex-shrink-0 rounded-md bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Pilne</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Umowy aktualne, czynsze wpłacone, terminy dotrzymane.</p>
            )}
          </section>
        </div>
      )}

      {lokale.length > 0 && zakladka === "lejek" && <TablicaNajmu karty={lokale.map((l) => ({ id: l.id, kolumna: l.etap, pos: l.kanban_pos, adres: l.adres, wlasciciel: l.wlasciciel, najemca: l.najemcy[0] ?? null, czynsz: l.najem?.czynsz ?? l.czynsz_oczekiwany, prowizjaPct: l.prowizja_pct != null ? Number(l.prowizja_pct) : k.prowizjaPct, koniec: l.najem?.do_dnia ?? null }))} />}

      {lokale.length > 0 && zakladka === "lokale" && (
        <div className="space-y-5">
          {punkty.length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <PropertiesMap points={punkty} height={420} />
            </div>
          )}
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {lokale.map((l) => {
              const e = ETAPY_NAJMU.find((x) => x.id === l.etap);
              return (
                <li key={l.id}>
                  <Link href={`/app/najem/${l.id}`} className="block h-full rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm">
                    <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className={`h-2 w-2 rounded-full ${e?.kolor ?? "bg-slate-400"}`} aria-hidden="true" />
                      {e?.nazwa}
                    </p>
                    <p className="mt-1 truncate font-semibold text-slate-900">{l.adres}</p>
                    <p className="truncate text-sm text-slate-500">
                      {TYPY_NAJMU.find((t) => t.id === l.typ_najmu)?.nazwa}
                      {l.pow ? ` · ${Number(l.pow).toLocaleString("pl-PL")} m²` : ""}
                    </p>
                    <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-100 pt-2 text-sm">
                      <span className="min-w-0 truncate text-slate-600">{l.najemcy[0] ?? l.wlasciciel ?? "Brak stron"}</span>
                      <b className="flex-shrink-0 tabular-nums text-slate-900">{formatPln(l.najem?.czynsz ?? l.czynsz_oczekiwany)}</b>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {lokale.length > 0 && zakladka === "rozliczenia" && (
        <div className="space-y-5">
          <FiltrOkresu rodzaj={rodzaj} rok={rok} numer={numer} lata={[rokTeraz - 1, rokTeraz, rokTeraz + 1]} />
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Liczba etykieta="Wpłaty najemców" wartosc={formatPln(razem.wplaty)} />
            <Liczba etykieta="Prowizja biura" wartosc={formatPln(razem.prowizja)} />
            <Liczba etykieta="Koszty i naprawy" wartosc={formatPln(razem.koszty)} />
            <Liczba etykieta="Dla właścicieli" wartosc={formatPln(razem.dlaWlasciciela)} />
            <Liczba etykieta="Zaległości" wartosc={formatPln(razem.zaleglosc)} zle={razem.zaleglosc > 0} />
          </section>
          <section className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-5">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 pr-3 font-medium">Lokal</th>
                  <th className="py-2 pr-3 font-medium">Właściciel</th>
                  <th className="py-2 pr-3 text-right font-medium">Wynajęty</th>
                  <th className="py-2 pr-3 text-right font-medium">Wpłaty</th>
                  <th className="py-2 pr-3 text-right font-medium">Prowizja</th>
                  <th className="py-2 pr-3 text-right font-medium">Koszty</th>
                  <th className="py-2 pr-3 text-right font-medium">Dla właściciela</th>
                  <th className="py-2 text-right font-medium">Zaległość</th>
                </tr>
              </thead>
              <tbody>
                {wiersze.map(({ l, s }) => (
                  <tr key={l.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-slate-900">
                      <Link href={`/app/najem/${l.id}?z=rozliczenia`} className="hover:text-emerald-700">
                        {l.adres}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600">{l.wlasciciel ?? "-"}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-slate-600">
                      {s.wynajete}/{s.miesiace} mc
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{formatPln(s.wplaty)}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{formatPln(s.prowizja)}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{formatPln(s.koszty)}</td>
                    <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{formatPln(s.dlaWlasciciela)}</td>
                    <td className={`py-2.5 text-right tabular-nums ${s.zaleglosc > 0 ? "font-semibold text-rose-600" : "text-slate-400"}`}>{formatPln(s.zaleglosc)}</td>
                  </tr>
                ))}
                {wiersze.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      W tym okresie nie było wynajętych lokali.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </>
  );
}
