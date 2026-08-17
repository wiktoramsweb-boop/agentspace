"use client";

import { useState } from "react";
import { buildReservation, type Party, type ReservationData, type ResMode, type PropType, type DepositType, type DocType } from "@/lib/reservation";
import { generateReservationPdf } from "@/lib/reservation-pdf";

const PROP_OPTIONS: { value: PropType; label: string }[] = [
  { value: "mieszkanie", label: "Mieszkanie" },
  { value: "dom", label: "Dom" },
  { value: "dzialka", label: "Działka" },
  { value: "lokal", label: "Lokal użytkowy" },
  { value: "inne", label: "Inne" },
];

const emptyParty = (): Party => ({ name: "", pesel: "", docType: "dowod", docNumber: "", address: "" });

export function ReservationCreator({ city }: { city: string }) {
  const [d, setD] = useState<ReservationData>({
    city,
    date: new Date().toISOString().slice(0, 10),
    mode: "sprzedaz",
    propType: "mieszkanie",
    propAddress: "",
    propDetails: "",
    owners: [emptyParty()],
    buyers: [emptyParty()],
    depositType: "zadatek",
    fee: 0,
    account: "",
    payDays: 2,
    price: 0,
    deadline: "",
    rentType: "okazjonalny",
    rentMonths: 12,
    targetForm: "sprzedaz",
    notaryCost: "kupujacy",
    customClauses: [],
  });

  const [preview, setPreview] = useState(false);

  // Stan boxa AI do dopisywania zapisów.
  const [aiReq, setAiReq] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  function set<K extends keyof ReservationData>(k: K, v: ReservationData[K]) {
    setD((p) => ({ ...p, [k]: v }));
  }

  async function addClause() {
    const req = aiReq.trim();
    if (!req) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/rezerwacja/klauzula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: req, mode: d.mode, depositType: d.depositType }),
      });
      const data = await res.json();
      if (!res.ok) setAiError(data.error ?? "Nie udało się.");
      else {
        const clause = (data.data?.clause ?? "").trim();
        if (clause) {
          setD((p) => ({ ...p, customClauses: [...p.customClauses, clause] }));
          setAiReq("");
        }
      }
    } catch {
      setAiError("Błąd połączenia.");
    } finally {
      setAiLoading(false);
    }
  }
  function removeClause(i: number) {
    setD((p) => ({ ...p, customClauses: p.customClauses.filter((_, n) => n !== i) }));
  }
  function editClause(i: number, v: string) {
    setD((p) => ({ ...p, customClauses: p.customClauses.map((c, n) => (n === i ? v : c)) }));
  }
  function setParty(side: "owners" | "buyers", i: number, patch: Partial<Party>) {
    setD((p) => ({ ...p, [side]: p[side].map((x, n) => (n === i ? { ...x, ...patch } : x)) }));
  }
  function addParty(side: "owners" | "buyers") {
    setD((p) => ({ ...p, [side]: [...p[side], emptyParty()] }));
  }
  function removeParty(side: "owners" | "buyers", i: number) {
    setD((p) => ({ ...p, [side]: p[side].length > 1 ? p[side].filter((_, n) => n !== i) : p[side] }));
  }

  const isSale = d.mode === "sprzedaz";
  const doc = buildReservation(d);

  const [pdfLoading, setPdfLoading] = useState(false);

  async function downloadPdf() {
    setPdfLoading(true);
    try {
      const bytes = await generateReservationPdf(doc);
      const blob = new Blob([bytes.slice()], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const safe = (d.propAddress.trim() || "Spectra").replace(/[\\/:*?"<>|]/g, "-");
      const a = document.createElement("a");
      a.href = url;
      a.download = `Umowa rezerwacyjna - ${safe}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {
      console.error(e);
      alert("Nie udało się wygenerować PDF. Odśwież stronę i spróbuj ponownie.");
    } finally {
      setPdfLoading(false);
    }
  }

  const sheetEl = (
    <div className="print-sheet contract-sheet mx-auto max-w-[210mm] rounded-xl bg-white px-10 py-10 text-[13px] leading-relaxed text-zinc-900 shadow-2xl">
      <h1 className="mb-4 text-center text-lg font-bold tracking-wide">{doc.title}</h1>
      <p className="mb-2"><Rich text={doc.intro} /></p>
      <p className="mb-1.5"><Rich text={doc.ownerText} />,</p>
      <p className="mb-1.5 text-center">a</p>
      <p className="mb-1.5"><Rich text={doc.buyerText} />,</p>
      <p className="mb-3">{doc.jointly}</p>

      <p className="mb-3">
        <span className="font-semibold">Przedmiot rezerwacji: </span>
        <Rich text={doc.subjectText} />
      </p>

      {doc.sections.map((s, i) => (
        <div key={i} className="mb-3">
          <h3 className="mb-1 break-after-avoid text-center font-bold">{s.h}</h3>
          {s.items.length > 1 ? (
            <div className="space-y-1">
              {s.items.map((it, n) => (
                <p key={n}>
                  <span className="font-medium">{n + 1}. </span>
                  <Rich text={it} />
                </p>
              ))}
            </div>
          ) : (
            <p><Rich text={s.items[0]} /></p>
          )}
        </div>
      ))}

      {/* Podpisy - linia kropkowana + „Podpis …" + imię */}
      <div className="mt-10 grid grid-cols-2 gap-12 break-inside-avoid">
        <SignBlock roleGen={doc.ownerRoleGen} names={doc.ownerNames} />
        <SignBlock roleGen={doc.buyerRoleGen} names={doc.buyerNames} />
      </div>
    </div>
  );

  // Tryb podglądu (jak w kalkulatorze) - arkusz poza siatką, na całą stronę.
  // Wstrzyknięty @page{margin} daje równe marginesy na KAŻDEJ stronie (zwykły @page działa).
  if (preview) {
    return (
      <div>
        <div className="print-hide mb-4 flex items-center justify-between gap-4">
          <button
            onClick={() => setPreview(false)}
            className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
          >
            ← Wróć do edycji
          </button>
          <button
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {pdfLoading ? "Generuję PDF…" : "Pobierz PDF"}
          </button>
        </div>
        {sheetEl}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,440px)_1fr]">
      {/* FORMULARZ */}
      <div className="print-hide space-y-5">
        {/* Tryb */}
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
          <ModeBtn active={isSale} onClick={() => set("mode", "sprzedaz" as ResMode)} label="Sprzedaż" />
          <ModeBtn active={!isSale} onClick={() => set("mode", "najem" as ResMode)} label="Najem" />
        </div>

        <Section title="Nieruchomość">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Typ</label>
              <select value={d.propType} onChange={(e) => set("propType", e.target.value as PropType)} className={inp}>
                {PROP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <Field label="Miejscowość zawarcia" value={d.city} onChange={(v) => set("city", v)} />
          </div>
          <Field label="Adres nieruchomości" value={d.propAddress} onChange={(v) => set("propAddress", v)} placeholder="os. Spółdzielcze 8/40, 31-994 Kraków" />
          <Field label="Szczegóły (opcjonalnie)" value={d.propDetails} onChange={(v) => set("propDetails", v)} placeholder="nr KW, powierzchnia m²…" />
          <Field label="Data umowy" type="date" value={d.date} onChange={(v) => set("date", v)} />
        </Section>

        <PartyEditor
          title={isSale ? "Sprzedający (właściciel)" : "Wynajmujący (właściciel)"}
          parties={d.owners}
          onChange={(i, patch) => setParty("owners", i, patch)}
          onAdd={() => addParty("owners")}
          onRemove={(i) => removeParty("owners", i)}
        />
        <PartyEditor
          title={isSale ? "Kupujący (rezerwujący)" : "Najemca (rezerwujący)"}
          parties={d.buyers}
          onChange={(i, patch) => setParty("buyers", i, patch)}
          onAdd={() => addParty("buyers")}
          onRemove={(i) => removeParty("buyers", i)}
        />

        <Section title="Warunki rezerwacji">
          <div>
            <label className={lbl}>Rodzaj wpłaty</label>
            <select value={d.depositType} onChange={(e) => set("depositType", e.target.value as DepositType)} className={inp}>
              <option value="zadatek">Zadatek (bezzwrotny - art. 394 KC)</option>
              <option value="oplata">Opłata rezerwacyjna</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={d.depositType === "zadatek" ? "Kwota zadatku (zł)" : "Opłata rezerwacyjna (zł)"} type="number" value={String(d.fee || "")} onChange={(v) => set("fee", Math.max(0, parseInt(v || "0", 10)))} />
            <Field label="Termin wpłaty (dni rob.)" type="number" value={String(d.payDays)} onChange={(v) => set("payDays", Math.max(1, parseInt(v || "1", 10)))} />
          </div>
          <Field label="Nr rachunku właściciela" value={d.account} onChange={(v) => set("account", v)} placeholder="09 1240 1024 1111 0000 0260 4516" />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={isSale ? "Cena sprzedaży (zł)" : "Miesięczny czynsz (zł)"}
              type="number"
              value={String(d.price || "")}
              onChange={(v) => set("price", Math.max(0, parseInt(v || "0", 10)))}
            />
            <Field label="Umowę zawrzeć do" type="date" value={d.deadline} onChange={(v) => set("deadline", v)} />
          </div>
        </Section>

        {isSale ? (
          <Section title="Umowa sprzedaży">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Umowa docelowa</label>
                <select value={d.targetForm} onChange={(e) => set("targetForm", e.target.value as "sprzedaz" | "przedwstepna")} className={inp}>
                  <option value="sprzedaz">Umowa sprzedaży (akt not.)</option>
                  <option value="przedwstepna">Umowa przedwstępna</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Koszty notarialne</label>
                <select value={d.notaryCost} onChange={(e) => set("notaryCost", e.target.value as "kupujacy" | "strony")} className={inp}>
                  <option value="kupujacy">Kupujący</option>
                  <option value="strony">Po połowie</option>
                </select>
              </div>
            </div>
          </Section>
        ) : (
          <Section title="Umowa najmu">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Rodzaj najmu</label>
                <select value={d.rentType} onChange={(e) => set("rentType", e.target.value as "okazjonalny" | "zwykly")} className={inp}>
                  <option value="okazjonalny">Najem okazjonalny</option>
                  <option value="zwykly">Najem zwykły</option>
                </select>
              </div>
              <Field label="Okres najmu (mies.)" type="number" value={String(d.rentMonths)} onChange={(v) => set("rentMonths", Math.max(1, parseInt(v || "1", 10)))} />
            </div>
          </Section>
        )}

        <Section title="Dodatkowe zapisy (opcjonalnie)">
          <p className="text-xs text-slate-500">
            Napisz własnymi słowami, co dopisać do umowy - AI ujmie to formalnie i doda przed postanowieniami końcowymi.
          </p>
          <textarea
            value={aiReq}
            onChange={(e) => setAiReq(e.target.value)}
            rows={2}
            placeholder={'np. „kupujący pokrywa koszt świadectwa energetycznego"'}
            className={inp}
          />
          {aiError && <p className="text-xs text-red-600">{aiError}</p>}
          <button
            onClick={addClause}
            disabled={aiLoading || !aiReq.trim()}
            className="w-full rounded-lg border border-emerald-500/40 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            {aiLoading ? "Redaguję…" : "✨ Dopisz zapis przez AI"}
          </button>
          {d.customClauses.length > 0 && (
            <div className="space-y-2 pt-1">
              {d.customClauses.map((c, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Zapis {i + 1} (możesz poprawić)</span>
                    <button onClick={() => removeClause(i)} className="text-[11px] text-slate-500 transition hover:text-red-600">
                      usuń
                    </button>
                  </div>
                  <textarea value={c} onChange={(e) => editClause(i, e.target.value)} rows={3} className={`${inp} text-xs`} />
                </div>
              ))}
            </div>
          )}
        </Section>

        <button
          onClick={() => setPreview(true)}
          className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400 active:scale-[0.99]"
        >
          Podgląd i PDF dla klienta →
        </button>
        <p className="text-xs text-slate-400">
          Gotowy, prawnie kompletny wzór. Przy „Zadatek" kwota jest bezzwrotna w razie rezygnacji Kupującego/Najemcy (art. 394 KC). Przy nietypowych transakcjach warto dać wzór do wglądu prawnikowi.
        </p>
      </div>

      {/* PODGLĄD NA ŻYWO */}
      <div className="lg:sticky lg:top-4 lg:h-fit">
        <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Podgląd umowy</p>
        {sheetEl}
      </div>
    </div>
  );
}

/* ---------- podkomponenty ---------- */

/** Prosty parser pogrubień: fragmenty między **…** stają się <strong>. */
function Rich({ text }: { text: string }) {
  const parts = text.split("**");
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}

function SignBlock({ roleGen, names }: { roleGen: string; names: string[] }) {
  const real = names.filter((n) => n && !n.startsWith("…"));
  return (
    <div className="text-center">
      {/* puste miejsce na odręczny podpis */}
      <div className="h-10" />
      <div className="border-b border-dotted border-slate-300" />
      <p className="mt-2 text-sm text-zinc-800">Podpis {roleGen}</p>
      {real.length > 0 ? (
        real.map((n, i) => (
          <p key={i} className="text-sm text-zinc-800">{n}</p>
        ))
      ) : (
        <p className="text-xs text-slate-500">(imię i nazwisko)</p>
      )}
    </div>
  );
}

function ModeBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
        active ? "bg-emerald-500 text-white" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      {children}
    </div>
  );
}

function PartyEditor({
  title,
  parties,
  onChange,
  onAdd,
  onRemove,
}: {
  title: string;
  parties: Party[];
  onChange: (i: number, patch: Partial<Party>) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <button onClick={onAdd} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">+ dodaj osobę</button>
      </div>
      {parties.map((p, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          {parties.length > 1 && (
            <div className="flex justify-between">
              <span className="text-[11px] text-slate-400">Osoba {i + 1}</span>
              <button onClick={() => onRemove(i)} className="text-[11px] text-slate-500 hover:text-red-600">usuń</button>
            </div>
          )}
          <Field label="Imię i nazwisko" value={p.name} onChange={(v) => onChange(i, { name: v })} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="PESEL" value={p.pesel} onChange={(v) => onChange(i, { pesel: v })} />
            <Field label="Adres zamieszkania" value={p.address} onChange={(v) => onChange(i, { address: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Dokument</label>
              <select
                value={p.docType}
                onChange={(e) => onChange(i, { docType: e.target.value as DocType })}
                className={inp}
              >
                <option value="dowod">Dowód osobisty</option>
                <option value="paszport">Paszport</option>
              </select>
            </div>
            <Field
              label={p.docType === "paszport" ? "Nr paszportu" : "Seria i nr dowodu"}
              value={p.docNumber}
              onChange={(v) => onChange(i, { docNumber: v })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inp} />
    </div>
  );
}

const lbl = "mb-1 block text-xs text-slate-500";
const inp =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";
