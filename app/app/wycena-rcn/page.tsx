import Link from "next/link";
import { createHash } from "node:crypto";
import { juzLiczone, stanProby, zuzyjProbe } from "@/lib/proba";
import { LicznikProby } from "../components/proba";
import { Kompletnosc, OtworzEdycje } from "./kompletnosc";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { geocodePl } from "@/lib/geocode";
import { wycenaZRcn, type WycenaRcn } from "@/lib/rcn";
import { NAZWY_STANU, type CelWyceny, type OkresBudowy, type Parking, type RodzajBudynku, type Stan, type Zewnatrz } from "@/lib/rcn-wycena";
import type { DaneRaportu } from "@/lib/wycena-pdf";
import { formatPln } from "@/lib/format";
import { formatDatePL, todayPL } from "@/lib/datetime";
import { PageHeader } from "../components/page-header";
import { AddressInput } from "../components/address-input";
import { Select } from "../components/select";
import { SubmitButton } from "../components/submit-button";
import { MapaPorownan, WplywStandardu, WykresCen, WykresLiczby } from "./wykresy";
import { PobierzRaport } from "./pobierz-raport";

export const metadata = { title: "Wycena z RCN" };
export const maxDuration = 60;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const PEWNOSC = {
  wysoka: { label: "Duża pewność", kolor: "bg-emerald-100 text-emerald-700" },
  srednia: { label: "Średnia pewność", kolor: "bg-amber-100 text-amber-700" },
  niska: { label: "Mała pewność", kolor: "bg-rose-100 text-rose-700" },
};

const BUDYNKI: Record<RodzajBudynku, string> = { blok: "Blok", kamienica: "Kamienica", apartamentowiec: "Apartamentowiec", wielorodzinny: "Dom wielorodzinny" };
const OKRESY: Record<OkresBudowy, string> = { przed_1945: "Przed 1945", "1945_1970": "1945-1970", "1971_1990": "1971-1990", "1991_2005": "1991-2005", "2006_2015": "2006-2015", po_2015: "Po 2015" };
const ZEWNATRZ: Record<Zewnatrz, string> = { brak: "Brak", balkon: "Balkon", taras: "Taras", ogrod: "Ogródek" };
const PARKING: Record<Parking, string> = { brak: "Brak", naziemne: "Miejsce naziemne", garaz: "Garaż podziemny" };
const OGRZEWANIE: Record<string, string> = { miejskie: "Miejskie", gazowe: "Gazowe", elektryczne: "Elektryczne", pompa: "Pompa ciepła", inne: "Inne" };

const zKlucza = <T extends string>(mapa: Record<T, string>, v: string): T | null => (v in mapa ? (v as T) : null);

const pole = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";
const etykieta = "block text-sm font-medium text-slate-700";

function Sekcja({ tytul, children }: { tytul: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{tytul}</h2>
      {children}
    </section>
  );
}

