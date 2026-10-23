"use client";

import { useMemo, useState } from "react";
import { SubmitButton } from "../components/submit-button";
import { saveGoal } from "./actions";
import { computeFunnel } from "@/lib/funnel";
import type { Goal } from "@/lib/types";

const zl = (n: number) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(Math.round(n)) + " zł";

/** Gotowe profile skuteczności, żeby nowa osoba nie musiała znać pojęcia „współczynnik lejka”. */
const PROFILE = [
  { id: "start", nazwa: "Dopiero zaczynam", opis: "Pierwszy rok w zawodzie", calls: 20, meetings: 4, listings: 2 },
  { id: "standard", nazwa: "Mam doświadczenie", opis: "1-3 lata, typowe wyniki", calls: 12, meetings: 3, listings: 1.6 },
  { id: "pro", nazwa: "Jestem skuteczny", opis: "Polecenia, mocna baza", calls: 8, meetings: 2, listings: 1.3 },
] as const;

type Stan = { roczny: number; prowizja: number; dni: number; calls: number; meetings: number; listings: number };

function zCelu(goal: Goal | null): Stan {
  return {
    roczny: goal?.annual_income_pln ?? 120000,
    prowizja: goal?.avg_commission_pln ?? 8000,
    dni: goal?.workdays_per_week ?? 5,
    calls: goal?.calls_per_meeting ?? 12,
    meetings: goal?.meetings_per_listing ?? 3,
    listings: goal?.listings_per_sale ?? 1.6,
  };
}

