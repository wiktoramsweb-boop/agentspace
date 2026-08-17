"use client";

import { useState } from "react";
import { updateProperty } from "../actions";
import { AddressInput } from "../../components/address-input";
import { Modal } from "../../components/modal";
import {
  PROPERTY_DEAL_KINDS,
  PROPERTY_TYPES,
  PROPERTY_STATUSES,
  type Property,
} from "@/lib/types";

type ClientLite = { id: string; name: string };

export function EditPropertyForm({
  property,
  clients,
}: {
  property: Property;
  clients: ClientLite[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-emerald-500/50 hover:text-slate-900"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.86 4.49 2.65 2.65M3 21l.53-4.06a2 2 0 0 1 .57-1.18L15.3 4.53a1.87 1.87 0 0 1 2.65 0l1.52 1.52a1.87 1.87 0 0 1 0 2.65L8.24 19.9a2 2 0 0 1-1.18.57L3 21Z" />
        </svg>
        Edytuj
      </button>
    );
  }

  return (
    <Modal title="Edytuj nieruchomość" onClose={() => setOpen(false)}>
      <form
        action={async (fd) => {
          await updateProperty(property.id, fd);
          setOpen(false);
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm text-slate-500">Nazwa oferty</label>
            <input
              name="title"
              required
              defaultValue={property.title}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select label="Rodzaj" name="deal_kind" options={PROPERTY_DEAL_KINDS} value={property.deal_kind} />
            <Select label="Typ" name="property_type" options={PROPERTY_TYPES} value={property.property_type} />
            <Select label="Status" name="status" options={PROPERTY_STATUSES} value={property.status} />
          </div>

          <AddressInput
            label="Adres (podpowiada się)"
            defaultAddress={property.address ?? ""}
            defaultCity={property.city ?? ""}
            defaultLat={property.lat != null ? String(property.lat) : ""}
            defaultLng={property.lng != null ? String(property.lng) : ""}
          />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cena (zł)" name="price" type="number" value={property.price_pln} />
            <Field label="Powierzchnia (m²)" name="area" type="number" value={property.area_m2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pokoje" name="rooms" type="number" value={property.rooms} />
            <Field label="Piętro" name="floor" type="number" value={property.floor} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-500">Właściciel</label>
            <select name="owner_client_id" defaultValue={property.owner_client_id ?? ""} className={selectCls}>
              <option value="">- brak -</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-500">
              Opis <span className="text-slate-400">(opcjonalnie)</span>
            </label>
            <textarea name="description" rows={3} defaultValue={property.description ?? ""} className={inputCls} />
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400"
          >
            Zapisz zmiany
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-slate-300 px-5 py-3 text-slate-700 transition hover:bg-slate-100"
          >
            Anuluj
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";
const selectCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none";

function Field({
  label,
  name,
  type = "text",
  value,
}: {
  label: string;
  name: string;
  type?: string;
  value: string | number | null;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-slate-500">{label}</label>
      <input name={name} type={type} defaultValue={value ?? ""} className={inputCls} />
    </div>
  );
}

function Select({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
  value: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-slate-500">{label}</label>
      <select name={name} defaultValue={value} className={selectCls}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
