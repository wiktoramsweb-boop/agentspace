import Link from "next/link";
import { LicznikProby } from "../components/proba";
import { Kompletnosc, OtworzEdycje } from "./kompletnosc";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NAZWY_STANU } from "@/lib/rcn-wycena";
import { BUDYNKI, OGRZEWANIE, OKRESY, PARKING, ZEWNATRZ } from "@/lib/rcn-parametry";
import { listaWycen, policzWycene, type OfertaDoWyceny } from "@/lib/wyceny";
import { parametryZOferty } from "@/lib/ogloszenie-mapy";
import { PageHeader } from "../components/page-header";
import { AddressInput } from "../components/address-input";
import { Select } from "../components/select";
import { SubmitButton } from "../components/submit-button";
import { WynikWidok } from "./wynik-widok";
import { LinkDoWyceny, PowiazanieWyceny } from "./wycena-klient";
import { OstatnieWyceny } from "./lista-wycen";

export const metadata = { title: "Wycena z RCN" };
export const maxDuration = 60;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

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
  const admin = createSupabaseAdmin();

  const { data: ofertyRaw } = await admin
    .from("properties")
    .select("id, title, address, city, lat, lng, area_m2, rooms, floor, price_pln, deal_kind, market, floors_total, year_built, condition_std, building_type, heating, features, details")
    .eq("agency_id", user.agency_id)
    .eq("property_type", "mieszkanie")
    .neq("status", "archiwum")
    .order("updated_at", { ascending: false })
    .limit(200);
  const oferty = (ofertyRaw ?? []) as unknown as (OfertaDoWyceny & { title: string } & Parameters<typeof parametryZOferty>[0])[];

  const idOferty = typeof sp.oferta === "string" ? sp.oferta.trim() : "";
  const oferta = oferty.find((o) => o.id === idOferty) ?? null;
  // Wejście z karty oferty: to, co oferta już wie, nie jest do wpisywania drugi raz.
  // Pole wysłane z formularza (także puste) ma pierwszeństwo.
  const zOferty = oferta ? parametryZOferty(oferta) : {};
  const parametry: Record<string, string> = { ...zOferty };
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") parametry[k] = v.trim();
  const p = (k: string) => parametry[k] ?? "";

  const podglad = p("podglad") === "1";
  const zapytano = !podglad && Boolean(p("oferta") || p("address") || p("lat"));
  const { adres, cel, proba, brak, wycena, raport: daneRaportu, zapisanaId, powiazanaOferta } = await policzWycene(user, parametry, oferta, zapytano);
  const w = wycena?.wynik ?? null;
  const cenaOferty = oferta?.deal_kind === "sprzedaz" ? oferta.price_pln : null;
  const cenaPorownania = cenaOferty ?? (Number(p("cena_ogl")) || null);
  const ofertaPowiazana = oferty.find((o) => o.id === powiazanaOferta) ?? null;
  const naLiscie = await listaWycen(user);
  const ostatnie = (naLiscie ?? []).slice(0, 5);

  const formularz = (
      <form id="wycena-form" key={p("zrodlo") || "reczna"} method="get" className="mb-8 space-y-4">
        {p("cena_ogl") && <input type="hidden" name="cena_ogl" value={p("cena_ogl")} />}
        {p("zrodlo") && <input type="hidden" name="zrodlo" value={p("zrodlo")} />}
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
              <input name="pow" inputMode="decimal" defaultValue={p("pow") || (oferta?.area_m2 ?? "")} placeholder="np. 48" className={`mt-1 ${pole}`} />
            </label>
            <label className={etykieta}>
              Pokoje
              <input name="izby" inputMode="numeric" defaultValue={p("izby") || (oferta?.rooms ?? "")} placeholder="np. 2" className={`mt-1 ${pole}`} />
            </label>
            <label className={etykieta}>
              Piętro (parter = 0)
              <input name="pietro" inputMode="numeric" defaultValue={p("pietro") || (oferta?.floor ?? "")} placeholder="np. 3" className={`mt-1 ${pole}`} />
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
      <PageHeader
        title="Wycena mieszkania"
        subtitle="Ceny z aktów notarialnych z okolicy (Rejestr Cen Nieruchomości). Im więcej szczegółów, tym węższy przedział."
        action={
          <Link href="/app/wycena-rcn/historia" className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
            Moje wyceny{naLiscie?.length ? ` (${naLiscie.length})` : ""}
          </Link>
        }
      />

      {!w && <LicznikProby stan={proba} rodzaj="wycena" />}

      {!w && !(proba.naProbie && proba.zostalo <= 0) && (
        <>
          {!oferta && <LinkDoWyceny zrodlo={p("zrodlo")} />}
          {podglad && <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Dane z ogłoszenia są już w formularzu. Sprawdź je i kliknij „Wyceń mieszkanie”.</p>}
          {formularz}
          {ostatnie.length > 0 && <OstatnieWyceny wyceny={ostatnie} />}
        </>
      )}

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
          {zapisanaId ? (
            <PowiazanieWyceny wycenaId={zapisanaId} oferty={oferty.map((o) => ({ id: o.id, title: o.title }))} powiazana={ofertaPowiazana ? { id: ofertaPowiazana.id, title: ofertaPowiazana.title } : null} zrodlo={p("zrodlo") || null} />
          ) : (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Tej wyceny nie zapisano. Zapisywanie wycen ruszy po uruchomieniu migracji v58.</p>
          )}
          <WynikWidok w={w} promien={wycena.promien} raport={daneRaportu} adres={adres} stan={cel.stan ?? "standard"} ofertaId={oferta?.id ?? null} cenaPorownania={cenaPorownania} etykietaCeny={cenaOferty ? "w ofercie" : "w ogłoszeniu"} />
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
