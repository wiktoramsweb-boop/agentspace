import Link from "next/link";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { geocodePl } from "@/lib/geocode";
import { wycenaZRcn, type WycenaRcn } from "@/lib/rcn";
import { formatPln } from "@/lib/format";
import { formatDatePL } from "@/lib/datetime";
import { PageHeader } from "../components/page-header";
import { AddressInput } from "../components/address-input";
import { Select } from "../components/select";
import { SubmitButton } from "../components/submit-button";

export const metadata = { title: "Wycena z RCN" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const PEWNOSC = {
  wysoka: { label: "Duża pewność", kolor: "bg-emerald-100 text-emerald-700" },
  srednia: { label: "Średnia pewność", kolor: "bg-amber-100 text-amber-700" },
  niska: { label: "Mała pewność", kolor: "bg-rose-100 text-rose-700" },
};

export default async function WycenaRcnPage({ searchParams }: Props) {
  const user = await requireModul("nieruchomosci");
  const sp = await searchParams;
  const p = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const admin = createSupabaseAdmin();

  const { data: ofertyRaw } = await admin
    .from("properties")
    .select("id, title, address, city, lat, lng, area_m2, rooms, price_pln, property_type, deal_kind")
    .eq("agency_id", user.agency_id)
    .eq("property_type", "mieszkanie")
    .neq("status", "archiwum")
    .order("updated_at", { ascending: false })
    .limit(200);
  const oferty = (ofertyRaw ?? []) as { id: string; title: string; address: string | null; city: string | null; lat: number | null; lng: number | null; area_m2: number | null; rooms: number | null; price_pln: number | null; deal_kind: string }[];

  const oferta = oferty.find((o) => o.id === p("oferta")) ?? null;
  let lat = Number(p("lat")) || oferta?.lat || null;
  let lng = Number(p("lng")) || oferta?.lng || null;
  const adres = p("address") || [oferta?.address, oferta?.city].filter(Boolean).join(", ");
  const pow = Number(p("pow").replace(",", ".")) || oferta?.area_m2 || null;
  const izby = Number(p("izby")) || oferta?.rooms || null;
  const rynek = p("rynek") === "pierwotny" || p("rynek") === "wtorny" ? (p("rynek") as "pierwotny" | "wtorny") : null;

  // Adres wpisany bez wyboru z podpowiedzi: dociągamy współrzędne sami.
  if ((!lat || !lng) && adres) {
    const g = await geocodePl(adres, 1).catch(() => []);
    if (g[0]) {
      lat = g[0].lat;
      lng = g[0].lng;
    }
  }

  const zapytano = Boolean(p("oferta") || p("address") || p("lat"));
  let wycena: WycenaRcn | null = null;
  let brak: string | null = null;
  if (zapytano) {
    if (!lat || !lng) brak = "Nie udało się ustalić położenia. Wybierz adres z podpowiedzi albo uzupełnij współrzędne oferty.";
    else if (!pow) brak = "Podaj metraż mieszkania.";
    else wycena = await wycenaZRcn(lat, lng, { pow, izby, rynek });
  }
  const w = wycena?.wynik ?? null;
  const cenaOferty = oferta?.deal_kind === "sprzedaz" ? oferta.price_pln : null;
  const roznica = w && cenaOferty ? Math.round(((cenaOferty - w.szacunek) / w.szacunek) * 100) : null;

  const pole = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";

  return (
    <>
      <PageHeader
        title="Wycena z RCN"
        subtitle="Ceny z aktów notarialnych z okolicy, z Rejestru Cen Nieruchomości. Dla mieszkań, z ostatnich 24 miesięcy."
      />

      <form method="get" className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Oferta z bazy
            <div className="mt-1">
              <Select name="oferta" defaultValue={oferta?.id ?? ""} placeholder="Bez oferty, wpiszę adres">
                {oferty.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </Select>
            </div>
          </label>
          <div className="text-sm font-medium text-slate-700">
            <AddressInput label="Albo adres" defaultAddress={p("address")} defaultLat={p("lat")} defaultLng={p("lng")} placeholder="np. Kraków, Krupnicza 32" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="block text-sm font-medium text-slate-700">
            Metraż (m²)
            <input name="pow" inputMode="decimal" defaultValue={p("pow")} placeholder={oferta?.area_m2 ? String(oferta.area_m2) : "np. 52"} className={`mt-1 ${pole}`} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Pokoje
            <input name="izby" inputMode="numeric" defaultValue={p("izby")} placeholder={oferta?.rooms ? String(oferta.rooms) : "np. 2"} className={`mt-1 ${pole}`} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Rynek
            <div className="mt-1">
              <Select name="rynek" defaultValue={rynek ?? ""} placeholder="Dowolny">
                <option value="wtorny">Wtórny</option>
                <option value="pierwotny">Pierwotny</option>
              </Select>
            </div>
          </label>
          <div className="flex items-end">
            <SubmitButton className="w-full rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400">Sprawdź ceny</SubmitButton>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">Puste pola metrażu i pokoi biorą wartości z wybranej oferty.</p>
      </form>

      {brak && <p className="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{brak}</p>}

      {wycena && !w && (
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          {wycena.blad
            ? `Rejestr Cen Nieruchomości nie odpowiedział (${wycena.blad}). Spróbuj za chwilę.`
            : `Za mało podobnych transakcji w promieniu ${wycena.promien / 1000} km (pobrano ${wycena.pobrane} aktów). Część powiatów nie udostępnia jeszcze danych w usłudze GUGiK, wtedy zostaje wniosek do starostwa.`}
        </div>
      )}

      {w && wycena && pow && (
        <>
          <section className="mb-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-300">Szacowana cena {pow} m²{izby ? `, ${izby} pok.` : ""}</p>
                <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${PEWNOSC[w.pewnosc].kolor}`}>{PEWNOSC[w.pewnosc].label}</span>
              </div>
              <p className="mt-2 text-4xl font-bold tabular-nums sm:text-5xl">{formatPln(w.szacunek)}</p>
              <p className="mt-1 text-sm text-slate-300">
                Połowa podobnych transakcji mieści się między {formatPln(w.od)} a {formatPln(w.do)}.
              </p>
              <div className="relative mt-6 h-2 rounded-full bg-white/10">
                <div className="absolute inset-y-0 left-[15%] right-[15%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                <span className="absolute -top-1.5 left-1/2 h-5 w-1 -translate-x-1/2 rounded-full bg-white" />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>{formatPln(w.p25M2)}/m²</span>
                <span className="font-semibold text-white">{formatPln(w.medianaM2)}/m²</span>
                <span>{formatPln(w.p75M2)}/m²</span>
              </div>
              {roznica !== null && cenaOferty && (
                <p className="mt-5 rounded-2xl bg-white/5 px-4 py-3 text-sm">
                  Cena w ofercie {formatPln(cenaOferty)} to{" "}
                  <b className={roznica > 10 ? "text-amber-300" : roznica < -10 ? "text-sky-300" : "text-emerald-300"}>
                    {roznica > 0 ? `${roznica}% powyżej` : roznica < 0 ? `${-roznica}% poniżej` : "dokładnie"} mediany
                  </b>{" "}
                  z transakcji w okolicy.
                </p>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Akty w wycenie", String(w.liczba)],
                ["Promień", `${wycena.promien} m`],
                ["Okres", w.okres ? `${formatDatePL(w.okres.od)} – ${formatDatePL(w.okres.do)}` : "-"],
                ["Mediana za m²", `${formatPln(w.medianaM2)}`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Najbardziej podobne transakcje</h2>
            <p className="mb-4 text-sm text-slate-500">Ułożone od najbardziej podobnej: odległość, data aktu, metraż i liczba pokoi.</p>
            <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[720px] text-sm">
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
                      <td className="py-2.5 text-right tabular-nums text-slate-600">{t.odleglosc} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Źródło: Rejestr Cen Nieruchomości, usługa GUGiK (ceny z aktów notarialnych, bezpłatne od 13.02.2026). Odrzucamy sprzedaże z bonifikatą, przetargi, egzekucje, lokale niemieszkalne
              i skrajne ceny. To wskazówka do rozmowy o cenie, a nie operat szacunkowy rzeczoznawcy.
              {oferta && (
                <>
                  {" "}
                  <Link href={`/app/nieruchomosci/${oferta.id}`} className="font-medium text-emerald-700 hover:underline">
                    Wróć do oferty →
                  </Link>
                </>
              )}
            </p>
          </section>
        </>
      )}
    </>
  );
}
