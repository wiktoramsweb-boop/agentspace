"use client";

import { useState } from "react";
import { mortgage, purchaseCosts, rentalYield, type Rynek } from "@/lib/calc";
import { CalcSheet, type SheetRow } from "./calc-sheet";

type Agent = { name: string; email: string; phone?: string; agency: string };

const zl0 = (n: number) =>
  new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(Math.round(n)) + " zł";
const zl2 = (n: number) =>
  new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " zł";
const pct = (n: number) => n.toFixed(2).replace(".", ",") + " %";

type Tab = "kredyt" | "koszty" | "najem";

export function Calculators({ agent }: { agent: Agent }) {
  const [tab, setTab] = useState<Tab>("koszty");
  const [preview, setPreview] = useState(false);

  // Kredyt
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(7.2);
  const [years, setYears] = useState(30);
  const [extra, setExtra] = useState(0);

  // Koszty zakupu
  const [price, setPrice] = useState(650000);
  const [rynek, setRynek] = useState<Rynek>("wtorny");
  const [naKredyt, setNaKredyt] = useState(true);
  const [prowizjaStdPct, setProwizjaStdPct] = useState(3);
  const [prowizjaFinalPct, setProwizjaFinalPct] = useState(2);
  const [taksaInput, setTaksaInput] = useState(""); // pusto = taksa maksymalna

  // Najem
  const [rprice, setRprice] = useState(500000);
  const [rent, setRent] = useState(2800);
  const [rcost, setRcost] = useState(300);

  const m = mortgage(amount, rate, years, extra);
  const taksaFinalBrutto = taksaInput.trim() ? Number(taksaInput) : null;
  const c = purchaseCosts({ price, rynek, naKredyt, prowizjaStdPct, prowizjaFinalPct, taksaFinalBrutto });
  const y = rentalYield({ price: rprice, monthlyRent: rent, monthlyCost: rcost });

  let sheet: {
    title: string;
    subtitle?: string;
    rows: SheetRow[];
    emphasis?: { label: string; value: string };
    savings?: string;
    note?: string;
  };

  if (tab === "kredyt") {
    sheet = {
      title: "Symulacja kredytu",
      subtitle: `${zl0(amount)} · ${pct(rate)} · ${years} lat`,
      rows: [
        { label: "Kwota kredytu", value: zl0(amount) },
        { label: "Oprocentowanie", value: pct(rate) },
        { label: "Okres", value: `${years} lat (${m.months} rat)` },
        { label: "Suma odsetek", value: zl0(m.interest), muted: true },
        { label: "Całkowity koszt", value: zl0(m.total), muted: true },
        ...(extra > 0
          ? [
              { label: "Nadpłata miesięczna", value: zl0(extra) },
              {
                label: "Spłata z nadpłatą",
                value: `${m.overpayMonths} rat (${Math.floor(m.overpayMonths / 12)} lat ${m.overpayMonths % 12} mies.)`,
              },
              {
                label: "Odsetki z nadpłatą",
                value: zl0(m.overpayInterest),
                old: zl0(m.interest),
                save: zl0(m.savedInterest),
              },
              {
                label: "Krócej o",
                value: `${Math.floor(m.savedMonths / 12)} lat ${m.savedMonths % 12} mies.`,
                muted: true,
              },
            ]
          : []),
      ],
      emphasis: { label: "Miesięczna rata", value: zl2(m.rata) },
      savings:
        extra > 0 && m.savedInterest > 0
          ? `Nadpłacając ${zl0(extra)}/mc oszczędzasz ${zl0(m.savedInterest)} odsetek`
          : undefined,
      note: "Wartości szacunkowe - nie stanowią oferty. Rzeczywiste warunki zależą od banku i zdolności kredytowej.",
    };
  } else if (tab === "koszty") {
    const pccLabel =
      rynek === "wtorny"
        ? "PCC (2%)"
        : rynek === "wtorny_bez_pcc"
          ? "PCC - zwolnienie (1. mieszkanie)"
          : "PCC - rynek pierwotny";
    sheet = {
      title: "Koszty zakupu",
      subtitle: `${zl0(price)} · rynek ${rynek === "pierwotny" ? "pierwotny" : "wtórny"}`,
      rows: [
        { label: "Cena nieruchomości", value: zl0(price) },
        { label: pccLabel, value: zl0(c.pcc) },
        {
          label: "Taksa notarialna (z VAT)",
          value: zl0(c.taksaFinal),
          old: c.taksaSave > 0 ? zl0(c.taksaMaksBrutto) : undefined,
          save: c.taksaSave > 0 ? zl0(c.taksaSave) : undefined,
        },
        { label: "Opłata sądowa (wpis KW)", value: zl0(c.oplataSadowa) },
        { label: "Wniosek wieczystoksięgowy", value: zl0(c.wniosekKW) },
        ...(naKredyt ? [{ label: "Ustanowienie hipoteki", value: zl0(c.hipoteka) }] : []),
        {
          label: `Prowizja biura (${pct(prowizjaFinalPct)})`,
          value: zl0(c.prowizjaFinal),
          old: c.prowizjaSave > 0 ? zl0(c.prowizjaStd) : undefined,
          save: c.prowizjaSave > 0 ? zl0(c.prowizjaSave) : undefined,
        },
        { label: "Cena + wszystkie koszty", value: zl0(price + c.total), muted: true },
      ],
      emphasis: { label: "Razem koszty zakupu", value: zl0(c.total) },
      savings: c.totalSave > 0 ? `Kupując z nami klient oszczędza ${zl0(c.totalSave)}` : undefined,
      note: "Podane wartości są szacunkowe i nie stanowią oferty handlowej.",
    };
  } else {
    sheet = {
      title: "ROI z najmu",
      subtitle: `${zl0(rprice)} · najem ${zl0(rent)}/mc`,
      rows: [
        { label: "Cena zakupu", value: zl0(rprice) },
        { label: "Czynsz najmu (miesięcznie)", value: zl0(rent) },
        { label: "Koszty miesięczne", value: zl0(rcost), muted: true },
        { label: "ROI netto (rocznie)", value: pct(y.net) },
        { label: "Roczny dochód netto", value: zl0(y.annualNet), muted: true },
        {
          label: "Zwrot inwestycji",
          value: y.paybackYears > 0 ? `~${y.paybackYears.toFixed(1).replace(".", ",")} lat` : "-",
          muted: true,
        },
      ],
      emphasis: { label: "ROI brutto (rocznie)", value: pct(y.gross) },
      note: "Wartości szacunkowe - bez podatku od najmu i pustostanów.",
    };
  }

  function print() {
    const prev = document.title;
    document.title = `${sheet.title} - Spectra`;
    window.print();
    setTimeout(() => (document.title = prev), 1000);
  }

  const sheetEl = (
    <CalcSheet
      title={sheet.title}
      subtitle={sheet.subtitle}
      rows={sheet.rows}
      emphasis={sheet.emphasis}
      savings={sheet.savings}
      note={sheet.note}
      agent={agent}
    />
  );

  // Widok pełnoekranowego podglądu (jak faktura) - czysty druk na całą stronę A4.
  if (preview) {
    return (
      <div>
        <div className="print-hide mb-4 flex items-center justify-between gap-4">
          <button
            onClick={() => setPreview(false)}
            className="inline-flex items-center gap-1 text-sm text-zinc-400 transition hover:text-white"
          >
            ← Wróć do edycji
          </button>
          <button
            onClick={print}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Drukuj / Zapisz PDF
          </button>
        </div>
        {sheetEl}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div className="print-hide space-y-5">
        <div className="flex rounded-xl border border-zinc-700/60 bg-zinc-900/60 p-1">
          <TabBtn active={tab === "kredyt"} onClick={() => setTab("kredyt")}>Kredyt</TabBtn>
          <TabBtn active={tab === "koszty"} onClick={() => setTab("koszty")}>Koszty zakupu</TabBtn>
          <TabBtn active={tab === "najem"} onClick={() => setTab("najem")}>Najem</TabBtn>
        </div>

        <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-4">
          {tab === "kredyt" && (
            <div className="space-y-3">
              <Num label="Kwota kredytu (zł)" value={amount} onChange={setAmount} />
              <Num label="Oprocentowanie (%)" value={rate} onChange={setRate} />
              <Num label="Okres (lata)" value={years} onChange={setYears} />
              <Num label="Nadpłata miesięczna (zł) - opcjonalnie" value={extra} onChange={setExtra} />
            </div>
          )}

          {tab === "koszty" && (
            <div className="space-y-3">
              <Num label="Cena nieruchomości (zł)" value={price} onChange={setPrice} step={10000} />
              <div>
                <label className={lbl}>Rynek / PCC</label>
                <div className="flex flex-wrap gap-1.5">
                  <Pill active={rynek === "wtorny"} onClick={() => setRynek("wtorny")}>Wtórny (2%)</Pill>
                  <Pill active={rynek === "wtorny_bez_pcc"} onClick={() => setRynek("wtorny_bez_pcc")}>Wtórny - bez PCC</Pill>
                  <Pill active={rynek === "pierwotny"} onClick={() => setRynek("pierwotny")}>Pierwotny</Pill>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={naKredyt} onChange={(e) => setNaKredyt(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
                Zakup na kredyt (ustanowienie hipoteki)
              </label>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Rabaty (pokaż klientowi)</p>
                <div className="grid grid-cols-2 gap-3">
                  <Num label="Prowizja standard (%)" value={prowizjaStdPct} onChange={setProwizjaStdPct} step={0.5} />
                  <Num label="Prowizja z rabatem (%)" value={prowizjaFinalPct} onChange={setProwizjaFinalPct} step={0.5} />
                </div>
                <div className="mt-3">
                  <label className={lbl}>Taksa notarialna po rabacie (zł)</label>
                  <input
                    type="number"
                    value={taksaInput}
                    onChange={(e) => setTaksaInput(e.target.value)}
                    placeholder={`maks. ${zl0(c.taksaMaksBrutto)} - zostaw puste jeśli bez rabatu`}
                    className={inp}
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "najem" && (
            <div className="space-y-3">
              <Num label="Cena zakupu (zł)" value={rprice} onChange={setRprice} step={10000} />
              <Num label="Czynsz najmu (zł/mc)" value={rent} onChange={setRent} step={100} />
              <Num label="Koszty miesięczne (zł)" value={rcost} onChange={setRcost} step={50} />
            </div>
          )}
        </div>

        <button
          onClick={() => setPreview(true)}
          className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          Podgląd i PDF dla klienta →
        </button>
      </div>

      <div className="lg:sticky lg:top-4 lg:h-fit">{sheetEl}</div>
    </div>
  );
}

const lbl = "mb-1.5 block text-sm text-zinc-400";
const inp =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none";

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  // Tekstowe pole z obsługą przecinka (np. 2,46). Wewnętrzny stan trzyma to,
  // co wpisał użytkownik, żeby przecinek nie znikał.
  const [raw, setRaw] = useState(value ? String(value) : "");
  return (
    <div>
      <label className={lbl}>{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={(e) => {
          const v = e.target.value;
          setRaw(v);
          const n = parseFloat(v.replace(/\s/g, "").replace(",", "."));
          onChange(Number.isFinite(n) ? n : 0);
        }}
        className={inp}
      />
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
          : "border-zinc-700/60 bg-zinc-950 text-zinc-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
