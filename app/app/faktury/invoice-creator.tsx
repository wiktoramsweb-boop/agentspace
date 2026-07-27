"use client";

import { useState, useTransition } from "react";
import { SELLERS, type InvoiceItem } from "@/lib/invoice";
import { InvoiceSheet, type SheetData } from "./invoice-sheet";
import { createInvoice, updateInvoice } from "./actions";
import { printInvoice } from "./print-button";

export function InvoiceCreator({
  initial,
  editId,
}: {
  initial: SheetData;
  editId?: string;
}) {
  const [d, setD] = useState<SheetData>(initial);
  const [buyerType, setBuyerType] = useState<"firma" | "osoba">(
    initial.buyerPesel && !initial.buyerNip ? "osoba" : "firma",
  );
  const [pending, startTransition] = useTransition();

  function set<K extends keyof SheetData>(k: K, v: SheetData[K]) {
    setD((prev) => ({ ...prev, [k]: v }));
  }
  function setItem(i: number, patch: Partial<InvoiceItem>) {
    setD((prev) => ({ ...prev, items: prev.items.map((it, n) => (n === i ? { ...it, ...patch } : it)) }));
  }
  function addItem() {
    setD((prev) => ({ ...prev, items: [...prev.items, { name: "", qty: 1, unitPrice: 0 }] }));
  }
  function removeItem(i: number) {
    setD((prev) => ({ ...prev, items: prev.items.filter((_, n) => n !== i) }));
  }

  function save() {
    startTransition(() => (editId ? updateInvoice(editId, { ...d }) : createInvoice({ ...d })));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      {/* FORMULARZ */}
      <div className="print-hide space-y-5">
        <Section title="Sprzedawca">
          <select
            value={d.sellerKey}
            onChange={(e) => set("sellerKey", e.target.value)}
            className={sel}
          >
            {SELLERS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-zinc-500">
            Konto i dane podstawią się automatycznie na fakturze.
          </p>
        </Section>

        <Section title="Nabywca">
          <div className="mb-3 flex rounded-xl border border-zinc-700/60 bg-zinc-900/60 p-1">
            <Toggle active={buyerType === "firma"} onClick={() => setBuyerType("firma")}>
              Firma
            </Toggle>
            <Toggle active={buyerType === "osoba"} onClick={() => setBuyerType("osoba")}>
              Osoba prywatna
            </Toggle>
          </div>
          <Field label="Nazwa / imię i nazwisko" value={d.buyerName} onChange={(v) => set("buyerName", v)} />
          <Field label="Ulica i numer" value={d.buyerAddress} onChange={(v) => set("buyerAddress", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kod pocztowy" value={d.buyerPostcode} onChange={(v) => set("buyerPostcode", v)} />
            <Field label="Miasto" value={d.buyerCity} onChange={(v) => set("buyerCity", v)} />
          </div>
          {buyerType === "firma" ? (
            <Field label="NIP" value={d.buyerNip} onChange={(v) => set("buyerNip", v)} />
          ) : (
            <Field label="PESEL (opcjonalnie)" value={d.buyerPesel} onChange={(v) => set("buyerPesel", v)} />
          )}
        </Section>

        <Section title="Dane faktury">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Numer faktury" value={d.number} onChange={(v) => set("number", v)} />
            <Field label="Miejsce wystawienia" value={d.place} onChange={(v) => set("place", v)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Wystawienia" type="date" value={d.issueDate} onChange={(v) => set("issueDate", v)} />
            <Field label="Sprzedaży" type="date" value={d.saleDate} onChange={(v) => set("saleDate", v)} />
            <Field label="Płatności" type="date" value={d.paymentDate} onChange={(v) => set("paymentDate", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Forma płatności" value={d.paymentMethod} onChange={(v) => set("paymentMethod", v)} />
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Zapłacono (zł)</label>
              <input
                type="number"
                value={d.paid || ""}
                onChange={(e) => set("paid", Number(e.target.value))}
                placeholder="0"
                className={inp}
              />
            </div>
          </div>
          <Field label="Osoba wystawiająca (podpis)" value={d.issuer} onChange={(v) => set("issuer", v)} />
        </Section>

        <Section title="Pozycje">
          <div className="space-y-3">
            {d.items.map((it, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                <input
                  value={it.name}
                  onChange={(e) => setItem(i, { name: e.target.value })}
                  placeholder="Nazwa usługi (np. Pośrednictwo w kupnie nieruchomości)"
                  className={`${inp} mb-2`}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={it.qty}
                    onChange={(e) => setItem(i, { qty: Number(e.target.value) })}
                    placeholder="Ilość"
                    className={`${inp} w-20`}
                  />
                  <input
                    type="number"
                    value={it.unitPrice || ""}
                    onChange={(e) => setItem(i, { unitPrice: Number(e.target.value) })}
                    placeholder="Kwota (zł)"
                    className={`${inp} flex-1`}
                  />
                  <span className="w-8 text-center text-xs text-zinc-500">zw</span>
                  {d.items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="px-1 text-zinc-600 hover:text-red-400">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addItem}
            className="mt-2 w-full rounded-xl border border-dashed border-zinc-700 py-2 text-sm text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400"
          >
            + Dodaj pozycję
          </button>
          <div className="mt-3">
            <label className="mb-1.5 block text-sm text-zinc-400">Uwagi dodatkowe (opcjonalnie)</label>
            <textarea
              value={d.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Zwolnienie z VAT (art. 113) dodaje się automatycznie."
              className={inp}
            />
          </div>
        </Section>

        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={pending}
            className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {pending ? "Zapisuję…" : editId ? "Zapisz zmiany" : "Zapisz fakturę"}
          </button>
          <button
            onClick={() => printInvoice(d.number)}
            className="rounded-xl border border-zinc-700 px-5 py-3 font-medium text-zinc-200 transition hover:bg-zinc-800"
          >
            Drukuj / PDF
          </button>
        </div>
      </div>

      {/* PODGLĄD */}
      <div className="lg:sticky lg:top-4 lg:h-fit">
        <InvoiceSheet data={d} />
      </div>
    </div>
  );
}

const inp =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none";
const sel =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-zinc-400">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inp} />
    </div>
  );
}

function Toggle({
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
