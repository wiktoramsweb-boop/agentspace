"use client";

import { useState } from "react";
import { SubmitButton } from "../components/submit-button";
import { createClient } from "./actions";
import { CLIENT_STATUSES, CLIENT_SOURCES, PHONE_LABELS, type ClientType } from "@/lib/types";
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
  /** Forma biernika do przycisku (Dodaj sprzedajacego, nie: sprzedajacy). */
  addLabel: string;
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
    addLabel: "sprzedającego",
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
    addLabel: "kupującego",
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
    addLabel: "wynajmującego",
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
    addLabel: "najemcę",
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
    addLabel: "kontakt",
  },
];

export function NewClientForm({ existingPhones = [] }: { existingPhones?: ExistingPhone[] }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [extraPhones, setExtraPhones] = useState<number[]>([]);
  const [extraEmails, setExtraEmails] = useState<number[]>([]);
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
    <Modal title="Dodawanie kontaktu" onClose={() => setOpen(false)} maxWidth="max-w-3xl">
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

          {/* ── Informacje podstawowe ─────────────────────────── */}
          <Section title="Informacje podstawowe">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Imię *" name="first_name" required placeholder="Jan" />
              <Field label="Nazwisko" name="last_name" placeholder="Kowalski" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Firma" name="company" placeholder="np. Nowak Development" />
              <Field label="Stanowisko" name="position" placeholder="np. Prezes" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={lbl}>Telefon główny</label>
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
              <Field label="E-mail główny" name="email" type="email" placeholder="jan@email.pl" />
            </div>
            {dup && (
              <p className="-mt-1 text-xs text-amber-600">
                Ten numer jest już w bazie{dup.owner ? ` (opiekun: ${dup.owner})` : ""}. Możesz dodać mimo to.
              </p>
            )}

            {/* Dodatkowe telefony */}
            {extraPhones.map((_, i) => (
              <div key={`ph${i}`} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className={lbl}>Dodatkowy telefon</label>
                  <input name="extra_phone_value" placeholder="600 000 000" inputMode="tel" className={inp} />
                </div>
                <div className="w-40">
                  <label className={lbl}>Opis</label>
                  <select name="extra_phone_label" className={inp} defaultValue="komórka">
                    {PHONE_LABELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setExtraPhones((p) => p.filter((_, j) => j !== i))}
                  className="mb-1 rounded-lg px-2 py-2 text-slate-400 transition hover:text-red-600"
                  aria-label="Usuń telefon"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setExtraPhones((p) => [...p, 1])}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              + Dodaj telefon
            </button>

            {/* Dodatkowe maile */}
            {extraEmails.map((_, i) => (
              <div key={`em${i}`} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className={lbl}>Dodatkowy e-mail</label>
                  <input name="extra_email_value" type="email" placeholder="jan.prywatny@email.pl" className={inp} />
                </div>
                <button
                  type="button"
                  onClick={() => setExtraEmails((p) => p.filter((_, j) => j !== i))}
                  className="mb-1 rounded-lg px-2 py-2 text-slate-400 transition hover:text-red-600"
                  aria-label="Usuń e-mail"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setExtraEmails((p) => [...p, 1])}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              + Dodaj e-mail
            </button>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Nr dokumentu tożsamości" name="id_document" placeholder="ABC 123456" />
              <Field label="PESEL" name="pesel" placeholder="90010112345" />
              <Field label="NIP" name="nip" placeholder="6772516327" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Źródło" name="source" options={CLIENT_SOURCES} empty />
              <Select label="Status" name="status" options={CLIENT_STATUSES} />
            </div>
          </Section>

          {/* ── Czego dotyczy ─────────────────────────────────── */}
          <Section title="Czego dotyczy">
            <Field label={meta.propertyLabel} name="property" placeholder={meta.propertyPh} />
            {meta.showAmount ? (
              <Field label={meta.amountLabel} name="budget" type="text" inputMode="decimal" placeholder={meta.amountPh} />
            ) : (
              <input type="hidden" name="budget" value="" />
            )}
          </Section>

          {/* ── Dane adresowe ─────────────────────────────────── */}
          <Section title="Dane adresowe">
            <AddressInput label={meta.addressLabel} />
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Kod pocztowy" name="postal_code" placeholder="30-002" />
              <Field label="Województwo" name="voivodeship" placeholder="małopolskie" />
              <Field label="Państwo" name="country" placeholder="Polska" />
            </div>
          </Section>

          {/* ── Zgody marketingowe ────────────────────────────── */}
          <Section title="Zgody marketingowe">
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <input
                type="checkbox"
                name="marketing_consent"
                value="1"
                className="mt-0.5 h-4 w-4 accent-emerald-500"
              />
              <span>
                <span className="text-sm font-medium text-slate-800">
                  Zgoda na przesyłanie informacji handlowych
                </span>
                <span className="block text-xs text-slate-500">
                  Zapisujemy datę wyrażenia zgody - to dowód przy ewentualnej kontroli RODO.
                </span>
              </span>
            </label>
          </Section>

          <Field label="Następny kontakt (przypomnienie)" name="next_contact_at" type="date" />
        </div>

        <div className="flex flex-shrink-0 gap-3 border-t border-slate-200 px-6 py-4">
          <SubmitButton
            pendingText="Dodaję…"
            className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white hover:bg-emerald-400"
          >
            Dodaj {meta.addLabel}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
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
  empty,
}: {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
  empty?: boolean;
}) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <select name={name} className={inp} defaultValue={empty ? "" : undefined}>
        {empty && <option value="">nie podano</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