function Wybor({ nazwa, label, opcje, wartosc }: { nazwa: string; label: string; opcje: Record<string, string>; wartosc: string }) {
  return (
    <label className={etykieta}>
      {label}
      <div className="mt-1">
        <Select name={nazwa} defaultValue={wartosc} placeholder="wybierz">
          {Object.entries(opcje).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
    </label>
  );
}

export default async function WycenaRcnPage({ searchParams }: Props) {
  const user = await requireModul("nieruchomosci");
  const sp = await searchParams;
  const p = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const liczba = (k: string) => {
    const v = Number(p(k).replace(",", "."));
    return p(k) !== "" && Number.isFinite(v) ? v : null;
  };
  const admin = createSupabaseAdmin();

  const { data: ofertyRaw } = await admin
    .from("properties")
    .select("id, title, address, city, lat, lng, area_m2, rooms, floor, price_pln, deal_kind")
    .eq("agency_id", user.agency_id)
    .eq("property_type", "mieszkanie")
    .neq("status", "archiwum")
    .order("updated_at", { ascending: false })
    .limit(200);
  const oferty = (ofertyRaw ?? []) as { id: string; title: string; address: string | null; city: string | null; lat: number | null; lng: number | null; area_m2: number | null; rooms: number | null; floor: number | null; price_pln: number | null; deal_kind: string }[];

  const oferta = oferty.find((o) => o.id === p("oferta")) ?? null;
  let lat = liczba("lat") || oferta?.lat || null;
  let lng = liczba("lng") || oferta?.lng || null;
  const adres = p("address") || [oferta?.address, oferta?.city].filter(Boolean).join(", ");
  const cel: Omit<CelWyceny, "x" | "y"> = {
    pow: liczba("pow") || oferta?.area_m2 || 0,
    izby: liczba("izby") ?? oferta?.rooms ?? null,
    pietro: liczba("pietro") ?? oferta?.floor ?? null,
    pieter: liczba("pieter"),
    winda: p("winda") === "tak" ? true : p("winda") === "nie" ? false : null,
    rynek: p("rynek") === "pierwotny" || p("rynek") === "wtorny" ? (p("rynek") as "pierwotny" | "wtorny") : null,
    stan: zKlucza(NAZWY_STANU, p("stan")) as Stan | null,
    budynek: zKlucza(BUDYNKI, p("budynek")),
    okres: zKlucza(OKRESY, p("okres")),
    zewnatrz: zKlucza(ZEWNATRZ, p("zewnatrz")),
    piwnica: p("piwnica") === "1" ? true : null,
    parking: zKlucza(PARKING, p("parking")),
  };
  const ogrzewanie = OGRZEWANIE[p("ogrzewanie")] ?? null;
  const dla = p("dla").slice(0, 80) || null;

  // Adres wpisany bez wyboru z podpowiedzi: dociągamy współrzędne sami.
  if ((!lat || !lng) && adres) {
    const g = await geocodePl(adres, 1).catch(() => []);
    if (g[0]) {
      lat = g[0].lat;
      lng = g[0].lng;
    }
  }

  const pola = [Boolean(lat && lng), Boolean(cel.pow), cel.izby != null, cel.pietro != null, cel.pieter != null, cel.rynek != null, cel.stan != null, cel.budynek != null, cel.okres != null, cel.winda != null, cel.zewnatrz != null, cel.parking != null];
  const kompletnosc = Math.round((pola.filter(Boolean).length / pola.length) * 100);

  const zapytano = Boolean(p("oferta") || p("address") || p("lat"));
  // Okres próbny i demo: trzy wyceny. Ślad zapytania sprawia, że odświeżenie
  // tej samej wyceny nie zabiera kolejnego podejścia.
  let proba = await stanProby(user, "wycena");
  const slad = createHash("sha1").update(JSON.stringify([adres, lat, lng, cel])).digest("hex").slice(0, 12);
  const zablokowana = zapytano && proba.naProbie && proba.zostalo <= 0 && !(await juzLiczone(user, "wycena", slad));
  let wycena: WycenaRcn | null = null;
  let brak: string | null = null;
  if (zapytano && !zablokowana) {
    if (!lat || !lng) brak = "Nie udało się ustalić położenia. Wybierz adres z podpowiedzi albo uzupełnij współrzędne oferty.";
    else if (!cel.pow) brak = "Podaj metraż mieszkania.";
    else wycena = await wycenaZRcn(lat, lng, cel);
  }
  const w = wycena?.wynik ?? null;
  if (w && proba.naProbie) {
    await zuzyjProbe(user, "wycena", slad);
    proba = await stanProby(user, "wycena");
  }
  const cenaOferty = oferta?.deal_kind === "sprzedaz" ? oferta.price_pln : null;
  const roznica = w && cenaOferty ? Math.round(((cenaOferty - w.szacunek) / w.szacunek) * 100) : null;

  const parametry: [string, string][] = [
    ["Powierzchnia", cel.pow ? `${cel.pow.toLocaleString("pl-PL")} m²` : "-"],
    ["Pokoje", cel.izby != null ? String(cel.izby) : "-"],
    ["Piętro", cel.pietro != null ? `${cel.pietro === 0 ? "parter" : cel.pietro}${cel.pieter != null ? ` / ${cel.pieter}` : ""}` : "-"],
    ["Winda", cel.winda == null ? "-" : cel.winda ? "Tak" : "Nie"],
    ["Rynek", cel.rynek === "pierwotny" ? "Pierwotny" : cel.rynek === "wtorny" ? "Wtórny" : "-"],
    ["Stan", cel.stan ? NAZWY_STANU[cel.stan] : "-"],
    ["Typ budynku", cel.budynek ? BUDYNKI[cel.budynek] : "-"],
    ["Okres budowy", cel.okres ? OKRESY[cel.okres] : "-"],
    ["Balkon / taras", cel.zewnatrz ? ZEWNATRZ[cel.zewnatrz] : "-"],
    ["Piwnica / komórka", cel.piwnica ? "Tak" : "-"],
    ["Parking", cel.parking ? PARKING[cel.parking] : "-"],
    ["Ogrzewanie", ogrzewanie ?? "-"],
  ];
  const dzis = todayPL();
  const daneRaportu: DaneRaportu | null =
    w && wycena
      ? {
          adres: adres || "Mieszkanie",
          dla,
          biuro: user.agency?.name ?? "Biuro nieruchomości",
          agent: user.full_name ?? "",
          data: `${dzis.slice(8, 10)}.${dzis.slice(5, 7)}.${dzis.slice(0, 4)}`,
          promien: wycena.promien,
          parametry,
          wybranyStan: cel.stan ?? "standard",
          wynik: w,
        }
      : null;

  const formularz = (
      <form id="wycena-form" method="get" className="mb-8 space-y-4">
        <Sekcja tytul="Adres nieruchomości">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className={etykieta}>
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
              <AddressInput label="Albo adres" defaultAddress={p("address")} defaultLat={p("lat")} defaultLng={p("lng")} placeholder="np. Kraków, Sołtysowska 25" />
            </div>
          </div>
        </Sekcja>

        <Sekcja tytul="Dane podstawowe">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <label className={etykieta}>
              Metraż (m²) *
              <input name="pow" inputMode="decimal" defaultValue={p("pow")} placeholder={oferta?.area_m2 ? String(oferta.area_m2) : "np. 48"} className={`mt-1 ${pole}`} />
            </label>
            <label className={etykieta}>
              Pokoje
              <input name="izby" inputMode="numeric" defaultValue={p("izby")} placeholder={oferta?.rooms ? String(oferta.rooms) : "np. 2"} className={`mt-1 ${pole}`} />
            </label>
            <label className={etykieta}>
              Piętro (parter = 0)
              <input name="pietro" inputMode="numeric" defaultValue={p("pietro")} placeholder={oferta?.floor != null ? String(oferta.floor) : "np. 3"} className={`mt-1 ${pole}`} />
            </label>
            <label className={etykieta}>
              Pięter w budynku
              <input name="pieter" inputMode="numeric" defaultValue={p("pieter")} placeholder="np. 5" className={`mt-1 ${pole}`} />
            </label>
            <Wybor nazwa="rynek" label="Rynek" opcje={{ wtorny: "Wtórny", pierwotny: "Pierwotny" }} wartosc={p("rynek")} />
          </div>
        </Sekcja>

        <Sekcja tytul="Stan i budynek">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Wybor nazwa="stan" label="Stan mieszkania" opcje={NAZWY_STANU} wartosc={p("stan")} />
            <Wybor nazwa="budynek" label="Rodzaj budynku" opcje={BUDYNKI} wartosc={p("budynek")} />
            <Wybor nazwa="okres" label="Okres budowy" opcje={OKRESY} wartosc={p("okres")} />
            <Wybor nazwa="winda" label="Winda" opcje={{ tak: "Tak", nie: "Nie" }} wartosc={p("winda")} />
          </div>
        </Sekcja>

        <Sekcja tytul="Dodatki">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Wybor nazwa="zewnatrz" label="Balkon, taras, ogród" opcje={ZEWNATRZ} wartosc={p("zewnatrz")} />
            <Wybor nazwa="parking" label="Miejsce postojowe" opcje={PARKING} wartosc={p("parking")} />
            <Wybor nazwa="ogrzewanie" label="Ogrzewanie" opcje={OGRZEWANIE} wartosc={p("ogrzewanie")} />
            <label className="flex items-end gap-3 pb-2.5 text-sm font-medium text-slate-700">
              <input type="checkbox" name="piwnica" value="1" defaultChecked={p("piwnica") === "1"} className="h-5 w-5 rounded border-slate-300 text-emerald-600" />
              Piwnica lub komórka
            </label>
          </div>
          <label className={`${etykieta} mt-4`}>
            Raport dla (opcjonalnie)
            <input name="dla" defaultValue={p("dla")} placeholder="np. Pani Anna, Mokotów" className={`mt-1 ${pole}`} />
          </label>
        </Sekcja>

        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <Kompletnosc formId="wycena-form" />
          <SubmitButton className="rounded-xl bg-emerald-500 px-8 py-3 text-base font-semibold text-white hover:bg-emerald-400" pendingText="Liczę z aktów…">
            Wyceń mieszkanie
          </SubmitButton>
        </div>
      </form>
  );

  return (
    <>
      <PageHeader title="Wycena mieszkania" subtitle="Ceny z aktów notarialnych z okolicy (Rejestr Cen Nieruchomości). Im więcej szczegółów, tym węższy przedział." />

      {!w && <LicznikProby stan={proba} rodzaj="wycena" />}

      {!w && !(proba.naProbie && proba.zostalo <= 0) && formularz}

      {brak && <p className="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{brak}</p>}

      {wycena && !w && (
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          {wycena.blad
            ? `Rejestr Cen Nieruchomości nie odpowiedział (${wycena.blad}). Spróbuj za chwilę.`
            : `Za mało podobnych transakcji w promieniu ${wycena.promien / 1000} km (pobrano ${wycena.pobrane} aktów). Część powiatów nie udostępnia jeszcze danych w usłudze GUGiK, wtedy zostaje wniosek do starostwa.`}
        </div>
      )}

      {w && wycena && daneRaportu && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <p className="min-w-0 text-slate-600">
              Raport: <b className="text-slate-900">{adres || "mieszkanie"}</b>, {cel.pow.toLocaleString("pl-PL")} m²
              {proba.naProbie && <span className="ml-2 text-emerald-700">· wersja próbna, zostało wycen: {proba.zostalo}</span>}
            </p>
            <OtworzEdycje />
          </div>
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
                Oparte na <b className="text-white">{w.liczba}</b> najbardziej podobnych transakcjach spośród {w.wszystkichAktow} aktów sprzedaży mieszkań w promieniu {wycena.promien / 1000} km z ostatnich 24 miesięcy. Trend w okolicy:{" "}
                <b className={w.trendRoczny >= 0 ? "text-emerald-300" : "text-rose-300"}>
                  {w.trendRoczny > 0 ? "+" : ""}
                  {w.trendRoczny.toLocaleString("pl-PL")}% rok do roku
                </b>
                .
              </p>
              {roznica !== null && cenaOferty && (
                <p className="mt-3 rounded-2xl bg-white/5 px-4 py-3 text-sm">
                  Cena w ofercie {formatPln(cenaOferty)} to{" "}
                  <b className={roznica > 10 ? "text-amber-300" : roznica < -10 ? "text-sky-300" : "text-emerald-300"}>{roznica > 0 ? `${roznica}% powyżej` : roznica < 0 ? `${-roznica}% poniżej` : "dokładnie"} wyceny</b>.
                </p>
              )}
              <div className="mt-6">
                <PobierzRaport dane={daneRaportu} nazwaPliku={`wycena-${(adres || "mieszkanie").toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/gi, "-").slice(0, 60)}.pdf`} />
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
              <WplywStandardu warianty={w.warianty} wybrany={cel.stan ?? "standard"} />
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
        </div>
      )}
      {w && (
        <details id="edycja" className="group mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <summary className="cursor-pointer list-none text-base font-semibold text-slate-900">
            <span className="mr-2 inline-block transition group-open:rotate-90">›</span>Edytuj dane i przelicz
          </summary>
          <div className="mt-4">{formularz}</div>
        </details>
      )}
    </>
  );
}
