"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dodajNotatke, zapiszDaneSprawy, zapiszDokumenty, zmienEtap } from "../actions";
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
