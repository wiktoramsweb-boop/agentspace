"use client";

import { useEffect, useRef, useState } from "react";
import {
  type TransactionCard,
  type DocStatus,
  DOC_STATUS_LABELS,
  DOC_STATUS_CYCLE,
  docsProgress,
} from "@/lib/transaction-card";
import { updateTransactionCard } from "../actions";

type Save = "idle" | "saving" | "saved" | "error";

export function TransactionCardEditor({ dealId, initial }: { dealId: string; initial: TransactionCard }) {
  const [card, setCard] = useState<TransactionCard>(initial);
  const [save, setSave] = useState<Save>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const first = useRef(true);

  // Autozapis (debounce).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSave("saving");
    const t = setTimeout(async () => {
      const res = await updateTransactionCard(dealId, card);
      if (res?.error) {
        setSave("error");
        setErrorMsg(res.error);
      } else {
        setSave("saved");
        setErrorMsg(null);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [card, dealId]);

  function set<K extends keyof TransactionCard>(k: K, v: TransactionCard[K]) {
    setCard((c) => ({ ...c, [k]: v }));
  }

  const isCash = card.profilKupujacego === "gotowka";
  const isCredit = card.profilKupujacego === "kredyt" || card.profilKupujacego === "kredyt_nasz";
  const dp = docsProgress(card);

  return (
    <div className="space-y-6">
      {/* Pasek zapisu + postęp dokumentów */}
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 backdrop-blur">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>Dokumenty załatwione</span>
            <span className="font-mono text-slate-700">{dp.done}/{dp.total} · {dp.pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${dp.pct === 100 ? "bg-emerald-400" : "bg-amber-400"}`} style={{ width: `${dp.pct}%` }} />
          </div>
        </div>
        <span className="flex-shrink-0 text-xs">
          {save === "saving" && <span className="text-slate-500">Zapisywanie…</span>}
          {save === "saved" && <span className="text-emerald-600">Zapisano ✓</span>}
          {save === "error" && <span className="text-red-600">Błąd zapisu</span>}
        </span>
      </div>
      {save === "error" && errorMsg && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700">{errorMsg}</p>}

      {/* Nagłówek */}
      <Stage title="Dane transakcji">
        <div className="grid gap-3 sm:grid-cols-2">
          <Text label="Adres nieruchomości" value={card.propertyAddress} onChange={(v) => set("propertyAddress", v)} />
          <Text label="Data rezerwacji" type="date" value={card.reservationDate} onChange={(v) => set("reservationDate", v)} />
        </div>
      </Stage>

      {/* ETAP 1 */}
      <Stage title="Etap 1 · Weryfikacja prawna i podatkowa">
        <Radio
          label="Podstawa nabycia (skąd sprzedający ma nieruchomość?)"
          value={card.podstawaNabycia}
          onChange={(v) => set("podstawaNabycia", v as TransactionCard["podstawaNabycia"])}
          options={[
            { v: "kupno", l: "Kupno (akt notarialny)" },
            { v: "spadek", l: "Spadek" },
            { v: "darowizna", l: "Darowizna" },
          ]}
        />
        {(card.podstawaNabycia === "spadek" || card.podstawaNabycia === "darowizna") && (
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
            ⚠ Wymagane zaświadczenie z Urzędu Skarbowego o uregulowaniu podatku (nawet jeśli zwolniony).
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Text label="Data nabycia / wybudowania" value={card.dataNabycia} onChange={(v) => set("dataNabycia", v)} placeholder="np. 2019 lub data" />
          <Radio
            label="Minęło 5 lat podatkowych od nabycia?"
            value={card.pit5lat}
            onChange={(v) => set("pit5lat", v as TransactionCard["pit5lat"])}
            options={[
              { v: "tak", l: "TAK - bez PIT" },
              { v: "nie", l: "NIE - 19% PIT / ulga" },
            ]}
          />
        </div>
        <Radio
          label="Hipoteka w dziale IV KW?"
          value={card.hipoteka}
          onChange={(v) => set("hipoteka", v as TransactionCard["hipoteka"])}
          options={[
            { v: "nie", l: "NIE - czysta KW" },
            { v: "tak", l: "TAK - konieczna promesa" },
          ]}
        />
      </Stage>

      {/* ETAP 2 */}
      <Stage title="Etap 2 · Profil kupującego">
        <Radio
          label="Sposób finansowania"
          value={card.profilKupujacego}
          onChange={(v) => set("profilKupujacego", v as TransactionCard["profilKupujacego"])}
          options={[
            { v: "gotowka", l: "Gotówka (ścieżka szybka)" },
            { v: "kredyt", l: "Kredyt hipoteczny" },
            { v: "kredyt_nasz", l: "Kredyt z naszym doradcą" },
          ]}
        />
      </Stage>

      {/* ETAP 3 */}
      <Stage title="Etap 3 · Organizacja transakcji">
        {!card.profilKupujacego && <p className="text-sm text-slate-500">Wybierz sposób finansowania w Etapie 2, żeby zobaczyć właściwą ścieżkę.</p>}

        {isCredit && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">Wariant kredytowy</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Text label="Termin umowy przyrzeczonej (min. 2-3 mies.)" type="date" value={card.kredytTerminPrzyrzeczonej} onChange={(v) => set("kredytTerminPrzyrzeczonej", v)} />
              <Text label="Wpłacony zadatek (PLN)" inputMode="decimal" value={card.kredytZadatek} onChange={(v) => set("kredytZadatek", v)} />
            </div>
            <Check label="Przekazano komplet dokumentów do doradcy kredytowego" checked={card.kredytDokDoradca} onChange={(v) => set("kredytDokDoradca", v)} />
            <Check label="Rzeczoznawca był na wycenie" checked={card.kredytRzeczoznawca} onChange={(v) => set("kredytRzeczoznawca", v)} />
            <Check label="Decyzja kredytowa pozytywna" checked={card.kredytDecyzja} onChange={(v) => set("kredytDecyzja", v)} />
            <Check label="Umowa kredytowa podpisana przez Kupującego" checked={card.kredytUmowaPodpisana} onChange={(v) => set("kredytUmowaPodpisana", v)} />
            <Check label="Potwierdzony termin u notariusza (akt końcowy)" checked={card.kredytNotariuszTermin} onChange={(v) => set("kredytNotariuszTermin", v)} />
          </div>
        )}

        {isCash && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Wariant gotówkowy</p>
            <Radio
              label="Umowa przedwstępna"
              value={card.gotowkaPrzedwstepna}
              onChange={(v) => set("gotowkaPrzedwstepna", v as TransactionCard["gotowkaPrzedwstepna"])}
              options={[
                { v: "podpisano", l: "Podpisano" },
                { v: "pominieto", l: "Pominięto (od razu akt końcowy)" },
              ]}
            />
            {card.gotowkaPrzedwstepna === "podpisano" && (
              <Text label="Data umowy przedwstępnej" type="date" value={card.gotowkaPrzedwstepnaData} onChange={(v) => set("gotowkaPrzedwstepnaData", v)} />
            )}
            <Radio
              label="Sposób zapłaty"
              value={card.gotowkaZaplata}
              onChange={(v) => set("gotowkaZaplata", v as TransactionCard["gotowkaZaplata"])}
              options={[
                { v: "natychmiast", l: "Przelew natychmiastowy przy akcie" },
                { v: "depozyt", l: "Depozyt notarialny" },
                { v: "zwykly", l: "Przelew zwykły" },
              ]}
            />
          </div>
        )}
      </Stage>

      {/* ETAP 4 */}
      <Stage title="Etap 4 · Umowa końcowa (koszty i opłaty)">
        <Radio
          label="Kto płaci PCC (2%)?"
          value={card.pcc}
          onChange={(v) => set("pcc", v as TransactionCard["pcc"])}
          options={[
            { v: "kupujacy", l: "Kupujący płaci (rynek wtórny)" },
            { v: "zwolniony", l: "Kupujący zwolniony (pierwsze mieszkanie)" },
          ]}
        />
        <Check label="Dowody osobiste stron są ważne (nieunieważnione, nieprzeterminowane)" checked={card.dowodyWazne} onChange={(v) => set("dowodyWazne", v)} />
      </Stage>

      {/* ETAP 5 */}
      <Stage title="Etap 5 · Po akcie notarialnym (zamknięcie)">
        <Check label="Przelew ceny wykonany (potwierdzenie u agenta)" checked={card.przelewWykonany} onChange={(v) => set("przelewWykonany", v)} />
        <Check label="Uruchomienie kredytu przez bank (jeśli kredyt)" checked={card.kredytUruchomiony} onChange={(v) => set("kredytUruchomiony", v)} />
        <Check label="Spisane stany liczników (prąd, gaz, woda, C.O.)" checked={card.liczniki} onChange={(v) => set("liczniki", v)} />
        <Check label="Przekazane klucze, piloty, karty wstępu" checked={card.klucze} onChange={(v) => set("klucze", v)} />
        <Radio
          label="Protokół zdawczo-odbiorczy podpisany?"
          value={card.protokolPodpisany}
          onChange={(v) => set("protokolPodpisany", v as TransactionCard["protokolPodpisany"])}
          options={[{ v: "tak", l: "TAK" }, { v: "nie", l: "NIE" }]}
        />
      </Stage>

      {/* DOKUMENTY */}
      <Stage title="Kompletowanie dokumentów">
        <div className="space-y-2">
          {card.documents.map((doc, i) => (
            <div key={doc.key} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{doc.label}</p>
                {doc.hint && <p className="text-xs text-slate-500">{doc.hint}</p>}
              </div>
              <button
                onClick={() => {
                  const next = DOC_STATUS_CYCLE[(DOC_STATUS_CYCLE.indexOf(doc.status) + 1) % DOC_STATUS_CYCLE.length];
                  setCard((c) => ({ ...c, documents: c.documents.map((d, n) => (n === i ? { ...d, status: next } : d)) }));
                }}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${STATUS_STYLE[doc.status]}`}
              >
                {DOC_STATUS_LABELS[doc.status]}
              </button>
              {doc.custom && (
                <button
                  onClick={() => setCard((c) => ({ ...c, documents: c.documents.filter((_, n) => n !== i) }))}
                  className="flex-shrink-0 text-slate-400 hover:text-red-600"
                  title="Usuń"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <AddDoc onAdd={(label) => setCard((c) => ({ ...c, documents: [...c.documents, { key: `custom_${Date.now()}`, label, status: "brak", custom: true }] }))} />
      </Stage>

      {/* NOTATKI */}
      <Stage title="Notatki">
        <textarea
          value={card.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={4}
          placeholder="Ustalenia, terminy, kontakty, wszystko czego trzeba pilnować…"
          className={inp}
        />
      </Stage>
    </div>
  );
}

const STATUS_STYLE: Record<DocStatus, string> = {
  brak: "bg-slate-100 text-slate-500",
  w_toku: "bg-amber-100 text-amber-700",
  gotowe: "bg-emerald-100 text-emerald-700",
  nd: "bg-slate-100 text-slate-500",
};

/* ---------- kontrolki ---------- */

function Stage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Radio({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div>
      <p className="mb-2 text-sm text-slate-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(value === o.v ? "" : o.v)}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              value === o.v ? "border-emerald-500/60 bg-emerald-50 text-slate-900" : "border-slate-300 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex w-full items-center gap-3 text-left">
      <span
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border transition ${
          checked ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white"
        }`}
      >
        {checked && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        )}
      </span>
      <span className={`text-sm ${checked ? "text-slate-900" : "text-slate-700"}`}>{label}</span>
    </button>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "decimal" | "numeric";
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inp} />
    </div>
  );
}

function AddDoc({ onAdd }: { onAdd: (label: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="mt-3 flex gap-2">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Dodaj własny dokument do pilnowania…"
        className={inp}
      />
      <button
        onClick={() => {
          const l = val.trim();
          if (l) {
            onAdd(l);
            setVal("");
          }
        }}
        className="flex-shrink-0 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
      >
        Dodaj
      </button>
    </div>
  );
}

const inp =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";
