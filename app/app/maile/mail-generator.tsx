"use client";

import { useMemo, useState } from "react";

type Cat = "wlasciciel" | "kupujacy" | "negocjacje" | "formalnosci" | "relacja" | "inne";

const CAT: Record<Cat, { label: string; dot: string; sel: string }> = {
  wlasciciel: { label: "Właściciel / sprzedaż", dot: "bg-emerald-400", sel: "border-emerald-500/60 bg-emerald-50" },
  kupujacy: { label: "Kupujący", dot: "bg-sky-400", sel: "border-sky-500/60 bg-sky-500/10" },
  negocjacje: { label: "Negocjacje", dot: "bg-amber-400", sel: "border-amber-500/60 bg-amber-500/10" },
  formalnosci: { label: "Transakcja / formalności", dot: "bg-violet-400", sel: "border-violet-500/60 bg-violet-500/10" },
  relacja: { label: "Relacja", dot: "bg-rose-400", sel: "border-rose-500/60 bg-rose-500/10" },
  inne: { label: "Inne", dot: "bg-slate-300", sel: "border-slate-300 bg-slate-100" },
};
const CAT_ORDER: Cat[] = ["wlasciciel", "kupujacy", "negocjacje", "formalnosci", "relacja", "inne"];

type TypeDef = { value: string; label: string; desc: string; cat: Cat };

const EMAIL_TYPES: TypeDef[] = [
  { value: "raport", label: "Raport z działań", desc: "Podsumowanie sprzedaży/marketingu", cat: "wlasciciel" },
  { value: "podsumowanie", label: "Podsumowanie spotkania + umowa", desc: "Po spotkaniu, ze wzorem umowy", cat: "wlasciciel" },
  { value: "propozycja", label: "Propozycja współpracy", desc: "Oferta + warunki + wycena", cat: "wlasciciel" },
  { value: "niezadowolenie", label: "Niezadowolony właściciel", desc: "Spokojna, dojrzała odpowiedź + plan", cat: "wlasciciel" },
  { value: "aktualizacja", label: "Aktualizacja statusu", desc: "Gdy mało nowości, a trzeba dać znać", cat: "wlasciciel" },
  { value: "slaby_okres", label: "Trudny / słaby okres", desc: "Mało ruchu - uczciwie i z klasą", cat: "wlasciciel" },
  { value: "zapytanie", label: "Odpowiedź na zapytanie", desc: "Do kupującego pytającego o ofertę", cat: "kupujacy" },
  { value: "prezentacja_zaproszenie", label: "Zaproszenie na prezentację", desc: "Umówienie oglądania", cat: "kupujacy" },
  { value: "followup", label: "Follow-up / odświeżenie", desc: "Delikatne przypomnienie się", cat: "kupujacy" },
  { value: "oferta_cenowa", label: "Przekazanie oferty cenowej", desc: "Kupujący dał ofertę → do właściciela", cat: "negocjacje" },
  { value: "kontroferta", label: "Kontroferta", desc: "Odpowiedź na ofertę cenową", cat: "negocjacje" },
  { value: "obiekcje", label: "Obiekcje / negocjacja", desc: "Np. za wysoka prowizja", cat: "negocjacje" },
  { value: "potwierdzenie_terminu", label: "Potwierdzenie terminu", desc: "Spotkanie / umowa / notariusz", cat: "formalnosci" },
  { value: "dokumenty", label: "Prośba o dokumenty", desc: "Czego potrzebujesz od klienta", cat: "formalnosci" },
  { value: "podziekowanie", label: "Podziękowanie", desc: "Po prezentacji / transakcji", cat: "relacja" },
  { value: "ogolny", label: "Inny / własny", desc: "Dowolny mail w tonie Spectry", cat: "inne" },
];

