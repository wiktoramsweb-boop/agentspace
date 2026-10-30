"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dodajNotatke, dodajWniosek, usunWniosek, zapiszDaneSprawy, zapiszDokumenty, zapiszFinanse, zapiszKrok, zmienEtap, zmienWniosek } from "../actions";
import { analizaFinansow, BANKI, bankPoId, STATUSY_WNIOSKU, statusWniosku, type Bank, type Finanse } from "@/lib/banki";
import type { WniosekBankowy } from "@/lib/data-kredyty";
import { ETAPY_KREDYTU, RODZAJE_KREDYTU, type Dokument, type EtapKredytu } from "@/lib/kredyt-etapy";
import { Select } from "@/app/app/components/select";

/** Etapy jako klikalna ścieżka: kliknięcie przestawia sprawę i powiadamia agenta. */
export function Etapy({ id, etap }: { id: string; etap: EtapKredytu }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [wybrany, setWybrany] = useState(etap);
  const glowne = ETAPY_KREDYTU.filter((e) => e.id !== "odrzucone");
  const idx = glowne.findIndex((e) => e.id === wybrany);
  const ustaw = (e: EtapKredytu) => {
    if (e === wybrany) return;
    if (e === "odrzucone" && !confirm("Zamknąć sprawę bez kredytu? Agent dostanie powiadomienie.")) return;
    setWybrany(e);
    start(async () => {
      await zmienEtap(id, e);
      router.refresh();
    });
  };
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-3 ${pending ? "opacity-70" : ""}`}>
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {glowne.map((e, i) => {
          const zrobione = wybrany !== "odrzucone" && i <= idx;
          return (
            <button
              key={e.id}
              type="button"
              disabled={pending}
              onClick={() => ustaw(e.id)}
              className={`flex min-w-[120px] flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                e.id === wybrany ? "bg-emerald-600 text-white" : zrobione ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] ${e.id === wybrany ? "bg-white/25" : zrobione ? "bg-emerald-200" : "bg-slate-200"}`}>
                {zrobione && e.id !== wybrany ? "✓" : i + 1}
              </span>
              {e.nazwa}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          disabled={pending}
          onClick={() => ustaw("odrzucone")}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium ${wybrany === "odrzucone" ? "bg-slate-200 text-slate-700" : "text-slate-400 hover:text-rose-600"}`}
        >
          {wybrany === "odrzucone" ? "Sprawa zamknięta bez kredytu" : "Zamknij bez kredytu"}
        </button>
      </div>
    </div>
  );
}

export function DaneSprawy({
  id,
  s,
}: {
  id: string;
  s: { rodzaj: string; kwota: number | null; bank: string | null; prowizja: number | null; zaPolecenie: number | null; notatka: string | null };
}) {
  const router = useRouter();
  const [f, setF] = useState({
    rodzaj: s.rodzaj,
    kwota: s.kwota ? String(s.kwota) : "",
    bank: s.bank ?? "",
    prowizja: s.prowizja ? String(s.prowizja) : "",
    zaPolecenie: s.zaPolecenie ? String(s.zaPolecenie) : "",
    notatka: s.notatka ?? "",
  });
  const [info, setInfo] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ustaw = (k: keyof typeof f) => (e: { target: { value: string } }) => {
    setInfo(null);
    setF((x) => ({ ...x, [k]: e.target.value }));
  };
  const pole = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";
  const etykieta = "mb-1 block text-xs font-medium text-slate-500";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label>
        <span className={etykieta}>Rodzaj</span>
        <Select value={f.rodzaj} onChange={ustaw("rodzaj")} >
          {RODZAJE_KREDYTU.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nazwa}
            </option>
          ))}
        </Select>
      </label>
      <label>
        <span className={etykieta}>Kwota kredytu (zł)</span>
        <input value={f.kwota} onChange={ustaw("kwota")} inputMode="numeric" placeholder="np. 520000" className={pole} />
      </label>
      <label>
        <span className={etykieta}>Bank</span>
        <input value={f.bank} onChange={ustaw("bank")} placeholder="np. PKO BP, mBank" className={pole} />
      </label>
      <label>
        <span className={etykieta}>Prowizja z banku (zł)</span>
        <input value={f.prowizja} onChange={ustaw("prowizja")} inputMode="numeric" placeholder="np. 7800" className={pole} />
      </label>
      <label>
        <span className={etykieta}>Wynagrodzenie za polecenie (zł)</span>
        <input value={f.zaPolecenie} onChange={ustaw("zaPolecenie")} inputMode="numeric" placeholder="dla agenta albo biura" className={pole} />
      </label>
      <label className="sm:col-span-2">
        <span className={etykieta}>Notatka o sytuacji klienta</span>
        <textarea value={f.notatka} onChange={ustaw("notatka")} rows={3} placeholder="Dochody, wkład własny, zobowiązania, preferencje" className={pole} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const w = await zapiszDaneSprawy(id, f);
              setInfo(w.ok ? "Zapisane." : w.error);
              router.refresh();
            })
          }
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Zapisuję…" : "Zapisz"}
        </button>
        {info && <span className="text-sm text-slate-500">{info}</span>}
      </div>
    </div>
  );
}

