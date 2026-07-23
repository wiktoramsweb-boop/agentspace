"use client";

import { useMemo, useState } from "react";
import { createDeal, setDealStatus, deleteDeal } from "./actions";
import type { DealStatus } from "@/lib/types";
import { formatPln } from "@/lib/format";
import { Modal } from "../components/modal";

type PropertyLite = { id: string; title: string; price_pln: number | null };

type Mode = "pln" | "pct";
type Party = { val: string; mode: Mode };

const PARTY_DEFS = [
  { key: "seller", name: "commission_seller", label: "Od sprzedającego" },
  { key: "buyer", name: "commission_buyer", label: "Od kupującego" },
  { key: "landlord", name: "commission_landlord", label: "Od wynajmującego" },
  { key: "tenant", name: "commission_tenant", label: "Od najemcy" },
] as const;

type PartyKey = (typeof PARTY_DEFS)[number]["key"];

export function NewDealButton({
  properties = [],
  defaultSplit = 50,
}: {
  properties?: PropertyLite[];
  defaultSplit?: number;
}) {
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState("");
  const [tx, setTx] = useState("");
  const [split, setSplit] = useState(String(defaultSplit));
  const [extras, setExtras] = useState("");
  const [parties, setParties] = useState<Record<PartyKey, Party>>({
    seller: { val: "", mode: "pct" },
    buyer: { val: "", mode: "pln" },
    landlord: { val: "", mode: "pln" },
    tenant: { val: "", mode: "pln" },
  });

  const txNum = parseInt(tx.replace(/\s/g, ""), 10) || 0;
  const splitNum = Math.min(100, Math.max(0, parseInt(split, 10) || 0));
  const extrasNum = parseInt(extras.replace(/\s/g, ""), 10) || 0;

  function resolve(p: Party): number {
    const v = parseFloat(p.val.replace(",", ".").replace(/\s/g, "")) || 0;
    return p.mode === "pct" ? Math.round((txNum * v) / 100) : Math.round(v);
  }

  const resolved = useMemo(() => {
    const r = {} as Record<PartyKey, number>;
    for (const d of PARTY_DEFS) r[d.key] = resolve(parties[d.key]);
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parties, txNum]);

  const officeTotal = Object.values(resolved).reduce((a, b) => a + b, 0);
  const agentBase = Math.round((officeTotal * splitNum) / 100);
  const earnings = agentBase + extrasNum;

  function setParty(key: PartyKey, patch: Partial<Party>) {
    setParties((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function onPickProperty(id: string) {
    setPropertyId(id);
    const p = properties.find((x) => x.id === id);
    if (p?.price_pln != null) setTx(String(p.price_pln));
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
      >
        + Dodaj transakcję
      </button>
    );
  }

  return (
    <Modal title="Nowa transakcja" onClose={() => setOpen(false)}>
      <form action={createDeal} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <Labeled label="Opis">
            <input
              name="title"
              required
              placeholder="Sprzedaż mieszkania ul. Zbożowa"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
            />
          </Labeled>

          {properties.length > 0 && (
            <Labeled label="Nieruchomość (opcjonalnie — podstawi cenę)">
              <select
                name="property_id"
                value={propertyId}
                onChange={(e) => onPickProperty(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">— brak —</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Labeled>
          )}

          <Labeled label="Wartość transakcji / cena (zł)">
            <input
              value={tx}
              onChange={(e) => setTx(e.target.value)}
              inputMode="numeric"
              placeholder="650000"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
            />
            <input type="hidden" name="transaction_value" value={txNum} />
          </Labeled>

          {/* Prowizje od stron */}
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">Prowizja od stron</p>
            {PARTY_DEFS.map((d) => (
              <div key={d.key} className="flex items-center gap-2">
                <span className="w-36 flex-shrink-0 text-sm text-zinc-400">{d.label}</span>
                <input
                  value={parties[d.key].val}
                  onChange={(e) => setParty(d.key, { val: e.target.value })}
                  inputMode="numeric"
                  placeholder="0"
                  className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
                <select
                  value={parties[d.key].mode}
                  onChange={(e) => setParty(d.key, { mode: e.target.value as Mode })}
                  className="flex-shrink-0 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="pln">zł</option>
                  <option value="pct">%</option>
                </select>
                <span className="w-20 flex-shrink-0 text-right text-xs text-zinc-500">
                  {parties[d.key].mode === "pct" ? formatPln(resolved[d.key]) : ""}
                </span>
                <input type="hidden" name={d.name} value={resolved[d.key]} />
              </div>
            ))}
          </div>

          {/* Split + dodatki */}
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Twój udział (%)">
              <input
                name="split"
                value={split}
                onChange={(e) => setSplit(e.target.value)}
                inputMode="numeric"
                placeholder="50"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
            </Labeled>
            <Labeled label="Dodatki (zł)">
              <input
                name="extras"
                value={extras}
                onChange={(e) => setExtras(e.target.value)}
                inputMode="numeric"
                placeholder="np. 1000"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
            </Labeled>
          </div>
          <Labeled label="Opis dodatków (np. prowizja od doradcy kredytowego)">
            <input
              name="extras_note"
              placeholder="Doradca kredytowy — Bartek"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
            />
          </Labeled>

          {/* Podsumowanie na żywo */}
          <div className="space-y-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <Row label="Prowizja łączna biura" value={formatPln(officeTotal)} />
            <Row label={`Twój udział (${splitNum}%)`} value={formatPln(agentBase)} muted />
            {extrasNum > 0 && <Row label="Dodatki (dla Ciebie)" value={formatPln(extrasNum)} muted />}
            <div className="mt-2 flex items-center justify-between border-t border-emerald-500/20 pt-2">
              <span className="font-medium text-white">Twój zarobek</span>
              <span className="text-xl font-semibold text-emerald-400">{formatPln(earnings)}</span>
            </div>
          </div>

          <Labeled label="Przewidywane zamknięcie (opcjonalnie)">
            <input
              name="expectedClose"
              type="date"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
            />
          </Labeled>
        </div>

        <div className="flex flex-shrink-0 gap-3 border-t border-zinc-800 px-6 py-4">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Dodaj transakcję
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-zinc-700 px-5 py-3 text-zinc-300 transition hover:bg-zinc-800"
          >
            Anuluj
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? "text-zinc-400" : "text-zinc-300"}>{label}</span>
      <span className={muted ? "text-zinc-300" : "font-medium text-white"}>{value}</span>
    </div>
  );
}

export function DealActions({ dealId, status }: { dealId: string; status: DealStatus }) {
  return (
    <div className="flex items-center gap-2">
      {status === "w_toku" && (
        <>
          <button
            onClick={() => setDealStatus(dealId, "zamkniety")}
            className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25"
          >
            Zamknij ✓
          </button>
          <button
            onClick={() => setDealStatus(dealId, "przepadl")}
            className="rounded-lg bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-red-500/15 hover:text-red-300"
          >
            Przepadł
          </button>
        </>
      )}
      {status !== "w_toku" && (
        <button
          onClick={() => setDealStatus(dealId, "w_toku")}
          className="rounded-lg bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800"
        >
          Wznów
        </button>
      )}
      <button
        onClick={() => deleteDeal(dealId)}
        className="text-xs text-zinc-600 transition hover:text-red-400"
        title="Usuń"
      >
        ✕
      </button>
    </div>
  );
}
