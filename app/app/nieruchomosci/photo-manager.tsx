"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PhotoConfig } from "@/lib/agency-settings";
import type { PropertyPhoto } from "@/lib/types";
import { MAX_PHOTOS } from "@/lib/property-photos";
import { downloadFile, preparePhoto, renderPhoto, uploadToSignedUrl } from "@/lib/photo-process";
import { discardPhotoUploads, savePropertyPhotos, signPhotoUploads } from "./photo-actions";

type Progress = { label: string; done: number; total: number; fraction: number };

const FLAGS: { key: "export" | "print" | "plan" | "visualization"; label: string }[] = [
  { key: "export", label: "Eksport" },
  { key: "print", label: "Wydruki i maile" },
  { key: "plan", label: "Plan" },
  { key: "visualization", label: "Wizualizacja" },
];

/**
 * Zdjęcia oferty: wgrywanie (ze znakiem wodnym biura), kolejność, zdjęcie
 * główne, opisy i oznaczenia jak w ASARI.
 *
 * Dwa tryby:
 * - propertyId podany: każda zmiana od razu zapisuje się w ofercie (karta oferty),
 * - bez propertyId: lista trzymana w pamięci i oddawana przez onChange
 *   (kreator dodawania, zapis razem z całą ofertą).
 */
export function PhotoManager({
  initial = [],
  config,
  propertyId,
  onChange,
  onBusyChange,
  canEditSettings = false,
}: {
  initial?: PropertyPhoto[];
  config: PhotoConfig;
  propertyId?: string;
  onChange?: (photos: PropertyPhoto[]) => void;
  /** Kreator blokuje zapis oferty, dopóki zdjęcia się wgrywają. */
  onBusyChange?: (busy: boolean) => void;
  canEditSettings?: boolean;
}) {
  const [photos, setPhotos] = useState<PropertyPhoto[]>(initial);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const photosRef = useRef(photos);
  const saving = useRef(false);
  const pending = useRef<PropertyPhoto[] | null>(null);
  const live = !!propertyId;
  const busy = progress !== null;

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  /** Zapis w ofercie. Kolejne zmiany w trakcie zapisu łączymy w jeden kolejny zapis. */
  async function persist(list: PropertyPhoto[]) {
    if (!propertyId) return;
    if (saving.current) {
      pending.current = list;
      return;
    }
    saving.current = true;
    setSaveState("saving");
    const res = await savePropertyPhotos(propertyId, list);
    saving.current = false;
    if (!res.ok) {
      setError(res.error ?? "Nie udało się zapisać zdjęć.");
      setSaveState("idle");
    } else {
      setSaveState("saved");
    }
    const next = pending.current;
    pending.current = null;
    if (next) void persist(next);
  }

  function commit(list: PropertyPhoto[], save = true) {
    setPhotos(list);
    photosRef.current = list;
    onChange?.(list);
    if (save) void persist(list);
  }

  async function addFiles(fileList: FileList | File[]) {
    setError(null);
    const all = Array.from(fileList);
    const images = all.filter(
      (f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name),
    );
    const room = MAX_PHOTOS - photosRef.current.length;
    const files = images.slice(0, Math.max(0, room));
    if (files.length === 0) {
      setError(
        room <= 0
          ? `Oferta ma już ${MAX_PHOTOS} zdjęć, to maksimum.`
          : "Wybierz pliki zdjęć (JPEG, PNG albo WEBP).",
      );
      return;
    }

    const perPhoto = config.watermark ? 2 : 1;
    setProgress({ label: "Przygotowuję wgrywanie…", done: 0, total: files.length, fraction: 0 });
    const signed = await signPhotoUploads(files.length * perPhoto);
    if (signed.error) {
      setProgress(null);
      setError(signed.error);
      return;
    }

    const failed: string[] = [];
    let list = photosRef.current;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const step = (f: number) =>
        setProgress({
          label: config.watermark ? "Znak wodny i wysyłka…" : "Wysyłka…",
          done: i,
          total: files.length,
          fraction: (i + f) / files.length,
        });
      try {
        step(0);
        const { original, marked } = await preparePhoto(file, config);
        const upOriginal = signed.uploads[i * perPhoto];
        const upMarked = marked ? signed.uploads[i * perPhoto + 1] : null;

        await uploadToSignedUrl(upOriginal.signedUrl, original.blob, (f) => step(marked ? f * 0.5 : f));
        if (marked && upMarked) {
          await uploadToSignedUrl(upMarked.signedUrl, marked.blob, (f) => step(0.5 + f * 0.5));
        }

        const shown = upMarked ?? upOriginal;
        const photo: PropertyPhoto = {
          path: shown.path,
          url: shown.publicUrl,
          original_path: upOriginal.path,
          original_url: upOriginal.publicUrl,
          export: true,
          print: true,
          width: original.width,
          height: original.height,
        };
        list = [...list, photo];
        commit(list, false); // pokazujemy od razu, zapis na końcu paczki
      } catch {
        failed.push(file.name);
      }
    }

    setProgress(null);
    void persist(list);
    if (failed.length) {
      setError(
        `Nie udało się dodać: ${failed.join(", ")}. Zdjęcia HEIC z iPhone'a otwórz i zapisz jako JPG albo wgraj z Safari.`,
      );
    }
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= photos.length) return;
    const list = [...photos];
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    commit(list);
  }

  function update(i: number, patch: Partial<PropertyPhoto>, save = true) {
    commit(
      photos.map((p, j) => (j === i ? { ...p, ...patch } : p)),
      save,
    );
  }

  async function remove(i: number) {
    const p = photos[i];
    const list = photos.filter((_, j) => j !== i);
    commit(list);
    // W kreatorze oferta jeszcze nie istnieje, więc plik nigdzie nie jest
    // zapisany i od razu go kasujemy. Na karcie robi to zapis oferty.
    if (!live) void discardPhotoUploads([p.path, p.original_path].filter(Boolean) as string[]);
  }

  /**
   * Przerabia zdjęcie od nowa z czystego oryginału: z aktualnym znakiem wodnym
   * i opcjonalnie stemplem. Stary plik ze znakiem przestaje być potrzebny.
   */
  async function rerender(i: number, withStamp: boolean): Promise<PropertyPhoto | null> {
    const p = photosRef.current[i];
    if (!p?.original_url) return null;
    const stamp = withStamp ? config.stamp : null;

    // Bez znaku i bez stempla pokazujemy po prostu czysty oryginał.
    if (!config.watermark && !stamp) {
      return { ...p, path: p.original_path, url: p.original_url, stamp: false };
    }
    const src = await fetch(p.original_url, { mode: "cors" }).then((r) => {
      if (!r.ok) throw new Error("Nie udało się pobrać oryginału zdjęcia.");
      return r.blob();
    });
    const out = await renderPhoto(src, {
      maxWidth: config.maxWidth,
      maxHeight: config.maxHeight,
      watermark: config.watermark,
      stamp,
    });
    const signed = await signPhotoUploads(1);
    if (signed.error || !signed.uploads[0]) throw new Error(signed.error ?? "Brak linku do wgrania.");
    await uploadToSignedUrl(signed.uploads[0].signedUrl, out.blob);
    return { ...p, path: signed.uploads[0].path, url: signed.uploads[0].publicUrl, stamp: !!stamp };
  }

  async function toggleStamp(i: number) {
    setError(null);
    const p = photos[i];
    setProgress({ label: "Nakładam stempel…", done: 0, total: 1, fraction: 0.4 });
    try {
      const next = await rerender(i, !p.stamp);
      if (next) {
        const oldPath = p.path !== p.original_path ? p.path : undefined;
        commit(photosRef.current.map((x, j) => (j === i ? next : x)));
        if (!live && oldPath && oldPath !== next.path) void discardPhotoUploads([oldPath]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się nałożyć stempla.");
    }
    setProgress(null);
  }

  /** Po zmianie znaku wodnego w ustawieniach: przerób wszystkie zdjęcia oferty. */
  async function refreshWatermark() {
    setError(null);
    const total = photosRef.current.length;
    const oldPaths: string[] = [];
    let list = photosRef.current;
    for (let i = 0; i < total; i++) {
      setProgress({ label: "Nakładam aktualny znak wodny…", done: i, total, fraction: i / total });
      try {
        const next = await rerender(i, !!list[i].stamp);
        if (next) {
          if (list[i].path && list[i].path !== list[i].original_path && list[i].path !== next.path) {
            oldPaths.push(list[i].path!);
          }
          list = list.map((x, j) => (j === i ? next : x));
          commit(list, false);
        }
      } catch {
        /* zostaje stara wersja tego zdjęcia */
      }
    }
    setProgress(null);
    void persist(list);
    if (!live && oldPaths.length) void discardPhotoUploads(oldPaths);
  }

  async function downloadAll(clean: boolean) {
    setError(null);
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      const url = clean ? p.original_url ?? p.url : p.url;
      setProgress({ label: "Pobieram zdjęcia…", done: i, total: photos.length, fraction: i / photos.length });
      try {
        await downloadFile(url, `zdjecie-${String(i + 1).padStart(2, "0")}${clean ? "-bez-znaku" : ""}.jpg`);
      } catch {
        setError("Część zdjęć nie pobrała się. Spróbuj ponownie.");
      }
    }
    setProgress(null);
  }

  const canRefresh = photos.some((p) => p.original_url) && !!config.watermark;

  return (
    // @container: liczba kolumn zależy od miejsca, a nie od ekranu. W kreatorze
    // mieszczą się 4 zdjęcia w rzędzie, w węższej kolumnie karty oferty 3.
    <div className="@container space-y-4">
      {/* Strefa wgrywania */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !busy) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDropActive(true);
          }
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setDropActive(false);
          if (!busy) void addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
          dropActive
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/60"
        } ${busy ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {busy ? (
          <>
            <Spinner />
            <p className="text-sm font-medium text-blue-600">{progress.label}</p>
          </>
        ) : (
          <>
            <CloudIcon />
            <p className="text-sm font-medium text-slate-800">
              Przeciągnij zdjęcia tutaj lub kliknij, aby wybrać
            </p>
            <p className="text-xs text-slate-500">
              JPEG, PNG, WEBP · zmniejszamy do {config.maxWidth} × {config.maxHeight}
            </p>
          </>
        )}
      </div>

      {busy && (
        <div className="relative h-7 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-[width] duration-200"
            style={{ width: `${Math.max(4, Math.round(progress.fraction * 100))}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-800">
            {Math.min(progress.done + 1, progress.total)}/{progress.total} · {Math.round(progress.fraction * 100)} %
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {config.watermark ? (
          <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
            Znak wodny biura nakładany automatycznie
          </span>
        ) : (
          <span className="text-slate-500">
            Znak wodny: nie ustawiony.{" "}
            {canEditSettings ? (
              <Link href="/app/ustawienia/znak-wodny" className="font-medium text-blue-600 hover:underline">
                Wgraj go w ustawieniach
              </Link>
            ) : (
              "Poproś CEO o wgranie go w ustawieniach."
            )}
          </span>
        )}
        {live && saveState !== "idle" && (
          <span className="text-slate-400">{saveState === "saving" ? "Zapisuję…" : "Zapisano"}</span>
        )}
        {photos.length > 0 && (
          <span className="ml-auto flex flex-wrap items-center gap-2">
            {canRefresh && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void refreshWatermark()}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Nałóż aktualny znak wodny
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => void downloadAll(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <DownloadIcon /> Pobierz zdjęcia
            </button>
            {photos.some((p) => p.original_url && p.original_url !== p.url) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void downloadAll(true)}
                className="rounded-lg px-2 py-1.5 font-medium text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
              >
                bez znaku wodnego
              </button>
            )}
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {photos.length === 0 ? (
        !busy && <p className="py-2 text-center text-sm text-slate-400">Brak zdjęć</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 @lg:grid-cols-3 @3xl:grid-cols-4">
          {photos.map((p, i) => (
            <li
              key={p.path ?? p.url}
              draggable={!busy}
              onDragStart={(e) => {
                setDragFrom(i);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (dragFrom !== null) e.preventDefault();
              }}
              onDrop={(e) => {
                if (dragFrom === null) return;
                e.preventDefault();
                move(dragFrom, i);
                setDragFrom(null);
              }}
              onDragEnd={() => setDragFrom(null)}
              className={`flex flex-col overflow-hidden rounded-xl border bg-white transition ${
                dragFrom === i ? "border-blue-400 opacity-50" : "border-slate-200"
              }`}
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.caption || `Zdjęcie ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full cursor-grab object-cover active:cursor-grabbing"
                />
                {i === 0 && (
                  <span className="absolute left-2 top-2 rounded-md bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
                    Główne
                  </span>
                )}
                {p.stamp && (
                  <span className="absolute right-2 top-2 rounded-md bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-950 shadow">
                    stempel
                  </span>
                )}
              </div>

              {/* Pasek akcji zawsze widoczny: na telefonie nie ma najechania myszką. */}
              <div className="flex items-center gap-0.5 border-b border-slate-100 px-1.5 py-1">
                <IconBtn label="Przesuń w lewo" disabled={busy || i === 0} onClick={() => move(i, i - 1)}>
                  <ChevronIcon dir="left" />
                </IconBtn>
                <IconBtn
                  label="Przesuń w prawo"
                  disabled={busy || i === photos.length - 1}
                  onClick={() => move(i, i + 1)}
                >
                  <ChevronIcon dir="right" />
                </IconBtn>
                {i !== 0 && (
                  <IconBtn label="Ustaw jako główne" disabled={busy} onClick={() => move(i, 0)}>
                    <StarIcon />
                  </IconBtn>
                )}
                {i === 0 && config.stamp && p.original_url && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void toggleStamp(i)}
                    className={`rounded-md px-1.5 py-1 text-[11px] font-semibold transition disabled:opacity-40 ${
                      p.stamp ? "bg-amber-100 text-amber-800" : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {p.stamp ? "Zdejmij stempel" : "Stempel"}
                  </button>
                )}
                <span className="ml-auto flex">
                  <IconBtn
                    label="Pobierz"
                    disabled={busy}
                    onClick={() => void downloadFile(p.url, `zdjecie-${i + 1}.jpg`).catch(() => setError("Nie udało się pobrać zdjęcia."))}
                  >
                    <DownloadIcon />
                  </IconBtn>
                  <IconBtn label="Usuń zdjęcie" disabled={busy} danger onClick={() => void remove(i)}>
                    <TrashIcon />
                  </IconBtn>
                </span>
              </div>

              <div className="space-y-2 p-2.5">
                <input
                  value={p.caption ?? ""}
                  onChange={(e) => update(i, { caption: e.target.value }, false)}
                  onBlur={() => void persist(photosRef.current)}
                  placeholder="Opis zdjęcia…"
                  maxLength={200}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:italic placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
                />
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {FLAGS.map((f) => {
                    // Eksport i wydruki są domyślnie włączone, reszta wyłączona.
                    const on = f.key === "export" || f.key === "print" ? p[f.key] !== false : !!p[f.key];
                    return (
                      <label key={f.key} className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={busy}
                          onChange={(e) => update(i, { [f.key]: e.target.checked })}
                          className="h-3.5 w-3.5 accent-blue-600"
                        />
                        {f.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {photos.length > 1 && (
        <p className="text-xs text-slate-400">
          Pierwsze zdjęcie jest główne. Kolejność zmienisz strzałkami albo przeciągając zdjęcie.
        </p>
      )}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition disabled:opacity-30 ${
        danger ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="h-6 w-6 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg className="h-9 w-9 text-blue-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.5 19a4.5 4.5 0 0 1-.42-8.98A6 6 0 0 1 17.66 8.5 5 5 0 0 1 17.5 19h-11Zm5.5-9.4-3.7 3.7 1.4 1.4 1.3-1.29V17h2v-3.59l1.3 1.3 1.4-1.42L12 9.6Z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7L12 3Z" />
    </svg>
  );
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}
