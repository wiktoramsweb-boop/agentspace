"use client";

import { useState } from "react";
import { createClient } from "./actions";
import { CLIENT_TYPES, CLIENT_STATUSES } from "@/lib/types";

export function NewClientForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
      >
        + Dodaj klienta
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/80 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Nowy klient</h2>
          <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white">
            ✕
          </button>
        </div>
        <form action={createClient} className="space-y-4">
          <Field label="Imię i nazwisko" name="name" required placeholder="Jan Kowalski" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Telefon" name="phone" placeholder="+48 600 000 000" />
            <Field label="Email" name="email" type="email" placeholder="jan@email.pl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Typ" name="type" options={CLIENT_TYPES} />
            <Select label="Status" name="status" options={CLIENT_STATUSES} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Budżet (zł)" name="budget" type="number" placeholder="650000" />
            <Field label="Czego szuka / co sprzedaje" name="property" placeholder="2 pok. Krowodrza" />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              Dodaj klienta
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
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-zinc-400">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
      />
    </div>
  );
}

function Select({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-zinc-400">{label}</label>
      <select
        name={name}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
