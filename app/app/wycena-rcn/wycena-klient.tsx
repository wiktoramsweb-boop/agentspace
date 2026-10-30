"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { WklejLink } from "../components/wklej-link";
import { Select } from "../components/select";
import { parametryWyceny } from "@/lib/ogloszenie-mapy";
import { powiazWycene } from "./actions";

export function LinkDoWyceny({ zrodlo }: { zrodlo: string }) {
  const router = useRouter();
  const [uwaga, setUwaga] = useState<string | null>(null);
  return (
    <div className="mb-4">
      <WklejLink
        tytul="Wklej link do ogłoszenia"
        opis="Pobierzemy adres, metraż, piętro, stan i budynek. Cenę z ogłoszenia porównamy z wyceną."
        start={zrodlo}
        onDane={(d) => {
          if (d.oferta.typ && d.oferta.typ !== "mieszkanie") {
            setUwaga("Wycena z aktów działa dla mieszkań, a to ogłoszenie dotyczy innej nieruchomości.");
            return;
          }
          setUwaga(null);
          router.push(`/app/wycena-rcn?${new URLSearchParams({ podglad: "1", ...parametryWyceny(d.oferta, d.zrodlo) })}`);
        }}
      />
      {uwaga && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{uwaga}</p>}
    </div>
  );
}

/** Zapisana wycena: z jaką ofertą jest związana i skrót do dodania nowej. */
export function PowiazanieWyceny({ wycenaId, oferty, powiazana, zrodlo }: { wycenaId: string; oferty: { id: string; title: string }[]; powiazana: { id: string; title: string } | null; zrodlo: string | null }) {
  const router = useRouter();
  const [wybrana, setWybrana] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [czeka, uruchom] = useTransition();
  const zmien = (id: string | null) =>
    uruchom(async () => {
      setBlad(null);
      const r = await powiazWycene(wycenaId, id);
      if (!r.ok) setBlad(r.blad ?? "Nie udało się.");
      else router.refresh();
    });

  if (powiazana) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <p>
          Wycena jest przy ofercie:{" "}
          <Link href={`/app/nieruchomosci/${powiazana.id}`} className="font-semibold underline">
            {powiazana.title}
          </Link>
        </p>
        <button type="button" disabled={czeka} onClick={() => zmien(null)} className="text-xs font-medium hover:underline">
          Odepnij
        </button>
      </div>
    );
  }
  const nowa = new URLSearchParams({ nowa: "1", wycena: wycenaId, ...(zrodlo ? { link: zrodlo } : {}) });
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
      <p className="font-medium text-slate-700">Zapisano w wycenach. Dodać do nieruchomości?</p>
      <div className="min-w-[220px] flex-1">
        <Select value={wybrana} onChange={(e) => setWybrana(e.target.value)} placeholder="Wybierz ofertę z bazy">
          {oferty.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </Select>
      </div>
      <button type="button" disabled={!wybrana || czeka} onClick={() => zmien(wybrana)} className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-800 hover:border-emerald-400 disabled:opacity-40">
        Powiąż
      </button>
      <Link href={`/app/nieruchomosci?${nowa}`} className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-400">
        + Nowa nieruchomość z tą wyceną
      </Link>
      {blad && <p className="w-full text-xs text-rose-600">{blad}</p>}
    </div>
  );
}