const SMS_TYPES: TypeDef[] = [
  { value: "sms_potwierdzenie", label: "Potwierdzenie terminu", desc: "Data, godzina, adres + link do map", cat: "formalnosci" },
  { value: "sms_przypomnienie", label: "Przypomnienie o spotkaniu", desc: "Krótkie „do zobaczenia jutro”", cat: "formalnosci" },
  { value: "sms_oferta_wyslana", label: "Wysłałem ofertę na maila", desc: "Info + prośba o potwierdzenie", cat: "wlasciciel" },
  { value: "sms_followup", label: "Follow-up po prezentacji", desc: "Jak wrażenia, czy są pytania", cat: "kupujacy" },
  { value: "sms_nowa_oferta", label: "Nowa oferta dla kupującego", desc: "Pasuje do jego kryteriów", cat: "kupujacy" },
  { value: "sms_kontakt", label: "Prośba o kontakt", desc: "Proszę o oddzwonienie", cat: "relacja" },
  { value: "sms_podziekowanie", label: "Podziękowanie", desc: "Po spotkaniu / prezentacji", cat: "relacja" },
  { value: "sms_ogolny", label: "Inny SMS", desc: "Dowolny krótki SMS", cat: "inne" },
];

const PLACEHOLDERS: Record<string, string> = {
  raport:
    "Np.: 11 dni po publikacji, 320 wyświetleń na Otodom, 0 zapytań o prezentację. Uruchomiliśmy wyróżnienie oferty. Plan: reset oferty, outreach do 3 klientów z zeszłego miesiąca, kampania social.",
  podsumowanie: "Np.: piątkowe spotkanie, mieszkanie ul. Słońskiego, załączam podsumowanie i wzór umowy. Czas i prowizja do dogadania.",
  propozycja: "Np.: wyłączność 3 mies., prowizja 3% brutto, cena startowa 679 000 zł, wartość rynkowa ~533 tys. Pełna obsługa: zdjęcia, dron, kampanie, negocjacje.",
  niezadowolenie: "Np.: właściciel grozi wypowiedzeniem. Fakty: kilkanaście prezentacji, 3 oferty 680-685 tys., jego cena min. 720 tys. Plan: reset oferty, outreach, cotygodniowy raport.",
  slaby_okres:
    "Np.: 2 tyg. po publikacji, ~180 wyświetleń, brak zapytań o prezentację. Kontekst: górna półka cenowa, sezon urlopowy. Zrobione: wyróżnienie Otodom, dystrybucja MLS, mail do bazy inwestorów. Plan: reset oferty, materiał video, outreach do agentów.",
  oferta_cenowa: "Np.: kupujący złożył ofertę 685 tys. (gotówka, termin do końca września). Cena ofertowa 720 tys. Proszę o decyzję właściciela.",
  potwierdzenie_terminu:
    "Np.: umowa przedwstępna, piątek 31.07 o 19:00, notariusz ul. Kalwaryjska 62/2 Kraków, link do map: https://maps.app.goo.gl/...",
  zapytanie: "Np.: klient pyta o mieszkanie 3 pok. 64 m² Os. Piastów, cena 699 tys. Proponuję prezentację w sobotę.",
  prezentacja_zaproszenie: "Np.: dom Jawiszowice, proponuję sobotę 10:00 albo niedzielę 14:00, adres ul. Trzciniec 12.",
  dokumenty: "Np.: potrzebuję: akt własności, rzut mieszkania, świadectwo energetyczne. Proszę mailem do piątku.",
  podziekowanie: "Np.: dziękuję za dzisiejszą prezentację / za sfinalizowanie transakcji, było mi bardzo miło współpracować.",
  sms_potwierdzenie:
    "Np.: umowa przedwstępna, piątek 31.07 o 19:00, notariusz ul. Kalwaryjska 62/2 Kraków, link: https://maps.app.goo.gl/9WFWVqfv3Zu",
  sms_przypomnienie: "Np.: przypomnienie o jutrzejszej prezentacji, godz. 17:00, ul. Słomczyńskiego 8.",
  sms_oferta_wyslana: "Np.: wysłałem propozycję współpracy i wzór umowy na maila, proszę o potwierdzenie odbioru.",
};

type Result = { subject: string; body: string };