export function Dokumenty({ id, lista }: { id: string; lista: Dokument[] }) {
  const router = useRouter();
  const [docs, setDocs] = useState(lista);
  const [nowy, setNowy] = useState("");
  const [pending, start] = useTransition();
  const zapisz = (nastepne: Dokument[]) => {
    setDocs(nastepne);
    start(async () => {
      await zapiszDokumenty(id, nastepne);
      router.refresh();
    });
  };
  const ok = docs.filter((d) => d.jest).length;
  return (
    <div>
      {docs.length > 0 && (
        <div className="mb-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(ok / docs.length) * 100}%` }} />
          </div>
          <span className="text-sm font-semibold tabular-nums text-slate-700">
            {ok}/{docs.length}
          </span>
        </div>
      )}
      <ul className="space-y-1">
        {docs.map((d, i) => (
          <li key={`${d.nazwa}-${i}`} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={d.jest}
              onChange={() => zapisz(docs.map((x, j) => (j === i ? { ...x, jest: !x.jest } : x)))}
              className="h-4 w-4 accent-emerald-600"
              aria-label={d.nazwa}
            />
            <span className={`flex-1 text-sm ${d.jest ? "text-slate-400 line-through" : "text-slate-800"}`}>{d.nazwa}</span>
            <button type="button" onClick={() => zapisz(docs.filter((_, j) => j !== i))} className="text-xs text-slate-300 opacity-0 transition hover:text-rose-600 group-hover:opacity-100" aria-label={`Usuń ${d.nazwa}`}>
              Usuń
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          value={nowy}
          onChange={(e) => setNowy(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && nowy.trim()) {
              e.preventDefault();
              zapisz([...docs, { nazwa: nowy.trim(), jest: false }]);
              setNowy("");
            }
          }}
          placeholder="Dodaj dokument, np. Zaświadczenie z ZUS"
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="button"
          disabled={!nowy.trim() || pending}
          onClick={() => {
            zapisz([...docs, { nazwa: nowy.trim(), jest: false }]);
            setNowy("");
          }}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Dodaj
        </button>
      </div>
    </div>
  );
}

export function Notatka({ id }: { id: string }) {
  const router = useRouter();
  const [t, setT] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <textarea
        value={t}
        onChange={(e) => setT(e.target.value)}
        rows={2}
        placeholder="Notatka dla agenta i doradcy, np. Bank prosi o dodatkowe zaświadczenie"
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
      />
      {blad && <p className="text-sm text-rose-600">{blad}</p>}
      <button
        type="button"
        disabled={pending || t.trim().length < 2}
        onClick={() =>
          start(async () => {
            setBlad(null);
            const w = await dodajNotatke(id, t);
            if (!w.ok) return setBlad(w.error);
            setT("");
            router.refresh();
          })
        }
        className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? "Zapisuję…" : "Dodaj notatkę"}
      </button>
    </div>
  );
}

const POLE = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";
const ETYKIETA = "mb-1 block text-xs font-medium text-slate-500";

export function ZnakBanku({ bank, rozmiar = 44 }: { bank: Bank; rozmiar?: number }) {
  return (
    <span
      className="inline-grid flex-shrink-0 place-items-center rounded-xl font-bold ring-1 ring-black/10"
      style={{ width: rozmiar, height: rozmiar, background: bank.tlo, color: bank.tekst, fontSize: rozmiar * (bank.skrot.length > 3 ? 0.27 : 0.33) }}
      aria-hidden="true"
    >
      {bank.skrot}
    </span>
  );
}

