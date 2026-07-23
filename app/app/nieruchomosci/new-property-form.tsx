"use client";

import { useState } from "react";
import { createProperty } from "./actions";
import { AddressInput } from "../components/address-input";
import { Modal } from "../components/modal";
import {
  PROPERTY_DEAL_KINDS,
  PROPERTY_TYPES,
  PROPERTY_STATUSES,
} from "@/lib/types";

type ClientLite = { id: string; name: string };

export function NewPropertyForm({ clients }: { clients: ClientLite[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
      >
        + Dodaj nieruchomość
      </button>
    );
  }

  return (
    <Modal title="Nowa nieruchomość" onClose={() => setOpen(false)}>
      <form action={createProperty} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <Field
            label="Nazwa oferty"
            name="title"
            required
            placeholder="2-pok Krowodrza, 48 m²"
          />
          <div className="grid grid-cols-3 gap-3">
            <Select label="Rodzaj" name="deal_kind" options={PROPERTY_DEAL_KINDS} />
            <Select label="Typ" name="property_type" options={PROPERTY_TYPES} />
            <Select label="Status" name="status" options={PROPERTY_STATUSES} />
          </div>

          <AddressInput label="Adres (podpowiada się)" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cena (zł)" name="price" type="number" placeholder="650000" />
            <Field label="Powierzchnia (m²)" name="area" type="number" placeholder="48" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pokoje" name="rooms" type="number" placeholder="2" />
            <Field label="Piętro" name="floor" type="number" placeholder="3" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">
              Właściciel <span className="text-zinc-600">(klient sprzedający/wynajmujący)</span>
            </label>
            <select
              name="owner_client_id"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">— brak / dodaj później —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">
              Opis <span className="text-zinc-600">(opcjonalnie)</span>
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Rozkładowe, po remoncie, balkon, blisko tramwaju..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>

        </div>

        <div className="flex flex-shrink-0 gap-3 border-t border-zinc-800 px-6 py-4">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Dodaj nieruchomość
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
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
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
