"use client";

import { useState } from "react";
import {
  MARK_POSITIONS,
  type MarkPosition,
  type StampConfig,
  type WatermarkConfig,
} from "@/lib/agency-settings-shared";
import { saveMarks } from "../company-actions";
import { AssetUploader } from "../asset-uploader";
import { FieldLabel, ResultForm, inputCls } from "../result-form";

/** Położenie znaku na podglądzie. Margines jak przy nakładaniu (ok. 3,5%). */
const POS_CLASS: Record<MarkPosition, string> = {
  center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
  "top-left": "left-[3%] top-[3.5%]",
  "top-right": "right-[3%] top-[3.5%]",
  "bottom-left": "bottom-[3.5%] left-[3%]",
  "bottom-right": "bottom-[3.5%] right-[3%]",
};

export function MarksForm({
  watermark,
  watermarkUrl,
  stamp,
  stampUrl,
  samples,
  disabled,
}: {
  watermark: WatermarkConfig;
  watermarkUrl: string | null;
  stamp: StampConfig;
  stampUrl: string | null;
  samples: string[];
  disabled: boolean;
}) {
  const [wmOpacity, setWmOpacity] = useState(Math.round(watermark.opacity * 100));
  const [wmScale, setWmScale] = useState(Math.round(watermark.scale * 100));
  const [wmPosition, setWmPosition] = useState<MarkPosition>(watermark.position);
  const [wmEnabled, setWmEnabled] = useState(watermark.enabled);
  const [stScale, setStScale] = useState(Math.round(stamp.scale * 100));
  const [stPosition, setStPosition] = useState<MarkPosition>(stamp.position);
  const [sample, setSample] = useState(0);

  const photos = samples.length ? samples : ["/podglad-wnetrze.svg"];
  const current = photos[sample % photos.length];

  return (
    <ResultForm action={saveMarks} disabled={disabled}>
      <input type="hidden" name="wm_enabled" value={wmEnabled ? "1" : "0"} />

      <div className="grid gap-6 2xl:grid-cols-2">
        {/* ── Znak wodny ───────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <DropIcon />
              </span>
              <h2 className="text-base font-semibold text-slate-900">Znak wodny</h2>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={wmEnabled}
                onChange={(e) => setWmEnabled(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              Nakładaj na nowe zdjęcia
            </label>
          </header>

          <div className="space-y-5 p-5">
            <Preview
              photo={current}
              overlay={watermarkUrl && wmEnabled ? { url: watermarkUrl, opacity: wmOpacity / 100, scale: wmScale / 100, position: wmPosition } : null}
              count={photos.length}
              index={sample % photos.length}
              onIndex={setSample}
              empty="Wgraj znak wodny, żeby zobaczyć podgląd."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Slider label="Krycie" name="wm_opacity" value={wmOpacity} min={5} max={100} onChange={setWmOpacity} suffix="%" />
              <Slider label="Wielkość (szerokość zdjęcia)" name="wm_scale" value={wmScale} min={5} max={90} onChange={setWmScale} suffix="%" />
            </div>
            <PositionSelect name="wm_position" value={wmPosition} onChange={setWmPosition} />

            <div>
              <FieldLabel>Plik znaku wodnego</FieldLabel>
              <AssetUploader
                kind="watermark"
                label="Znak wodny"
                currentUrl={watermarkUrl}
                checker
                disabled={disabled}
                hint="Najlepiej białe logo na przezroczystym tle (PNG). Wgranie zmienia plik od razu."
              />
            </div>

            <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600">
              Znak nakłada się sam na każde nowe zdjęcie oferty. Na zdjęciach dodanych
              wcześniej użyj na karcie oferty przycisku „Nałóż aktualny znak wodny”.
              Czysta wersja każdego zdjęcia zostaje zachowana.
            </p>
          </div>
        </section>

        {/* ── Stempel promocyjny ───────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white">
          <header className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <StampIcon />
            </span>
            <h2 className="text-base font-semibold text-slate-900">Stempel promocyjny</h2>
          </header>

          <div className="space-y-5 p-5">
            <Preview
              photo={current}
              overlay={stampUrl ? { url: stampUrl, opacity: 1, scale: stScale / 100, position: stPosition } : null}
              underlay={watermarkUrl && wmEnabled ? { url: watermarkUrl, opacity: wmOpacity / 100, scale: wmScale / 100, position: wmPosition } : null}
              count={photos.length}
              index={sample % photos.length}
              onIndex={setSample}
              empty="Wgraj stempel, np. „prowizja 0%”, żeby zobaczyć podgląd."
            />

            <Slider label="Wielkość (szerokość zdjęcia)" name="st_scale" value={stScale} min={5} max={60} onChange={setStScale} suffix="%" />
            <PositionSelect name="st_position" value={stPosition} onChange={setStPosition} />

            <div>
              <FieldLabel>Plik stempla</FieldLabel>
              <AssetUploader
                kind="stamp"
                label="Stempel promocyjny"
                currentUrl={stampUrl}
                checker
                disabled={disabled}
                hint="Na przykład okrągła naklejka „prowizja 0%” w PNG."
              />
            </div>

            <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600">
              Stempel nie trafia na wszystkie zdjęcia. Włączasz go przy konkretnej ofercie
              przyciskiem „Stempel” na zdjęciu głównym i zdejmujesz jednym kliknięciem,
              gdy promocja się kończy.
            </p>
          </div>
        </section>
      </div>
    </ResultForm>
  );
}

type Overlay = { url: string; opacity: number; scale: number; position: MarkPosition };

function Preview({
  photo,
  overlay,
  underlay,
  count,
  index,
  onIndex,
  empty,
}: {
  photo: string;
  overlay: Overlay | null;
  underlay?: Overlay | null;
  count: number;
  index: number;
  onIndex: (i: number) => void;
  empty: string;
}) {
  const layer = (o: Overlay, key: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={key}
      src={o.url}
      alt=""
      aria-hidden="true"
      className={`pointer-events-none absolute h-auto ${POS_CLASS[o.position]}`}
      style={{ width: `${o.scale * 100}%`, opacity: o.opacity }}
    />
  );

  return (
    <div>
      <FieldLabel>Podgląd na zdjęciu</FieldLabel>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="Przykładowe zdjęcie" className="h-full w-full object-cover" />
        {underlay && layer(underlay, "under")}
        {overlay && layer(overlay, "over")}
        {!overlay && (
          <span className="absolute inset-x-0 bottom-0 bg-slate-900/60 px-3 py-2 text-center text-xs text-white">
            {empty}
          </span>
        )}
      </div>
      {count > 1 && (
        <div className="mt-2 flex items-center justify-center gap-3">
          <button type="button" aria-label="Poprzednie zdjęcie" onClick={() => onIndex((index - 1 + count) % count)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100">
            ‹
          </button>
          <span className="flex gap-1.5">
            {Array.from({ length: count }, (_, i) => (
              <button key={i} type="button" aria-label={`Zdjęcie ${i + 1}`} onClick={() => onIndex(i)}
                className={`h-2 w-2 rounded-full ${i === index ? "bg-blue-600" : "bg-slate-300"}`} />
            ))}
          </span>
          <button type="button" aria-label="Następne zdjęcie" onClick={() => onIndex((index + 1) % count)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100">
            ›
          </button>
        </div>
      )}
    </div>
  );
}

function Slider({
  label,
  name,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  name: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <span className="font-mono text-sm tabular-nums text-slate-800">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
    </label>
  );
}

function PositionSelect({
  name,
  value,
  onChange,
}: {
  name: string;
  value: MarkPosition;
  onChange: (v: MarkPosition) => void;
}) {
  return (
    <label className="block">
      <FieldLabel>Położenie</FieldLabel>
      <select name={name} value={value} onChange={(e) => onChange(e.target.value as MarkPosition)} className={inputCls}>
        {MARK_POSITIONS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DropIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.7c-.3 0-.6.1-.8.4C9.5 5.3 5 11.1 5 14.6 5 18.7 8.1 22 12 22s7-3.3 7-7.4c0-3.5-4.5-9.3-6.2-11.5a1 1 0 0 0-.8-.4Z" />
    </svg>
  );
}

function StampIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6l-1 6a4 4 0 0 1 4 4v1H6v-1a4 4 0 0 1 4-4L9 3Zm-4 14h14v3H5v-3Z" />
    </svg>
  );
}
