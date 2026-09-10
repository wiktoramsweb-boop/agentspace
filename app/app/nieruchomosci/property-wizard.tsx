"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProperty, updateProperty } from "./actions";
import { AddressInput } from "../components/address-input";
import { Modal } from "../components/modal";
import { SubmitButton } from "../components/submit-button";
import { PROPERTY_ICONS } from "../components/icons";
import { WizardNav, WizardSteps } from "../components/wizard-steps";
import { PhotoManager } from "./photo-manager";
import { discardPhotoUploads } from "./photo-actions";
import type { PhotoConfig } from "@/lib/agency-settings-shared";
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
  type Property,
  type PropertyDealKind,
  type PropertyPhoto,
  type PropertyType,
} from "@/lib/types";

type ClientLite = { id: string; name: string };

const STEPS = ["Nieruchomość", "Adres", "Parametry", "Opis", "Zdjęcia", "Publikacja"] as const;

/** Pliki zdjęć (wersja ze znakiem i czysta) jako jedna lista ścieżek. */
function filesOf(photos: PropertyPhoto[]): string[] {
  return photos.flatMap((p) => [p.path, p.original_path]).filter((x): x is string => !!x);
}

/**
 * Kreator oferty - ten sam do dodawania i do edycji.
 *
 * Wszystkie kroki są w JEDNYM formularzu, a nieaktywne tylko ukrywamy. Dzięki temu
 * zapis wysyła komplet danych bez przepisywania stanu między krokami. W edycji
 * pola startują z wartościami oferty, a zapis wraca na kartę bez przeładowania.
 */
