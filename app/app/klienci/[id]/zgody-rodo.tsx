"use client";

import { useMemo, useState, useTransition } from "react";
import { useToast } from "../../components/toast";
import { Select } from "../../components/select";
import { pole } from "../../dokumenty-wzory/klocki";
import { pobierzPdf } from "@/lib/pdf-kit";
import { generujKlauzulePdf } from "@/lib/rodo-pdf";
import {
  RODZAJE_ZGOD,
  ZRODLA_ZGODY,
  stanZgod,
  type DaneAdministratora,
  type RodzajZgody,
  type WpisZgody,
} from "@/lib/rodo-model";
import { zapiszZgode } from "../rodo-actions";

function data(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Warsaw" });
}

export function ZgodyRodo({
  clientId,
  clientName,
  poczatkowe,
  ludzie,
  administrator,
  stopka,
}: {
  clientId: string;
  clientName: string;
  poczatkowe: WpisZgody[];
  ludzie: { id: string; name: string }[];
  administrator: DaneAdministratora;
  stopka: string;
}) {
  const toast = useToast();
  const [wpisy, setWpisy] = useState<WpisZgody[]>(poczatkowe);
  const [zmiana, setZmiana] = useState<{ rodzaj: RodzajZgody; udzielona: boolean } | null>(null);
  const [zrodlo, setZrodlo] = useState("ustnie");
  const [notatka, setNotatka] = useState("");
  const [historia, setHistoria] = useState(false);
  const [pdf, setPdf] = useState(false);
  const [pending, startTransition] = useTransition();
  const stan = useMemo(() => stanZgod(wpisy), [wpisy]);
  const imie = useMemo(() => new Map(ludzie.map((l) => [l.id, l.name])), [ludzie]);

  function potwierdz() {
    if (!zmiana) return;
    startTransition(async () => {
      const w = await zapiszZgode(clientId, zmiana.rodzaj, zmiana.udzielona, zrodlo, notatka);
      if (!w.ok) return toast(w.error, "error");
      setWpisy(w.wpisy);
      setZmiana(null);
      setNotatka("");
      toast("Zapisano w rejestrze zgód.");
    });
  }

  async function klauzula() {
    setPdf(true);
    try {
      const bytes = await generujKlauzulePdf(administrator, { imie: clientName }, stopka);
      pobierzPdf(bytes, `Klauzula RODO - ${clientName}`.replace(/[\\/:*?"<>|]/g, "-"));
      if (!stan.obowiazek_informacyjny?.granted) {
        setZmiana({ rodzaj: "obowiazek_informacyjny", udzielona: true });
        setZrodlo("formularz");
      }
    } catch {
      toast("Nie udało się przygotować PDF.", "error");
    } finally {
      setPdf(false);
    }
  }

  const brakDanych = !administrator.nazwa || !administrator.adres;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="max-w-xl">
          <h2 className="font-semibold text-slate-900">Klauzula informacyjna i formularz zgód</h2>
          <p className="mt-1 text-sm text-slate-500">
            Jedna kartka z danymi Twojego biura: informacja z art. 13 RODO i zgody do zaznaczenia przez klienta.
            Po wydruku zaznacz w rejestrze, że klauzula została przekazana.
          </p>
          {brakDanych && (
            <p className="mt-2 text-sm text-amber-700">Uzupełnij nazwę i adres biura w Ustawieniach firmy, żeby klauzula była kompletna.</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void klauzula()}
          disabled={pdf}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {pdf ? "Przygotowuję…" : "Pobierz PDF do podpisu"}
        </button>
      </div>

      <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {RODZAJE_ZGOD.map((r) => {
          const w = stan[r.value];
          const tak = w?.granted === true;
          return (
            <li key={r.value} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0 max-w-xl">
                <p className="font-medium text-slate-900">{r.nazwa}</p>
                <p className="mt-0.5 text-sm text-slate-500">{r.opis}</p>
                <p className="mt-1.5 text-xs text-slate-400">
                  {w
                    ? `${tak ? (r.value === "obowiazek_informacyjny" ? "Przekazana" : "Udzielona") : "Wycofana"} ${data(w.recorded_at)} · ${ZRODLA_ZGODY.find((z) => z.value === w.source)?.nazwa ?? w.source}${w.recorded_by ? ` · wpis: ${imie.get(w.recorded_by) ?? "osoba z zespołu"}` : ""}`
                    : "Brak wpisu"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={tak}
                aria-label={r.nazwa}
                onClick={() => {
                  setZmiana({ rodzaj: r.value, udzielona: !tak });
                  setZrodlo(r.value === "obowiazek_informacyjny" ? "formularz" : "ustnie");
                }}
                className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${tak ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${tak ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </li>
          );
        })}
      </ul>

      {zmiana && (
        <div
          ref={(el) => el?.scrollIntoView({ behavior: "smooth", block: "nearest" })}
          className="rounded-2xl border border-emerald-500/40 bg-emerald-100 p-5"
        >
          <p className="font-semibold text-slate-900">
            {zmiana.udzielona ? "Odnotuj zgodę" : "Odnotuj wycofanie"}: {RODZAJE_ZGOD.find((r) => r.value === zmiana.rodzaj)?.nazwa}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-slate-600">Skąd wiemy</label>
              <Select aria-label="Źródło" value={zrodlo} onChange={(e) => setZrodlo(e.target.value)} options={ZRODLA_ZGODY.map((z) => ({ value: z.value, label: z.nazwa }))} placeholder="" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-600">Notatka (opcjonalnie)</label>
              <input value={notatka} onChange={(e) => setNotatka(e.target.value)} maxLength={300} placeholder="Np. podpisany formularz w teczce" className={pole} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={potwierdz} disabled={pending} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60">
              {pending ? "Zapisuję…" : "Zapisz w rejestrze"}
            </button>
            <button type="button" onClick={() => setZmiana(null)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white">
              Anuluj
            </button>
          </div>
        </div>
      )}

      {wpisy.length > 0 && (
        <div>
          <button type="button" onClick={() => setHistoria((v) => !v)} className="text-sm font-medium text-emerald-700 hover:underline">
            {historia ? "Ukryj historię zmian" : `Pokaż historię zmian (${wpisy.length})`}
          </button>
          {historia && (
            <ol className="mt-3 space-y-2 border-l-2 border-slate-200 pl-4">
              {[...wpisy].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)).map((w) => (
                <li key={w.id} className="text-sm">
                  <span className={`font-medium ${w.granted ? "text-emerald-700" : "text-red-600"}`}>
                    {w.granted ? "+" : "−"} {RODZAJE_ZGOD.find((r) => r.value === w.kind)?.nazwa}
                  </span>
                  <span className="text-slate-500">
                    {" "}· {data(w.recorded_at)} · {ZRODLA_ZGODY.find((z) => z.value === w.source)?.nazwa}
                    {w.recorded_by ? ` · ${imie.get(w.recorded_by) ?? ""}` : ""}
                    {w.note ? ` · ${w.note}` : ""}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