export function MailGenerator({ defaultSignature }: { defaultSignature: string }) {
  const [mode, setMode] = useState<"mail" | "sms">("mail");
  const types = mode === "mail" ? EMAIL_TYPES : SMS_TYPES;
  const [type, setType] = useState<string>("raport");

  const [recipient, setRecipient] = useState("");
  const [property, setProperty] = useState("");
  const [length, setLength] = useState("standard");
  const [facts, setFacts] = useState("");
  const [signature, setSignature] = useState(defaultSignature);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  function switchMode(m: "mail" | "sms") {
    setMode(m);
    setType(m === "mail" ? "raport" : "sms_potwierdzenie");
    setResult(null);
    setError(null);
  }

  async function generate() {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/maile/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, type, recipient, property, facts, length, signature }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Nie udało się wygenerować.");
      else setResult(data.data as Result);
    } catch {
      setError("Błąd połączenia.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Nie udało się skopiować - zaznacz i skopiuj ręcznie.");
    }
  }

  const isSms = mode === "sms";
  const accent = isSms ? "sky" : "emerald";

  return (
    <div className="space-y-6">
      {/* Przełącznik Mail / SMS */}
      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
        <ModeBtn active={!isSms} onClick={() => switchMode("mail")} color="emerald" icon="✉️" label="Maile" />
        <ModeBtn active={isSms} onClick={() => switchMode("sms")} color="sky" icon="💬" label="SMS-y" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
        {/* LEWO - formularz */}
        <div className="space-y-5">
          <TypePicker types={types} value={type} onChange={setType} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Do kogo" value={recipient} onChange={setRecipient} placeholder="Pan Marcin / Pani Kamila" />
            {!isSms && (
              <Field label="Nieruchomość / temat" value={property} onChange={setProperty} placeholder="np. ul. Słomczyńskiego" />
            )}
            {isSms && (
              <Field label="Podpis (opcjonalnie)" value={signature} onChange={setSignature} placeholder="Imię" />
            )}
          </div>

          <div>
            <label className={lbl}>
              {isSms ? "Szczegóły (godzina, adres, link…)" : "Co przekazać / fakty"}
              <span className="ml-1 text-xs text-slate-400">- AI użyje tylko tego, nie wymyśli liczb</span>
            </label>
            <textarea
              value={facts}
              onChange={(e) => setFacts(e.target.value)}
              rows={isSms ? 4 : 7}
              placeholder={PLACEHOLDERS[type] ?? "Opisz o co chodzi i jakie fakty przekazać."}
              className={inp}
            />
          </div>

          {!isSms && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Długość</label>
                <select value={length} onChange={(e) => setLength(e.target.value)} className={inp}>
                  <option value="krotki">Krótki</option>
                  <option value="standard">Standardowy</option>
                  <option value="szczegolowy">Szczegółowy</option>
                </select>
              </div>
              <Field label="Podpis" value={signature} onChange={setSignature} placeholder="Imię i nazwisko" />
            </div>
          )}

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            onClick={generate}
            disabled={loading}
            className={`w-full rounded-xl px-5 py-3 font-semibold text-white transition active:scale-[0.99] disabled:opacity-60 ${
              accent === "sky" ? "bg-sky-400 hover:bg-sky-300" : "bg-emerald-500 hover:bg-emerald-400"
            }`}
          >
            {loading ? "Piszę…" : result ? `✨ Napisz ${isSms ? "SMS" : "mail"} od nowa` : `✨ Napisz ${isSms ? "SMS" : "mail"}`}
          </button>
        </div>

        {/* PRAWO - wynik */}
        <div>
          {!result ? (
            <EmptyState isSms={isSms} />
          ) : isSms ? (
            <SmsResult text={result.body} onChange={(t) => setResult({ subject: "", body: t })} onCopy={() => copyText(result.body)} copied={copied} />
          ) : (
            <MailResult
              result={result}
              onChange={setResult}
              onCopy={() => copyText(result.body)}
              copied={copied}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- podkomponenty ---------- */

function ModeBtn({ active, onClick, color, icon, label }: { active: boolean; onClick: () => void; color: "emerald" | "sky"; icon: string; label: string }) {
  const on = color === "sky" ? "bg-sky-400 text-white" : "bg-emerald-500 text-white";
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition ${
        active ? on : "text-slate-500 hover:text-slate-900"
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

function TypePicker({ types, value, onChange }: { types: TypeDef[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-4">
      {CAT_ORDER.map((catKey) => {
        const items = types.filter((t) => t.cat === catKey);
        if (items.length === 0) return null;
        const cat = CAT[catKey];
        return (
          <div key={catKey}>
            <div className="mb-2 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${cat.dot}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{cat.label}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((t) => {
                const active = value === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => onChange(t.value)}
                    className={`rounded-xl border p-3 text-left transition ${
                      active ? cat.sel : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900">{t.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ isSms }: { isSms: boolean }) {
  const tips = isSms
    ? ["Krótko i konkretnie", "Wklej godzinę, adres, link", "Gotowe do wysłania z telefonu"]
    : ["Wybierz temat", "Wpisz fakty", "AI zachowa ton Spectry"];
  return (
    <div
      className={`flex h-full min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center ${
        isSms ? "border-sky-500/20 bg-sky-500/[0.03]" : "border-emerald-500/20 bg-emerald-500/[0.03]"
      }`}
    >
      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${isSms ? "bg-sky-100" : "bg-emerald-100"}`}>
        {isSms ? "💬" : "✉️"}
      </div>
      <p className="text-sm font-medium text-slate-900">
        Twój {isSms ? "SMS" : "mail"} pojawi się tutaj
      </p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        Wypełnij lewą stronę i kliknij „Napisz {isSms ? "SMS" : "mail"}". Wynik będzie do edycji i skopiowania.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {tips.map((t, i) => (
          <span key={i} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-500">
            {i + 1}. {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function MailResult({ result, onChange, onCopy, copied }: { result: Result; onChange: (r: Result) => void; onCopy: () => void; copied: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-50">
      <div className="flex items-center gap-2 border-b border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-3">
        <span>✉️</span>
        <span className="text-sm font-semibold text-emerald-200">Mail gotowy</span>
      </div>
      <div className="space-y-3 p-5">
        <div>
          <label className={lbl}>Temat</label>
          <input value={result.subject} onChange={(e) => onChange({ ...result, subject: e.target.value })} className={inp} />
        </div>
        <div>
          <label className={lbl}>Treść (możesz edytować)</label>
          <textarea value={result.body} onChange={(e) => onChange({ ...result, body: e.target.value })} rows={16} className={`${inp} leading-relaxed`} />
        </div>
        <button onClick={onCopy} className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400">
          {copied ? "✓ Skopiowano" : "Kopiuj treść"}
        </button>
        <p className="text-xs text-slate-400">
          Sprawdź maila przed wysłaniem - zwłaszcza liczby i miejsca w [nawiasach]. Wklej do Gmaila i wyślij.
        </p>
      </div>
    </div>
  );
}

function SmsResult({ text, onChange, onCopy, copied }: { text: string; onChange: (t: string) => void; onCopy: () => void; copied: boolean }) {
  const { count, segments } = useMemo(() => {
    const len = text.length;
    const unicode = /[^\x00-\x7F]/.test(text); // polskie znaki -> SMS po 70 znakow
    const per = unicode ? 70 : 160;
    return { count: len, segments: len === 0 ? 0 : Math.ceil(len / per) };
  }, [text]);

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-500/20 bg-slate-50">
      <div className="flex items-center gap-2 border-b border-sky-500/20 bg-sky-500/[0.06] px-5 py-3">
        <span>💬</span>
        <span className="text-sm font-semibold text-sky-200">SMS gotowy</span>
      </div>
      <div className="space-y-3 p-5">
        {/* Podgląd „dymek" */}
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-sky-500/90 px-4 py-2.5 text-sm leading-relaxed text-white">
            {text || "…"}
          </div>
        </div>
        <div>
          <label className={lbl}>Treść (możesz edytować)</label>
          <textarea value={text} onChange={(e) => onChange(e.target.value)} rows={5} className={inp} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {count} znaków · {segments} SMS{segments > 1 ? " (dłuższy = kilka wiadomości)" : ""}
          </span>
        </div>
        <button onClick={onCopy} className="w-full rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-300">
          {copied ? "✓ Skopiowano" : "Kopiuj SMS"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inp} />
    </div>
  );
}

const lbl = "mb-1.5 block text-sm text-slate-500";
const inp =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";
