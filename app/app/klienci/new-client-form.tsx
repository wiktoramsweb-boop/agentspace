"use client";

import { useState } from "react";
import { createClient } from "./actions";
import { CLIENT_TYPES, CLIENT_STATUSES } from "@/lib/types";
import { AddressInput } from "../components/address-input";
import { Modal } from "../components/modal";

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
    <Modal title="Nowy klient" onClose={() => setOpen(false)}>
      <form action={createClient} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
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

          <AddressInput label="Adres / lokalizacja (opcjonalnie)" />

          <Field
            label="Następny kontakt (przypomnienie)"
            name="next_contact_at"
            type="date"
          />

        </div>

        <div className="flex flex-shrink-0 gap-3 border-t border-zinc-800 px-6 py-4">
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
    </Modal>
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