function Chip({ aktywny, onClick, children }: { aktywny: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${aktywny ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400"}`}
    >
      {children}
    </button>
  );
}

function Kwota({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <div className="flex items-baseline gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15">
        <input
          inputMode="numeric"
          value={value ? value.toLocaleString("pl-PL") : ""}
          onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
          className="w-full min-w-0 bg-transparent text-3xl font-bold tabular-nums text-slate-900 outline-none"
        />
        <span className="text-lg font-semibold text-slate-400">zł</span>
      </div>
    </label>
  );
}

function Suwak({ label, opis, value, min, max, step, onChange }: { label: string; opis: (v: number) => string; value: number; min: number; max: number; step: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        <span className="text-lg font-bold tabular-nums text-emerald-700">{value.toLocaleString("pl-PL")}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-emerald-600" />
      <p className="text-xs text-slate-500">{opis(value)}</p>
    </div>
  );
}

/** Podgląd planu liczony na żywo z tych samych wzorów co strona celów. */
function Plan({ s }: { s: Stan }) {
  const f = useMemo(
    () =>
      computeFunnel({
        annual_income_pln: s.roczny,
        avg_commission_pln: Math.max(1000, s.prowizja),
        workdays_per_week: s.dni,
        calls_per_meeting: s.calls,
        meetings_per_listing: s.meetings,
        listings_per_sale: s.listings,
      } as Goal),
    [s],
  );
  const wiersze = [
    { co: "Telefony do właścicieli", ile: f.byStage.cold_calls.cadence, rok: f.annual.calls },
    { co: "Spotkania", ile: f.byStage.meetings.cadence, rok: f.annual.meetings },
    { co: "Podpisane umowy", ile: f.byStage.listings.cadence, rok: f.annual.listings },
    { co: "Transakcje", ile: f.byStage.sales.cadence, rok: f.annual.sales },
  ];
  return (
    <div className="rounded-3xl bg-slate-900 p-6 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Twój plan</p>
      <p className="mt-2 text-sm text-slate-300">
        Żeby zarobić <b className="text-white">{zl(s.roczny)}</b> w rok, czyli {zl(s.roczny / 12)} miesięcznie, potrzebujesz:
      </p>
      <ul className="mt-5 space-y-3">
        {wiersze.map((w) => (
          <li key={w.co} className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3">
            <span className="text-sm text-slate-200">{w.co}</span>
            <span className="text-right">
              <b className="block text-lg tabular-nums">{w.ile}</b>
              <span className="text-xs text-slate-400">{w.rok.toLocaleString("pl-PL")} w roku</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-slate-400">Codziennie odhaczasz telefony i spotkania, a my pokazujemy, czy jesteś na kursie. Cel zmienisz w każdej chwili.</p>
    </div>
  );
}

const KROKI = ["Cel", "Prowizja", "Tydzień", "Skuteczność"] as const;

/**
 * Ustawienie celu. Za pierwszym razem prowadzi krok po kroku, przy zmianie
 * pokazuje wszystko naraz. W obu trybach plan obok przelicza się na żywo,
 * więc od razu widać, co znaczy podniesienie celu o 50 tys.
 */
export function GoalSetup({ goal }: { goal: Goal | null }) {
  const [s, setS] = useState<Stan>(() => zCelu(goal));
  const [krok, setKrok] = useState(0);
  const [cena, setCena] = useState(600000);
  const [procent, setProcent] = useState(2.5);
  const kreator = !goal;
  const ustaw = (p: Partial<Stan>) => setS((x) => ({ ...x, ...p }));
  const profil = PROFILE.find((p) => p.calls === s.calls && p.meetings === s.meetings && p.listings === s.listings)?.id ?? null;

  const sekcje = [
    <section key="cel" className="space-y-4">
      <h3 className="text-xl font-bold text-slate-900">Ile chcesz zarobić w tym roku?</h3>
      <p className="text-sm text-slate-500">Na samych prowizjach, przed podatkiem. Wpisz kwotę albo wybierz.</p>
      <Kwota value={s.roczny} onChange={(n) => ustaw({ roczny: n })} label="Roczny cel" />
      <div className="flex flex-wrap gap-2">
        {[60000, 120000, 200000, 300000].map((k) => (
          <Chip key={k} aktywny={s.roczny === k} onClick={() => ustaw({ roczny: k })}>
            {k / 1000} tys.
          </Chip>
        ))}
      </div>
      <p className="text-sm text-slate-600">To {zl(s.roczny / 12)} miesięcznie.</p>
    </section>,

    <section key="prowizja" className="space-y-4">
      <h3 className="text-xl font-bold text-slate-900">Ile średnio zarabiasz na jednej transakcji?</h3>
      <p className="text-sm text-slate-500">Twoja część prowizji z jednej sprzedaży albo najmu.</p>
      <Kwota value={s.prowizja} onChange={(n) => ustaw({ prowizja: n })} label="Średnia prowizja" />
      <div className="flex flex-wrap gap-2">
        {[4000, 8000, 12000, 20000].map((k) => (
          <Chip key={k} aktywny={s.prowizja === k} onClick={() => ustaw({ prowizja: k })}>
            {k / 1000} tys.
          </Chip>
        ))}
      </div>
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">Nie wiesz? Policz z typowej transakcji</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-slate-600">
            Typowa cena mieszkania
            <input inputMode="numeric" value={cena.toLocaleString("pl-PL")} onChange={(e) => setCena(Number(e.target.value.replace(/\D/g, "")) || 0)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Twoja prowizja (%)
            <input inputMode="decimal" value={String(procent).replace(".", ",")} onChange={(e) => setProcent(Number(e.target.value.replace(",", ".")) || 0)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
          </label>
        </div>
        <button type="button" onClick={() => ustaw({ prowizja: Math.round((cena * procent) / 100) })} className="mt-3 text-sm font-semibold text-emerald-700 hover:text-emerald-600">
          Ustaw {zl((cena * procent) / 100)} →
        </button>
      </div>
    </section>,

    <section key="tydzien" className="space-y-4">
      <h3 className="text-xl font-bold text-slate-900">Ile dni w tygodniu pracujesz?</h3>
      <p className="text-sm text-slate-500">Na tyle dni rozłożymy plan telefonów i spotkań.</p>
      <div className="flex flex-wrap gap-2">
        {[3, 4, 5, 6].map((d) => (
          <Chip key={d} aktywny={s.dni === d} onClick={() => ustaw({ dni: d })}>
            {d} dni
          </Chip>
        ))}
      </div>
    </section>,

    <section key="skutecznosc" className="space-y-4">
      <h3 className="text-xl font-bold text-slate-900">Jak Ci idzie sprzedaż?</h3>
      <p className="text-sm text-slate-500">Od tego zależy, ile telefonów potrzebujesz na jedną transakcję. Wybierz profil albo ustaw własne liczby.</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {PROFILE.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => ustaw({ calls: p.calls, meetings: p.meetings, listings: p.listings })}
            className={`rounded-2xl border p-4 text-left transition ${profil === p.id ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600" : "border-slate-200 bg-white hover:border-emerald-400"}`}
          >
            <b className="block text-sm text-slate-900">{p.nazwa}</b>
            <span className="text-xs text-slate-500">{p.opis}</span>
          </button>
        ))}
      </div>
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <Suwak label="Telefony na 1 spotkanie" value={s.calls} min={3} max={40} step={1} onChange={(n) => ustaw({ calls: n })} opis={(v) => `Z ${v} telefonów do właścicieli umawiasz średnio jedno spotkanie.`} />
        <Suwak label="Spotkania na 1 umowę" value={s.meetings} min={1} max={10} step={0.5} onChange={(n) => ustaw({ meetings: n })} opis={(v) => `Co ${v.toLocaleString("pl-PL")}. spotkanie kończy się podpisaną umową pośrednictwa.`} />
        <Suwak label="Umowy na 1 transakcję" value={s.listings} min={1} max={4} step={0.1} onChange={(n) => ustaw({ listings: n })} opis={(v) => `Z ${v.toLocaleString("pl-PL")} ofert w portfelu jedna kończy się sprzedażą lub najmem.`} />
      </div>
    </section>,
  ];

  return (
    <form action={saveGoal} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <input type="hidden" name="annualIncome" value={s.roczny} />
      <input type="hidden" name="avgCommission" value={s.prowizja} />
      <input type="hidden" name="workdays" value={s.dni} />
      <input type="hidden" name="callsPerMeeting" value={s.calls} />
      <input type="hidden" name="meetingsPerListing" value={s.meetings} />
      <input type="hidden" name="listingsPerSale" value={s.listings} />

      <div className="min-w-0 space-y-6">
        {kreator ? (
          <>
            <ol className="flex gap-2" aria-label="Kroki">
              {KROKI.map((k, i) => (
                <li key={k} className="flex-1">
                  <button type="button" onClick={() => setKrok(i)} className="w-full text-left">
                    <span className={`block h-1.5 rounded-full transition ${i <= krok ? "bg-emerald-600" : "bg-slate-200"}`} />
                    <span className={`mt-1.5 block text-xs font-semibold ${i === krok ? "text-emerald-700" : "text-slate-400"}`}>
                      {i + 1}. {k}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div key={krok} className="witaj-wejscie">
              {sekcje[krok]}
            </div>
            <div className="flex items-center justify-between gap-3">
              {krok > 0 ? (
                <button type="button" onClick={() => setKrok((k) => k - 1)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                  ← Wstecz
                </button>
              ) : (
                <span />
              )}
              {krok < KROKI.length - 1 ? (
                <button type="button" onClick={() => setKrok((k) => k + 1)} className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500">
                  Dalej →
                </button>
              ) : (
                <SubmitButton pendingText="Zapisuję…" className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500">
                  Ustaw mój cel →
                </SubmitButton>
              )}
            </div>
          </>
        ) : (
          <>
            {sekcje}
            <SubmitButton pendingText="Zapisuję…" className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-500">
              Zapisz zmiany
            </SubmitButton>
          </>
        )}
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <Plan s={s} />
      </div>
    </form>
  );
}
