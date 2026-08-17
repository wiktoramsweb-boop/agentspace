"use client";

import { useState } from "react";
import { SubmitButton } from "../components/submit-button";
import { createClient } from "./actions";
import { CLIENT_STATUSES, type ClientType } from "@/lib/types";
import { AddressInput } from "../components/address-input";
import { Modal } from "../components/modal";

type ExistingPhone = { phone: string | null; owner: string | null };

const digits = (s: string) => s.replace(/\D/g, "");

type TypeMeta = {
  value: ClientType;
  label: string;
  desc: string;
  color: string; // klasy dla zaznaczonego kafla
  propertyLabel: string;
  propertyPh: string;
  amountLabel: string;
  amountPh: string;
  addressLabel: string;
  showAmount: boolean;
};

const TYPES: TypeMeta[] = [
  {
    value: "sprzedajacy",
    label: "Sprzedający",
    desc: "Właściciel, który chce sprzedać",
    color: "border-emerald-500/60 bg-emerald-50",
    propertyLabel: "Co sprzedaje (nieruchomość)",
    propertyPh: "np. 3 pok. 64 m², Krowodrza",
    amountLabel: "Oczekiwana cena (zł)",
    amountPh: "650000",
    addressLabel: "Adres nieruchomości",
    showAmount: true,
  },
  {
    value: "kupujacy",
    label: "Kupujący",
    desc: "Szuka nieruchomości do kupna",
    color: "border-sky-500/60 bg-sky-500/10",
    propertyLabel: "Czego szuka",
    propertyPh: "np. 2-3 pok. do 700 tys., Podgórze",
    amountLabel: "Budżet (zł)",
    amountPh: "700000",
    addressLabel: "Preferowana lokalizacja",
    showAmount: true,
  },
  {
    value: "wynajmujacy",
    label: "Wynajmujący",
    desc: "Właściciel, który chce wynająć",
    color: "border-violet-500/60 bg-violet-500/10",
    propertyLabel: "Co wynajmuje (nieruchomość)",
    propertyPh: "np. kawalerka 30 m², Kazimierz",
    amountLabel: "Oczekiwany czynsz (zł/mc)",
    amountPh: "2500",
    addressLabel: "Adres nieruchomości",
    showAmount: true,
  },
  {
    value: "najemca",
    label: "Najemca",
    desc: "Szuka mieszkania do wynajęcia",
    color: "border-amber-500/60 bg-amber-500/10",
    propertyLabel: "Czego szuka",
    propertyPh: "np. 2 pok. do 3000 zł, centrum",
    amountLabel: "Budżet na czynsz (zł/mc)",
    amountPh: "3000",
    addressLabel: "Preferowana lokalizacja",
    showAmount: true,
  },
  {
    value: "inny",
    label: "Inny",
    desc: "Inny kontakt",
    color: "border-slate-300 bg-slate-100",
    propertyLabel: "Czego dotyczy (opcjonalnie)",
    propertyPh: "krótki opis",
    amountLabel: "Kwota (zł, opcjonalnie)",
    amountPh: "",
    addressLabel: "Lokalizacja (opcjonalnie)",
    showAmount: false,
  },
];

export function NewClientForm({ existingPhones = [] }: { existingPhones?: ExistingPhone[] }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<ClientType>("sprzedajacy");

  const meta = TYPES.find((t) => t.value === type) ?? TYPES[0];
  const pd = digits(phone);
  const dup = pd.length >= 7 ? existingPhones.find((e) => e.phone && digits(e.phone) === pd) : undefined;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
      >
        + Dodaj klienta
      </button>
    );
  }

  return (
    <Modal title="Nowy klient" onClose={() => setOpen(false)}>
      <form action={createClient} className="flex min-h-0 flex-1 flex-col">
        <input type="hidden" name="type" value={type} />
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* Krok 1: typ klienta */}
          <div>
            <label className={lbl}>Typ klienta</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    type === t.value ? t.color : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900">{t.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Dane kontaktowe */}
          <Field label="Imię i nazwisko" name="name" required placeholder="Jan Kowalski" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Telefon</label>
              <input
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+48 600 000 000"
                inputMode="tel"
                className={`w-full rounded-xl border bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                  dup ? "border-amber-500/60 focus:border-amber-500" : "border-slate-200 focus:border-emerald-500"
                }`}
              />
            </div>
            <Field label="Email" name="email" type="email" placeholder="jan@email.pl" />
          </div>
          {dup && (
            <p className="-mt-2 text-xs text-amber-600">
              ⚠️ Ten numer jest już w bazie{dup.owner ? ` (opiekun: ${dup.owner})` : ""}. Możesz dodać mimo to.
            </p>
          )}

          {/* Pola zależne od typu */}
          <Field label={meta.propertyLabel} name="property" placeholder={meta.propertyPh} />
          <div className="grid grid-cols-2 gap-4">
            {meta.showAmount ? (
              <Field label={meta.amountLabel} name="budget" type="text" inputMode="decimal" placeholder={meta.amountPh} />
            ) : (
              <input type="hidden" name="budget" value="" />
            )}
            <Select label="Status" name="status" options={CLIENT_STATUSES} />
          </div>

          <AddressInput label={meta.addressLabel} />

          <Field label="Następny kontakt (przypomnienie)" name="next_contact_at" type="date" />
        </div>

        <div className="flex flex-shrink-0 gap-3 border-t border-slate-200 px-6 py-4">
          <SubmitButton
            pendingText="Dodaję…"
            className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white hover:bg-emerald-400"
          >
            Dodaj {meta.label.toLowerCase()}
          </SubmitButton>
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

const lbl = "mb-1.5 block text-sm text-slate-500";
const inp =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "text" | "decimal" | "numeric" | "tel" | "email";
}) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <input name={name} type={type} required={required} placeholder={placeholder} inputMode={inputMode} className={inp} />
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
      <label className={lbl}>{label}</label>
      <select name={name} className={inp}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
