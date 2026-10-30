import Link from "next/link";
import type { WynikWyceny } from "@/lib/rcn-wycena";
import type { DaneRaportu } from "@/lib/wycena-pdf";
import { formatPln } from "@/lib/format";
import { formatDatePL } from "@/lib/datetime";
import { MapaPorownan, WplywStandardu, WykresCen, WykresLiczby } from "./wykresy";
import { PobierzRaport } from "./pobierz-raport";

const PEWNOSC = {
  wysoka: { label: "Duża pewność", kolor: "bg-emerald-100 text-emerald-700" },
  srednia: { label: "Średnia pewność", kolor: "bg-amber-100 text-amber-700" },
  niska: { label: "Mała pewność", kolor: "bg-rose-100 text-rose-700" },
};

/** Wynik wyceny: ten sam widok tuż po policzeniu i przy powrocie do zapisanej. */
export function WynikWidok({
  w,
  promien,
  raport,
  adres,
  stan,
  ofertaId,
  cenaPorownania,
  etykietaCeny,
}: {
  w: WynikWyceny;
  promien: number;
  raport: DaneRaportu;
  adres: string;
  stan: string;
  ofertaId: string | null;
  cenaPorownania: number | null;
  etykietaCeny: string;
}) {
  const roznica = cenaPorownania ? Math.round(((cenaPorownania - w.szacunek) / w.szacunek) * 100) : null;
  return (
    <>
          <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
            <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/20 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-300">Szacowana cena transakcyjna</p>
                <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${PEWNOSC[w.pewnosc].kolor}`}>{PEWNOSC[w.pewnosc].label}</span>
              </div>
              <p className="mt-2 text-4xl font-bold tabular-nums sm:text-5xl">{formatPln(w.szacunek)}</p>
              <p className="mt-1 text-sm text-slate-300">
                {formatPln(w.cenaM2)}/m² · przedział {formatPln(w.od)} – {formatPln(w.do)}
              </p>
              <div className="relative mt-6 h-2 rounded-full bg-white/10">
                <div className="absolute inset-y-0 left-[12%] right-[12%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                <span className="absolute -top-1.5 left-1/2 h-5 w-1 -translate-x-1/2 rounded-full bg-white" />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>{formatPln(w.od)}</span>
                <span className="font-semibold text-white">{formatPln(w.szacunek)}</span>
                <span>{formatPln(w.do)}</span>
              </div>
              <p className="mt-5 text-sm text-slate-300">
                Oparte na <b className="text-white">{w.liczba}</b> najbardziej podobnych transakcjach spośród {w.wszystkichAktow} aktów sprzedaży mieszkań w promieniu {promien / 1000} km z ostatnich 24 miesięcy. Trend w okolicy:{" "}
                <b className={w.trendRoczny >= 0 ? "text-emerald-300" : "text-rose-300"}>
                  {w.trendRoczny > 0 ? "+" : ""}
                  {w.trendRoczny.toLocaleString("pl-PL")}% rok do roku
                </b>
                .
              </p>
              {roznica !== null && cenaPorownania && (
                <p className="mt-3 rounded-2xl bg-white/5 px-4 py-3 text-sm">
                  Cena {etykietaCeny} {formatPln(cenaPorownania)} to{" "}
                  <b className={roznica > 10 ? "text-amber-300" : roznica < -10 ? "text-sky-300" : "text-emerald-300"}>{roznica > 0 ? `${roznica}% powyżej` : roznica < 0 ? `${-roznica}% poniżej` : "dokładnie"} wyceny</b>.
                </p>
              )}
              <div className="mt-6">
                <PobierzRaport dane={raport} nazwaPliku={`wycena-${(adres || "mieszkanie").toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/gi, "-").slice(0, 60)}.pdf`} />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
                <p className="text-sm font-semibold text-slate-700">Rekomendowana cena wystawienia</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{formatPln(w.cenaOfertowa)}</p>
                <div className="mx-auto my-3 h-0.5 w-12 rounded bg-emerald-500" />
                <p className="text-xs text-slate-500">Z marginesem negocjacyjnym 5%: ogłoszenia zwykle zaczynają wyżej niż cena z aktu.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="mb-3 text-sm font-semibold text-slate-700">Korekty względem mediany z aktów</p>
                {w.korekty.length === 0 ? (
                  <p className="text-sm text-slate-500">Brak: dodaj stan, piętro albo budynek, a wycena uwzględni te cechy.</p>
                ) : (
                  <ul className="space-y-2">
                    {w.korekty.map((k) => (
                      <li key={k.nazwa} className="flex items-center gap-3 text-sm">
                        <span className={`w-12 rounded-md py-0.5 text-center text-xs font-bold ${k.procent > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {k.procent > 0 ? "+" : ""}
                          {Math.round(k.procent * 100)}%
                        </span>
                        {k.nazwa}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs text-slate-400">Mediana z aktów przed korektami: {formatPln(w.medianaM2)}/m²</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="mb-1 text-lg font-semibold text-slate-900">Wpływ standardu na cenę</h2>
              <p className="mb-4 text-sm text-slate-500">Ta sama lokalizacja i metraż, różny stan wykończenia.</p>
              <WplywStandardu warianty={w.warianty} wybrany={stan as "standard"} />
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="mb-1 text-lg font-semibold text-slate-900">Mapa porównań</h2>
              <p className="mb-4 text-sm text-slate-500">
                <span className="text-emerald-600">●</span> blisko wyceny <span className="ml-2 text-rose-500">●</span> drożej <span className="ml-2 text-sky-500">●</span> taniej
              </p>
              <div className="flex justify-center">
                <MapaPorownan porownania={w.porownania} cenaM2={w.cenaM2} />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Cena za m² w okolicy</h2>
            <p className="mb-4 text-sm text-slate-500">Mediana i środkowe 50% transakcji mieszkań w kolejnych miesiącach. Przerywana linia to Twoja wycena.</p>
            <WykresCen seria={w.seria} cenaM2={w.cenaM2} />
            <p className="mb-2 mt-6 text-sm font-semibold text-slate-700">Liczba transakcji w miesiącu</p>
            <WykresLiczby seria={w.seria} />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Porównywalne transakcje</h2>
            <p className="mb-4 text-sm text-slate-500">Od najbardziej podobnej: odległość, data aktu, metraż, pokoje, piętro i rynek.</p>
            <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="py-2 pr-3 font-medium">Data aktu</th>
                    <th className="py-2 pr-3 font-medium">Adres</th>
                    <th className="py-2 pr-3 text-right font-medium">m²</th>
                    <th className="py-2 pr-3 text-right font-medium">Pokoje</th>
                    <th className="py-2 pr-3 text-right font-medium">Piętro</th>
                    <th className="py-2 pr-3 font-medium">Rynek</th>
                    <th className="py-2 pr-3 text-right font-medium">Cena</th>
                    <th className="py-2 pr-3 text-right font-medium">zł/m²</th>
                    <th className="py-2 text-right font-medium">Odległość</th>
                  </tr>
                </thead>
                <tbody>
                  {w.porownania.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 pr-3 tabular-nums text-slate-600">{formatDatePL(t.data)}</td>
                      <td className="py-2.5 pr-3 font-medium text-slate-900">{t.adres}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{t.pow.toLocaleString("pl-PL")}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{t.izby ?? "-"}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{t.pietro ?? "-"}</td>
                      <td className="py-2.5 pr-3 text-slate-600">{t.rynek ?? "-"}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{formatPln(t.cena)}</td>
                      <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{formatPln(t.cenaM2)}</td>
                      <td className="py-2.5 text-right tabular-nums text-slate-600">{t.odleglosc >= 1000 ? `${(t.odleglosc / 1000).toFixed(1)} km` : `${t.odleglosc} m`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Źródło: Rejestr Cen Nieruchomości, usługa GUGiK (ceny z aktów notarialnych). Pomijamy sprzedaże z bonifikatą, przetargi, egzekucje, lokale niemieszkalne i skrajne ceny. To analiza porównawcza do rozmowy o cenie, a nie operat szacunkowy rzeczoznawcy.
              {ofertaId && (
                <>
                  {" "}
                  <Link href={`/app/nieruchomosci/${ofertaId}`} className="font-medium text-emerald-700 hover:underline">
                    Wróć do oferty →
                  </Link>
                </>
              )}
            </p>
          </section>
    </>
  );
}
