"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { addClientMessage } from "../klienci/message-actions";
import { mailtoHref, smsHref } from "@/lib/message-links";

export type ClientContact = { id: string; name: string; email: string | null; phone: string | null };

/**
 * Pasek pod gotowym mailem albo SMS-em: wybór klienta, otwarcie w poczcie
 * (lub w SMS) i zapis na karcie klienta w Korespondencji.
 */
export function SaveToClient({
  channel,
  subject,
  body,
  clients,
  presetClientId,
}: {
  channel: "mail" | "sms";
  subject: string;
  body: string;
  clients: ClientContact[];
  presetClientId?: string;
}) {
  const [clientId, setClientId] = useState(presetClientId ?? "");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const client = clients.find((c) => c.id === clientId) ?? null;
  const q = query.trim().toLowerCase();
  const matches = q
    ? clients.filter((c) => c.name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q)).slice(0, 6)
    : [];

  async function save(openApp: boolean) {
    setError(null);
    if (!client) {
      setError("Wybierz klienta, przy którym zapisać wiadomość.");
      return;
    }
    if (openApp) {
      window.location.href = channel === "sms" ? smsHref(client.phone, body) : mailtoHref(client.email, subject, body);
    }
    setBusy(true);
    const res = await addClientMessage(client.id, { channel, direction: "wyslana", subject: channel === "mail" ? subject : null, body });
    setBusy(false);
    if (!res.ok) setError(res.error);
    else setSaved(client.id);
  }

  return (
    <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wyślij i zapisz przy kliencie</p>

      {presetClientId && client ? (
        <p className="text-sm text-slate-800">
          {client.name}
          {channel === "mail" && (
            <span className="text-slate-400"> · {client.email ?? "brak e-maila, uzupełnisz w poczcie"}</span>
          )}
        </p>
      ) : client ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-800">{client.name}</span>
          <span className="truncate text-slate-400">{channel === "mail" ? client.email ?? "brak e-maila" : client.phone ?? "brak telefonu"}</span>
          <button type="button" onClick={() => { setClientId(""); setSaved(null); }} className="ml-auto text-xs text-slate-500 hover:text-slate-900">
            zmień
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Do kogo? Wpisz nazwisko klienta…"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
          />
          {matches.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              {matches.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setClientId(c.id);
                      setQuery("");
                      setSaved(null);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-800">{c.name}</span>
                    <span className="truncate text-xs text-slate-400">{c.email ?? c.phone ?? ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !body.trim()}
          onClick={() => void save(true)}
          className="rounded-xl bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {channel === "sms" ? "Otwórz SMS i zapisz" : "Otwórz w poczcie i zapisz"}
        </button>
        <button
          type="button"
          disabled={busy || !body.trim()}
          onClick={() => void save(false)}
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Tylko zapisz
        </button>
      </div>

      <AnimatePresence>
        {saved && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-emerald-700"
          >
            Zapisano w korespondencji.{" "}
            <Link href={`/app/klienci/${saved}`} className="font-medium underline">
              Otwórz kartę klienta
            </Link>
          </motion.p>
        )}
      </AnimatePresence>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
