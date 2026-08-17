"use client";

import { useState } from "react";
import { createProperty } from "./actions";
import { AddressInput } from "../components/address-input";
import { Modal } from "../components/modal";
import { SubmitButton } from "../components/submit-button";
import {
  PROPERTY_DEAL_KINDS,
  PROPERTY_TYPE_TILES,
  PROPERTY_STATUSES,
  MARKETS,
  OWNERSHIPS,
  BUILDING_TYPES,
  CONDITIONS,
  HEATINGS,
  PROPERTY_FEATURES,
  EXPORT_ADDRESS_MODES,
  type PropertyDealKind,
  type PropertyType,
} from "@/lib/types";

type ClientLite = { id: string; name: string };

const STEPS = ["Nieruchomość", "Adres", "Parametry", "Opis", "Publikacja"] as const;

/**
 * Kreator dodawania nieruchomości wzorowany na ASARI: krok 1 to rodzaj transakcji
 * i kolorowe kafelki typów, dalej adres, parametry, opis i publikacja.
 *
 * Wszystkie kroki są w JEDNYM formularzu, a nieaktywne tylko ukrywamy. Dzięki temu
 * zapis wysyła komplet danych bez przepisywania stanu między krokami.
 */
export function PropertyWizard({ clients }: { clients: ClientLite[] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dealKind, setDealKind] = useState<PropertyDealKind>("sprzedaz");
  const [type, setType] = useState<PropertyType>("mieszkanie");
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [exportWeb, setExportWeb] = useState(false);

  const isRent = dealKind === "wynajem";
  const isLand = type === "dzialka";

  function close() {
    setOpen(false);
    setStep(0);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
      >
        + Dodaj nieruchomość
      </button>
    );
  }

  return (
    <Modal title="Dodawanie nieruchomości" onClose={close} maxWidth="max-w-4xl">
      <form action={createProperty} className="flex min-h-0 flex-1 flex-col">
        {/* Zakładki kroków (klikalne, jak w ASARI) */}
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
          {/* ── KROK 1: rodzaj + typ ─────────────────────────────── */}
          <div hidden={step !== 0}>
            <div className="mx-auto mb-7 flex max-w-sm rounded-xl border border-slate-300 p-1">
              {PROPERTY_DEAL_KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setDealKind(k.value)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition ${
                    dealKind === k.value
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>

            <TileGrid
              tiles={PROPERTY_TYPE_TILES.filter((t) => t.group === "podstawowe")}
              value={type}
              onChange={setType}
            />
            <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              lub
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <TileGrid
              tiles={PROPERTY_TYPE_TILES.filter((t) => t.group === "wieksze")}
              value={type}
              onChange={setType}
            />

            <input type="hidden" name="deal_kind" value={dealKind} />
            <input type="hidden" name="property_type" value={type} />
          </div>

          {/* ── KROK 2: adres ─────────────────────────────────────── */}
          <div hidden={step !== 1} className="space-y-4">
            <Field
              label="Nazwa oferty"
              name="title"
              placeholder="Kraków, os. Stalowe (zostaw puste, ułożymy z adresu)"
              hint="Tak zobaczysz ofertę na liście. Puste = zbudujemy nazwę z typu, miasta i metrażu."
            />
            <AddressInput label="Adres (podpowiada się)" />
            <Select label="Status oferty" name="status" options={PROPERTY_STATUSES} />
            <div>
              <Label>Ile adresu pokazać publicznie</Label>
              <div className="flex flex-wrap gap-2">
                {EXPORT_ADDRESS_MODES.map((m) => (
                  <label
                    key={m.value}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"
                  >
                    <input
                      type="radio"
                      name="export_address_mode"
                      value={m.value}
                      defaultChecked={m.value === "ulica"}
                      className="h-4 w-4 accent-emerald-500"
                    />
                    <span className="text-slate-800">{m.label}</span>
                    <span className="text-xs text-slate-400">{m.hint}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── KROK 3: parametry ─────────────────────────────────── */}
          <div hidden={step !== 2} className="space-y-6">
            <Group title="Podstawowe">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={isRent ? "Czynsz najmu (zł/mc)" : "Cena (zł)"} name="price" type="number" placeholder="650000" />
                <Field label="Powierzchnia (m²)" name="area" type="number" placeholder="48" />
                {isLand ? (
                  <Field label="Powierzchnia działki (m²)" name="plot_area_m2" type="number" placeholder="800" />
                ) : (
                  <Field label="Liczba pokoi" name="rooms" type="number" placeholder="2" />
                )}
              </div>
              {!isLand && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Piętro" name="floor" type="number" placeholder="2" />
                  <Field label="Pięter w budynku" name="floors_total" type="number" placeholder="5" />
                  <Field label="Rok budowy" name="year_built" type="number" placeholder="2015" />
                </div>
              )}
            </Group>

            <Group title="Stan i standard">
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Rynek" name="market" options={MARKETS} empty />
                <Select label="Stan prawny" name="ownership" options={OWNERSHIPS} empty />
                {!isLand && <Select label="Rodzaj budynku" name="building_type" options={BUILDING_TYPES} empty />}
                {!isLand && <Select label="Stan nieruchomości" name="condition_std" options={CONDITIONS} empty />}
                {!isLand && <Select label="Ogrzewanie" name="heating" options={HEATINGS} empty />}
                <Field label="Czynsz administracyjny (zł/mc)" name="admin_fee_pln" type="number" placeholder="700" />
                {isRent && <Field label="Kaucja (zł)" name="deposit_pln" type="number" placeholder="3000" />}
                <Field label="Dostępne od" name="available_from" type="date" />
              </div>
            </Group>

            {!isLand && (
              <Group title="Udogodnienia">
                <div className="grid gap-2 sm:grid-cols-3">
                  {PROPERTY_FEATURES.map((f) => (
                    <label key={f.key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!features[f.key]}
                        onChange={(e) => setFeatures((p) => ({ ...p, [f.key]: e.target.checked }))}
                        className="h-4 w-4 accent-emerald-500"
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
                <input type="hidden" name="features" value={JSON.stringify(features)} />
              </Group>
            )}
          </div>

          {/* ── KROK 4: opis ──────────────────────────────────────── */}
          <div hidden={step !== 3} className="space-y-4">
            <Field
              label="Nagłówek marketingowy"
              name="headline"
              placeholder="2 pokoje 47 m² | Kraków Czyżyny | Od zaraz"
              hint="To zdanie zobaczy klient jako pierwsze na stronie z ofertą."
            />
            <div>
              <Label>Opis oferty</Label>
              <textarea
                name="description"
                rows={9}
                placeholder="Rozkładowe, po remoncie, balkon, blisko tramwaju..."
                className={inp}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Pełny opis możesz też wygenerować w module Opisy i wkleić tutaj.
              </p>
            </div>
            <div>
              <Label>
                Właściciel <span className="text-slate-400">(klient sprzedający lub wynajmujący)</span>
              </Label>
              <select name="owner_client_id" className={inp}>
                <option value="">brak, dodam później</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── KROK 5: publikacja ────────────────────────────────── */}
          <div hidden={step !== 4} className="space-y-4">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Eksport jeszcze nie wysyła ofert na zewnątrz.</p>
              <p className="mt-1">
                Strona spectranieruchomosci.pl działa dziś na wtyczce ASARI, a portale wymagają
                osobnych umów. Oznaczenia poniżej zbieramy już teraz, żeby po podłączeniu strony
                oferty poszły bez uzupełniania danych od nowa.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-300 p-4 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
              <input
                type="checkbox"
                name="export_to_web"
                value="1"
                checked={exportWeb}
                onChange={(e) => setExportWeb(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-emerald-500"
              />
              <span>
                <span className="font-medium text-slate-900">Eksport na stronę</span>
                <span className="block text-sm text-slate-500">
                  Oferta trafi na stronę biura, gdy podłączymy AgentSpace do witryny.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-300 p-4 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
              <input type="checkbox" name="export_to_portals" value="1" className="mt-0.5 h-4 w-4 accent-emerald-500" />
              <span>
                <span className="font-medium text-slate-900">Eksport na portale</span>
                <span className="block text-sm text-slate-500">
                  Otodom, OLX i podobne. Wymaga umowy z portalem, na razie tylko oznaczenie.
                </span>
              </span>
            </label>

            <p className="text-xs text-slate-400">
              Numer oferty nadamy automatycznie przy zapisie (format SP/{new Date().getFullYear()}/001).
            </p>
          </div>
        </div>

        {/* Stopka: postęp + akcje (jak w ASARI) */}
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
              Zapisz ofertę
            </SubmitButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ── Kafelki typów (kolorowa ikona + podpis) ────────────────────────────
function TileGrid({
  tiles,
  value,
  onChange,
}: {
  tiles: typeof PROPERTY_TYPE_TILES;
  value: PropertyType;
  onChange: (v: PropertyType) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {tiles.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`flex flex-col items-center gap-2.5 rounded-2xl border p-4 transition ${
              active
                ? "border-emerald-500 bg-emerald-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl text-white ${t.tile}`}
            >
              {t.emoji}
            </span>
            <span className={`text-xs font-medium ${active ? "text-emerald-700" : "text-slate-700"}`}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
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
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input name={name} type={type} placeholder={placeholder} className={inp} />
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
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
      <Label>{label}</Label>
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