/** Banki: klik dodaje wniosek, a pod spodem każdy ma status, warunki i odpowiedź banku. */
export function WnioskiBankowe({ id, wnioski, gotowe }: { id: string; wnioski: WniosekBankowy[]; gotowe: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [blad, setBlad] = useState<string | null>(null);
  const wybrane = new Set(wnioski.map((w) => w.bank));
  const pozytywne = wnioski.filter((w) => w.status === "pozytywna" && w.installment_pln);
  const najnizsza = pozytywne.length > 1 ? Math.min(...pozytywne.map((w) => Number(w.installment_pln))) : null;
  return (
    <div>
      {!gotowe && <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">Wnioski ruszą po uruchomieniu migracji lib/SETUP-v59-kredyty-cele.sql.</p>}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {BANKI.map((b) => {
          const jest = wybrane.has(b.id);
          return (
            <button
              key={b.id}
              type="button"
              disabled={jest || pending}
              onClick={() =>
                start(async () => {
                  setBlad(null);
                  const w = await dodajWniosek(id, b.id);
                  if (!w.ok) setBlad(w.error);
                  router.refresh();
                })
              }
              aria-pressed={jest}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition ${jest ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm"}`}
            >
              <ZnakBanku bank={b} rozmiar={40} />
              <span className="text-[11px] font-medium leading-tight text-slate-700">{b.nazwa}</span>
            </button>
          );
        })}
      </div>
      {blad && <p className="mt-2 text-sm text-rose-600">{blad}</p>}
      {wnioski.length > 0 && (
        <ul className="mt-4 space-y-3">
          {wnioski.map((w) => (
            <Wniosek key={w.id} id={id} w={w} najlepsza={najnizsza != null && Number(w.installment_pln) === najnizsza} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Wniosek({ id, w, najlepsza }: { id: string; w: WniosekBankowy; najlepsza: boolean }) {
  const router = useRouter();
  const b = bankPoId(w.bank);
  const [otwarty, setOtwarty] = useState(false);
  const [f, setF] = useState({ kwota: w.amount_pln ? String(w.amount_pln) : "", marza: w.margin_pct ? String(w.margin_pct) : "", oprocentowanie: w.rate_pct ? String(w.rate_pct) : "", rata: w.installment_pln ? String(w.installment_pln) : "", prowizja: w.commission_pln ? String(w.commission_pln) : "", notatka: w.note ?? "" });
  const [pending, start] = useTransition();
  const ustaw = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const zapisz = (dane: Parameters<typeof zmienWniosek>[2]) =>
    start(async () => {
      await zmienWniosek(id, w.id, dane);
      router.refresh();
    });
  const st = statusWniosku(w.status);
  const warunki = [w.rate_pct ? `${w.rate_pct}%` : null, w.margin_pct ? `marża ${w.margin_pct}%` : null, w.installment_pln ? `rata ${Number(w.installment_pln).toLocaleString("pl-PL")} zł` : null].filter(Boolean).join(" · ");
  return (
    <li className={`rounded-2xl border p-3 ${najlepsza ? "border-emerald-400" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-center gap-3">
        <ZnakBanku bank={b} rozmiar={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {b.nazwa}
            {najlepsza && <span className="ml-2 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">Najniższa rata</span>}
          </p>
          <p className="truncate text-xs text-slate-500">{warunki || "Warunki jeszcze nieznane"}</p>
        </div>
        <div className="w-52 max-w-full">
          <Select aria-label={`Status wniosku: ${b.nazwa}`} value={w.status} onChange={(e) => zapisz({ status: e.target.value })} options={STATUSY_WNIOSKU.map((s) => ({ value: s.id, label: s.nazwa }))} placeholder="" />
        </div>
        <button type="button" onClick={() => setOtwarty((v) => !v)} aria-expanded={otwarty} className="rounded-lg px-2 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
          {otwarty ? "Zwiń" : "Warunki"}
        </button>
      </div>
      <span className={`sr-only ${st.kolor}`}>{st.nazwa}</span>
      {otwarty && (
        <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-5">
          {([["kwota", "Kwota (zł)"], ["oprocentowanie", "Oprocentowanie (%)"], ["marza", "Marża (%)"], ["rata", "Rata (zł)"], ["prowizja", "Prowizja dla Ciebie (zł)"]] as const).map(([k, l]) => (
            <label key={k}>
              <span className={ETYKIETA}>{l}</span>
              <input value={f[k]} onChange={ustaw(k)} inputMode="decimal" className={POLE} />
            </label>
          ))}
          <label className="sm:col-span-2 lg:col-span-5">
            <span className={ETYKIETA}>Odpowiedź banku, uwagi</span>
            <textarea value={f.notatka} onChange={ustaw("notatka")} rows={2} placeholder="np. Bank prosi o PIT za 2025, analityk: Pani Kowalska" className={POLE} />
          </label>
          <div className="flex items-center justify-between sm:col-span-2 lg:col-span-5">
            <button type="button" disabled={pending} onClick={() => zapisz(f)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
              {pending ? "Zapisuję…" : "Zapisz warunki"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Usunąć wniosek: ${b.nazwa}?`))
                  start(async () => {
                    await usunWniosek(id, w.id);
                    router.refresh();
                  });
              }}
              className="text-sm text-slate-400 hover:text-rose-600"
            >
              Usuń wniosek
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/** Sytuacja klienta i szybka ocena: wkład, rata, obciążenie dochodu. */
export function FinanseKlienta({ id, kwota, finanse }: { id: string; kwota: number | null; finanse: Finanse }) {
  const router = useRouter();
  const start0 = (v: number | null | undefined) => (v ? String(v) : "");
  const [f, setF] = useState({ cena: start0(finanse.cena), wklad: start0(finanse.wklad), dochod: start0(finanse.dochod), zobowiazania: start0(finanse.zobowiazania), lat: start0(finanse.lat), oprocentowanie: start0(finanse.oprocentowanie) });
  const [info, setInfo] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const liczba = (v: string) => Number(v.replace(",", ".").replace(/\s/g, "")) || null;
  const a = analizaFinansow(kwota, { cena: liczba(f.cena), wklad: liczba(f.wklad), dochod: liczba(f.dochod), zobowiazania: liczba(f.zobowiazania), lat: liczba(f.lat), oprocentowanie: liczba(f.oprocentowanie) });
  const TON = { dobrze: "bg-emerald-50 text-emerald-800", uwaga: "bg-amber-50 text-amber-800", zle: "bg-rose-50 text-rose-800" };
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {([["cena", "Cena nieruchomości (zł)"], ["wklad", "Wkład własny (zł)"], ["dochod", "Dochód netto (zł/mc)"], ["zobowiazania", "Raty i limity (zł/mc)"], ["lat", "Okres (lata), np. 25"], ["oprocentowanie", "Oprocentowanie (%), np. 7"]] as const).map(([k, l]) => (
          <label key={k}>
            <span className={ETYKIETA}>{l}</span>
            <input
              value={f[k]}
              onChange={(e) => {
                setInfo(null);
                setF((x) => ({ ...x, [k]: e.target.value }));
              }}
              inputMode="decimal"
              className={POLE}
            />
          </label>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[["Rata szacunkowa", a.rata ? `${a.rata.toLocaleString("pl-PL")} zł` : "-"], ["LTV", a.ltv != null ? `${a.ltv}%` : "-"], ["Raty do dochodu", a.dti != null ? `${a.dti}%` : "-"]].map(([e, w]) => (
          <div key={e} className="rounded-xl bg-slate-50 p-2.5">
            <p className="font-bold tabular-nums text-slate-900">{w}</p>
            <p className="text-[11px] text-slate-500">{e}</p>
          </div>
        ))}
      </div>
      {a.uwagi.length > 0 && (
        <ul className="mt-2 space-y-1">
          {a.uwagi.map((u) => (
            <li key={u.tekst} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${TON[u.ton]}`}>
              {u.tekst}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-slate-400">Orientacyjnie, każdy bank liczy zdolność po swojemu.</p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const w = await zapiszFinanse(id, f);
              setInfo(w.ok ? "Zapisane." : w.error);
              router.refresh();
            })
          }
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Zapisz
        </button>
        {info && <span className="text-sm text-slate-500">{info}</span>}
      </div>
    </div>
  );
}

export function NastepnyKrok({ id, podpowiedz, krok, data }: { id: string; podpowiedz: string; krok: string | null; data: string | null }) {
  const router = useRouter();
  const [t, setT] = useState(krok ?? "");
  const [d, setD] = useState(data ?? "");
  const [info, setInfo] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="rounded-2xl bg-slate-900 p-5 text-white">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Następny krok</p>
      <p className="mt-1 text-lg font-semibold">{krok || podpowiedz}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Twój krok, np. Oddzwonić po PIT" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none" />
        <input type="date" value={d} onChange={(e) => setD(e.target.value)} aria-label="Termin" className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark] focus:border-emerald-400 focus:outline-none" />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const w = await zapiszKrok(id, t, d);
              setInfo(w.ok ? null : w.error);
              router.refresh();
            })
          }
          className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-emerald-300 disabled:opacity-50"
        >
          Zapisz
        </button>
      </div>
      {data && <p className="mt-2 text-xs text-slate-300">Termin: {data.split("-").reverse().join(".")}</p>}
      {info && <p className="mt-2 text-sm text-amber-300">{info}</p>}
    </div>
  );
}
