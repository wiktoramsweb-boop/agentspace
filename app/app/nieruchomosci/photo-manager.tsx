"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { PhotoConfig } from "@/lib/agency-settings-shared";
import type { PropertyPhoto } from "@/lib/types";
import { MAX_PHOTOS } from "@/lib/property-photos";
import { downloadFile, preparePhoto, renderPhoto, uploadToSignedUrl } from "@/lib/photo-process";
import { discardPhotoUploads, savePropertyPhotos, signPhotoUploads } from "./photo-actions";

/** Zdjęcie w trakcie wgrywania: podgląd z dysku i postęp. */
type Pending = {
  id: string;
  name: string;
  preview: string | null;
  progress: number;
  stage: "kolejka" | "obrobka" | "wysylka" | "blad";
};

/** Krótszy stan na potrzeby paska u góry, np. przy nakładaniu stempla. */
type Task = { label: string; done: number; total: number };

const FLAGS: { key: "export" | "print" | "plan" | "visualization"; label: string; hint: string }[] = [
  { key: "export", label: "Eksport", hint: "Na stronę i portale" },
  { key: "print", label: "Wydruki", hint: "Ofertówka, PDF i maile" },
  { key: "plan", label: "Rzut", hint: "To plan mieszkania" },
  { key: "visualization", label: "Wizualizacja", hint: "Grafika, nie zdjęcie" },
];

const STAGE_LABEL: Record<Pending["stage"], string> = {
  kolejka: "w kolejce",
  obrobka: "obróbka",
  wysylka: "wysyłka",
  blad: "błąd",
};

