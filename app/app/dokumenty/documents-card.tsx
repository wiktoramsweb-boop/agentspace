"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { uploadToSignedUrl } from "@/lib/photo-process";
import {
  docKindLabel,
  docKinds,
  fileBadge,
  formatBytes,
  guessDocKind,
  type DocEntity,
  type DocumentItem,
} from "@/lib/documents-shared";
import { formatDatePL } from "@/lib/datetime";
import { deleteDocument, getDocumentUrl, registerDocuments, signDocumentUploads, updateDocumentKind } from "./actions";

type Pending = { id: string; name: string; progress: number; failed?: boolean };

/** Dokumenty, które powinny być przy każdej ofercie, zanim trafi do ogłoszenia. */
const PROPERTY_ESSENTIALS = ["umowa_posrednictwa", "kw", "swiadectwo"];

const BADGE_COLOR: Record<string, string> = {
  PDF: "bg-red-500",
  JPG: "bg-sky-500",
  PNG: "bg-sky-500",
  DOC: "bg-indigo-500",
  XLS: "bg-emerald-600",
};

/**
 * Dokumenty przy ofercie albo kliencie: umowy, KW, rzuty, skany.
 * Pliki trafiają do prywatnego magazynu; otwiera się je przez link ważny
 * dwie minuty, wydany po sprawdzeniu, że pytający jest z tego biura.
 */
