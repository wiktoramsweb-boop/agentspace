"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";
import { CLIENT_STATUSES, CLIENT_TYPES, type ClientStatus, type ClientType } from "@/lib/types";
import { createQuickEntry, type QuickEntryPayload } from "./actions";
import { Select } from "@/app/app/components/select";
import { PoleDaty } from "@/app/app/components/pole-daty";

type Rozpoznane = Omit<QuickEntryPayload, "existingId"> & { existing: { id: string; name: string; by: "telefon" | "nazwisko" } | null };

const PRZYKLADY = [
  "Spotkanie pozyskowe na Prądnickiej 34 mieszkania 12, pani Anna Kowalska, 600 100 200. Mieszkanie 54 metry, 3 pokoje, chce 690 tysięcy. Umówiliśmy podpisanie umowy w czwartek o 17. Mam jej wysłać analizę cen z okolicy.",
  "Dzwonił pan Tomasz Zieliński, szuka dwóch pokoi na Ruczaju do 600 tysięcy, kredyt ma już wstępnie przyznany. Prezentacja w sobotę o 11 na Kobierzyńskiej.",
  "Rozmawiałem z Marcinem Dąbskim, chce obniżyć cenę o 20 tysięcy po ostatnich prezentacjach. Odezwać się do niego w poniedziałek.",
];

const lbl = "mb-1.5 block text-xs font-medium text-slate-500";
const inp = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      {type === "date" ? <PoleDaty value={value} onChange={(e) => onChange(e.target.value)} /> : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inp} />}
    </div>
  );
}

