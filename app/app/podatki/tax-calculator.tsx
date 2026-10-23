"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  compareForms,
  computeSpzooPayout,
  computeVat,
  jdgDlaWspolnikow,
  kosztAgenta,
  pccKupujacego,
  podatekOdSprzedazy,
  progSkalaLiniowy,
  zusMies,
  zusTimeline,
  DEFAULT_CONSTANTS,
  FORM_SHORT,
  ZUS_STAGE_LABELS,
  type TaxConstants,
  type TaxForm,
  type ZusStage,
  type FormResult,
  type Umowa,
} from "@/lib/tax";
import { Select as SelectBox } from "@/app/app/components/select";

// ── formatowanie ────────────────────────────────────────────────────────────
const zl0 = (n: number) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(Math.round(n)) + " zł";
const zl2 = (n: number) => new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " zł";
const pct1 = (n: number) => (n * 100).toFixed(1).replace(".", ",") + " %";
const datePL = (d: Date) => new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(d);

// Klucze z sufiksem v2: wcześniejsze wartości w przeglądarce były liczone
// starymi stawkami i przykładowymi danymi jednego biura.
const K = (k: string) => `as_tax2_${k}`;

type Tab = "forma" | "zus" | "vat" | "spzoo" | "agent" | "sprzedaz" | "zalozenia";

const TABS: { id: Tab; label: string; opis: string }[] = [
  { id: "forma", label: "Forma opodatkowania", opis: "Skala, liniowy czy ryczałt" },
  { id: "zus", label: "ZUS", opis: "Ile płacisz i kiedy rośnie" },
  { id: "vat", label: "VAT", opis: "Limit 240 tys. i koszt wejścia" },
  { id: "spzoo", label: "JDG czy spółka", opis: "Sp. z o.o. z powołaniem" },
  { id: "agent", label: "Koszt agenta", opis: "Etat, zlecenie czy B2B" },
  { id: "sprzedaz", label: "Sprzedaż mieszkania", opis: "PIT, 5 lat, ulga, PCC" },
  { id: "zalozenia", label: "Założenia", opis: "Stawki i kwoty 2026" },
];

const ETAPY_ZUS: ZusStage[] = ["ulga_start", "preferencyjny", "maly_plus", "duzy"];

export function TaxCalculator() {
  const [tab, setTab] = usePersistedState<Tab>(K("tab"), "forma");
  const [c, setC] = usePersistedState<TaxConstants>(K("constants"), DEFAULT_CONSTANTS);
  // Nowe pola w kolejnych wersjach: braki uzupełniamy domyślnymi.
  const stale = useMemo(() => ({ ...DEFAULT_CONSTANTS, ...c }), [c]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 text-sm text-amber-800">
        <span className="font-semibold">To narzędzie do modelowania, nie porada podatkowa.</span> Domyślne kwoty to stawki obowiązujące w 2026 r. (ZUS,
        składka zdrowotna, limity PIT i VAT). Zmienisz je w zakładce <span className="font-medium">Założenia</span>. Przed decyzją potwierdź liczby
        u księgowej.
      </div>

      <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 sm:grid-cols-4 2xl:grid-cols-7">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-2 text-left transition ${tab === t.id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
          >
            <span className="block text-sm font-semibold">{t.label}</span>
            <span className={`block text-[11px] ${tab === t.id ? "text-emerald-50" : "text-slate-400"}`}>{t.opis}</span>
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: [0.21, 0.47, 0.32, 0.98] }}>
        {tab === "forma" && <FormaTab c={stale} />}
        {tab === "zus" && <ZusTab c={stale} />}
        {tab === "vat" && <VatTab c={stale} />}
        {tab === "spzoo" && <SpzooTab c={stale} />}
        {tab === "agent" && <AgentTab c={stale} />}
        {tab === "sprzedaz" && <SprzedazTab c={stale} />}
        {tab === "zalozenia" && <ZalozeniaTab c={stale} setC={setC} />}
      </motion.div>
    </div>
  );
}