export function DocumentsCard({
  entity,
  entityId,
  initial,
  ready,
}: {
  entity: DocEntity;
  entityId: string;
  initial: DocumentItem[];
  ready: boolean;
}) {
  const reduce = useReducedMotion();
  const [docs, setDocs] = useState(initial);
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [drop, setDrop] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const kinds = docKinds(entity);

  const missing =
    entity === "property"
      ? PROPERTY_ESSENTIALS.filter((k) => !docs.some((d) => d.kind === k))
      : [];

  async function addFiles(list: FileList | File[]) {
    setError(null);
    const files = Array.from(list);
    if (!files.length) return;
    const batch = files.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, progress: 0 }));
    setPending((p) => [...p, ...batch]);

    const signed = await signDocumentUploads(
      entity,
      entityId,
      files.map((f) => ({ name: f.name, size: f.size })),
    );
    if (!signed.ok) {
      setPending((p) => p.filter((x) => !batch.some((b) => b.id === x.id)));
      setError(signed.error);
      return;
    }

    const done: { path: string; name: string; size: number; mime: string; kind: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const slot = batch[i];
      try {
        await uploadToSignedUrl(signed.uploads[i].signedUrl, f, (fr) =>
          setPending((p) => p.map((x) => (x.id === slot.id ? { ...x, progress: fr } : x))),
        );
        done.push({
          path: signed.uploads[i].path,
          name: f.name,
          size: f.size,
          mime: f.type || "application/octet-stream",
          kind: guessDocKind(entity, f.name),
        });
      } catch {
        setPending((p) => p.map((x) => (x.id === slot.id ? { ...x, failed: true } : x)));
      }
    }

    if (done.length) {
      const res = await registerDocuments(entity, entityId, done);
      if (res.ok) setDocs((d) => [...res.docs, ...d]);
      else setError(res.error);
    }
    setPending((p) => p.filter((x) => !batch.some((b) => b.id === x.id) || x.failed));
    setTimeout(() => setPending((p) => p.filter((x) => !x.failed)), 4000);
    if (done.length < files.length) setError("Część plików się nie wgrała. Sprawdź połączenie i spróbuj ponownie.");
  }

  async function open(doc: DocumentItem, inline: boolean) {
    // Okno otwieramy od razu, zanim serwer odpowie - inaczej Safari zablokuje je jako wyskakujące.
    const w = inline ? window.open("", "_blank") : null;
    const res = await getDocumentUrl(doc.id, inline);
    if (!res.ok) {
      w?.close();
      setError(res.error);
      return;
    }
    if (w) w.location.href = res.url;
    else window.location.href = res.url;
  }

  async function changeKind(doc: DocumentItem, kind: string) {
    setDocs((d) => d.map((x) => (x.id === doc.id ? { ...x, kind } : x)));
    const res = await updateDocumentKind(doc.id, kind);
    if (!res.ok) {
      setDocs((d) => d.map((x) => (x.id === doc.id ? { ...x, kind: doc.kind } : x)));
      setError(res.error);
    }
  }

  async function remove(doc: DocumentItem) {
    setConfirmId(null);
    setDocs((d) => d.filter((x) => x.id !== doc.id));
    const res = await deleteDocument(doc.id);
    if (!res.ok) {
      setDocs((d) => [doc, ...d]);
      setError(res.error);
    }
  }

  if (!ready) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Dokumenty czekają na jeden krok</p>
        <p className="mt-1">
          Uruchom w Supabase (SQL Editor) plik{" "}
          <code className="rounded bg-amber-100 px-1">lib/SETUP-v23-dokumenty-korespondencja.sql</code>.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative space-y-3"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDrop(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrop(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDrop(false);
        void addFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.odt,.ods,.txt"
        onChange={(e) => {
          if (e.target.files) void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {missing.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500">Brakuje:</span>
          {missing.map((k) => (
            <span key={k} className="rounded-full border border-dashed border-amber-400 bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
              {docKindLabel(entity, k)}
            </span>
          ))}
        </div>
      )}

      {docs.length === 0 && pending.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-6 text-center transition hover:border-emerald-300 hover:bg-emerald-50/40"
        >
          <FolderIcon />
          <span className="text-sm font-medium text-slate-800">Upuść dokumenty albo wybierz z dysku</span>
          <span className="text-xs text-slate-500">PDF, skany, Word, Excel · do 25 MB · rodzaj rozpoznamy po nazwie</span>
        </button>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {pending.map((p) => (
              <motion.li
                key={p.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-200 text-[10px] font-bold text-slate-500">
                  {fileBadge(p.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{p.name}</p>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-[width] ${p.failed ? "bg-red-400" : "shimmer-bar bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300"}`}
                      style={{ width: `${p.failed ? 100 : Math.max(6, p.progress * 100)}%` }}
                    />
                  </div>
                </div>
                {p.failed && <span className="text-xs font-medium text-red-600">błąd</span>}
              </motion.li>
            ))}

            {docs.map((d) => {
              const badge = fileBadge(d.name, d.mime);
              return (
                <motion.li
                  key={d.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: 20 }}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => void open(d, true)}
                    title="Otwórz podgląd"
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white shadow-sm transition group-hover:scale-105 ${BADGE_COLOR[badge] ?? "bg-slate-500"}`}
                  >
                    {badge}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => void open(d, true)}
                      className="block max-w-full truncate text-left text-sm font-medium text-slate-900 hover:text-emerald-700"
                    >
                      {d.name}
                    </button>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <select
                        value={d.kind}
                        onChange={(e) => void changeKind(d, e.target.value)}
                        aria-label="Rodzaj dokumentu"
                        className="w-auto max-w-[13rem] truncate rounded-full border-0 bg-slate-100 py-0.5 pl-2 pr-6 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-400"
                      >
                        {kinds.map((k) => (
                          <option key={k.value} value={k.value}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                      <span>{formatBytes(d.size_bytes)}</span>
                      <span>· {formatDatePL(d.created_at)}</span>
                      {d.uploaderName && <span className="hidden sm:inline">· {d.uploaderName}</span>}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-0.5">
                    {confirmId === d.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void remove(d)}
                          className="rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                        >
                          Usuń
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-slate-900"
                        >
                          Nie
                        </button>
                      </>
                    ) : (
                      <>
                        <IconBtn label="Pobierz" onClick={() => void open(d, false)}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                        </IconBtn>
                        <IconBtn label="Usuń" danger onClick={() => setConfirmId(d.id)}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                        </IconBtn>
                      </>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {(docs.length > 0 || pending.length > 0) && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700"
        >
          + Dodaj dokumenty
        </button>
      )}

      {error && <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <AnimatePresence>
        {drop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute -inset-2 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/90"
          >
            <span className="text-sm font-semibold text-emerald-800">Puść, żeby dodać dokumenty</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
        danger ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

function FolderIcon() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600" aria-hidden="true">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.06-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.38a1.5 1.5 0 0 1-1.06-.44Z" />
      </svg>
    </span>
  );
}
