"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { extFor, uploadToSignedUrl } from "@/lib/photo-process";
import { setAsset, signAssetUpload } from "./company-actions";

/**
 * Wgrywanie jednego pliku biura: logo, znaku wodnego albo stempla.
 * Plik idzie bez przeróbek, bo logo zwykle jest PNG z przezroczystym tłem
 * i zamiana na JPEG zrobiłaby z niego biały prostokąt.
 */
export function AssetUploader({
  kind,
  label,
  currentUrl,
  checker = false,
  hint,
  disabled = false,
}: {
  kind: "logo" | "watermark" | "stamp";
  label: string;
  currentUrl: string | null;
  /** Szachownica pod podglądem: biały znak wodny na białym tle byłby niewidoczny. */
  checker?: boolean;
  hint?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // SVG tylko dla logo. Znak wodny i stempel rysujemy na zdjęciu w canvasie,
  // a SVG bez zapisanych wymiarów wychodzi tam w złych proporcjach.
  const allowed = kind === "logo" ? /^image\/(png|jpeg|webp|svg\+xml)$/ : /^image\/(png|jpeg|webp)$/;

  async function upload(file: File) {
    setError(null);
    if (!allowed.test(file.type)) {
      setError(kind === "logo" ? "Wybierz plik PNG, JPG, WEBP albo SVG." : "Wybierz plik PNG, JPG albo WEBP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Plik jest większy niż 10 MB.");
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      const signed = await signAssetUpload(kind, extFor(file));
      if (signed.error || !signed.upload) throw new Error(signed.error ?? "Brak linku do wgrania.");
      await uploadToSignedUrl(signed.upload.signedUrl, file, setProgress);
      const res = await setAsset(kind, signed.upload.path);
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się wgrać pliku.");
    }
    setBusy(false);
  }

  async function remove() {
    setError(null);
    setBusy(true);
    const res = await setAsset(kind, null);
    if (!res.ok) setError(res.error);
    else router.refresh();
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <div
        className={`flex h-36 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 p-3 ${
          checker ? "checker-bg" : "bg-slate-50"
        }`}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt={label} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-sm text-slate-400">Brak pliku</span>
        )}
      </div>

      {busy && (
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="shimmer-bar h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 transition-[width]"
            style={{ width: `${Math.max(8, Math.round(progress * 100))}%` }}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={kind === "logo" ? "image/png,image/jpeg,image/webp,image/svg+xml" : "image/png,image/jpeg,image/webp"}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={busy || disabled}
          onClick={() => inputRef.current?.click()}
          className="btn-ink inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0-4 4m4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
          {currentUrl ? "Zmień" : "Wgraj"}
        </button>
        {currentUrl && (
          <button
            type="button"
            disabled={busy || disabled}
            onClick={() => void remove()}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Usuń
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