function ZusSelect({ value, onChange }: { value: ZusStage; onChange: (v: ZusStage) => void }) {
  return (
    <div>
      <Label>Etap ZUS</Label>
      <Select value={value} onChange={(v) => onChange(v as ZusStage)}>
        {ETAPY_ZUS.map((e) => (
          <option key={e} value={e}>
            {ZUS_STAGE_LABELS[e]}
          </option>
        ))}
      </Select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. FORMA OPODATKOWANIA
// ═══════════════════════════════════════════════════════════════════════════
function FormaTab({ c }: { c: TaxConstants }) {
  const [przychod, setPrzychod] = usePersistedState(K("f_przychod"), 180000);
  const [koszty, setKoszty] = usePersistedState(K("f_koszty"), 24000);
  const [zusStage, setZusStage] = usePersistedState<ZusStage>(K("f_zus"), "duzy");
  const [chorobowe, setChorobowe] = usePersistedState(K("f_chor"), true);
  const [dochodPoprzedni, setDochodPoprzedni] = usePersistedState(K("f_dochpop"), 80000);
  const [vatPayer, setVatPayer] = usePersistedState(K("f_vat"), false);
  const [wspolnie, setWspolnie] = usePersistedState(K("f_wspolnie"), false);
  const [malzonek, setMalzonek] = usePersistedState(K("f_malz"), 0);

  const przychodEfekt = vatPayer ? przychod / (1 + c.stawkaVat) : przychod;
  const input = { przychod: przychodEfekt, koszty, zusStage, chorobowe, dochodPoprzedni, dochodMalzonka: wspolnie ? malzonek : null };
  const { results, best } = useMemo(() => compareForms(input, c), [przychodEfekt, koszty, zusStage, chorobowe, dochodPoprzedni, wspolnie, malzonek, c]); // eslint-disable-line react-hooks/exhaustive-deps
  const prog = useMemo(() => progSkalaLiniowy(zusStage, c, { chorobowe, dochodPoprzedni }), [zusStage, chorobowe, dochodPoprzedni, c]);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,360px)_1fr]">
      <div className="space-y-4">
        <Panel title="Twoja działalność (rocznie)">
          <Num label="Przychód z prowizji" value={przychod} onChange={setPrzychod} />
          <Num label="Koszty firmy (bez ZUS)" value={koszty} onChange={setKoszty} />
          <ZusSelect value={zusStage} onChange={setZusStage} />
          {zusStage === "maly_plus" && (
            <Num label="Dochód z zeszłego roku (do Małego ZUS Plus)" value={dochodPoprzedni} onChange={setDochodPoprzedni} />
          )}
          <Toggle checked={chorobowe} onChange={setChorobowe} label="Płacę dobrowolne chorobowe" hint="2,45% podstawy, daje zasiłek chorobowy" />
          <Toggle checked={vatPayer} onChange={setVatPayer} label="Jestem czynnym podatnikiem VAT" hint="przychód wpisany brutto, liczymy od netto" />
          <Toggle checked={wspolnie} onChange={setWspolnie} label="Rozliczam się wspólnie z małżonkiem" hint="tylko na skali, obniża podatek przy różnych dochodach" />
          {wspolnie && <Num label="Dochód małżonka (rocznie)" value={malzonek} onChange={setMalzonek} />}
        </Panel>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="mb-1 font-medium text-slate-800">Kiedy liniowy wygrywa ze skalą</p>
          <p>
            Od dochodu ok. <b className="text-slate-900">{zl0(prog)}</b> rocznie (przy tym etapie ZUS, bez wspólnego rozliczenia). Poniżej taniej jest na skali.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {vatPayer && <p className="text-xs text-slate-500">Liczone od przychodu netto {zl0(przychodEfekt)}.</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          {results.map((r) => (
            <FormCard key={r.form} r={r} isBest={r.form === best.form} />
          ))}
        </div>
        <BreakdownTable results={results} bestForm={best.form} />
        <p className="text-xs leading-relaxed text-slate-500">
          „Do kieszeni” to dochód minus podatek, składka zdrowotna, ZUS społeczny i danina. Ryczałt dla pośrednictwa w obrocie nieruchomościami to 15% od
          przychodu: koszty nie obniżają podatku, więc wygrywa przy niskich kosztach. Zdrowotna na skali (9%) i liniowym (4,9%) liczy się od dochodu po
          składkach społecznych, nie mniej niż {zl2(c.zdrowotnaMinMies)} miesięcznie. Na liniowym odliczasz zdrowotną do {zl0(c.liniowyZdrowotnaOdliczenieLimit)} rocznie.
        </p>
      </div>
    </div>
  );
}