/**
 * Zdjęcia oferty: wgrywanie ze znakiem wodnym biura, kolejność, zdjęcie główne,
 * opisy i oznaczenia.
 *
 * Dwa tryby:
 * - propertyId podany: każda zmiana od razu zapisuje się w ofercie (karta oferty),
 * - bez propertyId: lista trzymana w pamięci i oddawana przez onChange
 *   (kreator dodawania i edycji, zapis razem z całą ofertą).
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
  const reduceMotion = useReducedMotion();
  const [photos, setPhotos] = useState<PropertyPhoto[]>(initial);
  const [pending, setPending] = useState<Pending[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const photosRef = useRef(photos);
  const saving = useRef(false);
  const queued = useRef<PropertyPhoto[] | null>(null);
  const live = !!propertyId;
  // Kafelek z błędem czeka chwilę na ekranie, ale nie blokuje zapisu oferty.
  const busy = pending.some((p) => p.stage !== "blad") || task !== null;

  // Pliki, które oferta miała przed otwarciem. W kreatorze nie wolno ich
  // kasować od razu - jeśli agent anuluje edycję, zdjęcia muszą zostać.
  const initialFiles = useMemo(
    () => new Set(initial.flatMap((p) => [p.path, p.original_path]).filter(Boolean) as string[]),
    [initial],
  );
  const discardNew = (paths: (string | undefined)[]) => {
    const fresh = paths.filter((p): p is string => !!p && !initialFiles.has(p));
    if (fresh.length) void discardPhotoUploads(fresh);
  };

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
      queued.current = list;
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
    const next = queued.current;
    queued.current = null;
    if (next) void persist(next);
  }

  function commit(list: PropertyPhoto[], save = true) {
    setPhotos(list);
    photosRef.current = list;
    onChange?.(list);
    if (save) void persist(list);
  }

  const patchPending = (id: string, patch: Partial<Pending>) =>
    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  async function addFiles(fileList: FileList | File[]) {
    setError(null);
    const images = Array.from(fileList).filter(
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

    // Kafelki pojawiają się od razu, z podglądem prosto z dysku.
    const batch: Pending[] = files.map((f, i) => ({
      id: `${Date.now()}-${i}`,
      name: f.name,
      preview: /heic|heif/i.test(f.type) ? null : URL.createObjectURL(f),
      progress: 0,
      stage: "kolejka",
    }));
    setPending((prev) => [...prev, ...batch]);

    const perPhoto = config.watermark ? 2 : 1;
    const signed = await signPhotoUploads(files.length * perPhoto);
    if (signed.error) {
      batch.forEach((b) => b.preview && URL.revokeObjectURL(b.preview));
      setPending((prev) => prev.filter((p) => !batch.some((b) => b.id === p.id)));
      setError(signed.error);
      return;
    }

    const failed: string[] = [];
    let list = photosRef.current;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const slot = batch[i];
      try {
        patchPending(slot.id, { stage: "obrobka", progress: 0.05 });
        const { original, marked } = await preparePhoto(file, config);
        const upOriginal = signed.uploads[i * perPhoto];
        const upMarked = marked ? signed.uploads[i * perPhoto + 1] : null;

        patchPending(slot.id, { stage: "wysylka", progress: 0.1 });
        await uploadToSignedUrl(upOriginal.signedUrl, original.blob, (f) =>
          patchPending(slot.id, { progress: 0.1 + f * (marked ? 0.45 : 0.9) }),
        );
        if (marked && upMarked) {
          await uploadToSignedUrl(upMarked.signedUrl, marked.blob, (f) =>
            patchPending(slot.id, { progress: 0.55 + f * 0.45 }),
          );
        }

        const shown = upMarked ?? upOriginal;
        list = [
          ...list,
          {
            path: shown.path,
            url: shown.publicUrl,
            original_path: upOriginal.path,
            original_url: upOriginal.publicUrl,
            export: true,
            print: true,
            width: original.width,
            height: original.height,
          },
        ];
        commit(list, false); // pokazujemy od razu, zapis na końcu paczki
        setPending((prev) => prev.filter((p) => p.id !== slot.id));
        if (slot.preview) URL.revokeObjectURL(slot.preview);
      } catch {
        failed.push(file.name);
        patchPending(slot.id, { stage: "blad" });
      }
    }

    void persist(list);
    if (failed.length) {
      setError(
        `Nie udało się dodać: ${failed.join(", ")}. Zdjęcia HEIC z iPhone'a otwórz i zapisz jako JPG albo wgraj z Safari.`,
      );
      // Kafelki z błędem znikają po chwili, żeby nie wisiały w siatce.
      setTimeout(() => setPending((prev) => prev.filter((p) => p.stage !== "blad")), 4000);
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

  function remove(i: number) {
    const p = photos[i];
    commit(photos.filter((_, j) => j !== i));
    // W kreatorze kasujemy od razu tylko świeżo wgrane pliki. Zdjęcia, które
    // oferta już miała, usuwa zapis oferty - albo zostają, gdy agent anuluje.
    if (!live) discardNew([p.path, p.original_path]);
  }

  /**
   * Przerabia zdjęcie od nowa z czystego oryginału: z aktualnym znakiem wodnym
   * i opcjonalnie stemplem.
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
    setTask({ label: p.stamp ? "Zdejmuję stempel…" : "Nakładam stempel…", done: 0, total: 1 });
    try {
      const next = await rerender(i, !p.stamp);
      if (next) {
        const oldPath = p.path !== p.original_path ? p.path : undefined;
        commit(photosRef.current.map((x, j) => (j === i ? next : x)));
        if (!live && oldPath !== next.path) discardNew([oldPath]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się nałożyć stempla.");
    }
    setTask(null);
  }

  /** Po zmianie znaku wodnego w ustawieniach: przerób wszystkie zdjęcia oferty. */
  async function refreshWatermark() {
    setError(null);
    const total = photosRef.current.length;
    const old: string[] = [];
    let list = photosRef.current;
    for (let i = 0; i < total; i++) {
      setTask({ label: "Nakładam aktualny znak wodny…", done: i, total });
      try {
        const next = await rerender(i, !!list[i].stamp);
        if (next) {
          const prev = list[i];
          if (prev.path && prev.path !== prev.original_path && prev.path !== next.path) old.push(prev.path);
          list = list.map((x, j) => (j === i ? next : x));
          commit(list, false);
        }
      } catch {
        /* zostaje stara wersja tego zdjęcia */
      }
    }
    setTask(null);
    void persist(list);
    if (!live) discardNew(old);
  }

  async function downloadAll(clean: boolean) {
    setError(null);
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      setTask({ label: "Pobieram zdjęcia…", done: i, total: photos.length });
      try {
        await downloadFile(
          clean ? p.original_url ?? p.url : p.url,
          `zdjecie-${String(i + 1).padStart(2, "0")}${clean ? "-bez-znaku" : ""}.jpg`,
        );
      } catch {
        setError("Część zdjęć nie pobrała się. Spróbuj ponownie.");
      }
    }
    setTask(null);
  }

  const canRefresh = photos.some((p) => p.original_url) && !!config.watermark;
  const doneCount = pending.filter((p) => p.stage !== "kolejka" && p.stage !== "blad").length;
  const overall = pending.length
    ? pending.reduce((a, p) => a + (p.stage === "blad" ? 1 : p.progress), 0) / pending.length
    : 0;
  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 34 };

  return (
    // @container: liczba kolumn zależy od miejsca, a nie od ekranu. W kreatorze
    // mieszczą się 4 zdjęcia w rzędzie, w węższej kolumnie karty oferty 3.
    <div className="@container space-y-4">
      {/* ── Strefa wgrywania ─────────────────────────────── */}
      <motion.div
        animate={dropActive && !reduceMotion ? { scale: 1.01 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className={`rounded-3xl bg-gradient-to-br p-[1.5px] transition-shadow ${
          dropActive
            ? "from-emerald-400 via-teal-400 to-cyan-400 shadow-xl shadow-emerald-500/20"
            : "from-emerald-200 via-slate-200 to-teal-200"
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label="Dodaj zdjęcia"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
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
            void addFiles(e.dataTransfer.files);
          }}
          className={`group relative flex cursor-pointer items-center gap-5 overflow-hidden rounded-[calc(1.5rem-1.5px)] px-6 py-6 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:py-7 ${
            dropActive ? "bg-emerald-50" : "bg-white hover:bg-emerald-50/40"
          }`}
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
          <PhotoStackIcon active={dropActive} />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">
              {dropActive ? "Puść, a zajmiemy się resztą" : "Upuść zdjęcia albo wybierz z dysku"}
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              Zmniejszymy je do {config.maxWidth} × {config.maxHeight}
              {config.watermark ? " i nałożymy znak wodny biura" : ""}. Możesz dodać kilka naraz.
            </p>
          </div>
          <span className="btn-ink ml-auto hidden flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition sm:inline-block">
            Wybierz zdjęcia
          </span>
        </div>
      </motion.div>

      {/* ── Pasek stanu ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
        {config.watermark ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Znak wodny włączony
          </span>
        ) : (
          <span className="text-slate-500">
            Znak wodny nie jest ustawiony.{" "}
            {canEditSettings ? (
              <Link href="/app/ustawienia/znak-wodny" className="font-medium text-emerald-700 hover:underline">
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
          <span className="ml-auto flex flex-wrap items-center gap-1.5">
            {canRefresh && (
              <GhostBtn disabled={busy} onClick={() => void refreshWatermark()}>
                Nałóż aktualny znak
              </GhostBtn>
            )}
            <GhostBtn disabled={busy} onClick={() => void downloadAll(false)}>
              <DownloadIcon /> Pobierz wszystkie
            </GhostBtn>
            {photos.some((p) => p.original_url && p.original_url !== p.url) && (
              <GhostBtn disabled={busy} onClick={() => void downloadAll(true)} subtle>
                bez znaku
              </GhostBtn>
            )}
          </span>
        )}
      </div>

      <AnimatePresence>
        {(pending.length > 0 || task) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-white"
          >
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium">
                {task ? task.label : `Wgrywam zdjęcia: ${Math.min(doneCount + 1, pending.length)} z ${pending.length}`}
              </span>
              <span className="tabular-nums text-white/60">
                {task
                  ? `${Math.min(task.done + 1, task.total)}/${task.total}`
                  : `${Math.round(overall * 100)}%`}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="shimmer-bar h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300"
                initial={false}
                animate={{ width: `${Math.max(6, (task ? (task.done + 0.5) / task.total : overall) * 100)}%` }}
                transition={{ ease: "easeOut", duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* ── Siatka zdjęć ─────────────────────────────────── */}
      {photos.length === 0 && pending.length === 0 ? (
        <p className="py-2 text-center text-sm text-slate-400">
          Oferta nie ma jeszcze zdjęć. Pierwsze dodane będzie zdjęciem głównym.
        </p>
      ) : (
        <motion.ul layout={!reduceMotion} className="grid grid-cols-2 gap-3 @lg:grid-cols-3 @3xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {photos.map((p, i) => (
              <motion.li
                key={p.path ?? p.url}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                transition={spring}
                // Natywne przeciąganie HTML5 (warianty Capture), bo onDragStart
                // w motion oznacza własny gest przesuwania, a nie drag and drop.
                draggable={!busy}
                onDragStartCapture={(e: React.DragEvent) => {
                  setDragFrom(i);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOverCapture={(e: React.DragEvent) => {
                  if (dragFrom !== null) e.preventDefault();
                }}
                onDropCapture={(e: React.DragEvent) => {
                  if (dragFrom === null) return;
                  e.preventDefault();
                  move(dragFrom, i);
                  setDragFrom(null);
                }}
                onDragEndCapture={() => setDragFrom(null)}
                className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
                  i === 0 ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200"
                } ${dragFrom === i ? "opacity-40" : ""}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.caption || `Zdjęcie ${i + 1}`}
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full cursor-grab object-cover transition duration-500 group-hover:scale-[1.04] active:cursor-grabbing"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />

                  {i === 0 ? (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
                      <StarIcon filled /> Główne
                    </span>
                  ) : (
                    <span className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur">
                      {i + 1}
                    </span>
                  )}
                  {p.stamp && (
                    <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-950 shadow">
                      stempel
                    </span>
                  )}

                  {/* Akcje na szklanym pasku. Na dotyku widoczne zawsze, na myszy po najechaniu. */}
                  <div className="absolute inset-x-2 bottom-2 flex items-center gap-0.5 rounded-full bg-white/15 p-0.5 backdrop-blur-md transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <GlassBtn label="Przesuń w lewo" disabled={busy || i === 0} onClick={() => move(i, i - 1)}>
                      <ChevronIcon dir="left" />
                    </GlassBtn>
                    <GlassBtn label="Przesuń w prawo" disabled={busy || i === photos.length - 1} onClick={() => move(i, i + 1)}>
                      <ChevronIcon dir="right" />
                    </GlassBtn>
                    {i !== 0 && (
                      <GlassBtn label="Ustaw jako główne" disabled={busy} onClick={() => move(i, 0)}>
                        <StarIcon />
                      </GlassBtn>
                    )}
                    <span className="ml-auto flex">
                      <GlassBtn
                        label="Pobierz"
                        disabled={busy}
                        onClick={() =>
                          void downloadFile(p.url, `zdjecie-${i + 1}.jpg`).catch(() =>
                            setError("Nie udało się pobrać zdjęcia."),
                          )
                        }
                      >
                        <DownloadIcon />
                      </GlassBtn>
                      <GlassBtn label="Usuń zdjęcie" disabled={busy} danger onClick={() => remove(i)}>
                        <TrashIcon />
                      </GlassBtn>
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 p-3">
                  <input
                    value={p.caption ?? ""}
                    onChange={(e) => update(i, { caption: e.target.value }, false)}
                    onBlur={() => void persist(photosRef.current)}
                    placeholder="Dodaj opis, np. salon z aneksem"
                    maxLength={200}
                    className="w-full border-0 border-b border-transparent bg-transparent px-0 py-1 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-200 focus:border-emerald-400 focus:outline-none focus:ring-0"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {FLAGS.map((f) => {
                      // Eksport i wydruki są domyślnie włączone, reszta wyłączona.
                      const on = f.key === "export" || f.key === "print" ? p[f.key] !== false : !!p[f.key];
                      return (
                        <button
                          key={f.key}
                          type="button"
                          title={f.hint}
                          aria-pressed={on}
                          disabled={busy}
                          onClick={() => update(i, { [f.key]: !on })}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
                            on
                              ? "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-300"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                    {i === 0 && config.stamp && p.original_url && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void toggleStamp(i)}
                        aria-pressed={!!p.stamp}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
                          p.stamp
                            ? "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-300"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {p.stamp ? "Stempel ✓" : "+ Stempel"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}

            {pending.map((u) => (
              <motion.li
                key={u.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={spring}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                  {u.preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.preview} alt="" className="h-full w-full scale-105 object-cover blur-[2px] brightness-75" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                    <ProgressRing value={u.progress} error={u.stage === "blad"} waiting={u.stage === "kolejka"} />
                    <span className="rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                      {STAGE_LABEL[u.stage]}
                    </span>
                  </div>
                </div>
                <p className="truncate px-3 py-2.5 text-xs text-slate-500">{u.name}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      {photos.length > 1 && (
        <p className="text-xs text-slate-400">
          Pierwsze zdjęcie jest główne. Kolejność zmienisz strzałkami, gwiazdką albo przeciągając zdjęcie.
        </p>
      )}
    </div>
  );
}

/** Okrągły licznik postępu jednego zdjęcia. */
function ProgressRing({ value, error, waiting }: { value: number; error: boolean; waiting: boolean }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <svg className={`absolute inset-0 -rotate-90 ${waiting ? "animate-spin [animation-duration:2.4s]" : ""}`} viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={error ? "#f87171" : "#34d399"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={waiting ? c * 0.75 : c * (1 - Math.min(1, value))}
          style={{ transition: "stroke-dashoffset 250ms ease-out" }}
        />
      </svg>
      <span className="text-[11px] font-semibold tabular-nums text-white">
        {error ? "!" : waiting ? "" : `${Math.round(value * 100)}%`}
      </span>
    </div>
  );
}

function GlassBtn({
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
      className={`flex h-7 w-7 items-center justify-center rounded-full text-white transition disabled:opacity-30 ${
        danger ? "hover:bg-red-500/80" : "hover:bg-white/25"
      }`}
    >
      {children}
    </button>
  );
}

function GhostBtn({
  onClick,
  disabled,
  subtle,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  subtle?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition disabled:opacity-50 ${
        subtle ? "text-slate-500 hover:text-slate-900" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

/** Stos zdjęć z lekkim „oddechem" - rozchyla się, gdy agent przeciąga pliki. */
function PhotoStackIcon({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center" aria-hidden="true">
      <motion.span
        className="absolute h-11 w-11 rounded-xl bg-teal-200"
        animate={{ rotate: active ? -16 : -9, x: active ? -5 : -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
      />
      <motion.span
        className="absolute h-11 w-11 rounded-xl bg-emerald-300"
        animate={{ rotate: active ? 12 : 6, x: active ? 5 : 2 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
      />
      <motion.span
        className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
        animate={{ y: active ? -3 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V6m0 0-4 4m4-4 4 4M5 19h14" />
        </svg>
      </motion.span>
    </span>
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

function StarIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg className="h-3.5 w-3.5" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
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
