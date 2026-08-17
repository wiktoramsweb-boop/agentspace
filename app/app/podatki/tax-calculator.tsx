"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
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
  const [tab, setTab] = usePersistedState<Tab>("as_tax_tab", "forma");
  const [c, setC] = usePersistedState<TaxConstants>("as_tax_constants", DEFAULT_CONSTANTS);

  return (
    <div className="space-y-5">
      {/* Zastrzeżenie */}
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 text-sm text-amber-200/90">
        <span className="font-semibold text-amber-700">To narzędzie do modelowania, nie porada podatkowa.</span>{" "}
        Kwoty ZUS i zdrowotnej na 2026 to szacunki (oficjalne kwoty ogłaszane są końcem roku) - możesz je
        poprawić w zakładce <span className="font-medium">Założenia</span>. Przed realną decyzją potwierdź u księgowej.
      </div>

      {/* Zakładki */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-emerald-500 text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Delikatny fade przy zmianie zakładki - treść „ustawia się", bez fajerwerków. */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        {tab === "forma" && <FormaTab c={c} />}
        {tab === "zus" && <ZusTab c={c} />}
        {tab === "vat" && <VatTab c={c} />}
        {tab === "spzoo" && <SpzooTab c={c} />}
        {tab === "zalozenia" && <ZalozeniaTab c={c} setC={setC} />}
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ZAKŁADKA 1 - FORMA OPODATKOWANIA (per wspólnik)
// ═══════════════════════════════════════════════════════════════════════════
function FormaTab({ c }: { c: TaxConstants }) {
  const [przychod, setPrzychod] = usePersistedState("as_tax_forma_przychod", 230000);
  const [koszty, setKoszty] = usePersistedState("as_tax_forma_koszty", 20000);
  const [zusStage, setZusStage] = usePersistedState<ZusStage>("as_tax_forma_zus", "duzy");
  const [vatPayer, setVatPayer] = usePersistedState("as_tax_forma_vat", false);

  // Jako VATowiec Twoja prowizja brutto zawiera VAT - realny przychód firmy to netto.
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

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          <p className="mb-1 font-medium text-slate-700">Punkt przełamania skala ↔ liniowy</p>
          <p>
            Przy dochodzie ok. <span className="font-semibold text-slate-900">{zl0(prog)}</span> na osobę liniowy
            zaczyna wygrywać. Poniżej - skala jest tańsza.
          </p>
        </div>
      </div>

      {/* Wyniki - 3 karty */}
      <div className="space-y-4">
        {vatPayer && (
          <p className="text-xs text-slate-500">
            Liczone od przychodu netto {zl0(przychodEfekt)} (po odliczeniu VAT od {zl0(przychod)}).
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          {results.map((r) => (
            <FormCard key={r.form} r={r} isBest={r.form === best.form} />
          ))}
        </div>
        <BreakdownTable results={results} bestForm={best.form} />
        <p className="text-xs text-slate-500">
          „Do kieszeni" = dochód − PIT/ryczałt − zdrowotna − ZUS społeczny − danina. Ryczałt liczony od
          przychodu (koszty NIE obniżają podatku) - opłaca się przy wysokiej marży, ale gdy masz realne
          koszty szybko przegrywa. Przy niskim dochodzie wygrywa skala (kwota wolna + 12%), przy wysokim -
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
          : "border-slate-200 bg-white"
      }`}
    >
      {isBest && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
          NAJTANIEJ
        </span>
      )}
      <p className="text-sm font-semibold text-slate-800">{FORM_SHORT[r.form]}</p>
      <p className="mt-3 text-2xl font-bold text-slate-900">{zl0(r.netto)}</p>
      <p className="text-xs text-slate-500">do kieszeni / rok</p>
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
    { label: "Do kieszeni", get: (r) => zl0(r.netto) },
    { label: "Efektywna stawka", get: (r) => pct1(r.efektywna) },
  ];
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-white text-left text-slate-500">
            <th className="px-4 py-2.5 font-medium">Pozycja</th>
            {results.map((r) => (
              <th
                key={r.form}
                className={`px-4 py-2.5 text-right font-semibold ${
                  r.form === bestForm ? "text-emerald-700" : "text-slate-700"
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
              className={`border-b border-slate-200 last:border-0 ${
                row.label === "Do kieszeni" ? "bg-slate-50 font-semibold text-slate-900" : "text-slate-500"
              }`}
            >
              <td className="px-4 py-2">{row.label}</td>
              {results.map((r) => (
                <td
                  key={r.form}
                  className={`px-4 py-2 text-right tabular-nums ${
                    r.form === bestForm && row.label === "Do kieszeni" ? "text-emerald-700" : ""
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
// ZAKŁADKA 2 - ZUS (oś czasu)
// ═══════════════════════════════════════════════════════════════════════════
function ZusTab({ c }: { c: TaxConstants }) {
  const [rok, setRok] = usePersistedState("as_tax_zus_rok", 2024);
  const [miesiac, setMiesiac] = usePersistedState("as_tax_zus_miesiac", 9); // wrzesień
  const [ulgaStart, setUlgaStart] = usePersistedState("as_tax_zus_ulga", false);
  const [osob, setOsob] = usePersistedState("as_tax_zus_osob", 2);

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
          hint="kod 0570 przy rejestracji. Bez niej - od razu mały ZUS (kod 0540)"
        />
        <Num label="Ilu wspólników" value={osob} onChange={setOsob} />
      </Panel>

      <div className="space-y-4">
        {/* Werdykt */}
        <div
          className={`rounded-2xl border p-5 ${
            skonczony
              ? "border-slate-200 bg-white"
              : t.monthsLeft <= 3
                ? "border-red-500/40 bg-red-500/[0.07]"
                : "border-emerald-500/40 bg-emerald-500/[0.06]"
          }`}
        >
          {skonczony ? (
            <p className="text-lg font-semibold text-slate-900">
              Mały ZUS już się skończył ({datePL(t.preferencyjnyDo)}) - płacicie duży ZUS.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-500">Mały ZUS kończy się</p>
              <p className="text-2xl font-bold text-slate-900">{datePL(t.preferencyjnyDo)}</p>
              <p className="mt-1 text-sm text-slate-700">
                Zostało <span className="font-semibold text-slate-900">{t.monthsLeft} mies.</span>
                {t.monthsLeft <= 3 && <span className="text-red-700"> - to już za chwilę!</span>}
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

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Nowy stały koszt dla firmy ({osob} os.)</p>
          <p className="text-2xl font-bold text-amber-700">+{zl0(t.skokRoczny * osob)} / rok</p>
          <p className="mt-2 text-sm text-slate-500">
            To o {zl0(t.skokMies * osob)} więcej miesięcznie. Wpisz to do budżetu (P&L), żeby nie pokazywał
            zawyżonego zysku. Zdrowotna się nie zmienia - leci od dochodu niezależnie od etapu ZUS.
          </p>
        </div>

        {/* Oś */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-sm font-medium text-slate-700">Oś czasu składek</p>
          <ol className="space-y-2 text-sm text-slate-500">
            {t.ulgaStartDo && (
              <li>
                <span className="text-slate-500">do {datePL(t.ulgaStartDo)}:</span> ulga na start - 0 zł
                społecznych (tylko zdrowotna)
              </li>
            )}
            <li>
              <span className="text-slate-500">
                {datePL(t.preferencyjnyOd)} - {datePL(t.preferencyjnyDo)}:
              </span>{" "}
              mały ZUS ~{zl0(c.zusPreferencyjnyMies)}/mc
            </li>
            <li>
              <span className="text-slate-500">od {datePL(t.preferencyjnyDo)}:</span> duży ZUS ~
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
// ZAKŁADKA 3 - VAT
// ═══════════════════════════════════════════════════════════════════════════
function VatTab({ c }: { c: TaxConstants }) {
  const [sc, setSc] = usePersistedState("as_tax_vat_sc", 200000);
  const [w, setW] = usePersistedState("as_tax_vat_w", 150000);
  const [k, setK] = usePersistedState("as_tax_vat_k", 150000);
  const [kosztyVat, setKosztyVat] = usePersistedState("as_tax_vat_koszty", 40000);

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
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-700">
            Limit VAT: {zl0(c.limitVat)} na podmiot (od 2026)
          </p>
          {v.subjects.map((s) => {
            const fill = Math.min(100, (s.przychod / c.limitVat) * 100);
            return (
              <div key={s.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-700">{s.name}</span>
                  <span className={s.nadLimit ? "font-semibold text-red-700" : "text-slate-500"}>
                    {zl0(s.przychod)} {s.nadLimit ? "· NAD LIMITEM" : `· do limitu ${zl0(s.doLimitu)}`}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ease-[cubic-bezier(0.21,0.47,0.32,0.98)] ${
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
            <p className="text-slate-900">
              <span className="font-semibold text-red-700">VAT nieunikniony.</span> Suma przychodów przebija
              łączną pojemność o {zl0(v.nadPojemnosc)}. Nawet bez spółki wchodzicie w VAT w tym cyklu.
            </p>
          ) : (
            <p className="text-slate-900">
              <span className="font-semibold text-emerald-700">Mieścicie się pod limitem</span> - zostało{" "}
              {zl0(v.pojemnosc - v.sumaPrzychodow)} łącznej pojemności. Ale pamiętaj o ryzyku sztucznego
              podziału (niżej).
            </p>
          )}
        </div>

        {/* Koszt utraty statusu */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Koszt wejścia w VAT (utrata statusu nie-VAT)</p>
          <p className="text-2xl font-bold text-amber-700">−{zl0(v.kosztUtratyNetto)} / rok</p>
          <p className="mt-2 text-sm text-slate-500">
            Sprzedajesz głównie osobom prywatnym (nie odliczą VAT), więc 23% od prowizji oddajesz fiskusowi
            (minus VAT z kosztów). To zwykle największa liczba w całej analizie - więcej niż oszczędność na
            ZUS czy spółce.
          </p>
        </div>

        {/* Ostrzeżenie sztuczny podział */}
        <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-5 text-sm text-red-200/90">
          <p className="mb-1 font-semibold text-red-700">⚠ Ryzyko: sztuczne dzielenie działalności</p>
          <p className="text-slate-700">
            „Walenie na JDG, żeby zmieścić się pod limitem" fiskus może uznać za obejście limitu VAT - zsumować
            obroty 3 podmiotów, naliczyć VAT wstecz + odsetki + KKS. Obrona = realna odrębność (osobni klienci,
            umowy, koszty), nie samo przełączanie faktur.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ZAKŁADKA 4 - JDG vs SP. Z O.O.
// ═══════════════════════════════════════════════════════════════════════════
// Co zrobić z zyskiem, który zostaje po wynagrodzeniu z powołania:
// „zatrzymane" = zostaje w spółce (tylko CIT, bez dywidendy) - najkorzystniej.
// „dywidenda"  = wypłacić wspólnikom (dochodzi 19% podatku od dywidendy).
type Wyplata = "zatrzymane" | "dywidenda";

function SpzooTab({ c }: { c: TaxConstants }) {
  const [zysk, setZysk] = usePersistedState("as_tax_spzoo_zysk", 300000);
  const [forma, setForma] = usePersistedState<TaxForm>("as_tax_spzoo_forma", "liniowy");
  const [zusStage, setZusStage] = usePersistedState<ZusStage>("as_tax_spzoo_zus", "duzy");
  const [malyPodatnik, setMalyPodatnik] = usePersistedState("as_tax_spzoo_maly", true);
  const [wyplata, setWyplata] = usePersistedState<Wyplata>("as_tax_spzoo_wyplata2", "zatrzymane");
  const [powolanie, setPowolanie] = usePersistedState("as_tax_spzoo_powolanie", 120000); // per osoba - domyślnie do progu 12%

  const s = useMemo(
    () => compareSpzoo(zysk, forma, zusStage, malyPodatnik, c),
    [zysk, forma, zusStage, malyPodatnik, c],
  );
  const pay = useMemo(
    () => computeSpzooPayout(zysk, powolanie, malyPodatnik, wyplata === "dywidenda", c),
    [zysk, powolanie, malyPodatnik, wyplata, c],
  );

  // Do porównania z JDG bierzemy łączną wartość po opodatkowaniu
  // (kieszeń + zysk zatrzymany w spółce po CIT).
  const spolkaWartosc = pay.wartoscPoOpodatkowaniu;
  const roznica = spolkaWartosc - s.jdgNetto;
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

        <Panel title="Wypłata: wynagrodzenie z powołania">
          <Num label="Powołanie / osobę (rocznie)" value={powolanie} onChange={setPowolanie} />
          <div className="flex flex-wrap gap-1.5">
            <QuickBtn onClick={() => setPowolanie(120000)}>do progu 12% (120k)</QuickBtn>
            <QuickBtn onClick={() => setPowolanie(Math.floor(zysk / 2))}>cały zysk</QuickBtn>
            <QuickBtn onClick={() => setPowolanie(0)}>0</QuickBtn>
          </div>
          <p className="text-xs text-slate-500">
            Powołanie uchwałą (art. 201 KSH): skala 12%/32% + zdrowotna 9%, <b>bez ZUS społecznego</b>. Jest
            kosztem spółki → obniża CIT. Trzymając ≤ 120k/os. płacisz tylko 12%.
          </p>

          <div className="pt-1">
            <Label>Reszta zysku (po powołaniu)</Label>
            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              <MiniTab active={wyplata === "zatrzymane"} onClick={() => setWyplata("zatrzymane")}>
                Zostaje w spółce
              </MiniTab>
              <MiniTab active={wyplata === "dywidenda"} onClick={() => setWyplata("dywidenda")}>
                Dywidenda
              </MiniTab>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {wyplata === "zatrzymane" ? (
                <>
                  <b className="text-emerald-600">Najkorzystniej.</b> Reszta zysku płaci tylko 9% CIT i zostaje w
                  firmie (na rozwój / rezerwę). 19% dywidendy zapłacisz dopiero, jeśli kiedyś ją wypłacisz.
                </>
              ) : (
                <>Reszta wypłacona wspólnikom - dochodzi 19% podatku od dywidendy (podwójne opodatkowanie).</>
              )}
            </p>
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        {/* Kluczowe liczby dla spółki: kieszeń + spółka + efektywny podatek */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Do prywatnej kieszeni (powołanie)" value={zl0(pay.doKieszeni)} />
          <Stat
            label={wyplata === "zatrzymane" ? "Zostaje w spółce (po CIT)" : "Wypłacona dywidenda (netto)"}
            value={zl0(wyplata === "zatrzymane" ? pay.zatrzymaneWSpolce : pay.nettoDywidenda)}
          />
          <Stat label="Efektywny podatek" value={pct1(pay.efektywna)} tone="warn" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <BigCard
            title={`JDG - 2× ${FORM_SHORT[forma]}`}
            value={zl0(s.jdgNetto)}
            sub={`efektywnie ${pct1(s.jdgEfektywna)} · wszystko w kieszeni, z ubezpieczeniem ZUS`}
            best={!spolkaLepsza}
          />
          <BigCard
            title="Sp. z o.o. - wartość po podatku"
            value={zl0(spolkaWartosc)}
            sub={
              wyplata === "zatrzymane"
                ? `${zl0(pay.doKieszeni)} w kieszeni + ${zl0(pay.zatrzymaneWSpolce)} w spółce`
                : `wszystko w kieszeni · efektywnie ${pct1(pay.efektywna)}`
            }
            best={spolkaLepsza}
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <tbody className="text-slate-500">
              <TR label="Zysk firmy (przed wypłatą zarządu)" value={zl0(zysk)} />
              <TR label={`Wynagrodzenie z powołania (2× ${zl0(pay.powolaniePerOsoba)})`} value={`−${zl0(pay.powolanieRazem)}`} />
              <TR label="PIT skala od powołania (2 os.)" value={`−${zl0(pay.pitPowolaniePerOsoba * 2)}`} />
              <TR label="Zdrowotna 9% od powołania (2 os.)" value={`−${zl0(pay.zdrowotnaPowolaniePerOsoba * 2)}`} />
              <TR label="= Do prywatnej kieszeni (powołanie netto)" value={zl0(pay.nettoPowolanieRazem)} strong />
              <TR label="Zysk po wynagrodzeniach (podstawa CIT)" value={zl0(pay.zyskPoWynagrodzeniach)} />
              <TR label={`CIT (${pct1(s.citStawka)})`} value={`−${zl0(pay.cit)}`} />
              {wyplata === "dywidenda" ? (
                <>
                  <TR label="Dywidenda (19%)" value={`−${zl0(pay.dywidendaPodatek)}`} />
                  <TR label="= Dywidenda do kieszeni (netto)" value={zl0(pay.nettoDywidenda)} strong />
                </>
              ) : (
                <TR label="= Zostaje w spółce (po CIT, bez dywidendy)" value={zl0(pay.zatrzymaneWSpolce)} strong />
              )}
              <TR label="Łączna wartość po opodatkowaniu" value={zl0(pay.wartoscPoOpodatkowaniu)} strong />
              <TR label={`JDG - do kieszeni (2× ${FORM_SHORT[forma]})`} value={zl0(s.jdgNetto)} strong />
            </tbody>
          </table>
        </div>

        <div
          className={`rounded-2xl border p-5 ${
            spolkaLepsza ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-slate-900">
            {spolkaLepsza ? (
              <>
                <span className="font-semibold text-emerald-700">Spółka wygrywa o {zl0(roznica)}/rok</span>{" "}
                (łączna wartość po podatku).
                {wyplata === "zatrzymane" && (
                  <>
                    {" "}
                    Pamiętaj: {zl0(pay.zatrzymaneWSpolce)} jest w spółce, nie na Twoim koncie - 19% dywidendy
                    zapłacisz przy ewentualnej wypłacie.
                  </>
                )}{" "}
                Dochodzi też pełna księgowość i zwykle VAT (zakładka VAT).
              </>
            ) : (
              <>
                <span className="font-semibold text-slate-900">JDG wygrywa o {zl0(-roznica)}/rok</span> - przy tej
                skali spółka się nie opłaca, zwłaszcza z kosztem VAT i księgowości. Zostań na JDG.
              </>
            )}
          </p>
        </div>

        <p className="text-xs text-slate-500">
          Strategia „powołanie do 120k/os. + reszta w spółce" daje najniższy podatek dziś: 12% od powołania i
          tylko 9% CIT od reszty, bez ZUS i bez 19% dywidendy. Minus: część pieniędzy zostaje w firmie (nie w
          prywatnej kieszeni), dochodzi pełna księgowość (~800-1500 zł/mc) i brak ubezpieczenia ZUS wspólników
          (dokupujesz prywatnie). Estoński CIT pominięto (wymaga min. 3 osób na UoP - agenci na B2B się nie
          liczą).
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
// ZAKŁADKA 5 - ZAŁOŻENIA (edytowalne stałe)
// ═══════════════════════════════════════════════════════════════════════════
function ZalozeniaTab({ c, setC }: { c: TaxConstants; setC: (c: TaxConstants) => void }) {
  const set = (k: keyof TaxConstants) => (v: number) => setC({ ...c, [k]: v });
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Wszystkie kwoty i stawki w jednym miejscu - zmiana przelicza cały kalkulator na żywo. Domyślnie:
        reguły PIT (stabilne od 2022) + szacunki ZUS/zdrowotnej na 2026. Zaktualizuj, gdy ZUS ogłosi oficjalne
        kwoty.
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="ZUS społeczny (miesięcznie)">
          <Num label="Mały ZUS / preferencyjny" value={c.zusPreferencyjnyMies} onChange={set("zusPreferencyjnyMies")} />
          <Num label="Duży ZUS (z Funduszem Pracy)" value={c.zusDuzyMies} onChange={set("zusDuzyMies")} />
        </Panel>
        <Panel title="Składka zdrowotna">
          <Num label="Skala - % od dochodu" value={c.zdrowotnaSkalaStawka * 100} onChange={(v) => set("zdrowotnaSkalaStawka")(v / 100)} />
          <Num label="Liniowy - % od dochodu" value={c.zdrowotnaLiniowyStawka * 100} onChange={(v) => set("zdrowotnaLiniowyStawka")(v / 100)} />
          <Num label="Minimalna miesięczna (skala/liniowy)" value={c.zdrowotnaMinMies} onChange={set("zdrowotnaMinMies")} />
        </Panel>
        <Panel title="Zdrowotna ryczałt (miesięcznie, wg progów)">
          <Num label={`Przychód ≤ ${zl0(c.ryczaltProg1)}`} value={c.zdrowotnaRyczalt1Mies} onChange={set("zdrowotnaRyczalt1Mies")} />
          <Num label={`≤ ${zl0(c.ryczaltProg2)}`} value={c.zdrowotnaRyczalt2Mies} onChange={set("zdrowotnaRyczalt2Mies")} />
          <Num label={`> ${zl0(c.ryczaltProg2)}`} value={c.zdrowotnaRyczalt3Mies} onChange={set("zdrowotnaRyczalt3Mies")} />
        </Panel>
        <Panel title="Stawki podatku">
          <Num label="Liniowy (%)" value={c.stawkaLiniowy * 100} onChange={(v) => set("stawkaLiniowy")(v / 100)} />
          <Num label="Ryczałt - pośrednictwo nieruchomości (%)" value={c.stawkaRyczalt * 100} onChange={(v) => set("stawkaRyczalt")(v / 100)} />
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
        className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-200 hover:text-slate-900"
      >
        Przywróć domyślne (2026)
      </button>
    </div>
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
