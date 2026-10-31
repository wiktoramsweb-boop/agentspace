"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Modal } from "../components/modal";
import { Select } from "../components/select";
import { AddressInput } from "../components/address-input";
import { Tablica, type KolumnaTablicy, type Przeniesienie } from "../components/tablica";
import { ETAPY_NAJMU, MODELE_ROZLICZEN, TYPY_NAJMU, type Konfig, type RodzajOkresu } from "@/lib/najem-model";
import { formatPln } from "@/lib/format";
import { nowyLokal, przeniesLokal } from "./actions";

const POLE = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";
const ETYKIETA = "mb-1 block text-sm font-medium text-slate-700";

export function NowyLokal({ k }: { k: Konfig }) {
  const router = useRouter();
  const [otwarte, setOtwarte] = useState(false);
  const [typ, setTyp] = useState(k.typy[0]);
  const [model, setModel] = useState(k.modele[0]);
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <button type="button" onClick={() => setOtwarte(true)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">
        + Dodaj lokal
      </button>
      {otwarte && (
        <Modal title="Nowy lokal w zarządzaniu" onClose={() => setOtwarte(false)} maxWidth="max-w-2xl">
          <form
            className="space-y-5 overflow-y-auto px-6 py-5"
            action={(fd) =>
              start(async () => {
                setBlad(null);
                const f = Object.fromEntries([...fd.entries()].map(([a, b]) => [a, String(b)]));
                const w = await nowyLokal({ ...f, typ, model });
                if (!w.ok) return setBlad(w.error);
                router.push(`/app/najem/${w.id}`);
              })
            }
          >
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Lokal</h3>
              <AddressInput label="Adres" />
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <label>
                  <span className={ETYKIETA}>Metraż</span>
                  <input name="pow" inputMode="decimal" className={POLE} />
                </label>
                <label>
                  <span className={ETYKIETA}>Pokoje</span>
                  <input name="pokoje" inputMode="numeric" className={POLE} />
                </label>
                <label>
                  <span className={ETYKIETA}>Czynsz oczekiwany</span>
                  <input name="czynsz" inputMode="numeric" className={POLE} />
                </label>
                <label>
                  <span className={ETYKIETA}>Czynsz minimalny</span>
                  <input name="czynszMin" inputMode="numeric" className={POLE} />
                </label>
              </div>
            </section>
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Właściciel</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <label>
                  <span className={ETYKIETA}>Imię i nazwisko</span>
                  <input name="wlasciciel" className={POLE} />
                </label>
                <label>
                  <span className={ETYKIETA}>Telefon</span>
                  <input name="telefon" inputMode="tel" className={POLE} />
                </label>
                <label>
                  <span className={ETYKIETA}>E-mail</span>
                  <input name="email" inputMode="email" className={POLE} />
                </label>
              </div>
            </section>
            <section className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className={ETYKIETA}>Typ najmu</span>
                <Select aria-label="Typ najmu" value={typ} onChange={(e) => setTyp(e.target.value)} options={TYPY_NAJMU.filter((t) => k.typy.includes(t.id)).map((t) => ({ value: t.id, label: t.nazwa }))} placeholder="" />
              </div>
              <div>
                <span className={ETYKIETA}>Model rozliczeń</span>
                <Select aria-label="Model rozliczeń" value={model} onChange={(e) => setModel(e.target.value)} options={MODELE_ROZLICZEN.filter((m) => k.modele.includes(m.id)).map((m) => ({ value: m.id, label: m.nazwa }))} placeholder="" />
              </div>
            </section>
            <p className="text-xs text-slate-500">
              Warunki startowe: prowizja {k.prowizjaPct}%, opłata startowa {formatPln(k.oplataStartowa)}. Zmienisz je na karcie lokalu.
            </p>
            {blad && <p className="text-sm text-rose-600">{blad}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOtwarte(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Anuluj
              </button>
              <button type="submit" disabled={pending} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                {pending ? "Zapisuję…" : "Dodaj lokal"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

type Karta = { id: string; kolumna: string; pos: number | null; adres: string; wlasciciel: string | null; najemca: string | null; czynsz: number | null; prowizjaPct: number; koniec: string | null };

export function TablicaNajmu({ karty }: { karty: Karta[] }) {
  const router = useRouter();
  const kolumny: KolumnaTablicy[] = ETAPY_NAJMU.map((e) => ({
    id: e.id,
    nazwa: e.nazwa,
    kolor: e.kolor,
    podsumowanie: (lista) => {
      const suma = (lista as Karta[]).reduce((a, k) => a + ((k.czynsz ?? 0) * k.prowizjaPct) / 100, 0);
      return suma > 0 ? (
        <>
          Prowizja mc: <span className="font-semibold text-slate-700">{formatPln(suma)}</span>
        </>
      ) : null;
    },
  }));
  async function przenies(p: Przeniesienie) {
    const blad = await przeniesLokal(p.id, p.kolumna, p.kolejnosc);
    if (!blad) router.refresh();
    return blad;
  }
  const szczyt = Math.max(1, ...ETAPY_NAJMU.map((e) => karty.filter((k) => k.kolumna === e.id).length));
  return (
    <>
      <ol className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {ETAPY_NAJMU.map((e) => {
          const ile = karty.filter((k) => k.kolumna === e.id).length;
          return (
            <li key={e.id} className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-2xl font-bold tabular-nums text-slate-900">{ile}</p>
              <p className="h-8 text-[11px] leading-tight text-slate-500">{e.nazwa}</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${e.kolor}`} style={{ width: `${(ile / szczyt) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ol>
    <Tablica
      kolumny={kolumny}
      karty={karty}
      onPrzenies={przenies}
      etykietaKarty={(k) => k.adres}
      pusta="Przeciągnij tu lokal"
      renderKarta={(k) => (
        <Link href={`/app/najem/${k.id}`} className="block rounded-xl border border-slate-200 bg-white p-3.5 pr-10 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:shadow-md">
          <p className="truncate text-sm font-semibold text-slate-900">{k.adres}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{k.najemca ? `Najemca: ${k.najemca}` : k.wlasciciel ? `Właściciel: ${k.wlasciciel}` : "Brak stron"}</p>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            <b className="tabular-nums text-slate-800">{k.czynsz ? `${formatPln(k.czynsz)}/mc` : "Czynsz do ustalenia"}</b>
            {k.koniec && <span className="text-slate-500">do {k.koniec.split("-").reverse().join(".")}</span>}
          </div>
        </Link>
      )}
    />
    </>
  );
}

const NAZWY_MIESIECY = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

/** Wybór okresu: siedzi w adresie, więc raportem można się podzielić. */
export function FiltrOkresu({ rodzaj, rok, numer, lata }: { rodzaj: RodzajOkresu; rok: number; numer: number; lata: number[] }) {
  const router = useRouter();
  const sciezka = usePathname();
  const params = useSearchParams();
  const ustaw = (z: Record<string, string>) => {
    const p = new URLSearchParams(params.toString());
    for (const [a, b] of Object.entries(z)) {
      if (b) p.set(a, b);
      else p.delete(a);
    }
    router.push(`${sciezka}?${p}`);
  };
  const opcje = rodzaj === "miesiac" ? NAZWY_MIESIECY.map((n, i) => ({ value: String(i + 1), label: n })) : rodzaj === "kwartal" ? [1, 2, 3, 4].map((n) => ({ value: String(n), label: `Kwartał ${n}` })) : rodzaj === "polrocze" ? [1, 2].map((n) => ({ value: String(n), label: `Półrocze ${n}` })) : [];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex rounded-xl bg-slate-100 p-1">
        {(
          [
            ["miesiac", "Miesiąc"],
            ["kwartal", "Kwartał"],
            ["polrocze", "Półrocze"],
            ["rok", "Rok"],
          ] as const
        ).map(([v, t]) => (
          <button key={v} type="button" aria-pressed={rodzaj === v} onClick={() => ustaw({ okres: v, nr: "" })} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${rodzaj === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
            {t}
          </button>
        ))}
      </div>
      {opcje.length > 0 && (
        <div className="w-44">
          <Select aria-label="Okres" value={String(numer)} onChange={(e) => ustaw({ nr: e.target.value })} options={opcje} placeholder="" />
        </div>
      )}
      <div className="w-28">
        <Select aria-label="Rok" value={String(rok)} onChange={(e) => ustaw({ rok: e.target.value })} options={lata.map((l) => ({ value: String(l), label: String(l) }))} placeholder="" />
      </div>
    </div>
  );
}
