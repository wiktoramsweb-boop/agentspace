"use client";

import { useMemo, useState } from "react";
import {
  compareForms,
  compareSpzoo,
  computeSpzooPayout,
  computeVat,
  progSkalaLiniowy,
  zusTimeline,
  DEFAULT_CONSTANTS,
  FORM_SHORT,
  type TaxConstants,
  type TaxForm,
  type ZusStage,
  type FormResult,
} from "@/lib/tax";

// ── formatowanie ────────────────────────────────────────────────────────────
const zl0 = (n: number) =>
  new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(Math.round(n)) + " zł";
const pct1 = (n: number) => (n * 100).toFixed(1).replace(".", ",") + " %";
const datePL = (d: Date) =>
  new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(d);

type Tab = "forma" | "zus" | "vat" | "spzoo" | "zalozenia";

const TABS: { id: Tab; label: string }[] = [
  { id: "forma", label: "Forma opodatkowania" },
  { id: "zus", label: "ZUS" },
  { id: "vat", label: "VAT" },
  { id: "spzoo", label: "JDG vs sp. z o.o." },
  { id: "zalozenia", label: "Założenia" },
];

export function TaxCalculator() {
  const [tab, setTab] = useState<Tab>("forma");
  const [c, setC] = useState<TaxConstants>(DEFAULT_CONSTANTS);

  return (
    <div className="space-y-5">
      {/* Zastrzeżenie */}
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 text-sm text-amber-200/90">
        <span className="font-semibold text-amber-300">To narzędzie do modelowania, nie porada podatkowa.</span>{" "}
        Kwoty ZUS i zdrowotnej na 2026 to szacunki (oficjalne kwoty ogłaszane są końcem roku) — możesz je
        poprawić w zakładce <span className="font-medium">Założenia</span>. Przed realną decyzją potwierdź u księgowej.
      </div>

      {/* Zakładki */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-emerald-500 text-zinc-950"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "forma" && <FormaTab c={c} />}
      {tab === "zus" && <ZusTab c={c} />}
      {tab === "vat" && <VatTab c={c} />}
      {tab === "spzoo" && <SpzooTab c={c} />}
      {tab === "zalozenia" && <ZalozeniaTab c={c} setC={setC} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ZAKŁADKA 1 — FORMA OPODATKOWANIA (per wspólnik)
// ═══════════════════════════════════════════════════════════════════════════
function FormaTab({ c }: { c: TaxConstants }) {
  const [przychod, setPrzychod] = useState(230000);
  const [koszty, setKoszty] = useState(20000);
  const [zusStage, setZusStage] = useState<ZusStage>("duzy");
  const [vatPayer, setVatPayer] = useState(false);

  // Jako VATowiec Twoja prowizja brutto zawiera VAT — realny przychód firmy to netto.
  const przychodEfekt = vatPayer ? przychod / (1 + c.stawkaVat) : przychod;
  const { results, best } = useMemo(
    () => compareForms({ przychod: przychodEfekt, koszty, zusStage }, c),
    [przychodEfekt, koszty, zusStage, c],
  );
  const prog = useMemo(() => progSkalaLiniowy(zusStage, c), [zusStage, c]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr]">
      {/* Panel wejścia */}
      <div className="space-y-4">
        <Panel title="Dane wspólnika (rocznie)">
          <Num label="Przychód (prowizje brutto)" value={przychod} onChange={setPrzychod} />
          <Num label="Koszty firmy (bez ZUS)" value={koszty} onChange={setKoszty} />
          <div>
            <Label>Etap ZUS</Label>
            <Select value={zusStage} onChange={(v) => setZusStage(v as ZusStage)}>
              <option value="ulga_start">Ulga na start</option>
              <option value="preferencyjny">Mały ZUS (preferencyjny)</option>
              <option value="duzy">Duży ZUS (pełny)</option>
            </Select>
          </div>
          <Toggle
            checked={vatPayer}
            onChange={setVatPayer}
            label="Jestem VATowcem"
            hint="prowizja zawiera 23% VAT do oddania → realny przychód to netto"
          />
        </Panel>

        <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-4 text-sm text-zinc-400">
          <p className="mb-1 font-medium text-zinc-300">Punkt przełamania skala ↔ liniowy</p>
          <p>
            Przy dochodzie ok. <span className="font-semibold text-white">{zl0(prog)}</span> na osobę liniowy
            zaczyna wygrywać. Poniżej — skala jest tańsza.
          </p>
        </div>
      </div>

      {/* Wyniki — 3 karty */}
      <div className="space-y-4">
        {vatPayer && (
          <p className="text-xs text-zinc-500">
            Liczone od przychodu netto {zl0(przychodEfekt)} (po odliczeniu VAT od {zl0(przychod)}).
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          {results.map((r) => (
            <FormCard key={r.form} r={r} isBest={r.form === best.form} />
          ))}
        </div>
        <BreakdownTable results={results} bestForm={best.form} />
        <p className="text-xs text-zinc-500">
          „Do kieszeni" = dochód − PIT/ryczałt − zdrowotna − ZUS społeczny − danina. Ryczałt liczony od
          przychodu (koszty NIE obniżają podatku) — opłaca się przy wysokiej marży, ale gdy masz realne
          koszty szybko przegrywa. Przy niskim dochodzie wygrywa skala (kwota wolna + 12%), przy wysokim —
          liniowy lub ryczałt.
        </p>
      </div>
    </div>
  );
}

function FormCard({ r, isBest }: { r: FormResult; isBest: boolean }) {
  return (
    <div
      className={`relative rounded-2xl border p-4 transition ${
        isBest
          ? "border-emerald-500/50 bg-emerald-500/[0.07] shadow-[0_0_30px_-12px] shadow-emerald-500/40"
          : "border-zinc-700/60 bg-zinc-800/40"
      }`}
    >
      {isBest && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-zinc-950">
          NAJTANIEJ
        </span>
      )}
      <p className="text-sm font-semibold text-zinc-200">{FORM_SHORT[r.form]}</p>
      <p className="mt-3 text-2xl font-bold text-white">{zl0(r.netto)}</p>
      <p className="text-xs text-zinc-500">do kieszeni / rok</p>
      <div className="mt-3 space-y-1 border-t border-zinc-700/50 pt-3 text-xs text-zinc-400">
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
    { label: "Do kieszeni", get: (r) => zl0(r.netto) },
    { label: "Efektywna stawka", get: (r) => pct1(r.efektywna) },
  ];
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-700/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700/60 bg-zinc-900/60 text-left text-zinc-400">
            <th className="px-4 py-2.5 font-medium">Pozycja</th>
            {results.map((r) => (
              <th
                key={r.form}
                className={`px-4 py-2.5 text-right font-semibold ${
                  r.form === bestForm ? "text-emerald-300" : "text-zinc-300"
                }`}
              >
                {FORM_SHORT[r.form]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.label}
              className={`border-b border-zinc-800/60 last:border-0 ${
                row.label === "Do kieszeni" ? "bg-zinc-900/40 font-semibold text-white" : "text-zinc-400"
              }`}
            >
              <td className="px-4 py-2">{row.label}</td>
              {results.map((r) => (
                <td
                  key={r.form}
                  className={`px-4 py-2 text-right tabular-nums ${
                    r.form === bestForm && row.label === "Do kieszeni" ? "text-emerald-300" : ""
                  }`}
                >
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
// ZAKŁADKA 2 — ZUS (oś czasu)
// ═══════════════════════════════════════════════════════════════════════════
function ZusTab({ c }: { c: TaxConstants }) {
  const [rok, setRok] = useState(2024);
  const [miesiac, setMiesiac] = useState(9); // wrzesień
  const [ulgaStart, setUlgaStart] = useState(false);
  const [osob, setOsob] = useState(2);

  const data = new Date(rok, miesiac - 1, 1);
  const t = useMemo(() => zusTimeline(data, ulgaStart, c), [rok, miesiac, ulgaStart, c]);
  const skonczony = t.monthsLeft <= 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Panel title="Twoja działalność (JDG)">
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
        <Toggle
          checked={ulgaStart}
          onChange={setUlgaStart}
          label="Braliśmy ulgę na start (6 mies.)"
          hint="kod 0570 przy rejestracji. Bez niej — od razu mały ZUS (kod 0540)"
        />
        <Num label="Ilu wspólników" value={osob} onChange={setOsob} />
      </Panel>

      <div className="space-y-4">
        {/* Werdykt */}
        <div
          className={`rounded-2xl border p-5 ${
            skonczony
              ? "border-zinc-700/60 bg-zinc-800/40"
              : t.monthsLeft <= 3
                ? "border-red-500/40 bg-red-500/[0.07]"
                : "border-emerald-500/40 bg-emerald-500/[0.06]"
          }`}
        >
          {skonczony ? (
            <p className="text-lg font-semibold text-white">
              Mały ZUS już się skończył ({datePL(t.preferencyjnyDo)}) — płacicie duży ZUS.
            </p>
          ) : (
            <>
              <p className="text-sm text-zinc-400">Mały ZUS kończy się</p>
              <p className="text-2xl font-bold text-white">{datePL(t.preferencyjnyDo)}</p>
              <p className="mt-1 text-sm text-zinc-300">
                Zostało <span className="font-semibold text-white">{t.monthsLeft} mies.</span>
                {t.monthsLeft <= 3 && <span className="text-red-300"> — to już za chwilę!</span>}
              </p>
            </>
          )}
        </div>

        {/* Skok składki */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Mały ZUS (teraz)" value={`${zl0(c.zusPreferencyjnyMies)}/mc`} tone="muted" />
          <Stat label="Duży ZUS (po)" value={`${zl0(c.zusDuzyMies)}/mc`} tone="warn" />
          <Stat label="Skok na osobę" value={`+${zl0(t.skokMies)}/mc`} tone="warn" />
        </div>

        <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-5">
          <p className="text-sm text-zinc-400">Nowy stały koszt dla firmy ({osob} os.)</p>
          <p className="text-2xl font-bold text-amber-300">+{zl0(t.skokRoczny * osob)} / rok</p>
          <p className="mt-2 text-sm text-zinc-400">
            To o {zl0(t.skokMies * osob)} więcej miesięcznie. Wpisz to do budżetu (P&L), żeby nie pokazywał
            zawyżonego zysku. Zdrowotna się nie zmienia — leci od dochodu niezależnie od etapu ZUS.
          </p>
        </div>

        {/* Oś */}
        <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-5">
          <p className="mb-3 text-sm font-medium text-zinc-300">Oś czasu składek</p>
          <ol className="space-y-2 text-sm text-zinc-400">
            {t.ulgaStartDo && (
              <li>
                <span className="text-zinc-500">do {datePL(t.ulgaStartDo)}:</span> ulga na start — 0 zł
                społecznych (tylko zdrowotna)
              </li>
            )}
            <li>
              <span className="text-zinc-500">
                {datePL(t.preferencyjnyOd)} – {datePL(t.preferencyjnyDo)}:
              </span>{" "}
              mały ZUS ~{zl0(c.zusPreferencyjnyMies)}/mc
            </li>
            <li>
              <span className="text-zinc-500">od {datePL(t.preferencyjnyDo)}:</span> duży ZUS ~
              {zl0(c.zusDuzyMies)}/mc
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

const MIESIACE = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
];

// ═══════════════════════════════════════════════════════════════════════════
// ZAKŁADKA 3 — VAT
// ═══════════════════════════════════════════════════════════════════════════
function VatTab({ c }: { c: TaxConstants }) {
  const [sc, setSc] = useState(200000);
  const [w, setW] = useState(150000);
  const [k, setK] = useState(150000);
  const [kosztyVat, setKosztyVat] = useState(40000);

  const subjects = [
    { name: "s.c. Spectra", przychod: sc },
    { name: "JDG Wiktor", przychod: w },
    { name: "JDG Krystian", przychod: k },
  ];
  const v = useMemo(() => computeVat(subjects, kosztyVat, c), [sc, w, k, kosztyVat, c]);
  const nadLimit = v.nadPojemnosc > 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Panel title="Przychód roczny per podmiot">
        <Num label="s.c. Spectra" value={sc} onChange={setSc} />
        <Num label="JDG Wiktor" value={w} onChange={setW} />
        <Num label="JDG Krystian" value={k} onChange={setK} />
        <Num label="Roczne koszty z VAT (do odliczenia)" value={kosztyVat} onChange={setKosztyVat} />
      </Panel>

      <div className="space-y-4">
        {/* Paski do limitu */}
        <div className="space-y-3 rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-5">
          <p className="text-sm font-medium text-zinc-300">
            Limit VAT: {zl0(c.limitVat)} na podmiot (od 2026)
          </p>
          {v.subjects.map((s) => {
            const fill = Math.min(100, (s.przychod / c.limitVat) * 100);
            return (
              <div key={s.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-zinc-300">{s.name}</span>
                  <span className={s.nadLimit ? "font-semibold text-red-300" : "text-zinc-400"}>
                    {zl0(s.przychod)} {s.nadLimit ? "· NAD LIMITEM" : `· do limitu ${zl0(s.doLimitu)}`}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-zinc-950">
                  <div
                    className={`h-full rounded-full ${
                      fill >= 100 ? "bg-red-500" : fill >= 85 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${fill}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Pojemność łączna */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Stat label="Łączna pojemność bez VAT" value={zl0(v.pojemnosc)} tone="muted" />
          <Stat
            label="Suma przychodów"
            value={zl0(v.sumaPrzychodow)}
            tone={nadLimit ? "warn" : "muted"}
          />
        </div>

        <div
          className={`rounded-2xl border p-5 ${
            nadLimit ? "border-red-500/40 bg-red-500/[0.07]" : "border-emerald-500/40 bg-emerald-500/[0.06]"
          }`}
        >
          {nadLimit ? (
            <p className="text-white">
              <span className="font-semibold text-red-300">VAT nieunikniony.</span> Suma przychodów przebija
              łączną pojemność o {zl0(v.nadPojemnosc)}. Nawet bez spółki wchodzicie w VAT w tym cyklu.
            </p>
          ) : (
            <p className="text-white">
              <span className="font-semibold text-emerald-300">Mieścicie się pod limitem</span> — zostało{" "}
              {zl0(v.pojemnosc - v.sumaPrzychodow)} łącznej pojemności. Ale pamiętaj o ryzyku sztucznego
              podziału (niżej).
            </p>
          )}
        </div>

        {/* Koszt utraty statusu */}
        <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-5">
          <p className="text-sm text-zinc-400">Koszt wejścia w VAT (utrata statusu nie-VAT)</p>
          <p className="text-2xl font-bold text-amber-300">−{zl0(v.kosztUtratyNetto)} / rok</p>
          <p className="mt-2 text-sm text-zinc-400">
            Sprzedajesz głównie osobom prywatnym (nie odliczą VAT), więc 23% od prowizji oddajesz fiskusowi
            (minus VAT z kosztów). To zwykle największa liczba w całej analizie — więcej niż oszczędność na
            ZUS czy spółce.
          </p>
        </div>

        {/* Ostrzeżenie sztuczny podział */}
        <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-5 text-sm text-red-200/90">
          <p className="mb-1 font-semibold text-red-300">⚠ Ryzyko: sztuczne dzielenie działalności</p>
          <p className="text-zinc-300">
            „Walenie na JDG, żeby zmieścić się pod limitem" fiskus może uznać za obejście limitu VAT — zsumować
            obroty 3 podmiotów, naliczyć VAT wstecz + odsetki + KKS. Obrona = realna odrębność (osobni klienci,
            umowy, koszty), nie samo przełączanie faktur.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ZAKŁADKA 4 — JDG vs SP. Z O.O.
// ═══════════════════════════════════════════════════════════════════════════
type Wyplata = "dywidenda" | "powolanie";

function SpzooTab({ c }: { c: TaxConstants }) {
  const [zysk, setZysk] = useState(300000);
  const [forma, setForma] = useState<TaxForm>("liniowy");
  const [zusStage, setZusStage] = useState<ZusStage>("duzy");
  const [malyPodatnik, setMalyPodatnik] = useState(true);
  const [wyplata, setWyplata] = useState<Wyplata>("powolanie");
  const [powolanie, setPowolanie] = useState(120000); // per osoba — domyślnie do progu 12%

  const s = useMemo(
    () => compareSpzoo(zysk, forma, zusStage, malyPodatnik, c),
    [zysk, forma, zusStage, malyPodatnik, c],
  );
  const pay = useMemo(
    () => computeSpzooPayout(zysk, powolanie, malyPodatnik, c),
    [zysk, powolanie, malyPodatnik, c],
  );

  const spolkaNetto = wyplata === "dywidenda" ? s.spzooNetto : pay.nettoRazem;
  const spolkaEfekt = wyplata === "dywidenda" ? s.spzooEfektywna : pay.efektywna;
  const roznica = spolkaNetto - s.jdgNetto;
  const spolkaLepsza = roznica > 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="space-y-4">
        <Panel title="Zysk firmy (rocznie)">
          <Num label="Zysk do podziału (2 wspólników)" value={zysk} onChange={setZysk} />
          <div>
            <Label>Forma JDG do porównania</Label>
            <Select value={forma} onChange={(v) => setForma(v as TaxForm)}>
              <option value="liniowy">Liniowy 19%</option>
              <option value="skala">Skala 12/32%</option>
              <option value="ryczalt">Ryczałt 15%</option>
            </Select>
          </div>
          <div>
            <Label>Etap ZUS (JDG)</Label>
            <Select value={zusStage} onChange={(v) => setZusStage(v as ZusStage)}>
              <option value="duzy">Duży ZUS</option>
              <option value="preferencyjny">Mały ZUS</option>
              <option value="ulga_start">Ulga na start</option>
            </Select>
          </div>
          <Toggle
            checked={malyPodatnik}
            onChange={setMalyPodatnik}
            label="Mały podatnik CIT (9%)"
            hint="przychód < 2 mln EUR → CIT 9%, inaczej 19%"
          />
        </Panel>

        <Panel title="Sposób wypłaty ze spółki">
          <div className="flex rounded-xl border border-zinc-700/60 bg-zinc-900/60 p-1">
            <MiniTab active={wyplata === "dywidenda"} onClick={() => setWyplata("dywidenda")}>
              Dywidenda
            </MiniTab>
            <MiniTab active={wyplata === "powolanie"} onClick={() => setWyplata("powolanie")}>
              Powołanie + dywidenda
            </MiniTab>
          </div>
          {wyplata === "powolanie" && (
            <>
              <Num label="Wynagrodzenie z powołania / osobę (rocznie)" value={powolanie} onChange={setPowolanie} />
              <div className="flex flex-wrap gap-1.5">
                <QuickBtn onClick={() => setPowolanie(120000)}>do progu 12% (120k)</QuickBtn>
                <QuickBtn onClick={() => setPowolanie(Math.floor(zysk / 2))}>cały zysk</QuickBtn>
                <QuickBtn onClick={() => setPowolanie(0)}>0 (sama dywidenda)</QuickBtn>
              </div>
              <p className="text-xs text-zinc-500">
                Powołanie uchwałą (art. 201 KSH): skala 12%/32% + zdrowotna 9%, <b>bez ZUS społecznego</b>.
                Jest kosztem spółki → obniża CIT. Trzymając ≤ 120k/os. płacisz tylko 12%.
              </p>
            </>
          )}
        </Panel>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <BigCard
            title={`JDG — 2× ${FORM_SHORT[forma]}`}
            value={zl0(s.jdgNetto)}
            sub={`efektywnie ${pct1(s.jdgEfektywna)} · z ubezpieczeniem ZUS`}
            best={!spolkaLepsza}
          />
          <BigCard
            title={wyplata === "dywidenda" ? "Sp. z o.o. (dywidenda)" : "Sp. z o.o. (powołanie + dywidenda)"}
            value={zl0(spolkaNetto)}
            sub={`efektywnie ${pct1(spolkaEfekt)} · 0 ZUS społ., brak ubezpieczenia`}
            best={spolkaLepsza}
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-700/60">
          <table className="w-full text-sm">
            <tbody className="text-zinc-400">
              <TR label="Zysk firmy (przed wypłatą zarządu)" value={zl0(zysk)} />
              {wyplata === "powolanie" ? (
                <>
                  <TR label={`Wynagrodzenie z powołania (2× ${zl0(pay.powolaniePerOsoba)})`} value={`−${zl0(pay.powolanieRazem)}`} />
                  <TR label="PIT skala od powołania (2 os.)" value={`−${zl0(pay.pitPowolaniePerOsoba * 2)}`} />
                  <TR label="Zdrowotna 9% od powołania (2 os.)" value={`−${zl0(pay.zdrowotnaPowolaniePerOsoba * 2)}`} />
                  <TR label="Zysk po wynagrodzeniach (podstawa CIT)" value={zl0(pay.zyskPoWynagrodzeniach)} />
                  <TR label={`CIT (${pct1(s.citStawka)})`} value={`−${zl0(pay.cit)}`} />
                  <TR label="Dywidenda (19%)" value={`−${zl0(pay.dywidendaPodatek)}`} />
                  <TR label="Sp. z o.o. — do kieszeni razem" value={zl0(pay.nettoRazem)} strong />
                </>
              ) : (
                <>
                  <TR label={`CIT (${pct1(s.citStawka)})`} value={`−${zl0(s.cit)}`} />
                  <TR label="Po CIT" value={zl0(s.poCit)} />
                  <TR label="Dywidenda (19%)" value={`−${zl0(s.dywidenda)}`} />
                  <TR label="Sp. z o.o. — do kieszeni" value={zl0(s.spzooNetto)} strong />
                </>
              )}
              <TR label={`JDG — do kieszeni (2× ${FORM_SHORT[forma]})`} value={zl0(s.jdgNetto)} strong />
            </tbody>
          </table>
        </div>

        {wyplata === "powolanie" && s.spzooNetto !== pay.nettoRazem && (
          <p className="text-xs text-zinc-500">
            Dla porównania: sama dywidenda (bez powołania) dałaby {zl0(s.spzooNetto)}. Powołanie zmienia wynik o{" "}
            <span className={pay.nettoRazem >= s.spzooNetto ? "text-emerald-400" : "text-red-400"}>
              {pay.nettoRazem >= s.spzooNetto ? "+" : ""}
              {zl0(pay.nettoRazem - s.spzooNetto)}
            </span>
            .
          </p>
        )}

        <div
          className={`rounded-2xl border p-5 ${
            spolkaLepsza ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-zinc-700/60 bg-zinc-800/40"
          }`}
        >
          <p className="text-white">
            {spolkaLepsza ? (
              <>
                <span className="font-semibold text-emerald-300">Spółka wygrywa o {zl0(roznica)}/rok</span> —
                ale pamiętaj: sp. z o.o. wymusza pełną księgowość i zwykle wchodzi w parze z VAT-em. Policz to
                razem z kosztem utraty nie-VAT (zakładka VAT).
              </>
            ) : (
              <>
                <span className="font-semibold text-white">JDG wygrywa o {zl0(-roznica)}/rok</span> — przy tej
                skali spółka się nie opłaca, zwłaszcza że dochodzi koszt VAT i księgowości. Zostań na JDG.
              </>
            )}
          </p>
        </div>

        <p className="text-xs text-zinc-500">
          Wynagrodzenie z powołania to zwykle najtańszy sposób wypłaty ze spółki — unika podwójnego
          opodatkowania (jest kosztem, obniża CIT) i nie ma ZUS. Estoński CIT pominięto (wymaga min. 3 osób na
          UoP — agenci na B2B się nie liczą). W spółce dochodzi pełna księgowość (~800–1500 zł/mc) i brak
          ubezpieczenia ZUS wspólników (dokupujesz prywatnie).
        </p>
      </div>
    </div>
  );
}

function MiniTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-white"
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
      className="rounded-full border border-zinc-700/60 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:text-white"
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ZAKŁADKA 5 — ZAŁOŻENIA (edytowalne stałe)
// ═══════════════════════════════════════════════════════════════════════════
function ZalozeniaTab({ c, setC }: { c: TaxConstants; setC: (c: TaxConstants) => void }) {
  const set = (k: keyof TaxConstants) => (v: number) => setC({ ...c, [k]: v });
  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-400">
        Wszystkie kwoty i stawki w jednym miejscu — zmiana przelicza cały kalkulator na żywo. Domyślnie:
        reguły PIT (stabilne od 2022) + szacunki ZUS/zdrowotnej na 2026. Zaktualizuj, gdy ZUS ogłosi oficjalne
        kwoty.
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="ZUS społeczny (miesięcznie)">
          <Num label="Mały ZUS / preferencyjny" value={c.zusPreferencyjnyMies} onChange={set("zusPreferencyjnyMies")} />
          <Num label="Duży ZUS (z Funduszem Pracy)" value={c.zusDuzyMies} onChange={set("zusDuzyMies")} />
        </Panel>
        <Panel title="Składka zdrowotna">
          <Num label="Skala — % od dochodu" value={c.zdrowotnaSkalaStawka * 100} onChange={(v) => set("zdrowotnaSkalaStawka")(v / 100)} />
          <Num label="Liniowy — % od dochodu" value={c.zdrowotnaLiniowyStawka * 100} onChange={(v) => set("zdrowotnaLiniowyStawka")(v / 100)} />
          <Num label="Minimalna miesięczna (skala/liniowy)" value={c.zdrowotnaMinMies} onChange={set("zdrowotnaMinMies")} />
        </Panel>
        <Panel title="Zdrowotna ryczałt (miesięcznie, wg progów)">
          <Num label={`Przychód ≤ ${zl0(c.ryczaltProg1)}`} value={c.zdrowotnaRyczalt1Mies} onChange={set("zdrowotnaRyczalt1Mies")} />
          <Num label={`≤ ${zl0(c.ryczaltProg2)}`} value={c.zdrowotnaRyczalt2Mies} onChange={set("zdrowotnaRyczalt2Mies")} />
          <Num label={`> ${zl0(c.ryczaltProg2)}`} value={c.zdrowotnaRyczalt3Mies} onChange={set("zdrowotnaRyczalt3Mies")} />
        </Panel>
        <Panel title="Stawki podatku">
          <Num label="Liniowy (%)" value={c.stawkaLiniowy * 100} onChange={(v) => set("stawkaLiniowy")(v / 100)} />
          <Num label="Ryczałt — pośrednictwo nieruchomości (%)" value={c.stawkaRyczalt * 100} onChange={(v) => set("stawkaRyczalt")(v / 100)} />
          <Num label="Próg skali 12%/32% (zł)" value={c.progSkali} onChange={set("progSkali")} />
        </Panel>
        <Panel title="VAT">
          <Num label="Limit zwolnienia (zł)" value={c.limitVat} onChange={set("limitVat")} />
          <Num label="Stawka VAT (%)" value={c.stawkaVat * 100} onChange={(v) => set("stawkaVat")(v / 100)} />
        </Panel>
        <Panel title="CIT (sp. z o.o.)">
          <Num label="Mały podatnik CIT (%)" value={c.citMaly * 100} onChange={(v) => set("citMaly")(v / 100)} />
          <Num label="CIT standard (%)" value={c.citStandard * 100} onChange={(v) => set("citStandard")(v / 100)} />
          <Num label="Podatek od dywidendy (%)" value={c.stawkaDywidendy * 100} onChange={(v) => set("stawkaDywidendy")(v / 100)} />
        </Panel>
      </div>
      <button
        onClick={() => setC(DEFAULT_CONSTANTS)}
        className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700/60 hover:text-white"
      >
        Przywróć domyślne (2026)
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Wspólne komponenty UI
// ═══════════════════════════════════════════════════════════════════════════
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm text-zinc-400">{children}</label>;
}

const inpCls =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none";

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
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inpCls}>
      {children}
    </select>
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
        <span className="text-sm text-zinc-200">{label}</span>
        {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      </span>
    </label>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={strong ? "font-semibold text-zinc-200" : "text-zinc-300"}>{value}</span>
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
    <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone === "warn" ? "text-amber-300" : "text-white"}`}>{value}</p>
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
          : "border-zinc-700/60 bg-zinc-800/40"
      }`}
    >
      {best && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-zinc-950">
          LEPSZE
        </span>
      )}
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

function TR({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr className={`border-b border-zinc-800/60 last:border-0 ${strong ? "bg-zinc-900/40" : ""}`}>
      <td className={`px-4 py-2.5 ${strong ? "font-semibold text-white" : ""}`}>{label}</td>
      <td className={`px-4 py-2.5 text-right tabular-nums ${strong ? "font-semibold text-white" : "text-zinc-300"}`}>
        {value}
      </td>
    </tr>
  );
}