const liczbaNaTekst = (n: number | null) => (n ? String(n) : "");
const tekstNaLiczbe = (s: string) => {
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

function Karta({ tytul, children, akcja }: { tytul: string; children: React.ReactNode; akcja?: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-900">{tytul}</h3>
        {akcja}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function QuickEntry() {
  const [transcript, setTranscript] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Rozpoznane | null>(null);
  const [nowy, setNowy] = useState(false);
  const [wynik, setWynik] = useState<{ clientId: string; podsumowanie: string[] } | null>(null);
  const [pending, startTransition] = useTransition();

  const { supported, listening, error: voiceError, toggle } = useSpeechRecognition((text, isFinal) => {
    if (isFinal) setTranscript((prev) => (prev ? prev.trim() + " " : "") + text.trim());
  });

  async function przetworz() {
    if (!transcript.trim()) return;
    if (listening) toggle();
    setParsing(true);
    setError(null);
    try {
      const res = await fetch("/api/quick-entry/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transcript }) });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Nie udało się przetworzyć.");
      else {
        setForm(data.data as Rozpoznane);
        setNowy(false);
      }
    } catch {
      setError("Błąd połączenia.");
    } finally {
      setParsing(false);
    }
  }

  function set<K extends keyof Rozpoznane>(k: K, v: Rozpoznane[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  function zapisz() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const { existing, ...reszta } = form;
      const r = await createQuickEntry({ ...reszta, existingId: existing && !nowy ? existing.id : null });
      if (r.ok) setWynik({ clientId: r.clientId, podsumowanie: r.podsumowanie });
      else setError(r.blad);
    });
  }

  function odNowa() {
    setForm(null);
    setWynik(null);
    setTranscript("");
    setError(null);
  }

  /* ───── Krok 3: zapisane ───── */
  if (wynik) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white">✓</span>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Zapisane w CRM</h2>
        <ul className="mx-auto mt-4 max-w-md space-y-2 text-left">
          {wynik.podsumowanie.map((p) => (
            <li key={p} className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
              <span className="mt-0.5 text-emerald-600">✓</span>
              {p}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/app/klienci/${wynik.clientId}`} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500">
            Otwórz kartę klienta →
          </Link>
          <button type="button" onClick={odNowa} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Nowy wpis
          </button>
        </div>
      </div>
    );
  }

  /* ───── Krok 2: sprawdzenie ───── */
  if (form) {
    const sprzedajacy = form.clientType === "sprzedajacy" || form.clientType === "wynajmujacy";
    return (
      <div className="space-y-5 pb-24">
        {form.existing && (
          <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${nowy ? "border-slate-200 bg-white text-slate-600" : "border-sky-200 bg-sky-50 text-sky-900"}`}>
            <span>
              {nowy ? (
                <>Zapiszę jako nowego klienta.</>
              ) : (
                <>
                  <b>{form.existing.name}</b> już jest w Twojej bazie (zgadza się {form.existing.by === "telefon" ? "telefon" : "imię i nazwisko"}). Dopiszę notatkę, spotkanie i zadania do tej karty i uzupełnię tylko puste pola.
                </>
              )}
            </span>
            <button type="button" onClick={() => setNowy((v) => !v)} className="rounded-lg border border-current/20 px-3 py-1.5 text-xs font-semibold">
              {nowy ? "Jednak dopisz do istniejącego" : "To inna osoba, zapisz jako nowego"}
            </button>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <Karta tytul="Klient">
              <Field label="Imię i nazwisko" value={form.clientName} onChange={(v) => set("clientName", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefon" value={form.phone} onChange={(v) => set("phone", v)} placeholder="opcjonalnie" />
                <Field label="E-mail" value={form.email} onChange={(v) => set("email", v)} placeholder="opcjonalnie" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Kto to jest</label>
                  <Select value={form.clientType} onChange={(e) => set("clientType", e.target.value as ClientType)}>
                    {CLIENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className={lbl}>Etap</label>
                  <Select value={form.clientStatus} onChange={(e) => set("clientStatus", e.target.value as ClientStatus)}>
                    {CLIENT_STATUSES.filter((s) => s.value !== "zamkniety" && s.value !== "stracony").map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              {!sprzedajacy && <Field label="Budżet (zł)" value={liczbaNaTekst(form.budget)} onChange={(v) => set("budget", tekstNaLiczbe(v))} placeholder="opcjonalnie" />}
              <Field label="Następny kontakt" type="date" value={form.nextContact} onChange={(v) => set("nextContact", v)} />
            </Karta>

            <Karta
              tytul="Nieruchomość"
              akcja={
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
                  <input type="checkbox" checked={form.createProperty} onChange={(e) => set("createProperty", e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                  dodaj do bazy ofert
                </label>
              }
            >
              <div className="grid grid-cols-[2fr_1fr] gap-3">
                <Field label="Adres" value={form.address} onChange={(v) => set("address", v)} placeholder="ul. Prądnicka 34/12" />
                <Field label="Miasto" value={form.city} onChange={(v) => set("city", v)} />
              </div>
              {form.createProperty && (
                <>
                  <Field label="Nazwa oferty" value={form.propertyTitle} onChange={(v) => set("propertyTitle", v)} />
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Metraż" value={liczbaNaTekst(form.propertyArea)} onChange={(v) => set("propertyArea", tekstNaLiczbe(v))} />
                    <Field label="Pokoje" value={liczbaNaTekst(form.propertyRooms)} onChange={(v) => set("propertyRooms", tekstNaLiczbe(v))} />
                    <Field label="Cena (zł)" value={liczbaNaTekst(form.propertyPrice)} onChange={(v) => set("propertyPrice", tekstNaLiczbe(v))} />
                  </div>
                  <div className="flex gap-2">
                    {(["sprzedaz", "wynajem"] as const).map((d) => (
                      <button key={d} type="button" onClick={() => set("dealKind", d)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${form.dealKind === d ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {d === "sprzedaz" ? "Sprzedaż" : "Wynajem"}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </Karta>
          </div>

          <div className="space-y-5">
            <Karta
              tytul="Spotkanie w kalendarzu"
              akcja={
                form.meeting ? (
                  <button type="button" onClick={() => set("meeting", null)} className="text-xs font-medium text-slate-500 hover:text-rose-600">
                    usuń
                  </button>
                ) : (
                  <button type="button" onClick={() => set("meeting", { date: "", time: "", subject: "Spotkanie" })} className="text-xs font-semibold text-emerald-700">
                    + dodaj
                  </button>
                )
              }
            >
              {form.meeting ? (
                <>
                  <Field label="Temat" value={form.meeting.subject} onChange={(v) => set("meeting", { ...form.meeting!, subject: v })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Dzień" type="date" value={form.meeting.date} onChange={(v) => set("meeting", { ...form.meeting!, date: v })} />
                    <Field label="Godzina" type="time" value={form.meeting.time} onChange={(v) => set("meeting", { ...form.meeting!, time: v })} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">W relacji nie padł termin spotkania.</p>
              )}
            </Karta>

            <Karta
              tytul="Zadania"
              akcja={
                <button type="button" onClick={() => set("tasks", [...form.tasks, { tytul: "", termin: "" }])} className="text-xs font-semibold text-emerald-700">
                  + dodaj
                </button>
              }
            >
              {form.tasks.length === 0 && <p className="text-sm text-slate-400">Brak zadań z tej rozmowy.</p>}
              {form.tasks.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={t.tytul} onChange={(e) => set("tasks", form.tasks.map((x, j) => (j === i ? { ...x, tytul: e.target.value } : x)))} placeholder="Co zrobić" className={`${inp} flex-1`} />
                  <PoleDaty value={t.termin} onChange={(e) => set("tasks", form.tasks.map((x, j) => (j === i ? { ...x, termin: e.target.value } : x)))} />
                  <button type="button" onClick={() => set("tasks", form.tasks.filter((_, j) => j !== i))} className="rounded-lg px-2 py-2 text-slate-400 hover:text-rose-600" aria-label="Usuń zadanie">
                    ✕
                  </button>
                </div>
              ))}
            </Karta>

            <Karta tytul="Notatka">
              <textarea value={form.note} onChange={(e) => set("note", e.target.value)} rows={6} className={inp} />
            </Karta>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:sticky md:bottom-4 md:rounded-2xl md:border">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
            {error && <p className="w-full text-sm text-rose-600">{error}</p>}
            <button type="button" onClick={zapisz} disabled={pending || !form.clientName.trim()} className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60 md:flex-none">
              {pending ? "Zapisuję…" : form.existing && !nowy ? "Dopisz do klienta" : "Zapisz do CRM"}
            </button>
            <button type="button" onClick={() => setForm(null)} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Wróć do relacji
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ───── Krok 1: relacja ───── */
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col items-center gap-3 py-4">
            <button
              type="button"
              onClick={toggle}
              disabled={!supported}
              aria-label={listening ? "Zakończ nagrywanie" : "Zacznij mówić"}
              className={`relative flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition disabled:opacity-40 ${listening ? "bg-rose-500 text-white shadow-rose-500/30" : "bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-500"}`}
            >
              {listening && <span className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-40" />}
              <svg className="relative h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm5 9a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
              </svg>
            </button>
            <p className="text-sm font-medium text-slate-600">{listening ? "Słucham… mów naturalnie. Kliknij, żeby zakończyć." : "Kliknij i opowiedz, co się wydarzyło"}</p>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={7}
            placeholder="Albo wpisz relację: kto, gdzie, co ustaliliście, kiedy następny krok."
            className={`${inp} text-[15px] leading-relaxed`}
          />
          {voiceError && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{voiceError}</p>}
          {!supported && (
            <p className="mt-2 text-xs text-amber-700">
              Ta przeglądarka nie ma dyktowania. Na iPhonie dotknij pola i użyj mikrofonu na klawiaturze, na komputerze otwórz Chrome.
            </p>
          )}
          {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <button
            type="button"
            onClick={przetworz}
            disabled={parsing || transcript.trim().length < 8}
            className="mt-4 w-full rounded-xl bg-emerald-600 px-5 py-3.5 font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {parsing ? "Rozpoznaję…" : "Rozpoznaj i pokaż, co zapiszę →"}
          </button>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl bg-slate-900 p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Uzupełni się samo</p>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["Klient", "imię, telefon, e-mail, budżet i etap w lejku"],
              ["Nieruchomość", "adres, metraż, pokoje i cena właściciela"],
              ["Kalendarz", "„w czwartek o 17” staje się spotkaniem z datą"],
              ["Zadania", "„mam wysłać analizę” trafia do Twoich zadań"],
              ["Notatka", "w historii klienta, uporządkowana"],
            ].map(([a, b]) => (
              <li key={a} className="flex gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-[11px] font-bold">✓</span>
                <span>
                  <b>{a}:</b> <span className="text-slate-300">{b}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-400">Jeśli klient już jest w bazie, dopiszemy do jego karty zamiast tworzyć drugą. Przed zapisem wszystko sprawdzisz.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-900">Przykłady, kliknij, żeby wstawić</p>
          <div className="mt-3 space-y-2">
            {PRZYKLADY.map((p) => (
              <button key={p} type="button" onClick={() => setTranscript(p)} className="block w-full rounded-xl bg-slate-50 px-3 py-2.5 text-left text-xs leading-relaxed text-slate-600 transition hover:bg-emerald-50 hover:text-slate-900">
                „{p}”
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
