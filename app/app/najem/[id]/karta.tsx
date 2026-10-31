"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Select } from "../../components/select";
import { ETAPY_NAJMU, FORMY_UMOWY, MODELE_ROZLICZEN, ROLE_STRON, TYPY_NAJMU, type Konfig, type Krok, type Rozliczenie } from "@/lib/najem-model";
import type { Lokal, NajemPelny, Strona, WplataPelna, Zdarzenie } from "@/lib/data-najem";
import { formatPln } from "@/lib/format";
import { dodajStrone, dodajZdarzenie, oznaczKrok, usunStrone, zapiszLokal, zapiszNajem, zapiszWplate, zmienEtapLokalu, zmienNajem, zmienZdarzenie } from "../actions";

const POLE = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";
const ET = "mb-1 block text-xs font-medium text-slate-500";
const SEKCJA = "rounded-3xl border border-slate-200 bg-white p-5";
const PRZYCISK = "rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50";
const data = (d: string | null) => (d ? d.split("-").reverse().join(".") : "-");

function useAkcja() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [info, setInfo] = useState<string | null>(null);
  const uruchom = (f: () => Promise<{ ok: boolean; error?: string }>, ok?: string) =>
    start(async () => {
      const w = await f();
      setInfo(w.ok ? (ok ?? null) : (w.error ?? "Nie udało się."));
      router.refresh();
    });
  return { pending, info, uruchom };
}

export function EtapyLokalu({ id, etap }: { id: string; etap: string }) {
  const { pending, uruchom } = useAkcja();
  const idx = ETAPY_NAJMU.findIndex((e) => e.id === etap);
  return (
    <div className={`flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 ${pending ? "opacity-70" : ""}`}>
      {ETAPY_NAJMU.map((e, i) => (
        <button
          key={e.id}
          type="button"
          disabled={pending || e.id === etap}
          aria-current={e.id === etap ? "step" : undefined}
          onClick={() => uruchom(() => zmienEtapLokalu(id, e.id))}
          className={`flex min-w-[118px] flex-1 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition ${e.id === etap ? "bg-emerald-600 text-white" : i < idx ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
        >
          <span className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[11px] ${e.id === etap ? "bg-white/25" : i < idx ? "bg-emerald-200" : "bg-slate-200"}`}>{i < idx ? "✓" : i + 1}</span>
          {e.nazwa}
        </button>
      ))}
    </div>
  );
}

