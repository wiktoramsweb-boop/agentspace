"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ClientMessage } from "@/lib/data-messages";
import { formatDateTimePL } from "@/lib/datetime";
import { addClientMessage, deleteClientMessage, szablonyWiadomosci, usunSzablon, wyslijMailZKarty, zapiszSzablon } from "../message-actions";
import { wypelnijSzablon, type SzablonWiadomosci } from "@/lib/szablony-wiadomosci";
import { mailtoHref, smsHref } from "@/lib/message-links";

type Channel = ClientMessage["channel"];
type Direction = ClientMessage["direction"];

/**
 * Korespondencja z klientem: oś wysłanych i otrzymanych maili i SMS-ów.
 * Odpowiada na pytanie „co my mu właściwie wysłaliśmy", zanim agent zadzwoni.
 */
export function ClientCorrespondence({
  clientId,
  clientEmail,
  clientPhone,
  initial,
  ready,
  clientName = "",
  agentName = "",
  agencyName = "",
}: {
  clientId: string;
  clientEmail: string | null;
  clientPhone: string | null;
  initial: ClientMessage[];
  ready: boolean;
  clientName?: string;
  agentName?: string;
  agencyName?: string;
}) {
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState(initial);
  const [filter, setFilter] = useState<"all" | Channel>("all");
  const [composing, setComposing] = useState(false);
  const [channel, setChannel] = useState<Channel>("mail");
  const [direction, setDirection] = useState<Direction>("wyslana");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [szablony, setSzablony] = useState<SzablonWiadomosci[] | null>(null);
  const [listaSzablonow, setListaSzablonow] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function otworzSzablony() {
    setListaSzablonow((v) => !v);
    if (!szablony) setSzablony(await szablonyWiadomosci());
  }

  function uzyj(t: SzablonWiadomosci) {
    const dane = { klient: clientName, agent: agentName, biuro: agencyName };
    setChannel(t.kanal);
    setDirection("wyslana");
    if (t.temat) setSubject(wypelnijSzablon(t.temat, dane));
    setBody(wypelnijSzablon(t.tresc, dane));
    setListaSzablonow(false);
  }

  async function zapiszJakoSzablon() {
    const nazwa = prompt("Nazwa szablonu (zobaczy go cały zespół):");
    if (!nazwa) return;
    const r = await zapiszSzablon({ kanal: channel === "sms" ? "sms" : "mail", nazwa, temat: subject, tresc: body });
    if (!r.ok) setError(r.error);
    else {
      setSzablony(await szablonyWiadomosci());
      setInfo("Szablon zapisany.");
    }
  }

  async function wyslijZAplikacji() {
    setError(null);
    setInfo(null);
    if (!subject.trim() || !body.trim()) {
      setError("Mail musi mieć temat i treść.");
      return;
    }
    setBusy(true);
    const res = await wyslijMailZKarty(clientId, subject, body);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessages((m) => [res.message, ...m]);
    setSubject("");
    setBody("");
    setComposing(false);
    setInfo(`Mail wysłany do ${clientEmail}. Odpowiedź klienta trafi do Twojej skrzynki.`);
  }

  if (!ready) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Korespondencja czeka na jeden krok</p>
        <p className="mt-1">
          Uruchom w Supabase (SQL Editor) plik{" "}
          <code className="rounded bg-amber-100 px-1">lib/SETUP-v23-dokumenty-korespondencja.sql</code>.
        </p>
      </div>
    );
  }

  async function save(openApp: boolean) {
    setError(null);
    if (!body.trim()) {
      setError("Wpisz treść wiadomości.");
      return;
    }
    // Program pocztowy otwieramy od razu, w geście kliknięcia - później przeglądarka by go zablokowała.
    if (openApp && direction === "wyslana") {
      window.location.href =
        channel === "sms" ? smsHref(clientPhone, body) : mailtoHref(clientEmail, subject, body);
    }
    setBusy(true);
    const res = await addClientMessage(clientId, {
      channel,
      direction,
      subject: channel === "mail" ? subject : null,
      body,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessages((m) => [res.message, ...m]);
    setSubject("");
    setBody("");
    setComposing(false);
  }

  async function remove(m: ClientMessage) {
    setConfirmId(null);
    setMessages((list) => list.filter((x) => x.id !== m.id));
    const res = await deleteClientMessage(m.id);
    if (!res.ok) {
      setMessages((list) => [m, ...list].sort((a, b) => b.sent_at.localeCompare(a.sent_at)));
      setError(res.error);
    }
  }

  const shown = filter === "all" ? messages : messages.filter((m) => m.channel === filter);
  const count = (c: Channel) => messages.filter((m) => m.channel === c).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", `Wszystko ${messages.length}`],
            ["mail", `Maile ${count("mail")}`],
            ["sms", `SMS ${count("sms")}`],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(v)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === v ? "btn-ink" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setComposing((c) => !c)}
          className="ml-auto rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-emerald-500/25 transition hover:bg-emerald-400"
        >
          {composing ? "Zamknij" : "+ Dodaj wiadomość"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {composing && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Segmented
                  value={channel}
                  onChange={(v) => setChannel(v as Channel)}
                  options={[
                    ["mail", "Mail"],
                    ["sms", "SMS"],
                    ["inne", "Inne"],
                  ]}
                />
                <Segmented
                  value={direction}
                  onChange={(v) => setDirection(v as Direction)}
                  options={[
                    ["wyslana", "Wysłana"],
                    ["otrzymana", "Otrzymana"],
                  ]}
                />
                <div className="relative ml-auto">
                  <button
                    type="button"
                    onClick={() => void otworzSzablony()}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400"
                  >
                    Szablony
                  </button>
                  {listaSzablonow && (
                    <div className="absolute right-0 top-full z-20 mt-1 max-h-80 w-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                      {!szablony && <p className="px-3 py-2 text-xs text-slate-400">Wczytuję…</p>}
                      {szablony?.filter((t) => channel === "inne" || t.kanal === channel).map((t) => (
                        <div key={t.id} className="flex items-center gap-1 pr-1 hover:bg-slate-100">
                          <button type="button" onClick={() => uzyj(t)} className="min-w-0 flex-1 px-3 py-2 text-left">
                            <span className="block truncate text-sm text-slate-800">{t.nazwa}</span>
                            <span className="text-[11px] uppercase tracking-wide text-slate-400">
                              {t.kanal}{t.wlasny ? " · szablon biura" : ""}
                            </span>
                          </button>
                          {t.wlasny && (
                            <button
                              type="button"
                              title="Usuń szablon"
                              onClick={async () => {
                                if (!confirm(`Usunąć szablon „${t.nazwa}"?`)) return;
                                await usunSzablon(t.id);
                                setSzablony(await szablonyWiadomosci());
                              }}
                              className="rounded-md px-1.5 text-slate-400 hover:text-red-600"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {channel === "mail" && (
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Temat"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                />
              )}
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder={
                  direction === "otrzymana"
                    ? "Wklej, co odpisał klient…"
                    : "Treść wiadomości (możesz wkleić mail z Asystenta)…"
                }
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex flex-wrap items-center justify-end gap-2">
                {body.trim() && direction === "wyslana" && (
                  <button type="button" onClick={() => void zapiszJakoSzablon()} className="mr-auto text-xs font-medium text-slate-500 hover:text-slate-800">
                    Zapisz jako szablon
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void save(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Zapisz
                </button>
                {direction === "wyslana" && channel === "sms" && (
                  <button
                    type="button"
                    disabled={busy || !clientPhone}
                    onClick={() => void save(true)}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    Zapisz i otwórz SMS
                  </button>
                )}
                {direction === "wyslana" && channel === "mail" && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void save(true)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Otwórz w mojej poczcie
                    </button>
                    <button
                      type="button"
                      disabled={busy || !clientEmail}
                      title={clientEmail ? `Wyśle na ${clientEmail}` : "Klient nie ma adresu e-mail"}
                      onClick={() => void wyslijZAplikacji()}
                      className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {busy ? "Wysyłam…" : "Wyślij teraz"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && !composing && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {info && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{info}</p>
      )}

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
          {messages.length === 0
            ? "Brak zapisanej korespondencji. Maile z Asystenta i odpowiedzi klienta zapiszesz tutaj."
            : "Brak wiadomości w tym filtrze."}
        </p>
      ) : (
        <ol className="relative space-y-3 border-l-2 border-slate-100 pl-5">
          <AnimatePresence initial={false}>
            {shown.map((m) => {
              const expanded = open.has(m.id);
              const long = m.body.length > 220 || m.body.split("\n").length > 4;
              const sent = m.direction === "wyslana";
              return (
                <motion.li
                  key={m.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  <span
                    className={`absolute -left-[31px] top-3 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${
                      sent ? "bg-emerald-500" : "bg-sky-500"
                    }`}
                    aria-hidden="true"
                  >
                    <ChannelIcon channel={m.channel} />
                  </span>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          sent ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {sent ? "↗ wysłana" : "↙ otrzymana"}
                      </span>
                      <span className="uppercase tracking-wide text-slate-400">
                        {m.channel === "mail" ? "mail" : m.channel === "sms" ? "sms" : "inne"}
                      </span>
                      {m.status === "wyslana" && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">wysłany z AgentSpace</span>
                      )}
                      {m.status === "blad" && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700" title={m.error ?? ""}>
                          nie wyszedł
                        </span>
                      )}
                      <span className="ml-auto text-slate-400">
                        {formatDateTimePL(m.sent_at)}
                        {m.authorName ? ` · ${m.authorName}` : ""}
                      </span>
                    </div>
                    {m.subject && <p className="mt-1.5 text-sm font-semibold text-slate-900">{m.subject}</p>}
                    <p
                      className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 ${
                        !expanded && long ? "line-clamp-3" : ""
                      }`}
                    >
                      {m.body}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      {long && (
                        <button
                          type="button"
                          onClick={() =>
                            setOpen((s) => {
                              const n = new Set(s);
                              if (n.has(m.id)) n.delete(m.id);
                              else n.add(m.id);
                              return n;
                            })
                          }
                          className="font-medium text-emerald-700 hover:underline"
                        >
                          {expanded ? "Zwiń" : "Rozwiń"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(m.body)}
                        className="text-slate-500 hover:text-slate-900"
                      >
                        Kopiuj
                      </button>
                      {confirmId === m.id ? (
                        <span className="ml-auto flex gap-2">
                          <button type="button" onClick={() => void remove(m)} className="font-semibold text-red-600">
                            Usuń
                          </button>
                          <button type="button" onClick={() => setConfirmId(null)} className="text-slate-500">
                            Nie
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(m.id)}
                          className="ml-auto text-slate-400 hover:text-red-600"
                        >
                          Usuń
                        </button>
                      )}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <div className="inline-flex rounded-xl bg-slate-200/70 p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
            value === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ChannelIcon({ channel }: { channel: Channel }) {
  return (
    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
      {channel === "sms" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-9 6 2-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4Z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
      )}
    </svg>
  );
}
