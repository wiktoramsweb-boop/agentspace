"use client";

import { useState } from "react";
import { Modal } from "../components/modal";
import { SubmitButton } from "../components/submit-button";
import { PROPERTY_ICONS } from "../components/icons";
import { createSearch } from "./actions";
import {
  PROPERTY_TYPE_TILES,
  PROPERTY_FEATURES,
  SEARCH_STATUSES,
  type PropertyDealKind,
  type PropertyType,
} from "@/lib/types";

type ClientLite = { id: string; name: string; phone?: string | null };

const STEPS = ["Czego szuka", "Klient", "Parametry", "Obszar"] as const;

export function SearchWizard({
  clients,
  presetClientId,
  trigger = "button",
}: {
  clients: ClientLite[];
  presetClientId?: string;
  trigger?: "button" | "plus";
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dealKind, setDealKind] = useState<PropertyDealKind>("sprzedaz");
  const [types, setTypes] = useState<PropertyType[]>(["mieszkanie"]);
  const [mustHave, setMustHave] = useState<Record<string, boolean>>({});

  const isRent = dealKind === "wynajem";

  function toggleType(v: PropertyType) {
    setTypes((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));
  }

  function close() {
    setOpen(false);
    setStep(0);
  }

  if (!open) {
    return trigger === "plus" ? (
      <button
        onClick={() => setOpen(true)}
        aria-label="Dodaj poszukiwanie"
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-white transition hover:bg-emerald-400"
      >
        +
      </button>
    ) : (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
      >
        + Dodaj poszukiwanie
      </button>
    );
  }

  return (
    <Modal title="Dodawanie poszukiwania" onClose={close} maxWidth="max-w-4xl">
      <form
        action={async (fd) => {
          setSaveError(null);
          const res = await createSearch(fd);
          if (!res.ok) setSaveError(res.error);
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <input type="hidden" name="deal_kind" value={dealKind} />
        {types.map((t) => (
          <input key={t} type="hidden" name="property_types" value={t} />
        ))}
        <input type="hidden" name="must_have" value={JSON.stringify(mustHave)} />

        <div className="flex flex-shrink-0 gap-1 overflow-x-auto border-b border-slate-200 px-4">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(i)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                step === i
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* KROK 1 - kupno/najem + typy */}
          <div hidden={step !== 0}>
            <div className="mx-auto mb-7 flex max-w-sm rounded-xl border border-slate-300 p-1">
              <button
                type="button"
                onClick={() => setDealKind("sprzedaz")}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition ${
                  !isRent ? "bg-blue-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Kupno
              </button>
              <button
                type="button"
                onClick={() => setDealKind("wynajem")}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition ${
                  isRent ? "bg-blue-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Najem
              </button>
            </div>

            <p className="mb-3 text-center text-xs text-slate-400">
              Zaznacz wszystkie typy, które klient bierze pod uwagę.
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {PROPERTY_TYPE_TILES.filter((t) => t.group === "podstawowe").map((t) => {
                const active = types.includes(t.value);
                const Icon = PROPERTY_ICONS[t.value] ?? PROPERTY_ICONS.inne;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleType(t.value)}
                    className={`flex flex-col items-center gap-2.5 rounded-2xl border p-4 transition ${
                      active
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${t.tile}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className={`text-xs font-medium ${active ? "text-emerald-700" : "text-slate-700"}`}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* KROK 2 - klient */}
          <div hidden={step !== 1} className="space-y-4">
            <div>
              <Label>Klient</Label>
              <select name="client_id" className={inp} defaultValue={presetClientId ?? ""}>
                <option value="">nie wybrano</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` (${c.phone})` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-400">
                Poszukiwanie bez klienta też ma sens - np. gdy zbierasz zapytania z portalu.
              </p>
            </div>
            <Field
              label="Nazwa poszukiwania"
              name="title"
              placeholder="np. 2 pokoje Krowodrza do 700 tys."
              hint="Puste = ułożymy z parametrów."
            />
            <div>
              <Label>Status</Label>
              <select name="status" className={inp} defaultValue="aktualne">
                {SEARCH_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* KROK 3 - parametry */}
          <div hidden={step !== 2} className="space-y-6">
            <Group title={isRent ? "Czynsz (zł/mc)" : "Cena (zł)"}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Od" name="price_min" type="text" inputMode="decimal" placeholder={isRent ? "2000" : "500000"} />
                <Field label="Do" name="price_max" type="text" inputMode="decimal" placeholder={isRent ? "3500" : "700000"} />
              </div>
            </Group>
            <Group title="Powierzchnia (m²)">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Od" name="area_min" type="text" inputMode="decimal" placeholder="45" />
                <Field label="Do" name="area_max" type="text" inputMode="decimal" placeholder="65" />
              </div>
            </Group>
            <Group title="Pokoje i piętro">
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Pokoje od" name="rooms_min" type="number" placeholder="2" />
                <Field label="Pokoje do" name="rooms_max" type="number" placeholder="3" />
                <Field label="Piętro od" name="floor_min" type="number" placeholder="1" />
                <Field label="Piętro do" name="floor_max" type="number" placeholder="5" />
              </div>
              <Field label="Rok budowy od" name="year_built_min" type="number" placeholder="2000" />
            </Group>
          </div>

          {/* KROK 4 - obszar i wymagania */}
          <div hidden={step !== 3} className="space-y-6">
            <div>
              <Label>Lokalizacje</Label>
              <input
                name="locations"
                placeholder="Krowodrza, Podgórze, Czyżyny"
                className={inp}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Wpisz po przecinku. Dopasujemy ofertę, jeśli któraś nazwa pojawi się w mieście lub adresie.
              </p>
            </div>

            <div>
              <Label>Wymagane udogodnienia</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {PROPERTY_FEATURES.map((f) => (
                  <label key={f.key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!mustHave[f.key]}
                      onChange={(e) => setMustHave((p) => ({ ...p, [f.key]: e.target.checked }))}
                      className="h-4 w-4 accent-emerald-500"
                    />
                    {f.label}
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Brak udogodnienia nie ukrywa oferty - trafi do „prawie pasuje" z adnotacją.
              </p>
            </div>

            <div>
              <Label>Notatki</Label>
              <textarea
                name="notes"
                rows={4}
                placeholder="Np. koniecznie z balkonem, nie parter, wprowadzka do końca roku…"
                className={inp}
              />
            </div>
          </div>
        </div>

        {saveError && (
          <p className="mx-6 mb-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </p>
        )}

        <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-t border-slate-200 px-6 py-4">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-emerald-500" : i < step ? "w-1.5 bg-emerald-400" : "w-1.5 bg-slate-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500">
            Krok {step + 1} z {STEPS.length}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Anuluj
            </button>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                Poprzedni
              </button>
            )}
            {step < STEPS.length - 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                Dalej
              </button>
            )}
            <SubmitButton
              pendingText="Zapisuję…"
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
            >
              Zapisz poszukiwanie
            </SubmitButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}

const inp =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm text-slate-500">{children}</label>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  hint,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  inputMode?: "decimal" | "numeric" | "tel";
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input name={name} type={type} placeholder={placeholder} inputMode={inputMode} className={inp} />
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