export function ListaKrokow({ id, etap, kroki, zrobione }: { id: string; etap: string; kroki: Krok[]; zrobione: Record<string, boolean> }) {
  const { uruchom } = useAkcja();
  const [stan, setStan] = useState(zrobione);
  const nazwa = ETAPY_NAJMU.find((e) => e.id === etap)?.nazwa;
  const gotowe = kroki.filter((k) => stan[k.id]).length;
  return (
    <section className={SEKCJA}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-slate-900">Do zrobienia: {nazwa}</h2>
        {kroki.length > 0 && (
          <span className="text-sm font-semibold tabular-nums text-slate-500">
            {gotowe}/{kroki.length}
          </span>
        )}
      </div>
      {kroki.length === 0 ? (
        <p className="mt-1 text-sm text-slate-500">Na tym etapie nie ma listy kroków.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {kroki.map((k) => (
            <li key={k.id}>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={Boolean(stan[k.id])}
                  onChange={(e) => {
                    setStan((s) => ({ ...s, [k.id]: e.target.checked }));
                    uruchom(() => oznaczKrok(id, k.id, e.target.checked));
                  }}
                  className="mt-0.5 h-4 w-4 accent-emerald-600"
                />
                <span className={`text-sm ${stan[k.id] ? "text-slate-400 line-through" : "text-slate-800"}`}>{k.nazwa}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const ANKIETA: { k: string; l: string; opcje?: string[] }[] = [
  { k: "parking", l: "Miejsce postojowe", opcje: ["Tak", "Nie"] },
  { k: "komorka", l: "Komórka lub piwnica", opcje: ["Tak", "Nie"] },
  { k: "zwierzeta", l: "Zwierzęta", opcje: ["Akceptowane", "Pod warunkiem", "Nieakceptowane"] },
  { k: "palenie", l: "Palenie", opcje: ["Dopuszczalne", "Niedopuszczalne"] },
  { k: "media", l: "Media po wynajęciu", opcje: ["Na najemcę", "Zostają na właścicielu"] },
  { k: "akceptacja", l: "Akceptacja najemcy", opcje: ["Właściciel akceptuje każdego", "Biuro w granicach parametrów"] },
  { k: "osoby", l: "Maksymalnie osób" },
  { k: "zaangazowanie", l: "Zaangażowanie właściciela (1-10)" },
];
const LICZNIKI = [
  ["prad", "Prąd: nr i stan"],
  ["ppe", "Numer PPE"],
  ["woda_zimna", "Woda zimna"],
  ["woda_ciepla", "Woda ciepła"],
  ["gaz", "Gaz: punkt i stan"],
  ["klucze", "Klucze (komplety, kto ma)"],
];

export function DaneLokalu({ lokal: l, k }: { lokal: Lokal; k: Konfig }) {
  const { pending, info, uruchom } = useAkcja();
  const s = (v: number | string | null | undefined) => (v == null ? "" : String(v));
  const [f, setF] = useState({ kw: s(l.kw), pow: s(l.pow), pokoje: s(l.pokoje), typ_najmu: l.typ_najmu, model: l.model, prowizja_pct: s(l.prowizja_pct), oplata_startowa: s(l.oplata_startowa), czynsz_oczekiwany: s(l.czynsz_oczekiwany), czynsz_min: s(l.czynsz_min), limit_napraw: s(l.limit_napraw), oplaty_admin: s(l.oplaty_admin), umowa_od: s(l.umowa_od), parking_w_podstawie: l.parking_w_podstawie ? "1" : "0", notatka: s(l.notatka) });
  const [ank, setAnk] = useState<Record<string, string>>(l.ankieta);
  const [lic, setLic] = useState<Record<string, string>>(l.liczniki);
  const ustaw = (x: keyof typeof f) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [x]: e.target.value }));
  const pole = (x: keyof typeof f, label: string, type = "text") => (
    <label>
      <span className={ET}>{label}</span>
      <input value={f[x]} onChange={ustaw(x)} type={type} inputMode={type === "text" && x !== "kw" ? "decimal" : undefined} className={POLE} />
    </label>
  );
  return (
    <div className="space-y-5">
      <section className={SEKCJA}>
        <h2 className="mb-3 font-semibold text-slate-900">Karta lokalu</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {pole("kw", "Księga wieczysta")}
          {pole("pow", "Metraż")}
          {pole("pokoje", "Pokoje")}
          <div>
            <span className={ET}>Typ najmu</span>
            <Select aria-label="Typ najmu" value={f.typ_najmu} onChange={ustaw("typ_najmu")} options={TYPY_NAJMU.filter((t) => k.typy.includes(t.id) || t.id === f.typ_najmu).map((t) => ({ value: t.id, label: t.nazwa }))} placeholder="" />
          </div>
          {pole("czynsz_oczekiwany", "Czynsz oczekiwany (zł)")}
          {pole("czynsz_min", "Czynsz minimalny (zł)")}
          {pole("oplaty_admin", "Opłaty administracyjne (zł/mc)")}
          {pole("umowa_od", "Umowa o zarządzanie od", "date")}
        </div>
      </section>
      <section className={SEKCJA}>
        <h2 className="mb-3 font-semibold text-slate-900">Warunki z właścicielem</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="col-span-2 lg:col-span-3">
            <span className={ET}>Model rozliczeń</span>
            <Select aria-label="Model rozliczeń" value={f.model} onChange={ustaw("model")} options={MODELE_ROZLICZEN.filter((m) => k.modele.includes(m.id) || m.id === f.model).map((m) => ({ value: m.id, label: m.nazwa, hint: m.opis }))} placeholder="" />
          </div>
          {pole("prowizja_pct", "Prowizja (%)")}
          {pole("oplata_startowa", "Opłata startowa (zł)")}
          {pole("limit_napraw", "Limit napraw bez zgody (zł)")}
          <label className="col-span-2 flex items-center gap-2.5 text-sm text-slate-700 lg:col-span-3">
            <input type="checkbox" checked={f.parking_w_podstawie === "1"} onChange={(e) => setF((v) => ({ ...v, parking_w_podstawie: e.target.checked ? "1" : "0" }))} className="h-4 w-4 accent-emerald-600" />
            Parking wliczony do podstawy prowizji
          </label>
        </div>
      </section>
      <section className={SEKCJA}>
        <h2 className="mb-3 font-semibold text-slate-900">Ankieta właściciela</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {ANKIETA.map((a) =>
            a.opcje ? (
              <div key={a.k}>
                <span className={ET}>{a.l}</span>
                <Select aria-label={a.l} value={ank[a.k] ?? ""} onChange={(e) => setAnk((v) => ({ ...v, [a.k]: e.target.value }))} options={a.opcje} placeholder="nie podano" />
              </div>
            ) : (
              <label key={a.k}>
                <span className={ET}>{a.l}</span>
                <input value={ank[a.k] ?? ""} onChange={(e) => setAnk((v) => ({ ...v, [a.k]: e.target.value }))} inputMode="numeric" className={POLE} />
              </label>
            ),
          )}
        </div>
      </section>
      <section className={SEKCJA}>
        <h2 className="mb-3 font-semibold text-slate-900">Liczniki i klucze</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {LICZNIKI.map(([x, label]) => (
            <label key={x}>
              <span className={ET}>{label}</span>
              <input value={lic[x] ?? ""} onChange={(e) => setLic((v) => ({ ...v, [x]: e.target.value }))} className={POLE} />
            </label>
          ))}
        </div>
        <label className="mt-3 block">
          <span className={ET}>Notatka</span>
          <textarea value={f.notatka} onChange={ustaw("notatka")} rows={3} className={POLE} />
        </label>
      </section>
      <div className="flex items-center gap-3">
        <button type="button" disabled={pending} onClick={() => uruchom(() => zapiszLokal(l.id, f, ank, lic), "Zapisane.")} className={PRZYCISK}>
          {pending ? "Zapisuję…" : "Zapisz kartę lokalu"}
        </button>
        {info && <span className="text-sm text-slate-500">{info}</span>}
      </div>
    </div>
  );
}

export function Strony({ id, strony }: { id: string; strony: Strona[] }) {
  const { pending, info, uruchom } = useAkcja();
  const pusta = { rola: "najemca", nazwa: "", telefon: "", email: "", uwagi: "" };
  const [f, setF] = useState(pusta);
  const ustaw = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [k]: e.target.value }));
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section className={SEKCJA}>
        <h2 className="mb-2 font-semibold text-slate-900">Strony najmu</h2>
        {strony.length === 0 && <p className="text-sm text-slate-500">Dodaj właściciela i najemcę.</p>}
        <ul className="divide-y divide-slate-100">
          {strony.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{s.nazwa}</p>
                <p className="text-sm text-slate-500">
                  {ROLE_STRON.find((r) => r.id === s.rola)?.nazwa}
                  {s.telefon ? ` · ${s.telefon}` : ""}
                  {s.email ? ` · ${s.email}` : ""}
                </p>
                {s.uwagi && <p className="text-xs text-slate-500">{s.uwagi}</p>}
              </div>
              {s.telefon && (
                <a href={`tel:${s.telefon}`} className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200">
                  Zadzwoń
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Usunąć: ${s.nazwa}?`)) uruchom(() => usunStrone(id, s.id));
                }}
                className="text-sm text-slate-400 hover:text-rose-600"
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className={SEKCJA}>
        <h2 className="mb-3 font-semibold text-slate-900">Dodaj osobę</h2>
        <div className="space-y-3">
          <div>
            <span className={ET}>Rola</span>
            <Select aria-label="Rola" value={f.rola} onChange={ustaw("rola")} options={ROLE_STRON.map((r) => ({ value: r.id, label: r.nazwa }))} placeholder="" />
          </div>
          <label className="block">
            <span className={ET}>Imię i nazwisko albo firma</span>
            <input value={f.nazwa} onChange={ustaw("nazwa")} className={POLE} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={ET}>Telefon</span>
              <input value={f.telefon} onChange={ustaw("telefon")} inputMode="tel" className={POLE} />
            </label>
            <label>
              <span className={ET}>E-mail</span>
              <input value={f.email} onChange={ustaw("email")} inputMode="email" className={POLE} />
            </label>
          </div>
          <label className="block">
            <span className={ET}>Uwagi</span>
            <input value={f.uwagi} onChange={ustaw("uwagi")} className={POLE} />
          </label>
          <button
            type="button"
            disabled={pending || !f.nazwa.trim()}
            onClick={() => {
              uruchom(() => dodajStrone(id, f));
              setF(pusta);
            }}
            className={PRZYCISK}
          >
            Dodaj
          </button>
          {info && <p className="text-sm text-rose-600">{info}</p>}
        </div>
      </section>
    </div>
  );
}

export function UmowaNajmu({ id, najmy, k, oplatyAdmin, czynsz }: { id: string; najmy: NajemPelny[]; k: Konfig; oplatyAdmin: number | null; czynsz: number | null }) {
  const { pending, info, uruchom } = useAkcja();
  const aktywny = najmy.find((n) => n.aktywny) ?? null;
  const [nowa, setNowa] = useState(!aktywny);
  const [f, setF] = useState({ forma: k.formy[0], od: "", do_dnia: "", czynsz: czynsz ? String(czynsz) : "", parking: "", oplaty: oplatyAdmin ? String(oplatyAdmin) : "", kaucja: "", dzien: "10" });
  const ustaw = (x: keyof typeof f) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [x]: e.target.value }));
  const forma = FORMY_UMOWY.find((x) => x.id === f.forma);
  return (
    <div className="space-y-5">
      {aktywny && (
        <section className="rounded-3xl bg-slate-900 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">{FORMY_UMOWY.find((x) => x.id === aktywny.forma)?.nazwa}</p>
          <p className="mt-1 text-2xl font-bold">
            {data(aktywny.od)} – {aktywny.do_dnia ? data(aktywny.do_dnia) : "czas nieokreślony"}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ["Czynsz", formatPln(aktywny.czynsz)],
              ["Parking", formatPln(aktywny.parking)],
              ["Opłaty", formatPln(aktywny.oplaty)],
              ["Kaucja", formatPln(aktywny.kaucja)],
            ].map(([a, b]) => (
              <div key={a}>
                <dt className="text-slate-400">{a}</dt>
                <dd className="font-semibold tabular-nums">{b}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {aktywny && (
        <section className={SEKCJA}>
          <div className="grid gap-3 sm:grid-cols-3">
            {aktywny.forma === "okazjonalny" && (
              <label>
                <span className={ET}>Zgłoszono do urzędu skarbowego</span>
                <input type="date" defaultValue={aktywny.us_zgloszono ?? ""} onChange={(e) => uruchom(() => zmienNajem(id, aktywny.id, { us: e.target.value }))} className={POLE} />
              </label>
            )}
            <div>
              <span className={ET}>Kaucja</span>
              <Select aria-label="Kaucja" value={aktywny.kaucja_stan} onChange={(e) => uruchom(() => zmienNajem(id, aktywny.id, { kaucja_stan: e.target.value }))} options={[{ value: "pobrana", label: "Pobrana" }, { value: "rozliczona", label: "Rozliczona" }, { value: "zwrocona", label: "Zwrócona" }]} placeholder="" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => setNowa((v) => !v)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-400">
              Nowa umowa albo aneks
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm("Zakończyć najem? Lokal przejdzie na etap „Koniec najmu”.")) uruchom(() => zmienNajem(id, aktywny.id, { zakoncz: true }));
              }}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              Zakończ najem
            </button>
          </div>
        </section>
      )}
      {nowa && (
        <section className={SEKCJA}>
          <h2 className="mb-3 font-semibold text-slate-900">Umowa z najemcą</h2>
          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            {FORMY_UMOWY.filter((x) => k.formy.includes(x.id)).map((x) => (
              <button key={x.id} type="button" aria-pressed={f.forma === x.id} onClick={() => setF((v) => ({ ...v, forma: x.id }))} className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${f.forma === x.id ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                {x.nazwa}
              </button>
            ))}
          </div>
          <p className="mb-3 text-sm text-slate-500">{forma?.opis}</p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {(
              [
                ["od", "Początek", "date"],
                ["do_dnia", "Koniec (puste: bezterminowo)", "date"],
                ["czynsz", "Czynsz (zł)", "text"],
                ["parking", "Parking (zł)", "text"],
                ["oplaty", "Opłaty i media (zł)", "text"],
                ["kaucja", "Kaucja (zł)", "text"],
                ["dzien", "Dzień płatności", "text"],
              ] as const
            ).map(([x, l, t]) => (
              <label key={x}>
                <span className={ET}>{l}</span>
                <input value={f[x]} onChange={ustaw(x)} type={t} inputMode={t === "text" ? "decimal" : undefined} className={POLE} />
              </label>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button type="button" disabled={pending} onClick={() => uruchom(() => zapiszNajem(id, f))} className={PRZYCISK}>
              {pending ? "Zapisuję…" : "Zapisz umowę"}
            </button>
            {info && <span className="text-sm text-rose-600">{info}</span>}
          </div>
        </section>
      )}
      {najmy.filter((n) => !n.aktywny).length > 0 && (
        <section className={SEKCJA}>
          <h2 className="mb-2 font-semibold text-slate-900">Poprzednie umowy</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {najmy
              .filter((n) => !n.aktywny)
              .map((n) => (
                <li key={n.id} className="flex justify-between gap-3 py-2">
                  <span className="text-slate-700">
                    {FORMY_UMOWY.find((x) => x.id === n.forma)?.nazwa}: {data(n.od)} – {data(n.do_dnia)}
                  </span>
                  <b className="tabular-nums text-slate-900">{formatPln(n.czynsz)}</b>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}

type NaglowekRozliczenia = { adres: string; wlasciciel: string; najemca: string; model: string; modelNazwa: string; prowizjaPct: number; biuro: string; dniNaZastrzezenia: number };

export function Wplaty({ id, dane, naglowek }: { id: string; dane: { r: Rozliczenie; wplata: WplataPelna | null; kaucja: number }[]; naglowek: NaglowekRozliczenia }) {
  const [otwarty, setOtwarty] = useState<string | null>(null);
  if (!dane.length) return <p className={`${SEKCJA} text-sm text-slate-500`}>Rozliczenia pojawią się po dodaniu umowy najmu.</p>;
  return (
    <section className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-5">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="py-2 pr-3 font-medium">Miesiąc</th>
            <th className="py-2 pr-3 text-right font-medium">Należne</th>
            <th className="py-2 pr-3 text-right font-medium">Wpłacono</th>
            <th className="py-2 pr-3 text-right font-medium">Prowizja</th>
            <th className="py-2 pr-3 text-right font-medium">Koszty</th>
            <th className="py-2 pr-3 text-right font-medium">{naglowek.model === "A" ? "Do przekazania" : "Do zapłaty biuru"}</th>
            <th className="py-2 pr-3 font-medium">Stan</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {dane.flatMap(({ r, wplata, kaucja }) => [
            <tr key={r.miesiac} className="border-b border-slate-100">
              <td className="py-2.5 pr-3 font-medium tabular-nums text-slate-900">
                {r.miesiac.slice(5)}/{r.miesiac.slice(0, 4)}
              </td>
              <td className="py-2.5 pr-3 text-right tabular-nums">{formatPln(r.czynszNalezny + r.oplatyNalezne)}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums">{formatPln(r.wplaty)}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums">{formatPln(r.prowizja)}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums">{formatPln(r.koszty)}</td>
              <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{formatPln(naglowek.model === "A" ? r.doPrzekazania : r.doZaplatyPrzezWlasciciela)}</td>
              <td className="py-2.5 pr-3">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${r.zaleglosc > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{r.zaleglosc > 0 ? `Brakuje ${formatPln(r.zaleglosc)}` : "Rozliczone"}</span>
              </td>
              <td className="py-2.5 text-right">
                <button type="button" aria-expanded={otwarty === r.miesiac} onClick={() => setOtwarty(otwarty === r.miesiac ? null : r.miesiac)} className="text-sm font-semibold text-emerald-700 hover:underline">
                  {otwarty === r.miesiac ? "Zwiń" : "Wpisz"}
                </button>
              </td>
            </tr>,
            otwarty === r.miesiac ? (
              <tr key={`${r.miesiac}-e`}>
                <td colSpan={8} className="bg-slate-50 p-3">
                  <EdycjaWplaty id={id} r={r} wplata={wplata} kaucja={kaucja} naglowek={naglowek} />
                </td>
              </tr>
            ) : null,
          ])}
        </tbody>
      </table>
    </section>
  );
}

function EdycjaWplaty({ id, r, wplata, kaucja, naglowek }: { id: string; r: Rozliczenie; wplata: WplataPelna | null; kaucja: number; naglowek: NaglowekRozliczenia }) {
  const { pending, info, uruchom } = useAkcja();
  const [f, setF] = useState({ czynsz: String(wplata?.czynsz ?? ""), oplaty: String(wplata?.oplaty ?? ""), koszty: String(wplata?.koszty ?? ""), koszty_opis: wplata?.koszty_opis ?? "", przekazano: wplata?.przekazano ?? "" });
  const [blad, setBlad] = useState<string | null>(null);
  const ustaw = (x: keyof typeof f) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [x]: e.target.value }));
  async function pdf() {
    setBlad(null);
    try {
      const { rozliczeniePdf } = await import("@/lib/najem-pdf");
      const b = await rozliczeniePdf({ ...naglowek, miesiac: r.miesiac, r, czynszWplata: wplata?.czynsz ?? 0, oplatyWplata: wplata?.oplaty ?? 0, kosztyOpis: wplata?.koszty_opis ?? null, kaucja });
      const url = URL.createObjectURL(new Blob([b as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `rozliczenie-${r.miesiac}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setBlad("Nie udało się przygotować PDF.");
    }
  }
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <label>
          <span className={ET}>Czynsz wpłacony</span>
          <input value={f.czynsz} onChange={ustaw("czynsz")} inputMode="decimal" className={POLE} />
        </label>
        <label>
          <span className={ET}>Opłaty i media</span>
          <input value={f.oplaty} onChange={ustaw("oplaty")} inputMode="decimal" className={POLE} />
        </label>
        <label>
          <span className={ET}>Koszty i naprawy</span>
          <input value={f.koszty} onChange={ustaw("koszty")} inputMode="decimal" className={POLE} />
        </label>
        <label>
          <span className={ET}>Czego dotyczą koszty</span>
          <input value={f.koszty_opis} onChange={ustaw("koszty_opis")} className={POLE} />
        </label>
        <label>
          <span className={ET}>Data przelewu</span>
          <input type="date" value={f.przekazano} onChange={ustaw("przekazano")} className={POLE} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" disabled={pending} onClick={() => uruchom(() => zapiszWplate(id, r.miesiac, f))} className={PRZYCISK}>
          Zapisz
        </button>
        <button type="button" onClick={() => setF((v) => ({ ...v, czynsz: String(r.czynszNalezny), oplaty: String(r.oplatyNalezne) }))} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-400">
          Wpłacono całość
        </button>
        <button type="button" onClick={pdf} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-400">
          Rozliczenie dla właściciela (PDF)
        </button>
        {(info || blad) && <span className="text-sm text-rose-600">{info ?? blad}</span>}
      </div>
    </div>
  );
}

const STANY: Record<string, string> = { otwarte: "Otwarte", w_toku: "W toku", zamkniete: "Zamknięte" };

export function Zgloszenia({ id, zdarzenia, limit, przegladyRok }: { id: string; zdarzenia: Zdarzenie[]; limit: number; przegladyRok: number }) {
  const { pending, info, uruchom } = useAkcja();
  const pusta = { rodzaj: "usterka", tytul: "", koszt: "", termin: "" };
  const [f, setF] = useState(pusta);
  const ustaw = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [k]: e.target.value }));
  const ponadLimit = Number(f.koszt.replace(",", ".")) > limit && limit > 0;
  const rok = new Date().getFullYear();
  const przeglady = zdarzenia.filter((z) => z.rodzaj === "przeglad" && z.created_at.startsWith(String(rok))).length;
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section className={SEKCJA}>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Usterki, przeglądy, zdarzenia</h2>
          {przegladyRok > 0 && (
            <span className="text-sm text-slate-500">
              Przeglądy {rok}: {przeglady}/{przegladyRok}
            </span>
          )}
        </div>
        {zdarzenia.length === 0 && <p className="text-sm text-slate-500">Brak wpisów.</p>}
        <ul className="divide-y divide-slate-100">
          {zdarzenia.map((z) => (
            <li key={z.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{z.tytul}</p>
                <p className="text-xs text-slate-500">
                  {z.rodzaj === "usterka" ? "Usterka" : z.rodzaj === "przeglad" ? "Przegląd" : "Zdarzenie"}
                  {z.termin ? ` · termin ${data(z.termin)}` : ""}
                  {z.koszt ? ` · ${formatPln(Number(z.koszt))}` : ""}
                </p>
              </div>
              <div className="w-36">
                <Select aria-label="Stan" value={z.stan} onChange={(e) => uruchom(() => zmienZdarzenie(id, z.id, e.target.value))} options={Object.entries(STANY).map(([value, label]) => ({ value, label }))} placeholder="" />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className={SEKCJA}>
        <h2 className="mb-3 font-semibold text-slate-900">Nowy wpis</h2>
        <div className="space-y-3">
          <div>
            <span className={ET}>Rodzaj</span>
            <Select aria-label="Rodzaj" value={f.rodzaj} onChange={ustaw("rodzaj")} options={[{ value: "usterka", label: "Usterka" }, { value: "przeglad", label: "Przegląd lokalu" }, { value: "zdarzenie", label: "Inne zdarzenie" }]} placeholder="" />
          </div>
          <label className="block">
            <span className={ET}>Opis</span>
            <input value={f.tytul} onChange={ustaw("tytul")} className={POLE} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={ET}>Koszt (zł)</span>
              <input value={f.koszt} onChange={ustaw("koszt")} inputMode="decimal" className={POLE} />
            </label>
            <label>
              <span className={ET}>Termin</span>
              <input type="date" value={f.termin} onChange={ustaw("termin")} className={POLE} />
            </label>
          </div>
          {ponadLimit && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">Powyżej limitu {formatPln(limit)}: potrzebna zgoda właściciela, chyba że to awaria.</p>}
          <button
            type="button"
            disabled={pending || !f.tytul.trim()}
            onClick={() => {
              uruchom(() => dodajZdarzenie(id, f));
              setF(pusta);
            }}
            className={PRZYCISK}
          >
            Dodaj
          </button>
          {info && <p className="text-sm text-rose-600">{info}</p>}
        </div>
      </section>
    </div>
  );
}
