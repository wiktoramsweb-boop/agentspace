"use client";

import { useState } from "react";
import { mortgage, purchaseCosts, rentalYield, type Rynek } from "@/lib/calc";
import { CalcSheet, type SheetRow } from "./calc-sheet";

type Agent = { name: string; email: string; agency: string };

const zl0 = (n: number) =>
  new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(Math.round(n)) + " zł";
const zl2 = (n: number) =>
  new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " zł";
const pct = (n: number) => n.toFixed(2).replace(".", ",") + " %";

type Tab = "kredyt" | "koszty" | "najem";

export function Calculators({ agent }: { agent: Agent }) {
  const [tab, setTab] = useState<Tab>("koszty");

  // Kredyt
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(7.2);
  const [years, setYears] = useState(30);

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

  const m = mortgage(amount, rate, years);
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
      ],
      emphasis: { label: "Miesięczna rata", value: zl2(m.rata) },
      note: "Szacunek dla raty równej (annuitetowej). Rzeczywiste warunki zależą od banku i zdolności kredytowej.",
    };
  } else if (tab === "koszty") {
    const pccLabel =
      rynek === "wtorny"
        ? "PCC (2%)"
        : rynek === "wtorny_bez_pcc"
          ? "PCC — zwolnienie (1. mieszkanie)"
          : "PCC — rynek pierwotny";
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
      note: "Taksa notarialna podana jako maksymalna, chyba że wpiszesz kwotę po rabacie. Szacunek — nie stanowi oferty.",
    };
  } else {
    sheet = {
      title: "Rentowność najmu",
      subtitle: `${zl0(rprice)} · najem ${zl0(rent)}/mc`,
      rows: [
        { label: "Cena zakupu", value: zl0(rprice) },
        { label: "Czynsz najmu (miesięcznie)", value: zl0(rent) },
        { label: "Koszty miesięczne", value: zl0(rcost), muted: true },
        { label: "Rentowność netto", value: pct(y.net) },
        { label: "Roczny dochód netto", value: zl0(y.annualNet), muted: true },
        {
          label: "Zwrot inwestycji",
          value: y.paybackYears > 0 ? `~${y.paybackYears.toFixed(1).replace(".", ",")} lat` : "—",
          muted: true,
        },
      ],
      emphasis: { label: "Rentowność brutto", value: pct(y.gross) },
      note: "Szacunek rentowności bez uwzględnienia podatku od najmu i pustostanów.",
    };
  }

  function print() {
    const prev = document.title;
    document.title = `${sheet.title} — Spectra`;
    window.print();
    setTimeout(() => (document.title = prev), 1000);
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
              <Num label="Kwota kredytu (zł)" value={amount} onChange={setAmount} step={10000} />
              <Num label="Oprocentowanie (%)" value={rate} onChange={setRate} step={0.1} />
              <Num label="Okres (lata)" value={years} onChange={setYears} step={1} />
            </div>
          )}

          {tab === "koszty" && (
            <div className="space-y-3">
              <Num label="Cena nieruchomości (zł)" value={price} onChange={setPrice} step={10000} />
              <div>
                <label className={lbl}>Rynek / PCC</label>
                <div className="flex flex-wrap gap-1.5">
                  <Pill active={rynek === "wtorny"} onClick={() => setRynek("wtorny")}>Wtórny (2%)</Pill>
                  <Pill active={rynek === "wtorny_bez_pcc"} onClick={() => setRynek("wtorny_bez_pcc")}>Wtórny — bez PCC</Pill>
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
                    placeholder={`maks. ${zl0(c.taksaMaksBrutto)} — zostaw puste jeśli bez rabatu`}
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
          onClick={print}
          className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          Stwórz PDF dla klienta
        </button>
      </div>

      <div className="lg:sticky lg:top-4 lg:h-fit">
        <CalcSheet
          title={sheet.title}
          subtitle={sheet.subtitle}
          rows={sheet.rows}
          emphasis={sheet.emphasis}
          savings={sheet.savings}
          note={sheet.note}
          agent={agent}
        />
      </div>
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
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
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
