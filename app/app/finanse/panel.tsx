"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { Select } from "../components/select";
import { pole, PrzyciskUsun } from "../dokumenty-wzory/klocki";
import { KATEGORIE_KOSZTOW, nazwaKategorii, nazwaMiesiaca, STAWKI_VAT } from "@/lib/koszty-model";
import type { Koszt, StalyKoszt, WynikMiesiaca, Wyplata } from "@/lib/data-finanse";
import {
  dodajKoszt, dodajStalyKoszt, oplacKoszt, oznaczWyplate, przelaczStalyKoszt, usunKoszt, usunStalyKoszt,
} from "./actions";

export type Widok = "koszty" | "stale" | "wyplaty";

const zl = (n: number) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(Math.round(n)) + " zł";
const zl2 = (n: number) => new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " zł";
const dataPL = (iso: string) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : "-");

export function PanelFinansow({
  miesiac, dzis, widok, koszty, stale, wyplaty, wyniki, eksport,
}: {
  miesiac: string;
  dzis: string;
  widok: Widok;
  koszty: Koszt[];
  stale: StalyKoszt[];
  wyplaty: Wyplata[];
  wyniki: WynikMiesiaca[];
  eksport: { koszty: string; wyplaty: string; sprzedaz: string };
}) {
  const biezacy = wyniki[wyniki.length - 1];
  const doWyplaty = wyplaty.filter((w) => !w.agent_paid_at && w.agent_earnings_pln > 0);
  const zakladki: { id: Widok; l: string; licznik?: number }[] = [
    { id: "koszty", l: "Koszty", licznik: koszty.length },
    { id: "stale", l: "Stałe opłaty", licznik: stale.filter((s) => s.active).length },
    { id: "wyplaty", l: "Wypłaty prowizji", licznik: doWyplaty.length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kafel l="Prowizje z transakcji" v={zl(biezacy?.prowizjeBiura ?? 0)} s={`${biezacy?.transakcje ?? 0} zamkniętych`} />
        <Kafel l="Dla agentów" v={zl(biezacy?.wynagrodzeniaAgentow ?? 0)} s={doWyplaty.length ? `${doWyplaty.length} do wypłaty` : "wszystko wypłacone"} />
        <Kafel l="Koszty biura (netto)" v={zl(biezacy?.kosztyNetto ?? 0)} s={`${zl(biezacy?.kosztyBrutto ?? 0)} brutto`} />
        <Kafel
          l="Wynik miesiąca"
          v={zl(biezacy?.wynik ?? 0)}
          s="przed podatkiem dochodowym"
          ton={(biezacy?.wynik ?? 0) >= 0 ? "plus" : "minus"}
        />
      </div>

      <Wykres wyniki={wyniki} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
          {zakladki.map((z) => (
            <Link
              key={z.id}
              href={`/app/finanse?m=${miesiac}&widok=${z.id}`}
              role="tab"
              aria-selected={widok === z.id}
              scroll={false}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${widok === z.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {z.l}
              {z.licznik ? <span className="ml-1.5 text-xs text-slate-400">{z.licznik}</span> : null}
            </Link>
          ))}
        </div>
        <details className="relative">
          <summary className="cursor-pointer list-none rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-slate-400">
            Paczka dla księgowej ▾
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <a href={eksport.sprzedaz} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
              <span className="font-medium text-slate-800">Ewidencja sprzedaży</span>
              <span className="block text-xs text-slate-400">Faktury z miesiąca, rozbite na stawki VAT</span>
            </a>
            <a href={eksport.koszty} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
              <span className="font-medium text-slate-800">Koszty</span>
              <span className="block text-xs text-slate-400">Wszystkie koszty z miesiąca, netto, VAT, brutto</span>
            </a>
            <a href={eksport.wyplaty} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
              <span className="font-medium text-slate-800">Wypłaty prowizji</span>
              <span className="block text-xs text-slate-400">Należne i wypłacone prowizje agentów</span>
            </a>
            <p className="px-3 pb-1 pt-2 text-xs text-slate-400">Pliki CSV otwierają się w Excelu dwuklikiem.</p>
          </div>
        </details>
      </div>

      {widok === "koszty" && <Koszty koszty={koszty} dzis={dzis} miesiac={miesiac} />}
      {widok === "stale" && <Stale stale={stale} />}
      {widok === "wyplaty" && <Wyplaty wyplaty={wyplaty} miesiac={miesiac} />}
    </div>
  );
}

function Kafel({ l, v, s, ton }: { l: string; v: string; s?: string; ton?: "plus" | "minus" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{l}</p>
      <p className={`mt-1 text-xl font-semibold tracking-tight sm:text-2xl ${ton === "minus" ? "text-red-600" : ton === "plus" ? "text-emerald-700" : "text-slate-900"}`}>{v}</p>
      {s && <p className="mt-0.5 text-xs text-slate-500">{s}</p>}
    </div>
  );
}

/** Słupki wyniku z 6 miesięcy. Ujemny wynik rośnie w dół od osi. */
function Wykres({ wyniki }: { wyniki: WynikMiesiaca[] }) {
  const maks = Math.max(1, ...wyniki.map((w) => Math.abs(w.wynik)), ...wyniki.map((w) => w.prowizjeBiura));
  const maMinus = wyniki.some((w) => w.wynik < 0);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-slate-900">Ostatnie 6 miesięcy</p>
        <div className="flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-slate-300" />Prowizje</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" />Wynik</span>
        </div>
      </div>
      <div className={`mt-4 grid grid-cols-6 items-end gap-2 sm:gap-4 ${maMinus ? "h-48" : "h-36"}`}>
        {wyniki.map((w) => (
          <div key={w.miesiac} className="flex h-full flex-col justify-end" title={`${nazwaMiesiaca(w.miesiac)}: prowizje ${zl(w.prowizjeBiura)}, wynik ${zl(w.wynik)}`}>
            <div className={`flex items-end gap-1 ${maMinus ? "h-2/3" : "h-full"}`}>
              <div className="flex-1 rounded-t bg-slate-300" style={{ height: `${(w.prowizjeBiura / maks) * 100}%` }} />
              <div className="flex-1 rounded-t bg-emerald-500" style={{ height: `${(Math.max(0, w.wynik) / maks) * 100}%` }} />
            </div>
            {maMinus && (
              <div className="flex h-1/3 items-start gap-1 border-t border-slate-200">
                <div className="flex-1" />
                <div className="flex-1 rounded-b bg-red-400" style={{ height: `${(Math.max(0, -w.wynik) / maks) * 100}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-6 gap-2 text-center text-[11px] text-slate-400 sm:gap-4">
        {wyniki.map((w) => (
          <span key={w.miesiac} className="truncate capitalize">{nazwaMiesiaca(w.miesiac).split(" ")[0].slice(0, 3)}</span>
        ))}
      </div>
    </div>
  );
}

// ── Koszty ─────────────────────────────────────────────────

function FormularzKosztu({ staly, dzis, miesiac, onGotowe }: { staly?: boolean; dzis: string; miesiac?: string; onGotowe: () => void }) {
  const [vat, setVat] = useState("23");
  const [kat, setKat] = useState("inne");
  const [tryb, setTryb] = useState<"netto" | "brutto">("brutto");
  const [bladT, setBlad] = useState<string | null>(null);
  const [pracuje, start] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const domyslnaData = miesiac && dzis.slice(0, 7) !== miesiac ? `${miesiac}-01` : dzis;

  return (
    <form
      ref={form}
      action={(f) =>
        start(async () => {
          f.set("vat", vat);
          f.set("category", kat);
          f.set("mode", tryb);
          const r = staly ? await dodajStalyKoszt(f) : await dodajKoszt(f);
          if (!r.ok) return setBlad(r.error);
          setBlad(null);
          form.current?.reset();
          onGotowe();
        })
      }
      className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs text-slate-500" htmlFor="k-name">Za co</label>
          <input id="k-name" name="name" required maxLength={200} placeholder={staly ? "Czynsz za lokal" : "Pakiet ogłoszeń Otodom"} className={pole} />
        </div>
        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs text-slate-500">Kategoria</label>
          <Select aria-label="Kategoria" value={kat} onChange={(e) => setKat(e.target.value)} options={KATEGORIE_KOSZTOW.map((k) => ({ value: k.v, label: k.l }))} placeholder="" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-slate-500" htmlFor="k-amount">Kwota</label>
          <div className="flex gap-1">
            <input id="k-amount" name="amount" required inputMode="decimal" placeholder="0,00" className={`${pole} min-w-0`} />
            <button
              type="button"
              onClick={() => setTryb(tryb === "brutto" ? "netto" : "brutto")}
              className="flex-shrink-0 rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-600 hover:border-slate-400"
              title="Przełącz netto/brutto"
            >
              {tryb}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">VAT</label>
          <Select aria-label="Stawka VAT" value={vat} onChange={(e) => setVat(e.target.value)} options={STAWKI_VAT.map((s) => ({ value: s.v, label: s.l }))} placeholder="" />
        </div>
        {staly ? (
          <div>
            <label className="mb-1 block text-xs text-slate-500" htmlFor="k-day">Dzień miesiąca</label>
            <input id="k-day" name="day_of_month" type="number" min={1} max={28} defaultValue={10} className={pole} />
          </div>
        ) : (
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs text-slate-500" htmlFor="k-date">Data</label>
            <input id="k-date" name="cost_date" type="date" defaultValue={domyslnaData} className={pole} />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-slate-500" htmlFor="k-vendor">Kontrahent</label>
          <input id="k-vendor" name="vendor" maxLength={200} placeholder="Nazwa firmy" className={pole} />
        </div>
        {!staly && (
          <>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-500" htmlFor="k-inv">Nr faktury</label>
              <input id="k-inv" name="invoice_no" maxLength={80} className={pole} />
            </div>
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-slate-700 sm:col-span-2">
              <input type="checkbox" name="paid" className="h-4 w-4 accent-emerald-600" /> Już opłacony
            </label>
          </>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={pracuje} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60">
          {pracuje ? "Zapisuję…" : staly ? "Dodaj stałą opłatę" : "Dodaj koszt"}
        </button>
        {staly && <span className="text-xs text-slate-500">Co miesiąc w tym dniu koszt sam wpisze się na listę.</span>}
        {bladT && <span className="text-sm text-red-600">{bladT}</span>}
      </div>
    </form>
  );
}

function Koszty({ koszty, dzis, miesiac }: { koszty: Koszt[]; dzis: string; miesiac: string }) {
  const [nowy, setNowy] = useState(koszty.length === 0);
  const [filtr, setFiltr] = useState("");
  const [, start] = useTransition();
  const wgKategorii = useMemo(() => {
    const m = new Map<string, number>();
    for (const k of koszty) m.set(k.category, (m.get(k.category) ?? 0) + k.net_pln);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [koszty]);
  const suma = koszty.reduce((s, k) => s + k.net_pln, 0);
  const lista = filtr ? koszty.filter((k) => k.category === filtr) : koszty;
  const nieoplacone = koszty.filter((k) => !k.paid);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-4">
        {nowy ? (
          <FormularzKosztu dzis={dzis} miesiac={miesiac} onGotowe={() => setNowy(false)} />
        ) : (
          <button type="button" onClick={() => setNowy(true)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400">
            + Dodaj koszt
          </button>
        )}

        {lista.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Brak kosztów w tym miesiącu. Dodaj pierwszy albo ustaw stałe opłaty, żeby czynsz i abonamenty wpisywały się same.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <ul className="divide-y divide-slate-100">
              {lista.map((k) => (
                <li key={k.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {k.name}
                      {k.schedule_id && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-500">stała</span>}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {dataPL(k.cost_date)} · {nazwaKategorii(k.category)}
                      {k.vendor ? ` · ${k.vendor}` : ""}
                      {k.invoice_no ? ` · FV ${k.invoice_no}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">{zl2(k.gross_pln)}</p>
                    <p className="text-[11px] text-slate-400">{zl2(k.net_pln)} netto</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => start(async () => { await oplacKoszt(k.id, !k.paid); })}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${k.paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                    title={k.paid ? "Kliknij, żeby oznaczyć jako nieopłacony" : "Kliknij, żeby oznaczyć jako opłacony"}
                  >
                    {k.paid ? "opłacony" : "do zapłaty"}
                  </button>
                  <PrzyciskUsun
                    tytul={`Usuń koszt: ${k.name}`}
                    onClick={() => {
                      if (confirm(`Usunąć koszt „${k.name}”?`)) start(async () => { await usunKoszt(k.id); });
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Na co idą pieniądze</p>
          {wgKategorii.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Pojawi się po dodaniu kosztów.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {wgKategorii.map(([kat, kw]) => (
                <li key={kat}>
                  <button type="button" onClick={() => setFiltr(filtr === kat ? "" : kat)} className="block w-full text-left">
                    <div className={`flex justify-between text-xs ${filtr === kat ? "font-semibold text-emerald-700" : "text-slate-600"}`}>
                      <span>{nazwaKategorii(kat)}</span>
                      <span>{zl(kw)}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${(kw / Math.max(1, suma)) * 100}%` }} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {filtr && (
            <button type="button" onClick={() => setFiltr("")} className="mt-3 text-xs text-slate-500 hover:text-slate-800">Pokaż wszystkie</button>
          )}
        </div>
        {nieoplacone.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Do zapłaty: {zl2(nieoplacone.reduce((s, k) => s + k.gross_pln, 0))}</p>
            <p className="mt-0.5 text-xs">{nieoplacone.length} {nieoplacone.length === 1 ? "pozycja" : nieoplacone.length < 5 ? "pozycje" : "pozycji"} w tym miesiącu</p>
          </div>
        )}
      </aside>
    </div>
  );
}

// ── Stałe opłaty ───────────────────────────────────────────

function Stale({ stale }: { stale: StalyKoszt[] }) {
  const [nowy, setNowy] = useState(stale.length === 0);
  const [, start] = useTransition();
  const miesiecznie = stale.filter((s) => s.active).reduce((s, x) => s + x.gross_pln, 0);
  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-slate-500">
        Czynsz, abonamenty portali, CRM, telefony, leasing. Wpisujesz raz, a co miesiąc w dniu płatności koszt sam pojawia się na liście kosztów.
        {stale.length > 0 && <> Razem <strong className="text-slate-800">{zl(miesiecznie)}</strong> brutto miesięcznie.</>}
      </p>
      {nowy ? (
        <FormularzKosztu staly dzis="" onGotowe={() => setNowy(false)} />
      ) : (
        <button type="button" onClick={() => setNowy(true)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400">
          + Dodaj stałą opłatę
        </button>
      )}
      {stale.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {stale.map((s) => (
              <li key={s.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${s.active ? "" : "opacity-50"}`}>
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate text-sm font-medium text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-400">
                    {s.day_of_month}. dnia miesiąca · {nazwaKategorii(s.category)}{s.vendor ? ` · ${s.vendor}` : ""}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-800">{zl2(s.gross_pln)}</p>
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={s.active}
                    onChange={(e) => start(async () => { await przelaczStalyKoszt(s.id, e.target.checked); })}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  aktywna
                </label>
                <PrzyciskUsun
                  tytul={`Usuń stałą opłatę: ${s.name}`}
                  onClick={() => {
                    if (confirm(`Usunąć stałą opłatę „${s.name}”? Koszty wpisane wcześniej zostaną na liście.`)) start(async () => { await usunStalyKoszt(s.id); });
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Wypłaty ────────────────────────────────────────────────

function Wyplaty({ wyplaty, miesiac }: { wyplaty: Wyplata[]; miesiac: string }) {
  const [pracuje, start] = useTransition();
  const [blad, setBlad] = useState<string | null>(null);
  const zalegle = wyplaty.filter((w) => w.closed_at.slice(0, 7) < miesiac);
  const biezace = wyplaty.filter((w) => w.closed_at.slice(0, 7) >= miesiac);
  const wgAgenta = useMemo(() => {
    const m = new Map<string, { imie: string; nalezne: number; wyplacone: number }>();
    for (const w of wyplaty) {
      const a = m.get(w.agent_id) ?? { imie: w.agentName, nalezne: 0, wyplacone: 0 };
      if (w.agent_paid_at) a.wyplacone += w.agent_paid_pln ?? 0;
      else a.nalezne += w.agent_earnings_pln;
      m.set(w.agent_id, a);
    }
    return [...m.values()].sort((a, b) => b.nalezne - a.nalezne);
  }, [wyplaty]);

  function wyplac(w: Wyplata) {
    const domyslna = String(Math.round(w.agent_earnings_pln * 100) / 100).replace(".", ",");
    const odp = prompt(`Kwota wypłacona agentowi (${w.agentName}) za „${w.title}”:`, domyslna);
    if (odp == null) return;
    const n = Number(odp.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return setBlad("Nieprawidłowa kwota.");
    start(async () => {
      const r = await oznaczWyplate(w.id, n);
      setBlad(r.ok ? null : r.error);
    });
  }

  const lista = (tytul: string, lista: Wyplata[]) =>
    lista.length === 0 ? null : (
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-900">{tytul}</p>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {lista.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate text-sm font-medium text-slate-800">{w.title}</p>
                  <p className="text-xs text-slate-400">{w.agentName} · zamknięta {dataPL(w.closed_at.slice(0, 10))} · prowizja biura {zl(w.commission_pln)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{zl2(w.agent_paid_at ? w.agent_paid_pln ?? 0 : w.agent_earnings_pln)}</p>
                  <p className="text-[11px] text-slate-400">{w.agent_paid_at ? `wypłacono ${dataPL(w.agent_paid_at.slice(0, 10))}` : "należne agentowi"}</p>
                </div>
                {w.agent_paid_at ? (
                  <button
                    type="button"
                    disabled={pracuje}
                    onClick={() => { if (confirm("Cofnąć oznaczenie wypłaty?")) start(async () => { await oznaczWyplate(w.id, null); }); }}
                    className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                  >
                    wypłacone ✓
                  </button>
                ) : w.agent_earnings_pln > 0 ? (
                  <button
                    type="button"
                    disabled={pracuje}
                    onClick={() => wyplac(w)}
                    className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    Oznacz wypłatę
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">bez prowizji agenta</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-5">
        {blad && <p className="text-sm text-red-600">{blad}</p>}
        {wyplaty.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            W tym miesiącu nie zamknięto żadnej transakcji i nie ma zaległych wypłat.
          </p>
        )}
        {lista("Zaległe z wcześniejszych miesięcy", zalegle)}
        {lista(`Transakcje zamknięte: ${nazwaMiesiaca(miesiac)}`, biezace)}
      </div>
      {wgAgenta.length > 0 && (
        <aside className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Według agentów</p>
          <ul className="mt-3 space-y-3">
            {wgAgenta.map((a) => (
              <li key={a.imie} className="text-sm">
                <p className="font-medium text-slate-800">{a.imie}</p>
                <p className="text-xs text-slate-500">
                  {a.nalezne > 0 ? <span className="font-semibold text-amber-700">do wypłaty {zl(a.nalezne)}</span> : "nic do wypłaty"}
                  {a.wyplacone > 0 ? ` · wypłacono ${zl(a.wyplacone)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
