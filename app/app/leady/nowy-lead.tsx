"use client";

import { useState } from "react";
import { Modal } from "../components/modal";
import { Select } from "../components/select";
import { SubmitButton } from "../components/submit-button";
import { LEAD_SOURCES } from "@/lib/types";
import { dodajLeadRecznie } from "./actions";

const pole =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";

/** Ręczne dodanie leada: po telefonie, po spotkaniu, z polecenia. */
export function NowyLead({ agenci }: { agenci: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
      >
        + Dodaj leada
      </button>
    );
  }

  return (
    <Modal title="Nowy lead" onClose={() => setOpen(false)} maxWidth="max-w-xl">
      <form
        action={async (fd) => {
          setBlad(null);
          const res = await dodajLeadRecznie(fd);
          if (!res.ok) setBlad(res.error);
          else setOpen(false);
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          <p className="text-sm text-slate-500">
            Wystarczy telefon albo e-mail. Resztę uzupełnisz po rozmowie.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Pole label="Imię i nazwisko" name="name" placeholder="imię i nazwisko" />
            <Pole label="Telefon" name="phone" placeholder="600 100 200" />
            <Pole label="E-mail" name="email" type="email" placeholder="adres@example.com" />
            <Pole label="Miasto" name="city" placeholder="Kraków" />
            <div className="sm:col-span-2">
              <Pole label="Adres nieruchomości" name="address" placeholder="ul. Piastów 69/24" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-500">Czego dotyczy</label>
            <textarea
              name="message"
              rows={3}
              placeholder="Np. chce wycenić mieszkanie po babci, na razie się rozgląda."
              className={pole}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-slate-500">Skąd przyszedł</label>
              <Select aria-label="Skąd przyszedł" name="source" options={LEAD_SOURCES} defaultValue="reczny" placeholder="" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-500">Opiekun</label>
              <Select
                aria-label="Opiekun"
                name="agent_id"
                options={agenci.map((a) => ({ value: a.id, label: a.name }))}
                placeholder="ja"
              />
            </div>
          </div>

          {blad && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{blad}</p>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            Anuluj
          </button>
          <SubmitButton
            pendingText="Zapisuję…"
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Dodaj leada
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

function Pole({
  label, name, placeholder, type = "text",
}: {
  label: string; name: string; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-slate-500">{label}</label>
      <input name={name} type={type} placeholder={placeholder} className={pole} />
    </div>
  );
}