export function PropertyWizard({
  clients,
  photoConfig,
  offerPrefix = "SP",
  canEditSettings = false,
  property,
}: {
  clients: ClientLite[];
  photoConfig: PhotoConfig;
  offerPrefix?: string;
  canEditSettings?: boolean;
  /** Podana oferta = tryb edycji. */
  property?: Property;
}) {
  const editing = !!property;
  const router = useRouter();
  const initialPhotos = property?.photos ?? [];

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dealKind, setDealKind] = useState<PropertyDealKind>(property?.deal_kind ?? "sprzedaz");
  const [type, setType] = useState<PropertyType>(property?.property_type ?? "mieszkanie");
  const [features, setFeatures] = useState<Record<string, boolean>>(property?.features ?? {});
  const [exportWeb, setExportWeb] = useState(!!property?.export_to_web);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PropertyPhoto[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  // Klucz odświeża pola przy każdym otwarciu, żeby edycja zaczynała od
  // aktualnych danych oferty, a nie od tego, co wpisano i porzucono wcześniej.
  const [session, setSession] = useState(0);

  const isRent = dealKind === "wynajem";
  const isLand = type === "dzialka";

  function openWizard() {
    setDealKind(property?.deal_kind ?? "sprzedaz");
    setType(property?.property_type ?? "mieszkanie");
    setFeatures(property?.features ?? {});
    setExportWeb(!!property?.export_to_web);
    setPhotos(property?.photos ?? []);
    setSaveError(null);
    setStep(0);
    setSession((s) => s + 1);
    setOpen(true);
  }

  function close() {
    // Zdjęcia wgrane w tym oknie, a niezapisane, nie należą do żadnej oferty.
    // Kasujemy tylko nowe pliki - zdjęcia, które oferta już miała, zostają.
    const keep = new Set(filesOf(property?.photos ?? []));
    const leftovers = filesOf(photos).filter((p) => !keep.has(p));
    if (leftovers.length) void discardPhotoUploads([...new Set(leftovers)]);
    setOpen(false);
    setStep(0);
  }

  if (!open) {
    return editing ? (
      <button
        onClick={openWizard}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-emerald-500/60 hover:text-slate-900"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.86 4.49 2.65 2.65M3 21l.53-4.06a2 2 0 0 1 .57-1.18L15.3 4.53a1.87 1.87 0 0 1 2.65 0l1.52 1.52a1.87 1.87 0 0 1 0 2.65L8.24 19.9a2 2 0 0 1-1.18.57L3 21Z" />
        </svg>
        Edytuj ofertę
      </button>
    ) : (
      <button
        onClick={openWizard}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
      >
        + Dodaj nieruchomość
      </button>
    );
  }

  const p = property;

  return (
    <Modal title={editing ? "Edycja oferty" : "Nowa oferta"} onClose={close} maxWidth="max-w-4xl">
      <form
        key={session}
        action={async (fd) => {
          setSaveError(null);
          if (editing && p) {
            const res = await updateProperty(p.id, fd);
            if (!res.ok) {
              setSaveError(res.error);
              return;
            }
            setOpen(false);
            router.refresh();
          } else {
            const res = await createProperty(fd);
            if (!res.ok) setSaveError(res.error);
          }
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <WizardSteps steps={STEPS} step={step} onStep={setStep} />

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* ── KROK 1: rodzaj + typ ─────────────────────────────── */}
          <div hidden={step !== 0}>
            <div className="mx-auto mb-7 flex max-w-sm rounded-2xl bg-slate-100 p-1">
              {PROPERTY_DEAL_KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setDealKind(k.value)}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    dealKind === k.value
                      ? "bg-white text-slate-900 shadow-sm"
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
              value={p?.title}
              placeholder="Kraków, os. Stalowe (zostaw puste, ułożymy z adresu)"
              hint="Tak zobaczysz ofertę na liście. Puste = zbudujemy nazwę z typu, miasta i metrażu."
            />
            <AddressInput
              label="Adres (podpowiada się)"
              defaultAddress={p?.address ?? ""}
              defaultCity={p?.city ?? ""}
              defaultLat={p?.lat != null ? String(p.lat) : ""}
              defaultLng={p?.lng != null ? String(p.lng) : ""}
            />
            <Select label="Status oferty" name="status" options={PROPERTY_STATUSES} value={p?.status} />
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
                      defaultChecked={m.value === (p?.export_address_mode ?? "ulica")}
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
                <Field label={isRent ? "Czynsz najmu (zł/mc)" : "Cena (zł)"} name="price" type="number" value={p?.price_pln} placeholder="650000" />
                <Field label="Powierzchnia (m²)" name="area" type="number" value={p?.area_m2} placeholder="48" />
                {isLand ? (
                  <Field label="Powierzchnia działki (m²)" name="plot_area_m2" type="number" value={p?.plot_area_m2} placeholder="800" />
                ) : (
                  <Field label="Liczba pokoi" name="rooms" type="number" value={p?.rooms} placeholder="2" />
                )}
              </div>
              {!isLand && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Piętro (0 = parter)" name="floor" type="number" value={p?.floor} placeholder="2" />
                  <Field label="Pięter w budynku" name="floors_total" type="number" value={p?.floors_total} placeholder="5" />
                  <Field label="Rok budowy" name="year_built" type="number" value={p?.year_built} placeholder="2015" />
                </div>
              )}
            </Group>

            <Group title="Stan i standard">
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Rynek" name="market" options={MARKETS} value={p?.market} empty />
                <Select label="Stan prawny" name="ownership" options={OWNERSHIPS} value={p?.ownership} empty />
                {!isLand && <Select label="Rodzaj budynku" name="building_type" options={BUILDING_TYPES} value={p?.building_type} empty />}
                {!isLand && <Select label="Stan nieruchomości" name="condition_std" options={CONDITIONS} value={p?.condition_std} empty />}
                {!isLand && <Select label="Ogrzewanie" name="heating" options={HEATINGS} value={p?.heating} empty />}
                <Field label="Czynsz administracyjny (zł/mc)" name="admin_fee_pln" type="number" value={p?.admin_fee_pln} placeholder="700" />
                {isRent && <Field label="Kaucja (zł)" name="deposit_pln" type="number" value={p?.deposit_pln} placeholder="3000" />}
                <Field label="Dostępne od" name="available_from" type="date" value={p?.available_from} />
              </div>
            </Group>

            {!isLand && (
              <Group title="Udogodnienia">
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_FEATURES.map((f) => {
                    const on = !!features[f.key];
                    return (
                      <button
                        key={f.key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setFeatures((prev) => ({ ...prev, [f.key]: !on }))}
                        className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                          on
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </Group>
            )}
            <input type="hidden" name="features" value={JSON.stringify(features)} />
          </div>

          {/* ── KROK 4: opis ──────────────────────────────────────── */}
          <div hidden={step !== 3} className="space-y-4">
            <Field
              label="Nagłówek marketingowy"
              name="headline"
              value={p?.headline}
              placeholder="2 pokoje 47 m² | Kraków Czyżyny | Od zaraz"
              hint="To zdanie zobaczy klient jako pierwsze na stronie z ofertą."
            />
            <div>
              <Label>Opis oferty</Label>
              <textarea
                name="description"
                rows={9}
                defaultValue={p?.description ?? ""}
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
              <select name="owner_client_id" className={inp} defaultValue={p?.owner_client_id ?? ""}>
                <option value="">brak, dodam później</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── KROK 5: zdjęcia ───────────────────────────────────── */}
          <div hidden={step !== 4}>
            <PhotoManager
              key={session}
              initial={initialPhotos}
              config={photoConfig}
              onChange={setPhotos}
              onBusyChange={setUploading}
              canEditSettings={canEditSettings}
            />
            <input type="hidden" name="photos" value={JSON.stringify(photos)} />
          </div>

          {/* ── KROK 6: publikacja ────────────────────────────────── */}
          <div hidden={step !== 5} className="space-y-4">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Eksport jeszcze nie wysyła ofert na zewnątrz.</p>
              <p className="mt-1">
                Strona biura działa dziś na zewnętrznej wtyczce, a portale wymagają osobnych
                umów. Oznaczenia poniżej zbieramy już teraz, żeby po podłączeniu oferty poszły
                bez uzupełniania danych od nowa.
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
              <input
                type="checkbox"
                name="export_to_portals"
                value="1"
                defaultChecked={!!p?.export_to_portals}
                className="mt-0.5 h-4 w-4 accent-emerald-500"
              />
              <span>
                <span className="font-medium text-slate-900">Eksport na portale</span>
                <span className="block text-sm text-slate-500">
                  Otodom, OLX i podobne. Wymaga umowy z portalem, na razie tylko oznaczenie.
                </span>
              </span>
            </label>

            <p className="text-xs text-slate-400">
              {editing
                ? p?.offer_no
                  ? `Numer oferty: ${p.offer_no}.`
                  : "Ta oferta nie ma numeru."
                : `Numer oferty nadamy automatycznie przy zapisie (format ${offerPrefix}/${new Date().getFullYear()}/001).`}
            </p>
          </div>
        </div>

        {saveError && (
          <p className="mx-6 mb-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </p>
        )}

        <WizardNav
          step={step}
          total={STEPS.length}
          onBack={() => setStep((s) => s - 1)}
          onNext={() => setStep((s) => s + 1)}
          onCancel={close}
        >
          <SubmitButton
            pendingText="Zapisuję…"
            disabled={uploading}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-400"
          >
            {uploading ? "Czekam na zdjęcia…" : editing ? "Zapisz zmiany" : "Zapisz ofertę"}
          </SubmitButton>
        </WizardNav>
      </form>
    </Modal>
  );
}

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
        const TileIcon = PROPERTY_ICONS[t.value] ?? PROPERTY_ICONS.inne;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            aria-pressed={active}
            className={`relative flex flex-col items-center gap-2.5 rounded-2xl border p-4 transition duration-200 ${
              active
                ? "-translate-y-0.5 border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10"
                : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            {active && (
              <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                </svg>
              </span>
            )}
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${t.tile}`}>
              <TileIcon className="h-6 w-6" />
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
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";

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
  value,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={value ?? ""}
        step={type === "number" ? "any" : undefined}
        className={inp}
      />
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Select({
  label,
  name,
  options,
  empty,
  value,
}: {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
  empty?: boolean;
  value?: string | null;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select name={name} className={inp} defaultValue={value ?? (empty ? "" : undefined)}>
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