function FormCard({ r, isBest }: { r: FormResult; isBest: boolean }) {
  return (
    <div className={`relative rounded-2xl border p-4 transition ${isBest ? "border-emerald-500/50 bg-emerald-500/[0.07]" : "border-slate-200 bg-white"}`}>
      {isBest && <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">NAJKORZYSTNIEJ</span>}
      <p className="text-sm font-semibold text-slate-800">{FORM_SHORT[r.form]}</p>
      <p className="mt-3 text-2xl font-bold text-slate-900">{zl0(r.netto)}</p>
      <p className="text-xs text-slate-500">do kieszeni rocznie · {zl0(r.nettoMies)}/mc</p>
      <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500">
        <Row label="Podatek" value={zl0(r.podatek)} />
        <Row label="Zdrowotna" value={zl0(r.zdrowotna)} />
        <Row label="ZUS społ." value={zl0(r.zusSpoleczny)} />
        {r.danina > 0 && <Row label="Danina 4%" value={zl0(r.danina)} />}
        <Row label="Efektywnie" value={pct1(r.efektywna)} strong />
      </div>
    </div>
  );
}

function BreakdownTable({ results, bestForm }: { results: FormResult[]; bestForm: TaxForm }) {
  const rows: { label: string; get: (r: FormResult) => string }[] = [
    { label: "Dochód (przychód − koszty)", get: (r) => zl0(r.dochod) },
    { label: "Podstawa opodatkowania", get: (r) => zl0(r.podstawaOpodatkowania) },
    { label: "Podatek", get: (r) => zl0(r.podatek) },
    { label: "Składka zdrowotna", get: (r) => zl0(r.zdrowotna) },
    { label: "ZUS społeczny", get: (r) => zl0(r.zusSpoleczny) },
    { label: "Łączne obciążenie", get: (r) => zl0(r.daniny) },
    { label: "Do kieszeni rocznie", get: (r) => zl0(r.netto) },
    { label: "Do kieszeni miesięcznie", get: (r) => zl0(r.nettoMies) },
    { label: "Efektywna stawka", get: (r) => pct1(r.efektywna) },
  ];
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[440px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="px-4 py-2.5 font-medium">Pozycja</th>
            {results.map((r) => (
              <th key={r.form} className={`px-4 py-2.5 text-right font-semibold ${r.form === bestForm ? "text-emerald-700" : "text-slate-700"}`}>
                {FORM_SHORT[r.form]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className={`border-b border-slate-200 last:border-0 ${row.label.startsWith("Do kieszeni") ? "bg-slate-50 font-semibold text-slate-900" : "text-slate-500"}`}>
              <td className="px-4 py-2">{row.label}</td>
              {results.map((r) => (
                <td key={r.form} className={`px-4 py-2 text-right tabular-nums ${r.form === bestForm && row.label.startsWith("Do kieszeni") ? "text-emerald-700" : ""}`}>
                  {row.get(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. ZUS
// ═══════════════════════════════════════════════════════════════════════════
function ZusTab({ c }: { c: TaxConstants }) {
  const teraz = new Date();
  const [rok, setRok] = usePersistedState(K("z_rok"), teraz.getFullYear());
  const [miesiac, setMiesiac] = usePersistedState(K("z_mies"), teraz.getMonth() + 1);
  const [ulgaStart, setUlgaStart] = usePersistedState(K("z_ulga"), true);
  const [osob, setOsob] = usePersistedState(K("z_osob"), 1);
  const [chorobowe, setChorobowe] = usePersistedState(K("z_chor"), true);
  const [dochodPoprzedni, setDochodPoprzedni] = usePersistedState(K("z_dochpop"), 80000);

  const t = useMemo(() => zusTimeline(new Date(rok, miesiac - 1, 1), ulgaStart, c, new Date(), { chorobowe }), [rok, miesiac, ulgaStart, chorobowe, c]);
  const skonczony = t.monthsLeft <= 0;
  const etapy = ETAPY_ZUS.map((e) => ({ e, m: zusMies(e, c, { chorobowe, dochodPoprzedni }) }));

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,360px)_1fr]">
      <Panel title="Twoja działalność">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Miesiąc założenia</Label>
            <Select value={String(miesiac)} onChange={(v) => setMiesiac(Number(v))}>
              {MIESIACE.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
          <Num label="Rok" value={rok} onChange={setRok} />
        </div>
        <Toggle checked={ulgaStart} onChange={setUlgaStart} label="Korzystam z ulgi na start" hint="6 pełnych miesięcy bez składek społecznych, potem 24 miesiące małego ZUS" />
        <Toggle checked={chorobowe} onChange={setChorobowe} label="Dobrowolne chorobowe" />
        <Num label="Dochód z zeszłego roku (Mały ZUS Plus)" value={dochodPoprzedni} onChange={setDochodPoprzedni} />
        <Num label="Ile osób w firmie płaci ZUS" value={osob} onChange={setOsob} />
      </Panel>

      <div className="space-y-4">
        <div className={`rounded-2xl border p-5 ${skonczony ? "border-slate-200 bg-white" : t.monthsLeft <= 3 ? "border-red-500/40 bg-red-500/[0.07]" : "border-emerald-500/40 bg-emerald-500/[0.06]"}`}>
          {skonczony ? (
            <p className="text-lg font-semibold text-slate-900">Preferencyjny ZUS skończył się w {datePL(t.preferencyjnyDo)}. Płacisz duży ZUS albo, przy niskim przychodzie, Mały ZUS Plus.</p>
          ) : (
            <>
              <p className="text-sm text-slate-500">Preferencyjny ZUS kończy się</p>
              <p className="text-2xl font-bold text-slate-900">{datePL(t.preferencyjnyDo)}</p>
              <p className="mt-1 text-sm text-slate-700">
                Zostało <b className="text-slate-900">{t.monthsLeft} mies.</b>
                {t.monthsLeft <= 3 && <span className="text-red-700"> Zaplanuj wyższe składki w budżecie.</span>}
              </p>
            </>
          )}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-2.5 font-medium">Składka miesięcznie</th>
                {etapy.map(({ e }) => (
                  <th key={e} className="px-3 py-2.5 text-right font-semibold text-slate-700">
                    {ZUS_STAGE_LABELS[e].split(" (")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {(
                [
                  ["Podstawa", (m: ReturnType<typeof zusMies>) => m.podstawa],
                  ["Emerytalna 19,52%", (m: ReturnType<typeof zusMies>) => m.emerytalna],
                  ["Rentowa 8%", (m: ReturnType<typeof zusMies>) => m.rentowa],
                  ["Wypadkowa 1,67%", (m: ReturnType<typeof zusMies>) => m.wypadkowa],
                  ["Chorobowa 2,45%", (m: ReturnType<typeof zusMies>) => m.chorobowa],
                  ["Fundusz Pracy 2,45%", (m: ReturnType<typeof zusMies>) => m.fp],
                  ["Razem społeczne", (m: ReturnType<typeof zusMies>) => m.razem],
                ] as const
              ).map(([n, f]) => (
                <tr key={n} className={`border-b border-slate-100 last:border-0 ${n === "Razem społeczne" ? "bg-slate-50 font-semibold text-slate-900" : ""}`}>
                  <td className="px-4 py-2">{n}</td>
                  {etapy.map(({ e, m }) => (
                    <td key={e} className="px-3 py-2 text-right tabular-nums">
                      {zl2(f(m))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Po przejściu z małego na duży ZUS ({osob} os.)</p>
          <p className="text-2xl font-bold text-amber-700">+{zl0(t.skokRoczny * Math.max(1, osob))} rocznie</p>
          <p className="mt-2 text-sm text-slate-500">
            To {zl0(t.skokMies * Math.max(1, osob))} więcej co miesiąc. Składka zdrowotna się nie zmienia, bo zależy od formy opodatkowania i dochodu.
            Mały ZUS Plus przysługuje przy przychodzie do {zl0(c.limitMalyZusPlus)} w zeszłym roku.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-sm font-medium text-slate-700">Oś czasu składek</p>
          <ol className="space-y-2 text-sm text-slate-600">
            {t.ulgaStartDo && <li>do {datePL(t.ulgaStartDo)}: ulga na start, 0 zł społecznych (tylko zdrowotna)</li>}
            <li>
              {datePL(t.preferencyjnyOd)} - {datePL(t.preferencyjnyDo)}: preferencyjny ZUS, {zl2(zusMies("preferencyjny", c, { chorobowe }).razem)}/mc
            </li>
            <li>od {datePL(t.preferencyjnyDo)}: duży ZUS, {zl2(zusMies("duzy", c, { chorobowe }).razem)}/mc, albo Mały ZUS Plus</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

const MIESIACE = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"];

// ═══════════════════════════════════════════════════════════════════════════
// 3. VAT
// ═══════════════════════════════════════════════════════════════════════════
type Podmiot = { name: string; przychod: number };

function VatTab({ c }: { c: TaxConstants }) {
  const [podmioty, setPodmioty] = usePersistedState<Podmiot[]>(K("v_podmioty"), [{ name: "Moja firma", przychod: 180000 }]);
  const [kosztyVat, setKosztyVat] = usePersistedState(K("v_koszty"), 30000);
  const v = useMemo(() => computeVat(podmioty, kosztyVat, c), [podmioty, kosztyVat, c]);
  const nadLimit = v.nadPojemnosc > 0;
  const zmien = (i: number, p: Partial<Podmiot>) => setPodmioty(podmioty.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,360px)_1fr]">
      <Panel title="Podmioty i przychód roczny">
        {podmioty.map((p, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-3">
            <div className="mb-2 flex items-center gap-2">
              <input value={p.name} onChange={(e) => zmien(i, { name: e.target.value })} className={`${inpCls} py-1.5 text-sm font-medium`} aria-label="Nazwa podmiotu" />
              {podmioty.length > 1 && (
                <button type="button" onClick={() => setPodmioty(podmioty.filter((_, j) => j !== i))} className="shrink-0 rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Usuń podmiot">
                  ✕
                </button>
              )}
            </div>
            <Num label="Przychód roczny" value={p.przychod} onChange={(n) => zmien(i, { przychod: n })} />
          </div>
        ))}
        {podmioty.length < 6 && (
          <button type="button" onClick={() => setPodmioty([...podmioty, { name: `Podmiot ${podmioty.length + 1}`, przychod: 0 }])} className="w-full rounded-xl border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-500 hover:border-emerald-500 hover:text-emerald-700">
            + Dodaj podmiot (spółka cywilna, druga JDG)
          </button>
        )}
        <Num label="Roczne koszty z VAT do odliczenia (brutto)" value={kosztyVat} onChange={setKosztyVat} />
      </Panel>

      <div className="space-y-4">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-700">Limit zwolnienia z VAT: {zl0(c.limitVat)} rocznie na podmiot</p>
          {v.subjects.map((s, i) => {
            const fill = Math.min(100, s.procent * 100);
            return (
              <div key={i}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="truncate text-slate-700">{s.name || "Bez nazwy"}</span>
                  <span className={s.nadLimit ? "shrink-0 font-semibold text-red-700" : "shrink-0 text-slate-500"}>
                    {zl0(s.przychod)} {s.nadLimit ? "· ponad limit" : `· zostało ${zl0(s.doLimitu)}`}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-[width] duration-300 ${fill >= 100 ? "bg-red-500" : fill >= 85 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${fill}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className={`rounded-2xl border p-5 ${nadLimit ? "border-red-500/40 bg-red-500/[0.07]" : "border-emerald-500/40 bg-emerald-500/[0.06]"}`}>
          {nadLimit ? (
            <p className="text-slate-900">
              <b className="text-red-700">Przekroczenie limitu.</b> Przychody przekraczają łączną pojemność o {zl0(v.nadPojemnosc)}. Podmiot ponad limitem staje się podatnikiem VAT od
              transakcji, którą przekroczył limit.
            </p>
          ) : (
            <p className="text-slate-900">
              <b className="text-emerald-700">Mieścisz się w limicie.</b> Zostało {zl0(v.pojemnosc - v.sumaPrzychodow)} łącznej pojemności.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="VAT należny od prowizji" value={zl0(v.vatNalezny)} tone="warn" />
          <Stat label="VAT do odliczenia z kosztów" value={zl0(v.vatOdliczony)} />
          <Stat label="Koszt wejścia w VAT rocznie" value={`−${zl0(v.kosztUtratyNetto)}`} tone="warn" />
        </div>
        <p className="text-sm text-slate-500">
          Klienci biura to głównie osoby prywatne, które nie odliczą VAT. Jeśli nie podniesiesz prowizji, 23% z każdej płatności idzie do urzędu, pomniejszone o VAT z
          Twoich kosztów.
        </p>
        {podmioty.length > 1 && (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-5 text-sm">
            <p className="mb-1 font-semibold text-red-700">Uwaga na sztuczny podział działalności</p>
            <p className="text-slate-700">
              Dzielenie jednej działalności na kilka firm tylko po to, żeby zmieścić się w limicie, urząd może uznać za obejście przepisów i zsumować obroty. Obroną jest
              realna odrębność: osobni klienci, umowy i koszty.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. JDG CZY SP. Z O.O.
// ═══════════════════════════════════════════════════════════════════════════
type Wyplata = "zatrzymane" | "dywidenda";

function SpzooTab({ c }: { c: TaxConstants }) {
  const [zysk, setZysk] = usePersistedState(K("s_zysk"), 300000);
  const [wspolnikow, setWspolnikow] = usePersistedState(K("s_wsp"), 2);
  const [forma, setForma] = usePersistedState<TaxForm>(K("s_forma"), "liniowy");
  const [zusStage, setZusStage] = usePersistedState<ZusStage>(K("s_zus"), "duzy");
  const [malyPodatnik, setMalyPodatnik] = usePersistedState(K("s_maly"), true);
  const [wyplata, setWyplata] = usePersistedState<Wyplata>(K("s_wyplata"), "zatrzymane");
  const [powolanie, setPowolanie] = usePersistedState(K("s_powolanie"), 120000);

  const n = Math.max(1, Math.min(10, Math.round(wspolnikow)));
  const jdg = useMemo(() => jdgDlaWspolnikow(zysk, forma, zusStage, c, n), [zysk, forma, zusStage, c, n]);
  const pay = useMemo(() => computeSpzooPayout(zysk, powolanie, malyPodatnik, wyplata === "dywidenda", c, n), [zysk, powolanie, malyPodatnik, wyplata, c, n]);
  const roznica = pay.wartoscPoOpodatkowaniu - jdg.netto;
  const spolkaLepsza = roznica > 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,360px)_1fr]">
      <div className="space-y-4">
        <Panel title="Zysk firmy (rocznie)">
          <Num label="Zysk przed wypłatami" value={zysk} onChange={setZysk} />
          <Num label="Liczba wspólników" value={wspolnikow} onChange={setWspolnikow} />
          <div>
            <Label>Forma JDG do porównania</Label>
            <Select value={forma} onChange={(v) => setForma(v as TaxForm)}>
              <option value="liniowy">Liniowy 19%</option>
              <option value="skala">Skala 12/32%</option>
              <option value="ryczalt">Ryczałt 15%</option>
            </Select>
          </div>
          <ZusSelect value={zusStage} onChange={setZusStage} />
          <Toggle checked={malyPodatnik} onChange={setMalyPodatnik} label="Mały podatnik CIT (9%)" hint="przychód do 2 mln euro, inaczej 19%" />
        </Panel>

        <Panel title="Wypłata ze spółki">
          <Num label="Wynagrodzenie z powołania na osobę (rocznie)" value={powolanie} onChange={setPowolanie} />
          <div className="flex flex-wrap gap-1.5">
            <QuickBtn onClick={() => setPowolanie(120000)}>do progu 12% (120 tys.)</QuickBtn>
            <QuickBtn onClick={() => setPowolanie(Math.floor(zysk / n))}>cały zysk</QuickBtn>
            <QuickBtn onClick={() => setPowolanie(0)}>0</QuickBtn>
          </div>
          <p className="text-xs text-slate-500">Powołanie uchwałą wspólników: skala 12%/32% i zdrowotna 9%, bez ZUS społecznego. Jest kosztem spółki, więc obniża CIT.</p>
          <div className="pt-1">
            <Label>Reszta zysku</Label>
            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              <MiniTab active={wyplata === "zatrzymane"} onClick={() => setWyplata("zatrzymane")}>
                Zostaje w spółce
              </MiniTab>
              <MiniTab active={wyplata === "dywidenda"} onClick={() => setWyplata("dywidenda")}>
                Dywidenda
              </MiniTab>
            </div>
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <BigCard title={`JDG: ${n} × ${FORM_SHORT[forma]}`} value={zl0(jdg.netto)} sub={`efektywnie ${pct1(jdg.efektywna)}, wszystko w kieszeni, z ubezpieczeniem ZUS`} best={!spolkaLepsza} />
          <BigCard
            title="Sp. z o.o.: wartość po podatkach"
            value={zl0(pay.wartoscPoOpodatkowaniu)}
            sub={wyplata === "zatrzymane" ? `${zl0(pay.doKieszeni)} w kieszeni + ${zl0(pay.zatrzymaneWSpolce)} w spółce` : `efektywnie ${pct1(pay.efektywna)}`}
            best={spolkaLepsza}
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <tbody className="text-slate-600">
              <TR label="Zysk firmy" value={zl0(zysk)} />
              {pay.zusJedynegoWspolnika > 0 && <TR label="ZUS i zdrowotna jedynego wspólnika" value={`−${zl0(pay.zusJedynegoWspolnika)}`} />}
              <TR label={`Powołanie (${n} × ${zl0(pay.powolaniePerOsoba)})`} value={`−${zl0(pay.powolanieRazem)}`} />
              <TR label="PIT od powołania" value={`−${zl0(pay.pitPowolaniePerOsoba * n)}`} />
              <TR label="Zdrowotna 9% od powołania" value={`−${zl0(pay.zdrowotnaPowolaniePerOsoba * n)}`} />
              <TR label="= Powołanie na rękę" value={zl0(pay.nettoPowolanieRazem)} strong />
              <TR label="Zysk po wynagrodzeniach (podstawa CIT)" value={zl0(pay.zyskPoWynagrodzeniach)} />
              <TR label={`CIT ${pct1(pay.citStawka)}`} value={`−${zl0(pay.cit)}`} />
              {wyplata === "dywidenda" ? (
                <>
                  <TR label="Podatek od dywidendy 19%" value={`−${zl0(pay.dywidendaPodatek)}`} />
                  <TR label="= Dywidenda na rękę" value={zl0(pay.nettoDywidenda)} strong />
                </>
              ) : (
                <TR label="= Zostaje w spółce" value={zl0(pay.zatrzymaneWSpolce)} strong />
              )}
              <TR label="Wartość po podatkach razem" value={zl0(pay.wartoscPoOpodatkowaniu)} strong />
            </tbody>
          </table>
        </div>

        <div className={`rounded-2xl border p-5 ${spolkaLepsza ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-slate-200 bg-white"}`}>
          <p className="text-slate-900">
            {spolkaLepsza ? (
              <>
                <b className="text-emerald-700">Spółka daje więcej o {zl0(roznica)} rocznie.</b>
                {wyplata === "zatrzymane" && <> {zl0(pay.zatrzymaneWSpolce)} zostaje jednak w spółce, a przy wypłacie zapłacisz od niego 19% dywidendy.</>} Doliczysz też pełną
                księgowość (zwykle 800-1500 zł miesięcznie).
              </>
            ) : (
              <>
                <b>JDG daje więcej o {zl0(-roznica)} rocznie.</b> Przy tym zysku spółka się nie opłaca.
              </>
            )}
          </p>
        </div>
        <p className="text-xs text-slate-500">
          {n === 1
            ? "Jedyny wspólnik sp. z o.o. płaci ZUS jak przedsiębiorca (duży ZUS i zdrowotną od płacy minimalnej)."
            : "Przy dwóch i więcej wspólnikach wspólnicy nie płacą ZUS z tytułu spółki, więc nie mają też z niej ubezpieczenia."}{" "}
          Estoński CIT pominęliśmy, bo wymaga zatrudnienia na etacie.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. KOSZT AGENTA
// ═══════════════════════════════════════════════════════════════════════════
const UMOWY: Record<Umowa, string> = { etat: "Umowa o pracę", zlecenie: "Umowa zlecenie", b2b: "B2B (faktura)" };

function AgentTab({ c }: { c: TaxConstants }) {
  const [kwota, setKwota] = usePersistedState(K("a_kwota"), 7000);
  const [do26, setDo26] = usePersistedState(K("a_26"), false);
  const [student, setStudent] = usePersistedState(K("a_student"), false);
  const [b2bForma, setB2bForma] = usePersistedState<TaxForm>(K("a_forma"), "ryczalt");
  const [b2bZus, setB2bZus] = usePersistedState<ZusStage>(K("a_zus"), "preferencyjny");

  const wyniki = (["etat", "zlecenie", "b2b"] as Umowa[]).map((u) => kosztAgenta(u, kwota, c, { do26, student, b2bForma, b2bZus }));
  const najtaniej = wyniki.reduce((a, b) => (b.kosztBiura < a.kosztBiura ? b : a));
  const najwiecejAgent = wyniki.reduce((a, b) => (b.nettoAgenta > a.nettoAgenta ? b : a));

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,360px)_1fr]">
      <Panel title="Agent (miesięcznie)">
        <Num label="Wynagrodzenie brutto albo kwota faktury" value={kwota} onChange={setKwota} />
        <Toggle checked={do26} onChange={setDo26} label="Agent ma mniej niż 26 lat" hint="ulga dla młodych: bez PIT na etacie i zleceniu" />
        {do26 && <Toggle checked={student} onChange={setStudent} label="Jest studentem" hint="na zleceniu bez składek ZUS i zdrowotnej" />}
        <div className="border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Agent na B2B</p>
          <div className="space-y-3">
            <div>
              <Label>Forma opodatkowania agenta</Label>
              <Select value={b2bForma} onChange={(v) => setB2bForma(v as TaxForm)}>
                <option value="ryczalt">Ryczałt 15%</option>
                <option value="liniowy">Liniowy 19%</option>
                <option value="skala">Skala 12/32%</option>
              </Select>
            </div>
            <ZusSelect value={b2bZus} onChange={setB2bZus} />
          </div>
        </div>
      </Panel>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {wyniki.map((w) => (
            <div key={w.umowa} className={`relative rounded-2xl border p-4 ${w === najtaniej ? "border-emerald-500/50 bg-emerald-500/[0.07]" : "border-slate-200 bg-white"}`}>
              {w === najtaniej && <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">NAJTANIEJ DLA BIURA</span>}
              <p className="text-sm font-semibold text-slate-800">{UMOWY[w.umowa]}</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">{zl0(w.kosztBiura)}</p>
              <p className="text-xs text-slate-500">koszt biura miesięcznie</p>
              <p className={`mt-3 text-lg font-bold ${w === najwiecejAgent ? "text-emerald-700" : "text-slate-800"}`}>{zl0(w.nettoAgenta)}</p>
              <p className="text-xs text-slate-500">na rękę dla agenta</p>
              <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500">
                <Row label="ZUS agenta" value={zl0(w.spoleczneAgenta)} />
                <Row label="Zdrowotna" value={zl0(w.zdrowotnaAgenta)} />
                <Row label="Podatek" value={zl0(w.zaliczkaPit)} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-600">
          Na etacie i zleceniu biuro dokłada {pct1(c.pracodawcaSkladki)} składek pracodawcy. Na B2B płaci tylko fakturę, a podatek i ZUS opłaca agent. Przy B2B pamiętaj o
          ryzyku uznania współpracy za etat, jeśli agent pracuje jak pracownik: w stałych godzinach, pod kierownictwem i bez własnego ryzyka.
        </p>
        <p className="text-xs text-slate-500">
          Zlecenie liczone jako jedyny tytuł do ubezpieczeń agenta, z kosztami 20% i PIT-2. Etat z kosztami {zl0(c.kupEtatMies)} i PIT-2. Bez PPK.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. SPRZEDAŻ MIESZKANIA
// ═══════════════════════════════════════════════════════════════════════════
function SprzedazTab({ c }: { c: TaxConstants }) {
  const rokTeraz = new Date().getFullYear();
  const [rokNabycia, setRokNabycia] = usePersistedState(K("p_rok"), rokTeraz - 3);
  const [rokSprzedazy, setRokSprzedazy] = usePersistedState(K("p_roks"), rokTeraz);
  const [cenaSprzedazy, setCenaSprzedazy] = usePersistedState(K("p_cena"), 750000);
  const [kosztySprzedazy, setKosztySprzedazy] = usePersistedState(K("p_koszty"), 22000);
  const [kosztNabycia, setKosztNabycia] = usePersistedState(K("p_nab"), 520000);
  const [naklady, setNaklady] = usePersistedState(K("p_naklady"), 40000);
  const [wydatki, setWydatki] = usePersistedState(K("p_wydatki"), 0);
  const [rynek, setRynek] = usePersistedState<"wtorny" | "pierwotny">(K("p_rynek"), "wtorny");
  const [pierwsze, setPierwsze] = usePersistedState(K("p_pierwsze"), false);

  const w = podatekOdSprzedazy({ rokNabycia, rokSprzedazy, cenaSprzedazy, kosztySprzedazy, kosztNabycia, naklady, wydatkiMieszkaniowe: wydatki }, c);
  const pcc = pccKupujacego(cenaSprzedazy, rynek, pierwsze, c);
  const bezUlgi = podatekOdSprzedazy({ rokNabycia, rokSprzedazy, cenaSprzedazy, kosztySprzedazy, kosztNabycia, naklady, wydatkiMieszkaniowe: 0 }, c).podatek;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,360px)_1fr]">
      <div className="space-y-4">
        <Panel title="Sprzedający">
          <div className="grid grid-cols-2 gap-3">
            <Num label="Rok nabycia" value={rokNabycia} onChange={setRokNabycia} />
            <Num label="Rok sprzedaży" value={rokSprzedazy} onChange={setRokSprzedazy} />
          </div>
          <p className="-mt-1 text-xs text-slate-500">Przy spadku wpisz rok, w którym mieszkanie nabył spadkodawca.</p>
          <Num label="Cena sprzedaży" value={cenaSprzedazy} onChange={setCenaSprzedazy} />
          <Num label="Koszty sprzedaży (prowizja, notariusz po stronie sprzedającego)" value={kosztySprzedazy} onChange={setKosztySprzedazy} />
          <Num label="Koszt nabycia (cena zakupu z opłatami)" value={kosztNabycia} onChange={setKosztNabycia} />
          <Num label="Udokumentowane nakłady (remont, fakturami)" value={naklady} onChange={setNaklady} />
          <Num label="Wydatki na własne cele mieszkaniowe (ulga)" value={wydatki} onChange={setWydatki} />
        </Panel>
        <Panel title="Kupujący">
          <div>
            <Label>Rynek</Label>
            <Select value={rynek} onChange={(v) => setRynek(v as "wtorny" | "pierwotny")}>
              <option value="wtorny">Wtórny</option>
              <option value="pierwotny">Pierwotny (od dewelopera)</option>
            </Select>
          </div>
          {rynek === "wtorny" && <Toggle checked={pierwsze} onChange={setPierwsze} label="Pierwsze mieszkanie kupującego" hint="zwolnienie z PCC, jeśli nigdy nie miał mieszkania ani domu" />}
        </Panel>
      </div>

      <div className="space-y-4">
        <div className={`rounded-2xl border p-5 ${w.zwolnionaPo5Latach ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-amber-500/40 bg-amber-500/[0.06]"}`}>
          {w.zwolnionaPo5Latach ? (
            <p className="text-lg font-semibold text-slate-900">Bez podatku: minęło 5 lat od końca roku nabycia.</p>
          ) : (
            <>
              <p className="text-sm text-slate-600">PIT od sprzedaży (19% dochodu)</p>
              <p className="text-3xl font-bold text-slate-900">{zl0(w.podatek)}</p>
              <p className="mt-1 text-sm text-slate-700">
                Bez podatku sprzedałby od <b>1 stycznia {w.rokBezPodatku}</b>.
                {wydatki > 0 && bezUlgi > w.podatek && <> Ulga mieszkaniowa obniża podatek o {zl0(bezUlgi - w.podatek)}.</>}
              </p>
            </>
          )}
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <tbody className="text-slate-600">
              <TR label="Przychód (cena minus koszty sprzedaży)" value={zl0(w.przychod)} />
              <TR label="Koszt nabycia i nakłady" value={`−${zl0(kosztNabycia + naklady)}`} />
              <TR label="Dochód" value={zl0(w.dochod)} strong />
              {!w.zwolnionaPo5Latach && <TR label={`Zwolniony ulgą mieszkaniową (${pct1(w.udzialWydatkow)} przychodu)`} value={`−${zl0(w.dochodZwolniony)}`} />}
              <TR label="Podatek 19%" value={zl0(w.podatek)} strong />
              <TR label={`PCC kupującego (${rynek === "pierwotny" ? "w cenie VAT" : pierwsze ? "zwolnienie, pierwsze mieszkanie" : "2% ceny"})`} value={zl0(pcc)} />
            </tbody>
          </table>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          Sprzedaż przed upływem 5 lat (liczonych od końca roku nabycia) to przychód opodatkowany 19%. Sprzedający składa PIT-39 do 30 kwietnia następnego roku. Ulga
          mieszkaniowa: dochód jest zwolniony w części, w jakiej przychód wyda na własne cele mieszkaniowe do końca {w.terminWydatkow} r. (zakup innego mieszkania, spłata
          kredytu na nie, remont własnego). Kupujący na rynku wtórnym płaci 2% PCC, pobiera go notariusz.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. ZAŁOŻENIA
// ═══════════════════════════════════════════════════════════════════════════
function ZalozeniaTab({ c, setC }: { c: TaxConstants; setC: (c: TaxConstants) => void }) {
  const set = (k: keyof TaxConstants) => (v: number) => setC({ ...c, [k]: v });
  const proc = (k: keyof TaxConstants) => ({ value: r4(c[k] * 100), onChange: (v: number) => set(k)(v / 100) });
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">Wszystkie kwoty i stawki w jednym miejscu. Zmiana przelicza cały kalkulator. Domyślnie wartości obowiązujące w 2026 r.</p>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="ZUS przedsiębiorcy (podstawy miesięczne)">
          <Num label="Podstawa dużego ZUS" value={c.podstawaDuzyZus} onChange={set("podstawaDuzyZus")} />
          <Num label="Podstawa małego ZUS (30% płacy minimalnej)" value={c.podstawaMalyZus} onChange={set("podstawaMalyZus")} />
          <Num label="Płaca minimalna" value={c.placaMinimalna} onChange={set("placaMinimalna")} />
          <Num label="Limit przychodu dla Małego ZUS Plus" value={c.limitMalyZusPlus} onChange={set("limitMalyZusPlus")} />
        </Panel>
        <Panel title="Stawki ZUS (%)">
          <Num label="Emerytalna" {...proc("stawkaEmerytalna")} />
          <Num label="Rentowa" {...proc("stawkaRentowa")} />
          <Num label="Wypadkowa" {...proc("stawkaWypadkowa")} />
          <Num label="Chorobowa" {...proc("stawkaChorobowa")} />
          <Num label="Fundusz Pracy" {...proc("stawkaFP")} />
        </Panel>
        <Panel title="Składka zdrowotna">
          <Num label="Skala (% dochodu)" {...proc("zdrowotnaSkalaStawka")} />
          <Num label="Liniowy (% dochodu)" {...proc("zdrowotnaLiniowyStawka")} />
          <Num label="Minimalna miesięczna" value={c.zdrowotnaMinMies} onChange={set("zdrowotnaMinMies")} />
          <Num label="Limit odliczenia na liniowym (rocznie)" value={c.liniowyZdrowotnaOdliczenieLimit} onChange={set("liniowyZdrowotnaOdliczenieLimit")} />
        </Panel>
        <Panel title="Zdrowotna na ryczałcie (miesięcznie)">
          <Num label={`Przychód do ${zl0(c.ryczaltProg1)}`} value={c.zdrowotnaRyczalt1Mies} onChange={set("zdrowotnaRyczalt1Mies")} />
          <Num label={`Do ${zl0(c.ryczaltProg2)}`} value={c.zdrowotnaRyczalt2Mies} onChange={set("zdrowotnaRyczalt2Mies")} />
          <Num label={`Ponad ${zl0(c.ryczaltProg2)}`} value={c.zdrowotnaRyczalt3Mies} onChange={set("zdrowotnaRyczalt3Mies")} />
        </Panel>
        <Panel title="PIT">
          <Num label="Kwota wolna" value={c.kwotaWolna} onChange={set("kwotaWolna")} />
          <Num label="Próg skali 12%/32%" value={c.progSkali} onChange={set("progSkali")} />
          <Num label="Liniowy (%)" {...proc("stawkaLiniowy")} />
          <Num label="Ryczałt, pośrednictwo (%)" {...proc("stawkaRyczalt")} />
          <Num label="PIT od sprzedaży nieruchomości (%)" {...proc("stawkaPitSprzedaz")} />
        </Panel>
        <Panel title="VAT, CIT, PCC">
          <Num label="Limit zwolnienia z VAT" value={c.limitVat} onChange={set("limitVat")} />
          <Num label="VAT (%)" {...proc("stawkaVat")} />
          <Num label="CIT mały podatnik (%)" {...proc("citMaly")} />
          <Num label="CIT standard (%)" {...proc("citStandard")} />
          <Num label="Dywidenda (%)" {...proc("stawkaDywidendy")} />
          <Num label="PCC (%)" {...proc("stawkaPcc")} />
        </Panel>
        <Panel title="Etat i zlecenie">
          <Num label="Składki pracownika (%)" {...proc("pracownikSpoleczne")} />
          <Num label="Składki pracodawcy (%)" {...proc("pracodawcaSkladki")} />
          <Num label="Koszty uzyskania na etacie (mies.)" value={c.kupEtatMies} onChange={set("kupEtatMies")} />
          <Num label="Kwota zmniejszająca podatek (mies.)" value={c.kwotaZmniejszajacaMies} onChange={set("kwotaZmniejszajacaMies")} />
        </Panel>
      </div>
      <button onClick={() => setC(DEFAULT_CONSTANTS)} className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-200 hover:text-slate-900">
        Przywróć wartości 2026
      </button>
    </div>
  );
}

const r4 = (n: number) => Math.round(n * 10000) / 10000;

function MiniTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-emerald-500 text-white" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function QuickBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-900"
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Trwały stan - zapis do localStorage (zostaje po odświeżeniu, per przeglądarka)
// ═══════════════════════════════════════════════════════════════════════════
function usePersistedState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  // Wczytanie po zamontowaniu (unikamy niezgodności SSR/hydracji).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setState(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [key]);
  // Zapis przy każdej zmianie (dopiero po wczytaniu, by nie nadpisać domyślnymi).
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [key, state, loaded]);
  return [state, setState] as const;
}

// ═══════════════════════════════════════════════════════════════════════════
// Wspólne komponenty UI
// ═══════════════════════════════════════════════════════════════════════════
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm text-slate-500">{children}</label>;
}

const inpCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  // Tekstowe pole z obsługą przecinka, żeby nie znikał podczas wpisywania.
  const [raw, setRaw] = useState<string | null>(null);
  const display = raw ?? (value ? String(value) : "");
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={(e) => {
          const val = e.target.value;
          setRaw(val);
          const n = parseFloat(val.replace(/\s/g, "").replace(",", "."));
          onChange(Number.isFinite(n) ? n : 0);
        }}
        onBlur={() => setRaw(null)}
        className={inpCls}
      />
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <SelectBox value={value} onChange={(e) => onChange(e.target.value)}>
      {children}
    </SelectBox>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
      />
      <span>
        <span className="text-sm text-slate-800">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={strong ? "font-semibold text-slate-800" : "text-slate-700"}>{value}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "warn";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone === "warn" ? "text-amber-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function BigCard({
  title,
  value,
  sub,
  best,
}: {
  title: string;
  value: string;
  sub: string;
  best: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-5 ${
        best
          ? "border-emerald-500/50 bg-emerald-500/[0.07] shadow-[0_0_30px_-12px] shadow-emerald-500/40"
          : "border-slate-200 bg-white"
      }`}
    >
      {best && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
          LEPSZE
        </span>
      )}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function TR({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr className={`border-b border-slate-200 last:border-0 ${strong ? "bg-slate-50" : ""}`}>
      <td className={`px-4 py-2.5 ${strong ? "font-semibold text-slate-900" : ""}`}>{label}</td>
      <td className={`px-4 py-2.5 text-right tabular-nums ${strong ? "font-semibold text-slate-900" : "text-slate-700"}`}>
        {value}
      </td>
    </tr>
  );
}
