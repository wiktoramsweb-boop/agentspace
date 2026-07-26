"use client";

import { useState } from "react";
import { mortgage, purchaseCosts, rentalYield } from "@/lib/calc";
import { CalcSheet, type SheetRow } from "./calc-sheet";

type Agent = { name: string; email: string; agency: string };

const zl0 = (n: number) =>
  new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(Math.round(n)) + " zł";
const zl2 = (n: number) =>
  new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " zł";
const pct = (n: number) => n.toFixed(2).replace(".", ",") + " %";

type Tab = "kredyt" | "koszty" | "najem";

export function Calculators({ agent }: { agent: Agent }) {
  const [tab, setTab] = useState<Tab>("kredyt");

  // Kredyt
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(7.2);
  const [years, setYears] = useState(30);

  // Koszty zakupu
  const [price, setPrice] = useState(650000);
  const [rynek, setRynek] = useState<"wtorny" | "pierwotny">("wtorny");
  const [naKredyt, setNaKredyt] = useState(true);
  const [prowizjaPct, setProwizjaPct] = useState(0);

  // Najem
  const [rprice, setRprice] = useState(500000);
  const [rent, setRent] = useState(2800);
  const [rcost, setRcost] = useState(300);

  const m = mortgage(amount, rate, years);
  const c = purchaseCosts({ price, rynek, naKredyt, prowizjaPct });
  const y = rentalYield({ price: rprice, monthlyRent: rent, monthlyCost: rcost });

  let sheet: { title: string; subtitle?: string; rows: SheetRow[]; note?: string };
  if (tab === "kredyt") {
    sheet = {
      title: "Symulacja kredytu",
      subtitle: `${zl0(amount)} · ${pct(rate)} · ${years} lat`,
      rows: [
        { label: "Kwota kredytu", value: zl0(amount) },
        { label: "Oprocentowanie", value: pct(rate) },
        { label: "Okres", value: `${years} lat (${m.months} rat)` },
        { label: "Miesięczna rata", value: zl2(m.rata), strong: true },
        { label: "Suma odsetek", value: zl0(m.interest), muted: true },
        { label: "Całkowity koszt", value: zl0(m.total), muted: true },
      ],
      note: "Szacunek dla raty równej (annuitetowej). Rzeczywiste warunki zależą od banku i zdolności kredytowej.",
    };
  } else if (tab === "koszty") {
    sheet = {
      title: "Koszty zakupu",
      subtitle: `${zl0(price)} · rynek ${rynek === "wtorny" ? "wtórny" : "pierwotny"}`,
      rows: [
        { label: "Cena nieruchomości", value: zl0(price) },
        { label: `PCC (${rynek === "wtorny" ? "2%" : "0% — rynek pierwotny"})`, value: zl0(c.pcc) },
        { label: "Taksa notarialna + 23% VAT (maks.)", value: zl0(c.taksaBrutto) },
        { label: "Opłaty sądowe (KW" + (naKredyt ? " + hipoteka" : "") + ")", value: zl0(c.courtFees) },
        ...(prowizjaPct > 0 ? [{ label: `Prowizja biura (${pct(prowizjaPct)})`, value: zl0(c.prowizja) }] : []),
        { label: "Razem koszty zakupu", value: zl0(c.total), strong: true },
        { label: "Cena + koszty", value: zl0(price + c.total), muted: true },
      ],
      note: "Taksa notarialna to wartość maksymalna — u notariusza często niższa. Szacunek, nie stanowi oferty.",
    };
  } else {
    sheet = {
      title: "Rentowność najmu",
      subtitle: `${zl0(rprice)} · najem ${zl0(rent)}/mc`,
      rows: [
        { label: "Cena zakupu", value: zl0(rprice) },
        { label: "Czynsz najmu (miesięcznie)", value: zl0(rent) },
        { label: "Koszty miesięczne", value: zl0(rcost), muted: true },
        { label: "Rentowność brutto", value: pct(y.gross), strong: true },
        { label: "Rentowność netto", value: pct(y.net) },
        { label: "Roczny dochód netto", value: zl0(y.annualNet), muted: true },
        {
          label: "Zwrot inwestycji",
          value: y.paybackYears > 0 ? `~${y.paybackYears.toFixed(1).replace(".", ",")} lat` : "—",
          muted: true,
        },
      ],
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_1fr]">
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
                <label className={lbl}>Rynek</label>
                <div className="flex rounded-xl border border-zinc-700/60 bg-zinc-950 p-1">
                  <TabBtn active={rynek === "wtorny"} onClick={() => setRynek("wtorny")}>Wtórny (PCC 2%)</TabBtn>
                  <TabBtn active={rynek === "pierwotny"} onClick={() => setRynek("pierwotny")}>Pierwotny</TabBtn>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={naKredyt} onChange={(e) => setNaKredyt(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
                Zakup na kredyt (wpis hipoteki)
              </label>
              <Num label="Prowizja biura (%) — opcjonalnie" value={prowizjaPct} onChange={setProwizjaPct} step={0.5} />
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
        <CalcSheet title={sheet.title} subtitle={sheet.subtitle} rows={sheet.rows} note={sheet.note} agent={agent} />
      </div>
    </div>
  );
}

const lbl = "mb-1.5 block text-sm text-zinc-400";
const inp =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none";

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

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
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
